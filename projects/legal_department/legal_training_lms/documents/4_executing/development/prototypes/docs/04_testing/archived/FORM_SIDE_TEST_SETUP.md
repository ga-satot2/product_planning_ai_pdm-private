# フォーム側プロジェクトテストセットアップガイド

**作成日**: 2025-12-25  
**目的**: フォーム側プロジェクト（`1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`）にテスト関数を追加する

---

## 概要

フォーム側プロジェクトはGoogleフォームにバインドされているため、`clasp`での直接プッシュが困難です。  
テスト関数を手動でコピー&ペーストする方法を説明します。

---

## テスト関数ファイル

**ファイル**: `form_tests.gs`  
**場所**: `stock/projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes/form_tests.gs`

---

## 手動セットアップ手順

### 1. フォーム側プロジェクトを開く

1. Googleフォームを開く: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
2. 「⋮」（三点メニュー）→「スクリプトエディタ」をクリック
3. Apps Scriptエディタが開きます

### 2. テスト関数を追加

1. Apps Scriptエディタで「+」（ファイルを追加）をクリック
2. 「スクリプト」を選択
3. ファイル名を「form_tests」に変更
4. `form_tests.gs`の内容をコピー&ペースト

### 3. テスト関数の実行

1. 関数選択ドロップダウンから`testAllFormFunctions`を選択
2. 「実行」ボタンをクリック
3. 実行ログを確認

---

## テスト関数一覧

### 統合テスト関数

- **`testAllFormFunctions()`**: すべてのフォーム側関数をテストする統合関数

### 個別テスト関数

1. **`testRebuildDependencies()`**: `rebuildTrainingForm()`の依存関数をテスト（既存）
2. **`testGetScheduledCourses()`**: `getScheduledCourses()`をテスト
3. **`testOpenSourceSpreadsheet()`**: `openSourceSpreadsheet()`をテスト
4. **`testUpdateAttendeeStatus()`**: `updateAttendeeStatus()`をテスト
5. **`testListAllTriggers()`**: `listAllTriggers()`をテスト
6. **`testClearBrokenTriggers()`**: `clearBrokenTriggers()`をテスト
7. **`testAutoRebuildFormOnSchedule()`**: `autoRebuildFormOnSchedule()`の依存関数をテスト
8. **`testOnFormSubmit()`**: `onFormSubmit()`をモックイベントでテスト

---

## テスト実行方法

### 方法1: 統合テスト関数を実行（推奨）

```
testAllFormFunctions()
```

すべてのフォーム側関数を一度にテストします。

### 方法2: 個別テスト関数を実行

各テスト関数を個別に実行できます。

例:
```
testGetScheduledCourses()
testOpenSourceSpreadsheet()
testUpdateAttendeeStatus()
```

---

## 注意事項

1. **フォーム再構築の注意**: `testAutoRebuildFormOnSchedule()`はフォームを再構築しませんが、`rebuildTrainingForm()`を直接実行するとフォームが再構築されます。

2. **データ依存**: 一部のテスト関数は実際のデータ（予約一覧シートのデータなど）が必要です。

3. **モックイベント**: `testOnFormSubmit()`はモックイベントを使用しますが、実際のフォーム送信イベントとは異なる場合があります。

---

## トラブルシューティング

### エラー: "Utils ライブラリが読み込まれていません"

**原因**: `LMSUtils.gs`ライブラリがフォーム側プロジェクトに追加されていません。

**解決策**:
1. Apps Scriptエディタで「ライブラリ」をクリック
2. 「ライブラリを追加」をクリック
3. ライブラリID `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ` を入力
4. 「追加」をクリック

### エラー: "スプレッドシートが取得できませんでした"

**原因**: スクリプトプロパティに`SPREADSHEET_ID`または`SPREADSHEET_URL`が設定されていません。

**解決策**:
1. Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
2. `SPREADSHEET_ID`または`SPREADSHEET_URL`を追加
3. 値: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`（スプレッドシートID）

---

## 次のステップ

1. フォーム側プロジェクトに`form_tests.gs`を追加
2. `testAllFormFunctions()`を実行
3. 実行ログを確認して、エラーがあれば修正
4. すべてのテストが成功したら、カバレッジ100%達成

---

## 参考

- フォーム側プロジェクトID: `1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`
- フォームURL: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
- スプレッドシートID: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`
- LMSUtilsライブラリID: `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ`

# フォーム側プロジェクトテストセットアップガイド

**作成日**: 2025-12-25  
**目的**: フォーム側プロジェクト（`1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`）にテスト関数を追加する

---

## 概要

フォーム側プロジェクトはGoogleフォームにバインドされているため、`clasp`での直接プッシュが困難です。  
テスト関数を手動でコピー&ペーストする方法を説明します。

---

## テスト関数ファイル

**ファイル**: `form_tests.gs`  
**場所**: `stock/projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes/form_tests.gs`

---

## 手動セットアップ手順

### 1. フォーム側プロジェクトを開く

1. Googleフォームを開く: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
2. 「⋮」（三点メニュー）→「スクリプトエディタ」をクリック
3. Apps Scriptエディタが開きます

### 2. テスト関数を追加

1. Apps Scriptエディタで「+」（ファイルを追加）をクリック
2. 「スクリプト」を選択
3. ファイル名を「form_tests」に変更
4. `form_tests.gs`の内容をコピー&ペースト

### 3. テスト関数の実行

1. 関数選択ドロップダウンから`testAllFormFunctions`を選択
2. 「実行」ボタンをクリック
3. 実行ログを確認

---

## テスト関数一覧

### 統合テスト関数

- **`testAllFormFunctions()`**: すべてのフォーム側関数をテストする統合関数

### 個別テスト関数

1. **`testRebuildDependencies()`**: `rebuildTrainingForm()`の依存関数をテスト（既存）
2. **`testGetScheduledCourses()`**: `getScheduledCourses()`をテスト
3. **`testOpenSourceSpreadsheet()`**: `openSourceSpreadsheet()`をテスト
4. **`testUpdateAttendeeStatus()`**: `updateAttendeeStatus()`をテスト
5. **`testListAllTriggers()`**: `listAllTriggers()`をテスト
6. **`testClearBrokenTriggers()`**: `clearBrokenTriggers()`をテスト
7. **`testAutoRebuildFormOnSchedule()`**: `autoRebuildFormOnSchedule()`の依存関数をテスト
8. **`testOnFormSubmit()`**: `onFormSubmit()`をモックイベントでテスト

---

## テスト実行方法

### 方法1: 統合テスト関数を実行（推奨）

```
testAllFormFunctions()
```

すべてのフォーム側関数を一度にテストします。

### 方法2: 個別テスト関数を実行

各テスト関数を個別に実行できます。

例:
```
testGetScheduledCourses()
testOpenSourceSpreadsheet()
testUpdateAttendeeStatus()
```

---

## 注意事項

1. **フォーム再構築の注意**: `testAutoRebuildFormOnSchedule()`はフォームを再構築しませんが、`rebuildTrainingForm()`を直接実行するとフォームが再構築されます。

2. **データ依存**: 一部のテスト関数は実際のデータ（予約一覧シートのデータなど）が必要です。

3. **モックイベント**: `testOnFormSubmit()`はモックイベントを使用しますが、実際のフォーム送信イベントとは異なる場合があります。

---

## トラブルシューティング

### エラー: "Utils ライブラリが読み込まれていません"

**原因**: `LMSUtils.gs`ライブラリがフォーム側プロジェクトに追加されていません。

**解決策**:
1. Apps Scriptエディタで「ライブラリ」をクリック
2. 「ライブラリを追加」をクリック
3. ライブラリID `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ` を入力
4. 「追加」をクリック

### エラー: "スプレッドシートが取得できませんでした"

**原因**: スクリプトプロパティに`SPREADSHEET_ID`または`SPREADSHEET_URL`が設定されていません。

**解決策**:
1. Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
2. `SPREADSHEET_ID`または`SPREADSHEET_URL`を追加
3. 値: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`（スプレッドシートID）

---

## 次のステップ

1. フォーム側プロジェクトに`form_tests.gs`を追加
2. `testAllFormFunctions()`を実行
3. 実行ログを確認して、エラーがあれば修正
4. すべてのテストが成功したら、カバレッジ100%達成

---

## 参考

- フォーム側プロジェクトID: `1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`
- フォームURL: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
- スプレッドシートID: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`
- LMSUtilsライブラリID: `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ`

# フォーム側プロジェクトテストセットアップガイド

**作成日**: 2025-12-25  
**目的**: フォーム側プロジェクト（`1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`）にテスト関数を追加する

---

## 概要

フォーム側プロジェクトはGoogleフォームにバインドされているため、`clasp`での直接プッシュが困難です。  
テスト関数を手動でコピー&ペーストする方法を説明します。

---

## テスト関数ファイル

**ファイル**: `form_tests.gs`  
**場所**: `stock/projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes/form_tests.gs`

---

## 手動セットアップ手順

### 1. フォーム側プロジェクトを開く

1. Googleフォームを開く: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
2. 「⋮」（三点メニュー）→「スクリプトエディタ」をクリック
3. Apps Scriptエディタが開きます

### 2. テスト関数を追加

1. Apps Scriptエディタで「+」（ファイルを追加）をクリック
2. 「スクリプト」を選択
3. ファイル名を「form_tests」に変更
4. `form_tests.gs`の内容をコピー&ペースト

### 3. テスト関数の実行

1. 関数選択ドロップダウンから`testAllFormFunctions`を選択
2. 「実行」ボタンをクリック
3. 実行ログを確認

---

## テスト関数一覧

### 統合テスト関数

- **`testAllFormFunctions()`**: すべてのフォーム側関数をテストする統合関数

### 個別テスト関数

1. **`testRebuildDependencies()`**: `rebuildTrainingForm()`の依存関数をテスト（既存）
2. **`testGetScheduledCourses()`**: `getScheduledCourses()`をテスト
3. **`testOpenSourceSpreadsheet()`**: `openSourceSpreadsheet()`をテスト
4. **`testUpdateAttendeeStatus()`**: `updateAttendeeStatus()`をテスト
5. **`testListAllTriggers()`**: `listAllTriggers()`をテスト
6. **`testClearBrokenTriggers()`**: `clearBrokenTriggers()`をテスト
7. **`testAutoRebuildFormOnSchedule()`**: `autoRebuildFormOnSchedule()`の依存関数をテスト
8. **`testOnFormSubmit()`**: `onFormSubmit()`をモックイベントでテスト

---

## テスト実行方法

### 方法1: 統合テスト関数を実行（推奨）

```
testAllFormFunctions()
```

すべてのフォーム側関数を一度にテストします。

### 方法2: 個別テスト関数を実行

各テスト関数を個別に実行できます。

例:
```
testGetScheduledCourses()
testOpenSourceSpreadsheet()
testUpdateAttendeeStatus()
```

---

## 注意事項

1. **フォーム再構築の注意**: `testAutoRebuildFormOnSchedule()`はフォームを再構築しませんが、`rebuildTrainingForm()`を直接実行するとフォームが再構築されます。

2. **データ依存**: 一部のテスト関数は実際のデータ（予約一覧シートのデータなど）が必要です。

3. **モックイベント**: `testOnFormSubmit()`はモックイベントを使用しますが、実際のフォーム送信イベントとは異なる場合があります。

---

## トラブルシューティング

### エラー: "Utils ライブラリが読み込まれていません"

**原因**: `LMSUtils.gs`ライブラリがフォーム側プロジェクトに追加されていません。

**解決策**:
1. Apps Scriptエディタで「ライブラリ」をクリック
2. 「ライブラリを追加」をクリック
3. ライブラリID `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ` を入力
4. 「追加」をクリック

### エラー: "スプレッドシートが取得できませんでした"

**原因**: スクリプトプロパティに`SPREADSHEET_ID`または`SPREADSHEET_URL`が設定されていません。

**解決策**:
1. Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
2. `SPREADSHEET_ID`または`SPREADSHEET_URL`を追加
3. 値: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`（スプレッドシートID）

---

## 次のステップ

1. フォーム側プロジェクトに`form_tests.gs`を追加
2. `testAllFormFunctions()`を実行
3. 実行ログを確認して、エラーがあれば修正
4. すべてのテストが成功したら、カバレッジ100%達成

---

## 参考

- フォーム側プロジェクトID: `1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`
- フォームURL: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
- スプレッドシートID: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`
- LMSUtilsライブラリID: `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ`

# フォーム側プロジェクトテストセットアップガイド

**作成日**: 2025-12-25  
**目的**: フォーム側プロジェクト（`1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`）にテスト関数を追加する

---

## 概要

フォーム側プロジェクトはGoogleフォームにバインドされているため、`clasp`での直接プッシュが困難です。  
テスト関数を手動でコピー&ペーストする方法を説明します。

---

## テスト関数ファイル

**ファイル**: `form_tests.gs`  
**場所**: `stock/projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes/form_tests.gs`

---

## 手動セットアップ手順

### 1. フォーム側プロジェクトを開く

1. Googleフォームを開く: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
2. 「⋮」（三点メニュー）→「スクリプトエディタ」をクリック
3. Apps Scriptエディタが開きます

### 2. テスト関数を追加

1. Apps Scriptエディタで「+」（ファイルを追加）をクリック
2. 「スクリプト」を選択
3. ファイル名を「form_tests」に変更
4. `form_tests.gs`の内容をコピー&ペースト

### 3. テスト関数の実行

1. 関数選択ドロップダウンから`testAllFormFunctions`を選択
2. 「実行」ボタンをクリック
3. 実行ログを確認

---

## テスト関数一覧

### 統合テスト関数

- **`testAllFormFunctions()`**: すべてのフォーム側関数をテストする統合関数

### 個別テスト関数

1. **`testRebuildDependencies()`**: `rebuildTrainingForm()`の依存関数をテスト（既存）
2. **`testGetScheduledCourses()`**: `getScheduledCourses()`をテスト
3. **`testOpenSourceSpreadsheet()`**: `openSourceSpreadsheet()`をテスト
4. **`testUpdateAttendeeStatus()`**: `updateAttendeeStatus()`をテスト
5. **`testListAllTriggers()`**: `listAllTriggers()`をテスト
6. **`testClearBrokenTriggers()`**: `clearBrokenTriggers()`をテスト
7. **`testAutoRebuildFormOnSchedule()`**: `autoRebuildFormOnSchedule()`の依存関数をテスト
8. **`testOnFormSubmit()`**: `onFormSubmit()`をモックイベントでテスト

---

## テスト実行方法

### 方法1: 統合テスト関数を実行（推奨）

```
testAllFormFunctions()
```

すべてのフォーム側関数を一度にテストします。

### 方法2: 個別テスト関数を実行

各テスト関数を個別に実行できます。

例:
```
testGetScheduledCourses()
testOpenSourceSpreadsheet()
testUpdateAttendeeStatus()
```

---

## 注意事項

1. **フォーム再構築の注意**: `testAutoRebuildFormOnSchedule()`はフォームを再構築しませんが、`rebuildTrainingForm()`を直接実行するとフォームが再構築されます。

2. **データ依存**: 一部のテスト関数は実際のデータ（予約一覧シートのデータなど）が必要です。

3. **モックイベント**: `testOnFormSubmit()`はモックイベントを使用しますが、実際のフォーム送信イベントとは異なる場合があります。

---

## トラブルシューティング

### エラー: "Utils ライブラリが読み込まれていません"

**原因**: `LMSUtils.gs`ライブラリがフォーム側プロジェクトに追加されていません。

**解決策**:
1. Apps Scriptエディタで「ライブラリ」をクリック
2. 「ライブラリを追加」をクリック
3. ライブラリID `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ` を入力
4. 「追加」をクリック

### エラー: "スプレッドシートが取得できませんでした"

**原因**: スクリプトプロパティに`SPREADSHEET_ID`または`SPREADSHEET_URL`が設定されていません。

**解決策**:
1. Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
2. `SPREADSHEET_ID`または`SPREADSHEET_URL`を追加
3. 値: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`（スプレッドシートID）

---

## 次のステップ

1. フォーム側プロジェクトに`form_tests.gs`を追加
2. `testAllFormFunctions()`を実行
3. 実行ログを確認して、エラーがあれば修正
4. すべてのテストが成功したら、カバレッジ100%達成

---

## 参考

- フォーム側プロジェクトID: `1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`
- フォームURL: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
- スプレッドシートID: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`
- LMSUtilsライブラリID: `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ`

# フォーム側プロジェクトテストセットアップガイド

**作成日**: 2025-12-25  
**目的**: フォーム側プロジェクト（`1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`）にテスト関数を追加する

---

## 概要

フォーム側プロジェクトはGoogleフォームにバインドされているため、`clasp`での直接プッシュが困難です。  
テスト関数を手動でコピー&ペーストする方法を説明します。

---

## テスト関数ファイル

**ファイル**: `form_tests.gs`  
**場所**: `stock/projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes/form_tests.gs`

---

## 手動セットアップ手順

### 1. フォーム側プロジェクトを開く

1. Googleフォームを開く: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
2. 「⋮」（三点メニュー）→「スクリプトエディタ」をクリック
3. Apps Scriptエディタが開きます

### 2. テスト関数を追加

1. Apps Scriptエディタで「+」（ファイルを追加）をクリック
2. 「スクリプト」を選択
3. ファイル名を「form_tests」に変更
4. `form_tests.gs`の内容をコピー&ペースト

### 3. テスト関数の実行

1. 関数選択ドロップダウンから`testAllFormFunctions`を選択
2. 「実行」ボタンをクリック
3. 実行ログを確認

---

## テスト関数一覧

### 統合テスト関数

- **`testAllFormFunctions()`**: すべてのフォーム側関数をテストする統合関数

### 個別テスト関数

1. **`testRebuildDependencies()`**: `rebuildTrainingForm()`の依存関数をテスト（既存）
2. **`testGetScheduledCourses()`**: `getScheduledCourses()`をテスト
3. **`testOpenSourceSpreadsheet()`**: `openSourceSpreadsheet()`をテスト
4. **`testUpdateAttendeeStatus()`**: `updateAttendeeStatus()`をテスト
5. **`testListAllTriggers()`**: `listAllTriggers()`をテスト
6. **`testClearBrokenTriggers()`**: `clearBrokenTriggers()`をテスト
7. **`testAutoRebuildFormOnSchedule()`**: `autoRebuildFormOnSchedule()`の依存関数をテスト
8. **`testOnFormSubmit()`**: `onFormSubmit()`をモックイベントでテスト

---

## テスト実行方法

### 方法1: 統合テスト関数を実行（推奨）

```
testAllFormFunctions()
```

すべてのフォーム側関数を一度にテストします。

### 方法2: 個別テスト関数を実行

各テスト関数を個別に実行できます。

例:
```
testGetScheduledCourses()
testOpenSourceSpreadsheet()
testUpdateAttendeeStatus()
```

---

## 注意事項

1. **フォーム再構築の注意**: `testAutoRebuildFormOnSchedule()`はフォームを再構築しませんが、`rebuildTrainingForm()`を直接実行するとフォームが再構築されます。

2. **データ依存**: 一部のテスト関数は実際のデータ（予約一覧シートのデータなど）が必要です。

3. **モックイベント**: `testOnFormSubmit()`はモックイベントを使用しますが、実際のフォーム送信イベントとは異なる場合があります。

---

## トラブルシューティング

### エラー: "Utils ライブラリが読み込まれていません"

**原因**: `LMSUtils.gs`ライブラリがフォーム側プロジェクトに追加されていません。

**解決策**:
1. Apps Scriptエディタで「ライブラリ」をクリック
2. 「ライブラリを追加」をクリック
3. ライブラリID `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ` を入力
4. 「追加」をクリック

### エラー: "スプレッドシートが取得できませんでした"

**原因**: スクリプトプロパティに`SPREADSHEET_ID`または`SPREADSHEET_URL`が設定されていません。

**解決策**:
1. Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
2. `SPREADSHEET_ID`または`SPREADSHEET_URL`を追加
3. 値: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`（スプレッドシートID）

---

## 次のステップ

1. フォーム側プロジェクトに`form_tests.gs`を追加
2. `testAllFormFunctions()`を実行
3. 実行ログを確認して、エラーがあれば修正
4. すべてのテストが成功したら、カバレッジ100%達成

---

## 参考

- フォーム側プロジェクトID: `1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`
- フォームURL: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
- スプレッドシートID: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`
- LMSUtilsライブラリID: `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ`

# フォーム側プロジェクトテストセットアップガイド

**作成日**: 2025-12-25  
**目的**: フォーム側プロジェクト（`1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`）にテスト関数を追加する

---

## 概要

フォーム側プロジェクトはGoogleフォームにバインドされているため、`clasp`での直接プッシュが困難です。  
テスト関数を手動でコピー&ペーストする方法を説明します。

---

## テスト関数ファイル

**ファイル**: `form_tests.gs`  
**場所**: `stock/projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes/form_tests.gs`

---

## 手動セットアップ手順

### 1. フォーム側プロジェクトを開く

1. Googleフォームを開く: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
2. 「⋮」（三点メニュー）→「スクリプトエディタ」をクリック
3. Apps Scriptエディタが開きます

### 2. テスト関数を追加

1. Apps Scriptエディタで「+」（ファイルを追加）をクリック
2. 「スクリプト」を選択
3. ファイル名を「form_tests」に変更
4. `form_tests.gs`の内容をコピー&ペースト

### 3. テスト関数の実行

1. 関数選択ドロップダウンから`testAllFormFunctions`を選択
2. 「実行」ボタンをクリック
3. 実行ログを確認

---

## テスト関数一覧

### 統合テスト関数

- **`testAllFormFunctions()`**: すべてのフォーム側関数をテストする統合関数

### 個別テスト関数

1. **`testRebuildDependencies()`**: `rebuildTrainingForm()`の依存関数をテスト（既存）
2. **`testGetScheduledCourses()`**: `getScheduledCourses()`をテスト
3. **`testOpenSourceSpreadsheet()`**: `openSourceSpreadsheet()`をテスト
4. **`testUpdateAttendeeStatus()`**: `updateAttendeeStatus()`をテスト
5. **`testListAllTriggers()`**: `listAllTriggers()`をテスト
6. **`testClearBrokenTriggers()`**: `clearBrokenTriggers()`をテスト
7. **`testAutoRebuildFormOnSchedule()`**: `autoRebuildFormOnSchedule()`の依存関数をテスト
8. **`testOnFormSubmit()`**: `onFormSubmit()`をモックイベントでテスト

---

## テスト実行方法

### 方法1: 統合テスト関数を実行（推奨）

```
testAllFormFunctions()
```

すべてのフォーム側関数を一度にテストします。

### 方法2: 個別テスト関数を実行

各テスト関数を個別に実行できます。

例:
```
testGetScheduledCourses()
testOpenSourceSpreadsheet()
testUpdateAttendeeStatus()
```

---

## 注意事項

1. **フォーム再構築の注意**: `testAutoRebuildFormOnSchedule()`はフォームを再構築しませんが、`rebuildTrainingForm()`を直接実行するとフォームが再構築されます。

2. **データ依存**: 一部のテスト関数は実際のデータ（予約一覧シートのデータなど）が必要です。

3. **モックイベント**: `testOnFormSubmit()`はモックイベントを使用しますが、実際のフォーム送信イベントとは異なる場合があります。

---

## トラブルシューティング

### エラー: "Utils ライブラリが読み込まれていません"

**原因**: `LMSUtils.gs`ライブラリがフォーム側プロジェクトに追加されていません。

**解決策**:
1. Apps Scriptエディタで「ライブラリ」をクリック
2. 「ライブラリを追加」をクリック
3. ライブラリID `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ` を入力
4. 「追加」をクリック

### エラー: "スプレッドシートが取得できませんでした"

**原因**: スクリプトプロパティに`SPREADSHEET_ID`または`SPREADSHEET_URL`が設定されていません。

**解決策**:
1. Apps Scriptエディタで「プロジェクトの設定」→「スクリプトプロパティ」を開く
2. `SPREADSHEET_ID`または`SPREADSHEET_URL`を追加
3. 値: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`（スプレッドシートID）

---

## 次のステップ

1. フォーム側プロジェクトに`form_tests.gs`を追加
2. `testAllFormFunctions()`を実行
3. 実行ログを確認して、エラーがあれば修正
4. すべてのテストが成功したら、カバレッジ100%達成

---

## 参考

- フォーム側プロジェクトID: `1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`
- フォームURL: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit
- スプレッドシートID: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`
- LMSUtilsライブラリID: `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ`






