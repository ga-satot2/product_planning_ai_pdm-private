# AGNT 2026 重要事項説明前の必要書類送付プロジェクト マスターインデックス

## プロジェクト概要

重要事項説明前に契約関連書類を顧客に事前送付し、法令違反リスクを解消することを目的としたプロジェクトです。

## 関連ファイル一覧

プロジェクトに関連するワークスペース内のファイル一覧：

### 💻 実装ファイル（Repositories）

#### 主要実装ファイル
- `repositories/backend/verdandi/lib/document_sign/envelope.rb` - **重要**: DocuSignエンベロープ処理（署名欄廃止対象）
- `repositories/backend/verdandi/app/models/contract.rb` - **重要**: Contractモデル（SUP連携トリガー追加対象）
- `repositories/backend/verdandi/lib/document_sign/pre_delivery_envelope.rb` - **新規作成予定**: 事前送付用エンベロープ処理

#### 関連実装ファイル
- `repositories/backend/verdandi/app/controllers/customer_api/v1/generate_docusign_urls_controller.rb` - DocuSign URL生成処理（変更不要）
- `repositories/data/renosy_asset/app/controllers/investment/mypage/contracts/docusign_controller.rb` - マイページ側DocuSign処理（変更不要）

#### テストファイル
- `repositories/backend/verdandi/spec/models/document_sign_file_spec.rb` - DocumentSignFileテスト
- `repositories/backend/verdandi/spec/models/document_sign_envelope_spec.rb` - DocumentSignEnvelopeテスト
- `repositories/backend/verdandi/spec/models/mypage/document_sign_envelope_spec.rb` - マイページDocumentSignEnvelopeテスト
- `repositories/backend/verdandi/spec/models/contract_spec.rb` - Contractモデルテスト

### 📁 Flowディレクトリ（作業中ドキュメント）

#### プロジェクト関連ドキュメント
- `flow/202511/2025-11-18/draft_project_charter.md` - プロジェクト憲章（ドラフト）
- `flow/202511/2025-11-18/draft_project_overview.md` - プロジェクト概要書（ドラフト）
- `flow/202511/2025-11-18/draft_problem_statement.md` - 課題定義書（ドラフト）
- `flow/202511/2025-11-18/draft_solution_definition.md` - ソリューション定義書（ドラフト）
- `flow/202511/2025-11-18/影響範囲分析結果.md` - 影響範囲分析結果（ドラフト）

### 📚 ナレッジベース

#### verdandi関連ナレッジ
- `knowledge/technical/verdandi_enum_knowledge.md` - verdandiのenum値確認方法
- `knowledge/technical/analysis/verdandi_office_aggregation_analysis.md` - verdandiオフィス集計分析

#### プロジェクト管理ナレッジ
- `knowledge/project_management/impact_analysis/hiroshima_office_closure_impact_report.md` - 影響範囲分析の参考例
- `knowledge/project_management/planning/2025-01-27_project_overview_template_format.md` - プロジェクト概要書テンプレート

### 🔗 関連プロジェクト

#### AGNT機能仕様書作成プロジェクト
- `stock/projects/AGNT機能仕様書作成/README.md` - AGNT機能仕様書作成プロジェクト
- `stock/projects/AGNT機能仕様書作成/documents/4_executing/project_progress.md` - プロジェクト進捗

## プロジェクトフェーズ

### 1. Initiating（立ち上げ）フェーズ
プロジェクトの目的・スコープ・ステークホルダーの定義

#### 📁 保存場所
`documents/1_initiating/`

#### 📋 主な成果物
- **プロジェクト憲章**: [project_charter.md](1_initiating/project_charter.md)
  - プロジェクトの目的・スコープ・ステークホルダー
  - 期間・予算・成功基準
  - 承認情報

### 2. Planning（計画）フェーズ
プロジェクト計画と作業分解構造の作成

#### 📁 保存場所
`documents/2_planning/`

**リサーチ（Research）**:
- `documents/2_planning/research/` - DocuSign仕様・マニュアルの調査

**発見（Discovery）**:
- `documents/2_planning/discovery/` - 現状の課題分析と解決策の定義

**計画成果物**:
- `documents/2_planning/` - プロジェクト計画と作業分解構造

#### 📋 主な成果物

**リサーチ（Research）**:
- **DocuSign管理者ガイドPDF**: [DocuSign eSignature管理者ガイド.pdf](2_planning/research/DocuSign%20eSignature管理者ガイド.pdf)
  - DocuSign管理者ガイド（法定開示・表示条件など）
- **DocuSignユーザーガイドPDF**: [DocuSign eSignatureユーザーガイド.pdf](2_planning/research/DocuSign%20eSignatureユーザーガイド.pdf)
  - DocuSignユーザーガイド（文書表示条件など）

**発見（Discovery）**:
- **課題定義書**: [problem_statement.md](2_planning/discovery/problem_statement.md)
  - 現状の課題と解決策
  - 法令要件の確認
- **ソリューション定義書**: [solution_definition.md](2_planning/discovery/solution_definition.md)
  - 実装ソリューションの詳細
  - 技術的アプローチ
- **影響範囲分析結果**: [impact_analysis.md](2_planning/discovery/impact_analysis.md)
  - システム変更の影響範囲
  - 実装ファイルの特定

**計画成果物**:
- **プロジェクト概要書**: [project_overview.md](2_planning/project_overview.md)
  - プロジェクトの背景・課題・打ち手
  - 投資効果・期待効果
- **WBS**: [wbs.md](2_planning/wbs.md)
  - プロジェクト作業分解構造とスケジュール
  - 工数見積もり・リスク管理
- **ガントチャートCSV**: [wbs_detailed.csv](2_planning/wbs_detailed.csv)
  - スプレッドシートでガントチャート表示用のCSVファイル
  - 日付ベースのスケジュール（2025-11-21 ～ 2025-12-16）
  - 担当者・フェーズ・確認期限を含む
  - 契約・確認タスク（11/26まで）を含む
- **SUPPLIER開発チームへの展開要件**: [supplier_development_requirements.md](2_planning/supplier_development_requirements.md)
  - SUPPLIER開発チームへの展開に関する詳細要件
  - API仕様・開発スケジュールの確認事項
- **リスク評価レポート**: [risk_assessment_project_overview_20251121_113458.md](2_planning/risk_assessment_project_overview_20251121_113458.md)
  - Gemini GEMによるセキュリティリスク評価結果
  - 4つの主要リスクと推奨対策
  - リスクレベルと優先対応順位
- **DocuSign開発要件定義書**: [development_requirements_docusign.md](2_planning/development_requirements_docusign.md)
  - DocuSignテンプレート作成の詳細な作業手順
  - 改正宅建業法のポイント.pdfを参照したテンプレート作成方法
  - DocuSign管理者ガイド・ユーザーガイドに基づく設定手順
  - 署名欄なしの設定方法
- **DocuSignテンプレート作成 ステップバイステップ手順書**: [docusign_template_step_by_step_guide.md](2_planning/docusign_template_step_by_step_guide.md)
  - DocuSign管理画面での具体的な操作手順
  - 3種類のテンプレート（売買・管理委託・サブリース）の作成手順
  - 画面操作の詳細なステップバイステップガイド
  - Pre-delivery機能とComposite Templatesの説明
  - テスト・検証手順

### 3. Executing（実行）フェーズ
開発・実装作業の実行

#### 📁 保存場所
`documents/3_executing/`

#### 📋 主な成果物

**会議議事録**: 
- [meeting_minutes_2025-11-04_sublease_contract_storage.md](3_executing/meetings/meeting_minutes_2025-11-04_sublease_contract_storage.md)
  - サブリース契約書の格納について（2025-11-04）
  - 送信専用の箱の新設要望と対応方針
  - 既存の格納フォルダー利用の可否
  - 送信専用箱の運用方針とリスク
  - 将来的な拡張（普通賃貸借契約書の送付）
- [meeting_minutes_2025-11-12_docusign_contract_change.md](3_executing/meetings/meeting_minutes_2025-11-12_docusign_contract_change.md)
- [meeting_minutes_2025-11-21_sublease_alternative_plan.md](3_executing/meetings/meeting_minutes_2025-11-21_sublease_alternative_plan.md) - サブクラ対応の代替案検討（リリース時期変更、特約シート作成方針決定）
  - DocuSign契約変更に関する会議議事録（2025-11-12）
  - プラン変更の必要性と費用
  - 予算申請とスケジュール
  - サブリース契約書の送付タイミング

**開発成果物**:
- **サブリース物件申込通知スクリプト**: [slack_notification/](3_executing/development/slack_notification/)
  - Google Apps Scriptによるサブリース物件の申込通知機能
  - STATUS=「申込」かつCURRENT_SITUATION=「サブリース中」の物件をSlack通知
  - 15分おきの自動チェック（時間ベーストリガー）
  - 重複通知防止（CONTRACT_IDベース）
  - 通知内容: 物件名、契約予定日、SUPPLIER ARTICLE IDのURL、賃貸契約種別
  - [README.md](3_executing/development/slack_notification/README.md) - 設定手順・関数一覧・トラブルシューティング
  - [notify_sublease_application.gs](3_executing/development/slack_notification/notify_sublease_application.gs) - メインスクリプト

### 4. Monitoring（監視）フェーズ
進捗管理・品質管理の記録

#### 📁 保存場所
`documents/4_monitoring/`

#### 📋 主な成果物
- ステータスレポート
- 変更要求
- リスクログ

### 5. Closing（終結）フェーズ
プロジェクト完了時の成果物

#### 📁 保存場所
`documents/5_closing/`

#### 📋 主な成果物
- 教訓記録（Lessons Learned）
- 移管ドキュメント
- 完了報告書

## 主要成果物

### 実装ファイル
- `verdandi/lib/document_sign/pre_delivery_envelope.rb` - 事前送付用エンベロープ処理（新規作成）
- `verdandi/app/models/contract.rb` - SUP連携トリガーとメール取得処理の拡張
- `verdandi/lib/document_sign/envelope.rb` - 重要事項説明書の署名欄廃止

### 機能要件
- ✅ SUP連携時の自動トリガー
- ✅ DocuSignテンプレートを使用したメール送信
- ✅ 署名欄なしドキュメント送付
- ✅ サブリース契約書の条件付き送付
- ✅ エラーハンドリング（Rollbar連携、担当営業への連携）

## プロジェクト情報

### 基本情報
- **プロジェクト名**: AGNT 2026 重要事項説明前の必要書類送付
- **主目的**: リスク/セキュリティ対応
- **期間**: 2025-09-01 ～ 2025年11月末（リリース予定）
- **予算**: 70万円（工数：140h）
- **リスクスコア**: 20 → 0（目標）

### ステークホルダー
- **プロジェクトマネージャー**: 佐藤達也
- **スポンサー**: Asset Design事業部
- **開発PM**: 赤間滉一
- **サーバ開発**: 小松亮汰
- **QA担当**: 野原慎弥、原萌葵、松村拓人
- **セキュリティ担当**: 時任達也、山田拓人

## 進捗管理

### マイルストーン
- **MS1: 要件確定** - 1.1.1完了後
- **MS2: 設計完了** - 3.2.1完了後
- **MS3: 実装完了** - 4.2.1完了後
- **MS4: テスト完了** - 5.2.1完了後
- **MS5: リリース** - 6.1.3完了後

### 進捗状況
プロジェクト進行中。詳細は[WBS](2_planning/wbs.md)を参照してください。

---
*作成日: 2025-11-21*
*作成者: AIアシスタント*
*最終更新: 2025-11-25*

## 更新履歴

- **2025-11-20**: リスク評価レポート追加（Gemini GEM評価結果）
  - 4つの主要セキュリティリスクを特定
  - WBSにリスク評価対応タスクを追加
  - プロジェクト憲章にリスク評価結果を追加
  - 開発着手前チェックリストにリスク評価確認事項を追加
- **2025-11-21**: プロジェクトマスタインデックス作成
  - 関連ファイル一覧を統合
  - プロジェクトフェーズ別の成果物を整理
- **2025-11-21**: 会議議事録追加
  - DocuSign契約変更に関する会議議事録（2025-11-12実施）を追加
- **2025-11-25**: PMBOK第8版準拠の5プロセス群構造に移行
  - Research/DiscoveryフェーズをPlanningフェーズに統合
  - ディレクトリ構造を更新（2_planning/research/, 2_planning/discovery/）
  - フェーズ番号を更新（3_executing, 4_monitoring, 5_closing）
- **2025-12-02**: サブリース物件申込通知スクリプト追加
  - Google Apps ScriptによるSlack通知機能を実装
  - STATUS条件を「申込」に設定
  - 15分おきの自動チェック機能を実装
  - 開発成果物を`3_executing/development/slack_notification/`に配置
