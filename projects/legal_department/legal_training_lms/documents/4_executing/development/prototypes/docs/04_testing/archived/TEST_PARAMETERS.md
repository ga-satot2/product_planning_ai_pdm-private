# パラメータが必要な関数のテスト方法

## 📋 概要

パラメータが必要な関数をテストするには、実際のスプレッドシートから取得したデータを使用する必要があります。

## 🔍 テストに必要なパラメータの取得方法

### 1. `findEventInfoByEventId(eventId, utilsInstance)`

**必要なパラメータ:**
- `eventId`: カレンダーイベントID（文字列）
- `utilsInstance`: `getUtils()`で取得したUtilsインスタンス（オプション）

**取得方法:**
1. スプレッドシートの「予約一覧」シートを開く
2. 「EVENT_URL」列から実際のイベントURLを確認
3. イベントURLから`eventId`を抽出（`eid=`パラメータから取得、またはURL全体）

**テスト用コード例:**
```javascript
function testFindEventInfoByEventId() {
  try {
    const utils = getUtils();
    
    // 方法1: スプレッドシートから実際のeventIdを取得
    const eventsSheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('予約一覧'); // シート名を確認
    const lastRow = eventsSheet.getLastRow();
    
    // EVENT_URL列からeventIdを取得
    for (let i = 2; i <= lastRow; i++) {
      const eventUrl = eventsSheet.getRange(i, EVENT_URL_COLUMN).getValue();
      if (eventUrl && eventUrl.indexOf('eid=') !== -1) {
        const eventId = utils.eventIdFromURL(eventUrl);
        Logger.log(`テスト用eventId: ${eventId}`);
        
        // テスト実行
        const eventInfo = findEventInfoByEventId(eventId, utils);
        if (eventInfo) {
          Logger.log(`✅ イベント情報取得成功: ${JSON.stringify(eventInfo)}`);
          return eventInfo;
        }
      }
    }
    
    Logger.log('⚠️ 有効なeventIdが見つかりませんでした');
    return null;
  } catch (error) {
    Logger.log(`❌ エラー: ${error.toString()}`);
    return null;
  }
}
```

### 2. `cancelReservation(email, eventId)`

**必要なパラメータ:**
- `email`: 参加者のメールアドレス（文字列）
- `eventId`: カレンダーイベントID（文字列）

**取得方法:**
1. スプレッドシートの「参加情報」シートを開く
2. 「メールアドレス」列から実際のメールアドレスを確認
3. 「予約一覧」シートから実際の`eventId`を取得

**テスト用コード例:**
```javascript
function testCancelReservation() {
  try {
    // 実際のメールアドレスとeventIdを設定
    const testEmail = 't_sato2@ga-tech.co.jp'; // 実際のメールアドレスに変更
    const testEventId = '実際のeventId'; // 上記のtestFindEventInfoByEventId()で取得したeventIdを使用
    
    Logger.log(`cancelReservation(${testEmail}, ${testEventId})を実行中...`);
    const result = cancelReservation(testEmail, testEventId);
    
    if (result) {
      Logger.log('✅ cancelReservation()成功');
    } else {
      Logger.log('❌ cancelReservation()失敗');
    }
    
    return result;
  } catch (error) {
    Logger.log(`❌ エラー: ${error.toString()}`);
    return false;
  }
}
```

### 3. `changeReservation(email, oldEventId, newEventId)`

**必要なパラメータ:**
- `email`: 参加者のメールアドレス（文字列）
- `oldEventId`: 変更前のカレンダーイベントID（文字列）
- `newEventId`: 変更後のカレンダーイベントID（文字列）

**取得方法:**
1. スプレッドシートの「参加情報」シートからメールアドレスを取得
2. 「予約一覧」シートから2つの異なる`eventId`を取得（同じコースの異なる日時など）

**テスト用コード例:**
```javascript
function testChangeReservation() {
  try {
    // 実際のメールアドレスとeventIdを設定
    const testEmail = 't_sato2@ga-tech.co.jp'; // 実際のメールアドレスに変更
    const oldEventId = '変更前のeventId'; // 実際のeventIdに変更
    const newEventId = '変更後のeventId'; // 実際のeventIdに変更
    
    Logger.log(`changeReservation(${testEmail}, ${oldEventId}, ${newEventId})を実行中...`);
    const result = changeReservation(testEmail, oldEventId, newEventId);
    
    if (result) {
      Logger.log('✅ changeReservation()成功');
    } else {
      Logger.log('❌ changeReservation()失敗');
    }
    
    return result;
  } catch (error) {
    Logger.log(`❌ エラー: ${error.toString()}`);
    return false;
  }
}
```

### 4. `markAttendeeAsReserved(email, eventId, utilsInstance)`

**必要なパラメータ:**
- `email`: 参加者のメールアドレス（文字列）
- `eventId`: カレンダーイベントID（文字列）
- `utilsInstance`: `getUtils()`で取得したUtilsインスタンス（オプション）

**取得方法:**
- 上記の`cancelReservation`と同じ方法で取得

**テスト用コード例:**
```javascript
function testMarkAttendeeAsReserved() {
  try {
    const utils = getUtils();
    const testEmail = 't_sato2@ga-tech.co.jp'; // 実際のメールアドレスに変更
    const testEventId = '実際のeventId'; // 実際のeventIdに変更
    
    Logger.log(`markAttendeeAsReserved(${testEmail}, ${testEventId})を実行中...`);
    markAttendeeAsReserved(testEmail, testEventId, utils);
    Logger.log('✅ markAttendeeAsReserved()実行完了');
  } catch (error) {
    Logger.log(`❌ エラー: ${error.toString()}`);
  }
}
```

### 5. `markAttendeeAsUnreserved(email, eventId, utilsInstance)`

**必要なパラメータ:**
- `email`: 参加者のメールアドレス（文字列）
- `eventId`: カレンダーイベントID（文字列）
- `utilsInstance`: `getUtils()`で取得したUtilsインスタンス（オプション）

**取得方法:**
- 上記の`cancelReservation`と同じ方法で取得

**テスト用コード例:**
```javascript
function testMarkAttendeeAsUnreserved() {
  try {
    const utils = getUtils();
    const testEmail = 't_sato2@ga-tech.co.jp'; // 実際のメールアドレスに変更
    const testEventId = '実際のeventId'; // 実際のeventIdに変更
    
    Logger.log(`markAttendeeAsUnreserved(${testEmail}, ${testEventId})を実行中...`);
    markAttendeeAsUnreserved(testEmail, testEventId, utils);
    Logger.log('✅ markAttendeeAsUnreserved()実行完了');
  } catch (error) {
    Logger.log(`❌ エラー: ${error.toString()}`);
  }
}
```

## 📝 実際のデータを取得するヘルパー関数

以下の関数をApps Scriptエディタで実行すると、テストに使える実際のデータを取得できます：

```javascript
/**
 * テスト用の実際のデータを取得する関数
 */
function getTestData() {
  try {
    const utils = getUtils();
    const config = getConfig();
    const sheets = getSheets();
    
    // 予約一覧シートからeventIdを取得
    const eventsSheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(sheets.events.name);
    const lastRow = eventsSheet.getLastRow();
    
    const eventIds = [];
    for (let i = sheets.events.rows.FIRST; i <= lastRow; i++) {
      const eventUrl = eventsSheet.getRange(i, sheets.events.columns.EVENT_URL).getValue();
      if (eventUrl && eventUrl.indexOf('eid=') !== -1) {
        const eventId = utils.eventIdFromURL(eventUrl);
        const courseName = eventsSheet.getRange(i, sheets.events.columns.COURSE_NAME).getValue();
        eventIds.push({
          eventId: eventId,
          courseName: courseName,
          eventUrl: eventUrl
        });
      }
    }
    
    Logger.log(`取得したeventId一覧（${eventIds.length}件）:`);
    eventIds.forEach((item, index) => {
      Logger.log(`${index + 1}. eventId: ${item.eventId}, コース名: ${item.courseName}`);
    });
    
    // 参加情報シートからメールアドレスを取得
    const attendeesSheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(sheets.attendees.name);
    const attendeesLastRow = attendeesSheet.getLastRow();
    
    const emails = [];
    for (let i = sheets.attendees.rows.FIRST; i <= attendeesLastRow; i++) {
      const email = attendeesSheet.getRange(i, sheets.attendees.columns.EMAIL).getValue();
      if (email && email.indexOf('@') !== -1) {
        emails.push(email);
      }
    }
    
    Logger.log(`取得したメールアドレス一覧（${emails.length}件）:`);
    emails.forEach((email, index) => {
      Logger.log(`${index + 1}. ${email}`);
    });
    
    return {
      eventIds: eventIds,
      emails: emails
    };
  } catch (error) {
    Logger.log(`❌ エラー: ${error.toString()}`);
    return null;
  }
}
```

## ⚠️ 注意事項

1. **実際のデータを使用するテスト**
   - テスト実行時は、実際のカレンダーイベントやスプレッドシートのデータが変更されます
   - テスト用のデータを使用するか、テスト後に手動で元に戻す必要があります

2. **権限の確認**
   - カレンダーへのアクセス権限が必要です
   - スプレッドシートへの編集権限が必要です

3. **テストの順序**
   - `markAttendeeAsReserved()` → `markAttendeeAsUnreserved()` の順でテストすると、データを元に戻せます
   - `cancelReservation()` → `addGuestToCalendarEvent()` の順でテストすると、予約を削除してから再追加できます

## 🚀 テスト実行手順

1. **`getTestData()`を実行**
   - Apps Scriptエディタで`getTestData()`を実行
   - 実行ログから実際の`eventId`と`email`をコピー

2. **テスト関数にパラメータを設定**
   - 上記のテスト用コード例のパラメータを、取得した実際の値に置き換え

3. **テスト関数を実行**
   - 各テスト関数を個別に実行
   - 実行ログで結果を確認

4. **データの確認**
   - スプレッドシートとカレンダーで、変更が正しく反映されているか確認

---

**作成日**: 2025-12-24  
**最終更新**: 2025-12-24


