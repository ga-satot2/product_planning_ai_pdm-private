# バグ修正の動作確認計画

## 作成日
2025年12月25日

## 修正したバグ

### 1. `reservation.gs`の`handleReservationFormSubmit()`関数
**問題**: グローバル変数`calendarId`とローカル変数の競合  
**修正**: `getCalendarId()`を使用するように変更

### 2. `tests.gs`の`getTestData()`関数
**問題**: `sheets.attendees.columns.EMAIL`が存在しない  
**修正**: `sheets.attendees.columns.CANDIDATES`に変更

## 動作確認方法

### ステップ1: 修正がプッシュされているか確認

```bash
cd /Users/t_sato2/product_planning_ai_pdm/stock/projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes
clasp pull
```

### ステップ2: `getTestData()`の動作確認

Apps Scriptエディタで`getTestData()`を実行して、エラーが発生しないか確認：

1. Google Apps Scriptエディタを開く
   - https://script.google.com/d/1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-/edit

2. `getTestData`関数を選択して実行

3. ログを確認
   - エラーが発生していないか
   - eventIdとemailが正しく取得できているか

### ステップ3: `handleReservationFormSubmit()`の動作確認

モックイベントを作成して実行：

```javascript
function testHandleReservationFormSubmit() {
  try {
    Logger.log('=== testHandleReservationFormSubmit: 開始 ===');
    
    // モックイベントを作成
    const mockEvent = {
      response: {
        getRespondentEmail: function() {
          return 't_sato2@ga-tech.co.jp';
        },
        getItemResponses: function() {
          return [
            {
              getItem: function() {
                return {
                  getTitle: function() { return 'グループ選択'; },
                  getType: function() { return FormApp.ItemType.MULTIPLE_CHOICE; }
                };
              },
              getResponse: function() { return '1期生'; }
            },
            {
              getItem: function() {
                return {
                  getTitle: function() { return '参加希望日'; },
                  getType: function() { return FormApp.ItemType.MULTIPLE_CHOICE; }
                };
              },
              getResponse: function() { 
                // 実際のeventIdを含む回答を返す
                return '2025/12/26 (Thu) 15:00〜16:00 テスト研修 (id: hvqdc7k9t1d96clvbq5nvk6jks)';
              }
            }
          ];
        }
      }
    };
    
    Logger.log('handleReservationFormSubmit()を実行中...');
    handleReservationFormSubmit(mockEvent);
    Logger.log('✅ handleReservationFormSubmit()実行完了');
    
    Logger.log('=== testHandleReservationFormSubmit: 完了 ===');
  } catch (error) {
    Logger.log('❌ testHandleReservationFormSubmit: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}
```

### ステップ4: 実際の動作確認

1. **予約一覧シートにeventIdを登録**
   - `createTestEvent()`で作成したイベントのeventIdを予約一覧シートに手動で登録
   - または、既存のeventIdを使用

2. **実際のフォーム送信をシミュレート**
   - フォーム側プロジェクトで`onFormSubmit()`を実行
   - または、実際にフォームを送信

3. **ログを確認**
   - エラーが発生していないか
   - カレンダーにゲストが追加されているか
   - 参加情報シートが更新されているか

## 確認すべきポイント

### `getTestData()`の確認
- ✅ エラーが発生しない
- ✅ eventIdが正しく取得できる
- ✅ emailが正しく取得できる

### `handleReservationFormSubmit()`の確認
- ✅ エラーが発生しない
- ✅ `getCalendarId()`が正しく呼び出されている
- ✅ カレンダーにゲストが追加される
- ✅ 参加情報シートが更新される

## 次のステップ

1. ✅ 修正がプッシュされているか確認
2. ⏳ `getTestData()`を実行して動作確認
3. ⏳ `handleReservationFormSubmit()`をモックイベントで実行して動作確認
4. ⏳ 実際の動作確認（フォーム送信シミュレート）


