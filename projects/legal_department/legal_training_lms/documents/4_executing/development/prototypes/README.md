# Prototypes - 法務研修LMS

**プロジェクト**: 法務研修LMSシステム  
**作成日**: 2025-11-14  
**最終更新**: 2025-11-19（メールアドレス更新機能追加・デプロイ完了）

---

## 📋 概要

このディレクトリには、Google Driveフォルダ（`LMS`）から取得したプロトタイプコードとデータが含まれています。

**Google Driveフォルダ**: https://drive.google.com/drive/folders/1rpazwIC2lqTig9reMsG9Akgx-eOgHX-e

---

## 📁 機能一覧（関数名ベース）

### フォーム関連機能

#### `rebuildTrainingForm()`（`form.gs`）
- **説明**: 研修参加フォームを2ステップ構成で再生成する
- **機能**: スプレッドシートの「予約一覧」をソースとして候補日を作成し、フォームを再構築
- **実行タイミング**: 手動実行、または自動トリガー（`autoRebuildFormOnSchedule()`）

#### `onFormSubmit()`（`form.gs`）
- **説明**: フォーム送信時に呼ばれる関数
- **機能**: 選択されたイベントへ回答者をゲスト追加し、参加情報を更新
- **実行タイミング**: フォーム送信時（自動トリガー）

### スプレッドシート・カレンダー連携機能

#### `onCreatingSchedule()`（`sheet.gs`）
- **説明**: 予約一覧シート編集時にカレンダーイベントを作成する
- **機能**: スプレッドシートの「予約一覧」シート編集時に、Google Calendarにイベントを自動作成
- **実行タイミング**: スプレッドシート編集時（自動トリガー）

#### `handleReservationFormSubmit()`（`sheet.gs`）
- **説明**: フォーム送信時にカレンダーへゲスト追加する
- **機能**: フォーム送信イベントからメールアドレスとイベントIDを抽出し、カレンダーイベントにゲストを追加
- **実行タイミング**: フォーム送信時（自動トリガー）

#### `onDashboardAction()`（`sheet.gs`）
- **説明**: ダッシュボードシート編集時にリマインドを送信する
- **機能**: 未予約者に対してSlackリマインドを送信
- **実行タイミング**: ダッシュボードシート編集時（自動トリガー）

### 参加情報更新機能

#### `refreshAttendeeStatus()`（`sheet.gs`）
- **説明**: Google Calendarから参加情報を自動更新する
- **機能**: カレンダーイベントのゲストリストから参加情報を取得し、参加情報シートを更新
- **データソース**: Google Calendar（カレンダーイベントのゲストリスト）
- **実行タイミング**: スプレッドシート編集時、手動実行時


### Webアプリエンドポイント

#### `doGet()` / `doPost()`（`api_endpoint.gs`）
- **説明**: Webアプリとして公開するためのHTTPエンドポイント
- **機能**: HTTPリクエストを受け付け、以下の関数を実行
  - `syncParticipantsFromAttendance()` - 出欠簿シートからの参加情報同期
  - `updateEmailAddressesFromHRData()` - 人事データからのメールアドレス更新
  - `analyzeSheetStructure()` - スプレッドシート構造分析
- **実行タイミング**: HTTPリクエスト時

### メールアドレス更新機能

#### `updateEmailAddressesFromHRData()`（`update_email_addresses.gs`）
- **説明**: 人事データスプレッドシートから参加情報シートのメールアドレス欄を更新する
- **機能**:
  - 人事データスプレッドシート（GID: 1491723672）から名前とメールアドレスのマッピングを取得
  - スペースあり・なし両方の氏名でマッチング（J列のスペースなし氏名に対応）
  - 参加情報シートの参加者名と人事データの名前をマッチング
  - マッチした参加者のメールアドレス欄を更新
- **データソース**: 人事データスプレッドシート（https://docs.google.com/spreadsheets/d/1BtGHA_A8itKNh5Yu53S84oavdQvFrFbe6gKz1OAgeNY/edit?gid=1491723672）
- **実行タイミング**: 手動実行またはWebアプリ経由
- **実行方法**:
  1. **Google Apps Scriptエディタから実行**（推奨・最も簡単）
     - https://script.google.com/d/1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ/edit
     - 関数選択ドロップダウンから`updateEmailAddressesFromHRData`を選択して実行
  2. **Webアプリ経由で実行**（ブラウザまたはcurl）
     - URL: `https://script.google.com/macros/s/AKfycbxcJcmm95jKkjT0Hekh84XMB0k7YzrUb-KfMkzBmcQDeJ5LYdalQgRuAH0cIBFZ2C7yDQ/exec?function=updateEmailAddressesFromHRData`
     - ブラウザで上記URLを開くか、以下のコマンドで実行:
     ```bash
     curl -L "https://script.google.com/macros/s/AKfycbxcJcmm95jKkjT0Hekh84XMB0k7YzrUb-KfMkzBmcQDeJ5LYdalQgRuAH0cIBFZ2C7yDQ/exec?function=updateEmailAddressesFromHRData"
     ```
  3. **clasp経由で実行**（API 実行可能デプロイが必要）
     - `appsscript.json` に `executionApi` を追加済み。`clasp run` を通すには**初回のみ**GAS エディタで「デプロイ」→「新しいデプロイ」→ 種類の歯車から **「API 実行可能」** を選んでデプロイする。
     - 「Script function not found」や「Unable to run script function」が出る場合は、ワークスペース共通の `scripts/google_apps_script/inquiry_similarity/CLASP_TROUBLESHOOTING.md` の「clasp run が動かないとき」を参照（creds ログインや API アクセス制御の確認）。
     - 設定後、`clasp run getSystemStats` や `clasp run getUserEmail` で確認可能。Node 用の `scripts/run_tests_playwright.js` は `.claspignore` で除外済み（GAS に push すると `require` 未定義エラーの原因になるため）。

### デバッグ・ユーティリティ機能

#### `analyzeSheetStructure()`（`analyze_sheet_structure.gs`）
- **説明**: スプレッドシートの構造を分析する
- **機能**: 参加情報シートとコース一覧シートの構造を確認し、ヘッダー行とデータサンプルを表示
- **実行タイミング**: Webアプリ経由または手動実行

#### `analyzeAttendeesSheet()`（`analyze_sheet_structure.gs`）
- **説明**: 参加情報シートを詳細分析
- **機能**: 参加情報シートのヘッダー分析、グループ別参加者数集計、コース参加状況分析、空セル統計
- **実行タイミング**: 手動実行

#### `analyzeAllGroupSheets()`（`analyze_sheet_structure.gs`）
- **説明**: 各グループのスプレッドシート構造を分析
- **機能**: 3期生・2期生・1期生グループの全シートを分析し、月別シートを特定
- **実行タイミング**: 手動実行

#### `exportAttendeesSheetAsCSV()`（`analyze_sheet_structure.gs`）
- **説明**: 参加情報シートをCSVとしてエクスポート
- **機能**: 参加情報シートの全データをCSV形式でGoogle Driveに保存
- **実行タイミング**: 手動実行

#### 実行ログ機能（`sync_participants_from_attendance.gs`内）
- **説明**: 実行ログを自動的に「実行ログ」シートに書き込む（デバッグ用）
- **機能**: `syncParticipantsFromAttendance()`実行時に、実行日時・結果・詳細ログを自動記録
- **制御**: `writeLogToSheet`フラグで有効/無効を切り替え可能（デフォルト: `true`）
- **注意**: `check_execution_log.gs`は不要（機能が`sync_participants_from_attendance.gs`内に統合済み）

#### `LMSUtils`クラス（`LMSUtils.gs`）
- **説明**: LMS共通ユーティリティクラス
- **機能**: 設定値の管理、シート操作の共通処理、ステータス管理、グループ管理

---

**注意**: 参加情報更新機能には2つのデータソースがあります：
1. **Google Calendar** - `refreshAttendeeStatus()`関数でカレンダーイベントのゲストリストから自動更新
2. **出欠簿シート** - `syncParticipantsFromAttendance()`関数で出欠簿シートから手動同期

### データファイル（CSV）

以下のCSVファイルは、Google スプレッドシート「アベンジャーズ_継続研修」からエクスポートしたものです。

- `アベンジャーズ_継続研修 - グループ一覧.csv`
- `アベンジャーズ_継続研修 - コース一覧.csv`
- `アベンジャーズ_継続研修 - ダッシュボード.csv`
- `アベンジャーズ_継続研修 - 予約一覧.csv`
- `アベンジャーズ_継続研修 - 参加情報.csv`
- `アベンジャーズ_継続研修 - 従業員マスタ.csv`（新規追加）

**スプレッドシートURL**: https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit

### Google フォーム

**フォーム名**: アベンジャーズ継続研修_予約フォーム  
**フォームID**: `1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo`  
**フォームURL**: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit

このフォームは`form.gs`で管理されています。

---

## 🔗 Google Driveとの対応関係

| ローカルファイル | Google Drive上のファイル | 種類 | ID |
|----------------|------------------------|------|-----|
| `form.gs` | アベンジャーズ継続研修_予約フォーム | Google フォーム | `1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo` |
| `LMSUtils.gs` | LMS Shared Utilities | Google Apps Script | `1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ` |
| `*.csv` | アベンジャーズ_継続研修 | Google スプレッドシート | `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE` |

---

## 🚀 更新方法

### Google Apps Scriptの更新

#### 方法1: claspを使用（推奨）

```bash
cd stock/projects/legal_department/legal_training_lms/documents/4_executing/development

# LMS Shared Utilitiesを取得
clasp clone 1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ

# または、既存プロジェクトに接続
clasp pull
```

#### 方法2: 手動でコピー&ペースト

1. Google Apps Scriptエディタでファイルを開く
2. コードをコピー
3. ローカルファイルにペースト

### スプレッドシートデータの更新

```bash
# Google Driveから最新データを取得
python3 scripts/calendar_app/get_drive_folder_contents.py \
  "https://drive.google.com/drive/folders/1rpazwIC2lqTig9reMsG9Akgx-eOgHX-e" \
  --format json

# スプレッドシートから手動でCSVエクスポート
# https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit
```

---

## 📝 主要関数の詳細説明

### フォーム関連関数

#### `rebuildTrainingForm()`（`form.gs`）
- **目的**: 研修参加フォームを2ステップ構成で再生成
- **処理フロー**:
  1. スプレッドシートの「予約一覧」から候補日を取得
  2. フォームメタデータを設定
  3. 既存のフォーム項目をクリア
  4. 2ステップ構成のフォームを構築

#### `onFormSubmit()`（`form.gs`）
- **目的**: フォーム送信時にカレンダーへゲスト追加と参加情報更新
- **処理フロー**:
  1. フォーム回答からイベントIDとメールアドレスを抽出
  2. Google Calendarのイベントにゲストとして追加
  3. 参加情報シートを更新

### スプレッドシート・カレンダー連携関数

#### `onCreatingSchedule()`（`sheet.gs`）
- **目的**: 予約一覧シート編集時にカレンダーイベントを作成
- **処理フロー**:
  1. 予約一覧シートの編集を検知
  2. コース名、日時、詳細情報を取得
  3. Google Calendarにイベントを作成
  4. イベントIDをスプレッドシートに保存

#### `refreshAttendeeStatus()`（`sheet.gs`）
- **目的**: Google Calendarから参加情報を自動更新
- **処理フロー**:
  1. 予約一覧シートから管理対象イベントを取得
  2. Google Calendarから全イベントのゲストリストを取得
  3. 参加情報シートの各受講者のステータスを更新
  4. カレンダーのゲストリストと参加情報シートを同期

#### `onDashboardAction()`（`sheet.gs`）
- **目的**: ダッシュボードシート編集時に未予約者へリマインドを送信
- **処理フロー**:
  1. ダッシュボードシートの編集を検知
  2. 参加情報を最新化（`refreshAttendeeStatus()`を実行）
  3. 対象グループ・コースの未予約者を抽出
  4. Slackリマインドを送信

### 参加情報同期関数

#### `syncParticipantsFromAttendance()`（`sync_participants_from_attendance.gs`）
- **目的**: 出欠簿シートから参加情報を同期
- **処理フロー**:
  1. 出欠簿シートの各月シート（10月、11月など）を検出
  2. 各シートから日付、参加者のフルネーム、コース名を抽出
  3. 参加情報シートを開き、参加者名で行を特定
  4. 該当するコースの列に日付を入力

### ユーティリティクラス

#### `LMSUtils`クラス（`LMSUtils.gs`）
- **目的**: LMSシステム全体で使用する共通ユーティリティ
- **主なメソッド**:
  - `getConfig()` - 設定値を取得
  - `getCalendarId()` - カレンダーIDを取得
  - `getSiteUrl()` - サイトURLを取得
  - `sendSlack()` - Slack通知を送信

---

## 🔄 統合状況

### ✅ 統合済み

- [x] フォーム関連機能 - `rebuildTrainingForm()`, `onFormSubmit()`（`form.gs`）
- [x] スプレッドシート・カレンダー連携機能 - `onCreatingSchedule()`, `handleReservationFormSubmit()`, `onDashboardAction()`（`sheet.gs`）
- [x] 参加情報更新機能 - `refreshAttendeeStatus()`（`sheet.gs`）
- [x] Webアプリエンドポイント - `doGet()`, `doPost()`（`api_endpoint.gs`）
- [x] デバッグ機能 - `analyzeSheetStructure()`, `checkExecutionLog()`
- [x] メールアドレス更新機能 - `updateEmailAddressesFromHRData()`（`update_email_addresses.gs`）
- [x] 共通ユーティリティ - `LMSUtils`クラス（`LMSUtils.gs`）
- [x] CSVデータファイル（6ファイル）

### ✅ 同期状況

- [x] Google Drive上の「LMS Shared Utilities」プロジェクトの最新版と同期（`clasp pull`実行済み）
- [x] スプレッドシートの最新データとCSVファイルの同期（CSVエクスポート実行済み）

**最終同期日時**: 2025-11-19 10:16

---

## 📚 関連ドキュメント

### プロトタイプ関連
- [プロトタイプ進捗状況](docs/prototype_progress.md)
- [clasp開発進捗レポート](docs/CLASP_DEVELOPMENT_PROGRESS.md) - clasp自律開発フロー構築の進捗状況
- [claspセットアップガイド](docs/CLASP_SETUP.md)
- [claspワークフローガイド](docs/CLASP_WORKFLOW.md)
- [開発ワークフローガイド](docs/DEVELOPMENT_WORKFLOW.md) - 自律的な開発サイクル
- [Google APIセットアップガイド](docs/GOOGLE_API_SETUP.md)
- [Slack設定ガイド](docs/SLACK_CONFIG.md)
- [エラートラブルシューティングガイド](docs/ERROR_TROUBLESHOOTING.md)

### デプロイ・開発関連
- [デプロイ手順書](../../deployment.md) - 本番環境へのデプロイ手順
- [開発ディレクトリREADME](../README.md) - 開発ディレクトリ全体の説明

### 設定ファイル・スクリプト
- [clasp設定テンプレート](config/.clasp.json.template)
- [clasp無視ファイル](config/.claspignore)

#### 開発スクリプト
- [環境確認スクリプト](scripts/check_clasp_env.sh) - clasp環境の確認
- [プロジェクト接続設定スクリプト](scripts/setup_project_connections.sh) - GASプロジェクトとの接続設定
- [コード確認スクリプト](scripts/check_code.sh) - 最新コードの取得と確認
- [テスト実行スクリプト](scripts/run_tests.sh) - 関数のテスト実行
- [デプロイスクリプト](scripts/deploy.sh) - コードのデプロイ
- [統合ワークフロースクリプト](scripts/workflow.sh) - 一連の作業を自動化
- [通知設定管理スクリプト](scripts/manage_test_notifications.sh) - テスト実行時の通知設定管理

---

## 🔗 Google Driveリンク

- **フォルダ**: https://drive.google.com/drive/folders/1rpazwIC2lqTig9reMsG9Akgx-eOgHX-e
- **LMS Shared Utilities**: https://script.google.com/d/1tjRFSbY1AuGmhEsKEgcBSLMJzaMYORdnIRApv6VhYkKOIswtD_EN9DtQ/edit
- **スプレッドシート**: https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit
- **予約フォーム**: https://docs.google.com/forms/d/1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo/edit

---

---

## 🚀 クイックスタート

### 初回セットアップ

```bash
# 1. 環境確認
./scripts/check_clasp_env.sh

# 2. プロジェクト接続設定
./scripts/setup_project_connections.sh

# 3. コード確認
./scripts/check_code.sh
```

### 開発サイクル

```bash
# 1. 最新コードを取得
clasp pull

# 2. コードを編集（ローカル）

# 3. テスト実行（⚠️ 通知設定を確認）
./scripts/run_tests.sh

# 4. デプロイ
./scripts/deploy.sh
```

### 統合ワークフロー

```bash
# 一連の作業を自動化
./scripts/workflow.sh
```

---

**更新者**: プロダクト企画チーム  
**最終更新**: 2025-01-XX（clasp自律開発環境構築完了）


