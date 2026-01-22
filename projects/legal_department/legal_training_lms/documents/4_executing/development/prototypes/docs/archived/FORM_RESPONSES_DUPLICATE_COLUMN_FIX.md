# Form Responses 列名重複エラー解決ガイド

**最終更新**: 2025年12月26日

---

## 🔴 エラー内容

**エラーメッセージ**: `無効: 列名が重複しています`  
**発生場所**: Form Responses 6（フォーム回答シート）

---

## 🔍 原因

Googleフォームの回答シート（Form Responses）で、**同じタイトルの質問が複数存在**している場合に発生します。

### 考えられる原因

1. **フォームが複数回再構築された**
   - `rebuildTrainingForm()`が複数回実行され、古い質問が残っている
   - `clearAllItems()`が正しく動作していない

2. **古いForm Responsesシートが残っている**
   - フォームを再構築するたびに新しいForm Responsesシートが作成される
   - 古いシートに同じ列名が残っている

3. **質問タイトルが重複している**
   - 各グループごとに作成される質問のタイトルが同じ
   - ただし、現在のコードでは`${groupName} の研修枠を選択してください`となっており、グループ名が異なれば重複しないはず

---

## ✅ 解決方法

### 方法1: フォームを完全にクリアして再構築（推奨）

1. **フォームを開く**
   - URL: `https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit`

2. **手動で質問をすべて削除**
   - フォームエディタで、すべての質問を手動で削除
   - セクションヘッダーやページブレークも含めて削除

3. **Apps Scriptエディタで`rebuildTrainingForm()`を実行**
   - 関数選択ドロップダウンから`rebuildTrainingForm`を選択
   - 「実行」ボタンをクリック

4. **実行ログを確認**
   - エラーがないか確認
   - `✅ 2ステップフォームの構築が完了しました`と表示されれば成功

---

### 方法2: 古いForm Responsesシートを削除

1. **スプレッドシートを開く**
   - フォームの回答先スプレッドシートを開く

2. **古いForm Responsesシートを確認**
   - 「Form Responses 1」「Form Responses 2」...「Form Responses 6」などのシートが存在するか確認

3. **古いシートを削除**
   - 「Form Responses 6」より古いシート（1〜5）を削除
   - または、すべてのForm Responsesシートを削除して、フォームを再構築

4. **フォームを再構築**
   - `rebuildTrainingForm()`を実行すると、新しいForm Responsesシートが作成される

---

### 方法3: コードを修正して質問タイトルを一意にする

現在のコードでは、各グループごとに質問を作成していますが、タイトルにグループ名が含まれているため、理論的には重複しません。

ただし、念のため、質問タイトルをより明確に一意にする修正を追加できます：

```javascript
// form.gs の buildTwoStepForm() 関数内（421行目付近）
const question = form
  .addMultipleChoiceItem()
  .setTitle(`${groupName} の研修枠を選択してください [${groupName}]`)  // グループ名を追加
  .setRequired(groupSessions.length > 0);
```

**注意**: この修正は、フォームの見た目に影響します。ユーザーには「1期生 の研修枠を選択してください [1期生]」のように表示されます。

---

## 🔧 トラブルシューティング

### 問題1: `clearAllItems()`が正しく動作していない

**確認方法**:
1. `rebuildTrainingForm()`を実行する前に、フォームの質問数を確認
2. 実行後、質問がすべて削除されているか確認

**解決方法**:
- `clearAllItems()`関数にログを追加して、削除処理を確認
- 手動で質問を削除してから`rebuildTrainingForm()`を実行

### 問題2: フォームを再構築してもエラーが続く

**確認方法**:
1. フォームの質問タイトルを確認
2. 同じタイトルの質問が複数ないか確認

**解決方法**:
1. フォームを完全にクリア（方法1を参照）
2. 古いForm Responsesシートを削除（方法2を参照）
3. `rebuildTrainingForm()`を再実行

### 問題3: Form Responsesシートが複数作成される

**原因**:
- フォームの回答先スプレッドシートが変更された
- フォームが複数回再構築された

**解決方法**:
1. 不要なForm Responsesシートを削除
2. フォームの設定で回答先スプレッドシートを確認
3. `configureFormMeta()`関数で`setDestination()`が正しく設定されているか確認

---

## 📝 予防策

### 1. `clearAllItems()`の改善

`clearAllItems()`関数にログを追加して、削除処理を確認できるようにする：

```javascript
function clearAllItems(form) {
  resetFormNavigation(form);
  const items = form.getItems();
  Logger.log(`clearAllItems: ${items.length}個のアイテムを削除します`);
  
  for (let i = items.length - 1; i >= 0; i--) {
    try {
      const itemTitle = items[i].getTitle();
      form.deleteItem(items[i]);
      Logger.log(`  ✅ 削除: ${itemTitle}`);
    } catch (error) {
      Logger.log(`  ❌ 削除失敗 (${items[i].getId()}): ${error}`);
    }
  }
  
  Logger.log(`clearAllItems: 完了。残りのアイテム数: ${form.getItems().length}`);
}
```

### 2. 質問タイトルの一意性チェック

`buildTwoStepForm()`関数で、質問タイトルが重複していないかチェック：

```javascript
const existingTitles = new Set();
groups.forEach((groupName) => {
  const title = `${groupName} の研修枠を選択してください`;
  
  if (existingTitles.has(title)) {
    Logger.log(`⚠️ 警告: 重複するタイトルが検出されました: ${title}`);
    // タイトルにインデックスを追加
    title = `${title} [${groupName}]`;
  }
  
  existingTitles.add(title);
  
  const question = form
    .addMultipleChoiceItem()
    .setTitle(title)
    .setRequired(groupSessions.length > 0);
  // ...
});
```

### 3. フォーム再構築前の確認

`rebuildTrainingForm()`関数の最初に、既存の質問を確認：

```javascript
function rebuildTrainingForm() {
  try {
    Logger.log('=== rebuildTrainingForm: 開始 ===');
    
    const form = FormApp.getActiveForm();
    const existingItems = form.getItems();
    Logger.log(`既存のアイテム数: ${existingItems.length}`);
    
    if (existingItems.length > 0) {
      Logger.log('既存のアイテムタイトル:');
      existingItems.forEach((item, index) => {
        Logger.log(`  ${index + 1}. ${item.getTitle()}`);
      });
    }
    
    // 以下、既存の処理...
  }
}
```

---

## 📚 関連ドキュメント

- **`FORM_SIDE_TEST_SETUP.md`** - フォーム側テスト設定ガイド
- **`DEVELOPMENT_WORKFLOW.md`** - 開発ワークフロー
- **`FUNCTION_LIST.md`** - 関数一覧

---

## 🔗 関連コード

- **`form.gs`** - `rebuildTrainingForm()`関数（70行目）
- **`form.gs`** - `buildTwoStepForm()`関数（338行目）
- **`form.gs`** - `clearAllItems()`関数（286行目）

---

**作成者**: プロダクト企画チーム  
**最終更新**: 2025年12月26日

