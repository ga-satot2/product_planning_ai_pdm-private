# エラー500の解決

## 作成日
2025-12-24

## 最終更新
2025-12-24

## 問題

Apps Scriptエディタでエラー500が発生していました。

## 原因

`reservation.gs`の`handleReservationFormSubmit()`関数で、グローバル変数`calendarId`を直接参照していましたが、関数内でローカル変数として再定義されていたため、変数のスコープが競合していました。

## 解決方法

`reservation.gs`の21行目を修正しました：

**修正前:**
```javascript
const added = addGuestToCalendarEvent(calendarId, eventId, email);
```

**修正後:**
```javascript
const localCalendarId = getCalendarId();
const added = addGuestToCalendarEvent(localCalendarId, eventId, email);
```

これにより、グローバル変数とローカル変数の競合を回避しました。

## 確認結果

✅ `clasp push`で修正をプッシュしました
✅ Apps Scriptエディタが正常に読み込まれました
✅ エラー500が解消されました
✅ 関数リストに分割後の関数が表示されています

## 次のステップ

1. ✅ エラー500解決
2. ⏳ ファイルリストを確認して、分割したファイルが表示されているか確認
3. ⏳ 各ファイルの関数が正しく動作するかテスト


