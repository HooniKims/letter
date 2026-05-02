const SPREADSHEET_ID = '1juHN4fRQzb9WAhVCqmJ7u3qfwEJQMAFCSOs_VvS5Wr0';
const LEGACY_HEADERS = ['학번 이름', '편지 내용', '생성일시'];
const HEADERS = ['학번', '이름', '편지 내용', '생성일시'];

function doGet() {
  const sheet = getTargetSheet_();
  setupSheet_(sheet);

  return json_({
    ok: true,
    message: '어버이날 감사 카드 저장 웹앱이 준비되었습니다.',
    spreadsheetId: SPREADSHEET_ID
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const student = normalizeStudentFields_(payload);
    const letterText = String(payload.letterText || '').trim();
    const createdAt = String(payload.createdAt || formatKoreanTimestamp_(new Date()));

    if (!student.id) throw new Error('학번이 필요합니다.');
    if (!/^\d+$/.test(student.id)) throw new Error('학번은 숫자만 입력할 수 있습니다.');
    if (!student.name) throw new Error('이름이 필요합니다.');
    if (!letterText) throw new Error('저장할 편지 내용이 필요합니다.');

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      const sheet = getTargetSheet_();
      setupSheet_(sheet);
      sheet.appendRow([student.id, student.name, letterText, createdAt]);
      formatSubmissionRow_(sheet, sheet.getLastRow());
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true, createdAt });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function getTargetSheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
}

function setupSheet_(sheet) {
  migrateLegacyRows_(sheet);
  ensureHeaders_(sheet);
  applySheetFormat_(sheet);
}

function migrateLegacyRows_(sheet) {
  const current = sheet.getRange(1, 1, 1, LEGACY_HEADERS.length).getValues()[0];
  if (current.join('|') !== LEGACY_HEADERS.join('|')) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const values = sheet.getRange(2, 1, lastRow - 1, LEGACY_HEADERS.length).getValues();
  const migrated = values.map(function(row) {
    const student = splitLegacyStudentInfo_(row[0]);
    return [student.id, student.name, row[1], row[2]];
  });

  sheet.getRange(2, 1, migrated.length, HEADERS.length).setValues(migrated);
}

function ensureHeaders_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (current.join('|') !== HEADERS.join('|')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  sheet.setFrozenRows(1);
}

function applySheetFormat_(sheet) {
  const rowCount = Math.max(sheet.getLastRow(), 2);

  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 620);
  sheet.setColumnWidth(4, 170);

  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.getRange(1, 3, rowCount, 1).setWrap(true);
  sheet.getRange(1, 1, rowCount, 2)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.getRange(1, 4, rowCount, 1)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
}

function formatSubmissionRow_(sheet, rowIndex) {
  sheet.getRange(rowIndex, 3).setWrap(true);
  sheet.getRange(rowIndex, 1, 1, 2)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.getRange(rowIndex, 4)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.autoResizeRows(rowIndex, 1);
}

function normalizeStudentFields_(payload) {
  const studentId = String(payload.studentId || '').trim();
  const studentName = String(payload.studentName || '').trim();
  if (studentId || studentName) {
    return { id: studentId, name: studentName };
  }

  return splitLegacyStudentInfo_(payload.studentInfo || '');
}

function splitLegacyStudentInfo_(studentInfo) {
  const parts = String(studentInfo || '').trim().split(/\s+/).filter(Boolean);
  return {
    id: parts.shift() || '',
    name: parts.join(' ')
  };
}

function formatKoreanTimestamp_(date) {
  return Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
