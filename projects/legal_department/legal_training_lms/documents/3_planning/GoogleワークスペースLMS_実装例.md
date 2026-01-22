# GoogleワークスペースLMS 実装例

## 1. Google Sheets データ構造設計

### 1.1 受講者管理シート (Participants)

| 列 | 項目 | データ型 | 説明 |
|----|------|----------|------|
| A | ID | UUID | 一意識別子 |
| B | Employee_ID | 文字列 | 社員番号 |
| C | Name | 文字列 | 氏名 |
| D | Email | 文字列 | メールアドレス |
| E | Department | 文字列 | 部署 |
| F | Group_ID | 数値 | グループ番号(1-3) |
| G | Status | 文字列 | ステータス(active/inactive) |
| H | Created_At | 日時 | 作成日時 |
| I | Updated_At | 日時 | 更新日時 |

### 1.2 研修セッション管理シート (Sessions)

| 列 | 項目 | データ型 | 説明 |
|----|------|----------|------|
| A | ID | UUID | 一意識別子 |
| B | Course_ID | UUID | コースID |
| C | Session_Name | 文字列 | セッション名 |
| D | Scheduled_Date | 日付 | 開催日 |
| E | Start_Time | 時刻 | 開始時間 |
| F | End_Time | 時刻 | 終了時間 |
| G | Meeting_Room | 文字列 | 会議室 |
| H | Google_Calendar_Event_ID | 文字列 | カレンダーイベントID |
| I | Max_Participants | 数値 | 最大参加者数 |
| J | Current_Participants | 数値 | 現在の参加者数 |
| K | Status | 文字列 | ステータス |
| L | Created_At | 日時 | 作成日時 |

### 1.3 予約管理シート (Reservations)

| 列 | 項目 | データ型 | 説明 |
|----|------|----------|------|
| A | ID | UUID | 一意識別子 |
| B | Participant_ID | UUID | 受講者ID |
| C | Session_ID | UUID | セッションID |
| D | Status | 文字列 | 予約ステータス |
| E | Change_Count | 数値 | 変更回数 |
| F | Last_Changed_At | 日時 | 最終変更日時 |
| G | Reason | 文字列 | 変更理由 |
| H | Created_At | 日時 | 作成日時 |
| I | Updated_At | 日時 | 更新日時 |

## 2. Google Apps Script 実装例

### 2.1 メインアプリケーション (Code.gs)

```javascript
// 定数定義
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const CALENDAR_ID = 'YOUR_CALENDAR_ID';
const LOG_SPREADSHEET_ID = 'YOUR_LOG_SPREADSHEET_ID';

// メイン処理
function doGet(e) {
  const page = e.parameter.page || 'home';
  
  try {
    switch(page) {
      case 'home':
        return createHomePage();
      case 'reservation':
        return createReservationPage();
      case 'admin':
        return createAdminPage();
      case 'api':
        return handleApiRequest(e);
      default:
        return createErrorPage('ページが見つかりません');
    }
  } catch (error) {
    console.error('ページ表示エラー:', error);
    return createErrorPage('システムエラーが発生しました');
  }
}

// POST処理
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      case 'makeReservation':
        return makeReservation(data);
      case 'changeReservation':
        return changeReservation(data);
      case 'cancelReservation':
        return cancelReservation(data);
      case 'submitTest':
        return submitTest(data);
      default:
        return createErrorResponse('不明なアクションです');
    }
  } catch (error) {
    console.error('POST処理エラー:', error);
    return createErrorResponse('システムエラーが発生しました');
  }
}

// ホームページ作成
function createHomePage() {
  const template = HtmlService.createTemplateFromFile('index');
  template.userEmail = Session.getActiveUser().getEmail();
  template.userName = Session.getActiveUser().getName();
  
  return template.evaluate()
    .setTitle('法務研修LMS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 予約ページ作成
function createReservationPage() {
  const template = HtmlService.createTemplateFromFile('reservation');
  template.sessions = getAvailableSessions();
  template.userEmail = Session.getActiveUser().getEmail();
  
  return template.evaluate()
    .setTitle('研修予約')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 管理ページ作成
function createAdminPage() {
  if (!checkAdminPermission()) {
    return createErrorPage('管理者権限が必要です');
  }
  
  const template = HtmlService.createTemplateFromFile('admin');
  template.stats = getSystemStats();
  template.recentActivities = getRecentActivities();
  
  return template.evaluate()
    .setTitle('管理画面')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

### 2.2 予約管理機能 (ReservationManager.gs)

```javascript
// 予約作成
function makeReservation(data) {
  try {
    const { sessionId, reason } = data;
    const userEmail = Session.getActiveUser().getEmail();
    
    // ユーザー情報取得
    const participant = getParticipantByEmail(userEmail);
    if (!participant) {
      return createErrorResponse('受講者情報が見つかりません');
    }
    
    // セッション情報取得
    const session = getSessionById(sessionId);
    if (!session) {
      return createErrorResponse('セッションが見つかりません');
    }
    
    // 定員チェック
    if (session.current_participants >= session.max_participants) {
      return createErrorResponse('定員に達しています');
    }
    
    // 重複予約チェック
    if (hasExistingReservation(participant.id, session.scheduled_date)) {
      return createErrorResponse('同じ日の研修に既に予約しています');
    }
    
    // 予約データ保存
    const reservationId = saveReservation({
      participantId: participant.id,
      sessionId: sessionId,
      status: 'confirmed',
      reason: reason || ''
    });
    
    // カレンダーイベント作成
    const eventId = createCalendarEvent(session, participant);
    
    // セッション参加者数更新
    updateSessionParticipants(sessionId, 1);
    
    // 確認メール送信
    sendConfirmationEmail(participant, session);
    
    // ログ記録
    logActivity('reservation_created', participant.id, {
      sessionId: sessionId,
      reservationId: reservationId
    });
    
    return createSuccessResponse('予約が完了しました', {
      reservationId: reservationId,
      eventId: eventId
    });
    
  } catch (error) {
    console.error('予約作成エラー:', error);
    logError(error, { action: 'makeReservation', data: data });
    return createErrorResponse('予約作成に失敗しました');
  }
}

// 予約変更
function changeReservation(data) {
  try {
    const { oldSessionId, newSessionId, reason } = data;
    const userEmail = Session.getActiveUser().getEmail();
    
    // ユーザー情報取得
    const participant = getParticipantByEmail(userEmail);
    if (!participant) {
      return createErrorResponse('受講者情報が見つかりません');
    }
    
    // 変更条件チェック
    const changeCheck = checkChangeConditions(participant.id, oldSessionId, newSessionId);
    if (!changeCheck.allowed) {
      return createErrorResponse(changeCheck.reason);
    }
    
    // 元の予約をキャンセル
    updateReservationStatus(participant.id, oldSessionId, 'cancelled');
    
    // 新しい予約を作成
    const reservationId = saveReservation({
      participantId: participant.id,
      sessionId: newSessionId,
      status: 'confirmed',
      changeCount: 1,
      reason: reason || ''
    });
    
    // カレンダーイベント更新
    updateCalendarEvent(oldSessionId, newSessionId, participant);
    
    // 参加者数更新
    updateSessionParticipants(oldSessionId, -1);
    updateSessionParticipants(newSessionId, 1);
    
    // 変更通知送信
    sendChangeNotification(participant, oldSessionId, newSessionId);
    
    // ログ記録
    logActivity('reservation_changed', participant.id, {
      oldSessionId: oldSessionId,
      newSessionId: newSessionId,
      reservationId: reservationId
    });
    
    return createSuccessResponse('予約変更が完了しました', {
      reservationId: reservationId
    });
    
  } catch (error) {
    console.error('予約変更エラー:', error);
    logError(error, { action: 'changeReservation', data: data });
    return createErrorResponse('予約変更に失敗しました');
  }
}

// 予約キャンセル
function cancelReservation(data) {
  try {
    const { sessionId } = data;
    const userEmail = Session.getActiveUser().getEmail();
    
    // ユーザー情報取得
    const participant = getParticipantByEmail(userEmail);
    if (!participant) {
      return createErrorResponse('受講者情報が見つかりません');
    }
    
    // キャンセル条件チェック
    const session = getSessionById(sessionId);
    const daysUntilSession = Math.ceil((new Date(session.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilSession < 3) {
      return createErrorResponse('研修開始3日前以降はキャンセルできません');
    }
    
    // 予約をキャンセル
    updateReservationStatus(participant.id, sessionId, 'cancelled');
    
    // カレンダーイベント削除
    deleteCalendarEvent(sessionId, participant);
    
    // 参加者数更新
    updateSessionParticipants(sessionId, -1);
    
    // キャンセル通知送信
    sendCancellationNotification(participant, session);
    
    // ログ記録
    logActivity('reservation_cancelled', participant.id, {
      sessionId: sessionId
    });
    
    return createSuccessResponse('予約をキャンセルしました');
    
  } catch (error) {
    console.error('予約キャンセルエラー:', error);
    logError(error, { action: 'cancelReservation', data: data });
    return createErrorResponse('予約キャンセルに失敗しました');
  }
}
```

### 2.3 通知管理機能 (NotificationManager.gs)

```javascript
// 確認メール送信
function sendConfirmationEmail(participant, session) {
  try {
    const subject = `【法務研修】予約確認 - ${session.session_name}`;
    const body = `
${participant.name} 様

法務研修の予約が完了いたしました。

【研修詳細】
- 研修名: ${session.session_name}
- 日時: ${formatDate(session.scheduled_date)} ${session.start_time} - ${session.end_time}
- 会議室: ${session.meeting_room}
- 参加URL: ${session.meeting_url || '後日お送りします'}

研修開始30分前にリマインドメールをお送りします。

法務研修LMSシステム
    `;
    
    GmailApp.sendEmail(participant.email, subject, body);
    
    // ログ記録
    logActivity('confirmation_email_sent', participant.id, {
      sessionId: session.id,
      email: participant.email
    });
    
  } catch (error) {
    console.error('確認メール送信エラー:', error);
    logError(error, { 
      action: 'sendConfirmationEmail', 
      participantId: participant.id,
      sessionId: session.id 
    });
  }
}

// リマインドメール送信
function sendReminderEmail(participant, session) {
  try {
    const subject = `【法務研修】リマインド - ${session.session_name}`;
    const body = `
${participant.name} 様

明日の法務研修のリマインドです。

【研修詳細】
- 研修名: ${session.session_name}
- 日時: ${formatDate(session.scheduled_date)} ${session.start_time} - ${session.end_time}
- 会議室: ${session.meeting_room}
- 参加URL: ${session.meeting_url}

お時間になりましたら、上記URLからご参加ください。

法務研修LMSシステム
    `;
    
    GmailApp.sendEmail(participant.email, subject, body);
    
    // ログ記録
    logActivity('reminder_email_sent', participant.id, {
      sessionId: session.id,
      email: participant.email
    });
    
  } catch (error) {
    console.error('リマインドメール送信エラー:', error);
    logError(error, { 
      action: 'sendReminderEmail', 
      participantId: participant.id,
      sessionId: session.id 
    });
  }
}

// 結果通知メール送信
function sendResultEmail(participant, session, testScore) {
  try {
    const isPassed = testScore >= 80;
    const subject = `【法務研修】結果通知 - ${session.session_name}`;
    const body = `
${participant.name} 様

法務研修の結果をお知らせします。

【研修結果】
- 研修名: ${session.session_name}
- 得点: ${testScore}点
- 合格基準: 80点以上
- 結果: ${isPassed ? '合格' : '不合格'}

${isPassed ? 
  'お疲れ様でした。' : 
  '補講のご案内を別途お送りします。'
}

法務研修LMSシステム
    `;
    
    GmailApp.sendEmail(participant.email, subject, body);
    
    // ログ記録
    logActivity('result_email_sent', participant.id, {
      sessionId: session.id,
      testScore: testScore,
      isPassed: isPassed
    });
    
  } catch (error) {
    console.error('結果通知メール送信エラー:', error);
    logError(error, { 
      action: 'sendResultEmail', 
      participantId: participant.id,
      sessionId: session.id,
      testScore: testScore 
    });
  }
}
```

### 2.4 データ管理機能 (DataManager.gs)

```javascript
// 受講者データ取得
function getParticipantByEmail(email) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Participants');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[3] === email) { // Email列
        const participant = {};
        headers.forEach((header, index) => {
          participant[header.toLowerCase()] = row[index];
        });
        return participant;
      }
    }
    
    return null;
  } catch (error) {
    console.error('受講者データ取得エラー:', error);
    return null;
  }
}

// セッションデータ取得
function getSessionById(sessionId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Sessions');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === sessionId) { // ID列
        const session = {};
        headers.forEach((header, index) => {
          session[header.toLowerCase()] = row[index];
        });
        return session;
      }
    }
    
    return null;
  } catch (error) {
    console.error('セッションデータ取得エラー:', error);
    return null;
  }
}

// 利用可能セッション取得
function getAvailableSessions() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Sessions');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const sessions = [];
    const today = new Date();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sessionDate = new Date(row[3]); // Scheduled_Date列
      
      // 今日以降のセッションのみ
      if (sessionDate >= today && row[10] === 'scheduled') { // Status列
        const session = {};
        headers.forEach((header, index) => {
          session[header.toLowerCase()] = row[index];
        });
        
        // 定員に空きがあるかチェック
        if (session.current_participants < session.max_participants) {
          sessions.push(session);
        }
      }
    }
    
    return sessions.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  } catch (error) {
    console.error('利用可能セッション取得エラー:', error);
    return [];
  }
}

// 予約データ保存
function saveReservation(reservationData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Reservations');
    
    const reservationId = Utilities.getUuid();
    const now = new Date();
    
    sheet.appendRow([
      reservationId,
      reservationData.participantId,
      reservationData.sessionId,
      reservationData.status,
      reservationData.changeCount || 0,
      reservationData.lastChangedAt || now,
      reservationData.reason || '',
      now,
      now
    ]);
    
    return reservationId;
  } catch (error) {
    console.error('予約データ保存エラー:', error);
    throw error;
  }
}

// 予約ステータス更新
function updateReservationStatus(participantId, sessionId, status) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Reservations');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === participantId && row[2] === sessionId) { // Participant_ID, Session_ID列
        sheet.getRange(i + 1, 4).setValue(status); // Status列
        sheet.getRange(i + 1, 9).setValue(new Date()); // Updated_At列
        break;
      }
    }
  } catch (error) {
    console.error('予約ステータス更新エラー:', error);
    throw error;
  }
}
```

## 3. HTML テンプレート例

### 3.1 ホームページ (index.html)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>法務研修LMS</title>
    <style>
        body { font-family: 'Roboto', sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .welcome { color: #1a73e8; font-size: 24px; margin-bottom: 10px; }
        .user-info { color: #666; font-size: 16px; }
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .menu-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; transition: box-shadow 0.3s; }
        .menu-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .menu-title { color: #1a73e8; font-size: 18px; margin-bottom: 10px; }
        .menu-description { color: #666; font-size: 14px; margin-bottom: 15px; }
        .btn { background-color: #1a73e8; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background-color: #1557b0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #1a73e8; }
        .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="welcome">法務研修LMS</h1>
            <p class="user-info">ようこそ、<?= userEmail ?> さん</p>
        </div>
        
        <div class="menu-grid">
            <div class="menu-card">
                <h3 class="menu-title">研修予約</h3>
                <p class="menu-description">参加希望の研修セッションを予約できます</p>
                <a href="?page=reservation" class="btn">予約する</a>
            </div>
            
            <div class="menu-card">
                <h3 class="menu-title">予約確認</h3>
                <p class="menu-description">現在の予約状況を確認できます</p>
                <button onclick="showMyReservations()" class="btn">確認する</button>
            </div>
            
            <div class="menu-card">
                <h3 class="menu-title">テスト受験</h3>
                <p class="menu-description">研修後のテストを受験できます</p>
                <button onclick="showAvailableTests()" class="btn">受験する</button>
            </div>
            
            <div class="menu-card">
                <h3 class="menu-title">結果確認</h3>
                <p class="menu-description">テスト結果を確認できます</p>
                <button onclick="showMyResults()" class="btn">確認する</button>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="totalSessions">-</div>
                <div class="stat-label">利用可能セッション</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="myReservations">-</div>
                <div class="stat-label">私の予約数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="completedTests">-</div>
                <div class="stat-label">完了テスト数</div>
            </div>
        </div>
    </div>
    
    <script>
        // ページ読み込み時に統計情報を取得
        window.onload = function() {
            loadStats();
        };
        
        function loadStats() {
            // 統計情報を取得するAPI呼び出し
            fetch('?page=api&action=getStats')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('totalSessions').textContent = data.stats.totalSessions;
                        document.getElementById('myReservations').textContent = data.stats.myReservations;
                        document.getElementById('completedTests').textContent = data.stats.completedTests;
                    }
                })
                .catch(error => {
                    console.error('統計情報取得エラー:', error);
                });
        }
        
        function showMyReservations() {
            // 予約確認画面を表示
            alert('予約確認機能は開発中です');
        }
        
        function showAvailableTests() {
            // テスト一覧を表示
            alert('テスト受験機能は開発中です');
        }
        
        function showMyResults() {
            // 結果確認画面を表示
            alert('結果確認機能は開発中です');
        }
    </script>
</body>
</html>
```

### 3.2 予約ページ (reservation.html)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>研修予約 - 法務研修LMS</title>
    <style>
        body { font-family: 'Roboto', sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .title { color: #1a73e8; font-size: 24px; margin-bottom: 10px; }
        .session-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .session-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; transition: box-shadow 0.3s; }
        .session-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .session-card.full { opacity: 0.6; background-color: #f5f5f5; }
        .session-name { color: #1a73e8; font-size: 18px; margin-bottom: 10px; }
        .session-details { color: #666; font-size: 14px; margin-bottom: 15px; }
        .session-capacity { color: #666; font-size: 12px; margin-bottom: 15px; }
        .btn { background-color: #1a73e8; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background-color: #1557b0; }
        .btn:disabled { background-color: #ccc; cursor: not-allowed; }
        .btn-secondary { background-color: #6c757d; }
        .btn-secondary:hover { background-color: #545b62; }
        .loading { text-align: center; padding: 20px; color: #666; }
        .error { background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        .success { background-color: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">研修予約</h1>
            <p>参加希望の研修セッションを選択してください</p>
        </div>
        
        <div id="messageArea"></div>
        
        <div id="loadingMessage" class="loading">
            セッション情報を読み込み中...
        </div>
        
        <div id="sessionGrid" class="session-grid" style="display: none;">
            <!-- セッションカードがここに動的に挿入される -->
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="?page=home" class="btn btn-secondary">ホームに戻る</a>
        </div>
    </div>
    
    <script>
        // ページ読み込み時にセッション情報を取得
        window.onload = function() {
            loadSessions();
        };
        
        function loadSessions() {
            fetch('?page=api&action=getSessions')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('loadingMessage').style.display = 'none';
                    
                    if (data.success) {
                        displaySessions(data.sessions);
                    } else {
                        showError('セッション情報の取得に失敗しました: ' + data.message);
                    }
                })
                .catch(error => {
                    document.getElementById('loadingMessage').style.display = 'none';
                    showError('セッション情報の取得中にエラーが発生しました');
                    console.error('エラー:', error);
                });
        }
        
        function displaySessions(sessions) {
            const sessionGrid = document.getElementById('sessionGrid');
            sessionGrid.innerHTML = '';
            
            if (sessions.length === 0) {
                sessionGrid.innerHTML = '<p style="text-align: center; color: #666;">利用可能なセッションがありません</p>';
                sessionGrid.style.display = 'block';
                return;
            }
            
            sessions.forEach(session => {
                const sessionCard = createSessionCard(session);
                sessionGrid.appendChild(sessionCard);
            });
            
            sessionGrid.style.display = 'block';
        }
        
        function createSessionCard(session) {
            const card = document.createElement('div');
            card.className = 'session-card';
            
            const isFull = session.current_participants >= session.max_participants;
            if (isFull) {
                card.classList.add('full');
            }
            
            const capacityText = `${session.current_participants}/${session.max_participants}人`;
            const dateText = formatDate(session.scheduled_date);
            const timeText = `${session.start_time} - ${session.end_time}`;
            
            card.innerHTML = `
                <div class="session-name">${session.session_name}</div>
                <div class="session-details">
                    <div>日時: ${dateText}</div>
                    <div>時間: ${timeText}</div>
                    <div>会議室: ${session.meeting_room}</div>
                </div>
                <div class="session-capacity">定員: ${capacityText}</div>
                <button 
                    class="btn" 
                    ${isFull ? 'disabled' : ''} 
                    onclick="${isFull ? '' : `makeReservation('${session.id}')`}"
                >
                    ${isFull ? '満員' : '予約する'}
                </button>
            `;
            
            return card;
        }
        
        function makeReservation(sessionId) {
            if (!confirm('このセッションを予約しますか？')) {
                return;
            }
            
            const button = event.target;
            button.disabled = true;
            button.textContent = '予約中...';
            
            fetch('?page=api&action=makeReservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    reason: ''
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showSuccess('予約が完了しました');
                    // ページをリロードして最新の状態を表示
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    showError('予約に失敗しました: ' + data.message);
                    button.disabled = false;
                    button.textContent = '予約する';
                }
            })
            .catch(error => {
                showError('予約中にエラーが発生しました');
                button.disabled = false;
                button.textContent = '予約する';
                console.error('エラー:', error);
            });
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }
        
        function showError(message) {
            const messageArea = document.getElementById('messageArea');
            messageArea.innerHTML = `<div class="error">${message}</div>`;
        }
        
        function showSuccess(message) {
            const messageArea = document.getElementById('messageArea');
            messageArea.innerHTML = `<div class="success">${message}</div>`;
        }
    </script>
</body>
</html>
```

## 4. 自動化スクリプト例

### 4.1 リマインド送信の自動化

```javascript
// 毎日午前9時に実行されるトリガー設定
function setupReminderTrigger() {
  ScriptApp.newTrigger('sendDailyReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
}

// 日次リマインド送信
function sendDailyReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sessions = getSessionsByDate(tomorrow);
    
    for (const session of sessions) {
      const participants = getSessionParticipants(session.id);
      
      for (const participant of participants) {
        sendReminderEmail(participant, session);
        
        // 送信間隔を空ける（Gmail API制限対策）
        Utilities.sleep(1000);
      }
    }
    
    logActivity('daily_reminders_sent', null, {
      date: tomorrow,
      sessionCount: sessions.length,
      totalParticipants: sessions.reduce((sum, session) => sum + session.participants.length, 0)
    });
    
  } catch (error) {
    console.error('日次リマインド送信エラー:', error);
    logError(error, { action: 'sendDailyReminders' });
  }
}
```

### 4.2 データバックアップの自動化

```javascript
// 毎日午後11時に実行されるバックアップ
function setupBackupTrigger() {
  ScriptApp.newTrigger('dailyBackup')
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();
}

// 日次バックアップ
function dailyBackup() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const backupFolder = DriveApp.getFolderById('YOUR_BACKUP_FOLDER_ID');
    
    const today = new Date();
    const backupName = `LMS_Backup_${Utilities.formatDate(today, 'JST', 'yyyyMMdd')}.xlsx`;
    
    // スプレッドシートをExcel形式でエクスポート
    const blob = spreadsheet.getAs('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    blob.setName(backupName);
    
    // バックアップフォルダに保存
    backupFolder.createFile(blob);
    
    // 古いバックアップを削除（30日以上前）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const files = backupFolder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDateCreated() < thirtyDaysAgo) {
        file.setTrashed(true);
      }
    }
    
    logActivity('daily_backup_completed', null, {
      backupName: backupName,
      backupSize: blob.getBytes().length
    });
    
  } catch (error) {
    console.error('バックアップエラー:', error);
    logError(error, { action: 'dailyBackup' });
  }
}
```

---

**作成日**: 2024年10月17日  
**バージョン**: 1.0  
**対象**: GoogleワークスペースLMS実装例  
**技術スタック**: Google Apps Script + Google Sheets + Google Calendar + Gmail
