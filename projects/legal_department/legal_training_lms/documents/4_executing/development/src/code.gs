/**
 * 法務研修LMS - Google Apps Script メインコード（修正版）
 * Phase 1: 基盤構築
 * 
 * @author プロダクト企画チーム
 * @version 1.0.1
 * @date 2025-10-16
 */

// ===============================================
// 設定
// ===============================================

const CONFIG = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'),
  SHEET_NAMES: {
    COURSES: 'courses',
    PARTICIPANTS: 'participants',
    SESSIONS: 'sessions',
    RESERVATIONS: 'reservations',
    ATTENDANCE: 'attendance',
    CONFIG: 'config'
  },
  MAX_PARTICIPANTS_PER_SESSION: 50,
  GROUPS: [1, 2, 3],
  RESERVATION_CHANGE_DEADLINE_DAYS: 3,
  MAX_RESERVATION_CHANGES: 1
};

// ===============================================
// Web App エントリーポイント
// ===============================================

/**
 * Web Appのメインエントリーポイント（GET）
 */
function doGet(e) {
  try {
    const page = e.parameter.page || 'home';
    const user = Session.getActiveUser().getEmail();
    
    Logger.log(`doGet called: page=${page}, user=${user}`);
    
    // ページルーティング
    switch (page) {
      case 'home':
        return renderHomePage(user);
      case 'courses':
        return renderCoursesPage(user);
      case 'reservation':
        return renderReservationPage(user, e.parameter);
      case 'mypage':
        return renderMyPage(user);
      case 'admin':
        return renderAdminPage(user);
      default:
        return renderErrorPage('ページが見つかりません');
    }
  } catch (error) {
    Logger.log(`Error in doGet: ${error.message}`);
    return renderErrorPage(error.message);
  }
}

/**
 * Web AppのPOSTハンドラー
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    const user = Session.getActiveUser().getEmail();
    
    Logger.log(`doPost called: action=${action}, user=${user}`);
    
    // アクションルーティング
    switch (action) {
      case 'create_reservation':
        return handleCreateReservation(e.parameter, user);
      case 'cancel_reservation':
        return handleCancelReservation(e.parameter, user);
      case 'update_profile':
        return handleUpdateProfile(e.parameter, user);
      default:
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: '不明なアクション' })
        ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log(`Error in doPost: ${error.message}`);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===============================================
// ページレンダリング
// ===============================================

/**
 * ホームページをレンダリング
 */
function renderHomePage(user) {
  const template = HtmlService.createTemplateFromFile('Home');
  template.user = user;
  template.participant = getParticipantByEmail(user);
  
  return template.evaluate()
    .setTitle('法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 研修コース一覧ページをレンダリング（修正版）
 */
function renderCoursesPage(user) {
  try {
    Logger.log('renderCoursesPage開始: user=' + user);
    
    const template = HtmlService.createTemplateFromFile('Courses');
    template.user = user;
    
    const courses = getAvailableCourses();
    Logger.log('取得したコース数: ' + (courses ? courses.length : 0));
    if (courses && courses.length > 0) {
      Logger.log('最初のコース: ' + JSON.stringify(courses[0]));
    }
    template.courses = courses || [];
    
    const participant = getParticipantByEmail(user);
    Logger.log('受講者情報: ' + (participant ? participant.name : 'なし'));
    template.participant = participant;
    
    const output = template.evaluate()
      .setTitle('研修コース一覧 - 法務研修LMS')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    
    Logger.log('renderCoursesPage完了');
    return output;
    
  } catch (error) {
    Logger.log('❌ renderCoursesPageエラー: ' + error.message);
    Logger.log('スタック: ' + error.stack);
    
    // エラーページを返す
    return HtmlService.createHtmlOutput(
      '<h1>エラー</h1><p>' + error.message + '</p><pre>' + error.stack + '</pre>'
    );
  }
}

/**
 * 予約ページをレンダリング
 */
function renderReservationPage(user, params) {
  const template = HtmlService.createTemplateFromFile('Reservation');
  template.user = user;
  template.courseId = params.courseId || '';
  template.course = params.courseId ? getCourseById(params.courseId) : null;
  template.sessions = params.courseId ? getSessionsByCourseId(params.courseId) : [];
  template.participant = getParticipantByEmail(user);
  
  return template.evaluate()
    .setTitle('予約申し込み - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * マイページをレンダリング
 */
function renderMyPage(user) {
  const template = HtmlService.createTemplateFromFile('MyPage');
  template.user = user;
  template.participant = getParticipantByEmail(user);
  template.reservations = getReservationsByEmail(user);
  
  return template.evaluate()
    .setTitle('マイページ - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 管理者ページをレンダリング
 */
function renderAdminPage(user) {
  if (!isAdmin(user)) {
    return renderErrorPage('管理者権限が必要です');
  }
  
  const template = HtmlService.createTemplateFromFile('Admin');
  template.user = user;
  template.stats = getSystemStats();
  
  return template.evaluate()
    .setTitle('管理者ダッシュボード - 法務研修LMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * エラーページをレンダリング
 */
function renderErrorPage(message) {
  const template = HtmlService.createTemplate(
    '<html><body><h1>エラー</h1><p><?= message ?></p></body></html>'
  );
  template.message = message;
  
  return template.evaluate().setTitle('エラー - 法務研修LMS');
}

// ===============================================
// データアクセス - 受講者
// ===============================================

/**
 * メールアドレスで受講者情報を取得
 */
function getParticipantByEmail(email) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.PARTICIPANTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === email) { // email列
      return {
        id: data[i][0],
        employeeId: data[i][1],
        name: data[i][2],
        email: data[i][3],
        department: data[i][4],
        groupId: data[i][5],
        status: data[i][6]
      };
    }
  }
  
  return null;
}

/**
 * 受講者を新規登録
 */
function createParticipant(participantData) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.PARTICIPANTS);
  const id = Utilities.getUuid();
  const now = new Date();
  
  sheet.appendRow([
    id,
    participantData.employeeId,
    participantData.name,
    participantData.email,
    participantData.department || '',
    participantData.groupId || assignGroup(),
    'active',
    now,
    now
  ]);
  
  return id;
}

/**
 * グループを自動割り当て
 */
function assignGroup() {
  // 簡易実装：ランダムに割り当て
  return CONFIG.GROUPS[Math.floor(Math.random() * CONFIG.GROUPS.length)];
}

// ===============================================
// データアクセス - 研修コース
// ===============================================

/**
 * 利用可能な研修コース一覧を取得（修正版）
 */
function getAvailableCourses() {
  try {
    const sheet = getSheet(CONFIG.SHEET_NAMES.COURSES);
    const data = sheet.getDataRange().getValues();
    const courses = [];
    
    Logger.log('getAvailableCourses: データ行数=' + data.length);
    
    for (let i = 1; i < data.length; i++) {
      Logger.log(`行${i}: status(index 7)="${data[i][7]}"`);
      
      // 修正: status列はindex 7（8列目）
      if (data[i][7] === 'active') {
        courses.push({
          id: data[i][0],
          name: data[i][1],
          description: data[i][2],
          groupId: data[i][3],
          maxParticipants: data[i][4],
          startDate: data[i][5],
          endDate: data[i][6],
          status: data[i][7]
        });
        Logger.log('  ✅ コース追加: ' + data[i][1]);
      }
    }
    
    Logger.log('合計コース数: ' + courses.length);
    return courses;
    
  } catch (error) {
    Logger.log('❌ getAvailableCoursesエラー: ' + error.message);
    return [];
  }
}

/**
 * IDで研修コースを取得
 */
function getCourseById(courseId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.COURSES);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === courseId) {
      return {
        id: data[i][0],
        name: data[i][1],
        description: data[i][2],
        groupId: data[i][3],
        maxParticipants: data[i][4],
        startDate: data[i][5],
        endDate: data[i][6],
        status: data[i][7]
      };
    }
  }
  
  return null;
}

// ===============================================
// データアクセス - セッション
// ===============================================

/**
 * コースIDでセッション一覧を取得
 */
function getSessionsByCourseId(courseId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.SESSIONS);
  const data = sheet.getDataRange().getValues();
  const sessions = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === courseId && data[i][7] === 'scheduled') { // course_id, status列
      sessions.push({
        id: data[i][0],
        courseId: data[i][1],
        sessionName: data[i][2],
        scheduledDate: data[i][3],
        startTime: data[i][4],
        endTime: data[i][5],
        meetingRoomId: data[i][6],
        status: data[i][7],
        currentParticipants: getSessionParticipantCount(data[i][0])
      });
    }
  }
  
  return sessions;
}

/**
 * セッションの参加者数を取得
 */
function getSessionParticipantCount(sessionId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.RESERVATIONS);
  const data = sheet.getDataRange().getValues();
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === sessionId && data[i][3] === 'confirmed') {
      count++;
    }
  }
  
  return count;
}

// ===============================================
// データアクセス - 予約
// ===============================================

/**
 * メールアドレスで予約一覧を取得
 */
function getReservationsByEmail(email) {
  const participant = getParticipantByEmail(email);
  if (!participant) return [];
  
  const sheet = getSheet(CONFIG.SHEET_NAMES.RESERVATIONS);
  const data = sheet.getDataRange().getValues();
  const reservations = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === participant.id) {
      const session = getSessionById(data[i][2]);
      const course = session ? getCourseById(session.courseId) : null;
      
      reservations.push({
        id: data[i][0],
        participantId: data[i][1],
        sessionId: data[i][2],
        status: data[i][3],
        createdAt: data[i][6],
        session: session,
        course: course
      });
    }
  }
  
  return reservations;
}

/**
 * IDでセッション情報を取得
 */
function getSessionById(sessionId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.SESSIONS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sessionId) {
      return {
        id: data[i][0],
        courseId: data[i][1],
        sessionName: data[i][2],
        scheduledDate: data[i][3],
        startTime: data[i][4],
        endTime: data[i][5],
        meetingRoomId: data[i][6],
        status: data[i][7]
      };
    }
  }
  
  return null;
}

// ===============================================
// ビジネスロジック - 予約処理
// ===============================================

/**
 * 予約作成ハンドラー
 */
function handleCreateReservation(params, user) {
  try {
    const participant = getParticipantByEmail(user);
    if (!participant) {
      throw new Error('受講者情報が見つかりません');
    }
    
    const session = getSessionById(params.sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }
    
    // 定員チェック
    const currentCount = getSessionParticipantCount(params.sessionId);
    if (currentCount >= CONFIG.MAX_PARTICIPANTS_PER_SESSION) {
      throw new Error('定員に達しています');
    }
    
    // 重複チェック
    const existingReservations = getReservationsByEmail(user);
    for (const res of existingReservations) {
      if (res.sessionId === params.sessionId && res.status === 'confirmed') {
        throw new Error('既に予約済みです');
      }
    }
    
    // 予約作成
    const reservationId = createReservation(participant.id, params.sessionId);
    
    // 確認メール送信（TODO: Phase2で実装）
    // sendReservationConfirmationEmail(user, session);
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, reservationId: reservationId })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log(`Error in handleCreateReservation: ${error.message}`);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 予約を作成
 */
function createReservation(participantId, sessionId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.RESERVATIONS);
  const id = Utilities.getUuid();
  const now = new Date();
  
  sheet.appendRow([
    id,
    participantId,
    sessionId,
    'confirmed',
    null, // original_session_id
    null, // change_reason
    now,
    now
  ]);
  
  return id;
}

/**
 * 予約キャンセルハンドラー
 */
function handleCancelReservation(params, user) {
  try {
    const participant = getParticipantByEmail(user);
    if (!participant) {
      throw new Error('受講者情報が見つかりません');
    }
    
    // キャンセル処理
    cancelReservation(params.reservationId, participant.id);
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log(`Error in handleCancelReservation: ${error.message}`);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 予約をキャンセル
 */
function cancelReservation(reservationId, participantId) {
  const sheet = getSheet(CONFIG.SHEET_NAMES.RESERVATIONS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === reservationId && data[i][1] === participantId) {
      sheet.getRange(i + 1, 4).setValue('cancelled'); // status列
      sheet.getRange(i + 1, 8).setValue(new Date()); // updated_at列
      return true;
    }
  }
  
  throw new Error('予約が見つかりません');
}

// ===============================================
// ユーティリティ
// ===============================================

/**
 * スプレッドシートのシートを取得
 */
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  
  return sheet;
}

/**
 * シートを初期化（ヘッダー行を設定）
 */
function initializeSheet(sheet, sheetName) {
  const headers = getSheetHeaders(sheetName);
  if (headers.length > 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

/**
 * シートのヘッダー行を取得
 */
function getSheetHeaders(sheetName) {
  const headerMap = {
    'courses': ['id', 'name', 'description', 'group_id', 'max_participants', 'start_date', 'end_date', 'status', 'created_at', 'updated_at'],
    'participants': ['id', 'employee_id', 'name', 'email', 'department', 'group_id', 'status', 'created_at', 'updated_at'],
    'sessions': ['id', 'course_id', 'session_name', 'scheduled_date', 'start_time', 'end_time', 'meeting_room_id', 'status', 'created_at', 'updated_at'],
    'reservations': ['id', 'participant_id', 'session_id', 'status', 'original_session_id', 'change_reason', 'created_at', 'updated_at'],
    'attendance': ['id', 'participant_id', 'session_id', 'test_score', 'test_completed_at', 'attendance_status', 'created_at', 'updated_at']
  };
  
  return headerMap[sheetName] || [];
}

/**
 * 管理者かどうかをチェック
 */
function isAdmin(email) {
  // TODO: 実際の管理者リストを設定ファイルから取得
  const adminEmails = ['admin@example.com', 't_sato2@ga-tech.co.jp'];
  return adminEmails.includes(email);
}

/**
 * システム統計を取得
 */
function getSystemStats() {
  return {
    totalParticipants: getSheet(CONFIG.SHEET_NAMES.PARTICIPANTS).getLastRow() - 1,
    totalCourses: getSheet(CONFIG.SHEET_NAMES.COURSES).getLastRow() - 1,
    totalReservations: getSheet(CONFIG.SHEET_NAMES.RESERVATIONS).getLastRow() - 1,
    activeReservations: getActiveReservationCount()
  };
}

/**
 * アクティブな予約数を取得
 */
function getActiveReservationCount() {
  const sheet = getSheet(CONFIG.SHEET_NAMES.RESERVATIONS);
  const data = sheet.getDataRange().getValues();
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === 'confirmed') {
      count++;
    }
  }
  
  return count;
}

/**
 * プロフィール更新ハンドラー
 */
function handleUpdateProfile(params, user) {
  // TODO: Phase2で実装
  return ContentService.createTextOutput(
    JSON.stringify({ success: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTMLファイルをインクルード（共通パーツ用）
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 現在のユーザーのメールアドレスを取得
 */
function getUserEmail() {
  return Session.getActiveUser().getEmail();
}

/**
 * 日付をフォーマット（YYYY-MM-DD形式）
 */
function formatDate(date) {
  if (!date) return '-';
  
  // 文字列の場合はDateオブジェクトに変換
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // 日付が無効な場合
  if (isNaN(d.getTime())) return '-';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
}

