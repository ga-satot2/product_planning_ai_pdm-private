# 関数リファレンス

**作成日時**: 2025-12-25  
**最終更新**: 2025-12-25  
**プロジェクト**: 法務研修LMSシステム

---

## 📋 目次

1. [ファイル構成](#ファイル構成)
2. [ファイル別関数一覧](#ファイル別関数一覧)
3. [詳細関数リファレンス](#詳細関数リファレンス)
4. [ファイル間の依存関係](#ファイル間の依存関係)

---

## ファイル構成

### 分割後のファイル構成

`sheet.gs`（2009行）を機能別に分割しました：

| ファイル | 行数 | 関数数 | 説明 |
|---------|------|--------|------|
| `utils.gs` | 95行 | 8関数 | 共通ユーティリティ関数 |
| `calendar.gs` | 121行 | 5関数 | カレンダー連携関数 |
| `reservation.gs` | 266行 | 6関数 | 予約管理関数 |
| `handlers.gs` | 379行 | 4関数 | イベントハンドラー関数 |
| `tests.gs` | 382行 | 8関数 | テスト関数 |
| **合計** | **1,243行** | **31関数** | - |

---

## ファイル別関数一覧

### `utils.gs` (95行)

- `getUtils()` - Utilsインスタンスを取得（遅延初期化）
- `getConfig()` - 設定値を取得する関数（遅延初期化）
- `getPresetValues()` - プリセット値を取得
- `getSheets()` - シート設定を取得
- `getCourseHeaders()` - コースヘッダーを取得
- `getCalendarId()` - カレンダーIDを取得
- `getSiteUrl()` - サイトURLを取得
- `getInvalidValueSet()` - 無効値セットを取得

### `calendar.gs` (121行)

- `extractEmailFromEvent(e)` - イベントからメールアドレスを抽出
- `extractEventIdFromEvent(e, utilsInstance)` - イベントからイベントIDを抽出
- `extractEventIdFromAnswer(answer, utilsInstance)` - 回答からイベントIDを抽出
- `addGuestToCalendarEvent(calendarId, eventId, email)` - カレンダーイベントにゲストを追加
- `removeGuestFromCalendarEvent(calendarId, eventId, email)` - カレンダーイベントからゲストを削除

### `reservation.gs` (266行)

- `handleReservationFormSubmit(e)` - フォーム送信を検知してカレンダーにゲスト追加＆参加情報を更新
- `cancelReservation(email, eventId)` - 予約をキャンセル
- `changeReservation(email, oldEventId, newEventId)` - 予約を変更
- `markAttendeeAsReserved(email, eventId, utilsInstance)` - 参加者を予約済みにマーク
- `markAttendeeAsUnreserved(email, eventId, utilsInstance)` - 参加者を未予約にマーク
- `findEventInfoByEventId(eventId, utilsInstance)` - イベントIDからイベント情報を取得

### `handlers.gs` (379行)

- `refreshAttendeeStatus(e)` - 履修状況（参加情報シート）をカレンダーの最新状態に基づいて全更新
- `editHandler(e)` - 編集されたシートに応じて処理を振り分ける
- `onCreatingSchedule(e)` - 予約一覧シート編集時にカレンダーイベントを作成する
- `onDashboardAction(e)` - ダッシュボードシート編集時にグループ別・コース別にリマインドを送信する

### `tests.gs` (382行)

- `testSheetFunctions()` - sheet.gsの主要関数をテストする関数
- `testCancelReservation()` - cancelReservation()のテスト関数
- `testChangeReservation()` - changeReservation()のテスト関数
- `testMarkAttendeeAsReserved()` - markAttendeeAsReserved()のテスト関数
- `testMarkAttendeeAsUnreserved()` - markAttendeeAsUnreserved()のテスト関数
- `testAllSheetFunctions()` - 全sheet.gs関数の統合テスト
- `enablePermissions()` - 権限承認用のダミー関数
- `getTestData()` - テスト用の実際のデータを取得する関数

---

## 詳細関数リファレンス

### エラーハンドリング・ログ機能（LMSUtils.gs）

#### エラーハンドリング

##### `getErrorMessages()`
共通エラーメッセージ定義を取得

##### `getErrorMessage(errorKey, params)`
エラーメッセージを取得（プレースホルダー置換対応）

**パラメータ**:
- `errorKey` (string): エラーキー
- `params` (Object, オプション): プレースホルダー置換用パラメータ

##### `createError(errorKey, params, originalError)`
カスタムエラーを作成

**パラメータ**:
- `errorKey` (string): エラーキー
- `params` (Object, オプション): エラーパラメータ
- `originalError` (Error, オプション): 元のエラーオブジェクト

##### `handleError(fn, functionName, context)`
エラーハンドリングヘルパー関数

**パラメータ**:
- `fn` (Function): 実行する関数
- `functionName` (string): 関数名
- `context` (Object, オプション): コンテキスト情報

#### ログ機能

##### `log(level, message, context, error)`
ログを記録（スプレッドシートにも保存）

**パラメータ**:
- `level` (string): ログレベル（DEBUG, INFO, WARN, ERROR, FATAL）
- `message` (string): ログメッセージ
- `context` (Object, オプション): コンテキスト情報
- `error` (Error, オプション): エラーオブジェクト

##### `debug(message, context)`
デバッグログ

##### `info(message, context)`
情報ログ

##### `warn(message, context)`
警告ログ

##### `error(message, context, errorObj)`
エラーログ

##### `fatal(message, context, errorObj)`
致命的エラーログ

---

### 予約機能強化（reservation_enhanced.gs）

#### `checkEventCapacity(eventId)`
イベントの定員をチェック

**パラメータ**:
- `eventId` (string): イベントID

**戻り値**:
```javascript
{
  maxAttendees: number,      // 最大参加者数
  currentAttendees: number,  // 現在の参加者数
  isFull: boolean,           // 定員オーバーか
  availableSpots: number     // 空き数
}
```

#### `checkDuplicateReservation(email, eventId)`
重複予約をチェック

**パラメータ**:
- `email` (string): メールアドレス
- `eventId` (string): イベントID

**戻り値**: `boolean` - 重複している場合true

#### `sendReservationConfirmationEmail(email, eventId, eventInfo)`
予約確認メールを送信

**パラメータ**:
- `email` (string): メールアドレス
- `eventId` (string): イベントID
- `eventInfo` (Object): イベント情報

**戻り値**: `boolean` - 送信成功時true

#### `updateReservationVisualization()`
予約状況の可視化（ダッシュボード更新）

#### `updateReservationList()`
予約一覧の自動更新

---

### カレンダー連携強化（calendar_enhanced.gs）

#### `updateCalendarEvent(eventId, updates)`
イベントを更新

**パラメータ**:
- `eventId` (string): イベントID
- `updates` (Object): 更新内容
  - `title` (string, オプション): タイトル
  - `startTime` (Date, オプション): 開始時刻
  - `endTime` (Date, オプション): 終了時刻
  - `location` (string, オプション): 場所
  - `description` (string, オプション): 説明

**戻り値**: `boolean` - 更新成功時true

#### `deleteCalendarEvent(eventId)`
イベントを削除

**パラメータ**:
- `eventId` (string): イベントID

**戻り値**: `boolean` - 削除成功時true

#### `syncCalendarOnReservationChange(email, oldEventId, newEventId)`
予約変更時のカレンダー同期

**パラメータ**:
- `email` (string): メールアドレス
- `oldEventId` (string): 旧イベントID
- `newEventId` (string): 新イベントID

**戻り値**: `boolean` - 同期成功時true

#### `handleCancellation(email, eventId)`
キャンセル処理

**パラメータ**:
- `email` (string): メールアドレス
- `eventId` (string): イベントID

**戻り値**: `boolean` - 処理成功時true

---

### 予約変更機能（reservation_change.gs）

#### `checkChangeDeadline(eventId)`
変更期限をチェック（3日前まで）

**パラメータ**:
- `eventId` (string): イベントID

**戻り値**:
```javascript
{
  isValid: boolean,      // 変更可能か
  deadline: Date,        // 期限日時
  daysUntil: number,     // 残り日数
  message: string        // メッセージ
}
```

#### `checkChangeLimit(email, eventId)`
変更回数制限をチェック（1回まで）

**パラメータ**:
- `email` (string): メールアドレス
- `eventId` (string): イベントID

**戻り値**:
```javascript
{
  isValid: boolean,      // 変更可能か
  changeCount: number,   // 変更回数
  message: string        // メッセージ
}
```

#### `generateReservationChangeForm(email, currentEventId)`
予約変更申請画面（HTML）を生成

**パラメータ**:
- `email` (string): メールアドレス
- `currentEventId` (string): 現在のイベントID

**戻り値**: `string` - HTMLフォーム

#### `getAvailableSessionsForChange(email, currentEventInfo)`
変更可能なセッションを取得

**パラメータ**:
- `email` (string): メールアドレス
- `currentEventInfo` (Object): 現在のイベント情報

**戻り値**: `Array` - 変更可能なセッションのリスト

#### `processReservationChange(email, oldEventId, newEventId)`
予約変更処理（期限・回数チェック付き）

**パラメータ**:
- `email` (string): メールアドレス
- `oldEventId` (string): 旧イベントID
- `newEventId` (string): 新イベントID

**戻り値**:
```javascript
{
  success: boolean,  // 成功か
  message: string    // メッセージ
}
```

---

### 既存関数（エラーハンドリング強化版）

#### `onFormSubmit(e)` (form.gs)
フォーム送信時の処理（エラーハンドリング強化版）

**機能**:
- 定員チェック
- 重複チェック
- カレンダーにゲスト追加
- 参加情報更新
- 予約確認メール送信

#### `handleReservationFormSubmit(e)` (reservation.gs)
フォーム送信時の処理（エラーハンドリング強化版）

**機能**:
- 定員チェック
- 重複チェック
- カレンダーにゲスト追加
- 参加情報更新
- 予約確認メール送信

#### `cancelReservation(email, eventId)` (reservation.gs)
予約キャンセル（エラーハンドリング強化版）

**機能**:
- カレンダーからゲスト削除
- 参加情報更新
- キャンセル通知メール送信

#### `changeReservation(email, oldEventId, newEventId)` (reservation.gs)
予約変更（エラーハンドリング強化版）

**機能**:
- 変更期限チェック
- 変更回数制限チェック
- カレンダー同期
- ロールバック機能

---

## ファイル間の依存関係

```
utils.gs (基盤)
  ├─ calendar.gs
  ├─ reservation.gs
  │   └─ calendar.gs
  ├─ handlers.gs
  │   ├─ utils.gs
  │   ├─ calendar.gs
  │   └─ reservation.gs
  └─ tests.gs
      ├─ utils.gs
      ├─ calendar.gs
      ├─ reservation.gs
      └─ handlers.gs
```

---

**作成者**: プロダクト企画チーム  
**最終更新**: 2025-12-25
