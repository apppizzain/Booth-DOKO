const DEFAULT_TENANT = Object.freeze({
  id: "doko", app_id: "pizzain_doko_v1", data_app_id: "pizzain_doko_v1",
  staff_name: "Bg Pon", tenant_name: "Tenant DOKO", location: "DOKO", active: true,
});
const INITIAL_NEW_TENANT = Object.freeze({
  id: "tenant-smea-sigli", app_id: "pizzain_doko_v1", data_app_id: "pizzain_tenant_smea_sigli",
  staff_name: "Dila", tenant_name: "Tenant SMEA Sigli", location: "SMEA Sigli", active: true,
});
let currentTenant = DEFAULT_TENANT;

function dataAppId() { return currentTenant.data_app_id; }
function tenantStorageKey(suffix) { return `${dataAppId()}:${suffix}`; }
function tenantLabel(tenant = currentTenant) { return tenant.tenant_name || tenant.staff_name || "Tenant"; }
function staffTenantLabel(tenant = currentTenant) { return `${tenant.staff_name || "Staff belum diisi"} — ${tenantLabel(tenant)}`; }
function isInputRoute() { return normalizeRoute(location.pathname) === "/input"; }
function isAllTenants() { return store.tenantSelection === "all"; }

async function loadTenantProfiles() {
  const generation = access.generation;
  if (isAccessStaff()) {
    store.tenants = access.actor.tenants;
    store.tenantsReady = true; store.tenantsError = "";
    const requested = location.pathname.match(/^\/input\/([a-z0-9-]+)/)?.[1] || new URLSearchParams(location.search).get("tenant");
    currentTenant = store.tenants.find((tenant)=>tenant.id===requested) || store.tenants[0] || { ...DEFAULT_TENANT };
    store.tenantSelection = store.tenants.length ? currentTenant.id : "";
    store.tenantResolved = true;
    return;
  }
  store.tenantsReady = false;
  store.tenantsError = "";
  try {
    const rows = await dbSelect("doko_tenants", `app_id=eq.${DOKO_APP_ID}&select=*&order=created_at.asc`);
    if (generation !== access.generation) throw Error("Sesi telah berubah.");
    store.tenants = rows;
    if (!rows.some((tenant) => tenant.id === DEFAULT_TENANT.id)) {
      throw new Error("Tenant DOKO belum terdaftar. Jalankan SQL penyiapan staff dan tenant.");
    }
    store.tenantsReady = true;
  } catch (error) {
    store.tenants = [];
    store.tenantsError = "Data tenant belum berhasil dimuat. Coba lagi.";
    throw error;
  }
  const inputPathTenant = location.pathname.replace(/\/+$/, "").match(/^\/input\/([a-z0-9-]+)$/)?.[1];
  const requested = inputPathTenant || new URLSearchParams(location.search || "").get("tenant") || DEFAULT_TENANT.id;
  store.tenantSelection = requested;
  if (requested === "all" && !isInputRoute()) {
    if (!store.tenantsReady) throw new Error(store.tenantsError);
    currentTenant = store.tenants[0];
  } else {
    const tenant = store.tenants.find((item) => item.id === requested);
    if (!tenant || (isInputRoute() && !tenant.active)) {
      throw new Error("Tautan input tidak tersedia. Hubungi admin untuk mendapatkan tautan staff yang aktif.");
    }
    if (!store.tenantsReady && tenant.id !== DEFAULT_TENANT.id) throw new Error(store.tenantsError);
    currentTenant = tenant;
  }
  store.tenantResolved = true;
}

function inputTenantUrl(tenant) {
  // A distinct path fails closed on older web deployments instead of silently
  // sending a new tenant's input to the legacy DOKO namespace.
  return new URL(`/input/${encodeURIComponent(tenant.id)}`, location.origin).href;
}

function renderTenantLoading(title = "Memuat data", detail = store.tenantResolved ? (isAllTenants() ? "Semua Tenant" : tenantLabel()) : "Menyiapkan halaman", inline = false) {
  return `<div class="tenant-loading ${inline ? "tenant-loading-inline" : "panel"}" role="status" aria-live="polite" aria-busy="true">
    <span class="tenant-loading-mark" aria-hidden="true"><span class="tenant-loading-ring"></span></span>
    <div class="tenant-loading-copy"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(detail)}</p></div>
  </div>`;
}

function renderTenantSelector() {
  const disabled = Boolean(store.dbLoading || store.pendingWrites || store.staffSaving);
  if (!isAllTenants()) {
    if (!isAccessAdmin() && store.tenants.length <= 1) return "";
    return `<nav class="tenant-context-nav" aria-label="Navigasi tenant">
      ${isAccessAdmin() ? `<button type="button" class="tenant-context-back" data-select-tenant="all" ${disabled ? "disabled" : ""}><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>Semua Tenant</button>` : store.tenants.map(tenant => `<button type="button" class="tenant-context-switch ${tenant.id === currentTenant.id ? "active" : ""}" data-select-tenant="${escapeHtml(tenant.id)}" aria-pressed="${tenant.id === currentTenant.id}" ${disabled ? "disabled" : ""}>${escapeHtml(staffTenantLabel(tenant))}</button>`).join("")}
    </nav>`;
  }
  const selected = isAllTenants() ? null : currentTenant;
  return `<section class="panel tenant-selector-panel">
    <div class="tenant-selector-heading"><span>Data tenant</span><span class="tenant-count">${store.tenants.length} tenant</span></div>
    <details class="tenant-picker" data-tenant-picker>
      <summary id="tenant-selector" data-tenant-toggle aria-label="Pilih tenant: ${escapeHtml(selected ? staffTenantLabel(selected) : "Semua Tenant · Gabungan")}" ${disabled ? 'aria-disabled="true" tabindex="-1"' : ""}>
        <span class="tenant-picker-icon material-symbols-outlined" aria-hidden="true">${selected ? "storefront" : "domain"}</span>
        <span class="tenant-picker-copy"><strong>${escapeHtml(selected ? selected.staff_name || "Staff" : "Semua Tenant")}</strong><small>${escapeHtml(selected ? tenantLabel(selected) : "Rekap seluruh tenant")}${selected && !selected.active ? " · Nonaktif" : ""}</small></span>
        <span class="tenant-picker-chevron material-symbols-outlined" aria-hidden="true">expand_more</span>
      </summary>
      <div class="tenant-picker-menu" role="group" aria-label="Pilihan tenant">
        ${isAccessAdmin() ? renderTenantOption("all", "Semua Tenant", "Rekap seluruh tenant", "domain", disabled || !store.tenantsReady) : ""}
        ${store.tenants.map((tenant) => renderTenantOption(tenant.id, tenant.staff_name || "Staff", `${tenantLabel(tenant)}${tenant.active ? "" : " · Nonaktif"}`, "storefront", disabled || (!store.tenantsReady && tenant.id !== DEFAULT_TENANT.id))).join("")}
      </div>
    </details>
    ${store.tenantError ? `<p class="tenant-error" role="alert">${escapeHtml(store.tenantError)} <button type="button" data-retry-tenant>Coba lagi</button></p>` : ""}
  </section>`;
}

function renderTenantOption(id, title, description, icon, disabled) {
  const selected = store.tenantSelection === id;
  return `<button class="tenant-picker-option ${selected ? "is-selected" : ""}" type="button" data-select-tenant="${escapeHtml(id)}" data-tenant-option aria-label="${escapeHtml(title)} — ${escapeHtml(description)}" aria-pressed="${selected}" ${disabled ? "disabled" : ""}>
    <span class="tenant-option-icon material-symbols-outlined" aria-hidden="true">${icon}</span>
    <span class="tenant-picker-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span>
    <span class="tenant-option-check material-symbols-outlined" aria-hidden="true">${selected ? "check_circle" : "radio_button_unchecked"}</span>
  </button>`;
}

function closeTenantPicker(restoreFocus = false) {
  const picker = document.querySelector("[data-tenant-picker]");
  if (!picker?.open) return;
  picker.open = false;
  if (restoreFocus) picker.querySelector("summary")?.focus({ preventScroll: true });
}

function handleTenantPickerKeydown(event) {
  const picker = event.target.closest("[data-tenant-picker]");
  if (!picker) return;
  if (event.key === "Escape") { event.preventDefault(); closeTenantPicker(true); return; }
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  if (picker.querySelector("summary")?.getAttribute("aria-disabled") === "true") return;
  const options = [...picker.querySelectorAll("[data-tenant-option]:not(:disabled)")];
  if (!options.length) return;
  event.preventDefault();
  picker.open = true;
  const current = options.indexOf(event.target.closest("[data-tenant-option]"));
  const index = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
    : current < 0 ? Math.max(0, options.findIndex((option) => option.getAttribute("aria-pressed") === "true"))
    : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
  options[index].focus();
}

function emptyStaffForm() { return { staff_name: "", tenant_name: "", location: "" }; }

function renderStaffManagement() {
  const form = store.staffForm;
  return `<section class="panel stack staff-management">
    <div class="staff-heading"><div><h3>Kelola Tenant</h3><p>Data dan lokasi tiap tenant.</p></div><button class="btn secondary" type="button" data-open-staff ${!store.tenantsReady || store.staffSaving ? "disabled" : ""}>+ Tenant</button></div>
    ${!store.tenantsReady ? `<p class="tenant-error" role="alert">${escapeHtml(store.tenantsError)}</p>` : ""}
    ${store.staffFormOpen ? `<form data-staff-form class="staff-form">
      <h4>${store.editingStaffId ? "Edit Tenant" : "Tambah Tenant"}</h4>
      <label>Penanggung jawab tenant<input data-staff-field="staff_name" maxlength="80" value="${escapeHtml(form.staff_name)}" placeholder="Contoh: Rina" required /></label>
      <label>Nama Tenant<input data-staff-field="tenant_name" maxlength="80" value="${escapeHtml(form.tenant_name)}" placeholder="Contoh: Pizzain DOKO" required /></label>
      <label>Lokasi<input data-staff-field="location" maxlength="160" value="${escapeHtml(form.location)}" placeholder="Nama tempat atau alamat singkat" /></label>
      <p class="muted">Tenant baru memiliki katalog produk sendiri. Tambahkan produk dan atur harganya melalui Setting tenant tersebut.</p>
      <div class="staff-actions">
        <button class="btn" type="submit" ${!store.tenantsReady || store.staffSaving || store.dbLoading ? "disabled" : ""}>${store.staffSaving ? "Menyimpan..." : store.editingStaffId ? "Simpan Perubahan" : "Tambah Tenant"}</button>
        <button class="btn secondary" type="button" data-cancel-staff ${store.staffSaving ? "disabled" : ""}>Batal</button>
      </div>
      ${store.staffError ? `<p class="tenant-error" role="alert">${escapeHtml(store.staffError)}</p>` : ""}
    </form>` : ""}
    <div class="staff-list">${store.tenants.map(renderStaffCard).join("")}</div>
    <button class="btn secondary" type="button" data-admin-view="attendance">Lihat Riwayat Absensi Lama</button>
  </section>`;
}

function renderStaffCard(tenant) {
  const inputUrl = inputTenantUrl(tenant);
  return `<article class="staff-card">
    <div class="staff-card-title"><span class="pizza-initial">${escapeHtml(getInitials(tenant.staff_name || tenantLabel(tenant)))}</span><div><h4>${escapeHtml(tenant.staff_name || "Nama staff belum diisi")}</h4><p>${escapeHtml(tenantLabel(tenant))}${tenant.location ? ` · ${escapeHtml(tenant.location)}` : ""}</p></div><span class="chip ${tenant.active ? "green" : "gray"}">${tenant.active ? "Aktif" : "Nonaktif"}</span></div>
    <label>Tautan input khusus<input value="${escapeHtml(inputUrl)}" readonly aria-label="Tautan input ${escapeHtml(tenantLabel(tenant))}" /></label>
    <div class="staff-actions">
      ${tenant.active && (store.tenantsReady || tenant.id === DEFAULT_TENANT.id) ? `<a class="btn secondary" href="${escapeHtml(inputUrl)}" target="_blank" rel="noopener">Buka Input</a><button class="btn secondary" type="button" data-copy-tenant="${escapeHtml(tenant.id)}">Salin Tautan</button>` : ""}
      <button class="btn secondary" type="button" data-edit-staff="${escapeHtml(tenant.id)}" ${store.staffSaving || !store.tenantsReady ? "disabled" : ""}>Edit</button>
      ${tenant.id !== DEFAULT_TENANT.id ? `<button class="btn secondary" type="button" data-toggle-staff="${escapeHtml(tenant.id)}" ${store.staffSaving || !store.tenantsReady ? "disabled" : ""}>${!store.tenantsReady ? "Menunggu Database" : tenant.active ? "Nonaktifkan" : "Aktifkan"}</button>` : `<span class="muted">Tenant awal · seluruh data lama milik Bg Pon</span>`}
    </div>
  </article>`;
}

function editStaff(id) {
  if (store.staffSaving) return;
  const tenant = store.tenants.find((item) => item.id === id);
  if (!tenant) return;
  store.editingStaffId = id;
  store.staffFormOpen = true;
  store.staffForm = { staff_name: tenant.staff_name, tenant_name: tenant.tenant_name, location: tenant.location };
  store.staffError = "";
  render();
  document.querySelector("[data-staff-form]")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function saveStaff() {
  if (!store.adminUnlocked || !store.tenantsReady || store.staffSaving || store.dbLoading) return;
  const staffName = store.staffForm.staff_name.trim();
  const tenantName = store.staffForm.tenant_name.trim();
  const tenantLocation = store.staffForm.location.trim();
  if (!staffName || !tenantName || staffName.length > 80 || tenantName.length > 80 || tenantLocation.length > 160) {
    store.staffError = "Isi nama staff dan nama tenant (maksimal 80 karakter), serta lokasi maksimal 160 karakter.";
    render();
    return;
  }
  const existing = store.tenants.find((tenant) => tenant.id === store.editingStaffId);
  // Keep this ID on failure so retrying never creates another tenant.
  if (!existing && !store.newStaffId) store.newStaffId = `tenant-${crypto.randomUUID()}`;
  const id = existing?.id || store.newStaffId;
  const row = {
    app_id: DOKO_APP_ID, id, data_app_id: existing?.data_app_id || `pizzain_${id.replaceAll("-", "_")}`,
    staff_name: staffName, tenant_name: tenantName, location: tenantLocation,
    active: existing?.active ?? true, updated_at: new Date().toISOString(),
  };
  store.staffSaving = true;
  store.staffError = "";
  render();
  try {
    if (existing) {
      await dbUpsert("doko_tenants", row, "app_id,id");
    } else {
      // Registry, settings and catalogue are created in one database transaction.
      await dbRequest("rpc/doko_create_tenant", { method: "POST", body: {
        p_id: id, p_staff_name: staffName, p_tenant_name: tenantName, p_location: tenantLocation,
      } });
    }
    store.tenants = store.tenants.filter((tenant) => tenant.id !== id).concat(row);
    if (currentTenant.id === id) currentTenant = row;
    store.staffForm = emptyStaffForm();
    store.staffFormOpen = false;
    store.editingStaffId = null;
    store.newStaffId = null;
    showToast("Staff dan tenant berhasil disimpan. Tautan input sudah tersedia.", "success");
  } catch (error) {
    store.staffError = `Belum tersimpan lengkap. Coba simpan lagi. ${getErrorMessage(error)}`;
  } finally {
    store.staffSaving = false;
    render();
  }
}

async function toggleStaff(id) {
  if (!store.adminUnlocked || !store.tenantsReady || store.staffSaving || store.pendingWrites || store.dbLoading) return;
  const tenant = store.tenants.find((item) => item.id === id);
  if (!tenant || tenant.id === DEFAULT_TENANT.id) return;
  store.staffSaving = true;
  render();
  try {
    const row = { ...tenant, active: !tenant.active, updated_at: new Date().toISOString() };
    await dbUpsert("doko_tenants", row, "app_id,id");
    store.tenants = store.tenants.map((item) => item.id === id ? row : item);
    if (currentTenant.id === id) currentTenant = row;
    showToast(row.active ? "Staff diaktifkan" : "Staff dinonaktifkan. Riwayat data tetap tersimpan.", "success");
  } catch (error) { showToast(getErrorMessage(error), "error"); }
  finally { store.staffSaving = false; render(); }
}

async function copyTenantUrl(id) {
  const tenant = store.tenants.find((item) => item.id === id);
  if (!tenant) return;
  try {
    await navigator.clipboard.writeText(inputTenantUrl(tenant));
    showToast("Tautan input disalin", "success");
  } catch (error) { showToast("Pilih dan salin tautan pada kartu staff.", "error"); }
}

async function switchTenant(id) {
  if (!hasAccessSession() || id === store.tenantSelection) return;
  if (isAccessStaff() && !store.tenants.some((tenant)=>tenant.id===id)) return;
  if (store.pendingWrites || store.staffSaving || store.dbLoading || store.submitLoading || store.adminEdit.saving || access.saving) {
    showToast("Tunggu proses penyimpanan selesai sebelum mengganti tenant.", "error");
    render();
    return;
  }
  if (store.adminEdit.type || store.pizzaFormOpen || store.expenseForm.note || store.expenseForm.amount || store.staffForm.staff_name || store.staffForm.tenant_name || store.staffForm.location || access.formOpen) {
    showToast("Simpan atau batalkan formulir yang sedang diisi sebelum mengganti tenant.", "error");
    render();
    return;
  }
  const tenant = store.tenants.find((item) => item.id === id);
  if (id !== "all" && !tenant) return;
  if (!store.tenantsReady && id !== DEFAULT_TENANT.id) {
    showToast(store.tenantsError, "error");
    render();
    return;
  }
  store.tenantSelection = id;
  currentTenant = tenant || store.tenants[0];
  store.records = {};
  store.dailySubmitted = {};
  store.attendance = {};
  store.dailyExpenses = {};
  store.pizzas = [];
  store.ownerFee = 2000;
  store.ownerFeeMode = "fixed";
  store.ownerFeePercent = 0;
  store.ownerFeeDraft = null;
  store.adminQuickPanel = null;
  store.editingPizzaId = null;
  store.attendancePhotoPreview = null;
  store.combinedTenants = [];
  store.attendanceSettings = { ...DEFAULT_ATTENDANCE_SETTINGS };
  store.inputDraft = { sales: {}, refill: {}, stock: {} };
  store.inputDate = ""; store.inputDraftDate = ""; store.inputDrafts = {};
  store.dailyEditUnlocked = { sales: false, stock: false };
  const url = new URL(location.href);
  url.searchParams.set("tenant", id);
  history.replaceState({}, "", url.pathname + url.search);
  await initializeDatabase(false);
}

async function loadCombinedTenants() {
  const generation = access.generation;
  const snapshots = await Promise.all(store.tenants.map(async (tenant) => {
    const appId = encodeURIComponent(tenant.data_app_id);
    const [settings, pizzas, records, expenses] = await Promise.all([
      dbSelect("doko_settings", `app_id=eq.${appId}&select=owner_fee,owner_fee_mode,owner_fee_percent&limit=1`),
      dbSelect("doko_pizzas", `app_id=eq.${appId}&select=id,name,cost,price,pack_size,pack_price,active,image,sort_order`),
      dbSelect("doko_daily_records", `app_id=eq.${appId}&select=record_date,sales,sales_detail,stock,submitted_at`),
      dbSelect("doko_daily_expenses", `app_id=eq.${appId}&select=record_date,amount`),
    ]);
    return { tenant, ownerFee: Number(settings[0]?.owner_fee ?? 2000),
      ownerFeeMode: settings[0]?.owner_fee_mode === "percent" ? "percent" : "fixed",
      ownerFeePercent: Number(settings[0]?.owner_fee_percent ?? 0), pizzas, records, expenses };
  }));
  if (generation !== access.generation) throw Error("Sesi telah berubah.");
  store.combinedTenants = snapshots;
}

function summaryForTenant(snapshot, dates, salesScope = "tenant") {
  const summary = { slices: 0, revenue: 0, cost: 0, ownerShare: 0, expenses: 0, net: 0, afterFee: 0 };
  const selectedDates = new Set(dates);
  snapshot.records.filter((row) => selectedDates.has(row.record_date)).forEach((row) => {
    const sales = splitSalesPayload(row.sales);
    const record = { sales: sales.total, salesDetail: row.sales_detail || {} };
    snapshot.pizzas.forEach((pizza) => {
      const qty = getSalesQuantity(record, pizza.id, salesScope);
      summary.slices += qty;
      summary.revenue += getSalesRevenue(record, pizza);
      summary.cost += qty * Number(pizza.cost);
    });
  });
  summary.expenses = snapshot.expenses.filter((row) => selectedDates.has(row.record_date)).reduce((sum, row) => sum + Number(row.amount), 0);
  summary.ownerShare = calculateOwnerShare(summary, snapshot);
  summary.afterFee = summary.revenue - summary.ownerShare;
  summary.net = summary.afterFee - summary.cost - summary.expenses;
  return summary;
}

function renderCombinedTenants() {
  if (store.adminView !== "dashboard" && store.adminView !== "reports") {
    return `<section class="panel tenant-choice-panel">
      <div class="tenant-choice-heading"><span class="material-symbols-outlined" aria-hidden="true">storefront</span><div><h3>Pilih tenant</h3><p>Buka produk dan pengaturan tiap lokasi.</p></div></div>
      <div class="tenant-choice-list">${store.tenants.map(tenant => `<button class="tenant-choice-row" type="button" data-select-tenant="${escapeHtml(tenant.id)}" aria-label="Buka ${escapeHtml(tenantLabel(tenant))}">
        <span class="tenant-choice-avatar" aria-hidden="true">${escapeHtml(getInitials(tenant.staff_name || tenantLabel(tenant)))}</span>
        <span class="tenant-choice-copy"><strong>${escapeHtml(tenantLabel(tenant))}</strong><small>${escapeHtml(tenant.staff_name || tenant.location || 'Kelola tenant')}${tenant.active ? '' : ' · Nonaktif'}</small></span>
        <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
      </button>`).join("")}</div>
    </section>`;
  }
  const dates = getViewerDates();
  const scope = store.adminView === "reports" && store.reportView === "staff" ? "staff" : "tenant";
  const isReport = store.adminView === "reports";
  const isStaff = scope === "staff";
  const selectedDates = new Set(dates);
  const summaries = store.combinedTenants.map((snapshot) => ({
    snapshot, summary: summaryForTenant(snapshot, dates, scope),
    hasData: snapshot.records.some((row) => selectedDates.has(row.record_date)) || snapshot.expenses.some((row) => selectedDates.has(row.record_date)),
  }));
  const totals = summaries.reduce((total, { summary }) => {
    Object.keys(total).forEach((key) => { total[key] += summary[key]; });
    return total;
  }, { slices: 0, revenue: 0, cost: 0, ownerShare: 0, expenses: 0, net: 0, afterFee: 0 });
  const tenantsWithData = summaries.filter((item) => item.hasData).length;
  const headline = isStaff ? totals.ownerShare : isReport ? totals.revenue : totals.net;
  const headlineLabel = isStaff ? "Penghasilan staff" : isReport ? "Omzet kotor" : "Laba bersih";
  const secondaryLabel = isStaff ? "Tenant berdata" : isReport ? "Laba bersih" : "Omzet kotor";
  const secondaryValue = isStaff ? `${tenantsWithData} / ${summaries.length}` : rupiah(isReport ? totals.net : totals.revenue);
  return `<div class="combined-view">
  <section class="panel viewer-filter-panel combined-filter">
    <div class="segmented" role="tablist" aria-label="Filter tanggal gabungan">${viewerFilterButton("today", "Hari Ini")}${viewerFilterButton("yesterday", "Kemarin")}${viewerFilterButton("custom", "Custom")}</div>
    ${isReport ? `<div class="report-type-tabs" role="tablist" aria-label="Jenis laporan">${reportTypeButton("tenant", "Tenant")}${reportTypeButton("staff", "Staff")}</div>` : ""}
    ${store.viewerFilter === "custom" ? renderCalendarRange() : ""}
  </section>
  ${tenantsWithData ? `<section class="panel combined-overview" aria-label="Ringkasan gabungan">
    <div class="combined-hero">
      <div class="combined-hero-heading"><div><span class="combined-eyebrow">${isStaff ? "REKAP STAFF" : "SEMUA TENANT"}</span><h3>${isReport ? "Laporan gabungan" : "Dashboard gabungan"}</h3></div><span class="combined-count">${summaries.length} tenant</span></div>
      <p class="combined-date">${ticketDateDescription(dates)}</p>
      <div class="combined-main-value"><span>${headlineLabel}</span><strong>${rupiah(headline)}</strong></div>
      <div class="combined-hero-stats"><div><span>Penjualan</span><strong>${totals.slices}<small> slice</small></strong></div><div><span>${secondaryLabel}</span><strong>${secondaryValue}</strong></div></div>
    </div>
    ${!isStaff ? `<div class="combined-ledger">${[["Modal (HPP)", totals.cost, "inventory_2"], ["Bagi hasil", totals.ownerShare, "handshake"], ["Pengeluaran", totals.expenses, "payments"]].map(([label, value, icon]) => `<div><span><span class="material-symbols-outlined" aria-hidden="true">${icon}</span>${label}</span><strong>${rupiah(value)}</strong></div>`).join("")}</div>` : ""}
  </section>` : `<section class="panel tenant-empty-state combined-empty" role="status"><span class="material-symbols-outlined" aria-hidden="true">receipt_long</span><h3>Belum ada data</h3><p>Belum ada transaksi dari seluruh tenant pada tanggal ini.</p><small>${ticketDateDescription(dates)}</small></section>`}
  <section class="panel combined-tenant-list" aria-label="Rincian per tenant">
    <div class="combined-list-heading"><h3>${isStaff ? "Rincian staff" : "Ringkasan tenant"}</h3><span>${tenantsWithData} berdata</span></div>
    ${summaries.map(({ snapshot, summary, hasData }) => `<button class="combined-tenant-row ${hasData ? "" : "is-empty"}" type="button" data-select-tenant="${escapeHtml(snapshot.tenant.id)}" aria-label="Lihat detail ${escapeHtml(staffTenantLabel(snapshot.tenant))}">
      <span class="combined-avatar" aria-hidden="true">${escapeHtml(getInitials(snapshot.tenant.staff_name || tenantLabel(snapshot.tenant)))}</span>
      <span class="combined-tenant-copy"><strong>${escapeHtml(snapshot.tenant.staff_name || "Staff")}</strong><span>${escapeHtml(tenantLabel(snapshot.tenant))}${snapshot.tenant.active ? "" : " · Nonaktif"}</span>${hasData && !isStaff ? `<small>Bagi hasil ${rupiah(summary.ownerShare)}</small>` : ""}</span>
      <span class="combined-tenant-value">${hasData ? `<strong>${rupiah(isStaff ? summary.ownerShare : summary.revenue)}</strong><small>${summary.slices} slice</small>` : `<small class="combined-no-data">Belum ada data</small>`}</span>
      <span class="material-symbols-outlined combined-row-arrow" aria-hidden="true">chevron_right</span>
    </button>`).join("")}
    <p class="combined-footnote">${isStaff ? "Penghasilan" : "Bagi hasil"} mengikuti fee masing-masing tenant.</p>
  </section>
  </div>`;
}
