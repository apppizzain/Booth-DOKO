const CONFIG = {
  APP_ID: 'pizzain_doko_v1',
  DRIVE_FOLDER_ID: '1Ykz6H2z0c5NSXq3K5OyrVgq-Lf4Ko66C',
  SPREADSHEET_ID: '1yn_YhD0ab1EVR2Gkg1T8heky1E09vUhORMqwJ9oX2uo',
  SHEET_NAME: 'Foto Absensi',
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    validatePayload_(payload);

    const saved = saveAttendancePhoto_(payload);
    appendPhotoLog_(payload, saved);

    return json_({
      ok: true,
      fileId: saved.fileId,
      fileName: saved.fileName,
      photoUrl: saved.photoUrl,
      webViewUrl: saved.webViewUrl,
    });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (params.action === 'data') {
    return renderPhotoData_(params.fileId, params.token, params.callback, params.size);
  }
  if (params.action === 'view') {
    return renderPhoto_(params.fileId, params.token);
  }

  return json_({
    ok: true,
    appId: CONFIG.APP_ID,
    message: 'Pizzain DOKO photo upload is ready.',
  });
}

function parsePayload_(e) {
  const body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  return JSON.parse(body);
}

function validatePayload_(payload) {
  if (payload.appId !== CONFIG.APP_ID) throw new Error('App ID tidak valid.');
  if (!payload.photo || !String(payload.photo).startsWith('data:image/')) throw new Error('Foto tidak valid.');
  if (!payload.date) throw new Error('Tanggal absensi kosong.');
  if (!payload.mode) throw new Error('Mode absensi kosong.');
}

function saveAttendancePhoto_(payload) {
  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  const parsed = parseDataUrl_(payload.photo);
  const modeLabel = payload.mode === 'out' ? 'pulang' : 'masuk';
  const safeDate = String(payload.date).replace(/[^0-9-]/g, '');
  const safeTime = String(payload.time || '').replace(/[^0-9]/g, '') || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'HHmmss');
  const fileName = `absensi-${safeDate}-${modeLabel}-${safeTime}.jpg`;
  const blob = Utilities.newBlob(parsed.bytes, parsed.mimeType, fileName);
  const file = folder.createFile(blob);
  const token = Utilities.getUuid().replace(/-/g, '');
  const serviceUrl = ScriptApp.getService().getUrl();

  return {
    fileId: file.getId(),
    fileName,
    token,
    photoUrl: `${serviceUrl}?action=view&fileId=${encodeURIComponent(file.getId())}&token=${encodeURIComponent(token)}`,
    webViewUrl: file.getUrl(),
  };
}

function parseDataUrl_(dataUrl) {
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Format foto tidak valid.');
  return {
    mimeType: match[1],
    bytes: Utilities.base64Decode(match[2]),
  };
}

function appendPhotoLog_(payload, saved) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = getOrCreateSheet_(spreadsheet, CONFIG.SHEET_NAME);
  ensureHeader_(sheet);
  sheet.appendRow([
    new Date(),
    CONFIG.APP_ID,
    payload.date || '',
    payload.mode || '',
    payload.time || '',
    payload.status || '',
    payload.message || '',
    saved.fileId,
    saved.fileName,
    saved.token,
    saved.photoUrl,
    saved.webViewUrl,
  ]);
}

function renderPhotoData_(fileId, token, callback, size) {
  const callbackName = safeCallback_(callback);
  try {
    if (!fileId || !token || !isKnownPhoto_(fileId, token)) {
      return javascript_(`${callbackName}(${JSON.stringify({ ok: false, error: 'Foto tidak tersedia.' })});`);
    }

    const file = DriveApp.getFileById(fileId);
    const blob = resizePhotoBlob_(file.getBlob(), size);
    const dataUrl = `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`;
    return javascript_(`${callbackName}(${JSON.stringify({ ok: true, dataUrl: dataUrl })});`);
  } catch (error) {
    return javascript_(`${callbackName}(${JSON.stringify({ ok: false, error: error.message || String(error) })});`);
  }
}

function resizePhotoBlob_(blob, size) {
  const maxSize = normalizePhotoSize_(size, 1000);
  try {
    const image = ImagesService.openImage(blob);
    const width = image.getWidth();
    const height = image.getHeight();
    const longestSide = Math.max(width, height);
    if (longestSide <= maxSize) return blob;
    const scale = maxSize / longestSide;
    return image
      .resize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)))
      .getBlob()
      .setContentType('image/jpeg');
  } catch (error) {
    return blob;
  }
}

function normalizePhotoSize_(size, fallback) {
  const parsed = Number(size || fallback || 1000);
  if (!Number.isFinite(parsed)) return fallback || 1000;
  return Math.min(Math.max(Math.round(parsed), 160), 1400);
}
function safeCallback_(callback) {
  const name = String(callback || 'pizzainPhotoCallback');
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(name)
    ? name
    : 'pizzainPhotoCallback';
}

function javascript_(source) {
  return ContentService
    .createTextOutput(source)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function renderPhoto_(fileId, token) {
  if (!fileId || !token || !isKnownPhoto_(fileId, token)) {
    return HtmlService.createHtmlOutput('<p>Foto tidak tersedia.</p>');
  }

  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const dataUrl = `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`;
  const name = escapeHtml_(file.getName());

  return HtmlService
    .createHtmlOutput(`<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      html,body{height:100%;margin:0;background:#140c0d}
      body{display:grid;place-items:center}
      img{display:block;max-width:100%;max-height:100%;object-fit:contain}
    </style>
  </head>
  <body>
    <img alt="${name}" src="${dataUrl}">
  </body>
</html>`)
    .setTitle('Foto Absensi');
}

function isKnownPhoto_(fileId, token) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = getOrCreateSheet_(spreadsheet, CONFIG.SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  for (let index = 1; index < rows.length; index += 1) {
    if (String(rows[index][7]) === String(fileId) && String(rows[index][9]) === String(token)) {
      return true;
    }
  }
  return false;
}

function getOrCreateSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    'Timestamp',
    'App ID',
    'Tanggal',
    'Mode',
    'Jam',
    'Status',
    'Pesan',
    'File ID',
    'Nama File',
    'Token Preview',
    'URL Preview',
    'URL Drive',
  ]);
  sheet.setFrozenRows(1);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

