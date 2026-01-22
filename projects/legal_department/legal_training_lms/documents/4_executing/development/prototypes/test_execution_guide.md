# rebuildTrainingFormテスト実行ガイド

## 実行手順

### 1. testRebuildDependencies()を実行

1. Apps Scriptエディタを開く
   - URL: https://script.google.com/u/0/home/projects/1lGAGi8GO625JPsXhyWEY0M_TlJeaxBGCf1n4YkX92vkgWxJnEQFrd7LL/edit

2. 関数選択ドロップダウンから`testRebuildDependencies`を選択

3. 「実行」ボタンをクリック

4. 実行ログパネルを開いてログを確認
   - 特に以下を確認：
     - `getFormGroups()`がグループを返しているか
     - `getScheduledCourses()`が研修枠を返しているか
     - `getFormConfiguration().steps[0].items`に`GROUP_SELECT`タイプのアイテムがあるか

### 2. rebuildTrainingForm()を実行

1. 関数選択ドロップダウンから`rebuildTrainingForm`を選択

2. 「実行」ボタンをクリック

3. 実行ログパネルで詳細なログを確認

4. エラーが発生した場合は、エラーメッセージとスタックトレースを確認

### 3. フォームの状態を確認

1. フォームに戻る
   - URL: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit

2. 質問項目が生成されているか確認

## 考えられる問題の原因

1. `getFormGroups()`が空の配列を返している
2. `getScheduledCourses()`が空の配列を返している
3. `getFormConfiguration().steps[0].items`に`GROUP_SELECT`タイプのアイテムがない
4. `openSourceSpreadsheet()`が失敗している
