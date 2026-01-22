# サブリース物件申込通知スクリプト

## 概要

Googleスプレッドシートに申込が入った場合、サブリース物件（STATUS=申込 かつ CURRENT_SITUATION=サブリース中）のみSlack通知を送信するGoogle Apps Scriptです。

## 機能

- 15分おきにスプレッドシートを自動チェック（時間ベーストリガー）
- STATUSが「申込」かつCURRENT_SITUATIONが「サブリース中」の物件のみ通知
- ORDERED_DATE_FROM_NOTIFICATIONが昨日以降のデータのみ対象
- 重複通知防止（CONTRACT_IDベースで最終処理IDを保存）
- 通知内容:
  - 物件名（BUILDING_NAME + ROOM_NUMBER）
  - 契約予定日（CLOSED_DATE、YYYY-MM-DD形式）
  - SUPPLIER ARTICLE IDをURL形式で変換（https://supplier.ga-tech.co.jp/articles/{ID}/）
  - RENTAL_CONTRACT_TYPE（賃貸契約種別）
- **新機能**: 通知後、Slackの特定チャンネルから物件名・建物名・部屋番号で検索し、検索結果をスレッドに自動投稿

## 対象スプレッドシート

- **スプレッドシートID**: `1JrKqewme3RwAYYb3ESWD6Oh_dGu8F769wcWowQaFXIo`
- **URL**: https://docs.google.com/spreadsheets/d/1JrKqewme3RwAYYb3ESWD6Oh_dGu8F769wcWowQaFXIo/edit
- **データシート**: `import_from_torocco`（ID: 0）
- **設定シート**: `var`（最終CONTRACT_IDをB2セルに保存）

## Google Apps Scriptプロジェクト

- **プロジェクトID**: `1aZhf5mx0jJUEm97sTZbycOpH65j-zCGFX3TqGEGX0m5eTZgyUAHmDgcP`
- **URL**: https://script.google.com/u/0/home/projects/1aZhf5mx0jJUEm97sTZbycOpH65j-zCGFX3TqGEGX0m5eTZgyUAHmDgcP/edit

## 設定手順

### 1. スクリプトのデプロイ

`clasp`を使用してデプロイする場合：

```bash
cd development/gas_automation
clasp push --force
```

または、Google Apps Scriptエディタに直接コピー&ペースト：

1. `notify_sublease_application.gs` の内容をコピー
2. Apps Scriptエディタに貼り付け
3. 保存（Ctrl+S / Cmd+S）

### 2. Slack Webhook URLの設定

1. SlackでWebhookアプリを作成
   - https://api.slack.com/apps にアクセス
   - 「Create New App」→「From scratch」を選択
   - アプリ名を入力（例: 「サブリース物件通知」）
   - ワークスペースを選択
   - 「Incoming Webhooks」を有効化
   - 「Add New Webhook to Workspace」をクリック
   - チャンネルを選択
   - Webhook URLをコピー

2. Apps Scriptでスクリプトプロパティを設定
   - Apps Scriptエディタで「プロジェクトの設定」（⚙️）をクリック
   - 「スクリプトプロパティ」タブを開く
   - 以下のプロパティを追加:
   
   **必須設定**:
   - **プロパティ**: `SLACK_WEBHOOK_URL`
     - **値**: コピーしたWebhook URL
   
   **スレッド機能用設定**（オプション）:
   - **プロパティ**: `SLACK_BOT_TOKEN`
     - **値**: Slack Bot Token（`xoxb-`で始まる）
     - 取得方法: https://api.slack.com/apps → アプリを選択 → 「OAuth & Permissions」→「Bot User OAuth Token」をコピー
   - **プロパティ**: `SLACK_CHANNEL_ID`
     - **値**: 通知先チャンネルID（例: `C08V2C9HGKF`）
     - 取得方法: Slackでチャンネルを開く → チャンネル名を右クリック → 「チャンネルの詳細を表示」→ チャンネルIDをコピー
   - **プロパティ**: `SLACK_SEARCH_CHANNEL_ID`（オプション）
     - **値**: 検索対象チャンネルID（未設定の場合は通知先チャンネルを検索）
   
   - 「保存」をクリック

### 3. 権限の承認

1. Apps Scriptエディタで `testManualExecution` 関数を選択
2. 「実行」ボタンをクリック
3. 権限の承認を求められたら「権限を確認」をクリック
4. Googleアカウントを選択
5. 「詳細」→「[プロジェクト名]（安全ではないページ）に移動」をクリック
6. 「許可」をクリック

### 4. トリガーの設定

1. Apps Scriptエディタで `setupTimeBasedTrigger` 関数を選択
2. 「実行」ボタンをクリック
3. 実行ログで「✅ 15分おきのトリガーを設定しました」と表示されれば成功

**確認方法**:
- Apps Scriptエディタで「トリガー」（時計アイコン）をクリック
- `checkNewSubleaseApplicationsPeriodically` トリガーが表示されていれば設定済みです

### 5. varシートの確認

- スプレッドシートに `var` シートが自動的に作成されます
- B2セルに最終処理したCONTRACT_IDが保存されます
- 初回実行時は空欄のままです

### 6. 通知チャンネルの変更方法

別のチャンネルに通知を送りたい場合は、以下の手順で変更できます：

1. **新しいチャンネル用のWebhook URLを取得**
   - https://api.slack.com/apps にアクセス
   - 既存のアプリを選択（または新規作成）
   - 「Incoming Webhooks」を開く
   - 「Add New Webhook to Workspace」をクリック
   - **新しいチャンネルを選択**
   - Webhook URLをコピー

2. **スクリプトプロパティを更新**
   - Apps Scriptエディタで「プロジェクトの設定」（⚙️）をクリック
   - 「スクリプトプロパティ」タブを開く
   - `SLACK_WEBHOOK_URL` の値を新しいWebhook URLに更新
   - 必要に応じて `SLACK_CHANNEL_ID` も新しいチャンネルIDに更新
     - チャンネルIDの取得方法: Slackでチャンネルを開く → チャンネル名を右クリック → 「チャンネルの詳細を表示」→ チャンネルIDをコピー
   - 「保存」をクリック

3. **動作確認**
   - `testManualExecution()` 関数を実行して、新しいチャンネルに通知が送信されることを確認

**注意**: Webhook URLはチャンネルごとに異なります。別チャンネルに通知を送るには、そのチャンネル用のWebhook URLを設定する必要があります。

## 関数一覧

### メイン関数

- **`checkNewSubleaseApplicationsPeriodically()`**: 15分おきに実行されるメイン関数（トリガー用）
- **`testManualExecution()`**: 手動実行用のテスト関数（テスト用Webhook URLを使用）

### 内部関数

- **`checkNewSubleaseApplicationsPeriodicallyWithWebhook(webhookUrl)`**: 指定されたWebhook URLで定期チェックを実行
- **`checkNewSubleaseApplicationsPeriodicallyWithWebhookInternal(webhookUrl, isTest)`**: 内部実装
- **`checkNewSubleaseApplicationsPeriodicallyWithWebhookInternalWithStartId(webhookUrl, isTest, startContractId)`**: 開始CONTRACT_ID指定版

### 通知関数

- **`sendSubleaseNotificationWithWebhook(rowData, sheet, rowNumber, webhookUrl)`**: サブリース物件の通知を送信
- **`createSlackMessage(propertyName, closedDate, supplierUrl, rentalContractType)`**: Slackメッセージを作成
- **`sendSlackNotificationWithUrl(message, webhookUrl)`**: Slackに通知を送信（Webhook使用）

### スレッド機能関数（新規追加）

- **`sendSlackMessageWithAPI(message, propertyName)`**: Slack Web APIでメッセージを送信し、スレッドIDを取得
- **`searchAndPostToThread(propertyName, buildingName, roomNumber, threadTs)`**: Slackの特定チャンネルからデータを検索してスレッドに投稿
- **`createSearchResultMessage(matches, keywords)`**: 検索結果メッセージを作成
- **`postToThread(message, channelId, threadTs, botToken)`**: スレッドにメッセージを投稿

### ヘルパー関数

- **`getColumnValue(rowData, columnName, sheet)`**: 列名から値を取得
- **`formatDate(dateValue)`**: 日付をフォーマット（YYYY-MM-DD形式）

### トリガー管理関数

- **`setupTimeBasedTrigger()`**: 15分おきの時間ベーストリガーを設定
- **`deleteTimeBasedTrigger()`**: 時間ベーストリガーを削除

## 通知条件

以下の条件をすべて満たすデータのみ通知されます：

1. **CONTRACT_ID**: 前回実行時の最終CONTRACT_IDより大きい
2. **ORDERED_DATE_FROM_NOTIFICATION**: 昨日以降の日付
3. **STATUS**: 「申込」
4. **CURRENT_SITUATION**: 「サブリース中」

## 列名の対応

スクリプトは以下の列名のバリエーションに対応しています：

- **CONTRACT_ID**: `CONTRACT_ID`、`Contract ID`、`contract_id`、`CONTRACT ID`
- **BUILDING_NAME**: `BUILDING_NAME`
- **ROOM_NUMBER**: `ROOM_NUMBER`
- **CLOSED_DATE**: `CLOSED_DATE`、`契約予定日`
- **ORDERED_DATE_FROM_NOTIFICATION**: `ORDERED_DATE_FROM_NOTIFICATION`
- **STATUS**: `STATUS`
- **CURRENT_SITUATION**: `CURRENT_SITUATION`
- **SUPPLIER_ARTICLE_ID**: `SUPPLIER_ARTICLE_ID`、`SUPPLIER ARTICLE ID`
- **RENTAL_CONTRACT_TYPE**: `RENTAL_CONTRACT_TYPE`、`賃貸契約種別`

## 動作の仕組み

1. **定期チェック**: 15分おきに自動実行
2. **データ取得**: `import_from_torocco`シートから最大1000行を取得
3. **フィルタリング**: 
   - CONTRACT_IDが最終IDより大きい
   - ORDERED_DATE_FROM_NOTIFICATIONが昨日以降
   - STATUS=「申込」かつCURRENT_SITUATION=「サブリース中」
4. **通知送信**: 条件を満たすデータをSlackに通知
5. **最終ID更新**: 処理した最大CONTRACT_IDを`var`シートのB2セルに保存

## トラブルシューティング

### 通知が送信されない場合

1. **設定確認**
   - `testManualExecution()` 関数を実行して、Webhook URLが設定されているか確認
   - 実行ログでエラーメッセージを確認

2. **トリガー確認**
   - Apps Scriptエディタで「トリガー」（時計アイコン）をクリック
   - `checkNewSubleaseApplicationsPeriodically` トリガーが設定されているか確認

3. **ログ確認**
   - Apps Scriptエディタで「実行ログ」を確認
   - デバッグログで以下を確認:
     - 前回の最終CONTRACT_ID
     - チェック対象行数
     - フィルタリング詳細（各条件でスキップされた件数）
     - 処理したCONTRACT_ID範囲

4. **データ確認**
   - スプレッドシートの`import_from_torocco`シートを確認
   - 通知条件を満たすデータが存在するか確認
   - `var`シートのB2セルに最終CONTRACT_IDが正しく保存されているか確認

### テスト実行

手動でテストする場合：

1. `testManualExecution()` 関数を選択
2. 「実行」ボタンをクリック
3. 実行ログで結果を確認
4. テスト用Webhook URLで通知が送信されることを確認

## 注意事項

- **ImportRange**: スプレッドシートが`ImportRange`を使用しているため、`onEdit`トリガーでは動作しません。時間ベーストリガー（15分おき）を使用しています
- **CONTRACT_IDの並び順**: CONTRACT_IDは降順で並んでいない可能性があるため、全ての行をチェックします
- **パフォーマンス**: 最大1000行までチェックするため、大量のデータがある場合は処理時間が長くなる可能性があります
- **セキュリティ**: Slack Webhook URLとBot Tokenは機密情報のため、スクリプトプロパティで管理してください
- **重複通知防止**: CONTRACT_IDベースで重複通知を防止していますが、同じCONTRACT_IDが複数回出現する場合は注意が必要です
- **スレッド機能**: Bot Tokenが設定されていない場合、Webhook通知のみ送信され、スレッド機能はスキップされます
- **Slack API権限**: Bot Tokenには以下のスコープが必要です:
  - `chat:write` - メッセージ送信
  - `search:read` - メッセージ検索
  - `channels:read` - チャンネル情報取得（検索チャンネル指定時）

## 更新履歴

- 2025-12-02: 本番稼働版
  - STATUS条件を「成約」から「申込」に変更
  - CONTRACT_IDが降順でない場合にも対応
  - デバッグログの追加
  - テスト関数の削除（本番用のみ）
- 2025-12-02: スレッド機能追加
  - Slack Web APIを使用したスレッド投稿機能を追加
  - 通知後、特定チャンネルから物件情報を検索してスレッドに自動投稿
  - 検索キーワード: 物件名、建物名、部屋番号
  - 検索結果は最大5件まで表示


