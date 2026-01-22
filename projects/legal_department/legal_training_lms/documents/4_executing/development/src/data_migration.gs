/**
 * 既存データを新しいLMSシステムに移行するスクリプト
 * 
 * 既存スプレッドシート：
 * 1. ABCD研修 参加希望日: 1g75rf929hnN7UCuuaHycCZTHgcV_-rIhkl02VnX-tk8
 * 2. Course: ABCD研修: 1fMvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQc1I
 * 
 * 移行先スプレッドシート：
 * 法務研修LMS_マスターデータ: 1GnGjBx5Oa055n8xvzD9yqYJq2mi2udKKJI6TUhgH9fY
 */

// 既存スプレッドシートID
const SOURCE_SPREADSHEETS = {
  RESERVATIONS: '1g75rf929hnN7UCuuaHycCZTHgcV_-rIhkl02VnX-tk8', // 参加希望日
  COURSE: '1fMvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQc1I' // Course: ABCD研修
};

// 移行先スプレッドシートID
const TARGET_SPREADSHEET = '1GnGjBx5Oa055n8xvzD9yqYJq2mi2udKKJI6TUhgH9fY';

/**
 * データ移行メイン処理
 */
function migrateAllData() {
  Logger.log('=== データ移行開始 ===');
  
  try {
    // 1. 既存データの分析
    Logger.log('Step 1: 既存データを分析中...');
    const sourceData = analyzeSourceData();
    
    // 2. データ変換
    Logger.log('Step 2: データを変換中...');
    const transformedData = transformData(sourceData);
    
    // 3. 新しいシステムに投入
    Logger.log('Step 3: 新しいシステムにデータ投入中...');
    const result = importToNewSystem(transformedData);
    
    Logger.log('=== データ移行完了 ===');
    Logger.log(`移行結果: ${JSON.stringify(result)}`);
    
    return result;
    
  } catch (error) {
    Logger.log(`エラー: ${error.message}`);
    throw error;
  }
}

/**
 * 既存データを分析
 */
function analyzeSourceData() {
  Logger.log('既存スプレッドシートを開いています...');
  
  const data = {
    reservations: [],
    course: null,
    participants: []
  };
  
  try {
    // 参加希望日データを取得
    const reservationsSheet = SpreadsheetApp.openById(SOURCE_SPREADSHEETS.RESERVATIONS);
    const reservationsData = reservationsSheet.getSheets()[0].getDataRange().getValues();
    
    Logger.log(`参加希望日データ: ${reservationsData.length}行`);
    Logger.log(`ヘッダー: ${JSON.stringify(reservationsData[0])}`);
    
    data.reservations = reservationsData;
    
  } catch (error) {
    Logger.log(`参加希望日データ取得エラー: ${error.message}`);
  }
  
  try {
    // コースデータを取得
    const courseSheet = SpreadsheetApp.openById(SOURCE_SPREADSHEETS.COURSE);
    const courseData = courseSheet.getSheets()[0].getDataRange().getValues();
    
    Logger.log(`コースデータ: ${courseData.length}行`);
    Logger.log(`ヘッダー: ${JSON.stringify(courseData[0])}`);
    
    data.course = courseData;
    
  } catch (error) {
    Logger.log(`コースデータ取得エラー: ${error.message}`);
  }
  
  return data;
}

/**
 * データを新しいフォーマットに変換
 */
function transformData(sourceData) {
  Logger.log('データ変換を開始...');
  
  const transformed = {
    courses: [],
    sessions: [],
    participants: [],
    reservations: []
  };
  
  // コースデータの変換
  if (sourceData.course && sourceData.course.length > 1) {
    const headers = sourceData.course[0];
    const courseData = sourceData.course.slice(1);
    
    // ABCD研修を3グループに分けて登録
    for (let groupId = 1; groupId <= 3; groupId++) {
      transformed.courses.push({
        id: `course-${String(groupId).padStart(3, '0')}`,
        name: 'ABCD研修',
        description: 'ABCD研修の基礎知識を学ぶ',
        group_id: groupId,
        max_participants: 50,
        start_date: '2025-11-01',
        end_date: '2025-12-31',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
  
  // 参加希望日データから受講者とセッションを抽出
  if (sourceData.reservations && sourceData.reservations.length > 1) {
    const headers = sourceData.reservations[0];
    const reservationsData = sourceData.reservations.slice(1);
    
    Logger.log(`処理する予約データ: ${reservationsData.length}件`);
    
    // ヘッダーからカラムインデックスを特定
    const emailIndex = headers.indexOf('メールアドレス') >= 0 ? headers.indexOf('メールアドレス') : 
                       headers.indexOf('email') >= 0 ? headers.indexOf('email') : 1;
    const nameIndex = headers.indexOf('氏名') >= 0 ? headers.indexOf('氏名') : 
                      headers.indexOf('名前') >= 0 ? headers.indexOf('名前') : 0;
    const dateIndex = headers.indexOf('参加希望日') >= 0 ? headers.indexOf('参加希望日') : 2;
    
    Logger.log(`カラムインデックス - name: ${nameIndex}, email: ${emailIndex}, date: ${dateIndex}`);
    
    const participantMap = new Map();
    const sessionMap = new Map();
    let participantCounter = 1;
    let sessionCounter = 1;
    
    // データを処理
    reservationsData.forEach((row, index) => {
      if (!row[emailIndex]) return; // メールアドレスがない行はスキップ
      
      const email = row[emailIndex];
      const name = row[nameIndex] || '名前未設定';
      const preferredDate = row[dateIndex] || null;
      
      // 受講者を登録（重複チェック）
      if (!participantMap.has(email)) {
        const participantId = `participant-${String(participantCounter).padStart(3, '0')}`;
        const groupId = ((participantCounter - 1) % 3) + 1; // 1,2,3にラウンドロビン
        
        participantMap.set(email, {
          id: participantId,
          employee_id: `EMP${String(participantCounter).padStart(3, '0')}`,
          name: name,
          email: email,
          department: '未設定',
          group_id: groupId,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        });
        
        participantCounter++;
      }
    });
    
    transformed.participants = Array.from(participantMap.values());
    Logger.log(`変換された受講者数: ${transformed.participants.length}`);
  }
  
  // セッションを作成（グループごとに複数回）
  transformed.courses.forEach(course => {
    // 各グループに4回のセッションを作成
    for (let i = 1; i <= 4; i++) {
      const baseDate = new Date('2025-11-05');
      baseDate.setDate(baseDate.getDate() + (course.group_id - 1) + ((i - 1) * 7)); // グループと週でずらす
      
      const sessionId = `session-${course.group_id}${String(i).padStart(2, '0')}`;
      
      transformed.sessions.push({
        id: sessionId,
        course_id: course.id,
        session_name: `第${i}回 ABCD研修`,
        scheduled_date: baseDate.toISOString().split('T')[0],
        start_time: course.group_id === 1 ? '10:00' : course.group_id === 2 ? '14:00' : '10:00',
        end_time: course.group_id === 1 ? '12:00' : course.group_id === 2 ? '16:00' : '12:00',
        meeting_room_id: `会議室${String.fromCharCode(64 + course.group_id)}`, // A, B, C
        status: 'scheduled',
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  });
  
  return transformed;
}

/**
 * 新しいシステムにデータを投入
 */
function importToNewSystem(transformedData) {
  Logger.log('新しいシステムへのデータ投入を開始...');
  
  const targetSpreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET);
  const result = {
    courses: 0,
    sessions: 0,
    participants: 0,
    reservations: 0
  };
  
  try {
    // coursesシートにデータ投入
    const coursesSheet = getOrCreateSheet(targetSpreadsheet, 'courses');
    clearSheetAndAddHeaders(coursesSheet, [
      'id', 'name', 'description', 'group_id', 'max_participants', 
      'start_date', 'end_date', 'status', 'created_at', 'updated_at'
    ]);
    
    transformedData.courses.forEach(course => {
      coursesSheet.appendRow([
        course.id, course.name, course.description, course.group_id, 
        course.max_participants, course.start_date, course.end_date, 
        course.status, course.created_at, course.updated_at
      ]);
      result.courses++;
    });
    
    Logger.log(`✅ コース登録完了: ${result.courses}件`);
    
    // sessionsシートにデータ投入
    const sessionsSheet = getOrCreateSheet(targetSpreadsheet, 'sessions');
    clearSheetAndAddHeaders(sessionsSheet, [
      'id', 'course_id', 'session_name', 'scheduled_date', 'start_time', 
      'end_time', 'meeting_room_id', 'status', 'created_at', 'updated_at'
    ]);
    
    transformedData.sessions.forEach(session => {
      sessionsSheet.appendRow([
        session.id, session.course_id, session.session_name, session.scheduled_date,
        session.start_time, session.end_time, session.meeting_room_id, 
        session.status, session.created_at, session.updated_at
      ]);
      result.sessions++;
    });
    
    Logger.log(`✅ セッション登録完了: ${result.sessions}件`);
    
    // participantsシートにデータ投入
    const participantsSheet = getOrCreateSheet(targetSpreadsheet, 'participants');
    clearSheetAndAddHeaders(participantsSheet, [
      'id', 'employee_id', 'name', 'email', 'department', 
      'group_id', 'status', 'created_at', 'updated_at'
    ]);
    
    transformedData.participants.forEach(participant => {
      participantsSheet.appendRow([
        participant.id, participant.employee_id, participant.name, participant.email,
        participant.department, participant.group_id, participant.status,
        participant.created_at, participant.updated_at
      ]);
      result.participants++;
    });
    
    Logger.log(`✅ 受講者登録完了: ${result.participants}件`);
    
    // reservations, attendanceシートは空のヘッダーのみ
    const reservationsSheet = getOrCreateSheet(targetSpreadsheet, 'reservations');
    clearSheetAndAddHeaders(reservationsSheet, [
      'id', 'participant_id', 'session_id', 'status', 'original_session_id', 
      'change_reason', 'created_at', 'updated_at'
    ]);
    
    const attendanceSheet = getOrCreateSheet(targetSpreadsheet, 'attendance');
    clearSheetAndAddHeaders(attendanceSheet, [
      'id', 'participant_id', 'session_id', 'test_score', 'test_completed_at', 
      'attendance_status', 'created_at', 'updated_at'
    ]);
    
    const configSheet = getOrCreateSheet(targetSpreadsheet, 'config');
    clearSheetAndAddHeaders(configSheet, [
      'key', 'value', 'description', 'created_at', 'updated_at'
    ]);
    
    Logger.log('✅ 空シートの初期化完了');
    
  } catch (error) {
    Logger.log(`❌ データ投入エラー: ${error.message}`);
    throw error;
  }
  
  return result;
}

/**
 * シートを取得または作成
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * シートをクリアしてヘッダーを追加
 */
function clearSheetAndAddHeaders(sheet, headers) {
  sheet.clear();
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
}

/**
 * 既存データのプレビュー表示（デバッグ用）
 */
function previewSourceData() {
  Logger.log('=== 既存データのプレビュー ===');
  
  try {
    // 参加希望日データ
    const reservationsSheet = SpreadsheetApp.openById(SOURCE_SPREADSHEETS.RESERVATIONS);
    const reservationsData = reservationsSheet.getSheets()[0].getDataRange().getValues();
    
    Logger.log('\n【参加希望日データ】');
    Logger.log(`シート名: ${reservationsSheet.getSheets()[0].getName()}`);
    Logger.log(`行数: ${reservationsData.length}`);
    Logger.log(`ヘッダー: ${JSON.stringify(reservationsData[0])}`);
    if (reservationsData.length > 1) {
      Logger.log(`サンプル（1行目）: ${JSON.stringify(reservationsData[1])}`);
    }
    
    // コースデータ
    const courseSheet = SpreadsheetApp.openById(SOURCE_SPREADSHEETS.COURSE);
    const courseData = courseSheet.getSheets()[0].getDataRange().getValues();
    
    Logger.log('\n【コースデータ】');
    Logger.log(`シート名: ${courseSheet.getSheets()[0].getName()}`);
    Logger.log(`行数: ${courseData.length}`);
    Logger.log(`ヘッダー: ${JSON.stringify(courseData[0])}`);
    if (courseData.length > 1) {
      Logger.log(`サンプル（1行目）: ${JSON.stringify(courseData[1])}`);
    }
    
  } catch (error) {
    Logger.log(`プレビューエラー: ${error.message}`);
  }
}

/**
 * データ移行のテスト実行（少量データで確認）
 */
function testMigration() {
  Logger.log('=== テスト移行開始（プレビューのみ） ===');
  
  const sourceData = analyzeSourceData();
  const transformedData = transformData(sourceData);
  
  Logger.log('\n【変換後のデータ】');
  Logger.log(`コース数: ${transformedData.courses.length}`);
  Logger.log(`セッション数: ${transformedData.sessions.length}`);
  Logger.log(`受講者数: ${transformedData.participants.length}`);
  
  Logger.log('\n【コースサンプル】');
  Logger.log(JSON.stringify(transformedData.courses[0], null, 2));
  
  Logger.log('\n【セッションサンプル】');
  Logger.log(JSON.stringify(transformedData.sessions[0], null, 2));
  
  if (transformedData.participants.length > 0) {
    Logger.log('\n【受講者サンプル】');
    Logger.log(JSON.stringify(transformedData.participants[0], null, 2));
  }
  
  Logger.log('\n=== テスト移行完了（データは投入していません） ===');
}

