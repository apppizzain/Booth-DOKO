// PIN login is verified by the server. Tokens stay in memory: reopening the
// application always asks for a PIN. Staff never use the admin's table API.
const access = {
  session: null, actor: null, pin: "", loading: false, error: "", refresh: null, generation: 0,
  accounts: [], accountsLoading: false, accountsError: "", formOpen: false,
  form: { id: null, name: "", pin: "", active: true, timer: false, permissions: {} }, saving: false,
};
const ACCESS_RIGHTS = [
  ["input_stock", "Input stok", "inventory_2"], ["input_sales", "Input penjualan", "point_of_sale"],
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
  access.form = { id: null, name: "", pin: "", active: true, timer: false, permissions: {} };
  store.adminUnlocked = false; store.dbReady = false; store.tenantResolved = false;
  store.dbLoading = false; store.dailyEditUnlocked = {sales:false,stock:false};
  store.tenants = []; store.tenantSelection = "";
  store.records = {}; store.pizzas = []; store.attendance = {}; store.dailyExpenses = {}; store.combinedTenants = [];
  store.inputDraft = { sales: {}, stock: {}, refill: {} }; store.dailySubmitted = {};
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
  store.records = {}; store.pizzas = []; store.dailyExpenses = {}; store.attendance = {}; store.dailySubmitted = {};
  store.inputDraft = { sales: {}, stock: {}, refill: {} }; store.ownerFee = 0;
  store.ownerFeeMode = "fixed"; store.ownerFeePercent = 0; store.ownerFeeDraft = null;
  if (!store.tenants.length) { store.inputPage = "timer"; return; }
  const result = await dbRequest("rpc/doko_access_workspace", { method: "POST", body: { p_tenant_id: currentTenant.id } });
  if (generation !== access.generation) throw Error("Sesi telah berubah.");
  store.pizzas = result.pizzas.map((pizza) => ({ ...pizza, cost: 0, price: Number(pizza.price) || 0,
    packSize: Number(pizza.pack_size) || 0, packPrice: Number(pizza.pack_price) || 0, image: pizza.image || PIZZA_IMAGES.veggie }));
  result.records.forEach((row) => {
    const stock = splitStockPayload(row.stock);
    store.records[row.record_date] = { sales: splitSalesPayload(row.sales).total, salesDetail: row.sales_detail || {}, stock: stock.stock, refill: {} };
    store.dailySubmitted[row.record_date] = {
      sales: row.sales?.__submitted === true || Object.keys(store.records[row.record_date].sales).length > 0,
      stock: row.stock?.__submitted === true || Object.keys(stock.stock).length > 0,
    };
  });
  const today = store.records[isoDate(new Date())];
  if (today) { store.inputDraft.sales = { ...today.sales }; store.inputDraft.packs = salesPackCounts(today.salesDetail); store.inputDraft.stock = { ...today.stock }; }
  ensureStaffPage();
}

function staffPages() {
  return [
    ["sales", "input_sales", "point_of_sale", "Input penjualan"],
    ["stock", "input_stock", "inventory_2", "Input stok"],
    ["timer", "timer", "timer", "Timer"],
    ["view_sales", "view_sales", "receipt_long", "Lihat penjualan"],
    ["view_stock", "view_stock", "visibility", "Lihat stok"],
  ].filter(([, right]) => canAccess(right));
}
function ensureStaffPage() {
  const pages = staffPages();
  if (!pages.some(([page]) => page === store.inputPage)) store.inputPage = pages[0]?.[0] || "none";
}
function renderStaffPortal() {
  if (store.dbLoading || store.tenantError || !store.tenantResolved) return `<main class="main narrow">${store.tenants.length ? renderTenantSelector() : ""}<section class="panel stack"><p role="status">${escapeHtml(store.tenantError || "Memuat akses staff...")}</p>${store.tenantError ? '<button class="btn secondary" data-retry-tenant>Coba lagi</button>' : ""}</section></main>`;
  ensureStaffPage();
  const pages = staffPages();
  const write = store.inputPage === "sales" || store.inputPage === "stock";
  let body = "";
  if (store.inputPage === "sales") body = renderInputSales(store.pizzas.filter((pizza) => pizza.active));
  else if (store.inputPage === "stock") body = renderInputStock(store.pizzas.filter((pizza) => pizza.active));
  else if (store.inputPage === "timer") body = renderInputTimers();
  else if (store.inputPage.startsWith("view_")) body = renderStaffReadOnly(store.inputPage === "view_sales" ? "sales" : "stock");
  else body = '<section class="panel tenant-empty-state"><h3>Belum ada hak akses</h3><p>Hubungi admin untuk mengatur hak akses Anda.</p></section>';
  return `<main class="main narrow access-staff-main">${store.tenants.length ? renderTenantSelector() : ""}
    <nav class="input-tabs access-nav" aria-label="Menu staff">${pages.map(([page,,icon,label]) => inputPageButton(page,icon,label)).join("")}</nav>${body}</main>${write ? renderSubmitBar() : ""}`;
}
function renderStaffReadOnly(kind) {
  const dates = getViewerDates();
  const chosen = kind === "stock" ? dates.slice(-1) : dates;
  const hasData = chosen.some((date) => Object.keys(store.records[date]?.[kind] || {}).length > 0 || getDailyProgress(date)[kind]);
  const totals = store.pizzas.map((pizza) => ({ pizza, qty: chosen.reduce((sum,date) => sum + (Number(store.records[date]?.[kind]?.[pizza.id]) || 0),0) }));
  const total = totals.reduce((sum,item) => sum+item.qty,0);
  return `<section class="panel viewer-filter-panel stack access-read-filter"><div class="segmented" role="tablist" aria-label="Filter tanggal staff">${viewerFilterButton("today","Hari Ini")}${viewerFilterButton("yesterday","Kemarin")}${viewerFilterButton("custom","Custom")}</div>${store.viewerFilter === "custom" ? renderCalendarRange() : ""}</section>
    ${hasData ? `<section class="panel access-read-report"><div class="access-read-heading"><div><span class="access-eyebrow">HANYA LIHAT</span><h3>${kind === "sales" ? "Penjualan" : "Stok pizza"}</h3><p>${escapeHtml(tenantLabel())} · ${ticketDateDescription(chosen)}</p></div><strong>${total}<small> slice</small></strong></div>
    ${totals.map(({pizza,qty}) => `<div class="access-read-row"><span>${escapeHtml(pizza.name)}</span><strong>${qty}<small> slice</small></strong></div>`).join("")}</section>` : renderTenantEmptyState(chosen,kind)}`;
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
    ${access.accountsLoading ? '<p class="muted" role="status">Memuat akun staff...</p>' : ""}
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
    <p class="muted">Hak input berlaku untuk data hari ini. Hak lihat membuka riwayat tanpa tombol ubah data. PIN harus berbeda untuk setiap akun.</p>
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
