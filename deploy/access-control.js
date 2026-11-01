// PIN login is verified by the server. Tokens stay in memory: reopening the
// application always asks for a PIN. Staff never use the admin's table API.
const access = {
  session: null, actor: null, pin: "", loading: false, error: "", refresh: null, generation: 0,
  accounts: [], accountsLoading: false, accountsError: "", formOpen: false,
  stockRequest: null, stockRefreshAt: 0, stockRefreshError: "",
  form: { id: null, name: "", pin: "", active: true, timer: false, permissions: {} }, saving: false,
};
const ACCESS_RIGHTS = [
  ["input_stock", "Input stok", "inventory_2"], ["input_sales", "Input penjualan", "point_of_sale"],
  ["input_refill", "Input refill stok", "inventory"],
  ["view_stock", "Lihat stok", "visibility"], ["view_sales", "Lihat penjualan", "receipt_long"],
];
function isAccessAdmin() { return access.actor?.role === "admin"; }
function isAccessStaff() { return access.actor?.role === "staff"; }
function hasAccessSession() { return Boolean(access.session && access.actor); }
function tenantRights() { return access.actor?.tenants?.find((tenant) => tenant.id === currentTenant.id)?.permissions || {}; }
function canAccess(right) { return isAccessAdmin() || Boolean(right === "timer" ? access.actor?.timer : tenantRights()[right]); }

async function accessToken() {
  if (!access.session) throw Error("Masukkan PIN untuk membuka aplikasi.");
  if (access.session.expires_at * 1000 > Date.now() + 30000) return access.session.access_token;
  if (!access.refresh) access.refresh = (async () => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST", headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: access.session.refresh_token }), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Error("Sesi berakhir. Masukkan PIN kembali.");
    access.session = await response.json();
    if (!access.session.expires_at) access.session.expires_at = Math.floor(Date.now() / 1000) + access.session.expires_in;
  })().catch((error) => { clearAccessSession(error.message); throw error; }).finally(() => { access.refresh = null; });
  await access.refresh;
  return access.session.access_token;
}

async function loginAccess() {
  if (access.loading) return;
  if (!/^\d{4,6}$/.test(access.pin)) { access.error = "Masukkan PIN 4 sampai 6 angka."; render(); return; }
  const pin = access.pin;
  access.loading = true; access.error = ""; render();
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pizzain-pin-login`, {
      method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ pin }), signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.message || "Belum bisa masuk. Coba lagi.");
    access.session = result;
    access.generation += 1;
    access.actor = await dbRequest("rpc/doko_access_me", { method: "POST", body: {} });
    access.pin = "";
    store.adminUnlocked = isAccessAdmin();
    store.tenantResolved = false;
    if (isAccessAdmin()) {
      // A fresh admin login starts from the overview, including when the URL
      // still points to the tenant or menu used before logging out.
      store.adminView = "dashboard";
      store.tenantSelection = "all";
      history.replaceState({}, "", "/view?tenant=all");
    }
    await initializeDatabase();
  } catch (error) {
    clearAccessSession(error.name === "TimeoutError" ? "Koneksi terlalu lama. Coba masuk lagi." : getErrorMessage(error));
  } finally { access.loading = false; render(); }
}

function clearAccessSession(message = "") {
  access.generation += 1;
  store.tenants.forEach((tenant) => { try { localStorage.removeItem(`${tenant.data_app_id}:daily_expenses`); } catch {} });
  access.session = null; access.actor = null; access.pin = ""; access.error = message;
  access.accounts = []; access.accountsLoading = false; access.accountsError = ""; access.formOpen = false;
  access.stockRequest = null; access.stockRefreshAt = 0; access.stockRefreshError = "";
  access.form = { id: null, name: "", pin: "", active: true, timer: false, permissions: {} };
  store.adminUnlocked = false; store.dbReady = false; store.tenantResolved = false;
  store.dbLoading = false; store.dailyEditUnlocked = {sales:false,stock:false};
  store.tenants = []; store.tenantSelection = "";
  store.records = {}; store.pizzas = []; store.attendance = {}; store.dailyExpenses = {}; store.combinedTenants = [];
  store.cashReports = {};
  store.staffFeePerSlice = null;
  store.inputDraft = { sales: {}, stock: {}, refill: {} }; store.dailySubmitted = {};
  store.inputDate = ""; store.inputDraftDate = ""; store.inputDrafts = {};
  store.adminEdit = { type: null, date: null, values: {}, saving: false };
  store.staffForm = emptyStaffForm(); store.staffFormOpen = false;
  store.expenseForm = { note: "", amount: "" }; store.attendancePhotoPreview = null;
  photoDataCache.clear();
  render();
}

function logoutAccess() {
  if (store.pendingWrites || store.submitLoading || access.saving) { showToast("Tunggu penyimpanan selesai.", "error"); return; }
  const token = access.session?.access_token;
  clearAccessSession();
  if (token) fetch(`${SUPABASE_URL}/rest/v1/rpc/doko_access_logout`, {
    method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}", signal: AbortSignal.timeout(8000),
  }).catch(() => {});
}

function renderAccessLogin() {
  return `<main class="main narrow admin-pin-screen"><section class="panel admin-pin-card access-login-card">
    <span class="brand-mark"><img src="/assets/logo-pizzain-apk.jpg" alt="Pizzain Tenant" /></span>
    <h2>Pizzain Tenant</h2><p class="pin-help">Masukkan PIN untuk membuka aplikasi</p>
    <input id="access-pin" class="access-pin-input" data-access-pin type="password" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="••••" value="${escapeHtml(access.pin)}" aria-label="PIN Anda" ${access.loading ? "disabled" : ""} />
    <button class="btn full" type="button" data-access-login ${access.loading ? "disabled" : ""}>${access.loading ? '<span class="spinner"></span>Memeriksa PIN...' : '<span class="material-symbols-outlined">lock_open</span>Masuk'}</button>
    ${access.error ? `<p class="tenant-error" role="alert">${escapeHtml(access.error)}</p>` : ""}
    <small class="access-login-help">Akses mengikuti izin yang diberikan admin.</small>
  </section></main>`;
}

async function loadStaffWorkspace() {
  const generation = access.generation;
  const tenantId = currentTenant.id;
  store.records = {}; store.pizzas = []; store.dailyExpenses = {}; store.attendance = {}; store.dailySubmitted = {};
  store.cashReports = {};
  store.inputDraft = { sales: {}, stock: {}, refill: {} }; store.ownerFee = 0;
  store.ownerFeeMode = "fixed"; store.ownerFeePercent = 0; store.ownerFeeDraft = null;
  store.staffFeePerSlice = null;
  if (!store.tenants.length) { store.inputPage = "timer"; return; }
  const result = await dbRequest("rpc/doko_access_workspace", { method: "POST", body: { p_tenant_id: currentTenant.id } });
  if (generation !== access.generation || tenantId !== currentTenant.id) throw Error("Sesi telah berubah.");
  applyStaffWorkspace(result);
  resetInputDraftDates();
  ensureStaffPage();
}

function applyStaffWorkspace(result) {
  store.records = {}; store.dailySubmitted = {};
  store.cashReports = Object.fromEntries((result.cash_reports || []).map(row => [row.record_date,row]));
  store.pizzas = result.pizzas.map((pizza) => ({ ...pizza, cost: 0, price: Number(pizza.price) || 0,
    packSize: Number(pizza.pack_size) || 0, packPrice: Number(pizza.pack_price) || 0, image: pizza.image || PIZZA_IMAGES.veggie }));
  result.records.forEach((row) => {
    const stock = splitStockPayload(row.stock);
    store.records[row.record_date] = { sales: splitSalesPayload(row.sales).total, salesDetail: row.sales_detail || {}, stock: stock.stock, refill: row.refill || stock.refill, stockBalance: row.stock_balance };
    store.dailySubmitted[row.record_date] = {
      sales: Object.hasOwn(row.sales || {}, "__submitted") ? row.sales.__submitted === true : Object.keys(store.records[row.record_date].sales).length > 0,
      stock: row.stock?.__submitted === true || Object.keys(stock.stock).length > 0,
    };
  });
  access.stockRefreshAt = Date.now(); access.stockRefreshError = "";
}

function refreshStaffStock(force = false, afterWrite = false) {
  if (!isAccessStaff() || !hasAccessSession() || !store.tenantResolved || !canAccess("view_stock") || store.dbLoading || (store.submitLoading && !afterWrite) || store.pendingWrites) return Promise.resolve(false);
  if (!force && (store.inputPage !== "view_stock" || document.visibilityState === "hidden" || Date.now() - access.stockRefreshAt < 5000)) return Promise.resolve(false);
  const generation = access.generation, tenantId = currentTenant.id;
  if (access.stockRequest?.generation === generation && access.stockRequest?.tenantId === tenantId) {
    return afterWrite ? access.stockRequest.promise.then(() => refreshStaffStock(true, true)) : access.stockRequest.promise;
  }
  const task = { generation, tenantId, promise: null };
  access.stockRequest = task; access.stockRefreshAt = Date.now();
  const stillCurrent = () => generation === access.generation && tenantId === currentTenant.id && isAccessStaff();
  task.promise = (async () => {
    try {
      const result = await dbRequest("rpc/doko_access_workspace", { method: "POST", body: { p_tenant_id: tenantId } });
      if (!stillCurrent()) return false;
      if (!afterWrite && (store.submitLoading || store.pendingWrites)) return false;
      applyStaffWorkspace(result);
      render();
      return true;
    } catch (error) {
      if (stillCurrent()) { access.stockRefreshError = "Stok belum berhasil diperbarui. Menampilkan data terakhir."; render(); }
      return false;
    } finally { if (access.stockRequest === task) access.stockRequest = null; }
  })();
  return task.promise;
}

function staffStockSnapshot(date) {
  const lastDate = Object.keys(store.records).filter(day => day <= date && store.records[day].stockBalance && typeof store.records[day].stockBalance === "object").sort().pop();
  if (lastDate) return store.records[lastDate].stockBalance;
  return store.records[date]?.stock || {};
}

function staffPages() {
  return [
    ["sales", "input_sales", "point_of_sale", "Input penjualan"],
    ["stock", "input_stock", "inventory_2", "Input stok"],
    ["refill", "input_refill", "inventory", "Refill stok"],
    ["timer", "timer", "timer", "Timer"],
    ["view_sales", "view_sales", "receipt_long", "Lihat penjualan"],
    ["view_stock", "view_stock", "visibility", "Lihat stok"],
  ].filter(([, right]) => canAccess(right));
}
function ensureStaffPage() {
  const pages = staffPages();
  if (!pages.some(([page]) => page === store.inputPage)) store.inputPage = pages[0]?.[0] || "none";
}

function showStaffSalesReceipt() {
  return isAccessStaff() && store.inputPage === "sales" && isSalesSubmitted(inputRecordDate()) && !store.dailyEditUnlocked.sales && !store.submitLoading;
}

function renderStaffSalesReceipt() {
  const date = inputRecordDate(), record = store.records[date] || {};
  const rows = Object.entries(record.sales || {}).filter(([,qty]) => Number(qty) > 0).map(([id,qty]) => {
    const pizza = store.pizzas.find(item => item.id === id) || { id, name: id };
    const detail = record.salesDetail?.[id] || {};
    const packs = Number(detail.packs) || 0, size = Number(detail.pack_size || pizza.packSize) || 0;
    return { pizza, qty: Number(qty), description: packs ? `${packs} loyang · ${Math.max(0,qty-packs*size)} slice` : "" };
  });
  const total = rows.reduce((sum,row) => sum + row.qty,0);
  return `<section class="panel staff-sales-receipt" aria-label="Rekap penjualan terkirim">
    <header class="staff-receipt-heading"><span class="staff-receipt-check material-symbols-outlined" aria-hidden="true">task_alt</span><div><span class="staff-receipt-status">TERSIMPAN</span><h3>Rekap Penjualan</h3></div></header>
    <p class="staff-receipt-meta">${escapeHtml(tenantLabel())}<span>·</span>${formatDate(date)}</p>
    <div class="staff-receipt-total"><div><span>Total terjual</span><strong>${total}<small>slice</small></strong></div><span class="material-symbols-outlined" aria-hidden="true">receipt_long</span></div>
    <div class="staff-receipt-list">${rows.map(({pizza,qty,description}) => `<div class="staff-receipt-row"><span class="access-read-product-icon" aria-hidden="true">${escapeHtml(getInitials(pizza.name))}</span><div><strong>${escapeHtml(pizza.name)}</strong>${description ? `<small>${escapeHtml(description)}</small>` : ""}</div><span class="staff-receipt-qty">${qty}<small>slice</small></span></div>`).join("") || '<p class="staff-receipt-empty">Penjualan tersimpan dengan jumlah 0 slice.</p>'}</div>
    ${canInputCash() ? renderPutraCashReceipt(store.cashReports[date]) : ""}
    <div class="staff-receipt-actions"><button class="btn secondary full" type="button" data-edit-staff-sales><span class="material-symbols-outlined" aria-hidden="true">edit</span>Edit Penjualan</button>${canAccess("input_stock") ? '<button class="staff-receipt-next" type="button" data-input-page="stock">Lanjut input stok<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>' : ''}</div>
  </section>`;
}

function editStaffSales(cancel = false) {
  if (!isAccessStaff() || !canAccess("input_sales") || store.submitLoading || store.dbLoading) return;
  syncInputDate();
  const date = inputRecordDate(), record = store.records[date];
  if (!isSalesSubmitted(date) || !record) return;
  store.inputDraft.sales = { ...record.sales };
  store.inputDraft.packs = salesPackCounts(record.salesDetail);
  store.inputDraft.cash = cashDraft(store.cashReports[date]);
  store.dailyEditUnlocked.sales = !cancel;
  store.inputPage = "sales";
  render();
}

function canInputCash() {
  return isAccessStaff() && access.actor?.cash_reporting === true && canAccess("input_sales");
}

function cashDraft(report) {
  return { opening_cash: report?.opening_cash == null ? "" : String(report.opening_cash), closing_cash: report?.closing_cash == null ? "" : String(report.closing_cash), qris: report?.qris == null ? "" : String(report.qris), expenses: (report?.expenses || []).map(row => ({note:row.note,amount:String(row.amount)})) };
}
function cashExpenseTotal(report) { return (report?.expenses || []).reduce((sum,row) => sum + (Number(row.amount) || 0),0); }
function collectCashPayload(draft) {
  const money = (value,label,minimum=0) => {
    if (!/^\d+$/.test(String(value ?? "")) || !Number.isSafeInteger(Number(value)) || Number(value)<minimum || Number(value)>1000000000) throw new Error(`Isi ${label} dengan nominal yang valid${minimum ? " lebih dari 0" : "; isi 0 bila tidak ada"}.`);
    return Number(value);
  };
  const result = {opening_cash:money(draft?.opening_cash,"kas awal"),closing_cash:money(draft?.closing_cash,"kas akhir"),qris:money(draft?.qris,"QRIS"),expenses:[]};
  if (!Array.isArray(draft?.expenses) || draft.expenses.length>50) throw new Error("Maksimal 50 pengeluaran per hari.");
  result.expenses = draft.expenses.map(row => {
    const note = String(row.note || "").trim();
    if (!note || note.length>200) throw new Error("Isi keterangan setiap pengeluaran (maksimal 200 karakter).");
    return {note,amount:money(row.amount,"pengeluaran",1)};
  });
  if(cashExpenseTotal(result)>1000000000) throw new Error("Total pengeluaran melebihi batas nominal.");
  return result;
}
function renderPutraCashForm() {
  const draft = store.inputDraft.cash || cashDraft();
  const disabled = store.submitLoading || isDraftLocked("sales") ? "disabled" : "";
  return `<section class="panel cash-form" aria-label="Kas harian"><div class="cash-heading"><span class="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span><div><h3>Kas Harian</h3><p>Isi nominal tunai dan QRIS hari ini.</p></div></div><div class="cash-fields">${[["opening_cash","Kas awal"],["closing_cash","Kas akhir"],["qris","QRIS"]].map(([key,label]) => `<label>${label}<span class="cash-money"><span>Rp</span><input aria-label="${label}" data-cash-field="${key}" type="text" inputmode="numeric" maxlength="10" placeholder="0" value="${escapeHtml(draft[key])}" ${disabled}></span></label>`).join("")}</div><div class="cash-expense-heading"><h4>Pengeluaran</h4><button class="cash-add" type="button" data-add-cash-expense ${disabled}><span aria-hidden="true">+</span> Tambah</button></div><div class="cash-expense-list">${draft.expenses.map((row,index) => `<div class="cash-expense-row"><input aria-label="Keterangan pengeluaran ${index+1}" data-cash-expense="note" data-cash-index="${index}" placeholder="Keterangan" maxlength="200" value="${escapeHtml(row.note)}" ${disabled}><span class="cash-money"><span>Rp</span><input aria-label="Nominal pengeluaran ${index+1}" data-cash-expense="amount" data-cash-index="${index}" inputmode="numeric" maxlength="10" placeholder="0" value="${escapeHtml(row.amount)}" ${disabled}></span><button type="button" class="cash-remove" data-remove-cash-expense="${index}" aria-label="Hapus pengeluaran ${index+1}" ${disabled}>×</button></div>`).join("") || '<p class="cash-empty">Belum ada pengeluaran.</p>'}</div></section>`;
}
function handleCashInput(event) {
  const target=event.target, field=target.dataset?.cashField, expense=target.dataset?.cashExpense;
  if(!field && !expense) return false;
  if(!canInputCash() || store.inputPage!=="sales" || store.submitLoading || isDraftLocked("sales")) return true;
  const draft=store.inputDraft.cash;
  if(field && ["opening_cash","closing_cash","qris"].includes(field)) draft[field]=target.value=target.value.replace(/\D/g,"");
  if(expense && ["note","amount"].includes(expense)) {
    const row=draft.expenses[Number(target.dataset.cashIndex)];
    if(row) row[expense]=target.value=expense==="amount" ? target.value.replace(/\D/g,"") : target.value;
  }
  return true;
}
function changeCashExpense(index) {
  if(!canInputCash() || store.inputPage!=="sales" || store.submitLoading || isDraftLocked("sales")) return;
  const rows=store.inputDraft.cash.expenses;
  if(index===undefined) { if(rows.length>=50) return showToast("Maksimal 50 pengeluaran per hari."); rows.push({note:"",amount:""}); }
  else if(Number.isInteger(Number(index)) && Number(index)>=0) rows.splice(Number(index),1);
  render();
}
function renderPutraCashReceipt(report) {
  if(!report) return '<p class="cash-empty">Data kas belum diisi. Pilih Edit Penjualan untuk melengkapi.</p>';
  return `<div class="cash-receipt"><h4>Kas Harian</h4><div class="cash-receipt-grid">${[["Kas awal",report.opening_cash],["Kas akhir",report.closing_cash],["QRIS",report.qris],["Pengeluaran",cashExpenseTotal(report)]].map(([label,value]) => `<div><span>${label}</span><strong>${rupiah(value)}</strong></div>`).join("")}</div>${report.expenses?.length ? `<div class="cash-receipt-expenses">${report.expenses.map(row => `<div><span>${escapeHtml(row.note)}</span><strong>${rupiah(row.amount)}</strong></div>`).join("")}</div>` : ""}</div>`;
}
function cashReconciliation(report,revenue) {
  const turnover=Number(report.closing_cash)+Number(report.qris)-Number(report.opening_cash)+cashExpenseTotal(report);
  return {turnover,difference:turnover-revenue};
}
function cashDifferenceLabel(difference) { return difference===0 ? "Sesuai" : `${difference>0 ? "+" : "−"}${rupiah(Math.abs(difference))}`; }
function renderAdminCashReports(reports, revenueForDate, label="Putra") {
  if(!isAccessAdmin() || store.adminView!=="dashboard" || !reports.length) return "";
  return `<section class="panel admin-cash-panel" aria-label="Rekonsiliasi kas"><div class="cash-heading"><span class="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span><div><h3>Kas ${escapeHtml(label)}</h3><p>Rekonsiliasi penjualan harian</p></div></div>${reports.map(report => {
    const revenue=revenueForDate(report.record_date), {turnover,difference}=cashReconciliation(report,revenue);
    return `<details class="cash-day" ${reports.length===1 ? "open" : ""}><summary><span>${formatDate(report.record_date)}</span><strong class="cash-difference ${difference>0 ? "is-over" : difference<0 ? "is-short" : "is-matched"}">${cashDifferenceLabel(difference)}</strong><span class="material-symbols-outlined" aria-hidden="true">expand_more</span></summary><div class="cash-day-body">${renderPutraCashReceipt(report)}<div class="cash-comparison"><div><span>Omzet dari kas</span><strong>${rupiah(turnover)}</strong></div><div><span>Omzet penjualan</span><strong>${rupiah(revenue)}</strong></div></div><p class="cash-formula">Kas akhir + QRIS − kas awal + pengeluaran</p></div></details>`;
  }).join("")}</section>`;
}

function renderStaffNavigation() {
  const pages = staffPages();
  return pages.length === 1 && pages[0][0] === "sales" ? "" : `<nav class="input-tabs access-nav" aria-label="Menu staff">${pages.map(([page,,icon,label]) => inputPageButton(page,icon,label)).join("")}</nav>`;
}

function renderStaffPortal() {
  if (store.dbLoading || store.tenantError || !store.tenantResolved) return `<main class="main narrow">${store.tenantResolved && store.tenants.length ? renderTenantSelector() : ""}${store.tenantResolved ? renderStaffNavigation() : ""}${store.tenantError ? `<section class="panel stack"><p role="alert">${escapeHtml(store.tenantError)}</p><button class="btn secondary" data-retry-tenant>Coba lagi</button></section>` : renderTenantLoading()}</main>`;
  ensureStaffPage();
  const receipt = showStaffSalesReceipt();
  const write = ["sales", "stock", "refill"].includes(store.inputPage) && !receipt;
  let body = "";
  if (store.inputPage === "sales") body = receipt ? renderStaffSalesReceipt() : renderInputSales(store.pizzas.filter((pizza) => pizza.active));
  else if (store.inputPage === "stock") body = renderInputStock(store.pizzas.filter((pizza) => pizza.active));
  else if (store.inputPage === "refill") body = renderInputRefill(store.pizzas.filter((pizza) => pizza.active));
  else if (store.inputPage === "timer") body = renderInputTimers();
  else if (store.inputPage.startsWith("view_")) body = renderStaffReadOnly(store.inputPage === "view_sales" ? "sales" : "stock");
  else body = '<section class="panel tenant-empty-state"><h3>Belum ada hak akses</h3><p>Hubungi admin untuk mengatur hak akses Anda.</p></section>';
  return `<main class="main narrow access-staff-main">${store.tenants.length ? renderTenantSelector() : ""}
    ${renderStaffNavigation()}${body}</main>${write ? renderSubmitBar() : ""}`;
}
function renderStaffReadOnly(kind) {
  const dates = getViewerDates();
  const chosen = kind === "stock" ? dates.slice(-1) : dates;
  const stockSnapshot = kind === "stock" ? staffStockSnapshot(chosen[0]) : null;
  const hasData = kind === "stock" ? Object.keys(stockSnapshot).length > 0 : chosen.some((date) => Object.keys(store.records[date]?.[kind] || {}).length > 0 || getDailyProgress(date)[kind]);
  const totals = store.pizzas.map((pizza) => ({ pizza, qty: kind === "stock" ? Number(stockSnapshot[pizza.id]) || 0 : chosen.reduce((sum,date) => sum + (Number(store.records[date]?.[kind]?.[pizza.id]) || 0),0) }));
  const total = totals.reduce((sum,item) => sum+item.qty,0);
  return `<section class="panel viewer-filter-panel stack access-read-filter"><div class="segmented" role="tablist" aria-label="Filter tanggal staff">${viewerFilterButton("today","Hari Ini")}${viewerFilterButton("yesterday","Kemarin")}${viewerFilterButton("custom","Custom")}</div>${store.viewerFilter === "custom" ? renderCalendarRange() : ""}</section>
    ${kind === "stock" && access.stockRefreshError ? `<p class="access-stock-error" role="status">${escapeHtml(access.stockRefreshError)} <button type="button" data-refresh-staff-stock>Coba lagi</button></p>` : ""}
    ${hasData ? `<section class="panel access-read-report" aria-label="${kind === "sales" ? "Ringkasan penjualan" : "Ringkasan stok pizza"}">
      <header class="access-read-heading"><div class="access-read-title"><span class="access-read-icon material-symbols-outlined" aria-hidden="true">${kind === "sales" ? "point_of_sale" : "inventory_2"}</span><div><span class="access-eyebrow">HANYA LIHAT</span><h3>${kind === "sales" ? "Penjualan" : "Stok pizza"}</h3></div></div><div class="access-read-total"><strong>${total}</strong><span>slice</span></div></header>
      <div class="access-read-meta"><span><span class="material-symbols-outlined" aria-hidden="true">storefront</span>${escapeHtml(tenantLabel())}</span><span><span class="material-symbols-outlined" aria-hidden="true">calendar_today</span>${ticketDateDescription(chosen)}</span></div>
      <div class="access-read-list">${totals.map(({pizza,qty}) => `<div class="access-read-row"><span class="access-read-product-icon" aria-hidden="true">${escapeHtml(getInitials(pizza.name))}</span><span class="access-read-product-name">${escapeHtml(pizza.name)}</span><span class="access-read-quantity ${qty === 0 ? "is-zero" : ""}"><strong>${qty}</strong><small>slice</small></span></div>`).join("")}</div>
      ${kind === "stock" ? '<p class="access-stock-note"><span class="material-symbols-outlined" aria-hidden="true">sync</span>Stok mengikuti refill dan penjualan yang sudah dikirim.</p>' : ""}
    </section>` : renderTenantEmptyState(chosen,kind)}`;
}

async function loadAccessAccounts() {
  if (!isAccessAdmin() || access.accountsLoading) return;
  const generation = access.generation;
  access.accountsLoading = true; access.accountsError = ""; render();
  try { const accounts = await dbRequest("rpc/doko_access_list", { method: "POST", body: {} }); if(generation===access.generation) access.accounts=accounts; }
  catch (error) { if(generation===access.generation) access.accountsError = getErrorMessage(error); }
  finally { if(generation===access.generation){access.accountsLoading = false; render();} }
}
function renderAccessManagement() {
  const staff = access.accounts.filter((account) => account.role === "staff");
  return `<section class="panel stack access-management">
    <div class="staff-heading"><div><h3>Kelola Staff <span class="access-staff-count">${staff.length}</span></h3><p>PIN dan akses setiap tenant.</p></div><button class="btn staff-add-btn" type="button" data-access-new ${access.saving ? "disabled" : ""}>+ Staff</button></div>
    <div class="access-admin-note"><span class="material-symbols-outlined" aria-hidden="true">verified_user</span><span>Admin memiliki akses penuh.</span></div>
    ${access.formOpen ? renderAccessForm() : ""}
    ${access.accountsLoading ? renderTenantLoading("Memuat staff", "Menyiapkan daftar dan hak akses", true) : ""}
    ${access.accountsError ? `<p class="tenant-error" role="alert">${escapeHtml(access.accountsError)}</p>` : ""}
    <div class="access-account-list">${staff.map(account => `<article class="access-account-card">
      <div class="access-account-heading"><span class="pizza-initial">${escapeHtml(getInitials(account.name))}</span><h4>${escapeHtml(account.name)}</h4><span class="chip ${account.active && account.pin_set ? "green" : "gray"}">${!account.pin_set ? "Belum ada PIN" : account.active ? "Aktif" : "Nonaktif"}</span><button class="access-account-edit" type="button" data-access-edit="${escapeHtml(account.id)}" aria-label="${account.pin_set ? 'Edit' : 'Atur'} PIN dan akses ${escapeHtml(account.name)}" ${access.saving ? "disabled" : ""}><span class="material-symbols-outlined" aria-hidden="true">edit</span></button></div>
      <div class="access-account-grants">${account.permissions.filter(p => ACCESS_RIGHTS.some(([key]) => p[key])).map(p => `<div class="access-grant-row"><strong>${escapeHtml(tenantLabel(store.tenants.find(t => t.id === p.tenant_id) || {}))}</strong><div class="access-right-tags">${ACCESS_RIGHTS.filter(([key]) => p[key]).map(([,label]) => `<span>${label}</span>`).join('')}</div></div>`).join('')}</div>
      ${account.timer || account.pin_set ? `<div class="access-account-footer">${account.timer ? '<span class="access-timer-badge"><span class="material-symbols-outlined" aria-hidden="true">timer</span>Timer</span>' : ''}${account.pin_set ? `<button class="access-account-toggle" type="button" data-access-toggle="${escapeHtml(account.id)}" ${access.saving ? 'disabled' : ''}>${account.active ? 'Nonaktifkan' : 'Aktifkan'}</button>` : ''}</div>` : ''}
    </article>`).join('') || (!access.accountsLoading && !access.accountsError ? '<p class="access-staff-empty">Belum ada staff. Tambahkan staff untuk mengatur PIN dan akses.</p>' : '')}</div>
  </section><details class="panel access-tenant-management"><summary>Kelola tenant / lokasi</summary>${renderStaffManagement()}</details>`;
}
function renderAccessForm() {
  const form = access.form;
  return `<form data-access-form class="staff-form access-form"><h4>${access.accounts.some((a)=>a.id===form.id) ? "Edit staff" : "Tambah staff"}</h4>
    <label>Nama staff<input data-access-field="name" maxlength="80" value="${escapeHtml(form.name)}" required /></label>
    <label>PIN staff<input data-access-field="pin" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="4–6 angka${access.accounts.some((a)=>a.id===form.id && a.pin_set) ? " · kosongkan jika tetap" : ""}" value="${escapeHtml(form.pin)}" /></label>
    <label class="access-check access-timer-check"><input type="checkbox" data-access-timer ${form.timer ? "checked" : ""} /><span class="material-symbols-outlined" aria-hidden="true">timer</span><span>Timer</span></label>
    <div class="access-permission-list">${store.tenants.map((tenant) => `<fieldset class="access-permission-card"><legend>${escapeHtml(tenantLabel(tenant))}</legend><div>${ACCESS_RIGHTS.map(([key,label,icon]) => `<label class="access-check"><input type="checkbox" data-access-right="${key}" data-access-tenant="${escapeHtml(tenant.id)}" ${form.permissions[tenant.id]?.[key] ? "checked" : ""} /><span class="material-symbols-outlined" aria-hidden="true">${icon}</span><span>${label}</span></label>`).join("")}</div></fieldset>`).join("")}</div>
    <p class="muted">Hak input mengikuti tanggal yang dipilih. Hak lihat membuka riwayat tanpa tombol ubah data. PIN harus berbeda untuk setiap akun.</p>
    <div class="staff-actions"><button class="btn" type="submit" ${access.saving ? "disabled" : ""}>${access.saving ? "Menyimpan..." : "Simpan staff"}</button><button class="btn secondary" type="button" data-access-cancel ${access.saving ? "disabled" : ""}>Batal</button></div>
  </form>`;
}
function editAccessAccount(id) {
  if (access.saving) return;
  const account = access.accounts.find((item) => item.id === id);
  access.form = account ? { id: account.id, name: account.name, pin: "", active: account.active, timer: account.timer, permissions: Object.fromEntries(account.permissions.map((p)=>[p.tenant_id,{...p}])) }
    : { id: crypto.randomUUID(), name: "", pin: "", active: true, timer: false, permissions: {} };
  access.formOpen = true; access.accountsError = ""; render();
  document.querySelector("[data-access-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
async function saveAccessAccount(account = null) {
  if (!isAccessAdmin() || access.saving) return;
  const form = account || access.form;
  if (!form.name.trim()) { access.accountsError = "Isi nama staff."; render(); return; }
  const permissions = Array.isArray(form.permissions) ? form.permissions : Object.entries(form.permissions).map(([tenant_id,rights])=>({tenant_id,...rights}));
  access.saving = true; access.accountsError = ""; render();
  try {
    await dbRequest("rpc/doko_access_save", { method: "POST", body: {p_id:form.id,p_name:form.name.trim(),p_pin:form.pin || "",p_timer:form.timer,p_active:form.active,p_permissions:permissions} });
    access.formOpen = false; access.form = { id: null, name: "", pin: "", active: true, timer: false, permissions: {} };
    await loadAccessAccounts(); showToast("PIN dan hak akses staff tersimpan.", "success");
  } catch(error) { access.accountsError = getErrorMessage(error); }
  finally { access.saving = false; render(); }
}

function handleAccessClick(event) {
  if (event.target.closest("[data-add-cash-expense]")) { changeCashExpense(); return true; }
  const removeCash = event.target.closest("[data-remove-cash-expense]");
  if (removeCash) { changeCashExpense(Number(removeCash.dataset.removeCashExpense)); return true; }
  if (event.target.closest("[data-edit-staff-sales]")) { editStaffSales(); return true; }
  if (event.target.closest("[data-cancel-staff-sales]")) { editStaffSales(true); return true; }
  if (event.target.closest("[data-access-login]")) { loginAccess(); return true; }
  if (event.target.closest("[data-access-logout]")) { logoutAccess(); return true; }
  if (event.target.closest("[data-access-new]")) { editAccessAccount(null); return true; }
  const edit = event.target.closest("[data-access-edit]")?.dataset.accessEdit;
  if (edit) { editAccessAccount(edit); return true; }
  const toggle = event.target.closest("[data-access-toggle]")?.dataset.accessToggle;
  if (toggle) { const account = access.accounts.find((item)=>item.id===toggle); if(account) saveAccessAccount({...account,active:!account.active}); return true; }
  if (event.target.closest("[data-access-cancel]")) { if(!access.saving){access.formOpen=false;access.form.pin="";render();}return true; }
  return false;
}
function handleAccessInput(event) {
  if (event.target.matches("[data-access-pin]")) { access.pin=event.target.value.replace(/\D/g,"").slice(0,6);event.target.value=access.pin;return true; }
  if (event.target.dataset.accessField) { const key=event.target.dataset.accessField;if(["name","pin"].includes(key)){access.form[key]=key==="pin"?event.target.value.replace(/\D/g,"").slice(0,6):event.target.value;event.target.value=access.form[key];}return true; }
  if (event.target.matches("[data-access-timer]")) { access.form.timer=event.target.checked;return true; }
  if (event.target.dataset.accessRight) { const tenant=event.target.dataset.accessTenant,key=event.target.dataset.accessRight;if(ACCESS_RIGHTS.some(([right])=>right===key)&&store.tenants.some((t)=>t.id===tenant)){access.form.permissions[tenant] ||= {};access.form.permissions[tenant][key]=event.target.checked;}return true; }
  return false;
}
