# Slack App設定手順書

**作成日**: 2025-12-26  
**対象**: 3グループ分のSlack App追加作業

---

## 📋 概要

この手順書では、法務研修LMSシステムで使用するSlack通知機能の設定方法を説明します。

## 🎯 目的

- 各グループ（1期生、2期生、3期生）のSlackチャンネルにIncoming Webhookアプリを追加
- グループ別のリマインド通知を送信できるようにする

## 📝 事前準備

### 確認事項

1. **グループ構成の確認**
   - 1期生: 143名
   - 2期生: 203名
   - 3期生: 1名

2. **Slackチャンネルの確認**
   - 各グループのSlackチャンネルが存在することを確認
   - チャンネルIDを確認（スプレッドシートの「グループ一覧」シート参照）

3. **スプレッドシートの確認**
   - [アベンジャーズ_継続研修スプレッドシート](https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit?gid=1568150033#gid=1568150033)
   - 「グループ一覧」シートの「SlackチャンネルID」列を確認

## 🔧 設定手順

### Step 1: Slackワークスペースにログイン

1. Slackワークスペースにログイン
2. 各グループのチャンネルにアクセスできることを確認

### Step 2: 各グループのチャンネルにIncoming Webhookを追加

#### 2.1 1期生チャンネルの設定

1. **1期生チャンネルを開く**

2. **チャンネル設定を開く**
   - チャンネル名の横の「⚙️」アイコンをクリック
   - 「統合」→「アプリを追加」を選択

3. **Incoming Webhookを検索**
   - 検索バーに「Incoming Webhook」と入力
   - 「Incoming Webhook」を選択

4. **アプリを追加**
   - 「追加」をクリック
   - 「設定」をクリック

5. **Webhook URLをコピー**
   - 生成されたWebhook URLをコピー
   - メモ帳などに保存

6. **チャンネルIDを確認**
   - チャンネル設定の「詳細」タブからチャンネルIDを確認
   - または、スプレッドシートの「グループ一覧」シートから確認

#### 2.2 2期生チャンネルの設定

1. **2期生チャンネルを開く**

2. **同様の手順でIncoming Webhookを追加**
   - Step 2.1と同じ手順を実行

3. **Webhook URLとチャンネルIDを記録**

#### 2.3 3期生チャンネルの設定

1. **3期生チャンネルを開く**

2. **同様の手順でIncoming Webhookを追加**
   - Step 2.1と同じ手順を実行

3. **Webhook URLとチャンネルIDを記録**

### Step 3: Google Apps Scriptのスクリプトプロパティを設定

1. **Apps Scriptエディタを開く**
   ```
   https://script.google.com/d/1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-/edit
   ```

2. **プロジェクトの設定を開く**
   - 左メニューの「プロジェクトの設定」（⚙️）をクリック

3. **スクリプトプロパティを追加**
   - 「スクリプトプロパティ」セクションで以下を追加：

   ```
   SLACK_WEBHOOK_URL_1期生 = [1期生用Webhook URL]
   SLACK_WEBHOOK_URL_2期生 = [2期生用Webhook URL]
   SLACK_WEBHOOK_URL_3期生 = [3期生用Webhook URL]
   SLACK_CHANNEL_ID_1期生 = [1期生用チャンネルID]
   SLACK_CHANNEL_ID_2期生 = [2期生用チャンネルID]
   SLACK_CHANNEL_ID_3期生 = [3期生用チャンネルID]
   ```

4. **保存**
   - 「保存」をクリック

### Step 4: コードの確認

1. **handlers.gsを確認**
   - `onDashboardAction()`関数がグループ別にSlack通知を送信できるか確認

2. **LMSUtils.gsを確認**
   - `getSlackWebhookUrl()`関数がグループ別のWebhook URLを取得できるか確認

### Step 5: テスト実行

1. **テスト用のリマインド通知を送信**
   - ダッシュボードシートで各グループのリマインドボタンをクリック
   - または、Apps Scriptエディタで`onDashboardAction()`を直接実行

2. **各グループのSlackチャンネルで通知を確認**
   - 1期生チャンネルに通知が届くか確認
   - 2期生チャンネルに通知が届くか確認
   - 3期生チャンネルに通知が届くか確認

## ⚠️ 注意事項

### Webhook URLの管理

- Webhook URLは機密情報です。共有しないでください
- Webhook URLが漏洩した場合は、すぐに再生成してください

### チャンネルIDの取得方法

1. **Slackアプリから取得**
   - チャンネル設定の「詳細」タブから確認

2. **スプレッドシートから取得**
   - [アベンジャーズ_継続研修スプレッドシート](https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit?gid=1568150033#gid=1568150033)
   - 「グループ一覧」シートの「SlackチャンネルID」列を確認

### テスト実行時の注意

- テスト実行時は、実際のチャンネルではなくテスト用チャンネルを使用することを推奨
- または、通知を無効化してテスト実行

## 🔍 トラブルシューティング

### Q: Webhook URLが取得できない

**A**: 以下の点を確認してください：

1. Slackワークスペースの管理者権限があるか確認
2. チャンネルの設定で「アプリを追加」が有効になっているか確認
3. Incoming Webhookアプリがワークスペースにインストールされているか確認

### Q: 通知が届かない

**A**: 以下の点を確認してください：

1. Webhook URLが正しく設定されているか確認
2. チャンネルIDが正しく設定されているか確認
3. 実行ログにエラーメッセージがないか確認
4. Slackチャンネルの通知設定を確認

### Q: グループ別に通知が送信されない

**A**: 以下の点を確認してください：

1. `handlers.gs`の`onDashboardAction()`がグループ別のWebhook URLを取得しているか確認
2. `LMSUtils.gs`の`getSlackWebhookUrl()`がグループ名に応じて正しいURLを返しているか確認

## 📊 設定確認チェックリスト

- [ ] 1期生チャンネルにIncoming Webhookを追加
- [ ] 2期生チャンネルにIncoming Webhookを追加
- [ ] 3期生チャンネルにIncoming Webhookを追加
- [ ] 各グループのWebhook URLを取得
- [ ] 各グループのチャンネルIDを取得
- [ ] スクリプトプロパティに設定
- [ ] 1期生のリマインド通知をテスト送信
- [ ] 2期生のリマインド通知をテスト送信
- [ ] 3期生のリマインド通知をテスト送信

## 🔗 関連ドキュメント

- [Slack設定情報](SLACK_CONFIG.md)
- [利用開始準備タスク](../../利用開始準備タスク.md)
- [handlers.gs](../handlers.gs)
- [LMSUtils.gs](../LMSUtils.gs)

---

**作成者**: プロダクト企画チーム  
**最終更新**: 2025-12-26



