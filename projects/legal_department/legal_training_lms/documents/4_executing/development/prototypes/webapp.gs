/**
 * 法務研修LMS - Web App エントリポイント（現行スキーマ対応）
 * コース一覧・予約一覧・参加情報シートを参照してUIを提供する。
 *
 * @version 2.0
 * @date 2026-02-19
 */

// ===============================================
// 設定（現行スプレッドシート構造）
// ===============================================

var WEBAPP_CONFIG = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'),
  SHEET_NAMES: {
    COURSES: 'コース一覧',
    EVENTS: '予約一覧',
    ATTENDEES: '参加情報',
    DASHBOARD: 'ダッシュボード'
  },
  EVENTS_ROW_FIRST: 2,
  COURSES_ROW_FIRST: 2,
  ATTENDEES_ROW_FIRST: 2,
  MAX_PARTICIPANTS_PER_SESSION: 50,
  VALID_EVENT_STATUSES: ['予約受付中', '設定済み'],
  RESERVED_STATUS_VALUES: ['予約済み', '参加済み']
};

// 予約一覧 0-based column indices (A=0, B=1, ...)
var EV = {
  NUMBER: 0,
  COURSE_ID: 1,
  COURSE_NAME: 2,
  COURSE_DETAILS: 3,
  TARGET_GROUP: 4,
  COURSE_DATE: 5,
  COURSE_START_TIME: 6,
  COURSE_END_TIME: 7,
  LOCATION: 8,
  EVENT_ID: 9,
  STATUS: 10
};

// コース一覧 0-based
var CR = {
  NUMBER: 0,
  FISCAL_YEAR: 1,
  GROUP: 2,
  COURSE_ID: 3,
  COURSE_NAME: 4,
  COURSE_DETAILS: 5,
  DURATION: 6
};

// 参加情報 0-based
var AT = {
  NAME: 0,
  EMAIL: 1,
  GROUP: 2,
  COURSE_START: 3
};

// ===============================================
// Web App エントリーポイント
// ===============================================

/** 現在の Web アプリのベース URL（例: https://script.google.com/.../exec）。ページ遷移リンクで使用。 */
function getWebAppBaseUrl() {
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (err) {
    return '';
  }
}

function doGet(e) {
  try {
    e = e || {};
    e.parameter = e.parameter || {};
    if (e.parameter.function) {
      if (typeof runApiEndpointGet === 'function') {
        return runApiEndpointGet(e);
      }
    }
    var page = e.parameter.page ? e.parameter.page : 'home';
    var user = Session.getActiveUser().getEmail();
    Logger.log('doGet called: page=' + page + ', user=' + user);

    switch (page) {
      case 'home':
        return renderHomePage(user);
      case 'courses':
        return renderCoursesPage(user);
      case 'reservation':
        return renderReservationPage(user, e.parameter || {});
      case 'mypage':
        return renderMyPage(user);
      case 'admin':
        return renderAdminPage(user);
      case 'register':
        return renderRegisterPage(user);
      case 'admin-courses':
        return renderAdminCoursesPage(user);
      case 'admin-sessions':
        return renderAdminSessionsPage(user);
      case 'admin-email':
        return renderAdminEmailPage(user);
      case 'admin-reports':
        return renderAdminReportsPage(user);
      default:
        return renderErrorPage('ページが見つかりません');
    }
  } catch (err) {
    Logger.log('Error in doGet: ' + err.message);
    return renderErrorPage(err.message);
  }
}

function doPost(e) {
  try {
    e = e || {};
    e.parameter = e.parameter || {};
    var postFunction = null;
    if (e.postData && e.postData.contents) {
      try { postFunction = JSON.parse(e.postData.contents).function; } catch (err) {}
    }
    var hasApiCall = e.parameter.function || postFunction;
    if (hasApiCall && typeof runApiEndpointPost === 'function') {
      return runApiEndpointPost(e);
    }
    var action = e.parameter.action ? e.parameter.action : '';
    var user = Session.getActiveUser().getEmail();
    Logger.log('doPost called: action=' + action + ', user=' + user);

    switch (action) {
      case 'create_reservation': {
        var cr = handleCreateReservation(e.parameter || {}, user);
        return ContentService.createTextOutput(JSON.stringify(cr)).setMimeType(ContentService.MimeType.JSON);
      }
      case 'cancel_reservation': {
        var cc = handleCancelReservation(e.parameter || {}, user);
        return ContentService.createTextOutput(JSON.stringify(cc)).setMimeType(ContentService.MimeType.JSON);
      }
      case 'update_profile': {
        var profileResult = handleUpdateProfile(e.parameter || {}, user);
        return ContentService.createTextOutput(JSON.stringify(profileResult)).setMimeType(ContentService.MimeType.JSON);
      }
      case 'register': {
        var regResult = handleRegister(e.parameter || {}, user);
        return ContentService.createTextOutput(JSON.stringify(regResult)).setMimeType(ContentService.MimeType.JSON);
      }
      default:
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: '不明なアクション' })
        ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    Logger.log('Error in doPost: ' + err.message);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===============================================
// ページレンダリング
// ===============================================

function renderHomePage(user) {
  var template = HtmlService.createTemplateFromFile('Home');
  template.user = user;
  template.participant = getParticipantByEmail(user);
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderCoursesPage(user) {
  try {
    var template = HtmlService.createTemplateFromFile('Courses');
    template.user = user;
    template.courses = getAvailableCourses() || [];
    template.participant = getParticipantByEmail(user);
    template.baseUrl = getWebAppBaseUrl();
    return template.evaluate()
      .setTitle('研修コース一覧 - 法務研修LMS')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    Logger.log('renderCoursesPage error: ' + err.message);
    return HtmlService.createHtmlOutput(
      '<h1>エラー</h1><p>' + err.message + '</p><pre>' + (err.stack || '') + '</pre>'
    );
  }
}

function renderReservationPage(user, params) {
  var template = HtmlService.createTemplateFromFile('Reservation');
  template.user = user;
  template.courseId = params.courseId || '';
  template.course = params.courseId ? getCourseById(params.courseId) : null;
  template.sessions = params.courseId ? getSessionsByCourseId(params.courseId) : [];
  template.participant = getParticipantByEmail(user);
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('予約申し込み - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderMyPage(user) {
  var template = HtmlService.createTemplateFromFile('MyPage');
  template.user = user;
  template.participant = getParticipantByEmail(user);
  template.reservations = getReservationsByEmail(user);
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('マイページ - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderAdminPage(user) {
  if (!isAdmin(user)) {
    return renderErrorPage('管理者権限が必要です');
  }
  var template = HtmlService.createTemplateFromFile('Admin');
  template.user = user;
  template.stats = getSystemStats();
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('管理者ダッシュボード - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderRegisterPage(user) {
  var template = HtmlService.createTemplateFromFile('Register');
  template.user = user;
  template.participant = getParticipantByEmail(user);
  template.groups = getAvailableGroups();
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('受講者登録 - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderAdminCoursesPage(user) {
  if (!isAdmin(user)) return renderErrorPage('管理者権限が必要です');
  var template = HtmlService.createTemplateFromFile('AdminCourses');
  template.user = user;
  template.courses = getAvailableCourses() || [];
  template.sheetUrl = getSpreadsheetUrl();
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('コース管理 - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderAdminSessionsPage(user) {
  if (!isAdmin(user)) return renderErrorPage('管理者権限が必要です');
  var template = HtmlService.createTemplateFromFile('AdminSessions');
  template.user = user;
  template.sessions = getAllSessionsForAdmin();
  template.sheetUrl = getSpreadsheetUrl();
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('セッション管理 - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderAdminEmailPage(user) {
  if (!isAdmin(user)) return renderErrorPage('管理者権限が必要です');
  var template = HtmlService.createTemplateFromFile('AdminEmail');
  template.user = user;
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('一斉メール - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderAdminReportsPage(user) {
  if (!isAdmin(user)) return renderErrorPage('管理者権限が必要です');
  var template = HtmlService.createTemplateFromFile('AdminReports');
  template.user = user;
  template.stats = getSystemStats();
  template.sheetUrl = getSpreadsheetUrl();
  template.baseUrl = getWebAppBaseUrl();
  return template.evaluate()
    .setTitle('レポート - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function renderErrorPage(message) {
  var template = HtmlService.createTemplate(
    '<html><body><h1>エラー</h1><p><?= message ?></p></body></html>'
  );
  template.message = message;
  return template.evaluate().setTitle('エラー - 法務研修LMS');
}

// ===============================================
// シート取得（現行は自動作成しない）
// ===============================================

function webapp_getSheet(sheetName) {
  var id = WEBAPP_CONFIG.SPREADSHEET_ID;
  if (!id) {
    throw new Error('SPREADSHEET_ID がスクリプトプロパティに設定されていません');
  }
  var spreadsheet = SpreadsheetApp.openById(id);
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('シートが見つかりません: ' + sheetName);
  }
  return sheet;
}

// ===============================================
// 受講者（参加情報）
// ===============================================

function getParticipantByEmail(email) {
  if (!email) return null;
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.ATTENDEES);
  var data = sheet.getDataRange().getValues();
  for (var i = WEBAPP_CONFIG.ATTENDEES_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    var rowEmail = row.length > AT.EMAIL ? String(row[AT.EMAIL] || '').trim() : '';
    if (rowEmail === email) {
      return {
        id: String(row[AT.NAME] || ''),
        employeeId: '',
        name: String(row[AT.NAME] || ''),
        email: rowEmail,
        department: '',
        groupId: row.length > AT.GROUP ? String(row[AT.GROUP] || '') : '',
        status: 'active',
        courseColumns: row.slice(AT.COURSE_START)
      };
    }
  }
  return null;
}

// ===============================================
// コース一覧
// ===============================================

function getAvailableCourses() {
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.COURSES);
  var data = sheet.getDataRange().getValues();
  var courses = [];
  for (var i = WEBAPP_CONFIG.COURSES_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    if (row.length <= CR.COURSE_ID) continue;
    var courseId = String(row[CR.COURSE_ID] || '').trim();
    if (!courseId) continue;
    courses.push({
      id: courseId,
      name: row.length > CR.COURSE_NAME ? String(row[CR.COURSE_NAME] || '') : '',
      description: row.length > CR.COURSE_DETAILS ? String(row[CR.COURSE_DETAILS] || '') : '',
      groupId: row.length > CR.GROUP ? String(row[CR.GROUP] || '') : '',
      maxParticipants: WEBAPP_CONFIG.MAX_PARTICIPANTS_PER_SESSION,
      startDate: '',
      endDate: '',
      status: 'active'
    });
  }
  return courses;
}

function getCourseById(courseId) {
  if (!courseId) return null;
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.COURSES);
  var data = sheet.getDataRange().getValues();
  for (var i = WEBAPP_CONFIG.COURSES_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    if (row.length > CR.COURSE_ID && String(row[CR.COURSE_ID] || '').trim() === courseId) {
      return {
        id: String(row[CR.COURSE_ID] || ''),
        name: row.length > CR.COURSE_NAME ? String(row[CR.COURSE_NAME] || '') : '',
        description: row.length > CR.COURSE_DETAILS ? String(row[CR.COURSE_DETAILS] || '') : '',
        groupId: row.length > CR.GROUP ? String(row[CR.GROUP] || '') : '',
        maxParticipants: WEBAPP_CONFIG.MAX_PARTICIPANTS_PER_SESSION,
        startDate: '',
        endDate: '',
        status: 'active'
      };
    }
  }
  return null;
}

// ===============================================
// セッション（予約一覧の1行 = 1枠）
// ===============================================

function getSessionsByCourseId(courseId) {
  if (!courseId) return [];
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.EVENTS);
  var data = sheet.getDataRange().getValues();
  var sessions = [];
  for (var i = WEBAPP_CONFIG.EVENTS_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    if (row.length <= EV.COURSE_ID) continue;
    var rowCourseId = String(row[EV.COURSE_ID] || '').trim();
    var status = row.length > EV.STATUS ? String(row[EV.STATUS] || '').trim() : '';
    if (rowCourseId !== courseId) continue;
    if (WEBAPP_CONFIG.VALID_EVENT_STATUSES.indexOf(status) < 0) continue;
    var eventId = row.length > EV.EVENT_ID ? String(row[EV.EVENT_ID] || '').trim() : '';
    if (!eventId) continue;
    var sessionId = row.length > EV.NUMBER ? row[EV.NUMBER] : '';
    sessions.push({
      id: sessionId,
      eventId: eventId,
      courseId: rowCourseId,
      sessionName: row.length > EV.COURSE_NAME ? String(row[EV.COURSE_NAME] || '') : '',
      scheduledDate: row.length > EV.COURSE_DATE ? row[EV.COURSE_DATE] : '',
      startTime: row.length > EV.COURSE_START_TIME ? row[EV.COURSE_START_TIME] : '',
      endTime: row.length > EV.COURSE_END_TIME ? row[EV.COURSE_END_TIME] : '',
      meetingRoomId: row.length > EV.LOCATION ? String(row[EV.LOCATION] || '') : '',
      status: status,
      currentParticipants: 0
    });
  }
  return sessions;
}

function getSessionById(sessionId) {
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.EVENTS);
  var data = sheet.getDataRange().getValues();
  for (var i = WEBAPP_CONFIG.EVENTS_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    var num = row.length > EV.NUMBER ? row[EV.NUMBER] : '';
    if (String(num) === String(sessionId)) {
      return {
        id: num,
        courseId: row.length > EV.COURSE_ID ? String(row[EV.COURSE_ID] || '') : '',
        sessionName: row.length > EV.COURSE_NAME ? String(row[EV.COURSE_NAME] || '') : '',
        scheduledDate: row.length > EV.COURSE_DATE ? row[EV.COURSE_DATE] : '',
        startTime: row.length > EV.COURSE_START_TIME ? row[EV.COURSE_START_TIME] : '',
        endTime: row.length > EV.COURSE_END_TIME ? row[EV.COURSE_END_TIME] : '',
        meetingRoomId: row.length > EV.LOCATION ? String(row[EV.LOCATION] || '') : '',
        status: row.length > EV.STATUS ? String(row[EV.STATUS] || '') : ''
      };
    }
  }
  return null;
}

// ===============================================
// 予約一覧（参加情報の予約済み/参加済み列とコース・予約一覧を突合）
// ===============================================

function getReservationsByEmail(email) {
  var participant = getParticipantByEmail(email);
  if (!participant || !participant.courseColumns) return [];
  var partRow = [].concat([participant.name, participant.email, participant.groupId], participant.courseColumns);
  var eventsData = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.EVENTS).getDataRange().getValues();
  var courseListData = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.COURSES).getDataRange().getValues();
  var reservations = [];
  var maxCourseCols = 12;
  for (var colOff = 0; colOff < maxCourseCols; colOff++) {
    var colIdx = AT.COURSE_START + colOff;
    var cellStatus = partRow.length > colIdx ? String(partRow[colIdx] || '').trim() : '';
    if (WEBAPP_CONFIG.RESERVED_STATUS_VALUES.indexOf(cellStatus) < 0) continue;
    var courseNumber = colOff + 1;
    var courseId = getCourseIdByNumberAndGroup(courseListData, courseNumber, participant.groupId);
    if (!courseId) continue;
    var firstEvent = getFirstEventByCourseId(eventsData, courseId);
    if (!firstEvent) continue;
    var course = getCourseById(courseId);
    reservations.push({
      id: firstEvent.id,
      eventId: firstEvent.eventId || '',
      participantId: participant.id,
      sessionId: firstEvent.id,
      status: cellStatus,
      createdAt: '',
      session: firstEvent,
      course: course
    });
  }
  return reservations;
}

function getCourseIdByNumberAndGroup(courseListData, courseNumber, groupName) {
  for (var i = WEBAPP_CONFIG.COURSES_ROW_FIRST - 1; i < courseListData.length; i++) {
    var row = courseListData[i];
    var num = row.length > CR.NUMBER ? Number(row[CR.NUMBER]) : null;
    var group = row.length > CR.GROUP ? String(row[CR.GROUP] || '').trim() : '';
    if (num === courseNumber && group === groupName && row.length > CR.COURSE_ID) {
      return String(row[CR.COURSE_ID] || '').trim();
    }
  }
  return null;
}

function getFirstEventByCourseId(eventsData, courseId) {
  for (var i = WEBAPP_CONFIG.EVENTS_ROW_FIRST - 1; i < eventsData.length; i++) {
    var row = eventsData[i];
    if (row.length <= EV.COURSE_ID) continue;
    if (String(row[EV.COURSE_ID] || '').trim() !== courseId) continue;
    var status = row.length > EV.STATUS ? String(row[EV.STATUS] || '').trim() : '';
    if (WEBAPP_CONFIG.VALID_EVENT_STATUSES.indexOf(status) < 0) continue;
    var eventId = row.length > EV.EVENT_ID ? String(row[EV.EVENT_ID] || '').trim() : '';
    return {
      id: row[EV.NUMBER],
      eventId: eventId,
      courseId: courseId,
      sessionName: row.length > EV.COURSE_NAME ? String(row[EV.COURSE_NAME] || '') : '',
      scheduledDate: row.length > EV.COURSE_DATE ? row[EV.COURSE_DATE] : '',
      startTime: row.length > EV.COURSE_START_TIME ? row[EV.COURSE_START_TIME] : '',
      endTime: row.length > EV.COURSE_END_TIME ? row[EV.COURSE_END_TIME] : '',
      meetingRoomId: row.length > EV.LOCATION ? String(row[EV.LOCATION] || '') : '',
      status: status
    };
  }
  return null;
}

// ===============================================
// 予約作成・キャンセル・プロフィール更新
// ===============================================

function getCourseNumberByCourseIdAndGroup(courseId, groupName) {
  if (!courseId || !groupName) return null;
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.COURSES);
  var data = sheet.getDataRange().getValues();
  for (var i = WEBAPP_CONFIG.COURSES_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    var cid = row.length > CR.COURSE_ID ? String(row[CR.COURSE_ID] || '').trim() : '';
    var grp = row.length > CR.GROUP ? String(row[CR.GROUP] || '').trim() : '';
    if (cid === courseId && grp === groupName) {
      var num = row.length > CR.NUMBER ? Number(row[CR.NUMBER]) : null;
      return num != null ? num : null;
    }
  }
  return null;
}

function getEventIdBySessionId(sessionId) {
  if (sessionId == null || sessionId === '') return null;
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.EVENTS);
  var data = sheet.getDataRange().getValues();
  for (var i = WEBAPP_CONFIG.EVENTS_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    var num = row.length > EV.NUMBER ? row[EV.NUMBER] : '';
    if (String(num) === String(sessionId)) {
      return row.length > EV.EVENT_ID ? String(row[EV.EVENT_ID] || '').trim() : '';
    }
  }
  return null;
}

function getEventRowBySessionId(sessionId) {
  if (sessionId == null || sessionId === '') return null;
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.EVENTS);
  var data = sheet.getDataRange().getValues();
  for (var i = WEBAPP_CONFIG.EVENTS_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    var num = row.length > EV.NUMBER ? row[EV.NUMBER] : '';
    if (String(num) === String(sessionId)) {
      return { rowIndex: i + 1, courseId: row.length > EV.COURSE_ID ? String(row[EV.COURSE_ID] || '').trim() : '' };
    }
  }
  return null;
}

function webapp_updateAttendeeStatus(email, courseNumber, status) {
  if (!email || !courseNumber || courseNumber < 1 || courseNumber > 12) return false;
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.ATTENDEES);
  var data = sheet.getDataRange().getValues();
  var colIdx = AT.COURSE_START + (courseNumber - 1);
  var targetRow = -1;
  for (var i = WEBAPP_CONFIG.ATTENDEES_ROW_FIRST - 1; i < data.length; i++) {
    var rowEmail = data[i].length > AT.EMAIL ? String(data[i][AT.EMAIL] || '').trim() : '';
    if (rowEmail === email) {
      targetRow = i + 1;
      break;
    }
  }
  if (targetRow < 0) return false;
  sheet.getRange(targetRow, colIdx + 1).setValue(status);
  return true;
}

function handleCreateReservation(params, user) {
  user = user || Session.getActiveUser().getEmail();
  var sessionId = params.sessionId;
  var eventId = params.eventId;
  if (!sessionId && !eventId) {
    return { success: false, message: 'セッションを選択してください。' };
  }
  var participant = getParticipantByEmail(user);
  if (!participant) {
    return { success: false, message: '受講者情報が見つかりません。受講者登録を先に行ってください。' };
  }
  var evRow = getEventRowBySessionId(sessionId);
  if (!evRow) {
    return { success: false, message: '指定された予約枠が見つかりません。' };
  }
  var resolvedEventId = eventId || getEventIdBySessionId(sessionId);
  if (!resolvedEventId) {
    return { success: false, message: 'この枠はカレンダー未設定のため、Webからは予約できません。フォームURLからお申し込みください。' };
  }
  var courseNumber = getCourseNumberByCourseIdAndGroup(evRow.courseId, participant.groupId);
  if (!courseNumber) {
    return { success: false, message: 'このコースはあなたのグループ向けではありません。' };
  }
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.ATTENDEES);
  var data = sheet.getDataRange().getValues();
  var colIdx = AT.COURSE_START + (courseNumber - 1);
  var targetRow = -1;
  for (var i = WEBAPP_CONFIG.ATTENDEES_ROW_FIRST - 1; i < data.length; i++) {
    var rowEmail = data[i].length > AT.EMAIL ? String(data[i][AT.EMAIL] || '').trim() : '';
    if (rowEmail === user) {
      targetRow = i + 1;
      break;
    }
  }
  if (targetRow < 0) {
    return { success: false, message: '受講者情報の取得に失敗しました。' };
  }
  var currentVal = data[targetRow - 1].length > colIdx ? String(data[targetRow - 1][colIdx] || '').trim() : '';
  if (WEBAPP_CONFIG.RESERVED_STATUS_VALUES.indexOf(currentVal) >= 0) {
    return { success: false, message: 'このコースは既に予約済みです。' };
  }
  try {
    var calendarId = typeof getCalendarId === 'function' ? getCalendarId() : null;
    if (calendarId && typeof addGuestToCalendarEvent === 'function') {
      var added = addGuestToCalendarEvent(calendarId, resolvedEventId, user);
      if (!added) {
        return { success: false, message: 'カレンダーへの登録に失敗しました。定員オーバーまたは既に登録済みの可能性があります。' };
      }
    }
    sheet.getRange(targetRow, colIdx + 1).setValue('予約済み');
    return { success: true, message: '予約が完了しました。' };
  } catch (err) {
    Logger.log('handleCreateReservation: ' + err.message);
    return { success: false, message: err.message || '予約処理中にエラーが発生しました。' };
  }
}

function handleCancelReservation(params, user) {
  user = user || Session.getActiveUser().getEmail();
  var eventId = params.eventId || params.reservationId;
  if (!eventId) {
    return { success: false, message: '予約を特定できません。eventIdを指定してください。' };
  }
  try {
    if (typeof cancelReservation === 'function') {
      var result = cancelReservation(user, eventId);
      if (result) {
        return { success: true, message: '予約をキャンセルしました。' };
      }
    }
  } catch (err) {
    Logger.log('handleCancelReservation: ' + err.message);
  }
  return { success: false, message: 'キャンセルに失敗しました。管理者またはフォームからお問い合わせください。' };
}

function handleUpdateProfile(params, user) {
  user = user || Session.getActiveUser().getEmail();
  var name = params.name ? String(params.name).trim() : '';
  if (!name) {
    return { success: false, message: '氏名を入力してください。' };
  }
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.ATTENDEES);
  var data = sheet.getDataRange().getValues();
  for (var i = WEBAPP_CONFIG.ATTENDEES_ROW_FIRST - 1; i < data.length; i++) {
    var rowEmail = data[i].length > AT.EMAIL ? String(data[i][AT.EMAIL] || '').trim() : '';
    if (rowEmail === user) {
      sheet.getRange(i + 1, AT.NAME + 1).setValue(name);
      return { success: true, message: 'プロフィールを更新しました。' };
    }
  }
  return { success: false, message: '受講者情報が見つかりません。先に受講者登録を行ってください。' };
}

function handleRegister(params, user) {
  user = user || (typeof Session !== 'undefined' && Session.getActiveUser && Session.getActiveUser().getEmail ? Session.getActiveUser().getEmail() : '');
  var name = params.name ? String(params.name).trim() : '';
  var email = (params.email && String(params.email).trim()) || user || '';
  var group = params.group ? String(params.group).trim() : '';
  var result = webapp_registerParticipant(name, email, group);
  return { success: result.success, message: result.message };
}

// ===============================================
// 管理者・統計
// ===============================================

function isAdmin(email) {
  var adminEmails = ['admin@example.com', 't_sato2@ga-tech.co.jp'];
  return adminEmails.indexOf(email) >= 0;
}

function getSystemStats() {
  try {
    var att = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.ATTENDEES);
    var ev = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.EVENTS);
    var cr = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.COURSES);
    return {
      totalParticipants: Math.max(0, att.getLastRow() - 1),
      totalCourses: Math.max(0, cr.getLastRow() - 1),
      totalReservations: Math.max(0, ev.getLastRow() - 1),
      activeReservations: ev.getLastRow() - 1
    };
  } catch (e) {
    return {
      totalParticipants: 0,
      totalCourses: 0,
      totalReservations: 0,
      activeReservations: 0
    };
  }
}

function getAvailableGroups() {
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.COURSES);
  var data = sheet.getDataRange().getValues();
  var seen = {};
  var groups = [];
  for (var i = WEBAPP_CONFIG.COURSES_ROW_FIRST - 1; i < data.length; i++) {
    var grp = data[i].length > CR.GROUP ? String(data[i][CR.GROUP] || '').trim() : '';
    if (grp && !seen[grp]) {
      seen[grp] = true;
      groups.push(grp);
    }
  }
  return groups;
}

function getSpreadsheetUrl() {
  var id = WEBAPP_CONFIG.SPREADSHEET_ID;
  return id ? 'https://docs.google.com/spreadsheets/d/' + id + '/edit' : '';
}

function getAllSessionsForAdmin() {
  var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.EVENTS);
  var data = sheet.getDataRange().getValues();
  var list = [];
  for (var i = WEBAPP_CONFIG.EVENTS_ROW_FIRST - 1; i < data.length; i++) {
    var row = data[i];
    if (row.length <= EV.COURSE_ID) continue;
    var status = row.length > EV.STATUS ? String(row[EV.STATUS] || '').trim() : '';
    var eventId = row.length > EV.EVENT_ID ? String(row[EV.EVENT_ID] || '').trim() : '';
    list.push({
      id: row[EV.NUMBER],
      eventId: eventId,
      courseId: row.length > EV.COURSE_ID ? String(row[EV.COURSE_ID] || '') : '',
      sessionName: row.length > EV.COURSE_NAME ? String(row[EV.COURSE_NAME] || '') : '',
      scheduledDate: row.length > EV.COURSE_DATE ? row[EV.COURSE_DATE] : '',
      startTime: row.length > EV.COURSE_START_TIME ? row[EV.COURSE_START_TIME] : '',
      endTime: row.length > EV.COURSE_END_TIME ? row[EV.COURSE_END_TIME] : '',
      location: row.length > EV.LOCATION ? String(row[EV.LOCATION] || '') : '',
      status: status
    });
  }
  return list;
}

function webapp_registerParticipant(name, email, group) {
  name = name ? String(name).trim() : '';
  email = email ? String(email).trim() : '';
  group = group ? String(group).trim() : '';
  if (!name || !email || !group) {
    return { success: false, message: '氏名・メールアドレス・グループは必須です。' };
  }
  var participant = getParticipantByEmail(email);
  if (participant) {
    return { success: false, message: 'このメールアドレスは既に登録されています。' };
  }
  var groups = getAvailableGroups();
  if (groups.indexOf(group) < 0) {
    return { success: false, message: '指定されたグループは存在しません。' };
  }
  try {
    var sheet = webapp_getSheet(WEBAPP_CONFIG.SHEET_NAMES.ATTENDEES);
    var lastRow = sheet.getLastRow();
    var nextRow = Math.max(lastRow + 1, WEBAPP_CONFIG.ATTENDEES_ROW_FIRST);
    var numCols = AT.COURSE_START + 12;
    var row = [];
    for (var c = 0; c < numCols; c++) {
      if (c === AT.NAME) row.push(name);
      else if (c === AT.EMAIL) row.push(email);
      else if (c === AT.GROUP) row.push(group);
      else row.push('');
    }
    sheet.getRange(nextRow, 1, nextRow, row.length).setValues([row]);
    return { success: true, message: '登録が完了しました。' };
  } catch (err) {
    Logger.log('webapp_registerParticipant: ' + err.message);
    return { success: false, message: err.message || '登録に失敗しました。' };
  }
}

// ===============================================
// ユーティリティ
// ===============================================

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getUserEmail() {
  return Session.getActiveUser().getEmail();
}

function formatDate(date) {
  if (!date) return '-';
  var d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1);
  if (m.length === 1) m = '0' + m;
  var day = String(d.getDate());
  if (day.length === 1) day = '0' + day;
  return y + '/' + m + '/' + day;
}
