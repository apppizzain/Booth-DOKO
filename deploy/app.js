const PIZZA_IMAGES = {
  pepperoni:
    "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80",
  margherita:
    "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=500&q=80",
  beef:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
  veggie:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80",
};

const DEFAULT_ADMIN_PIN = "0000";
const SUPABASE_URL = "https://qipqhopjbwjquschrggt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcHFob3BqYndqcXVzY2hyZ2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NjQ1MDYsImV4cCI6MjA5NzQ0MDUwNn0._LAfxDUc7JDb8SfGjL-XwoeC2ECbrJvDoEKx4_iTuH0";
const DOKO_APP_ID = "pizzain_doko_v1";
const APP_ROUTES = new Set(["admin", "input", "view"]);
const GAS_PHOTO_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbyiQGAfG_AJSwMAaGTwsl1G5CiYmgKgBXyOuji9nsG4VOJ5hegolFL_bdroypwc8cT1AQ/exec";

const store = {
  ownerFee: 2000,
  adminView: "dashboard",
  attendanceFilter: "in",
  adminUnlocked: false,
  adminPin: DEFAULT_ADMIN_PIN,
  adminPinInput: "",
  adminPasswordForm: {
    pin: "",
  },
  inputPage: "attendance",
  viewerFilter: "today",
  rangeStart: isoDate(new Date()),
  rangeEnd: isoDate(new Date()),
  rangeAnchor: null,
  viewerLoading: false,
  submitLoading: false,
  dbLoading: false,
  dbReady: false,
  dbError: "",
  editingPizzaId: null,
  pizzaFormOpen: false,
  deleteConfirmPizzaId: null,
  attendanceMode: null,
  cameraStream: null,
  cameraFacing: "user",
  capturedPhoto: null,
  attendancePhotoPreview: null,
  pizzaForm: {
    name: "",
    cost: "",
    price: "",
    active: true,
  },
  inputDraft: {
    sales: {},
    stock: {},
  },
  dailySubmitted: {},
  timers: [
    { id: "oven-1", label: "Timer 1", minutes: 8, remaining: 480, running: false, finished: false, endsAt: null },
    { id: "oven-2", label: "Timer 2", minutes: 8, remaining: 480, running: false, finished: false, endsAt: null },
    { id: "oven-3", label: "Timer 3", minutes: 8, remaining: 480, running: false, finished: false, endsAt: null },
    { id: "oven-4", label: "Timer 4", minutes: 8, remaining: 480, running: false, finished: false, endsAt: null },
  ],
  attendance: {
    [isoDate(new Date())]: {
      in: null,
      out: null,
    },
  },
  pizzas: [
    {
      id: "pepperoni",
      name: "Pepperoni Classic",
      cost: 11000,
      price: 25000,
      active: true,
      image: PIZZA_IMAGES.pepperoni,
    },
    {
      id: "margherita",
      name: "Margherita Mozza",
      cost: 9000,
      price: 22000,
      active: true,
      image: PIZZA_IMAGES.margherita,
    },
    {
      id: "beef",
      name: "Beef BBQ Slice",
      cost: 12500,
      price: 28000,
      active: true,
      image: PIZZA_IMAGES.beef,
    },
    {
      id: "veggie",
      name: "Veggie Coral",
      cost: 8500,
      price: 21000,
      active: false,
      image: PIZZA_IMAGES.veggie,
    },
  ],
  records: {
    [isoDate(new Date())]: {
      sales: { pepperoni: 18, margherita: 14, beef: 11 },
      stock: { pepperoni: 6, margherita: 8, beef: 3 },
    },
    [isoDate(addDays(new Date(), -1))]: {
      sales: { pepperoni: 15, margherita: 13, beef: 9 },
      stock: { pepperoni: 5, margherita: 4, beef: 7 },
    },
    [isoDate(addDays(new Date(), -2))]: {
      sales: { pepperoni: 12, margherita: 10, beef: 8 },
      stock: { pepperoni: 7, margherita: 9, beef: 4 },
    },
    [isoDate(addDays(new Date(), -3))]: {
      sales: { pepperoni: 16, margherita: 9, beef: 13 },
      stock: { pepperoni: 3, margherita: 10, beef: 2 },
    },
  },
};

const app = document.getElementById("app");
const toast = document.getElementById("toast");

window.addEventListener("popstate", render);
document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleChange);
document.addEventListener("keydown", handleKeydown);
setInterval(updateTimers, 1000);

render();
initializeDatabase();

async function initializeDatabase() {
  store.dbLoading = true;
  store.dbError = "";
  render();

  try {
    await loadRemoteData();
    store.dbReady = true;
  } catch (error) {
    store.dbReady = false;
    store.dbError = getErrorMessage(error);
    console.error("Supabase sync failed", error);
    showToast("Database belum siap. Jalankan schema DOKO dulu.", "error");
  } finally {
    store.dbLoading = false;
    render();
  }
}

async function loadRemoteData() {
  const [settingsRows, pizzaRows, recordRows, attendanceRows] = await Promise.all([
    dbSelect("doko_settings", `app_id=eq.${DOKO_APP_ID}&select=owner_fee&limit=1`),
    dbSelect("doko_pizzas", `app_id=eq.${DOKO_APP_ID}&select=id,name,cost,price,active,image,sort_order&order=sort_order.asc`),
    dbSelect("doko_daily_records", `app_id=eq.${DOKO_APP_ID}&select=record_date,sales,stock,submitted_at&order=record_date.desc`),
    dbSelect("doko_attendance", `app_id=eq.${DOKO_APP_ID}&select=record_date,in_record,out_record&order=record_date.desc`),
  ]);

  if (settingsRows[0]) {
    store.ownerFee = Number(settingsRows[0].owner_fee) || store.ownerFee;
  } else {
    await dbUpsertSetting(store.ownerFee);
  }
  await loadAdminPinSetting();

  if (pizzaRows.length) {
    store.pizzas = pizzaRows.map((row) => ({
      id: row.id,
      name: row.name,
      cost: Number(row.cost) || 0,
      price: Number(row.price) || 0,
      active: Boolean(row.active),
      image: row.image || PIZZA_IMAGES.veggie,
    }));
  } else {
    await dbUpsertPizzas(store.pizzas);
  }

  store.records = {};
  store.dailySubmitted = {};
  recordRows.forEach((row) => {
    store.records[row.record_date] = {
      sales: cleanDailyValues(row.sales),
      stock: cleanDailyValues(row.stock),
    };
    store.dailySubmitted[row.record_date] = parseDailyProgress(row);
  });

  store.attendance = {};
  attendanceRows.forEach((row) => {
    store.attendance[row.record_date] = {
      in: row.in_record || null,
      out: row.out_record || null,
    };
  });

  const today = isoDate(new Date());
  if (!store.attendance[today]) store.attendance[today] = { in: null, out: null };
  if (store.records[today]) {
    store.inputDraft.sales = { ...store.records[today].sales };
    store.inputDraft.stock = { ...store.records[today].stock };
  }
}

async function dbSelect(table, query) {
  return dbRequest(`${table}?${query}`);
}

async function loadAdminPinSetting() {
  try {
    const rows = await dbSelect("doko_settings", `app_id=eq.${DOKO_APP_ID}&select=admin_pin&limit=1`);
    const pin = String(rows?.[0]?.admin_pin || "").replace(/\D/g, "").slice(0, 4);
    if (pin.length === 4) store.adminPin = pin;
  } catch (error) {
    console.warn("Admin PIN column is not ready yet", error);
    store.adminPin = DEFAULT_ADMIN_PIN;
  }
}

async function dbUpsert(table, row, conflictColumns) {
  return dbRequest(`${table}?on_conflict=${conflictColumns}`, {
    method: "POST",
    body: row,
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function dbRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Database error ${response.status}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function dbUpsertSetting(ownerFee) {
  return dbUpsert(
    "doko_settings",
    { app_id: DOKO_APP_ID, owner_fee: ownerFee, updated_at: new Date().toISOString() },
    "app_id"
  );
}

async function dbUpsertAdminPin(pin) {
  return dbUpsert(
    "doko_settings",
    {
      app_id: DOKO_APP_ID,
      owner_fee: store.ownerFee,
      admin_pin: pin,
      updated_at: new Date().toISOString(),
    },
    "app_id"
  );
}

async function dbUpsertPizza(pizza, sortOrder = store.pizzas.findIndex((item) => item.id === pizza.id)) {
  return dbUpsert(
    "doko_pizzas",
    {
      app_id: DOKO_APP_ID,
      id: pizza.id,
      name: pizza.name,
      cost: pizza.cost,
      price: pizza.price,
      active: pizza.active,
      image: pizza.image || PIZZA_IMAGES.veggie,
      sort_order: Math.max(0, sortOrder),
      updated_at: new Date().toISOString(),
    },
    "app_id,id"
  );
}


async function dbUpsertPizzas(pizzas) {
  return dbRequest("doko_pizzas?on_conflict=app_id,id", {
    method: "POST",
    body: pizzas.map((pizza, index) => ({
      app_id: DOKO_APP_ID,
      id: pizza.id,
      name: pizza.name,
      cost: pizza.cost,
      price: pizza.price,
      active: pizza.active,
      image: pizza.image || PIZZA_IMAGES.veggie,
      sort_order: index,
      updated_at: new Date().toISOString(),
    })),
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}
async function dbDeletePizza(id) {
  return dbRequest(`doko_pizzas?app_id=eq.${DOKO_APP_ID}&id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

async function dbUpsertDailyRecord(date) {
  const record = store.records[date] || { sales: {}, stock: {} };
  const progress = getDailyProgress(date);
  return dbUpsert(
    "doko_daily_records",
    {
      app_id: DOKO_APP_ID,
      record_date: date,
      sales: withSubmittedFlag(record.sales, progress.sales),
      stock: withSubmittedFlag(record.stock, progress.stock),
      submitted_at: new Date().toISOString(),
    },
    "app_id,record_date"
  );
}

async function dbUpsertAttendance(date) {
  const record = store.attendance[date] || { in: null, out: null };
  return dbUpsert(
    "doko_attendance",
    {
      app_id: DOKO_APP_ID,
      record_date: date,
      in_record: record.in,
      out_record: record.out,
      updated_at: new Date().toISOString(),
    },
    "app_id,record_date"
  );
}

function cleanDailyValues(values) {
  return Object.fromEntries(
    Object.entries(values || {}).filter(([key]) => key !== "__submitted")
  );
}

function withSubmittedFlag(values, submitted) {
  return { ...(values || {}), __submitted: Boolean(submitted) };
}

function hasSubmissionMarkers(row) {
  return Boolean(
    row?.sales && Object.prototype.hasOwnProperty.call(row.sales, "__submitted") ||
    row?.stock && Object.prototype.hasOwnProperty.call(row.stock, "__submitted")
  );
}

function parseDailyProgress(row) {
  if (hasSubmissionMarkers(row)) {
    return {
      sales: Boolean(row.sales?.__submitted),
      stock: Boolean(row.stock?.__submitted),
    };
  }
  const submitted = Boolean(row?.submitted_at);
  return { sales: submitted, stock: submitted };
}

function getErrorMessage(error) {
  if (!error) return "Database error";
  if (typeof error === "string") return error;
  return error.message || "Database error";
}

async function persistDatabaseWrite(action) {
  try {
    await action();
    store.dbReady = true;
    store.dbError = "";
    return true;
  } catch (error) {
    store.dbReady = false;
    store.dbError = getErrorMessage(error);
    console.error("Supabase write failed", error);
    showToast("Gagal menyimpan ke database. Cek schema DOKO.", "error");
    return false;
  }
}
function render() {
  const route = normalizeRoute(location.pathname);

  if (route === "/admin") {
    app.innerHTML = shell("admin", store.adminUnlocked ? renderAdmin() : renderAdminPin());
  } else if (route === "/input") {
    app.innerHTML = shell("input", renderInput());
  } else if (route === "/view") {
    app.innerHTML = shell("viewer", renderViewer());
  } else {
    app.innerHTML = "";
  }

  if (store.attendanceMode) {
    app.insertAdjacentHTML("beforeend", renderCameraModal());
    startCamera();
  }

  if (store.attendancePhotoPreview) {
    app.insertAdjacentHTML("beforeend", renderPhotoPreviewModal());
  }
}

function shell(role, content) {
  const roleLabel = {
    admin: "Halaman admin",
    input: "Input penjualan harian",
    viewer: "Laporan bagi hasil tenant Pizzain",
  }[role];

  return `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="${roleHref(role)}" data-link aria-label="Pizzain DOKO ${role}">
          <span class="brand-mark"><img src="${assetPath("assets/logo-pizzain-apk.jpg")}" alt="Logo Pizzain DOKO" /></span>
          <span>
            <h1>Pizzain DOKO</h1>
            <p>${roleLabel}</p>
          </span>
        </a>
      </header>
      ${content}
    </div>
  `;
}

function appBasePath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (APP_ROUTES.has(last)) parts.pop();
  return `/${parts.join("/")}${parts.length ? "/" : ""}`;
}

function assetPath(path) {
  return `${appBasePath()}${path}`;
}

function roleHref(role) {
  const route = role === "viewer" ? "view" : role;
  return APP_ROUTES.has(route) ? `${appBasePath()}${route}/` : appBasePath();
}

function renderAdminPin() {
  const pinDots = Array.from({ length: 4 }, (_, index) => `<span class="pin-dot ${store.adminPinInput.length > index ? "filled" : ""}"></span>`).join("");

  return `
    <main class="main narrow admin-pin-screen">
      <section class="panel admin-pin-card">
        <span class="brand-mark"><img src="${assetPath("assets/logo-pizzain-apk.jpg")}" alt="Logo Pizzain DOKO" /></span>
        <p class="pin-help">Masukkan Pin Admin</p>
        <div class="pin-entry" data-pin-focus>
          <span class="pin-label">PIN Admin</span>
          <div class="pin-dots" aria-hidden="true">${pinDots}</div>
          <input id="admin-pin" class="pin-hidden-input" data-admin-pin type="password" inputmode="numeric" maxlength="4" value="${escapeHtml(store.adminPinInput)}" aria-label="PIN Admin" autofocus />
        </div>
        <button class="btn full" data-unlock-admin>
          <span class="material-symbols-outlined">lock_open</span>
          Masuk
        </button>
      </section>
    </main>
  `;
}

function renderAdmin() {
  if (store.adminView === "reports") {
    store.adminView = "dashboard";
  }
  if (store.adminView === "pizza" || store.adminView === "fee") {
    store.adminView = "settings";
  }
  const summary = getSummaryForDates(getViewerDates());
  return `
    <main class="main narrow admin-main">
      <nav class="input-tabs admin-tabs" aria-label="Menu admin">
        ${adminMenuButton("dashboard", "space_dashboard", "Dashboard")}
        ${adminMenuButton("attendance", "photo_camera", "Absensi")}
        ${adminMenuButton("settings", "settings", "Setting")}
      </nav>
      <section class="stack">
        ${renderAdminContent(summary)}
      </section>
    </main>
  `;
}

function adminMenuButton(view, icon, label) {
  return `
    <button class="${store.adminView === view ? "active" : ""}" data-admin-view="${view}">
      <span class="material-symbols-outlined">${icon}</span>
      ${label}
    </button>
  `;
}

function renderAdminContent(summary) {
  if (store.adminView === "settings") return renderManagePizza();
  if (store.adminView === "attendance") return renderAttendanceHistory();
  return renderAdminDashboard(summary);
}

function renderAdminDashboard(summary) {
  const selectedDates = getViewerDates();
  const showStock = selectedDates.length === 1;
  return `
    <section class="panel stack viewer-filter-panel admin-filter-panel">
      <div class="segmented" role="tablist" aria-label="Filter tanggal dashboard admin">
        ${viewerFilterButton("today", "Hari Ini")}
        ${viewerFilterButton("yesterday", "Kemarin")}
        ${viewerFilterButton("custom", "Custom")}
      </div>
      ${store.viewerFilter === "custom" ? renderCalendarRange() : ""}
      <div class="loading-line">${store.viewerLoading ? `<span class="loading-dot"></span>Memuat laporan...` : `<span></span>${viewerDateDescription(selectedDates)}`}</div>
    </section>
    <section class="viewer-report-summary admin-report-summary">
      <div class="viewer-card-head">
        <h3>Laporan Penjualan</h3>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Penjualan</span>
        </div>
        <strong class="viewer-summary-value">${summary.slices} slice</strong>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Omzet</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.revenue)}</strong>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Modal</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.cost)}</strong>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Bagi Hasil DOKO</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.ownerShare)}</strong>
      </div>
      <div class="viewer-summary-row highlight">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Laba</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.net)}</strong>
      </div>
    </section>
    <section class="panel admin-list-panel">
      <div class="admin-list-head">
        <h3>Ringkasan Penjualan</h3>
        <span>${summary.slices} slice</span>
      </div>
      ${renderAdminVariantList(selectedDates, "sales")}
    </section>
    ${
      showStock
        ? `<section class="panel admin-list-panel">
            <div class="admin-list-head secondary">
              <h3>Ringkasan Stok Pizza</h3>
              <span>${getStockTotalForDate(selectedDates[0])} Slice</span>
            </div>
            ${renderAdminVariantList(selectedDates, "stock")}
          </section>`
        : ""
    }
  `;
}

function renderAdminVariantList(dates, type) {
  const rows = store.pizzas
    .filter((pizza) => pizza.active)
    .map((pizza) => {
      let sold = 0;
      let stock = 0;
      dates.forEach((date) => {
        sold += store.records[date]?.sales?.[pizza.id] || 0;
        stock += store.records[date]?.stock?.[pizza.id] || 0;
      });
      return { pizza, sold, stock };
    });

  const isStock = type === "stock";
  return `
    <div class="admin-compact-list">
      ${rows
        .map(
          ({ pizza, sold, stock }) => `
            <article class="admin-compact-row">
              <div>
                <h4>${pizza.name}</h4>
              </div>
              <div class="admin-compact-values">
                <span><strong>${isStock ? stock : sold}</strong> PCS</span>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function getStockTotalForDate(date) {
  const stock = store.records[date]?.stock || {};
  return store.pizzas.filter((pizza) => pizza.active).reduce((total, pizza) => total + (stock[pizza.id] || 0), 0);
}

function renderManagePizza() {
  const showForm = store.pizzaFormOpen || store.editingPizzaId;
  return `
    <section class="panel product-list-panel">
      <div class="product-panel-head">
        <h3>Daftar Produk</h3>
        <button class="btn product-add-btn" type="button" data-add-pizza>
          <span class="material-symbols-outlined">add</span>
          Produk
        </button>
      </div>
      <div class="stack product-list">
        ${store.pizzas.map(renderPizzaAdminRow).join("")}
      </div>
    </section>
    ${showForm ? `
      <section class="panel product-form-panel compact-product-form">
        <div class="product-form-head">
          <div>
            <span>Produk</span>
            <h3>${store.editingPizzaId ? "Edit Produk" : "Tambah Produk"}</h3>
          </div>
          <button class="icon-btn form-close-btn" type="button" data-close-pizza-form aria-label="Tutup form produk">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <form class="compact-product-grid" data-pizza-form>
          <label class="compact-product-field" for="pizza-name">
            <span>Nama</span>
            <input id="pizza-name" data-form-field="name" value="${escapeHtml(store.pizzaForm.name)}" placeholder="Tuna Melt Slice" />
          </label>
          <label class="compact-product-field" for="pizza-cost">
            <span>Modal</span>
            <input id="pizza-cost" data-form-field="cost" inputmode="numeric" value="${escapeHtml(store.pizzaForm.cost)}" placeholder="10000" />
          </label>
          <label class="compact-product-field" for="pizza-price">
            <span>Jual</span>
            <input id="pizza-price" data-form-field="price" inputmode="numeric" value="${escapeHtml(store.pizzaForm.price)}" placeholder="25000" />
          </label>
          <div class="product-form-actions">
            <label class="switch compact-switch">
              <input type="checkbox" data-form-field="active" ${store.pizzaForm.active ? "checked" : ""} />
              <span>Aktif</span>
            </label>
            <button class="btn product-save-btn" type="button" data-save-pizza>Simpan</button>
          </div>
        </form>
      </section>
    ` : ""}
    ${renderOwnerFee()}
    ${renderAdminPassword()}
  `;
}

function renderPizzaAdminRow(pizza) {
  return `
    <article class="variant-row">
      <div class="pizza-info">
        <span class="pizza-initial">${getInitials(pizza.name)}</span>
        <div>
          <h4>${pizza.name}</h4>
          <p>Modal ${rupiah(pizza.cost)} | Jual ${rupiah(pizza.price)}</p>
          <span class="chip ${pizza.active ? "green" : "gray"}">${pizza.active ? "Aktif" : "Nonaktif"}</span>
        </div>
      </div>
      <div class="product-actions">
        <button class="icon-btn" data-edit-pizza="${pizza.id}" aria-label="Edit ${pizza.name}">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="icon-btn danger" data-delete-pizza="${pizza.id}" aria-label="Hapus ${pizza.name}">
          <span class="material-symbols-outlined">delete</span>
        </button>
        <label class="switch" aria-label="Status ${pizza.name}">
          <input type="checkbox" data-toggle-pizza="${pizza.id}" ${pizza.active ? "checked" : ""} />
        </label>
      </div>
    </article>
  `;
}

function renderOwnerFee() {
  return `
    <section class="panel fee-compact-panel">
      <div class="fee-compact-head">
        <div>
          <span>Fee Pemilik</span>
          <strong>${rupiah(store.ownerFee)} / slice</strong>
        </div>
        <button class="btn fee-save-btn" data-save-fee aria-label="Simpan fee pemilik">Simpan</button>
      </div>
      <label class="fee-compact-field" for="owner-fee">
        <span>Nominal</span>
        <input id="owner-fee" data-owner-fee inputmode="numeric" value="${store.ownerFee}" />
      </label>
    </section>
  `;
}

function renderAdminPassword() {
  return `
    <section class="panel password-compact-panel">
      <div class="password-compact-head">
        <div>
          <span>Password Admin</span>
          <strong>PIN 4 digit</strong>
        </div>
        <button class="btn password-save-btn" data-save-admin-password aria-label="Simpan password admin">Simpan</button>
      </div>
      <label class="password-compact-field" for="admin-password-new">
        <span>PIN Baru</span>
        <input id="admin-password-new" data-admin-password-pin type="password" inputmode="numeric" maxlength="4" value="${escapeHtml(store.adminPasswordForm.pin)}" placeholder="0000" />
      </label>
    </section>
  `;
}

function renderAttendanceHistory() {
  const dates = Object.keys(store.attendance).sort().reverse();
  const recap = getMonthlyAttendanceRecap(new Date());
  const filteredDates = getFilteredAttendanceDates(dates);
  return `
    <section class="panel attendance-recap-panel">
      <div class="attendance-recap-head">
        <div>
          <span>Rekap Kehadiran</span>
          <h3>${recap.monthLabel}</h3>
        </div>
        <strong>${recap.presentDays} hari</strong>
      </div>
      <div class="attendance-recap-grid">
        ${attendanceRecapButton("in", "Masuk", recap.checkIns)}
        ${attendanceRecapButton("early-out", "Pulang Cepat", recap.earlyCheckOuts)}
        ${attendanceRecapButton("ontime", "Tepat Waktu", recap.onTime)}
        ${attendanceRecapButton("late", "Terlambat", recap.late)}
      </div>
    </section>
    <section class="panel attendance-history-panel">
      <div class="history-head">
        <h3>${getAttendanceFilterTitle()}</h3>
      </div>
      <div class="stack attendance-history-list">
        ${filteredDates.map(renderAttendanceRecord).join("") || `<p class="muted">Belum ada data ${getAttendanceFilterLabel().toLowerCase()}.</p>`}
      </div>
    </section>
  `;
}

function attendanceRecapButton(filter, label, value) {
  return `
    <button class="attendance-recap-filter ${store.attendanceFilter === filter ? "active" : ""}" data-attendance-filter="${filter}">
      <span>${label}</span>
      <strong>${value}</strong>
    </button>
  `;
}

function getMonthlyAttendanceRecap(date) {
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const records = Object.entries(store.attendance).filter(([recordDate]) => recordDate.startsWith(monthKey));

  return records.reduce(
    (recap, [, record]) => {
      const hasCheckIn = Boolean(record.in);
      const hasCheckOut = Boolean(record.out);
      if (hasCheckIn || hasCheckOut) recap.presentDays += 1;
      if (hasCheckIn) recap.checkIns += 1;
      if (record.out?.status === "early") recap.earlyCheckOuts += 1;
      if (record.in?.status === "ontime") recap.onTime += 1;
      if (record.in?.status === "late") recap.late += 1;
      return recap;
    },
    { monthLabel, presentDays: 0, checkIns: 0, earlyCheckOuts: 0, onTime: 0, late: 0 }
  );
}

function renderAttendanceRecord(date) {
  const item = store.attendance[date] || {};
  const type = store.attendanceFilter === "early-out" ? "out" : "in";
  const record = item[type];
  const feedback = record ? getAttendanceFeedbackFromTime(type, record.time) : null;
  return `
    <article class="attendance-record">
      <div>
        <h4>${formatDate(date)}</h4>
        <p>${type === "out" ? "Pulang" : "Masuk"}: ${record?.time || "-"}</p>
        ${feedback ? `<span class="attendance-record-badge ${feedback.status}">${feedback.badge}</span>` : ""}
      </div>
      <div class="counter">
        ${renderAttendancePhotoThumb(record, type, date)}
      </div>
    </article>
  `;
}

function getFilteredAttendanceDates(dates) {
  return dates.filter((date) => {
    const record = store.attendance[date] || {};
    if (store.attendanceFilter === "early-out") return record.out?.status === "early";
    if (store.attendanceFilter === "ontime") return record.in?.status === "ontime";
    if (store.attendanceFilter === "late") return record.in?.status === "late";
    return Boolean(record.in);
  });
}

function getAttendanceFilterLabel() {
  if (store.attendanceFilter === "early-out") return "Pulang Cepat";
  if (store.attendanceFilter === "ontime") return "Tepat Waktu";
  if (store.attendanceFilter === "late") return "Terlambat";
  return "Masuk";
}

function getAttendanceFilterTitle() {
  return `Riwayat Absensi ${getAttendanceFilterLabel()}`;
}

function isGasPhotoUrl(src) {
  return String(src || "").includes("action=view") || String(src || "").includes("script.google.com/macros/");
}

function renderPhotoMedia(src, title, compact = false) {
  const safeSrc = escapeHtml(src);
  const safeTitle = escapeHtml(title || "Foto absensi");
  if (isGasPhotoUrl(src)) {
    return `<iframe class="${compact ? "photo-thumb photo-frame-thumb" : "photo-preview-frame"}" title="${safeTitle}" src="${safeSrc}" loading="lazy"></iframe>`;
  }
  return `<img class="${compact ? "photo-thumb" : "photo-preview-image"}" alt="${safeTitle}" src="${safeSrc}" />`;
}

function renderAttendancePhotoThumb(record, type, date) {
  const label = type === "out" ? "Pulang" : "Masuk";
  if (!record?.photo) return `<span class="photo-thumb photo-empty">${label}</span>`;
  const title = `${label} - ${formatDate(date)} ${record.time || ""}`.trim();
  return `
    <button class="photo-thumb-button" data-preview-photo="${escapeHtml(record.photo)}" data-preview-title="${escapeHtml(title)}" aria-label="Preview foto absen ${label.toLowerCase()}">
      ${renderPhotoMedia(record.photo, `Foto absen ${label.toLowerCase()}`, true)}
    </button>
  `;
}

function renderPhotoPreviewModal() {
  const preview = store.attendancePhotoPreview;
  return `
    <div class="modal open photo-preview-modal" role="dialog" aria-modal="true" aria-label="Preview foto absensi">
      <section class="photo-preview-card">
        <header>
          <div>
            <span>Foto Absensi</span>
            <h3>${escapeHtml(preview.title || "Preview")}</h3>
          </div>
          <button class="icon-btn" data-close-photo-preview aria-label="Tutup preview foto">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>
        ${renderPhotoMedia(preview.src, preview.title || "Preview foto absensi")}
      </section>
    </div>
  `;
}
function renderInput(options = {}) {
  const today = isoDate(new Date());
  const attendance = store.attendance[today] || { in: null, out: null };
  const canSubmitDaily = Boolean(attendance.in);
  const showSubmit = !options.preview && (store.inputPage === "sales" || store.inputPage === "stock");
  const activePizzas = store.pizzas.filter((pizza) => pizza.active);
  const previewClass = options.preview ? "" : "main narrow";

  return `
    <main class="${previewClass}">
      <nav class="input-tabs" aria-label="Halaman input">
        ${inputPageButton("attendance", "badge", "Absensi")}
        ${inputPageButton("sales", "point_of_sale", "Penjualan")}
        ${inputPageButton("stock", "inventory_2", "Stok")}
        ${inputPageButton("timer", "timer", "Timer")}
      </nav>
      ${renderInputPage({ today, attendance, activePizzas })}
    </main>
    ${showSubmit ? renderSubmitBar(canSubmitDaily) : ""}
  `;
}

function inputPageButton(page, icon, label) {
  return `
    <button class="${store.inputPage === page ? "active" : ""}" data-input-page="${page}">
      <span class="material-symbols-outlined">${icon}</span>
      ${label}
    </button>
  `;
}

function renderInputPage({ today, attendance, activePizzas }) {
  if (store.inputPage === "sales") return renderInputSales(activePizzas);
  if (store.inputPage === "stock") return renderInputStock(activePizzas);
  if (store.inputPage === "timer") return renderInputTimers();
  return renderInputAttendance(today, attendance);
}

function renderInputAttendance(today, attendance) {
  const canCheckOut = Boolean(attendance.in && isDailySubmitted(today));
  return `
    <section class="panel stack">
      <div class="section-title">
        <span class="icon-tile"><span class="material-symbols-outlined">badge</span></span>
        <div>
          <h3>Absensi Hari Ini</h3>
          <p>${formatDate(today)} | Jam kerja 16.00 - 23.00</p>
        </div>
      </div>
      <div class="attendance-actions">
        ${renderAttendanceAction("in", attendance.in, "Masuk", "how_to_reg")}
        ${renderAttendanceAction("out", attendance.out, "Pulang", "logout", {
          disabled: !canCheckOut,
          hint: getCheckoutHint(today, attendance),
        })}
      </div>
    </section>
  `;
}

function renderInputSales(activePizzas) {
  const totalSales = sumDraft("sales");
  return `
    <section class="panel sales-panel">
      <div class="section-title solid">
        <span class="icon-tile"><span class="material-symbols-outlined">point_of_sale</span></span>
        <div>
          <h3>Penjualan Slice</h3>
          <p>Isi jumlah slice yang terjual hari ini</p>
        </div>
      </div>
      <div class="stack">
        ${activePizzas.map((pizza) => renderCounterRow(pizza, "sales")).join("")}
      </div>
      <div class="total-band">
        <span>Total Slice Terjual</span>
        <strong>${totalSales}</strong>
      </div>
    </section>
  `;
}

function renderInputStock(activePizzas) {
  const totalStock = sumDraft("stock");
  return `
    <section class="panel stock-panel">
      <div class="section-title coral">
        <span class="icon-tile"><span class="material-symbols-outlined">inventory_2</span></span>
        <div>
          <h3>Stok Pizza Tersisa</h3>
          <p>Isi jumlah slice yang masih tersisa</p>
        </div>
      </div>
      <div class="stack">
        ${activePizzas.map((pizza) => renderCounterRow(pizza, "stock")).join("")}
      </div>
      <div class="total-band">
        <span>Total Stok Tersisa</span>
        <strong>${totalStock}</strong>
      </div>
    </section>
  `;
}

function renderInputTimers() {
  return `
    <section class="panel timer-panel">
      <div class="section-title timer-title">
        <span class="icon-tile"><span class="material-symbols-outlined">timer</span></span>
        <div>
          <h3>Timer Panggang Pizza</h3>
          <p>Set menit panggang untuk tiap oven.</p>
        </div>
      </div>
      <div class="timer-grid">
        ${store.timers.map(renderTimerCard).join("")}
      </div>
    </section>
  `;
}

function renderTimerCard(timer) {
  if (timer.finished) {
    return `
      <article class="timer-card finished">
        <div class="timer-finished-body">
          <span class="material-symbols-outlined">notifications_active</span>
          <strong>Waktu habis</strong>
        </div>
        <button class="timer-icon-btn finished-reset" data-timer-reset="${timer.id}" aria-label="Reset ${timer.label}">
          <span class="material-symbols-outlined">restart_alt</span>
        </button>
      </article>
    `;
  }

  return `
    <article class="timer-card ${timer.running ? "running" : ""} ${timer.finished ? "finished" : ""}">
      <div class="timer-card-head">
        <div>
          <h4>${timer.label}</h4>
          <p>${timer.finished ? "Waktu habis" : timer.running ? "Sedang memanggang" : "Siap dipakai"}</p>
        </div>
        <span class="material-symbols-outlined">local_fire_department</span>
      </div>
      <div class="timer-time-row ${timer.running ? "is-running" : ""}">
        ${
          timer.running
            ? ""
            : `<button class="timer-step-btn" data-timer-minute-delta="${timer.id}" data-delta="-1" aria-label="Kurangi menit ${timer.label}">
                <span class="material-symbols-outlined">remove</span>
              </button>`
        }
        <strong class="timer-time">${formatTimer(timer.remaining)}</strong>
        ${
          timer.running
            ? ""
            : `<button class="timer-step-btn" data-timer-minute-delta="${timer.id}" data-delta="1" aria-label="Tambah menit ${timer.label}">
                <span class="material-symbols-outlined">add</span>
              </button>`
        }
      </div>
      <div class="timer-actions">
        ${
          timer.running
            ? `<button class="timer-icon-btn" data-timer-start="${timer.id}" aria-label="Pause ${timer.label}">
                <span class="material-symbols-outlined">pause</span>
              </button>`
            : `<button class="timer-icon-btn primary" data-timer-start="${timer.id}" aria-label="Mulai ${timer.label}">
                <span class="material-symbols-outlined">play_arrow</span>
              </button>`
        }
        <button class="timer-icon-btn" data-timer-reset="${timer.id}" aria-label="Reset ${timer.label}">
          <span class="material-symbols-outlined">restart_alt</span>
        </button>
      </div>
    </article>
  `;
}

function renderAttendanceAction(type, record, label, icon, options = {}) {
  if (record) {
    const feedback = getAttendanceFeedbackFromTime(type, record.time);
    return `
      <div class="attendance-result ${feedback.status}">
        <div class="attendance-result-head">
          <span class="detail-label">Absen ${label}</span>
        </div>
        <div class="attendance-time-row">
          <p>${record.time}</p>
          <span class="attendance-badge">${feedback.badge}</span>
        </div>
        <small>${feedback.message}</small>
      </div>
    `;
  }

  const secondary = type === "out" ? " secondary" : "";
  return `
    <button class="btn attendance-btn${secondary}" data-open-camera="${type}" ${options.disabled ? "disabled" : ""}>
      <span class="material-symbols-outlined">${icon}</span>
      <span>Absen ${label}${options.disabled ? `<small>${options.hint}</small>` : ""}</span>
    </button>
  `;
}

function renderCounterRow(pizza, type) {
  const value = store.inputDraft[type][pizza.id] || 0;
  return `
    <article class="variant-row input-counter-row ${type}-row">
      <div class="pizza-info">
        <span class="pizza-initial">${getInitials(pizza.name)}</span>
        <div>
          <h4>${pizza.name}</h4>
        </div>
      </div>
      <div class="counter" aria-label="${pizza.name} ${type}">
        <button class="counter-btn" data-counter="${type}" data-id="${pizza.id}" data-delta="-1" aria-label="Kurangi ${pizza.name}">
          <span class="material-symbols-outlined">remove</span>
        </button>
        <span class="count">${value}</span>
        <button class="counter-btn" data-counter="${type}" data-id="${pizza.id}" data-delta="1" aria-label="Tambah ${pizza.name}">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </article>
  `;
}

function renderSubmitBar(canSubmitDaily) {
  const pageLabel = store.inputPage === "stock" ? "Stok" : "Penjualan";
  const label = store.submitLoading
    ? `<span class="spinner"></span>Menyimpan...`
    : `<span class="material-symbols-outlined">send</span>Submit ${pageLabel}`;

  return `
    <div class="submit-bar">
      ${canSubmitDaily ? "" : `<p>Absen Masuk dulu untuk submit ${pageLabel.toLowerCase()}.</p>`}
      <button class="btn full" data-submit-daily ${store.submitLoading || !canSubmitDaily ? "disabled" : ""}>${label}</button>
    </div>
  `;
}

function renderViewer(options = {}) {
  const selectedDates = getViewerDates();
  const summary = getSummaryForDates(selectedDates);
  const isCustom = store.viewerFilter === "custom";
  const wrapperClass = options.preview ? "" : "main narrow";

  return `
    <main class="${wrapperClass}">
      <section class="panel stack viewer-filter-panel">
        <div class="segmented" role="tablist" aria-label="Filter tanggal laporan">
          ${viewerFilterButton("today", "Hari Ini")}
          ${viewerFilterButton("yesterday", "Kemarin")}
          ${viewerFilterButton("custom", "Custom")}
        </div>
        ${isCustom ? renderCalendarRange() : ""}
        <div class="loading-line">${store.viewerLoading ? `<span class="loading-dot"></span>Memuat laporan...` : `<span></span>${viewerDateDescription(selectedDates)}`}</div>
      </section>
      ${renderViewerTotals(summary, isCustom || selectedDates.length > 1)}
      <section class="panel viewer-list-panel">
        <div class="viewer-list-title">
          <h3>Detail Pizza Terjual</h3>
        </div>
        ${renderVariantReports(selectedDates, { showMoney: false, compact: true })}
      </section>
    </main>
  `;
}

function viewerFilterButton(filter, label) {
  return `<button class="${store.viewerFilter === filter ? "active" : ""}" data-viewer-filter="${filter}">${label}</button>`;
}

function renderViewerTotals(summary, rangeMode) {
  const feeFormula = `${summary.slices} slice x ${rupiah(store.ownerFee)} =`;
  const pizzainFormula = `${rupiah(summary.revenue)} - ${rupiah(summary.ownerShare)} =`;

  return `
    <section class="viewer-report-summary">
      <div class="viewer-card-head">
        <h3>Laporan Penjualan</h3>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Penjualan</span>
        </div>
        <strong class="viewer-summary-value">${summary.slices} slice</strong>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Bagi Hasil DOKO</span>
          <em class="viewer-summary-formula">${feeFormula}</em>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.ownerShare)}</strong>
      </div>
      <div class="viewer-summary-row highlight">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Omzet</span>
          <em class="viewer-summary-formula">${pizzainFormula}</em>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.afterFee)}</strong>
      </div>
    </section>
  `;
}

function renderCalendarRange() {
  const monthDate = new Date(`${store.rangeStart}T00:00:00`);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = first.getDay();
  const cells = [];

  for (let i = 0; i < offset; i += 1) {
    cells.push(`<span class="day muted"></span>`);
  }

  for (let day = 1; day <= days; day += 1) {
    const date = isoDate(new Date(year, month, day));
    const selected = date === store.rangeStart || date === store.rangeEnd;
    const inRange = date > store.rangeStart && date < store.rangeEnd;
    cells.push(
      `<button class="day available ${selected ? "selected" : ""} ${inRange ? "in-range" : ""}" data-range-day="${date}">${day}</button>`
    );
  }

  return `
    <div class="calendar">
      <div class="calendar-head">
        <strong>${monthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</strong>
        <span class="chip gray">${shortDate(store.rangeStart)} - ${shortDate(store.rangeEnd)}</span>
      </div>
      <div class="calendar-grid">
        ${["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => `<span class="weekday">${day}</span>`).join("")}
        ${cells.join("")}
      </div>
    </div>
  `;
}

function renderVariantReports(dates, options) {
  const rows = store.pizzas
    .filter((pizza) => pizza.active)
    .map((pizza) => {
      let sold = 0;
      let stock = 0;
      dates.forEach((date) => {
        sold += store.records[date]?.sales?.[pizza.id] || 0;
        stock += store.records[date]?.stock?.[pizza.id] || 0;
      });
      return { pizza, sold, stock };
    });

  if (options.compact) {
    return `
      <div class="viewer-report-list">
        ${rows
          .map(
            ({ pizza, sold }) => `
              <article class="viewer-report-row">
                <div class="viewer-report-name">
                  <h4>${pizza.name}</h4>
                  <p>${rupiah(pizza.price)} / slice</p>
                </div>
                <span class="viewer-sold-value"><strong>${sold}</strong> slice</span>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <div class="stack">
      ${rows
        .map(
          ({ pizza, sold, stock }) => `
            <article class="report-row">
              <div class="pizza-info">
                <span class="pizza-photo" style="background-image:url('${pizza.image}')"></span>
                <div>
                  <h4>${pizza.name}</h4>
                  <p>${options.showMoney ? `Jual ${rupiah(pizza.price)} | Modal ${rupiah(pizza.cost)}` : `Jual ${rupiah(pizza.price)} per slice`}</p>
                </div>
              </div>
              <div class="detail-grid">
                <div class="detail-cell"><span class="detail-label">Slice Laku</span><strong>${sold}</strong></div>
                <div class="detail-cell"><span class="detail-label">Stok Tersisa</span><strong>${stock}</strong></div>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCameraModal() {
  const modeLabel = store.attendanceMode === "in" ? "Absen Masuk" : "Absen Pulang";
  return `
    <div class="modal open" role="dialog" aria-modal="true" aria-label="Camera Attendance Screen">
      <section class="camera-screen">
        <header class="camera-top">
          <button class="icon-btn" data-close-camera aria-label="Tutup kamera"><span class="material-symbols-outlined">arrow_back</span></button>
          <div class="modal-title"><h2>${modeLabel}</h2></div>
        </header>
        <div class="camera-stage">
          ${
            store.capturedPhoto
              ? `<img alt="Preview foto absensi" src="${store.capturedPhoto}" />`
              : `<video id="camera-video" autoplay playsinline muted></video><div id="camera-fallback" class="camera-fallback"><p>Posisikan wajah di area tengah sebelum mengambil foto.</p></div>`
          }
          <div class="camera-guide"></div>
        </div>
        <footer class="camera-bottom">
          ${
            store.capturedPhoto
              ? `<div class="camera-actions">
                  <button class="btn secondary" data-retake-photo><span class="material-symbols-outlined">refresh</span>Ambil Ulang</button>
                  <button class="btn" data-save-attendance><span class="material-symbols-outlined">check_circle</span>Simpan Absensi</button>
                </div>`
              : `<div class="capture-actions">
                  <button class="capture-btn" data-capture-photo aria-label="Ambil foto"><span></span></button>
                  <button class="flip-btn" data-flip-camera aria-label="Flip kamera">
                    <span class="material-symbols-outlined">cameraswitch</span>
                  </button>
                </div>`
          }
        </footer>
      </section>
    </div>
  `;
}

function renderViewerBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="Navigasi viewer">
      <span class="tab active"><span class="material-symbols-outlined">analytics</span>Viewer</span>
    </nav>
  `;
}

function metric(label, value, extra = "", formula = "") {
  return `
    <article class="metric ${extra}">
      <span class="metric-label">${label}</span>
      ${formula ? `<em class="metric-formula">${formula}</em>` : ""}
      <strong>${value}</strong>
    </article>
  `;
}

function handleClick(event) {
  const link = event.target.closest("[data-link]");
  if (link) {
    event.preventDefault();
    history.pushState({}, "", link.getAttribute("href"));
    closeCamera();
    render();
    return;
  }

  if (event.target.closest("[data-confirm-delete-pizza]")) {
    confirmDeletePizza();
    return;
  }

  if (event.target.closest("[data-cancel-delete-pizza]")) {
    store.deleteConfirmPizzaId = null;
    hideToast();
    return;
  }

  const photoPreviewButton = event.target.closest("[data-preview-photo]");
  if (photoPreviewButton) {
    store.attendancePhotoPreview = {
      src: photoPreviewButton.dataset.previewPhoto,
      title: photoPreviewButton.dataset.previewTitle || "Preview foto",
    };
    render();
    return;
  }

  if (event.target.closest("[data-close-photo-preview]")) {
    store.attendancePhotoPreview = null;
    render();
    return;
  }

  const adminView = event.target.closest("[data-admin-view]")?.dataset.adminView;
  if (adminView) {
    store.adminView = adminView;
    render();
    return;
  }

  if (event.target.closest("[data-unlock-admin]")) {
    unlockAdmin();
    return;
  }

  if (event.target.closest("[data-pin-focus]")) {
    document.querySelector("[data-admin-pin]")?.focus();
    return;
  }

  const attendanceFilter = event.target.closest("[data-attendance-filter]")?.dataset.attendanceFilter;
  if (attendanceFilter) {
    store.attendanceFilter = attendanceFilter;
    render();
    return;
  }

  const inputPage = event.target.closest("[data-input-page]")?.dataset.inputPage;
  if (inputPage) {
    store.inputPage = inputPage;
    render();
    return;
  }

  const counter = event.target.closest("[data-counter]");
  if (counter) {
    const type = counter.dataset.counter;
    const id = counter.dataset.id;
    const delta = Number(counter.dataset.delta);
    store.inputDraft[type][id] = Math.max(0, (store.inputDraft[type][id] || 0) + delta);
    render();
    return;
  }

  const cameraButton = event.target.closest("[data-open-camera]");
  if (cameraButton) {
    store.attendanceMode = cameraButton.dataset.openCamera;
    store.capturedPhoto = null;
    render();
    return;
  }

  if (event.target.closest("[data-close-camera]")) {
    closeCamera();
    render();
    return;
  }

  if (event.target.closest("[data-capture-photo]")) {
    capturePhoto();
    return;
  }

  if (event.target.closest("[data-flip-camera]")) {
    flipCamera();
    return;
  }

  if (event.target.closest("[data-retake-photo]")) {
    store.capturedPhoto = null;
    render();
    return;
  }

  if (event.target.closest("[data-save-attendance]")) {
    saveAttendance();
    return;
  }

  if (event.target.closest("[data-submit-daily]")) {
    submitDailyData();
    return;
  }

  const timerStart = event.target.closest("[data-timer-start]")?.dataset.timerStart;
  if (timerStart) {
    toggleTimer(timerStart);
    return;
  }

  const timerReset = event.target.closest("[data-timer-reset]")?.dataset.timerReset;
  if (timerReset) {
    resetTimer(timerReset);
    render();
    return;
  }

  const timerMinuteButton = event.target.closest("[data-timer-minute-delta]");
  if (timerMinuteButton) {
    adjustTimerMinutes(timerMinuteButton.dataset.timerMinuteDelta, Number(timerMinuteButton.dataset.delta));
    render();
    return;
  }

  const viewerFilter = event.target.closest("[data-viewer-filter]")?.dataset.viewerFilter;
  if (viewerFilter) {
    setViewerFilter(viewerFilter);
    return;
  }

  const rangeDay = event.target.closest("[data-range-day]")?.dataset.rangeDay;
  if (rangeDay) {
    selectRangeDay(rangeDay);
    return;
  }

  if (event.target.closest("[data-add-pizza]")) {
    store.editingPizzaId = null;
    store.pizzaFormOpen = true;
    store.pizzaForm = { name: "", cost: "", price: "", active: true };
    render();
    focusPizzaForm();
    return;
  }

  if (event.target.closest("[data-close-pizza-form]")) {
    closePizzaForm();
    render();
    return;
  }
  const deletePizzaId = event.target.closest("[data-delete-pizza]")?.dataset.deletePizza;
  if (deletePizzaId) {
    requestDeletePizza(deletePizzaId);
    return;
  }

  const editPizzaId = event.target.closest("[data-edit-pizza]")?.dataset.editPizza;
  if (editPizzaId) {
    const pizza = store.pizzas.find((item) => item.id === editPizzaId);
    if (!pizza) {
      showToast("Produk tidak ditemukan.", "error");
      return;
    }
    store.editingPizzaId = editPizzaId;
    store.pizzaFormOpen = true;
    store.pizzaForm = {
      name: pizza.name,
      cost: String(pizza.cost),
      price: String(pizza.price),
      active: pizza.active,
    };
    render();
    focusPizzaForm();
    return;
  }

  if (event.target.closest("[data-save-pizza]")) {
    savePizza();
    return;
  }

  if (event.target.closest("[data-save-fee]")) {
    saveOwnerFee();
    return;
  }

  if (event.target.closest("[data-save-admin-password]")) {
    saveAdminPassword();
    return;
  }
}

function focusPizzaForm() {
  requestAnimationFrame(() => {
    const input = document.querySelector("#pizza-name");
    input?.focus();
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function closePizzaForm() {
  store.editingPizzaId = null;
  store.pizzaFormOpen = false;
  store.pizzaForm = { name: "", cost: "", price: "", active: true };
}

function requestDeletePizza(id) {
  const pizza = store.pizzas.find((item) => item.id === id);
  if (!pizza) {
    showToast("Produk tidak ditemukan.", "error");
    return;
  }
  store.deleteConfirmPizzaId = id;
  showConfirmToast(`Hapus ${pizza.name}?`);
}

async function confirmDeletePizza() {
  const id = store.deleteConfirmPizzaId;
  const pizza = store.pizzas.find((item) => item.id === id);
  if (!pizza) {
    store.deleteConfirmPizzaId = null;
    hideToast();
    showToast("Produk tidak ditemukan.", "error");
    return;
  }

  const previousPizzas = [...store.pizzas];
  const previousEditingId = store.editingPizzaId;
  const previousFormOpen = store.pizzaFormOpen;
  const previousForm = { ...store.pizzaForm };
  store.pizzas = store.pizzas.filter((item) => item.id !== id);
  if (store.editingPizzaId === id) closePizzaForm();
  store.deleteConfirmPizzaId = null;
  hideToast();
  render();

  const saved = await persistDatabaseWrite(() => dbDeletePizza(id));
  if (!saved) {
    store.pizzas = previousPizzas;
    store.editingPizzaId = previousEditingId;
    store.pizzaFormOpen = previousFormOpen;
    store.pizzaForm = previousForm;
    showToast("Produk belum terhapus dari database.", "error");
    render();
    return;
  }
  showToast("Produk berhasil dihapus", "success");
  render();
}

function saveOwnerFee() {
  const input = document.querySelector("[data-owner-fee]");
  const value = Number((input?.value || "").replace(/\D/g, ""));
  if (value <= 0) {
    showToast("Gagal menyimpan data. Coba lagi.", "error");
    return;
  }
  const previous = store.ownerFee;
  store.ownerFee = value;
  persistDatabaseWrite(() => dbUpsertSetting(value)).then((saved) => {
    if (!saved) store.ownerFee = previous;
    showToast(saved ? "Fee pemilik berhasil disimpan" : "Fee belum tersimpan ke database", saved ? "success" : "error");
    render();
  });
  render();
}
function saveAdminPassword() {
  const pin = store.adminPasswordForm.pin.replace(/\D/g, "").slice(0, 4);
  if (pin.length !== 4) {
    showToast("PIN admin harus 4 digit.", "error");
    return;
  }

  const previous = store.adminPin;
  store.adminPin = pin;
  persistDatabaseWrite(() => dbUpsertAdminPin(pin)).then((saved) => {
    if (!saved) store.adminPin = previous;
    if (saved) store.adminPasswordForm.pin = "";
    const passwordError = store.dbError.includes("admin_pin")
      ? "Kolom admin_pin belum ada. Jalankan supabase-doko-admin-pin.sql dulu."
      : "Password belum tersimpan ke database. Cek izin tabel doko_settings.";
    showToast(saved ? "Password admin berhasil disimpan" : passwordError, saved ? "success" : "error");
    render();
  });
  render();
}

function handleInput(event) {
  if (event.target.matches("[data-admin-pin]")) {
    store.adminPinInput = event.target.value.replace(/\D/g, "").slice(0, 4);
    event.target.value = store.adminPinInput;
    updateAdminPinDots();
    return;
  }

  if (event.target.matches("[data-admin-password-pin]")) {
    store.adminPasswordForm.pin = event.target.value.replace(/\D/g, "").slice(0, 4);
    event.target.value = store.adminPasswordForm.pin;
    return;
  }

  const field = event.target.dataset.formField;
  if (!field || field === "active") return;
  store.pizzaForm[field] = event.target.value;
}

function handleKeydown(event) {
  if (event.key === "Enter" && event.target.matches("[data-admin-pin]")) {
    event.preventDefault();
    unlockAdmin();
  }

  if (event.key === "Enter" && event.target.matches("[data-admin-password-pin]")) {
    event.preventDefault();
    saveAdminPassword();
  }
}

function updateAdminPinDots() {
  document.querySelectorAll(".pin-dot").forEach((dot, index) => {
    dot.classList.toggle("filled", store.adminPinInput.length > index);
  });
}

function unlockAdmin() {
  if (store.adminPinInput === store.adminPin) {
    store.adminUnlocked = true;
    store.adminPinInput = "";
    showToast("Admin berhasil dibuka", "success");
    render();
    return;
  }

  store.adminPinInput = "";
  showToast("PIN admin salah.", "error");
  render();
}

function handleChange(event) {
  const formField = event.target.dataset.formField;
  if (formField === "active") {
    store.pizzaForm.active = event.target.checked;
    return;
  }

  const pizzaId = event.target.dataset.togglePizza;
  if (pizzaId) {
    const pizza = store.pizzas.find((item) => item.id === pizzaId);
    if (pizza) {
      pizza.active = event.target.checked;
      persistDatabaseWrite(() => dbUpsertPizza(pizza));
    }
    render();
  }
}
async function savePizza() {
  const name = store.pizzaForm.name.trim();
  const cost = Number(store.pizzaForm.cost.replace(/\D/g, ""));
  const price = Number(store.pizzaForm.price.replace(/\D/g, ""));

  if (!name || cost <= 0 || price <= 0) {
    showToast("Gagal menyimpan data. Coba lagi.", "error");
    return;
  }

  let pizza;
  if (store.editingPizzaId) {
    pizza = store.pizzas.find((item) => item.id === store.editingPizzaId);
    if (!pizza) return;
    Object.assign(pizza, { name, cost, price, active: store.pizzaForm.active });
  } else {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "pizza";
    const id = store.pizzas.some((item) => item.id === baseId) ? `${baseId}-${Date.now()}` : baseId;
    pizza = {
      id,
      name,
      cost,
      price,
      active: store.pizzaForm.active,
      image: PIZZA_IMAGES.veggie,
    };
    store.pizzas.push(pizza);
  }

  const saved = await persistDatabaseWrite(() => dbUpsertPizza(pizza));
  if (!saved) {
    render();
    return;
  }

  closePizzaForm();
  showToast("Data produk berhasil disimpan", "success");
  render();
}
async function submitDailyData() {
  if (store.submitLoading) return;
  const today = isoDate(new Date());
  const attendance = store.attendance[today] || { in: null, out: null };
  const submitType = store.inputPage === "stock" ? "stock" : "sales";
  const submitLabel = submitType === "stock" ? "Stok" : "Penjualan";

  if (!attendance.in) {
    store.inputPage = "attendance";
    showToast(`Absen masuk dulu sebelum submit ${submitLabel.toLowerCase()}.`, "error");
    render();
    return;
  }

  store.submitLoading = true;
  render();

  const previousRecord = store.records[today]
    ? { sales: { ...store.records[today].sales }, stock: { ...store.records[today].stock } }
    : null;
  const previousProgress = getDailyProgress(today);
  const record = store.records[today] || { sales: {}, stock: {} };
  record[submitType] = getDraftValues(submitType);
  store.records[today] = record;
  store.dailySubmitted[today] = { ...previousProgress, [submitType]: true };

  const saved = await persistDatabaseWrite(() => dbUpsertDailyRecord(today));
  store.submitLoading = false;

  if (!saved) {
    if (previousRecord) {
      store.records[today] = previousRecord;
    } else {
      delete store.records[today];
    }
    store.dailySubmitted[today] = previousProgress;
    render();
    return;
  }

  if (submitType === "sales") {
    store.inputPage = "stock";
    showToast("Penjualan tersimpan. Lanjut isi stok.", "success");
  } else {
    store.inputPage = "stock";
    showToast("Stok tersimpan. Absen pulang sudah bisa dipakai.", "success");
  }
  render();
}
function toggleTimer(id) {
  const timer = store.timers.find((item) => item.id === id);
  if (!timer) return;

  if (timer.running) {
    timer.remaining = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
    timer.running = false;
    timer.endsAt = null;
  } else {
    timer.finished = false;
    timer.remaining = timer.remaining || timer.minutes * 60;
    timer.endsAt = Date.now() + timer.remaining * 1000;
    timer.running = true;
  }

  render();
}

function resetTimer(id) {
  const timer = store.timers.find((item) => item.id === id);
  if (!timer) return;
  timer.minutes = 8;
  timer.remaining = 480;
  timer.running = false;
  timer.finished = false;
  timer.endsAt = null;
}

function adjustTimerMinutes(id, delta) {
  const timer = store.timers.find((item) => item.id === id);
  if (!timer || timer.running) return;
  timer.minutes = Math.max(1, Math.min(99, timer.minutes + delta));
  timer.remaining = timer.minutes * 60;
  timer.finished = false;
  timer.endsAt = null;
}

function updateTimers() {
  let changed = false;

  store.timers.forEach((timer) => {
    if (!timer.running) return;

    const remaining = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
    if (remaining !== timer.remaining) {
      timer.remaining = remaining;
      changed = true;
    }

    if (remaining <= 0) {
      timer.minutes = 8;
      timer.remaining = 480;
      timer.running = false;
      timer.finished = true;
      timer.endsAt = null;
      changed = true;
    }
  });

  if (changed && normalizeRoute(location.pathname) === "/input" && store.inputPage === "timer") {
    render();
  }
}

function setViewerFilter(filter) {
  store.viewerFilter = filter;
  store.rangeAnchor = null;
  if (filter === "today") {
    store.rangeStart = isoDate(new Date());
    store.rangeEnd = isoDate(new Date());
  }
  if (filter === "yesterday") {
    const yesterday = isoDate(addDays(new Date(), -1));
    store.rangeStart = yesterday;
    store.rangeEnd = yesterday;
  }
  store.viewerLoading = true;
  render();
  setTimeout(() => {
    store.viewerLoading = false;
    render();
  }, 520);
}

function selectRangeDay(date) {
  if (!store.rangeAnchor) {
    store.rangeStart = date;
    store.rangeEnd = date;
    store.rangeAnchor = date;
  } else {
    const start = date < store.rangeAnchor ? date : store.rangeAnchor;
    const end = date < store.rangeAnchor ? store.rangeAnchor : date;
    store.rangeStart = start;
    store.rangeEnd = end;
    store.rangeAnchor = null;
  }
  store.viewerLoading = true;
  render();
  setTimeout(() => {
    store.viewerLoading = false;
    render();
  }, 420);
}

function startCamera() {
  const video = document.getElementById("camera-video");
  if (!video || !navigator.mediaDevices?.getUserMedia) return;

  if (store.cameraStream) {
    video.srcObject = store.cameraStream;
    return;
  }

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: { ideal: store.cameraFacing } }, audio: false })
    .then((stream) => {
      store.cameraStream = stream;
      video.srcObject = stream;
      const fallback = document.getElementById("camera-fallback");
      if (fallback) fallback.style.display = "none";
    })
    .catch(() => {
      const fallback = document.getElementById("camera-fallback");
      if (fallback) fallback.style.display = "flex";
    });
}

function flipCamera() {
  store.cameraFacing = store.cameraFacing === "user" ? "environment" : "user";
  closeStream();
  startCamera();
}

function capturePhoto() {
  const video = document.getElementById("camera-video");
  if (video && video.videoWidth) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    store.capturedPhoto = canvas.toDataURL("image/jpeg", 0.86);
  } else {
    store.capturedPhoto = null;
    showToast("Kamera belum siap. Ambil foto ulang.", "error");
  }
  closeStream();
  render();
}

async function uploadAttendancePhoto(payload) {
  if (!GAS_PHOTO_UPLOAD_URL) {
    throw new Error("URL GAS upload foto belum diisi di app.js.");
  }

  const response = await fetch(GAS_PHOTO_UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ appId: DOKO_APP_ID, ...payload }),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error("Upload foto berhasil dipanggil, tetapi respons GAS tidak terbaca.");
  }
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || "Gagal upload foto ke Google Drive.");
  }
  return data;
}
async function saveAttendance() {
  const today = isoDate(new Date());
  if (store.attendanceMode === "out" && !isDailySubmitted(today)) {
    closeCamera();
    store.inputPage = getNextRequiredInputPage(today);
    showToast("Submit penjualan dan stok dulu sebelum absen pulang.", "error");
    render();
    return;
  }

  if (!store.capturedPhoto?.startsWith("data:image/")) {
    showToast("Ambil foto dulu sebelum simpan absensi.", "error");
    render();
    return;
  }

  const record = store.attendance[today] || { in: null, out: null };
  const now = new Date();
  const mode = store.attendanceMode;
  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const feedback = getAttendanceFeedback(mode, now);
  showToast("Mengupload foto absensi...", "success");
  let upload;
  try {
    upload = await uploadAttendancePhoto({
      date: today,
      mode,
      time,
      status: feedback.status,
      message: feedback.message,
      photo: store.capturedPhoto,
    });
  } catch (error) {
    showToast(getErrorMessage(error), "error");
    render();
    return;
  }

  record[mode] = {
    time,
    photo: upload.photoUrl,
    photoView: upload.webViewUrl,
    photoFileId: upload.fileId,
    status: feedback.status,
    message: feedback.message,
  };
  store.attendance[today] = record;

  const saved = await persistDatabaseWrite(() => dbUpsertAttendance(today));
  if (!saved) {
    render();
    return;
  }

  const savedMode = store.attendanceMode;
  closeCamera();
  store.inputPage = savedMode === "in" ? "sales" : "attendance";
  showToast("Absensi berhasil disimpan", "success");
  render();
}
function closeCamera() {
  closeStream();
  store.attendanceMode = null;
  store.capturedPhoto = null;
}

function closeStream() {
  if (!store.cameraStream) return;
  store.cameraStream.getTracks().forEach((track) => track.stop());
  store.cameraStream = null;
}

function getSummaryForDates(dates) {
  return dates.reduce(
    (total, date) => {
      const record = store.records[date] || { sales: {}, stock: {} };
      store.pizzas.forEach((pizza) => {
        const qty = record.sales[pizza.id] || 0;
        total.slices += qty;
        total.revenue += qty * pizza.price;
        total.cost += qty * pizza.cost;
      });
      total.ownerShare = total.slices * store.ownerFee;
      total.net = total.revenue - total.cost - total.ownerShare;
      total.afterFee = total.revenue - total.ownerShare;
      return total;
    },
    { slices: 0, revenue: 0, cost: 0, ownerShare: 0, net: 0, afterFee: 0 }
  );
}

function getViewerDates() {
  if (store.viewerFilter === "today") return [isoDate(new Date())];
  if (store.viewerFilter === "yesterday") return [isoDate(addDays(new Date(), -1))];
  const dates = [];
  let current = new Date(`${store.rangeStart}T00:00:00`);
  const end = new Date(`${store.rangeEnd}T00:00:00`);
  while (current <= end) {
    dates.push(isoDate(current));
    current = addDays(current, 1);
  }
  return dates;
}

function sumDraft(type) {
  return Object.values(store.inputDraft[type]).reduce((sum, qty) => sum + qty, 0);
}

function getDraftValues(type) {
  return store.pizzas
    .filter((pizza) => pizza.active)
    .reduce((values, pizza) => {
      values[pizza.id] = Number(store.inputDraft[type][pizza.id]) || 0;
      return values;
    }, {});
}

function getDailyProgress(date) {
  const progress = store.dailySubmitted[date];
  if (progress && typeof progress === "object") {
    return { sales: Boolean(progress.sales), stock: Boolean(progress.stock) };
  }
  const submitted = Boolean(progress);
  return { sales: submitted, stock: submitted };
}

function isSalesSubmitted(date) {
  return getDailyProgress(date).sales;
}

function isStockSubmitted(date) {
  return getDailyProgress(date).stock;
}

function isDailySubmitted(date) {
  const progress = getDailyProgress(date);
  return Boolean(progress.sales && progress.stock);
}

function getNextRequiredInputPage(date) {
  if (!isSalesSubmitted(date)) return "sales";
  if (!isStockSubmitted(date)) return "stock";
  return "attendance";
}

function getCheckoutHint(date, attendance) {
  if (!attendance.in) return "Absen masuk dulu";
  if (!isSalesSubmitted(date)) return "Submit penjualan dulu";
  if (!isStockSubmitted(date)) return "Submit stok dulu";
  return "";
}

function filterDescription(dates) {
  if (dates.length === 1) return `Menampilkan ${formatDate(dates[0])}`;
  return `Menampilkan ${shortDate(dates[0])} sampai ${shortDate(dates[dates.length - 1])}`;
}

function viewerDateDescription(dates) {
  if (store.viewerFilter === "custom" && store.rangeAnchor) {
    return `Pilih tanggal akhir dari ${shortDate(store.rangeAnchor)}`;
  }
  return filterDescription(dates);
}

function normalizeRoute(path) {
  const route = path.replace(/\/+$/, "").split("/").filter(Boolean).pop();
  if (route === "admin") return "/admin";
  if (route === "input") return "/input";
  if (route === "view") return "/view";
  return "/";
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getAttendanceFeedback(type, date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return getAttendanceFeedbackByMinutes(type, minutes);
}

function getAttendanceFeedbackFromTime(type, time) {
  const parts = String(time)
    .split(/\D+/)
    .filter(Boolean)
    .map(Number);
  const minutes = (parts[0] || 0) * 60 + (parts[1] || 0);
  return getAttendanceFeedbackByMinutes(type, minutes);
}

function getAttendanceFeedbackByMinutes(type, minutes) {
  const time = minutesToTime(minutes);
  if (type === "in") {
    if (minutes < 15 * 60) {
      return {
        status: "early",
        badge: "Di luar jam",
        message: `Absen masuk ${time}, terlalu awal dari jadwal 16.00.`,
      };
    }

    if (minutes <= 16 * 60) {
      return {
        status: "ontime",
        badge: "Tepat waktu",
        message: `Absen masuk ${time}, tepat waktu untuk jadwal 16.00. Terima kasih.`,
      };
    }

    return {
      status: "late",
      badge: "Terlambat",
      message: `Absen masuk ${time}, terlambat ${minutes - 16 * 60} menit dari jadwal 16.00.`,
    };
  }

  if (minutes < 23 * 60) {
    return {
      status: "early",
      badge: "Belum waktunya",
      message: `Absen pulang ${time}, sebelum jadwal pulang 23.00.`,
    };
  }

  if (minutes === 23 * 60) {
    return {
      status: "ontime",
      badge: "Tepat waktu",
      message: `Absen pulang ${time}, tepat waktu. Terima kasih.`,
    };
  }

  return {
    status: "late",
    badge: "Lewat jadwal",
    message: `Absen pulang ${time}, lewat ${minutes - 23 * 60} menit dari jadwal 23.00.`,
  };
}

function minutesToTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}.${String(minute).padStart(2, "0")}`;
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  })
    .format(value)
    .replace(/\s/g, "");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(message, type) {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(hideToast, 2600);
}

function showConfirmToast(message) {
  clearTimeout(showToast.timer);
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <div class="toast-actions">
      <button type="button" data-cancel-delete-pizza>Tidak</button>
      <button type="button" data-confirm-delete-pizza>Ya</button>
    </div>
  `;
  toast.className = "toast confirm show";
}

function hideToast() {
  toast.className = "toast";
  toast.innerHTML = "";
}



