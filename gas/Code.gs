const SPREADSHEET_ID = '1juHN4fRQzb9WAhVCqmJ7u3qfwEJQMAFCSOs_VvS5Wr0';
const HEADERS = ['학번 이름', '편지 내용', '생성일시'];

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
    const studentInfo = String(payload.studentInfo || '').trim();
    const letterText = String(payload.letterText || '').trim();
    const createdAt = String(payload.createdAt || formatKoreanTimestamp_(new Date()));

    if (!studentInfo) throw new Error('학번과 이름이 필요합니다.');
    if (!letterText) throw new Error('저장할 편지 내용이 필요합니다.');

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getTargetSheet_();
      setupSheet_(sheet);
      sheet.appendRow([studentInfo, letterText, createdAt]);
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
  ensureHeaders_(sheet);
  applySheetFormat_(sheet);
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

  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(2, 620);
  sheet.setColumnWidth(3, 170);

  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.getRange(1, 2, rowCount, 1).setWrap(true);
  sheet.getRange(1, 3, rowCount, 1)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
}

function formatSubmissionRow_(sheet, rowIndex) {
  sheet.getRange(rowIndex, 2).setWrap(true);
  sheet.getRange(rowIndex, 3)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.autoResizeRows(rowIndex, 1);
}

function formatKoreanTimestamp_(date) {
  return Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
