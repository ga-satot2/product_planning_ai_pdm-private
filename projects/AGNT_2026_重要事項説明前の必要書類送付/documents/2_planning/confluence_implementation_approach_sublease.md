# サブリース契約書連携の実装方針検討（Confluence版）

**プロジェクト名**: AGNT 2026 重要事項説明前の必要書類送付  
**ドキュメント種別**: 実装方針検討  
**作成日**: 2025-12-04  
**最終更新**: 2025-12-04  
**出典**: [Confluence - サブリース契約書連携の実装方針検討](https://ga-tech.atlassian.net/wiki/spaces/AGNT/pages/5189566577/%E3%82%B5%E3%83%96%E3%83%AA%E3%83%BC%E3%82%B9%E5%A5%91%E7%B4%84%E6%9B%B8%E9%80%A3%E6%90%BA%E3%81%AE%E5%AE%9F%E8%A3%85%E6%96%B9%E9%87%9D%E6%A4%9C%E8%A8%8E)

---

## 概要

契約書作成が完了したタイミングでAGNTの契約書作成APIにリクエストが実行される。

その処理の中でサブリース契約書も連携されるように改修を行うため実装方針を検討する。

---

## 仕様調査

### 契約書作成APIのコントローラ：CreateDigitalContractFilesController

* 現状はこの処理の中でSUPの契約に関連するDocusignFile一覧API(`api/docusign_infos/#{contract_id}/docusign_files`) を叩き、契約に紐づく書類を取得し、AGNTのS3にアップロードしている。
* S3保存後に`contract_file`のレコードが作成される（AGNTの契約詳細の表示に使用しているのはこちら）

### Docusign

* サイン依頼する場合、サイン済以外はSUPに契約書を取りに行って（`DocumentSignFile.hashes_for_envelope`メソッド使用）、それをDocusignのリクエストに含めている
* サイン後のコールバックで`document_sign_files`が作成され、以降`DocumentSignFile.hashes_for_envelope`ではSUPではなく`document_sign_files`のURLが参照される

---

## 実装方針

### DocusignFile一覧API でサブリース契約書も返してもらう場合

#### 実装内容

* `DocumentSignFile`,`ContractFile`にサブリース用のkindを追加
* `DocumentSignFile`と`ContractFile`のkindのマッピング追加
* [hashes_for_envelopeメソッド](https://github.com/ga-tech/verdandi/blob/565e818f1c2590e517bf57abc5a15ebcdbb30014/app/models/document_sign_file.rb#L69-L80) にサブリース契約書用に他の書類と同様にprocess_xxxメソッドを追加する

---

### ArticleItemFile APIでサブリース契約書も返してもらう場合

レスポンスは以下。name_urlがS3のパスなので取得は可能

=>id, article_item_id, file_name, name_url, created_at, updated_at

レスポンスからサブリース契約書を判定するには？

=> Itemを取得するAPI(api/items)でクエリパラメータの`name`を指定し該当書類のidを取得できるようにしてもらう

=>Item取得APIは1時間キャッシュされているため、サブリース契約書に関してはキャッシュさせないような実装が必要？

#### 実装内容

* [hashes_for_envelopeメソッド](https://github.com/ga-tech/verdandi/blob/565e818f1c2590e517bf57abc5a15ebcdbb30014/app/models/document_sign_file.rb#L69-L80) にサブリース契約書用に他の書類と同様にprocess_xxxメソッドを追加する（ファイル取得ロジックだけArticleItemFile APIしようしてとは同じな実装イメージ）
  * `Supplier::ArticleItemFile::Collection.search`で`supplier_article_id`と`file_type`を指定してサブリース契約書のみ取得する
* Item取得APIのキャッシュロジック修正

#### 懸念点

SUPへのAPIリクエストが1回から3回になる。

ItemAPIは物件ごとなどではなく、指定した書類タイプの全件取得だがレスポンス速度大丈夫か？

=> [datadog](https://app.datadoghq.com/apm/resource/supplier/rails.action_controller/dd575b34a8b8252f?query=env%3Aprd%20operation_name%3Arails.action_controller%20resource_name%3A%22Api%3A%3AItemsController%23index%22%20service%3Asupplier&env=prd&fromUser=false&primaryTags=&start=1762272774548&end=1764864774548&paused=true)直近1ヶ月はレスポンス速度11.9ms(p95)なので現状は問題なさそう

---

## 参考資料

* [開発要件定義書（サブリース）](./development_requirements_sublease.md)



















