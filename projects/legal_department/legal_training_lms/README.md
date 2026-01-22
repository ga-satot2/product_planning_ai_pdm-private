# 法務研修LMSシステム

## プロジェクト概要

500名規模の受講者を3グループに分けて並行運営する法務研修の参加状態管理システム。Googleワークスペースの既存サービスを最大限活用し、追加コストを最小限に抑えた効率的なシステムを構築する。

## プロジェクト情報

- **プロジェクト名**: 法務研修LMSシステム
- **プログラム**: legal_department
- **作成日**: 2024-10-17
- **研修開始予定**: 2024-11-01
- **対象者**: 500名（3グループ）
- **告知開始**: 2024-10-17
- **予算**: 月額$65-130（既存Google Workspace利用）
- **ステータス**: 実行中

## ディレクトリ構造

```
legal_training_lms/
├── README.md                      # このファイル
├── documents/                     # プロジェクト文書
│   ├── 1_initiating/             # 立ち上げフェーズ
│   │   └── project_charter.md    # プロジェクト憲章
│   ├── 2_discovery/              # 発見フェーズ
│   ├── 2_research/               # リサーチフェーズ
│   │   ├── 現状分析_業務フロー簡易版.md
│   │   ├── 現状フロー図.md
│   │   ├── 現状課題_改善点_明確化.md
│   │   ├── 現状vs改善_差分一覧.md
│   │   └── 現状LMS活用_最小改善案.md
│   ├── 3_planning/               # 計画フェーズ
│   │   ├── product_requirements_document.md
│   │   ├── wbs.md
│   │   ├── 法務研修LMSシステム設計書.md
│   │   ├── 法務研修LMS_シーケンス図.md
│   │   ├── GoogleワークスペースLMS_アーキテクチャ設計.md
│   │   └── その他設計ドキュメント
│   ├── 4_executing/              # 実行フェーズ
│   │   ├── deployment.md         # デプロイ手順書
│   │   └── development/          # 開発コード
│   │       ├── src/              # ソースコード
│   │       └── prototypes/       # プロトタイプ
│   ├── 5_monitoring/             # 監視・コントロールフェーズ
│   └── 6_closing/                # 終結フェーズ
```

## PMBOKフェーズ

### 1. Initiating（立ち上げ）
- プロジェクト憲章
- ステークホルダー分析

### 2. Discovery（発見）
- 仮説マップ
- ペルソナ定義
- 課題定義
- ユーザージャーニーマップ

### 2. Research（リサーチ）
- ✅ 現状分析（業務フロー、課題、改善点）
- ✅ 現状vs改善の差分分析
- ✅ 最小改善案の検討
- ✅ 現状システム設計書（Google Drive上の既存システム）

### 3. Planning（計画）
- ✅ PRD（プロダクト要求仕様書）
- ✅ WBS（作業分解構造）
- ✅ システム設計書
- ✅ アーキテクチャ設計
- ✅ シーケンス図
- ✅ 予約変更機能設計

### 4. Executing（実行）
- ✅ デプロイ手順書
- ✅ ソースコード（Google Apps Script）
- ✅ プロトタイプコード
- スプリントゴール
- 会議議事録

### 5. Monitoring（監視・コントロール）
- ステータスレポート
- 変更要求
- インシデントレポート

### 6. Closing（終結）
- Lessons Learned
- 移管ドキュメント
- 完了報告書

## 次のステップ

1. **プロジェクト憲章を作成**: Cursorで「プロジェクト憲章」と入力
2. **ステークホルダー分析**: Cursorで「ステークホルダー分析」と入力
3. **PRD作成**: Cursorで「PRD」と入力
4. **WBS作成**: Cursorで「WBS作成」と入力

## 主要機能

### 1. 研修管理機能
- 研修コース管理
- 3グループ並行運営
- 受講者管理（500名対応）

### 2. 予約管理機能
- 参加希望日予約
- 予約変更機能（3日前まで、1回まで）
- 待機リスト管理
- キャンセル機能

### 3. 出席管理機能
- テスト回答による出席確認
- 自動採点機能
- 手動採点機能
- 出席率レポート

### 4. 補講管理機能
- 未受講者・不合格者の特定
- 補講スケジュール調整
- 再テスト機能

### 5. 通知機能
- 予約確認メール
- リマインド通知
- 結果通知
- 補講案内

## 技術スタック

### フロントエンド
- HTML5 + CSS3 + JavaScript
- Google Apps Script Web App

### バックエンド
- Google Apps Script
- Google Cloud SQL (PostgreSQL)
- Google Cloud Functions

### データ管理
- Google Sheets
- Google Calendar
- Google Drive

### 通知・連携
- Gmail API
- Google Calendar API
- Slack API

## 🔧 設定情報

### Slack設定
- **テスト環境**:
  - チャンネルID: `C068DD0619D` ⚠️ **テスト用**
  - チャンネル名: `#bpi-solution-public`
- **本番環境**:
  - チャンネルID: スプレッドシートの「グループ一覧」シート参照
  - チャンネル名: スプレッドシート参照
  - 設定場所: [アベンジャーズ_継続研修スプレッドシート](https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit?gid=1568150033#gid=1568150033)
  - 注意: チーム（グループ）ごとに異なるSlack IDが設定されている可能性があります
- **詳細**: [Slack設定情報](documents/4_executing/development/SLACK_CONFIG.md)

### Google API設定
- **有効化が必要なAPI**: Google Sheets API、Google Forms API、Google Calendar API、Google Drive API
- **詳細手順**: [Google API有効化手順](documents/4_executing/development/GOOGLE_API_SETUP.md)

## 更新履歴

- 2025-11-14: development/からドキュメントとコードを整理・移動
- 2024-10-17: プロジェクト開始、設計書作成
- 2025-10-16: プロジェクト初期化

---

**作成者**: プロダクト企画チーム  
**最終更新**: 2025-11-14
