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
const GAS_PHOTO_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbyiQGAfG_AJSwMAaGTwsl1G5CiYmgKgBXyOuji9nsG4VOJ5hegolFL_bdroypwc8cT1AQ/exec";
const ATTENDANCE_SETTINGS_KEY = `${DOKO_APP_ID}:attendance_settings`;
const DAILY_EXPENSES_KEY = `${DOKO_APP_ID}:daily_expenses`;
const REFILL_STOCK_PREFIX = "__refill__";
const SALES_SHIFT_1_PREFIX = "__shift1__";
const SALES_SHIFT_2_PREFIX = "__shift2__";
const DEFAULT_ATTENDANCE_SETTINGS = {
  checkIn: "16:00",
  checkOut: "23:00",
  toleranceMinutes: 0,
};

const store = {
  ownerFee: 2000,
  adminView: "dashboard",
  adminQuickPanel: null,
  reportView: "tenant",
  attendanceFilter: "in",
  adminUnlocked: false,
  adminPin: DEFAULT_ADMIN_PIN,
  adminPinInput: "",
  adminPasswordForm: {
    pin: "",
  },
  attendanceSettings: { ...DEFAULT_ATTENDANCE_SETTINGS },
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
  deleteConfirmExpense: null,
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
    salesShift1: {},
    salesShift2: {},
    refill: {},
    stock: {},
  },
  expenseForm: {
    note: "",
    amount: "",
  },
  dailyExpenses: {},
  dailyEditUnlocked: {
    sales: false,
    stock: false,
  },
  adminEdit: {
    type: null,
    date: null,
    values: {},
    saving: false,
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
let timerAudioContext = null;
let timerAudioUnlocked = false;
const photoDataCache = new Map();
const photoDataLoading = new Set();

window.addEventListener("popstate", render);
window.addEventListener("resize", updateVisibleViewport);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateVisibleViewport);
  window.visualViewport.addEventListener("scroll", updateVisibleViewport);
}
document.addEventListener("pointerdown", unlockTimerAudio, { once: true });
document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleChange);
document.addEventListener("keydown", handleKeydown);
document.addEventListener("focusin", handleFocusIn);
document.addEventListener("focusout", handleFocusOut);
setInterval(updateTimers, 1000);

updateVisibleViewport();
loadAttendanceSettings();
loadDailyExpenses();
render();
initializeDatabase();

function updateVisibleViewport() {
  const viewport = window.visualViewport;
  const height = viewport ? viewport.height : window.innerHeight;
  const top = viewport ? viewport.offsetTop : 0;
  document.documentElement.style.setProperty("--visible-vh", `${Math.round(height)}px`);
  document.documentElement.style.setProperty("--visible-top", `${Math.round(top)}px`);
}

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
  await loadRemoteAttendanceSettings();

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
    const stockParts = splitStockPayload(row.stock);
    const salesParts = splitSalesPayload(row.sales);
    store.records[row.record_date] = {
      sales: salesParts.total,
      salesShift1: salesParts.shift1,
      salesShift2: salesParts.shift2,
      refill: stockParts.refill,
      stock: stockParts.stock,
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
    store.inputDraft.salesShift1 = { ...(store.records[today].salesShift1 || store.records[today].sales || {}) };
    store.inputDraft.salesShift2 = { ...(store.records[today].salesShift2 || {}) };
    store.inputDraft.refill = { ...(store.records[today].refill || {}) };
    store.inputDraft.stock = { ...store.records[today].stock };
  }
  await loadRemoteDailyExpenses();
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

async function loadRemoteAttendanceSettings() {
  try {
    const rows = await dbSelect(
      "doko_settings",
      `app_id=eq.${DOKO_APP_ID}&select=attendance_check_in,attendance_check_out,attendance_tolerance_minutes&limit=1`
    );
    if (!rows?.[0]) return;
    store.attendanceSettings = normalizeAttendanceSettings({
      checkIn: rows[0].attendance_check_in,
      checkOut: rows[0].attendance_check_out,
      toleranceMinutes: rows[0].attendance_tolerance_minutes,
    });
    saveLocalAttendanceSettings(store.attendanceSettings);
  } catch (error) {
    console.warn("Attendance settings columns are not ready yet", error);
  }
}

async function loadRemoteDailyExpenses() {
  try {
    const rows = await dbSelect(
      "doko_daily_expenses",
      `app_id=eq.${DOKO_APP_ID}&select=id,record_date,note,amount,created_at&order=record_date.desc,created_at.desc`
    );
    const remoteExpenses = rows.reduce((itemsByDate, row) => {
      const date = row.record_date;
      if (!itemsByDate[date]) itemsByDate[date] = [];
      itemsByDate[date].push({
        id: row.id,
        note: row.note,
        amount: Number(row.amount) || 0,
        createdAt: row.created_at || "",
      });
      return itemsByDate;
    }, {});
    store.dailyExpenses = normalizeDailyExpenses({
      ...store.dailyExpenses,
      ...remoteExpenses,
    });
    saveLocalDailyExpenses();
    syncLocalDailyExpensesToRemote(remoteExpenses);
  } catch (error) {
    console.warn("Daily expenses table is not ready yet", error);
  }
}

function syncLocalDailyExpensesToRemote(remoteExpenses = {}) {
  const remoteIds = new Set(Object.values(remoteExpenses).flat().map((expense) => expense.id));
  getExpensesForDates(Object.keys(store.dailyExpenses))
    .filter((expense) => !remoteIds.has(expense.id))
    .forEach((expense) => {
      syncDailyExpenseWrite(() => dbUpsertDailyExpense(expense.date, expense));
    });
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

async function dbUpsertAttendanceSettings(settings) {
  const next = normalizeAttendanceSettings(settings);
  return dbUpsert(
    "doko_settings",
    {
      app_id: DOKO_APP_ID,
      owner_fee: store.ownerFee,
      attendance_check_in: next.checkIn,
      attendance_check_out: next.checkOut,
      attendance_tolerance_minutes: next.toleranceMinutes,
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

async function dbUpsertDailyExpense(date, expense) {
  return dbUpsert(
    "doko_daily_expenses",
    {
      app_id: DOKO_APP_ID,
      id: expense.id,
      record_date: date,
      note: expense.note,
      amount: expense.amount,
      created_at: expense.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    "app_id,id"
  );
}

async function dbDeleteDailyExpense(id) {
  return dbRequest(`doko_daily_expenses?app_id=eq.${DOKO_APP_ID}&id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

async function dbUpsertDailyRecord(date) {
  const record = store.records[date] || { sales: {}, refill: {}, stock: {} };
  const progress = getDailyProgress(date);
  return dbUpsert(
    "doko_daily_records",
    {
      app_id: DOKO_APP_ID,
      record_date: date,
      sales: withSubmittedFlag(packSalesPayload(record.salesShift1, record.salesShift2, record.sales), progress.sales),
      stock: withSubmittedFlag(packStockPayload(record.stock, record.refill), progress.stock),
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
    Object.entries(values || {}).filter(
      ([key]) =>
        key !== "__submitted" &&
        !key.startsWith(REFILL_STOCK_PREFIX) &&
        !key.startsWith(SALES_SHIFT_1_PREFIX) &&
        !key.startsWith(SALES_SHIFT_2_PREFIX)
    )
  );
}

function splitSalesPayload(values) {
  const total = {};
  const shift1 = {};
  const shift2 = {};
  let hasShiftValues = false;

  Object.entries(values || {}).forEach(([key, value]) => {
    if (key === "__submitted") return;
    const qty = Math.max(0, Number(value) || 0);
    if (key.startsWith(SALES_SHIFT_1_PREFIX)) {
      const pizzaId = key.slice(SALES_SHIFT_1_PREFIX.length);
      if (pizzaId) {
        shift1[pizzaId] = qty;
        hasShiftValues = true;
      }
      return;
    }
    if (key.startsWith(SALES_SHIFT_2_PREFIX)) {
      const pizzaId = key.slice(SALES_SHIFT_2_PREFIX.length);
      if (pizzaId) {
        shift2[pizzaId] = qty;
        hasShiftValues = true;
      }
      return;
    }
    total[key] = qty;
  });

  if (!hasShiftValues) {
    return { total, shift1: { ...total }, shift2 };
  }

  store.pizzas.forEach((pizza) => {
    total[pizza.id] = (Number(shift1[pizza.id]) || 0) + (Number(shift2[pizza.id]) || 0);
  });

  return { total, shift1, shift2 };
}

function packSalesPayload(shift1 = {}, shift2 = {}, fallbackTotal = {}) {
  const combined = getCombinedSalesValues(shift1, shift2, fallbackTotal);
  const packed = { ...combined };
  store.pizzas.forEach((pizza) => {
    packed[salesShiftKey(1, pizza.id)] = Math.max(0, Number(shift1?.[pizza.id]) || 0);
    packed[salesShiftKey(2, pizza.id)] = Math.max(0, Number(shift2?.[pizza.id]) || 0);
  });
  return packed;
}

function salesShiftKey(shift, pizzaId) {
  return (shift === 2 ? SALES_SHIFT_2_PREFIX : SALES_SHIFT_1_PREFIX) + pizzaId;
}

function splitStockPayload(values) {
  return Object.entries(values || {}).reduce(
    (result, [key, value]) => {
      if (key === "__submitted") return result;
      const qty = Math.max(0, Number(value) || 0);
      if (key.startsWith(REFILL_STOCK_PREFIX)) {
        const pizzaId = key.slice(REFILL_STOCK_PREFIX.length);
        if (pizzaId) result.refill[pizzaId] = qty;
      } else {
        result.stock[key] = qty;
      }
      return result;
    },
    { stock: {}, refill: {} }
  );
}

function packStockPayload(stock = {}, refill = {}) {
  const packed = { ...(stock || {}) };
  Object.entries(refill || {}).forEach(([pizzaId, qty]) => {
    packed[refillStockKey(pizzaId)] = Math.max(0, Number(qty) || 0);
  });
  return packed;
}

function refillStockKey(pizzaId) {
  return `${REFILL_STOCK_PREFIX}${pizzaId}`;
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  } catch (firstError) {
    await wait(650);
    try {
      await action();
      store.dbReady = true;
      store.dbError = "";
      return true;
    } catch (error) {
      store.dbReady = false;
      store.dbError = getErrorMessage(error);
      console.error("Supabase write failed", error || firstError);
      showToast("Gagal menyimpan ke database. Cek schema DOKO.", "error");
      return false;
    }
  }
}
function render() {
  const route = normalizeRoute(location.pathname);

  if (route === "/admin") {
    app.innerHTML = store.adminUnlocked ? shell("admin", renderAdmin()) : pinShell(renderAdminPin());
  } else if (route === "/input") {
    app.innerHTML = shell("input", renderInput());
  } else if (route === "/view") {
    store.adminView = "reports";
    app.innerHTML = store.adminUnlocked ? shell("admin", renderAdmin()) : pinShell(renderAdminPin());
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

  hydrateAttendanceThumbnails();
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
          <span class="brand-mark"><img src="/assets/logo-pizzain-apk.jpg" alt="Logo Pizzain DOKO" /></span>
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

function pinShell(content) {
  return `
    <div class="shell pin-shell">
      ${content}
    </div>
  `;
}

function roleHref(role) {
  if (role === "viewer") return "/view";
  return `/${role}`;
}

function renderAdminPin() {
  const pinDots = Array.from({ length: 4 }, (_, index) => `<span class="pin-dot ${store.adminPinInput.length > index ? "filled" : ""}"></span>`).join("");

  return `
    <main class="main narrow admin-pin-screen">
      <section class="panel admin-pin-card">
        <span class="brand-mark"><img src="/assets/logo-pizzain-apk.jpg" alt="Logo Pizzain DOKO" /></span>
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
  if (store.adminView === "pizza" || store.adminView === "fee") {
    store.adminView = "settings";
  }
  const summary = getSummaryForDates(getViewerDates());
  return `
    <main class="main narrow admin-main">
      <nav class="input-tabs admin-tabs" aria-label="Menu admin">
        ${adminMenuButton("dashboard", "space_dashboard", "Dashboard")}
        ${adminMenuButton("reports", "receipt_long", "Laporan")}
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
  if (store.adminView === "reports") return renderAdminReport();
  return renderAdminDashboard(summary);
}

function renderAdminDashboard(summary) {
  const selectedDates = getViewerDates();
  const showStock = selectedDates.length === 1;
  const selectedDate = showStock ? selectedDates[0] : "";
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
    ${selectedDate ? renderAdminQuickPanels(selectedDate) : ""}
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
          <span class="viewer-summary-title">Omzet Kotor</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.revenue)}</strong>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Modal (HPP)</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.cost)}</strong>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Bagi Hasil DOKO</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.ownerShare)}</strong>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Pengeluaran</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.expenses)}</strong>
      </div>
      <div class="viewer-summary-row highlight">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Laba Bersih</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.net)}</strong>
      </div>
    </section>
    <section class="panel admin-list-panel">
      <div class="admin-list-head">
        <h3>Ringkasan Penjualan</h3>
        ${renderAdminListActions("sales", selectedDate, `${summary.slices} slice`)}
      </div>
      ${renderAdminVariantList(selectedDates, "sales")}
    </section>
    ${
      showStock
        ? `<section class="panel admin-list-panel">
            <div class="admin-list-head secondary">
              <h3>Ringkasan Stok Pizza</h3>
              ${renderAdminListActions("stock", selectedDate, `${getStockTotalForDate(selectedDate)} Slice`)}
            </div>
            ${renderAdminVariantList(selectedDates, "stock")}
          </section>
          <section class="panel admin-list-panel admin-stock-check">
            ${renderStockConsistencyCheck(selectedDate)}
          </section>`
        : ""
    }
    ${renderExpenseList(selectedDates)}
  `;
}

function renderAdminQuickPanels(date) {
  const refillOpen = store.adminQuickPanel === "refill";
  const expenseOpen = store.adminQuickPanel === "expense";
  const refillTotal = getRefillTotalForDate(date);
  const expenseTotal = getExpenseTotalForDates([date]);

  return `
    <section class="admin-quick-panels" aria-label="Aksi harian admin">
      <button class="admin-quick-card ${expenseOpen ? "active" : ""}" type="button" data-admin-quick-panel="expense">
        <span class="material-symbols-outlined">payments</span>
        <span>Input Pengeluaran</span>
        <strong>${rupiah(expenseTotal)}</strong>
      </button>
      <button class="admin-quick-card ${refillOpen ? "active" : ""}" type="button" data-admin-quick-panel="refill">
        <span class="material-symbols-outlined">inventory_2</span>
        <span>Refill Stok</span>
        <strong>${refillTotal} Slice</strong>
      </button>
    </section>
    ${expenseOpen ? renderDailyExpenseForm(date) : ""}
    ${refillOpen ? renderRefillStockPanel(date) : ""}
  `;
}

function renderRefillStockPanel(date) {
  const refillSaved = isRefillSubmitted(date);
  const editing = isAdminRecordEditing("refill", date);
  const totalLabel = `${getRefillTotalForDate(date)} Slice`;

  return `
    <section class="panel admin-list-panel admin-refill-panel">
      <div class="admin-list-head refill">
        <h3>Refill Stok Pizza</h3>
        ${refillSaved ? renderAdminListActions("refill", date, totalLabel) : renderRefillInputActions(date, totalLabel)}
      </div>
      ${renderAdminVariantList([date], "refill", { forceEditing: !refillSaved || editing })}
    </section>
  `;
}

function renderRefillInputActions(date, totalLabel) {
  const saving = isAdminRecordEditing("refill", date) && store.adminEdit.saving;
  return `
    <div class="admin-list-actions">
      <span>${saving ? "Menyimpan..." : totalLabel}</span>
      <button class="admin-list-action-btn" type="button" data-admin-refill-save data-date="${date}" ${saving ? "disabled" : ""}>Simpan</button>
    </div>
  `;
}

function renderDailyExpenseForm(date) {
  return `
    <section class="panel daily-expense-panel">
      <div class="daily-expense-head">
        <div>
          <span>Pengeluaran Harian</span>
        </div>
        <button class="btn daily-expense-save" type="button" data-save-daily-expense>Simpan</button>
      </div>
      <div class="daily-expense-form">
        <label for="daily-expense-note">
          <input id="daily-expense-note" data-expense-note value="${escapeHtml(store.expenseForm.note)}" placeholder="Keterangan" aria-label="Keterangan pengeluaran" />
        </label>
        <label for="daily-expense-amount">
          <input id="daily-expense-amount" data-expense-amount inputmode="numeric" value="${escapeHtml(store.expenseForm.amount)}" placeholder="Nominal" aria-label="Nominal pengeluaran" />
        </label>
      </div>
    </section>
  `;
}

function renderAdminListActions(type, date, totalLabel) {
  if (!date) return `<span>${totalLabel}</span>`;
  const editing = isAdminRecordEditing(type, date);
  const saving = editing && store.adminEdit.saving;

  if (!editing) {
    return `
      <div class="admin-list-actions">
        <span>${totalLabel}</span>
        <button class="admin-list-action-btn" type="button" data-admin-record-edit="${type}" data-date="${date}">Edit</button>
      </div>
    `;
  }

  return `
    <div class="admin-list-actions">
      <span>${saving ? "Menyimpan..." : totalLabel}</span>
      <button class="admin-list-action-btn light" type="button" data-admin-record-cancel="${type}" data-date="${date}" ${saving ? "disabled" : ""}>Batal</button>
      <button class="admin-list-action-btn" type="button" data-admin-record-save="${type}" data-date="${date}" ${saving ? "disabled" : ""}>Simpan</button>
    </div>
  `;
}

function renderAdminVariantList(dates, type, options = {}) {
  const editDate = dates.length === 1 ? dates[0] : "";
  const forcedEditing = Boolean(options.forceEditing && editDate);
  const editing = editDate && (isAdminRecordEditing(type, editDate) || forcedEditing);
  const rows = store.pizzas
    .filter((pizza) => pizza.active)
    .map((pizza) => {
      let sold = 0;
      let stock = 0;
      let refill = 0;
      dates.forEach((date) => {
        sold += getSalesQuantity(store.records[date] || {}, pizza.id, options.salesScope || "tenant");
        stock += store.records[date]?.stock?.[pizza.id] || 0;
        refill += store.records[date]?.refill?.[pizza.id] || 0;
      });
      const draftSource = isAdminRecordEditing(type, editDate) ? store.adminEdit.values : (store.records[editDate]?.[type] || {});
      const draftValue = editing ? Number(draftSource[pizza.id]) || 0 : null;
      return { pizza, sold, stock, refill, draftValue };
    });

  const getValue = (row) => {
    if (editing) return row.draftValue;
    if (type === "sales") return row.sold;
    if (type === "refill") return row.refill;
    return row.stock;
  };
  return `
    <div class="admin-compact-list">
      ${rows
        .map(
          (row) => {
            const value = getValue(row);
            return `
            <article class="admin-compact-row">
              <div>
                <h4>${row.pizza.name}</h4>
              </div>
              <div class="admin-compact-values">
                ${
                  editing
                    ? `<div class="admin-edit-stepper" aria-label="Edit ${row.pizza.name}">
                        <button type="button" data-admin-record-delta="${type}" data-date="${editDate}" data-id="${row.pizza.id}" data-delta="-1">-</button>
                        <strong>${value}</strong>
                        <button type="button" data-admin-record-delta="${type}" data-date="${editDate}" data-id="${row.pizza.id}" data-delta="1">+</button>
                      </div>`
                    : `<span><strong>${value}</strong> SLICE</span>`
                }
              </div>
            </article>
          `;
          }
        )
        .join("")}
    </div>
  `;
}

function getStockTotalForDate(date) {
  const stock = store.records[date]?.stock || {};
  return store.pizzas.filter((pizza) => pizza.active).reduce((total, pizza) => total + (stock[pizza.id] || 0), 0);
}

function getRefillTotalForDate(date) {
  const refill = store.records[date]?.refill || {};
  return store.pizzas.filter((pizza) => pizza.active).reduce((total, pizza) => total + (refill[pizza.id] || 0), 0);
}

function isRefillSubmitted(date) {
  const refill = store.records[date]?.refill || {};
  return store.pizzas.some((pizza) => Object.prototype.hasOwnProperty.call(refill, pizza.id));
}

function getStockConsistencyRows(date) {
  const previousDate = getPreviousDate(date);
  const currentRecord = store.records[date] || { sales: {}, refill: {}, stock: {} };
  const previousRecord = store.records[previousDate] || { sales: {}, refill: {}, stock: {} };

  return store.pizzas
    .filter((pizza) => pizza.active)
    .map((pizza) => {
      const previousStock = Number(previousRecord.stock?.[pizza.id]) || 0;
      const refillToday = Number(currentRecord.refill?.[pizza.id]) || 0;
      const soldToday = Number(currentRecord.sales?.[pizza.id]) || 0;
      const currentStock = Number(currentRecord.stock?.[pizza.id]) || 0;
      const expectedStockUsage = soldToday + currentStock;
      const availableStock = previousStock + refillToday;

      return {
        pizza,
        previousStock,
        refillToday,
        soldToday,
        currentStock,
        diff: availableStock - expectedStockUsage,
      };
    });
}

function renderStockConsistencyCheck(date) {
  const rows = getStockConsistencyRows(date);
  const issueCount = rows.filter((row) => row.diff !== 0).length;
  const previousDate = getPreviousDate(date);

  return `
    <div class="admin-list-head check">
      <div>
        <h3>Cek Kesesuaian Stok</h3>
        <p>${shortDate(previousDate)} - ${shortDate(date)}</p>
      </div>
      <span class="${issueCount ? "warning" : "ok"}">${issueCount ? `${issueCount} Selisih` : "Sesuai"}</span>
    </div>
    <div class="stock-check-list">
      ${rows
        .map(
          (row) => `
            <article class="stock-check-row ${row.diff === 0 ? "ok" : "warning"}">
              <div>
                <h4>${row.pizza.name}</h4>
                <p>Kemarin ${row.previousStock} + ${row.refillToday} refill - (${row.soldToday} laku + ${row.currentStock} sisa)</p>
              </div>
              <strong>${row.diff === 0 ? "Pas" : `${row.diff > 0 ? "+" : ""}${row.diff}`}</strong>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderExpenseList(dates) {
  const expenses = getExpensesForDates(dates);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return `
    <section class="panel admin-list-panel daily-expense-list-panel">
      <div class="admin-list-head expense">
        <div>
          <h3>Daftar Pengeluaran</h3>
          <p>${ticketDateDescription(dates)}</p>
        </div>
        <span>${rupiah(total)}</span>
      </div>
      <div class="daily-expense-list">
        ${
          expenses.length
            ? expenses
                .map(
                  (expense) => `
                    <article class="daily-expense-row">
                      <div>
                        <h4>${escapeHtml(expense.note)}</h4>
                        <p>${formatDate(expense.date)}</p>
                      </div>
                      <div class="daily-expense-actions">
                        <strong>${rupiah(expense.amount)}</strong>
                        <button type="button" data-delete-daily-expense="${escapeHtml(expense.id)}" data-date="${expense.date}" aria-label="Hapus pengeluaran ${escapeHtml(expense.note)}">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<p class="muted daily-expense-empty">Belum ada pengeluaran.</p>`
        }
      </div>
    </section>
  `;
}

function isAdminRecordEditing(type, date) {
  return store.adminEdit.type === type && store.adminEdit.date === date;
}

function beginAdminRecordEdit(type, date) {
  const record = store.records[date] || { sales: {}, refill: {}, stock: {} };
  const source = record[type] || {};
  store.adminEdit = {
    type,
    date,
    values: store.pizzas
      .filter((pizza) => pizza.active)
      .reduce((values, pizza) => {
        values[pizza.id] = Number(source[pizza.id]) || 0;
        return values;
      }, {}),
    saving: false,
  };
}

function cancelAdminRecordEdit() {
  store.adminEdit = {
    type: null,
    date: null,
    values: {},
    saving: false,
  };
}

function adjustAdminRecordValue(type, date, id, delta) {
  if (!isAdminRecordEditing(type, date)) {
    beginAdminRecordEdit(type, date);
  }
  store.adminEdit.values[id] = Math.max(0, (Number(store.adminEdit.values[id]) || 0) + delta);
  render();
}

function getAdminRecordDraftValues() {
  return store.pizzas
    .filter((pizza) => pizza.active)
    .reduce((values, pizza) => {
      values[pizza.id] = Math.max(0, Number(store.adminEdit.values[pizza.id]) || 0);
      return values;
    }, {});
}

function saveRefillInput(date) {
  if (!isAdminRecordEditing("refill", date)) {
    beginAdminRecordEdit("refill", date);
  }
  saveAdminRecordEdit("refill", date);
}

async function saveAdminRecordEdit(type, date) {
  if (!isAdminRecordEditing(type, date) || store.adminEdit.saving) return;

  const previousRecord = store.records[date]
    ? {
        sales: { ...store.records[date].sales },
        salesShift1: { ...(store.records[date].salesShift1 || {}) },
        salesShift2: { ...(store.records[date].salesShift2 || {}) },
        refill: { ...(store.records[date].refill || {}) },
        stock: { ...store.records[date].stock },
      }
    : null;
  const previousProgress = getDailyProgress(date);
  const record = store.records[date] || { sales: {}, refill: {}, stock: {} };

  store.adminEdit.saving = true;
  record[type] = getAdminRecordDraftValues();
  if (type === "sales") {
    record.salesShift1 = { ...record.sales };
    record.salesShift2 = {};
  }
  store.records[date] = record;
  if (type !== "refill") {
    store.dailySubmitted[date] = { ...previousProgress, [type]: true };
  }
  render();

  const saved = await persistDatabaseWrite(() => dbUpsertDailyRecord(date));

  if (!saved) {
    if (previousRecord) {
      store.records[date] = previousRecord;
    } else {
      delete store.records[date];
    }
    store.dailySubmitted[date] = previousProgress;
    cancelAdminRecordEdit();
    render();
    return;
  }

  cancelAdminRecordEdit();
  const label = type === "stock" ? "Stok" : type === "refill" ? "Refill" : "Penjualan";
  showToast(`${label} berhasil disimpan.`, "success");
  render();
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
    ${renderAttendanceSettings()}
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

function renderAttendanceSettings() {
  const settings = getAttendanceSettings();
  return `
    <section class="panel attendance-settings-panel">
      <div class="attendance-settings-head">
        <div>
          <span>Jam Absensi</span>
          <strong>Masuk ${displayClock(settings.checkIn)} | Pulang ${displayClock(settings.checkOut)}</strong>
        </div>
        <button class="btn attendance-settings-save-btn" data-save-attendance-settings aria-label="Simpan jam absensi">Simpan</button>
      </div>
      <div class="attendance-settings-grid">
        <label class="attendance-setting-field" for="attendance-check-in">
          <span>Jam Masuk</span>
          <input id="attendance-check-in" type="time" data-attendance-setting="checkIn" value="${escapeHtml(settings.checkIn)}" />
        </label>
        <label class="attendance-setting-field" for="attendance-check-out">
          <span>Jam Pulang</span>
          <input id="attendance-check-out" type="time" data-attendance-setting="checkOut" value="${escapeHtml(settings.checkOut)}" />
        </label>
        <label class="attendance-setting-field attendance-setting-wide" for="attendance-tolerance">
          <span>Toleransi</span>
          <input id="attendance-tolerance" inputmode="numeric" data-attendance-setting="toleranceMinutes" value="${settings.toleranceMinutes}" />
          <small>menit</small>
        </label>
      </div>
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
  const inFeedback = item.in ? getAttendanceFeedbackFromTime("in", item.in.time) : null;
  const outFeedback = item.out ? getAttendanceFeedbackFromTime("out", item.out.time) : null;
  return `
    <article class="attendance-record">
      <div class="attendance-record-copy">
        <h4>${formatDate(date)}</h4>
        <div class="attendance-record-times">
          <p><span>Masuk</span><strong>${item.in?.time || "-"}</strong></p>
          <p><span>Pulang</span><strong>${item.out?.time || "-"}</strong></p>
        </div>
        ${feedback ? `<span class="attendance-record-badge ${feedback.status}">${feedback.badge}</span>` : ""}
      </div>
      <div class="attendance-record-photos" aria-label="Foto absensi ${formatDate(date)}">
        ${renderAttendancePhotoThumb(item.in, "in", date, inFeedback?.badge)}
        ${renderAttendancePhotoThumb(item.out, "out", date, outFeedback?.badge)}
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

function photoCacheKey(src, size) {
  return `${src}::${size}`;
}

function renderPhotoMedia(src, title, compact = false) {
  const safeTitle = escapeHtml(title || "Foto absensi");
  const size = compact ? 220 : 1000;
  const cachedSrc = isGasPhotoUrl(src) ? photoDataCache.get(photoCacheKey(src, size)) : "";
  if (compact && isGasPhotoUrl(src)) {
    if (cachedSrc) {
      return `<img class="photo-thumb" alt="${safeTitle}" src="${escapeHtml(cachedSrc)}" />`;
    }
    return `<span class="photo-thumb photo-gas-thumb" data-gas-thumb-src="${escapeHtml(src)}" data-gas-thumb-size="${size}" data-gas-thumb-title="${safeTitle}"><span class="spinner tiny"></span></span>`;
  }
  return `<img class="${compact ? "photo-thumb" : "photo-preview-image"}" alt="${safeTitle}" src="${escapeHtml(cachedSrc || src)}" />`;
}

function renderAttendancePhotoThumb(record, type, date, badge = "") {
  const label = type === "out" ? "Pulang" : "Masuk";
  if (!record?.photo) return `<span class="photo-thumb photo-empty attendance-photo-slot"><span class="attendance-photo-label">${label}</span></span>`;
  const title = `${label} - ${formatDate(date)} ${record.time || ""}`.trim();
  return `
    <button class="photo-thumb-button attendance-photo-slot" data-preview-photo="${escapeHtml(record.photo)}" data-preview-title="${escapeHtml(title)}" aria-label="Preview foto absen ${label.toLowerCase()}">
      ${renderPhotoMedia(record.photo, `Foto absen ${label.toLowerCase()}`, true)}
      <span class="attendance-photo-label">${label}${badge ? ` - ${escapeHtml(badge)}` : ""}</span>
    </button>
  `;
}

function renderPhotoPreviewModal() {
  const preview = store.attendancePhotoPreview;
  const body = preview.loading
    ? `<div class="photo-preview-state"><span class="spinner"></span><p>Memuat foto...</p></div>`
    : preview.error
      ? `<div class="photo-preview-state error"><span class="material-symbols-outlined">wifi_off</span><p>${escapeHtml(preview.error)}</p></div>`
      : renderPhotoMedia(preview.imageSrc || preview.src, preview.title || "Preview foto absensi");
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
        ${body}
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
  const settings = getAttendanceSettings();
  return `
    <section class="panel stack attendance-panel">
      <div class="section-title attendance-title">
        <span class="icon-tile"><span class="material-symbols-outlined">badge</span></span>
        <div>
          <h3>Absensi Hari Ini</h3>
          <p>Laporan kehadiran staff pizzain tenant</p>
        </div>
      </div>
      <div class="input-attendance-meta attendance-meta-chips">
        <span>${formatDate(today)}</span>
        <span>Jam kerja ${displayClock(settings.checkIn)} - ${displayClock(settings.checkOut)}</span>
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
  return `
    <section class="panel sales-panel shift-sales-panel">
      <div class="section-title solid compact-sales-title">
        <span class="icon-tile"><span class="material-symbols-outlined">point_of_sale</span></span>
        <div>
          <h3>Laporan Penjualan</h3>
          <p>Jumlah pizza terjual hari ini</p>
        </div>
      </div>
      <div class="sales-shift-stack">
        ${renderSalesShiftCard("Shift 1", "salesShift1", activePizzas)}
        ${renderSalesShiftCard("Shift 2", "salesShift2", activePizzas)}
      </div>
    </section>
  `;
}

function renderSalesShiftCard(label, type, activePizzas) {
  const total = sumDraft(type);
  const shiftClass = type === "salesShift1" ? "shift-one" : "shift-two";
  return `
    <section class="sales-shift-card ${shiftClass}" aria-label="Penjualan ${label}">
      <div class="sales-shift-head">
        <h4>${label}</h4>
        <span>${total} slice</span>
      </div>
      <div class="sales-shift-list">
        ${activePizzas.map((pizza) => renderCounterRow(pizza, type)).join("")}
      </div>
    </section>
  `;
}

function renderInputStock(activePizzas) {
  const totalStock = sumDraft("stock");
  return `
    <section class="panel stock-panel compact-stock-panel">
      <div class="stock-compact-head">
        <div class="stock-compact-title">
          <span class="icon-tile"><span class="material-symbols-outlined">inventory_2</span></span>
          <h3>Stok Pizza Tersisa</h3>
          <p>Jumlah pizza di kulkas</p>
        </div>
        <span class="stock-total-chip">${totalStock} slice</span>
      </div>
      <div class="stock-compact-list">
        ${activePizzas.map((pizza) => renderCounterRow(pizza, "stock")).join("")}
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
  const value = store.inputDraft[type]?.[pizza.id] || 0;
  const locked = isDraftLocked(type);
  return `
    <article class="variant-row input-counter-row ${type}-row ${locked ? "is-locked" : ""}">
      <div class="pizza-info">
        <span class="pizza-initial">${getInitials(pizza.name)}</span>
        <div>
          <h4>${pizza.name}</h4>
        </div>
      </div>
      <div class="counter" aria-label="${pizza.name} ${type}">
        <button class="counter-btn" data-counter="${type}" data-id="${pizza.id}" data-delta="-1" aria-label="Kurangi ${pizza.name}" ${locked ? "disabled" : ""}>
          <span class="material-symbols-outlined">remove</span>
        </button>
        <span class="count">${value}</span>
        <button class="counter-btn" data-counter="${type}" data-id="${pizza.id}" data-delta="1" aria-label="Tambah ${pizza.name}" ${locked ? "disabled" : ""}>
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </article>
  `;
}

function renderSubmitBar(canSubmitDaily) {
  const type = store.inputPage === "stock" ? "stock" : "sales";
  const pageLabel = type === "stock" ? "Stok" : "Penjualan";
  const locked = isDraftLocked(type);
  const label = store.submitLoading
    ? `<span class="spinner"></span>Menyimpan...`
    : locked
      ? `<span class="material-symbols-outlined">edit</span>Perbaharui Data`
      : `<span class="material-symbols-outlined">send</span>Submit ${pageLabel}`;

  return `
    <div class="submit-bar">
      ${canSubmitDaily ? "" : `<p>Absen Masuk dulu untuk submit ${pageLabel.toLowerCase()}.</p>`}
      <button class="btn full" data-submit-daily ${store.submitLoading || !canSubmitDaily ? "disabled" : ""}>${label}</button>
    </div>
  `;
}

function renderAdminReport() {
  const selectedDates = getViewerDates();
  const reportView = store.reportView || "tenant";
  const reportLabel = reportView === "shift1" ? "Shift 1" : reportView === "shift2" ? "Shift 2" : "Tenant";
  const summary = getSummaryForDates(selectedDates, { salesScope: reportView });
  const isCustom = store.viewerFilter === "custom";
  const isTenantReport = reportView === "tenant";

  return `
    <section class="panel stack viewer-filter-panel admin-report-filter">
      <div class="segmented" role="tablist" aria-label="Filter tanggal laporan">
        ${viewerFilterButton("today", "Hari Ini")}
        ${viewerFilterButton("yesterday", "Kemarin")}
        ${viewerFilterButton("custom", "Custom")}
      </div>
      <div class="report-type-tabs" role="tablist" aria-label="Jenis laporan">
        ${reportTypeButton("tenant", "Tenant")}
        ${reportTypeButton("shift1", "Shift 1")}
        ${reportTypeButton("shift2", "Shift 2")}
      </div>
      ${isCustom ? renderCalendarRange() : ""}
    </section>
    <section class="admin-report-ticket" aria-label="Laporan untuk pemilik usaha">
      <div class="ticket-head">
        <div class="ticket-head-copy">
          <span class="brand-mark"><img src="/assets/logo-pizzain-apk.jpg" alt="Logo Pizzain DOKO" /></span>
          <div>
            <span>Laporan ${reportLabel}</span>
            <h3>Pizzain DOKO</h3>
            <p>${ticketDateDescription(selectedDates)}</p>
          </div>
        </div>
        <strong>${summary.slices}<small>slice</small></strong>
      </div>
      <div class="ticket-divider"></div>
      <div class="ticket-section-title">Detail Pizza Terjual</div>
      ${renderVariantReports(selectedDates, { showMoney: false, compact: true, ticket: true, salesScope: reportView })}
      <div class="ticket-divider"></div>
      ${isTenantReport ? renderViewerTotals(summary, isCustom || selectedDates.length > 1, { ticket: true }) : renderShiftReportTotals(summary, reportLabel)}
    </section>
  `;
}

function reportTypeButton(view, label) {
  const active = store.reportView === view ? "active" : "";
  return `<button class="${active}" type="button" data-report-view="${view}">${label}</button>`;
}

function renderShiftReportTotals(summary, label) {
  const income = summary.slices * store.ownerFee;
  const incomeFormula = `${summary.slices} slice x ${rupiah(store.ownerFee)} =`;

  return `
    <section class="viewer-report-summary report-ticket-summary shift-income-summary">
      <div class="viewer-card-head">
        <h3>Penghasilan ${label}</h3>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Penjualan ${label}</span>
        </div>
        <strong class="viewer-summary-value">${summary.slices} slice</strong>
      </div>
      <div class="viewer-summary-row highlight">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Penghasilan</span>
          <em class="viewer-summary-formula">${incomeFormula}</em>
        </div>
        <strong class="viewer-summary-value">${rupiah(income)}</strong>
      </div>
    </section>
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
      <section class="panel viewer-list-panel">
        <div class="viewer-list-title">
          <h3>Detail Pizza Terjual</h3>
        </div>
        ${renderVariantReports(selectedDates, { showMoney: false, compact: true })}
      </section>
      ${renderViewerTotals(summary, isCustom || selectedDates.length > 1)}
    </main>
  `;
}

function viewerFilterButton(filter, label) {
  return `<button class="${store.viewerFilter === filter ? "active" : ""}" data-viewer-filter="${filter}">${label}</button>`;
}

function renderViewerTotals(summary, rangeMode, options = {}) {
  const feeFormula = `${summary.slices} slice x ${rupiah(store.ownerFee)} =`;
  const pizzainFormula = `${rupiah(summary.revenue)} - ${rupiah(summary.ownerShare)} =`;

  return `
    <section class="viewer-report-summary ${options.ticket ? "report-ticket-summary" : ""}">
      <div class="viewer-card-head">
        <h3>Laporan Penjualan</h3>
      </div>
      <div class="viewer-summary-row">
        <div class="viewer-summary-copy">
          <span class="viewer-summary-title">Penjualan Pizza</span>
        </div>
        <strong class="viewer-summary-value">${rupiah(summary.revenue)}</strong>
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
          <span class="viewer-summary-title">Omset Pizza</span>
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
  const listClass = options.ticket ? "viewer-report-list ticket-report-list" : "viewer-report-list";
  const rows = store.pizzas
    .filter((pizza) => pizza.active)
    .map((pizza) => {
      let sold = 0;
      let stock = 0;
      dates.forEach((date) => {
        sold += getSalesQuantity(store.records[date] || {}, pizza.id, options.salesScope || "tenant");
        stock += store.records[date]?.stock?.[pizza.id] || 0;
      });
      return { pizza, sold, stock };
    });

  if (options.compact) {
    return `
      <div class="${listClass}">
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

  if (event.target.closest("[data-confirm-delete]")) {
    if (store.deleteConfirmExpense) {
      confirmDeleteDailyExpense();
    } else {
      confirmDeletePizza();
    }
    return;
  }

  if (event.target.closest("[data-cancel-delete]")) {
    clearDeleteConfirmation();
    hideToast();
    return;
  }

  const photoPreviewButton = event.target.closest("[data-preview-photo]");
  if (photoPreviewButton) {
    openAttendancePhotoPreview(photoPreviewButton);
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

  const adminRecordEdit = event.target.closest("[data-admin-record-edit]");
  if (adminRecordEdit) {
    beginAdminRecordEdit(adminRecordEdit.dataset.adminRecordEdit, adminRecordEdit.dataset.date);
    render();
    return;
  }

  const adminRecordCancel = event.target.closest("[data-admin-record-cancel]");
  if (adminRecordCancel) {
    cancelAdminRecordEdit();
    render();
    return;
  }

  const adminRecordSave = event.target.closest("[data-admin-record-save]");
  if (adminRecordSave) {
    saveAdminRecordEdit(adminRecordSave.dataset.adminRecordSave, adminRecordSave.dataset.date);
    return;
  }

  const adminRecordDelta = event.target.closest("[data-admin-record-delta]");
  if (adminRecordDelta) {
    adjustAdminRecordValue(
      adminRecordDelta.dataset.adminRecordDelta,
      adminRecordDelta.dataset.date,
      adminRecordDelta.dataset.id,
      Number(adminRecordDelta.dataset.delta)
    );
    return;
  }

  const attendanceFilter = event.target.closest("[data-attendance-filter]")?.dataset.attendanceFilter;
  if (attendanceFilter) {
    store.attendanceFilter = attendanceFilter;
    render();
    return;
  }
  const reportView = event.target.closest("[data-report-view]")?.dataset.reportView;
  if (reportView) {
    store.reportView = reportView;
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
    if (isDraftLocked(type)) {
      showToast("Klik Perbaharui Data dulu untuk mengubah qty.", "error");
      return;
    }
    if (!store.inputDraft[type]) store.inputDraft[type] = {};
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

  if (event.target.closest("[data-save-attendance-settings]")) {
    saveAttendanceSettings();
    return;
  }

  const quickPanelButton = event.target.closest("[data-admin-quick-panel]");
  if (quickPanelButton) {
    const panel = quickPanelButton.dataset.adminQuickPanel;
    store.adminQuickPanel = store.adminQuickPanel === panel ? null : panel;
    render();
    return;
  }

  const refillSaveButton = event.target.closest("[data-admin-refill-save]");
  if (refillSaveButton) {
    saveRefillInput(refillSaveButton.dataset.date);
    return;
  }

  if (event.target.closest("[data-save-daily-expense]")) {
    saveDailyExpense();
    return;
  }

  const deleteExpenseButton = event.target.closest("[data-delete-daily-expense]");
  if (deleteExpenseButton) {
    requestDeleteDailyExpense(deleteExpenseButton.dataset.date, deleteExpenseButton.dataset.deleteDailyExpense);
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
  store.deleteConfirmExpense = null;
  store.deleteConfirmPizzaId = id;
  showConfirmToast(`Hapus ${pizza.name}?`);
}

function clearDeleteConfirmation() {
  store.deleteConfirmPizzaId = null;
  store.deleteConfirmExpense = null;
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
    const deleteError = store.dbError.includes("row-level security") || store.dbError.includes("42501")
      ? "Produk belum terhapus. Jalankan SQL policy delete produk dulu."
      : "Produk belum terhapus dari database.";
    showToast(deleteError, "error");
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

function saveAttendanceSettings() {
  const current = getAttendanceSettings();
  const next = {
    checkIn: normalizeTimeValue(document.querySelector('[data-attendance-setting="checkIn"]')?.value, current.checkIn),
    checkOut: normalizeTimeValue(document.querySelector('[data-attendance-setting="checkOut"]')?.value, current.checkOut),
    toleranceMinutes: normalizeToleranceMinutes(document.querySelector('[data-attendance-setting="toleranceMinutes"]')?.value),
  };
  store.attendanceSettings = next;
  saveLocalAttendanceSettings(next);
  persistDatabaseWrite(() => dbUpsertAttendanceSettings(next)).then((saved) => {
    const settingError = store.dbError.includes("attendance_")
      ? "Jam tersimpan di perangkat ini. Jalankan SQL kolom jam absensi agar sinkron."
      : "Jam absensi belum tersimpan ke database.";
    showToast(saved ? "Jam absensi berhasil disimpan" : settingError, saved ? "success" : "error");
    render();
  });
  render();
}

function saveDailyExpense() {
  const dates = getViewerDates();
  if (dates.length !== 1) {
    showToast("Pilih satu tanggal untuk simpan pengeluaran.", "error");
    return;
  }
  const date = dates[0];
  const note = store.expenseForm.note.trim();
  const amount = Number(String(store.expenseForm.amount || "").replace(/\D/g, ""));
  if (!note || amount <= 0) {
    showToast("Isi keterangan dan nominal pengeluaran.", "error");
    return;
  }

  const expense = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    note,
    amount,
    createdAt: new Date().toISOString(),
  };
  store.dailyExpenses[date] = [expense, ...(store.dailyExpenses[date] || [])];
  store.expenseForm = { note: "", amount: "" };
  saveLocalDailyExpenses();
  syncDailyExpenseWrite(() => dbUpsertDailyExpense(date, expense));
  showToast("Pengeluaran harian tersimpan", "success");
  render();
}

function requestDeleteDailyExpense(date, id) {
  const expense = (store.dailyExpenses[date] || []).find((item) => item.id === id);
  if (!expense) {
    showToast("Pengeluaran tidak ditemukan.", "error");
    return;
  }
  store.deleteConfirmPizzaId = null;
  store.deleteConfirmExpense = { date, id };
  showConfirmToast(`Hapus pengeluaran ${expense.note}?`);
}

function confirmDeleteDailyExpense() {
  const target = store.deleteConfirmExpense;
  store.deleteConfirmExpense = null;
  hideToast();
  if (!target) return;
  deleteDailyExpense(target.date, target.id);
}

function deleteDailyExpense(date, id) {
  if (!date || !id || !store.dailyExpenses[date]) return;
  const current = store.dailyExpenses[date];
  const next = current.filter((expense) => expense.id !== id);
  if (next.length === current.length) return;
  if (next.length) {
    store.dailyExpenses[date] = next;
  } else {
    delete store.dailyExpenses[date];
  }
  saveLocalDailyExpenses();
  syncDailyExpenseWrite(() => dbDeleteDailyExpense(id));
  showToast("Pengeluaran dihapus", "success");
  render();
}

function syncDailyExpenseWrite(action) {
  action().catch((error) => {
    console.warn("Daily expense was saved locally only", error);
  });
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

  const attendanceSetting = event.target.dataset.attendanceSetting;
  if (attendanceSetting) {
    if (attendanceSetting === "toleranceMinutes") {
      const value = event.target.value.replace(/\D/g, "").slice(0, 3);
      store.attendanceSettings.toleranceMinutes = value;
      event.target.value = value;
      return;
    }
    store.attendanceSettings[attendanceSetting] = normalizeTimeValue(
      event.target.value,
      DEFAULT_ATTENDANCE_SETTINGS[attendanceSetting]
    );
    return;
  }

  if (event.target.matches("[data-expense-note]")) {
    store.expenseForm.note = event.target.value;
    return;
  }

  if (event.target.matches("[data-expense-amount]")) {
    const value = event.target.value.replace(/\D/g, "").slice(0, 10);
    store.expenseForm.amount = value;
    event.target.value = value;
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

function handleFocusIn(event) {
  if (!event.target.matches("[data-admin-pin], [data-admin-password-pin]")) return;
  document.body.classList.add("pin-keyboard-active");
  updateVisibleViewport();
  [60, 180, 360, 620].forEach((delay) => {
    setTimeout(() => centerFocusedAdminPanel(event.target), delay);
  });
}

function handleFocusOut(event) {
  if (!event.target.matches("[data-admin-pin], [data-admin-password-pin]")) return;
  setTimeout(() => {
    if (!document.activeElement?.matches("[data-admin-pin], [data-admin-password-pin]")) {
      document.body.classList.remove("pin-keyboard-active");
      updateVisibleViewport();
    }
  }, 80);
}

function centerFocusedAdminPanel(target) {
  const panel = target.closest(".admin-pin-card, .admin-password-panel");
  if (!panel) return;

  updateVisibleViewport();
  const viewport = window.visualViewport;
  const viewportHeight = viewport ? viewport.height : window.innerHeight;
  const viewportTop = viewport ? viewport.offsetTop : 0;
  const topbarHeight = document.querySelector(".topbar")?.getBoundingClientRect().height || 0;
  const rect = panel.getBoundingClientRect();
  const safeVisibleHeight = Math.max(220, viewportHeight - topbarHeight);
  const targetCenter = viewportTop + topbarHeight + safeVisibleHeight / 2;
  const panelCenter = rect.top + rect.height / 2;
  const delta = panelCenter - targetCenter;

  if (Math.abs(delta) > 8) {
    window.scrollBy({ top: delta, behavior: "smooth" });
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
    document.body.classList.remove("pin-keyboard-active");
    updateVisibleViewport();
    showToast("Admin berhasil dibuka", "success");
    render();
    return;
  }

  store.adminPinInput = "";
  centerFocusedAdminPanel(document.querySelector("[data-admin-pin]"));
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

  if (isDraftLocked(submitType, today)) {
    store.dailyEditUnlocked[submitType] = true;
    showToast(`${submitLabel} bisa diperbarui. Ubah qty lalu submit lagi.`, "success");
    render();
    return;
  }

  store.submitLoading = true;
  render();

  const previousRecord = store.records[today]
    ? {
        sales: { ...store.records[today].sales },
        salesShift1: { ...(store.records[today].salesShift1 || {}) },
        salesShift2: { ...(store.records[today].salesShift2 || {}) },
        refill: { ...(store.records[today].refill || {}) },
        stock: { ...store.records[today].stock },
      }
    : null;
  const previousProgress = getDailyProgress(today);
  const record = store.records[today] || { sales: {}, salesShift1: {}, salesShift2: {}, refill: {}, stock: {} };
  if (submitType === "sales") {
    record.salesShift1 = getDraftValues("salesShift1");
    record.salesShift2 = getDraftValues("salesShift2");
    record.sales = getCombinedSalesValues(record.salesShift1, record.salesShift2);
  } else {
    record[submitType] = getDraftValues(submitType);
  }
  store.records[today] = record;
  store.dailySubmitted[today] = { ...previousProgress, [submitType]: true };
  store.dailyEditUnlocked[submitType] = false;

  const saved = await persistDatabaseWrite(() => dbUpsertDailyRecord(today));
  store.submitLoading = false;

  if (!saved) {
    if (previousRecord) {
      store.records[today] = previousRecord;
    } else {
      delete store.records[today];
    }
    store.dailySubmitted[today] = previousProgress;
    store.dailyEditUnlocked[submitType] = true;
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
  unlockTimerAudio();
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

function unlockTimerAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  if (!timerAudioContext) timerAudioContext = new AudioContextClass();
  if (timerAudioContext.state === "suspended") {
    timerAudioContext.resume().catch(() => {});
  }
  timerAudioUnlocked = true;
  return true;
}


function scheduleTimerTone(offsets, volume = 0.42) {
  if (!timerAudioContext || !timerAudioUnlocked) return;

  const now = timerAudioContext.currentTime + 0.04;
  offsets.forEach((offset, index) => {
    const oscillator = timerAudioContext.createOscillator();
    const gain = timerAudioContext.createGain();
    oscillator.type = index % 2 ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(index % 2 ? 1040 : 820, now + offset);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(volume, now + offset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.28);
    oscillator.connect(gain);
    gain.connect(timerAudioContext.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.3);
  });
}

function playTimerAlarm(label = "Timer") {
  const ready = unlockTimerAudio();
  if (navigator.vibrate) navigator.vibrate([700, 160, 700, 160, 900, 240, 900]);
  showToast(`${label} selesai`, "success");
  if (!ready) return;

  const pattern = Array.from({ length: 18 }, (_, index) => index * 0.38);
  scheduleTimerTone(pattern, 0.48);
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
      playTimerAlarm(timer.label);
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
    .getUserMedia({
      video: {
        facingMode: { ideal: store.cameraFacing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
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
    const longestSide = Math.max(video.videoWidth, video.videoHeight);
    const scale = Math.min(1, 640 / longestSide);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    store.capturedPhoto = canvas.toDataURL("image/jpeg", 0.52);
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
function updateGasThumbNodes(src, content, isError = false) {
  document.querySelectorAll("[data-gas-thumb-src]").forEach((thumb) => {
    if (thumb.dataset.gasThumbSrc !== src) return;
    if (isError) {
      thumb.classList.add("error");
      thumb.innerHTML = `<span class="material-symbols-outlined">broken_image</span>`;
      return;
    }
    const title = thumb.dataset.gasThumbTitle || "Foto absensi";
    thumb.outerHTML = `<img class="photo-thumb" alt="${escapeHtml(title)}" src="${escapeHtml(content)}" />`;
  });
}

function hydrateAttendanceThumbnails() {
  document.querySelectorAll("[data-gas-thumb-src]").forEach((thumb) => {
    const src = thumb.dataset.gasThumbSrc;
    const size = Number(thumb.dataset.gasThumbSize) || 220;
    const cacheKey = photoCacheKey(src, size);
    if (!src || photoDataCache.has(cacheKey) || photoDataLoading.has(cacheKey)) return;
    photoDataLoading.add(cacheKey);
    loadGasPhotoData(src, size)
      .then((imageSrc) => {
        photoDataCache.set(cacheKey, imageSrc);
        updateGasThumbNodes(src, imageSrc);
      })
      .catch(() => updateGasThumbNodes(src, "", true))
      .finally(() => photoDataLoading.delete(cacheKey));
  });
}

function loadGasPhotoData(src, size = 1000) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(src);
    } catch (error) {
      reject(new Error("URL foto tidak valid."));
      return;
    }

    const callbackName = `pizzainPhoto_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Foto belum dapat dimuat. Cek koneksi internet."));
    }, size <= 240 ? 9000 : 14000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (data) => {
      cleanup();
      if (data?.ok && data.dataUrl) {
        resolve(data.dataUrl);
      } else {
        reject(new Error(data?.error || "Foto belum dapat dimuat."));
      }
    };

    url.searchParams.set("action", "data");
    url.searchParams.set("size", String(size));
    url.searchParams.set("callback", callbackName);
    script.onerror = () => {
      cleanup();
      reject(new Error("Foto belum dapat dimuat. Cek koneksi internet."));
    };
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

async function openAttendancePhotoPreview(button) {
  const src = button.dataset.previewPhoto;
  const title = button.dataset.previewTitle || "Preview foto";
  const needsGasData = isGasPhotoUrl(src);
  const cacheKey = photoCacheKey(src, 640);
  const cachedSrc = needsGasData ? photoDataCache.get(cacheKey) : "";
  store.attendancePhotoPreview = {
    src,
    title,
    imageSrc: cachedSrc || (needsGasData ? "" : src),
    loading: needsGasData && !cachedSrc,
    error: "",
  };
  render();

  if (!needsGasData || cachedSrc) return;

  try {
    const imageSrc = await loadGasPhotoData(src, 640);
    photoDataCache.set(cacheKey, imageSrc);
    if (store.attendancePhotoPreview?.src !== src) return;
    store.attendancePhotoPreview = { src, title, imageSrc, loading: false, error: "" };
  } catch (error) {
    if (store.attendancePhotoPreview?.src !== src) return;
    store.attendancePhotoPreview = {
      src,
      title,
      imageSrc: "",
      loading: false,
      error: getErrorMessage(error),
    };
  }
  render();
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

  closeCamera();
  store.inputPage = "attendance";
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

function getSummaryForDates(dates, options = {}) {
  const salesScope = options.salesScope || "tenant";
  return dates.reduce(
    (total, date) => {
      const record = store.records[date] || { sales: {}, stock: {} };
      store.pizzas.forEach((pizza) => {
        const qty = getSalesQuantity(record, pizza.id, salesScope);
        total.slices += qty;
        total.revenue += qty * pizza.price;
        total.cost += qty * pizza.cost;
      });
      total.expenses += getExpenseTotalForDates([date]);
      total.ownerShare = total.slices * store.ownerFee;
      total.net = total.revenue - total.cost - total.ownerShare - total.expenses;
      total.afterFee = total.revenue - total.ownerShare;
      return total;
    },
    { slices: 0, revenue: 0, cost: 0, ownerShare: 0, expenses: 0, net: 0, afterFee: 0 }
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

function getSalesQuantity(record, pizzaId, salesScope = "tenant") {
  if (salesScope === "shift1") return Number(record.salesShift1?.[pizzaId]) || 0;
  if (salesScope === "shift2") return Number(record.salesShift2?.[pizzaId]) || 0;
  return Number(record.sales?.[pizzaId]) || 0;
}

function sumDraft(type) {
  return Object.values(store.inputDraft[type] || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
}

function sumSalesDraft() {
  return sumDraft("salesShift1") + sumDraft("salesShift2");
}

function getCombinedSalesValues(shift1 = {}, shift2 = {}, fallbackTotal = {}) {
  const hasShiftPayload = Object.keys(shift1 || {}).length > 0 || Object.keys(shift2 || {}).length > 0;
  return store.pizzas
    .filter((pizza) => pizza.active || Object.prototype.hasOwnProperty.call(fallbackTotal || {}, pizza.id))
    .reduce((values, pizza) => {
      const combined = (Number(shift1?.[pizza.id]) || 0) + (Number(shift2?.[pizza.id]) || 0);
      values[pizza.id] = hasShiftPayload ? combined : Number(fallbackTotal?.[pizza.id]) || 0;
      return values;
    }, {});
}

function getDraftValues(type) {
  return store.pizzas
    .filter((pizza) => pizza.active)
    .reduce((values, pizza) => {
      values[pizza.id] = Number(store.inputDraft[type]?.[pizza.id]) || 0;
      return values;
    }, {});
}

function isDraftLocked(type, date = isoDate(new Date())) {
  const progressType = type === "refill" ? "stock" : type.startsWith("sales") ? "sales" : type;
  return Boolean(getDailyProgress(date)[progressType] && !store.dailyEditUnlocked[progressType]);
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
  if (dates.length === 1) return formatDate(dates[0]);
  return `${shortDate(dates[0])} - ${shortDate(dates[dates.length - 1])}`;
}

function viewerDateDescription(dates) {
  if (store.viewerFilter === "custom" && store.rangeAnchor) {
    return `Pilih tanggal akhir dari ${shortDate(store.rangeAnchor)}`;
  }
  return filterDescription(dates);
}

function ticketDateDescription(dates) {
  if (dates.length === 1) return formatDate(dates[0]);
  return `${shortDate(dates[0])} - ${shortDate(dates[dates.length - 1])}`;
}

function normalizeRoute(path) {
  const route = path.replace(/\/+$/, "") || "/";
  if (route === "/") return "/";
  if (route === "/admin") return "/admin";
  if (route === "/input") return "/input";
  if (route === "/view") return "/view";
  return route;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getPreviousDate(date) {
  return isoDate(addDays(new Date(`${date}T00:00:00`), -1));
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

function loadAttendanceSettings() {
  try {
    const saved = localStorage.getItem(ATTENDANCE_SETTINGS_KEY);
    if (!saved) return;
    store.attendanceSettings = normalizeAttendanceSettings(JSON.parse(saved));
  } catch (error) {
    store.attendanceSettings = { ...DEFAULT_ATTENDANCE_SETTINGS };
  }
}

function saveLocalAttendanceSettings(settings) {
  try {
    localStorage.setItem(ATTENDANCE_SETTINGS_KEY, JSON.stringify(normalizeAttendanceSettings(settings)));
  } catch (error) {
    console.warn("Attendance settings were not saved locally", error);
  }
}

function getAttendanceSettings() {
  return normalizeAttendanceSettings(store.attendanceSettings);
}

function normalizeAttendanceSettings(settings = {}) {
  return {
    checkIn: normalizeTimeValue(settings.checkIn, DEFAULT_ATTENDANCE_SETTINGS.checkIn),
    checkOut: normalizeTimeValue(settings.checkOut, DEFAULT_ATTENDANCE_SETTINGS.checkOut),
    toleranceMinutes: normalizeToleranceMinutes(settings.toleranceMinutes),
  };
}

function normalizeTimeValue(value, fallback) {
  const parts = String(value || "")
    .split(/\D+/)
    .filter(Boolean)
    .map(Number);
  const hour = Math.min(23, Math.max(0, parts[0] || 0));
  const minute = Math.min(59, Math.max(0, parts[1] || 0));
  if (!parts.length) return fallback || DEFAULT_ATTENDANCE_SETTINGS.checkIn;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeToleranceMinutes(value) {
  const minutes = Number(String(value ?? "").replace(/\D/g, ""));
  if (!Number.isFinite(minutes)) return DEFAULT_ATTENDANCE_SETTINGS.toleranceMinutes;
  return Math.min(180, Math.max(0, minutes));
}

function timeToMinutes(value, fallback) {
  const time = normalizeTimeValue(value, fallback);
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function displayClock(value) {
  return normalizeTimeValue(value, DEFAULT_ATTENDANCE_SETTINGS.checkIn).replace(":", ".");
}

function loadDailyExpenses() {
  try {
    const saved = localStorage.getItem(DAILY_EXPENSES_KEY);
    store.dailyExpenses = normalizeDailyExpenses(saved ? JSON.parse(saved) : {});
  } catch (error) {
    store.dailyExpenses = {};
  }
}

function saveLocalDailyExpenses() {
  try {
    localStorage.setItem(DAILY_EXPENSES_KEY, JSON.stringify(normalizeDailyExpenses(store.dailyExpenses)));
  } catch (error) {
    console.warn("Daily expenses were not saved locally", error);
  }
}

function normalizeDailyExpenses(data = {}) {
  return Object.entries(data).reduce((expensesByDate, [date, items]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(items)) return expensesByDate;
    const expenses = items
      .map((item) => ({
        id: String(item.id || `${date}-${Math.random().toString(36).slice(2, 8)}`),
        note: String(item.note || "").trim(),
        amount: Math.max(0, Number(item.amount) || 0),
        createdAt: item.createdAt || "",
      }))
      .filter((item) => item.note && item.amount > 0);
    if (expenses.length) expensesByDate[date] = expenses;
    return expensesByDate;
  }, {});
}

function getExpensesForDates(dates) {
  return dates
    .flatMap((date) =>
      (store.dailyExpenses[date] || []).map((expense) => ({
        ...expense,
        date,
      }))
    )
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
}

function getExpenseTotalForDates(dates) {
  return getExpensesForDates(dates).reduce((sum, expense) => sum + expense.amount, 0);
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
  const settings = getAttendanceSettings();
  const checkInMinutes = timeToMinutes(settings.checkIn, DEFAULT_ATTENDANCE_SETTINGS.checkIn);
  const checkOutMinutes = timeToMinutes(settings.checkOut, DEFAULT_ATTENDANCE_SETTINGS.checkOut);
  const tolerance = settings.toleranceMinutes;
  if (type === "in") {
    if (minutes < checkInMinutes - 60) {
      return {
        status: "early",
        badge: "Di luar jam",
        message: `Absen masuk ${time}, terlalu awal dari jadwal ${displayClock(settings.checkIn)}.`,
      };
    }

    if (minutes <= checkInMinutes + tolerance) {
      return {
        status: "ontime",
        badge: "Tepat waktu",
        message: `Absen masuk ${time}, tepat waktu untuk jadwal ${displayClock(settings.checkIn)}. Terima kasih.`,
      };
    }

    return {
      status: "late",
      badge: "Terlambat",
      message: `Absen masuk ${time}, terlambat ${minutes - checkInMinutes - tolerance} menit dari toleransi jadwal ${displayClock(settings.checkIn)}.`,
    };
  }

  if (minutes < checkOutMinutes - tolerance) {
    return {
      status: "early",
      badge: "Belum waktunya",
      message: `Absen pulang ${time}, sebelum jadwal pulang ${displayClock(settings.checkOut)}.`,
    };
  }

  if (minutes <= checkOutMinutes + tolerance) {
    return {
      status: "ontime",
      badge: "Tepat waktu",
      message: `Absen pulang ${time}, tepat waktu. Terima kasih.`,
    };
  }

  return {
    status: "late",
    badge: "Lewat jadwal",
    message: `Absen pulang ${time}, lewat ${minutes - checkOutMinutes - tolerance} menit dari toleransi jadwal ${displayClock(settings.checkOut)}.`,
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
  return String(value ?? "")
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
      <button type="button" data-cancel-delete>Tidak</button>
      <button type="button" data-confirm-delete>Ya</button>
    </div>
  `;
  toast.className = "toast confirm show";
}

function hideToast() {
  toast.className = "toast";
  toast.innerHTML = "";
}









