# テスト用EventID登録ガイド

**最終更新**: 2025年12月26日

---

## 📍 登録場所

テスト用EventIDは、**予約一覧シート**の**列H（イベントID列）**に登録します。

### 予約一覧シートの構造

| 列 | ヘッダー名 | 説明 |
|----|-----------|------|
| A | 予約ID | 予約の一意識別子（自動採番） |
| B | コースID | コース一覧との関連（FY26-XX-XX形式） |
| C | 予約名 | コース名 |
| D | コース案内 | コース説明 |
| E | 日程 | 開催日 |
| F | 開始日時 | 開始時刻 |
| G | 完了日時 | 終了時刻 |
| **H** | **イベントID** | **Google CalendarイベントID** ← **ここに登録** |
| I | 最大参加者数 | 定員 |
| J | 現在の参加者数 | 現在の予約数 |
| K | ステータス | 予約ステータス |

---

## 🔧 登録方法

### 方法1: `createTestEvent()`関数を使用（推奨）

**最も簡単な方法**です。この関数を実行すると、カレンダーにイベントを作成し、**自動的に予約一覧シートにも登録**されます。

#### 手順

1. **Apps Scriptエディタを開く**
   - スプレッドシートから「拡張機能」→「Apps Script」を選択
   - URL: `https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit`

2. **`createTestEvent()`関数を実行**
   - 関数選択ドロップダウンから`createTestEvent`を選択
   - 「実行」ボタンをクリック

3. **実行ログを確認**
   - 実行ログに以下の情報が表示されます：
     ```
     ✅ イベント作成成功！
     完全なeventId: hvqdc7k9t1d96clvbq5nvk6jks@google.com
     短いeventId: hvqdc7k9t1d96clvbq5nvk6jks
     ✅ スプレッドシートにも登録しました（行: 86）
     ```

4. **予約一覧シートを確認**
   - スプレッドシートの「予約一覧」シートを開く
   - 最終行に新しい行が追加され、列HにeventIdが登録されていることを確認

#### 注意事項

- `createTestEvent()`を実行すると、**実際のGoogleカレンダーにテスト用イベントが作成**されます
- テストが終わったら、カレンダーからイベントを削除することを推奨します
- スプレッドシートへの登録に失敗した場合は、エラーメッセージが表示されます

---

### 方法2: 手動で登録

既存のeventIdを手動で登録する場合の手順です。

#### 手順

1. **スプレッドシートを開く**
   - URL: `https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit`

2. **「予約一覧」シートを開く**

3. **新しい行を追加**
   - 最終行の次の行に新しい行を追加

4. **必要な情報を入力**
   - **列A（予約ID）**: 行番号（例: 86）
   - **列B（コースID）**: 任意のコースID（例: `FY26-TEST-01`）
   - **列C（予約名）**: コース名（例: `[テスト] 継続研修テストイベント`）
   - **列D（コース案内）**: コース説明（任意）
   - **列E（日程）**: 開催日（例: `2025/12/27`）
   - **列F（開始日時）**: 開始時刻（例: `15:00`）
   - **列G（完了日時）**: 終了時刻（例: `16:00`）
   - **列H（イベントID）**: **テスト用eventId** ← **ここに登録**
   - **列I（最大参加者数）**: 定員（例: `10`）
   - **列J（現在の参加者数）**: 現在の予約数（例: `0`）
   - **列K（ステータス）**: ステータス（例: `予約受付中`）

#### eventIdの形式

eventIdは以下のいずれかの形式で登録できます：

1. **短い形式**（推奨）: `hvqdc7k9t1d96clvbq5nvk6jks`
2. **完全な形式**: `hvqdc7k9t1d96clvbq5nvk6jks@google.com`
3. **URL形式**: `https://www.google.com/calendar/event?eid=hvqdc7k9t1d96clvbq5nvk6jks`

**注意**: コードは自動的に形式を変換して処理しますが、**短い形式（@google.comの前の部分のみ）**を推奨します。

---

## 🔍 登録確認方法

### `getTestData()`関数で確認

1. **Apps Scriptエディタで`getTestData()`を実行**
   - 関数選択ドロップダウンから`getTestData`を選択
   - 「実行」ボタンをクリック

2. **実行ログを確認**
   - 以下のように表示されれば、eventIdが正しく登録されています：
     ```
     取得したeventId一覧（1件）:
     1. eventId: hvqdc7k9t1d96clvbq5nvk6jks
        コース名: [テスト] 継続研修テストイベント
        URL: hvqdc7k9t1d96clvbq5nvk6jks
     ```

   - 0件の場合は、eventIdが登録されていません：
     ```
     取得したeventId一覧（0件）:
     ```

### スプレッドシートで直接確認

1. **「予約一覧」シートを開く**
2. **列H（イベントID列）を確認**
   - 空欄でない行があれば、eventIdが登録されています
   - 空欄の場合は、eventIdが登録されていません

---

## ⚠️ よくある問題と解決方法

### 問題1: `getTestData()`でeventIdが0件取得される

**原因**:
- 予約一覧シートの列H（イベントID列）が空欄
- eventIdの形式が正しくない

**解決方法**:
1. 予約一覧シートの列Hを確認
2. 空欄の場合は、`createTestEvent()`を実行するか、手動でeventIdを登録
3. eventIdの形式を確認（短い形式を推奨）

### 問題2: `createTestEvent()`でスプレッドシートへの登録に失敗する

**原因**:
- スプレッドシートへのアクセス権限がない
- シート名が正しくない

**解決方法**:
1. スプレッドシートへのアクセス権限を確認
2. 実行ログのエラーメッセージを確認
3. 手動でeventIdを登録する（方法2を参照）

### 問題3: `testChangeReservation()`で2つ目のeventIdが必要

**原因**:
- 予約変更テストには、2つの異なるeventIdが必要

**解決方法**:
1. `createTestEvent()`を2回実行して、2つのテスト用イベントを作成
2. または、既存のeventIdを2つ使用
3. `getTestData()`で2つ以上のeventIdが取得できることを確認

---

## 📝 テスト実行の流れ

### 推奨されるテスト実行手順

1. **`createTestEvent()`を実行**
   - テスト用イベントを作成し、予約一覧シートに自動登録

2. **`getTestData()`を実行**
   - eventIdが正しく登録されているか確認
   - 実行ログからeventIdをコピー

3. **個別テストを実行**
   - `testCancelReservation()`: 予約削除テスト
   - `testMarkAttendeeAsReserved()`: 予約済みマークテスト
   - `testMarkAttendeeAsUnreserved()`: 未予約マークテスト

4. **`testChangeReservation()`を実行する場合**
   - `createTestEvent()`を2回実行して、2つのeventIdを用意
   - または、既存のeventIdを2つ使用

5. **`testAllUntestedFunctions()`を実行**
   - すべての未テスト関数の統合テスト

---

## 📚 関連ドキュメント

- **`TEST_STATUS.md`** - テスト実行状況の統合レポート
- **`TEST_PARAMETERS.md`** - テスト用パラメータの取得方法
- **`MANUAL_TEST_EXECUTION_GUIDE.md`** - 手動テスト実行ガイド
- **`sheet_structure_documentation.md`** - スプレッドシート構造の詳細

---

**作成者**: プロダクト企画チーム  
**最終更新**: 2025年12月26日

