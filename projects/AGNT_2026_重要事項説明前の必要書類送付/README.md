# AGNT 2026 重要事項説明前の必要書類送付プロジェクト

## プロジェクト概要

重要事項説明前に契約関連書類を顧客に事前送付し、法令違反リスクを解消することを目的としたプロジェクトです。

### プロジェクト情報
- **プロジェクト名**: AGNT 2026 重要事項説明前の必要書類送付
- **通称・別名**: サブクラ対応（社内での呼称）
- **主目的**: リスク/セキュリティ対応
- **期間**: 2025-09-01 ～ 2025年11月末（リリース予定）
- **予算**: 70万円（工数：140h）
- **リスクスコア**: 20 → 0（目標）

## 関連ファイル一覧

プロジェクトに関連するワークスペース内のファイル一覧：
- **[関連ファイル一覧](./documents/related_files_index.md)** - プロジェクトドキュメント、実装ファイル、ナレッジベースなど

## プロジェクト文書

### 1. Initiating（立ち上げ）フェーズ
- [プロジェクト憲章](./documents/1_initiating/project_charter.md) - プロジェクトの目的・スコープ・ステークホルダー

### 2. Research（リサーチ）フェーズ
- [DocuSign eSignature管理者ガイド](./documents/2_research/DocuSign%20eSignature管理者ガイド.pdf) - DocuSign管理者ガイド（法定開示・表示条件など）
- [DocuSign eSignatureユーザーガイド](./documents/2_research/DocuSign%20eSignatureユーザーガイド.pdf) - DocuSignユーザーガイド（文書表示条件など）

### 3. Discovery（発見）フェーズ
- [課題定義書](./documents/2_discovery/problem_statement.md) - 現状の課題と解決策
- [ソリューション定義書](./documents/2_discovery/solution_definition.md) - 実装ソリューションの詳細
- [影響範囲分析結果](./documents/2_discovery/impact_analysis.md) - システム変更の影響範囲

### 4. Planning（計画）フェーズ
- [プロジェクト概要書](./documents/3_planning/project_overview.md) - プロジェクトの背景・課題・打ち手
- [WBS (Work Breakdown Structure)](./documents/3_planning/wbs.md) - プロジェクト作業分解構造とスケジュール
- [SUPPLIER開発チームへの展開要件](./documents/3_planning/supplier_development_requirements.md) - SUPPLIER開発チームへの展開に関する詳細要件
- [プロジェクト概要書PDF](./documents/3_planning/AGNT-AGNT%202026%20重要事項説明前の必要書類送付-201125-105054.pdf) - 正式なプロジェクト概要書

### 5. Executing（実行）フェーズ
- 開発・実装作業の成果物

### 6. Monitoring（監視）フェーズ
- 進捗管理・品質管理の記録

### 7. Closing（終結）フェーズ
- プロジェクト完了時の成果物

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

## 技術仕様

### 主要機能
- SUP連携時の自動トリガー（contract_preparation状態）
- DocuSignテンプレートを使用したメール送信
- 署名欄なしドキュメント送付（重要事項説明書、サブリース契約書）
- RENOSYアカウントのメールアドレス取得処理

### 依存関係
- DocuSign eSignature API
- RENOSYアカウントシステム
- SUP（Supply Chain Platform）

## ステークホルダー

### プロジェクト体制
- **プロジェクトマネージャー**: 佐藤達也
- **スポンサー**: Asset Design事業部
- **開発PM**: 赤間滉一
- **サーバ開発**: 小松亮汰
- **QA担当**: 野原慎弥、原萌葵、松村拓人
- **セキュリティ担当**: 時任達也、山田拓人

### 確認先
- **Supply Chain事業部Process Managementチーム**: SUP連携の確認
- **SUPPLIER開発チーム**: SUP側のシステム開発・連携API仕様確認（**重要**: SUPPLIER側への展開が必要）
- **Acquisition事業部Contractチーム**: 契約書類準備完了のタイミング確認
- **AGNT開発チーム**: RENOSYアカウントメール取得方法の確認

## 成功基準

### リスク対応（主目的）
- ✅ 法令違反のリスクが解除されている状態になる
- ✅ 免許停止のリスクから免れる
- ✅ リスクスコア20から0への改善

### 機能要件
- ✅ 契約書類準備完了をトリガーに、重要事項説明よりも前に書類を送付できる
- ✅ サブリース契約書の送付フローが実装されている（特定賃貸借物件の場合）
- ✅ エラーハンドリングが実装されている（rollbar連携、担当営業への連携）

### 品質要件
- ✅ QAによるシナリオテストを実施し、対応の不備がないことを検証
- ✅ 月間1000契約以上の規模に対応できる

## 進捗状況

プロジェクト進行中。詳細は[WBS](./documents/3_planning/wbs.md)を参照してください。

---
*作成者: 佐藤達也*  
*作成日: 2025-11-18*  
*最終更新: 2025-12-24*
