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

const SUPABASE_URL = "https://qipqhopjbwjquschrggt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcHFob3BqYndqcXVzY2hyZ2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NjQ1MDYsImV4cCI6MjA5NzQ0MDUwNn0._LAfxDUc7JDb8SfGjL-XwoeC2ECbrJvDoEKx4_iTuH0";
const DOKO_APP_ID = "pizzain_doko_v1";
const REFILL_STOCK_PREFIX = "__refill__";
const SALES_SHIFT_1_PREFIX = "__shift1__";
const SALES_SHIFT_2_PREFIX = "__shift2__";
const DEFAULT_ATTENDANCE_SETTINGS = {
  checkIn: "16:00",
  checkOut: "23:00",
  toleranceMinutes: 0,
};

const store = {
  tenants: [{ ...DEFAULT_TENANT }, { ...INITIAL_NEW_TENANT }],
  tenantsReady: false,
  tenantsError: "",
  tenantResolved: false,
  tenantSelection: DEFAULT_TENANT.id,
  tenantError: "",
  pendingWrites: 0,
  combinedTenants: [],
  staffForm: emptyStaffForm(),
  editingStaffId: null,
  newStaffId: null,
  staffSaving: false,
  staffFormOpen: false,
  staffError: "",
  ownerFee: 2000,
  ownerFeeMode: "fixed",
  ownerFeePercent: 0,
  ownerFeeDraft: null,
  adminView: normalizeRoute(location.pathname) === "/view" ? "reports" : "dashboard",
  adminQuickPanel: null,
  reportView: "tenant",
  attendanceFilter: "in",
  adminUnlocked: false,
  adminPinInput: "",
  adminPasswordForm: {
    pin: "",
  },
  attendanceSettings: { ...DEFAULT_ATTENDANCE_SETTINGS },
  inputPage: "sales",
  viewerFilter: "today",
  rangeStart: isoDate(new Date()),
  rangeEnd: isoDate(new Date()),
  rangeAnchor: null,
  calendarMonth: monthKey(new Date()),
  calendarPickerOpen: false,
  viewerLoading: false,
  submitLoading: false,
  dbLoading: false,
  dbReady: false,
  dbError: "",
  editingPizzaId: null,
  pizzaFormOpen: false,
  deleteConfirmPizzaId: null,
  deleteConfirmExpense: null,
  attendancePhotoPreview: null,
  pizzaForm: {
    name: "",
    cost: "",
    price: "",
    active: true,
  },
  inputDraft: {
    sales: {},
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
document.addEventListener("submit", (event) => {
  if (event.target.matches("[data-access-form]")) { event.preventDefault(); saveAccessAccount(); return; }
  if (event.target.matches("[data-staff-form]")) { event.preventDefault(); saveStaff(); }
});
document.addEventListener("input", handleInput);
document.addEventListener("change", handleChange);
document.addEventListener("keydown", handleKeydown);
document.addEventListener("focusin", handleFocusIn);
document.addEventListener("focusout", handleFocusOut);
setInterval(updateTimers, 1000);

updateVisibleViewport();
render();
initializeDatabase();

function updateVisibleViewport() {
  const viewport = window.visualViewport;
  const height = viewport ? viewport.height : window.innerHeight;
  const top = viewport ? viewport.offsetTop : 0;
  document.documentElement.style.setProperty("--visible-vh", `${Math.round(height)}px`);
  document.documentElement.style.setProperty("--visible-top", `${Math.round(top)}px`);
}

async function initializeDatabase(reloadProfiles = true) {
  if (!hasAccessSession()) { render(); return; }
  const generation = access.generation;
  store.dbLoading = true;
  store.dbReady = false;
  store.dbError = "";
  store.tenantError = "";
  if (!isLockedAdminPinRoute()) render();
  try {
    if (reloadProfiles) {
      await loadTenantProfiles();
    }
    if (isAccessStaff()) {
      await loadStaffWorkspace();
    } else if (isAllTenants()) {
      await loadCombinedTenants();
    } else {
      loadAttendanceSettings();
      loadDailyExpenses();
      await loadRemoteData();
      if (!isInputRoute() && store.adminView === "attendance") {
        await loadRemoteAttendanceHistory();
      } else if (!isInputRoute() && store.adminView === "settings") {
        await loadRemoteAttendanceSettings();
      }
    }
    if (isAccessAdmin() && store.adminView === "staff") await loadAccessAccounts();
    if (generation !== access.generation) return;
    store.dbReady = true;
  } catch (error) {
    if (generation !== access.generation) return;
    store.dbError = getErrorMessage(error);
    store.tenantError = store.dbError;
    console.error("Supabase sync failed", error);
  } finally {
    if (generation === access.generation) {
      store.dbLoading = false;
      if (!isLockedAdminPinRoute()) render();
    }
  }
}

function isLockedAdminPinRoute() {
  return !hasAccessSession();
}

async function loadRemoteData() {
  const generation = access.generation;
  const [settingsRows, pizzaRows, recordRows, remoteExpenses] = await Promise.all([
    dbSelect("doko_settings", `app_id=eq.${dataAppId()}&select=owner_fee,owner_fee_mode,owner_fee_percent&limit=1`),
    dbSelect("doko_pizzas", `app_id=eq.${dataAppId()}&select=id,name,cost,price,pack_size,pack_price,active,image,sort_order&order=sort_order.asc`),
    dbSelect("doko_daily_records", `app_id=eq.${dataAppId()}&select=record_date,sales,sales_detail,stock,submitted_at&order=record_date.desc`),
    loadRemoteDailyExpenses(),
  ]);
  if (generation !== access.generation) throw Error("Sesi telah berubah.");

  if (settingsRows[0]) {
    store.ownerFee = Number(settingsRows[0].owner_fee ?? 2000);
    store.ownerFeeMode = settingsRows[0].owner_fee_mode === "percent" ? "percent" : "fixed";
    store.ownerFeePercent = Number(settingsRows[0].owner_fee_percent ?? 0);
    store.ownerFeeDraft = null;
  } else {
    throw new Error("Pengaturan tenant belum tersedia. Minta admin menyelesaikan penyiapan tenant.");
  }

  if (pizzaRows.length) {
    store.pizzas = pizzaRows.map((row) => ({
      id: row.id,
      name: row.name,
      cost: Number(row.cost) || 0,
      price: Number(row.price) || 0,
      packSize: Number(row.pack_size) || 0,
      packPrice: Number(row.pack_price) || 0,
      active: Boolean(row.active),
      image: row.image || PIZZA_IMAGES.veggie,
    }));
  } else {
    store.pizzas = [];
  }

  store.records = {};
  store.dailySubmitted = {};
  store.inputDraft = { sales: {}, refill: {}, stock: {} };
  recordRows.forEach((row) => {
    const stockParts = splitStockPayload(row.stock);
    const salesParts = splitSalesPayload(row.sales);
    store.records[row.record_date] = {
      sales: salesParts.total,
      salesDetail: row.sales_detail || {},
      refill: stockParts.refill,
      stock: stockParts.stock,
    };
    store.dailySubmitted[row.record_date] = parseDailyProgress(row);
  });

  store.attendance = {};

  const today = isoDate(new Date());
  if (!store.attendance[today]) store.attendance[today] = { in: null, out: null };
  if (store.records[today]) {
    store.inputDraft.sales = { ...store.records[today].sales };
    store.inputDraft.packs = salesPackCounts(store.records[today].salesDetail);
    store.inputDraft.refill = { ...(store.records[today].refill || {}) };
    store.inputDraft.stock = { ...store.records[today].stock };
  }
  store.dailyExpenses = normalizeDailyExpenses({ ...store.dailyExpenses, ...remoteExpenses });
  saveLocalDailyExpenses();
  syncLocalDailyExpensesToRemote(remoteExpenses);
}

async function dbSelect(table, query) {
  return dbRequest(`${table}?${query}`);
}



async function loadRemoteAttendanceSettings() {
  try {
    const rows = await dbSelect(
      "doko_settings",
      `app_id=eq.${dataAppId()}&select=attendance_check_in,attendance_check_out,attendance_tolerance_minutes&limit=1`
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

async function loadRemoteAttendanceHistory() {
  const [rows] = await Promise.all([
    dbSelect("doko_attendance", `app_id=eq.${dataAppId()}&select=record_date,in_record,out_record&order=record_date.desc`),
    loadRemoteAttendanceSettings(),
  ]);
  store.attendance = Object.fromEntries(rows.map((row) => [row.record_date, { in: row.in_record || null, out: row.out_record || null }]));
}

async function loadRemoteDailyExpenses() {
  try {
    const rows = await dbSelect(
      "doko_daily_expenses",
      `app_id=eq.${dataAppId()}&select=id,record_date,note,amount,created_at&order=record_date.desc,created_at.desc`
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
    return remoteExpenses;
  } catch (error) {
    console.warn("Daily expenses table is not ready yet", error);
    throw error;
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
  const generation = access.generation;
  const controller = new AbortController();
  const readOnlyRpc = /^rpc\/doko_access_(me|list|workspace)$/.test(path);
  const timeout = setTimeout(() => controller.abort(), options.method && options.method !== "GET" && !readOnlyRpc ? 20000 : 8000);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    signal: controller.signal,
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    if (generation === access.generation && (response.status === 401 || (response.status === 403 && text.includes("Sesi berakhir")))) clearAccessSession("Sesi berakhir. Masukkan PIN kembali.");
    let message = text;
    try { message = JSON.parse(text).message || text; } catch {}
    throw new Error(message || `Database error ${response.status}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Koneksi terlalu lama. Periksa internet lalu coba lagi.");
    if (error instanceof TypeError) throw new Error("Data belum berhasil dimuat. Periksa koneksi internet lalu coba lagi.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function dbUpsertSetting(fee) {
  return dbUpsert(
    "doko_settings",
    { app_id: dataAppId(), owner_fee: fee.ownerFee, owner_fee_mode: fee.ownerFeeMode,
      owner_fee_percent: fee.ownerFeePercent, updated_at: new Date().toISOString() },
    "app_id"
  );
}

async function dbUpsertAdminPin(pin) {
  return dbRequest("rpc/doko_access_admin_pin", { method: "POST", body: { p_pin: pin } });
}

async function dbUpsertAttendanceSettings(settings) {
  const next = normalizeAttendanceSettings(settings);
  return dbUpsert(
    "doko_settings",
    {
      app_id: dataAppId(),
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
      app_id: dataAppId(),
      id: pizza.id,
      name: pizza.name,
      cost: pizza.cost,
      price: pizza.price,
      pack_size: pizza.packSize || 0,
      pack_price: pizza.packPrice || 0,
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
      app_id: dataAppId(),
      id: pizza.id,
      name: pizza.name,
      cost: pizza.cost,
      price: pizza.price,
      pack_size: pizza.packSize || 0,
      pack_price: pizza.packPrice || 0,
      active: pizza.active,
      image: pizza.image || PIZZA_IMAGES.veggie,
      sort_order: index,
      updated_at: new Date().toISOString(),
    })),
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}
async function dbDeletePizza(id) {
  return dbRequest(`doko_pizzas?app_id=eq.${dataAppId()}&id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

async function dbUpsertDailyExpense(date, expense) {
  return dbUpsert(
    "doko_daily_expenses",
    {
      app_id: dataAppId(),
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
  return dbRequest(`doko_daily_expenses?app_id=eq.${dataAppId()}&id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

async function dbUpsertDailyRecord(date, type) {
  const record = store.records[date] || { sales: {}, refill: {}, stock: {} };
  if (isAccessStaff()) {
    if (!["sales","stock"].includes(type) || !canAccess(type === "sales" ? "input_sales" : "input_stock")) throw Error("Anda tidak memiliki hak input ini.");
    const values = cleanDailyValues(record[type]);
    if (type === "sales") Object.entries(record.salesDetail || {}).forEach(([id, detail]) => {
      if (Object.hasOwn(values, id)) values[`__loyang__${id}`] = detail.packs || 0;
    });
    return dbRequest("rpc/doko_access_submit", { method: "POST", body: { p_tenant_id: currentTenant.id, p_type: type, p_date: date, p_values: values } });
  }
  const progress = getDailyProgress(date);
  return dbUpsert(
    "doko_daily_records",
    {
      app_id: dataAppId(),
      record_date: date,
      sales: withSubmittedFlag(record.sales, progress.sales),
      sales_detail: record.salesDetail || {},
      stock: withSubmittedFlag(packStockPayload(record.stock, record.refill), progress.stock),
      submitted_at: new Date().toISOString(),
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
  // Read legacy split rows as one total; never add their cached total twice.
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
    return { total };
  }

  new Set([...Object.keys(shift1), ...Object.keys(shift2)]).forEach((id) => {
    total[id] = (Number(shift1[id]) || 0) + (Number(shift2[id]) || 0);
  });

  return { total };
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
  store.pendingWrites += 1;
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
  } finally {
    store.pendingWrites -= 1;
  }
}
function render() {
  if (access.loading && hasAccessSession()) { app.innerHTML = ""; return; }
  if (!hasAccessSession()) { app.innerHTML = pinShell(renderAccessLogin()); return; }
  app.innerHTML = isAccessAdmin() ? shell("admin",renderAdmin()) : shell("staff",renderStaffPortal());

  if (store.attendancePhotoPreview) {
    app.insertAdjacentHTML("beforeend", renderPhotoPreviewModal());
  }

  hydrateAttendanceThumbnails();
}

function shell(role, content) {
  const roleLabel = {
    admin: store.tenantResolved && !isAllTenants() ? staffTenantLabel() : "Halaman admin",
    staff: `${access.actor?.name || "Staff"}${store.tenants.length ? " · " + tenantLabel() : ""}`,
    input: store.tenantResolved ? staffTenantLabel() : "Memuat tenant...",
    viewer: "Laporan bagi hasil tenant Pizzain",
  }[role];

  return `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="${roleHref(role)}" data-link aria-label="Pizzain Tenant ${role}">
          <span class="brand-mark"><img src="/assets/logo-pizzain-apk.jpg" alt="Logo Pizzain Tenant" /></span>
          <span>
            <h1>Pizzain Tenant</h1>
            <p>${escapeHtml(roleLabel)}</p>
          </span>
        </a>
        ${hasAccessSession() ? '<button class="access-logout" type="button" data-access-logout aria-label="Keluar dari akun"><span class="material-symbols-outlined" aria-hidden="true">logout</span><span>Keluar</span></button>' : ""}
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
  if (hasAccessSession()) return store.tenantResolved ? `/view${store.tenantSelection ? "?tenant="+encodeURIComponent(store.tenantSelection) : ""}` : location.pathname + (location.search || "");
  if (role === "input") return store.tenantResolved ? `/input/${encodeURIComponent(currentTenant.id)}` : location.pathname + (location.search || "");
  if (role === "viewer") return "/view";
  return `/${role}${store.tenantSelection !== DEFAULT_TENANT.id ? `?tenant=${encodeURIComponent(store.tenantSelection)}` : ""}`;
}

function renderAdminPin() { return renderAccessLogin(); }

function renderAdmin() {
  if (!store.tenantResolved) return `<main class="main narrow"><section class="panel stack"><p role="status">${escapeHtml(store.tenantError || "Memuat data tenant...")}</p>${store.tenantError ? '<button class="btn secondary" data-retry-tenant>Coba lagi</button>' : ""}</section></main>`;
  if (store.adminView === "pizza" || store.adminView === "fee") {
    store.adminView = "settings";
  }
  const summary = getSummaryForDates(getViewerDates());
  return `
    <main class="main narrow admin-main ${store.adminView === 'input' ? 'admin-input-main' : ''}">
      <nav class="input-tabs admin-tabs access-admin-tabs" aria-label="Menu admin">
        ${adminMenuButton("dashboard", "space_dashboard", "Dashboard")}
        ${adminMenuButton("reports", "receipt_long", "Laporan")}
        ${adminMenuButton("input", "point_of_sale", "Input")}
        ${adminMenuButton("staff", "groups", "Staff")}
        ${adminMenuButton("settings", "settings", "Setting")}
      </nav>
      ${renderTenantSelector()}
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
  if (store.adminView === "staff") return renderAccessManagement();
  if (store.dbLoading) return '<section class="panel"><p role="status">Memuat data tenant...</p></section>';
  if (store.tenantError) return '<section class="panel"><p role="alert">' + escapeHtml(store.tenantError) + '</p><button class="btn secondary" type="button" data-retry-tenant>Coba lagi</button></section>';
  if (isAllTenants()) return renderCombinedTenants();
  if (store.adminView === "input") return renderInput({embedded:true});

  if (store.adminView === "settings") return renderManagePizza();
  if (store.adminView === "attendance") return renderAttendanceHistory();
  if (store.adminView === "reports") return renderAdminReport();
  return renderAdminDashboard(summary);
}

function renderAdminDashboard(summary) {
  const selectedDates = getViewerDates();
  const showStock = selectedDates.length === 1;
  const selectedDate = showStock ? selectedDates[0] : "";
  if (!hasTenantDataForDates(selectedDates)) return `
    <section class="panel stack viewer-filter-panel admin-filter-panel"><div class="segmented" role="tablist" aria-label="Filter tanggal dashboard admin">${viewerFilterButton("today", "Hari Ini")}${viewerFilterButton("yesterday", "Kemarin")}${viewerFilterButton("custom", "Custom")}</div>${store.viewerFilter === "custom" ? renderCalendarRange() : ""}</section>
    ${selectedDate ? renderAdminQuickPanels(selectedDate) : ""}
    ${renderTenantEmptyState(selectedDates)}`;
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
          <span class="viewer-summary-title">Bagi Hasil ${escapeHtml(tenantLabel())}</span>
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
            if (editing && type === "sales" && (row.pizza.packSize || store.records[editDate]?.salesDetail?.[row.pizza.id]?.pack_size)) {
              return renderPackSalesRow(row.pizza, store.adminEdit.values, store.adminEdit.packs || {}, store.records[editDate]?.salesDetail || {}, editDate);
            }
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
              <strong>${formatStockDifference(row.diff)}</strong>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function formatStockDifference(diff) {
  if (diff === 0) return "Pas";
  const amount = Math.abs(diff);
  return diff > 0 ? `Kurang ${amount} slice` : `Lebih ${amount} slice`;
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
    packs: salesPackCounts(record.salesDetail),
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
        ...store.records[date],
        sales: { ...store.records[date].sales },
        refill: { ...(store.records[date].refill || {}) },
        stock: { ...store.records[date].stock },
      }
    : null;
  const previousProgress = getDailyProgress(date);
  const record = store.records[date] || { sales: {}, refill: {}, stock: {} };

  store.adminEdit.saving = true;
  record[type] = getAdminRecordDraftValues();
  if (type === "sales") record.salesDetail = buildSalesDetail(record.sales, store.adminEdit.packs, record.salesDetail);
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
        <h3>Produk ${escapeHtml(tenantLabel())}</h3>
        <button class="btn product-add-btn" type="button" data-add-pizza>
          <span class="material-symbols-outlined">add</span>
          Produk
        </button>
      </div>
      <div class="stack product-list">
        ${store.pizzas.map(renderPizzaAdminRow).join("") || '<p class="muted">Belum ada produk. Tambahkan katalog untuk tenant ini.</p>'}
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
            <span>Modal / slice</span>
            <input id="pizza-cost" data-form-field="cost" inputmode="numeric" value="${escapeHtml(store.pizzaForm.cost)}" placeholder="10000" />
          </label>
          <label class="compact-product-field" for="pizza-price">
            <span>Jual / slice</span>
            <input id="pizza-price" data-form-field="price" inputmode="numeric" value="${escapeHtml(store.pizzaForm.price)}" placeholder="25000" />
          </label>
          <label class="compact-product-field" for="pizza-pack-size">
            <span>Slice / loyang</span>
            <input id="pizza-pack-size" data-form-field="packSize" inputmode="numeric" value="${escapeHtml(store.pizzaForm.packSize || '')}" placeholder="0 = hanya eceran" />
          </label>
          <label class="compact-product-field" for="pizza-pack-price">
            <span>Jual / loyang</span>
            <input id="pizza-pack-price" data-form-field="packPrice" inputmode="numeric" value="${escapeHtml(store.pizzaForm.packPrice || '')}" placeholder="100000" />
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
          <p>Modal ${rupiah(pizza.cost)} | Jual ${rupiah(pizza.price)}${pizza.packSize ? ` / slice<br>${rupiah(pizza.packPrice)} / loyang · ${pizza.packSize} slice` : ''}</p>
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
  const fee = store.ownerFeeDraft || store;
  const percent = fee.ownerFeeMode === "percent";
  return `
    <section class="panel fee-compact-panel">
      <div class="fee-compact-head">
        <div>
          <span>Bagi Hasil Pemilik Tempat</span>
          <strong>${ownerFeeLabel(store)}</strong>
        </div>
        <button class="btn fee-save-btn" data-save-fee aria-label="Simpan fee pemilik">Simpan</button>
      </div>
      <div class="segmented fee-mode" role="group" aria-label="Jenis bagi hasil">
        <button type="button" data-fee-mode="fixed" class="${percent ? "" : "active"}" aria-pressed="${!percent}">Rp / slice</button>
        <button type="button" data-fee-mode="percent" class="${percent ? "active" : ""}" aria-pressed="${percent}">% Penjualan</button>
      </div>
      <label class="fee-compact-field" for="owner-fee">
        <span>${percent ? "Persen (%)" : "Nominal (Rp)"}</span>
        <input id="owner-fee" data-owner-fee inputmode="${percent ? "decimal" : "numeric"}" value="${escapeHtml(String(percent ? fee.ownerFeePercent : fee.ownerFee))}" />
      </label>
      <p class="fee-help">${percent ? "Dari harga jual setiap slice, sebelum modal dan biaya." : "Nominal tetap untuk setiap slice terjual."}</p>
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
          <strong>PIN 4–6 angka</strong>
        </div>
        <button class="btn password-save-btn" data-save-admin-password aria-label="Simpan password admin">Simpan</button>
      </div>
      <label class="password-compact-field" for="admin-password-new">
        <span>PIN Baru</span>
        <input id="admin-password-new" data-admin-password-pin type="password" inputmode="numeric" maxlength="6" value="${escapeHtml(store.adminPasswordForm.pin)}" placeholder="4–6 angka" />
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
  if (!store.tenantResolved || store.dbLoading || store.tenantError || !currentTenant.active) {
    return '<main class="main narrow"><section class="panel stack"><h3>' + escapeHtml(store.tenantResolved ? staffTenantLabel() : "Input Tenant") + '</h3><p role="status">' + escapeHtml(store.tenantError || (!currentTenant.active ? "Staff ini sudah nonaktif. Hubungi admin." : "Memuat data tenant...")) + '</p><button class="btn secondary" type="button" data-retry-tenant>Coba Lagi</button></section></main>';
  }
  const showSubmit = !options.preview && (store.inputPage === "sales" || store.inputPage === "stock");
  const activePizzas = store.pizzas.filter((pizza) => pizza.active);
  const previewClass = options.preview || options.embedded ? "" : "main narrow";

  return `
    <main class="${previewClass}">
      <nav class="input-tabs" aria-label="Halaman input">
        ${inputPageButton("sales", "point_of_sale", "Penjualan")}
        ${inputPageButton("stock", "inventory_2", "Stok")}
        ${inputPageButton("timer", "timer", "Timer")}
      </nav>
      ${renderInputPage({ activePizzas })}
    </main>
    ${showSubmit ? renderSubmitBar() : ""}
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

function renderInputPage({ activePizzas }) {
  if (store.inputPage === "sales") return renderInputSales(activePizzas);
  if (store.inputPage === "stock") return renderInputStock(activePizzas);
  if (store.inputPage === "timer") return renderInputTimers();
  return renderInputSales(activePizzas);
}


function renderInputSales(activePizzas) {
  return `
    <section class="panel sales-panel shift-sales-panel">
      <div class="section-title solid compact-sales-title">
        <span class="icon-tile"><span class="material-symbols-outlined">point_of_sale</span></span>
        <div><h3>Laporan Penjualan</h3></div>
      </div>
      <div class="sales-shift-stack">
        ${renderStaffSalesCard(activePizzas)}
      </div>
    </section>
  `;
}
function renderStaffSalesCard(activePizzas) {
  const total = sumDraft("sales");
  return `
    <section class="sales-shift-card shift-one" aria-label="Penjualan Staff">
      <div class="sales-shift-head"><h4>TOTAL PENJUALAN</h4><span>${total} slice</span></div>
      <div class="sales-shift-list">${activePizzas.map((pizza) => renderCounterRow(pizza, "sales")).join("")}</div>
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


function renderCounterRow(pizza, type) {
  if (type === "sales" && (pizza.packSize || store.records[isoDate(new Date())]?.salesDetail?.[pizza.id]?.pack_size)) {
    return renderPackSalesRow(pizza, store.inputDraft.sales, store.inputDraft.packs || {}, store.records[isoDate(new Date())]?.salesDetail || {});
  }
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

function renderSubmitBar() {
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
      <button class="btn full" data-submit-daily ${store.submitLoading ? "disabled" : ""}>${label}</button>
    </div>
  `;
}

function renderAdminReport() {
  const selectedDates = getViewerDates();
  const reportView = store.reportView === "staff" ? "staff" : "tenant";
  const reportLabel = reportView === "staff" ? "Staff" : "Tenant";
  const summary = getSummaryForDates(selectedDates, { salesScope: reportView });
  const isCustom = store.viewerFilter === "custom";
  const isTenantReport = reportView === "tenant";
  if (!hasTenantDataForDates(selectedDates)) return renderAdminReportFilters(isCustom) + renderTenantEmptyState(selectedDates);

  return `
    ${renderAdminReportFilters(isCustom)}
    <section class="admin-report-ticket" aria-label="Laporan untuk pemilik usaha">
      <div class="ticket-head">
        <div class="ticket-head-copy">
          <span class="brand-mark"><img src="/assets/logo-pizzain-apk.jpg" alt="Logo Pizzain DOKO" /></span>
          <div>
            <span>Laporan ${reportLabel}</span>
            <h3>${escapeHtml(staffTenantLabel())}</h3>
            <p>${ticketDateDescription(selectedDates)}</p>
          </div>
        </div>
        <strong>${summary.slices}<small>slice</small></strong>
      </div>
      <div class="ticket-divider"></div>
      <div class="ticket-section-title">Detail Pizza Terjual</div>
      ${renderVariantReports(selectedDates, { showMoney: false, compact: true, ticket: true, salesScope: reportView })}
      <div class="ticket-divider"></div>
      ${isTenantReport ? renderViewerTotals(summary, isCustom || selectedDates.length > 1, { ticket: true }) : renderStaffReportTotals(summary)}
    </section>
  `;
}

function hasTenantDataForDates(dates) {
  return dates.some((date) => Boolean(store.records[date]) || Boolean(store.dailyExpenses[date]?.length));
}

function renderTenantEmptyState(dates, kind = "") {
  return `<section class="panel tenant-empty-state" role="status">
    <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
    <h3>Belum ada data</h3>
    <p>${escapeHtml(staffTenantLabel())} belum memiliki data ${kind === "sales" ? "penjualan" : kind === "stock" ? "stok" : "penjualan, stok, atau pengeluaran"} pada tanggal ini.</p>
    <small>${ticketDateDescription(dates)}</small>
  </section>`;
}

function renderAdminReportFilters(isCustom) {
  return `
    <section class="panel stack viewer-filter-panel admin-report-filter">
      <div class="segmented" role="tablist" aria-label="Filter tanggal laporan">
        ${viewerFilterButton("today", "Hari Ini")}
        ${viewerFilterButton("yesterday", "Kemarin")}
        ${viewerFilterButton("custom", "Custom")}
      </div>
      <div class="report-type-tabs" role="tablist" aria-label="Jenis laporan">
        ${reportTypeButton("tenant", "Tenant")}
        ${reportTypeButton("staff", "Staff")}
      </div>
      ${isCustom ? renderCalendarRange() : ""}
    </section>
  `;
}

function reportTypeButton(view, label) {
  const active = store.reportView === view ? "active" : "";
  return `<button class="${active}" type="button" data-report-view="${view}">${label}</button>`;
}

function renderStaffReportTotals(summary) {
  const label = "Staff";
  const income = summary.ownerShare;
  const incomeFormula = ownerFeeFormula(summary);

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
  const feeFormula = ownerFeeFormula(summary);
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
          <span class="viewer-summary-title">Bagi Hasil ${escapeHtml(tenantLabel())}</span>
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
  const monthDate = new Date(`${getCalendarMonthKey()}-01T00:00:00`);
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
        <div class="calendar-month-nav">
          <button class="calendar-month-step" type="button" data-calendar-month-delta="-1" aria-label="Bulan sebelumnya">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button class="calendar-month-title" type="button" data-calendar-month-toggle aria-expanded="${store.calendarPickerOpen}">
            <strong>${monthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</strong>
          </button>
          <button class="calendar-month-step" type="button" data-calendar-month-delta="1" aria-label="Bulan berikutnya">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <span class="chip gray">${shortDate(store.rangeStart)} - ${shortDate(store.rangeEnd)}</span>
      </div>
      ${store.calendarPickerOpen ? renderCalendarMonthPicker(monthDate) : ""}
      <div class="calendar-grid">
        ${["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => `<span class="weekday">${day}</span>`).join("")}
        ${cells.join("")}
      </div>
    </div>
  `;
}

function renderCalendarMonthPicker(monthDate) {
  const selectedMonth = monthDate.getMonth();
  const selectedYear = monthDate.getFullYear();
  const years = getCalendarYearOptions(selectedYear);

  return `
    <div class="calendar-month-picker">
      <select data-calendar-month-select aria-label="Pilih bulan">
        ${Array.from({ length: 12 }, (_, index) => {
          const label = new Date(selectedYear, index, 1).toLocaleDateString("id-ID", { month: "long" });
          return `<option value="${index + 1}" ${index === selectedMonth ? "selected" : ""}>${label}</option>`;
        }).join("")}
      </select>
      <select data-calendar-year-select aria-label="Pilih tahun">
        ${years.map((year) => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`).join("")}
      </select>
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
                  <p>${pizza.packSize ? packSalesDescription(dates, pizza) : `${rupiah(pizza.price)} / slice`}</p>
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
  if (handleAccessClick(event)) return;
  if (!hasAccessSession()) return;
  if (!event.target.closest("[data-tenant-picker]")) closeTenantPicker();
  if (event.target.closest('[data-tenant-toggle][aria-disabled="true"]')) { event.preventDefault(); return; }
  if (event.target.closest("[data-retry-tenant]")) { initializeDatabase(); return; }
  const selectedTenant = event.target.closest("[data-select-tenant]")?.dataset.selectTenant;
  if (selectedTenant) {
    const fromPicker = Boolean(event.target.closest("[data-tenant-option]"));
    closeTenantPicker();
    switchTenant(selectedTenant).then(() => {
      if (fromPicker) document.querySelector("[data-tenant-toggle]")?.focus({ preventScroll: true });
    });
    return;
  }
  const editStaffId = event.target.closest("[data-edit-staff]")?.dataset.editStaff;
  if (editStaffId) { editStaff(editStaffId); return; }
  if (event.target.closest("[data-open-staff]")) {
    store.staffFormOpen = true; store.staffError = ""; render(); return;
  }
  const toggleStaffId = event.target.closest("[data-toggle-staff]")?.dataset.toggleStaff;
  if (toggleStaffId) { toggleStaff(toggleStaffId); return; }
  const copyTenantId = event.target.closest("[data-copy-tenant]")?.dataset.copyTenant;
  if (copyTenantId) { copyTenantUrl(copyTenantId); return; }
  if (event.target.closest("[data-cancel-staff]")) {
    store.staffForm = emptyStaffForm(); store.staffFormOpen = false; store.editingStaffId = null; store.newStaffId = null; store.staffError = ""; render(); return;
  }

  const link = event.target.closest("[data-link]");
  if (link) {
    event.preventDefault();
    history.pushState({}, "", link.getAttribute("href"));
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
    if (!isAccessAdmin()) return;
    store.adminView = adminView;
    if (adminView === "staff") loadAccessAccounts();
    else if (["attendance", "settings"].includes(adminView) && !store.dbLoading) initializeDatabase(false);
    else render();
    return;
  }

  if (event.target.closest("[data-unlock-admin]")) {
    unlockAdmin();
    return;
  }

  if (event.target.closest("[data-pin-focus]")) {
    const pinInput = document.querySelector("[data-admin-pin]");
    pinInput?.focus({ preventScroll: true });
    setTimeout(() => centerFocusedAdminPanel(pinInput), 80);
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
    store.reportView = reportView === "staff" ? "staff" : "tenant";
    render();
    return;
  }


  const inputPage = event.target.closest("[data-input-page]")?.dataset.inputPage;
  if (inputPage) {
    if (isAccessStaff() && !staffPages().some(([page])=>page===inputPage)) return;
    store.inputPage = inputPage;
    render();
    return;
  }

  const packCounter = event.target.closest("[data-pack-counter]");
  if (packCounter) {
    const pizza = store.pizzas.find(item => item.id === packCounter.dataset.id && item.active);
    const date = packCounter.dataset.date;
    if (!pizza) return;
    if (date) {
      if (!isAccessAdmin() || !isAdminRecordEditing("sales", date) || store.adminEdit.saving) return;
      adjustPackSale(store.adminEdit.values, store.adminEdit.packs, pizza, packCounter.dataset.packCounter, Number(packCounter.dataset.delta), store.records[date]?.salesDetail?.[pizza.id]);
    } else {
      if (!canAccess("input_sales") || isDraftLocked("sales")) return;
      if (!store.inputDraft.packs) store.inputDraft.packs = {};
      adjustPackSale(store.inputDraft.sales, store.inputDraft.packs, pizza, packCounter.dataset.packCounter, Number(packCounter.dataset.delta), store.records[isoDate(new Date())]?.salesDetail?.[pizza.id]);
    }
    render();
    return;
  }

  const counter = event.target.closest("[data-counter]");
  if (counter) {
    const type = counter.dataset.counter;
    const id = counter.dataset.id;
    const delta = Number(counter.dataset.delta);
    if (isAccessStaff() && !canAccess(type === "sales" ? "input_sales" : "input_stock")) return;
    if (isDraftLocked(type)) {
      showToast("Klik Perbaharui Data dulu untuk mengubah qty.", "error");
      return;
    }
    if (!store.inputDraft[type]) store.inputDraft[type] = {};
    store.inputDraft[type][id] = Math.max(0, (store.inputDraft[type][id] || 0) + delta);
    render();
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

  const monthDeltaButton = event.target.closest("[data-calendar-month-delta]");
  if (monthDeltaButton) {
    shiftCalendarMonth(Number(monthDeltaButton.dataset.calendarMonthDelta));
    return;
  }

  if (event.target.closest("[data-calendar-month-toggle]")) {
    store.calendarPickerOpen = !store.calendarPickerOpen;
    render();
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
      packSize: String(pizza.packSize || ''),
      packPrice: String(pizza.packPrice || ''),
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

  const feeModeButton = event.target.closest("[data-fee-mode]");
  if (feeModeButton) {
    const fee = store.ownerFeeDraft || { ownerFee: store.ownerFee, ownerFeeMode: store.ownerFeeMode, ownerFeePercent: store.ownerFeePercent };
    const input = document.querySelector("[data-owner-fee]");
    fee[fee.ownerFeeMode === "percent" ? "ownerFeePercent" : "ownerFee"] = input?.value ?? "";
    fee.ownerFeeMode = feeModeButton.dataset.feeMode;
    store.ownerFeeDraft = fee;
    render();
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

function parseOwnerFeeValue(raw, mode) {
  const text = String(raw).trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isSafeInteger(Math.round(value * 100)) || value < 0) return null;
  if (mode === "percent") return value <= 100 ? value : null;
  return Number.isInteger(value) && value <= 2147483647 ? value : null;
}

async function saveOwnerFee() {
  if (!isAccessAdmin() || store.pendingWrites) return;
  const input = document.querySelector("[data-owner-fee]");
  const mode = store.ownerFeeDraft?.ownerFeeMode || store.ownerFeeMode;
  const value = parseOwnerFeeValue(input?.value ?? "", mode);
  if (value === null) {
    showToast(mode === "percent" ? "Masukkan persentase 0–100, maksimal 2 desimal" : "Masukkan nominal rupiah utuh, minimal 0", "error");
    return;
  }
  const next = { ownerFee: store.ownerFee, ownerFeeMode: mode, ownerFeePercent: store.ownerFeePercent };
  next[mode === "percent" ? "ownerFeePercent" : "ownerFee"] = value;
  // Commit the visible value only after the write succeeds; tenant switching is blocked while pending.
  const saved = await persistDatabaseWrite(() => dbUpsertSetting(next));
  if (saved) { Object.assign(store, next); store.ownerFeeDraft = null; store.combinedTenants = []; }
  showToast(saved ? "Bagi hasil pemilik tempat berhasil disimpan" : "Bagi hasil belum tersimpan ke database", saved ? "success" : "error");
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
  store.pendingWrites += 1;
  Promise.resolve().then(action).catch((error) => {
    console.warn("Daily expense was saved locally only", error);
  }).finally(() => { store.pendingWrites -= 1; });
}

async function saveAdminPassword() {
  if (!isAccessAdmin() || access.saving) return;
  const pin = store.adminPasswordForm.pin.replace(/\D/g, "");
  if (!/^\d{4,6}$/.test(pin)) { showToast("PIN admin harus 4 sampai 6 angka.","error"); return; }
  access.saving = true;
  try {
    await dbUpsertAdminPin(pin);
    store.adminPasswordForm.pin = "";
    clearAccessSession("PIN admin berhasil diubah. Masuk dengan PIN baru.");
  } catch(error) { showToast(getErrorMessage(error),"error"); }
  finally { access.saving = false; }
}

function handleInput(event) {
  if (handleAccessInput(event)) return;
  if (!hasAccessSession()) return;
  const staffField = event.target.dataset.staffField;
  if (["staff_name", "tenant_name", "location"].includes(staffField)) {
    store.staffForm[staffField] = event.target.value;
    return;
  }

  if (event.target.matches("[data-admin-pin]")) {
    store.adminPinInput = event.target.value.replace(/\D/g, "").slice(0, 4);
    event.target.value = store.adminPinInput;
    updateAdminPinDots();
    return;
  }

  if (event.target.matches("[data-admin-password-pin]")) {
    store.adminPasswordForm.pin = event.target.value.replace(/\D/g, "").slice(0, 6);
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
  if (event.key === "Enter" && event.target.matches("[data-access-pin]")) { event.preventDefault(); loginAccess(); return; }
  if (!hasAccessSession()) return;
  handleTenantPickerKeydown(event);
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
  const picker = event.target.closest("[data-tenant-picker]");
  if (picker && event.relatedTarget && !picker.contains(event.relatedTarget)) closeTenantPicker();
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
    window.scrollBy({ top: delta, behavior: "auto" });
  }
}

function updateAdminPinDots() {
  document.querySelectorAll(".pin-dot").forEach((dot, index) => {
    dot.classList.toggle("filled", store.adminPinInput.length > index);
  });
}

function unlockAdmin() { return loginAccess(); }

function handleChange(event) {
  if (handleAccessInput(event)) return;
  if (!hasAccessSession()) return;
  if (event.target.matches("[data-tenant-select]")) { switchTenant(event.target.value); return; }

  if (event.target.matches("[data-calendar-month-select], [data-calendar-year-select]")) {
    const calendar = event.target.closest(".calendar");
    const month = Number(calendar?.querySelector("[data-calendar-month-select]")?.value);
    const year = Number(calendar?.querySelector("[data-calendar-year-select]")?.value);
    if (month && year) setCalendarMonth(year, month - 1);
    return;
  }

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
  const packSize = Number(store.pizzaForm.packSize || 0);
  const packPrice = Number(store.pizzaForm.packPrice || 0);

  if (!Number.isInteger(packSize) || !Number.isSafeInteger(packPrice) || !((packSize === 0 && packPrice === 0) || (packSize >= 2 && packSize <= 100 && packPrice > 0 && packPrice <= 2147483647))) {
    showToast("Isi 2–100 slice dan harga loyang, atau kosongkan keduanya", "error");
    return;
  }

  if (!name || cost <= 0 || price <= 0) {
    showToast("Gagal menyimpan data. Coba lagi.", "error");
    return;
  }

  let pizza;
  if (store.editingPizzaId) {
    pizza = store.pizzas.find((item) => item.id === store.editingPizzaId);
    if (!pizza) return;
    Object.assign(pizza, { name, cost, price, packSize, packPrice, active: store.pizzaForm.active });
  } else {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "pizza";
    const id = store.pizzas.some((item) => item.id === baseId) ? `${baseId}-${Date.now()}` : baseId;
    pizza = {
      id,
      name,
      cost,
      price,
      packSize,
      packPrice,
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
  if (store.submitLoading || store.dbLoading || !store.dbReady || !store.tenantResolved || store.tenantError || !currentTenant.active) return;
  const today = isoDate(new Date());
  const submitType = store.inputPage === "stock" ? "stock" : "sales";
  if (isAccessStaff() && !canAccess(submitType === "stock" ? "input_stock" : "input_sales")) return;
  const submitLabel = submitType === "stock" ? "Stok" : "Penjualan";

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
        ...store.records[today],
        sales: { ...store.records[today].sales },
        refill: { ...(store.records[today].refill || {}) },
        stock: { ...store.records[today].stock },
      }
    : null;
  const previousProgress = getDailyProgress(today);
  const record = store.records[today] || { sales: {}, refill: {}, stock: {} };
  if (submitType === "sales") {
    record.sales = getDraftValues("sales");
    record.salesDetail = buildSalesDetail(record.sales, store.inputDraft.packs, record.salesDetail);
  } else {
    record[submitType] = getDraftValues(submitType);
  }
  store.records[today] = record;
  store.dailySubmitted[today] = { ...previousProgress, [submitType]: true };
  store.dailyEditUnlocked[submitType] = false;

  const saved = await persistDatabaseWrite(() => dbUpsertDailyRecord(today,submitType));
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
    store.inputPage = canAccess("input_stock") ? "stock" : "sales";
    showToast(canAccess("input_stock") ? "Penjualan tersimpan. Lanjut isi stok." : "Penjualan tersimpan.", "success");
  } else {
    store.inputPage = "stock";
    showToast("Stok tersimpan. Laporan hari ini sudah diperbarui.", "success");
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
  store.calendarPickerOpen = false;
  if (filter === "today") {
    const today = isoDate(new Date());
    store.rangeStart = today;
    store.rangeEnd = today;
    store.calendarMonth = monthKey(new Date());
  }
  if (filter === "yesterday") {
    const yesterdayDate = addDays(new Date(), -1);
    const yesterday = isoDate(yesterdayDate);
    store.rangeStart = yesterday;
    store.rangeEnd = yesterday;
    store.calendarMonth = monthKey(yesterdayDate);
  }
  if (filter === "custom") {
    store.calendarMonth = monthKey(new Date(`${store.rangeStart}T00:00:00`));
  }
  store.viewerLoading = true;
  render();
  setTimeout(() => {
    store.viewerLoading = false;
    render();
  }, 520);
}

function selectRangeDay(date) {
  store.calendarMonth = monthKey(new Date(`${date}T00:00:00`));
  store.calendarPickerOpen = false;
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

function getCalendarMonthKey() {
  if (/^\d{4}-\d{2}$/.test(store.calendarMonth || "")) return store.calendarMonth;
  return monthKey(new Date(`${store.rangeStart}T00:00:00`));
}

function shiftCalendarMonth(delta) {
  const current = new Date(`${getCalendarMonthKey()}-01T00:00:00`);
  current.setMonth(current.getMonth() + delta);
  store.calendarMonth = monthKey(current);
  store.calendarPickerOpen = false;
  render();
}

function setCalendarMonth(year, month) {
  store.calendarMonth = monthKey(new Date(year, month, 1));
  store.calendarPickerOpen = false;
  render();
}

function getCalendarYearOptions(selectedYear) {
  const years = new Set([selectedYear]);
  const dateYears = Object.keys(store.records)
    .concat(Object.keys(store.dailyExpenses), Object.keys(store.attendance))
    .map((date) => Number(String(date).slice(0, 4)))
    .filter(Boolean);

  dateYears.forEach((year) => years.add(year));
  for (let year = selectedYear - 3; year <= selectedYear + 3; year += 1) {
    years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
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


function calculateOwnerShare(summary, fee = store) {
  return fee.ownerFeeMode === "percent"
    ? Math.round(summary.revenue * Number(fee.ownerFeePercent || 0) / 100)
    : summary.slices * Number(fee.ownerFee ?? 2000);
}

function ownerFeeLabel(fee = store) {
  return fee.ownerFeeMode === "percent" ? `${Number(fee.ownerFeePercent)}% penjualan` : `${rupiah(fee.ownerFee)} / slice`;
}

function ownerFeeFormula(summary, fee = store) {
  return fee.ownerFeeMode === "percent"
    ? `${Number(fee.ownerFeePercent)}% x ${rupiah(summary.revenue)} =`
    : `${summary.slices} slice x ${rupiah(fee.ownerFee)} =`;
}

function getSummaryForDates(dates, options = {}) {
  const salesScope = options.salesScope || "tenant";
  return dates.reduce(
    (total, date) => {
      const record = store.records[date] || { sales: {}, stock: {} };
      store.pizzas.forEach((pizza) => {
        const qty = getSalesQuantity(record, pizza.id, salesScope);
        total.slices += qty;
        total.revenue += getSalesRevenue(record, pizza);
        total.cost += qty * pizza.cost;
      });
      total.expenses += getExpenseTotalForDates([date]);
      total.ownerShare = calculateOwnerShare(total);
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
  return Number(record.sales?.[pizzaId]) || 0;
}

function salesPackCounts(details = {}) {
  return Object.fromEntries(Object.entries(details).map(([id, detail]) => [id, Number(detail.packs) || 0]));
}

function packSalesDescription(dates, pizza) {
  let packs = 0, singles = 0;
  dates.forEach(date => {
    const record = store.records[date] || {};
    const detail = record.salesDetail?.[pizza.id] || {};
    const count = Number(detail.packs) || 0;
    packs += count;
    singles += Math.max(0, getSalesQuantity(record, pizza.id) - count * salesPackSize(pizza, detail));
  });
  return `${singles} slice eceran · ${packs} loyang`;
}

function salesPackSize(pizza, detail = {}) { return Number(detail.pack_size || pizza.packSize || pizza.pack_size) || 0; }

function getSalesRevenue(record, pizza) {
  const qty = getSalesQuantity(record, pizza.id);
  const detail = record.salesDetail?.[pizza.id];
  if (!detail || detail.slice_price == null || detail.pack_price == null) return qty * Number(pizza.price || 0);
  const size = salesPackSize(pizza, detail);
  const packs = Math.min(Number(detail.packs) || 0, size ? Math.floor(qty / size) : 0);
  return (qty - packs * size) * Number(detail.slice_price) + packs * Number(detail.pack_price);
}

function buildSalesDetail(values, packs = {}, previous = {}) {
  const details = { ...previous };
  store.pizzas.filter(pizza => pizza.active).forEach(pizza => {
    const old = previous[pizza.id] || {};
    const size = salesPackSize(pizza, old);
    if (!size) return;
    const count = Math.min(Number(packs[pizza.id]) || 0, Math.floor((values[pizza.id] || 0) / size));
    details[pizza.id] = { packs: count, pack_size: size,
      slice_price: Number(old.slice_price ?? pizza.price), pack_price: Number(old.pack_price ?? pizza.packPrice) };
  });
  return details;
}

function adjustPackSale(values, packs, pizza, kind, delta, detail = {}) {
  const size = salesPackSize(pizza, detail);
  const count = Number(packs[pizza.id]) || 0;
  const singles = Math.max(0, (Number(values[pizza.id]) || 0) - count * size);
  packs[pizza.id] = kind === "pack" ? Math.max(0, count + delta) : count;
  values[pizza.id] = (kind === "slice" ? Math.max(0, singles + delta) : singles) + packs[pizza.id] * size;
}

function renderPackSalesRow(pizza, values, packs, details, editDate = "") {
  const detail = details[pizza.id] || {};
  const size = salesPackSize(pizza, detail);
  const count = Number(packs[pizza.id]) || 0;
  const total = Number(values[pizza.id]) || 0;
  const singles = Math.max(0, total - count * size);
  const locked = editDate ? store.adminEdit.saving : isDraftLocked("sales");
  const slicePrice = Number(detail.slice_price ?? pizza.price);
  const packPrice = Number(detail.pack_price ?? pizza.packPrice);
  return `<article class="pack-sales-row ${locked ? "is-locked" : ""}">
    <div class="pack-sales-heading"><h4>${escapeHtml(pizza.name)}</h4><span>${total} slice</span></div>
    ${[["slice", "Slice", singles, slicePrice],["pack", "Loyang Besar", count, packPrice]].map(([kind,label,value,price]) => `<div class="pack-sale-option"><div><strong><span class="pack-sale-bullet" aria-hidden="true">•</span>${label}</strong>${price ? `<small>${rupiah(price)}</small>` : ""}</div>
      <div class="counter" aria-label="${escapeHtml(pizza.name)} ${label}">
        <button class="counter-btn" type="button" data-pack-counter="${kind}" data-id="${escapeHtml(pizza.id)}" data-date="${editDate}" data-delta="-1" aria-label="Kurangi ${label} ${escapeHtml(pizza.name)}" ${locked ? "disabled" : ""}><span class="material-symbols-outlined">remove</span></button>
        <span class="count">${value}</span>
        <button class="counter-btn" type="button" data-pack-counter="${kind}" data-id="${escapeHtml(pizza.id)}" data-date="${editDate}" data-delta="1" aria-label="Tambah ${label} ${escapeHtml(pizza.name)}" ${locked ? "disabled" : ""}><span class="material-symbols-outlined">add</span></button>
      </div></div>`).join("")}
  </article>`;
}

function sumDraft(type) {
  return Object.values(store.inputDraft[type] || {}).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
}



function sumSalesDraft() { return sumDraft("sales"); }

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
  if (/^\/input\/[a-z0-9-]+$/.test(route)) return "/input";
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

function monthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
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
    const saved = localStorage.getItem(tenantStorageKey("attendance_settings"));
    if (!saved) return;
    store.attendanceSettings = normalizeAttendanceSettings(JSON.parse(saved));
  } catch (error) {
    store.attendanceSettings = { ...DEFAULT_ATTENDANCE_SETTINGS };
  }
}

function saveLocalAttendanceSettings(settings) {
  try {
    localStorage.setItem(tenantStorageKey("attendance_settings"), JSON.stringify(normalizeAttendanceSettings(settings)));
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
    const saved = localStorage.getItem(tenantStorageKey("daily_expenses"));
    store.dailyExpenses = normalizeDailyExpenses(saved ? JSON.parse(saved) : {});
  } catch (error) {
    store.dailyExpenses = {};
  }
}

function saveLocalDailyExpenses() {
  try {
    localStorage.setItem(tenantStorageKey("daily_expenses"), JSON.stringify(normalizeDailyExpenses(store.dailyExpenses)));
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









