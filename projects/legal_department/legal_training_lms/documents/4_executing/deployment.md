# 法務研修LMS - デプロイ手順書

## 📋 概要

このドキュメントは、法務研修LMSシステムをGoogle Apps Scriptにデプロイする手順を説明します。

---

## 🚀 デプロイ前提条件

### 必須要件
- ✅ Google Workspaceアカウント
- ✅ 管理者権限
- ✅ Google Cloud Platformプロジェクト（オプション：Phase2以降）

### 必要な権限
- Google Apps Scriptの作成・編集権限
- Google Sheetsの作成・編集権限
- Google Driveへのアクセス権限

---

## 📝 Phase 1: 基盤構築デプロイ手順

### Step 1: Google Sheetsの作成

1. **新しいスプレッドシートを作成**
   ```
   名前: 法務研修LMS_マスターデータ
   ```

2. **必要なシートを作成**
   - `courses`（研修コース）
   - `participants`（受講者）
   - `sessions`（セッション）
   - `reservations`（予約）
   - `attendance`（出席記録）
   - `config`（設定）

3. **スプレッドシートIDを記録**
   ```
   URL: https://docs.google.com/spreadsheets/d/【ここがID】/edit
   ```

### Step 2: Google Apps Scriptプロジェクトの作成

1. **Apps Scriptを開く**
   - https://script.google.com/ にアクセス
   - 「新しいプロジェクト」をクリック

2. **プロジェクト名を設定**
   ```
   プロジェクト名: 法務研修LMS
   ```

3. **ファイルをアップロード**
   - `Code.gs` - メインコード
   - `Home.html` - ホームページ
   - `Courses.html` - コース一覧
   - `Reservation.html` - 予約ページ
   - `MyPage.html` - マイページ
   - `Admin.html` - 管理者ページ
   - `Header.html` - ヘッダー
   - `Footer.html` - フッター
   - `Stylesheet.html` - スタイルシート

### Step 3: Google APIの有効化（個人プロジェクト）

**推奨方法**: 個人のGoogle CloudプロジェクトでAPIを有効化します。

1. **Google Cloud Consoleにアクセス**
   - URL: https://console.cloud.google.com/

2. **個人プロジェクトを選択（または新規作成）**
   - 既存のプロジェクト（例: `ppap00`）を選択
   - または、新しいプロジェクトを作成

3. **必要なAPIを有効化**
   - 「APIとサービス」→「ライブラリ」をクリック
   - 以下のAPIを検索して「有効にする」：
     - ✅ **Google Sheets API**
     - ✅ **Google Forms API**
     - ✅ **Google Calendar API**
     - ✅ **Google Drive API**

**メリット**: 
- ✅ 個人で管理しやすい
- ✅ 管理者の承認が不要
- ✅ すぐに利用開始できる

**注意**: 
- 個人プロジェクトでAPIを有効化することで、すぐに利用開始できます
- 組織全体でAPIを共有利用する場合は、Google Workspace管理者との相談が必要です

**詳細手順**: [Google API有効化手順](development/GOOGLE_API_SETUP.md)を参照

### Step 4: スクリプトプロパティの設定

1. **プロジェクト設定を開く**
   - 左メニュー「プロジェクトの設定」（⚙️）をクリック

2. **スクリプトプロパティを追加**
   ```
   SPREADSHEET_ID = [Step 1で記録したスプレッドシートID]
   ```
   
   **オプション設定（Slack通知を使用する場合）**:
   
   **テスト環境**:
   ```
   SLACK_WEBHOOK_URL = [テスト用Webhook URL]
   SLACK_CHANNEL = #bpi-solution-public
   SLACK_CHANNEL_ID = C068DD0619D  # テスト用
   SLACK_USERNAME = Googleセミナー・個別面談申込通知bot
   ```
   
   **本番環境**（デプロイ時に更新）:
   ```
   SLACK_WEBHOOK_URL = [本番用Webhook URL]
   SLACK_CHANNEL = [本番チャンネル名]
   SLACK_CHANNEL_ID = [本番チャンネルID]  # スプレッドシートの「グループ一覧」シート参照
   SLACK_CHANNEL_ID_1期生 = [1期生用Slack ID]  # スプレッドシート参照
   SLACK_CHANNEL_ID_2期生 = [2期生用Slack ID]  # スプレッドシート参照
   SLACK_CHANNEL_ID_3期生 = [3期生用Slack ID]  # スプレッドシート参照
   SLACK_USERNAME = Googleセミナー・個別面談申込通知bot
   ```
   
   **本番環境のSlack ID取得方法**:
   1. [アベンジャーズ_継続研修スプレッドシート](https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit?gid=1568150033#gid=1568150033) にアクセス
   2. 「グループ一覧」シートを開く
   3. 「SlackチャンネルID」列から各グループのSlack IDを確認
   4. 上記のスクリプトプロパティに設定

### Step 5: Webアプリとしてデプロイ

1. **デプロイ準備**
   - 右上の「デプロイ」→「新しいデプロイ」をクリック

2. **デプロイ設定**
   ```
   説明: Phase 1 - 基盤構築
   次のユーザーとして実行: 自分
   アクセスできるユーザー: 組織内の全員
   ```

3. **デプロイ実行**
   - 「デプロイ」ボタンをクリック
   - 承認プロセスを完了

4. **WebアプリのURLを記録**
   ```
   URL: https://script.google.com/macros/s/【デプロイID】/exec
   ```

**clasp を利用する場合**:
- `development/prototypes` ディレクトリに移動し、`./scripts/deploy.sh` を実行すると、`clasp push` と `clasp deploy` が実行され、Webアプリとしてデプロイされます。
- 初回または「デプロイ」種類が未設定の場合は、Apps Script エディタで「デプロイ」→「新しいデプロイ」→「種類の選択」→「Web アプリ」を選択してデプロイを作成してください。以降は `deploy.sh` で更新デプロイが可能です。

### Step 5: 初期データの投入

1. **研修コースの登録**
   - スプレッドシートの`courses`シートに移動
   - サンプルデータを入力：

   | id | name | description | group_id | max_participants | start_date | end_date | status |
   |---|---|---|---|---|---|---|---|
   | course-001 | 法務基礎研修 | 法務の基礎知識を学ぶ | 1 | 50 | 2025-11-01 | 2025-12-31 | active |
   | course-002 | 法務基礎研修 | 法務の基礎知識を学ぶ | 2 | 50 | 2025-11-01 | 2025-12-31 | active |
   | course-003 | 法務基礎研修 | 法務の基礎知識を学ぶ | 3 | 50 | 2025-11-01 | 2025-12-31 | active |

2. **セッションの登録**
   - `sessions`シートにサンプルデータを入力

3. **テスト用受講者の登録**
   - `participants`シートに自分のメールアドレスを登録

### Step 6: 動作確認

1. **Webアプリにアクセス**
   - Step 4で記録したURLにアクセス

2. **各ページの確認**
   - ✅ ホームページが表示される
   - ✅ 研修コース一覧が表示される
   - ✅ 予約ページが表示される
   - ✅ マイページが表示される

3. **基本機能の確認**
   - ✅ 研修コースを選択できる
   - ✅ セッションを選択できる
   - ✅ 予約ボタンをクリックできる

---

## 🔧 トラブルシューティング

### エラー: "スクリプトが見つかりません"
**原因**: デプロイ設定が正しくない
**解決策**: 
1. デプロイ設定を確認
2. 「アクセスできるユーザー」が正しく設定されているか確認

### エラー: "スプレッドシートにアクセスできません"
**原因**: スプレッドシートIDが正しくない
**解決策**:
1. スクリプトプロパティの`SPREADSHEET_ID`を確認
2. スプレッドシートの共有設定を確認

### エラー: "認証エラー"
**原因**: Google認証が完了していない
**解決策**:
1. Apps Scriptの承認プロセスを完了
2. 必要な権限を許可

---

## 📊 Phase 2以降のデプロイ（予定）

### Phase 2: コア機能実装
- Google Calendar API連携
- Gmail API連携（通知機能）
- Google Cloud SQL構築

### Phase 3: 管理機能・最適化
- ダッシュボード機能の有効化
- レポート生成機能
- パフォーマンス最適化

### Phase 4: 本番運用開始
- 受講者への利用案内
- 運用監視体制の確立
- サポート体制の整備

---

## 🔒 セキュリティチェックリスト

- [ ] スクリプトプロパティに機密情報を保存している
- [ ] アクセス権限が適切に設定されている
- [ ] 管理者機能が適切に制限されている
- [ ] データバックアップが設定されている

---

## 📞 サポート

問題が発生した場合は、以下に連絡してください：
- **開発チーム**: プロダクト企画チーム
- **Slackチャンネル**: #法務研修lms-support

---

**最終更新日**: 2025-10-16  
**バージョン**: 1.0.0  
**Phase**: Phase 1 - 基盤構築

