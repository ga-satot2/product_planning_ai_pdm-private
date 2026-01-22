# ファイル分割の概要

## 作成日
2025-12-24

## 最終更新
2025-12-24

## 分割の目的

`sheet.gs`（2009行）を機能別に分割し、コードの可読性と保守性を向上させました。

## 分割後のファイル構成

### 1. `utils.gs` - 共通ユーティリティ関数
- `getUtils()`, `getConfig()`, `getPresetValues()`, `getSheets()`, `getCourseHeaders()`
- `getCalendarId()`, `getSiteUrl()`, `getInvalidValueSet()`
- 定数: `preset_values`, `reminder_action_aliases`, `sheets`, `COURSE_HEADERS`, `calendarId`, `site_url`, `invalid_values`
- `CustomUtils`オブジェクト

### 2. `calendar.gs` - カレンダー連携関数
- `extractEmailFromEvent()`
- `extractEventIdFromEvent()`
- `extractEventIdFromAnswer()`
- `addGuestToCalendarEvent()`
- `removeGuestFromCalendarEvent()`

### 3. `reservation.gs` - 予約管理関数
- `handleReservationFormSubmit()`
- `cancelReservation()`
- `changeReservation()`
- `markAttendeeAsReserved()`
- `markAttendeeAsUnreserved()`
- `findEventInfoByEventId()`

### 4. `handlers.gs` - イベントハンドラー関数
- `refreshAttendeeStatus()`
- `editHandler()`
- `onCreatingSchedule()`
- `onDashboardAction()`

### 5. `tests.gs` - テスト関数
- `testSheetFunctions()`
- `testCancelReservation()`
- `testChangeReservation()`
- `testMarkAttendeeAsReserved()`
- `testMarkAttendeeAsUnreserved()`
- `testAllSheetFunctions()`
- `getTestData()`
- `enablePermissions()`

## ファイル間の依存関係

```
utils.gs (共通ユーティリティ)
  ├─ calendar.gs (カレンダー連携)
  ├─ reservation.gs (予約管理)
  │   └─ calendar.gs
  └─ handlers.gs (イベントハンドラー)
      ├─ utils.gs
      ├─ calendar.gs
      └─ reservation.gs
tests.gs (テスト関数)
  ├─ utils.gs
  ├─ calendar.gs
  ├─ reservation.gs
  └─ handlers.gs
```

## プッシュ状況

`clasp push --force`で以下のファイルがプッシュされました：

```
Pushed 12 files.
└─ api_endpoint.gs
└─ appsscript.json
└─ calendar.gs
└─ Code.gs
└─ handlers.gs
└─ import_reservation_data.gs
└─ LMSUtils.gs
└─ reservation.gs
└─ sheet.gs (旧ファイル、今後は無視)
└─ tests.gs
└─ update_email_addresses.gs
└─ utils.gs
```

## 注意事項

- `sheet.gs`は旧ファイルのため、`.claspignore`に追加して無視するように設定しました
- 今後は分割されたファイル（`utils.gs`, `calendar.gs`, `reservation.gs`, `handlers.gs`, `tests.gs`）を使用してください
- 各ファイルは独立して動作しますが、`utils.gs`が他のファイルの基盤となります

## 次のステップ

1. Apps Scriptエディタで関数リストを確認し、すべての関数が表示されているか確認
2. 各ファイルの関数が正しく動作するかテスト
3. 必要に応じて、`sheet.gs`を削除またはアーカイブ


