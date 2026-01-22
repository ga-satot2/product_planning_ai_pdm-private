# サブリース契約書連携の実装方針検討

**プロジェクト名**: AGNT 2026 重要事項説明前の必要書類送付  
**ドキュメント種別**: 開発要件定義書  
**対象機能**: サブリース契約書部分  
**作成日**: 2025-12-05  
**作成者**: <t_sato2@ga-tech.co.jp>  
**最終更新**: 2025-12-05  
**バージョン**: v1.2

---

## 概要

契約書作成が完了したタイミングでAGNTの契約書作成APIにリクエストが実行される。

その処理の中でサブリース契約書も連携されるように改修を行うため実装方針を検討する。

---

## 仕様調査

### 契約書作成APIのコントローラ: `CreateDigitalContractFilesController`

* 現状はこの処理の中でSUPの契約に関連するDocusignFile一覧API (`api/docusign_infos/#{contract_id}/docusign_files`) を叩き、契約に紐づく書類を取得し、AGNTのS3にアップロードしている。
* S3保存後に `contract_file` のレコードが作成される（AGNTの契約詳細の表示に使用しているのはこちら）。

### Docusign

* サイン依頼する場合、サイン済以外はSUPに契約書を取りに行って（`DocumentSignFile.hashes_for_envelope` メソッド使用）、それをDocusignのリクエストに含めている。
* サイン後のコールバックで `document_sign_files` が作成され、以降 `DocumentSignFile.hashes_for_envelope` ではSUPではなく `document_sign_files` のURLが参照される。

### SUPPLIER側の要件

**参考**: [SUPPLIER開発チームへの展開要件](./supplier_development_requirements.md) を参照

SUPPLIER側では以下の対応が必要：
- お客様に公開可能なサブリース賃契を入れるための書類の"箱"を新設（または既存の箱を利用）
- 書類連携時のバリデーション追加（サブリース物件の場合、サブリース賃契が必須）
- 重説1ページの説明に対する署名の欄を削除
- 書類作成画面にサブリース賃契の要点項目の追加

---

## 実装方針

#### 1. DocusignFile一覧API でサブリース契約書も返してもらう場合

##### 実装内容

* `DocumentSignFile`, `ContractFile` にサブリース用の `kind` を追加
* `DocumentSignFile` と `ContractFile` の `kind` のマッピング追加
* `hashes_for_envelope` メソッドにサブリース契約書用に他の書類と同様に `process_xxx` メソッドを追加する

##### メリット

* 既存のフローに沿った実装のため、実装がシンプル
* APIリクエスト回数が増えない
* 既存の`hashes_for_envelope`メソッドの拡張で対応可能

##### デメリット

* SUP側の修正が必要なため、SUP側との調整が必要

#### 2. ArticleItemFile APIでサブリース契約書も返してもらう場合

* レスポンスは以下。`name_url` がS3のパスなので取得は可能
  * `id`, `article_item_id`, `file_name`, `name_url`, `created_at`, `updated_at`
* レスポンスからサブリース契約書を判定するには？
  * ⇒ Itemを取得するAPI (`api/items`) でクエリパラメータの `name` を指定し該当書類の `id` を取得できるようにしてもらう
  * ⇒ Item取得APIは1時間キャッシュされているため、サブリース契約書に関してはキャッシュさせないような実装が必要？

##### 実装内容

* `hashes_for_envelope` メソッドにサブリース契約書用に他の書類と同様に `process_xxx` メソッドを追加する（ファイル取得ロジックだけ `ArticleItemFile` APIを使用する形だが実装イメージは同じ）
* `Supplier::ArticleItemFile::Collection.search` で `supplier_article_id` と `file_type` を指定してサブリース契約書のみ取得する
* Item取得APIのキャッシュロジック修正

##### メリット

* 既存のArticleItemFile APIを活用できる
* DocusignFile一覧APIの修正が不要

##### デメリット

* SUPへのAPIリクエストが1回から3回になる
* Item取得APIのキャッシュロジック修正が必要
* 実装が複雑になる可能性

##### 懸念点

* SUPへのAPIリクエストが1回から3回になる。
* ItemAPIは物件ごとなどではなく、指定した書類タイプの全件取得だがレスポンス速度大丈夫か？
  * datadog直近1ヶ月はレスポンス速度 11.9ms (p95) なので現状は問題なさそう

---

## 実装詳細

---

## エラーハンドリング

### エラー発生時の処理

* Rollbar連携: エラー発生時にRollbarにログ記録
* 担当営業への通知: エラー発生時に担当営業へ通知
* リトライ処理: 一時的なエラーの場合はリトライ処理を実施

### エラーパターン

* SUP APIエラー
* メールアドレス不存在エラー
* ネットワークエラー

---

## リスク管理

### 高リスク

* SUP API連携の失敗による送信漏れ

### 中リスク

* RENOSYアカウントのメールアドレス不存在
* ネットワークエラーによる送信失敗

---

## テスト要件

### 単体テスト

* Contractモデルテスト: コールバックトリガーテスト、メール取得メソッドテスト
* SUP API連携テスト: モックを使用したAPI連携テスト

### 統合テスト

* SUPPLIER連携テスト: 契約書連携時の動作確認
* SUP API連携テスト: 実際のSUP APIを使用した統合テスト

### QAテスト

* 機能テスト: 既存の契約締結前ユーザに対して、変更時にメール送信される
* リグレッションテスト: 反響〜契約〜決済
* 探索的テスト: 想定外のタイミングでの送信がないか等

---

## 運用要件

### 監視要件

* 送信履歴の記録: 送信日時、送信先、送信内容を記録
* エラー監視: Rollbar連携によるエラー監視

### 運用プロセス

* エラー発生時: 担当営業への通知、ログ確認
* 再送付: 電子証明書変更時の再送付処理

---

## 制約条件

### SUP API連携の制約

* SUP APIのレスポンス速度: 要確認
* SUP APIのレート制限: 要確認

---

## 参考資料

* [プロジェクト概要書](./project_overview.md)
* [プロジェクト憲章](../1_initiating/project_charter.md)
* [SUPPLIER開発チームへの展開要件](./supplier_development_requirements.md)
