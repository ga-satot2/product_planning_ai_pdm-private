/**
 * ========================================
 * 人事評価サマリ集計
 * ========================================
 *
 * 参加情報・予約一覧・コース一覧から人事評価用の指標を集計し、
 * 「人事評価サマリ」シートに出力する。
 *
 * 実行: 手動実行またはメニューから aggregatePersonnelEvalSummary を実行
 */

const PERSONNEL_EVAL_SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';

const STATUS_PARTICIPATED = '参加済み';
const STATUS_RESERVED = '予約済み';

/**
 * 人事評価サマリを集計してシートに書き込む
 */
function aggregatePersonnelEvalSummary() {
  const utils = typeof LMSUtils !== 'undefined' ? new LMSUtils() : null;
  const spreadsheetId = utils && utils.getProperty ? (utils.getProperty('SPREADSHEET_ID') || PERSONNEL_EVAL_SPREADSHEET_ID) : PERSONNEL_EVAL_SPREADSHEET_ID;
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const config = utils ? utils.getConfig() : getConfigFallback();
  const sheets = config.sheets;

  const attendeesSheet = spreadsheet.getSheetByName(sheets.attendees.name);
  const eventsSheet = spreadsheet.getSheetByName(sheets.events.name);
  const courseListSheet = spreadsheet.getSheetByName(sheets.courseList.name);

  if (!attendeesSheet || !courseListSheet) {
    Logger.log('aggregatePersonnelEvalSummary: 参加情報またはコース一覧シートが見つかりません');
    return;
  }

  const courseNameToType = buildCourseNameToTrainingType(courseListSheet, sheets.courseList);
  const participantStats = aggregateFromAttendees(attendeesSheet, sheets.attendees, courseNameToType);
  if (eventsSheet) {
    addUnreportedCount(participantStats, attendeesSheet, eventsSheet, sheets);
  }

  const summarySheet = getOrCreatePersonnelEvalSheet(spreadsheet, sheets.personnelEvalSummary);
  writeSummary(summarySheet, participantStats, sheets.personnelEvalSummary);
  Logger.log('aggregatePersonnelEvalSummary: 完了');
}

function getConfigFallback() {
  return {
    sheets: {
      attendees: { name: '参加情報', columns: { NAME: 1, EMAIL: 2, GROUP: 3, COURSE_START_COL: 4, COURSE_12: 15 } },
      events: { name: '予約一覧', columns: { COURSE_NAME: 3, COURSE_DATE: 6, TARGET_GROUP: 5, EVENT_ID: 10 } },
      courseList: { name: 'コース一覧', columns: { COURSE_NAME: 4, TRAINING_TYPE: 2 } },
      personnelEvalSummary: { name: '人事評価サマリ', columns: { NAME: 1, EMAIL: 2, GROUP: 3, CONTINUING_PARTICIPATION: 4, AVENGERS_PARTICIPATION: 5, UNREPORTED_COUNT: 6 } }
    }
  };
}

function buildCourseNameToTrainingType(courseListSheet, col) {
  const lastRow = courseListSheet.getLastRow();
  const firstRow = (col.rows && col.rows.FIRST) ? col.rows.FIRST : 2;
  if (lastRow < firstRow) return {};
  const data = courseListSheet.getRange(firstRow, 1, lastRow, col.columns.MATERIALS || 7).getValues();
  const map = {};
  data.forEach(function (row) {
    const name = row[col.columns.COURSE_NAME - 1];
    const type = row[col.columns.TRAINING_TYPE - 1];
    if (name) map[String(name).trim()] = String(type || '').trim() || '継続研修';
  });
  return map;
}

function aggregateFromAttendees(attendeesSheet, col, courseNameToType) {
  const lastRow = attendeesSheet.getLastRow();
  const firstRow = (col.rows && col.rows.FIRST) ? col.rows.FIRST : 2;
  if (lastRow < firstRow) return [];
  const headerRow = attendeesSheet.getRange(1, col.columns.COURSE_START_COL, 1, col.columns.COURSE_12 || 15).getValues()[0];
  const data = attendeesSheet.getRange(firstRow, 1, lastRow, col.columns.COURSE_12 || 15).getValues();
  const stats = [];

  data.forEach(function (row) {
    const name = row[col.columns.NAME - 1];
    const email = row[col.columns.EMAIL - 1];
    const group = row[col.columns.GROUP - 1];
    if (!name) return;

    let continuing = 0;
    let avengers = 0;
    for (let i = 0; i < headerRow.length; i++) {
      const status = row[col.columns.COURSE_START_COL - 1 + i];
      if (status !== STATUS_PARTICIPATED) continue;
      const courseName = headerRow[i];
      const type = courseNameToType[courseName] || '継続研修';
      if (type.indexOf('アベンジャーズ') >= 0) avengers++;
      else continuing++;
    }
    stats.push({
      name: name,
      email: email || '',
      group: group || '',
      continuing: continuing,
      avengers: avengers,
      unreported: 0
    });
  });
  return stats;
}

function addUnreportedCount(participantStats, attendeesSheet, eventsSheet, sheets) {
  // 参加情報はコース単位（イベント単位でない）のため、未報告は現状0として扱う
  // 将来的に予約一覧とカレンダー出席を突合する実装で拡張可能
  participantStats.forEach(function (p) { p.unreported = p.unreported || 0; });
}

function getOrCreatePersonnelEvalSheet(spreadsheet, col) {
  let sheet = spreadsheet.getSheetByName(col.name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(col.name);
    sheet.getRange(1, 1, 1, 7).setValues([['参加者名', 'メールアドレス', '所属グループ', '継続研修参加回数', 'アベンジャーズ研修参加回数', '未報告回数', 'サーベイ回答率(%)']]);
  }
  return sheet;
}

function writeSummary(summarySheet, participantStats, col) {
  const headerRow = col.rows ? col.rows.FIRST : 2;
  const rows = participantStats.map(function (p) {
    return [p.name, p.email, p.group, p.continuing, p.avengers, p.unreported || 0, ''];
  });
  if (rows.length === 0) return;
  summarySheet.getRange(headerRow, 1, headerRow + rows.length - 1, 7).setValues(rows);
}
