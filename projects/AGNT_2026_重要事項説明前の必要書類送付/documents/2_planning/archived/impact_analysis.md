# 影響範囲分析結果

**プロジェクト名**: AGNT 2026 重要事項説明前の必要書類送付  
**最終調査日**: 2025-11-26  
**調査方法**: 横断検索による実際のコードベース確認

**注意**: 業務プロセスの背景については、[プロジェクト憲章](../1_initiating/project_charter.md)および[プロジェクト概要書](../2_planning/project_overview.md)を参照してください。

---

## 📋 目次

- [確認事項](#確認事項) - 外部チームや関係者への確認が必要な項目
- [実装要件](#実装要件) - コード修正・追加が必要な項目
- [影響ファイル一覧](#影響ファイル一覧) - 変更対象ファイルの一覧
- [実装優先順位](#実装優先順位) - 実装の優先順位とスケジュール
- [注意事項](#注意事項) - 実装時の重要な注意点

---

## 🔍 確認事項

### 1. SUPPLIER側の変更内容確認（最優先）

**確認先**: SUPPLIER開発チーム、Supply Chain事業部Process Managementチーム  
**確認期限**: 開発着手前（11/26まで推奨）

#### 1.1 サブリース契約書の格納場所（送信専用の箱）

**確認済み事項**（コードベースで確認済み）:
- ✅ サブリース契約書のファイルタイプは既に定義されている（`supplier-article/app/models/sales_contract_file.rb`）
  - `collection_agency_agreement_sublease`
  - `lease_contract_renosy_wide_sublease`
  - `lease_contract_renosy_neo_income_collection_agency`
  - など

**確認が必要な事項**:
- 送信専用の箱の用意（新規追加 or 既存利用）
- 箱の名称決定（TBD: 賃貸借契約書（サブリース）を使用する可能性あり）
- ファイル識別ロジックの明確化（格納日時、ステータスフラグなど）
- 発表時のバリデーションロジックとの整合性確認

**運用方針**（2025-11-04会議で決定）:
- 契約書が連携されて契約レディになった時点で、ここに入っているファイルは全部送られる
- この取り組みが始まった以降の契約書レディになったものについては、ここに入ってるものは送られる

**リスク**:
- 既存の箱を使用する場合、過去のファイルが誤って送信されるリスク
- 送信専用の箱が存在しない場合、既存のバリデーションロジックとの整合性が取れない

#### 1.2 開発スケジュール調整

**確認が必要な事項**:
- SUPPLIER側の開発スケジュール確認
- AGNT側との開発スケジュール調整
- 統合テストのスケジュール調整
- SUP側とAGNT側のリリースタイミング調整

**注意**: SUPPLIER側の開発遅延により、AGNT側の実装も遅延する可能性があるため、早期の連携が重要

### 2. DocuSignテンプレートの実装方式確認

**確認先**: AGNT開発チーム  
**確認期限**: 設計フェーズ開始前

**既存コードの確認結果**（コードベースで確認済み）:
- ✅ 既存実装ではテンプレートを使用していない
- ✅ PDFファイルを直接`DocuSign_eSign::Document.new`で作成してエンベロープに追加
- ✅ `envelope_definition.templateId`や`templateRoles`などのテンプレート関連プロパティは使用されていない

**確認が必要な事項**:
1. **既存実装でテンプレートを使っていない理由**
   - 技術的制約があるか
   - 運用上の理由があるか（テンプレート管理の複雑さなど）
   - 過去に検討したが採用しなかった理由

2. **プロジェクト憲章の「Docusignテンプレートを利用」の意図**
   - DocuSignのテンプレート機能を使うことを想定しているか
   - それとも単に「DocuSignを使ってメール送信する」という意味か

3. **テンプレート使用の可否判断に必要な情報**
   - テンプレートを使う場合のメリット・デメリット
   - テンプレートを使う場合の実装方法（`templateId`の設定方法など）
   - テンプレートを使わない場合の実装方針（既存実装を踏襲）

**判断事項**:
- **既存実装を踏襲する場合**: PDFファイルを直接送信する方式を採用（テンプレート機能は使用しない）
- **テンプレートを使用する場合**: DocuSign側でテンプレートを作成し、`envelope_definition.templateId`を設定する方式を採用

### 3. エラーハンドリングの実装詳細確認

**確認先**: AGNT開発チーム

**確認が必要な事項**:
- `Rollbar.error`の使用方法と設定
- 担当営業への連携処理の実装方法（Slack通知など）
- メールバウンス時の処理フロー

### 4. サブリース契約書の判定ロジック確認

**確認先**: SUPPLIER開発チーム、Acquisition事業部Contractチーム

**確認が必要な事項**:
- 特定賃貸借物件の判定方法
- サブリース契約書の送付対象判定ロジック
- サブリース契約書のファイル格納場所
  - SUP側: `sales_contract_files`テーブル（`supplier-article/app/models/sales_contract_file.rb`）
  - AGNT側: `contract_files`テーブル（`verdandi/app/models/contract_file.rb`）
- サブリース契約書のファイル種別
  - SUP側: `SalesContractFile.type`（`collection_agency_agreement_sublease`, `lease_contract_renosy_wide_sublease`など）
  - AGNT側: `ContractFile.kind`（`property_management_agreement`）、`DocumentSignFile.kind`（`collection_agency_sublease`, `wide_sublease`, `collection_agency_pro_sublease`など）
- SUP側からAGNT側へのファイル連携方法の確認

---

## 💻 実装要件

### 1. AGNT側: 契約モデルの修正

#### 1.1 事前送付処理のトリガー追加

**影響ファイル**: `verdandi/app/models/contract.rb`

**変更内容**:
- `after_update :send_pre_delivery_documents, if: :contract_preparation?`のコールバックを追加
- `send_pre_delivery_documents`メソッドを追加
- `sublease_contract_required?`メソッドを追加（サブリース判定用）

**実装コード例**:
```ruby
# contract.rb（after_updateの後に追加）
after_update :send_pre_delivery_documents, if: :contract_preparation?

private

def send_pre_delivery_documents
  return unless saved_change_to_status? && contract_preparation?
  
  # 事前送付処理を実行
  PreDeliveryEnvelope.new(self).send
rescue => e
  Rollbar.error(e, contract_id: id, error_type: 'pre_delivery_failed')
  notify_sales_team(e)
end

def sublease_contract_required?
  # 特定賃貸借物件の判定ロジック
  rental_contract.in?([
    Contract.rental_contract.agency_guarantee_sublease,
    Contract.rental_contract.renosy_wide_sublease,
    Contract.rental_contract.agency_guarantee_pro_sublease
  ])
end
```

**既存コードの確認**:
- ✅ `contract_preparation: 8`のステータスが存在（行27）
- ✅ `belongs_to :opportunity`が存在（行54）
- ✅ `after_save`と`after_update`のコールバックが存在（行312-314）

### 2. AGNT側: DocuSign関連の修正

#### 2.1 重要事項説明書の署名欄廃止

**影響ファイル**: `verdandi/lib/document_sign/envelope.rb`

**変更内容**:
- 行107-114: 重要事項説明書の署名欄（`presentation_of_important_info_date_signed`）の定義を削除
- 行272: `dateSignedTabs`配列から`presentation_of_important_info_date_signed`を削除

**削除対象コード**:
```107:114:verdandi/lib/document_sign/envelope.rb
        presentation_of_important_info_date_signed = DocuSign_eSign::DateSigned.new(
          {
            customTabId: custom_tab_id,
            documentId: '17', pageNumber: '1',
            recipientId: '1', tabLabel: 'todayTab',
            xPosition: '415', yPosition: '638'
          }
        )
```

```271:277:verdandi/lib/document_sign/envelope.rb
          dateSignedTabs: [
            presentation_of_important_info_date_signed,
            sales_contract_date_signed,
            cooling_off_date_signed,
            personal_info_handling_date_signed,
            receipt_date_signed
          ],
```

#### 2.2 事前送付用エンベロープ処理クラスの新規作成

**新規ファイル**: `verdandi/lib/document_sign/pre_delivery_envelope.rb`

**実装内容**:
- 署名欄なし（Viewer）のドキュメントを送信
- 重要事項説明前の事前確認用書類を送付
- `DocumentSignFile.hashes_for_pre_delivery`で署名欄なしのPDFを取得
- 受信者は「Viewer」役割（署名不要、確認のみ）

**実装コード**:
```ruby
module DocumentSign
  class PreDeliveryEnvelope < Base
    def initialize(contract)
      super
      @contract = contract
      @envelopes_api = DocuSign_eSign::EnvelopesApi.new @@api_client
    end

    def send
      envelope_definition = DocuSign_eSign::EnvelopeDefinition.new
      envelope_definition.email_subject = '重要事項説明前の必要書類について'
      envelope_definition.email_blurb = <<~BODY
        #{@contract.customer.name}様
        この度はご契約をご検討いただき誠にありがとうございます。

        重要事項説明前にご確認いただく必要書類をお送りいたします。
        事前にご確認いただくことで、説明時間の短縮とご理解の向上に繋がります。

        何卒宜しくお願いいたします。
      BODY
      
      # 署名欄なしのドキュメントを取得
      files_data = DocumentSignFile.hashes_for_pre_delivery(@contract)
      documents = files_data.select { |data| data[:data].present? }.map do |data|
        DocuSign_eSign::Document.new(
          documentBase64: data[:data],
          name: data[:name],
          fileExtension: 'pdf',
          documentId: data[:document_id]
        )
      end

      envelope_definition.documents = documents
      
      # 受信者は「確認」役割（SignerではなくViewer）
      recipient = DocuSign_eSign::Recipient.new(
        email: renosy_account_email,
        name: @contract.customer.name,
        recipientId: 1,
        roleName: 'Viewer' # 署名欄なしの確認のみ
      )
      
      recipients = DocuSign_eSign::Recipients.new({ recipients: [recipient] })
      envelope_definition.recipients = recipients
      envelope_definition.status = 'sent'
      @envelopes_api.create_envelope ACCOUNT_ID, envelope_definition
    rescue DocuSign_eSign::ApiError => e
      Rails.logger.error("DocuSignAPI FAILED (PreDelivery), error_code: #{e.code}, error_info: #{e.response_body}")
      Rollbar.error(e, contract_id: @contract.id, error_type: 'pre_delivery_failed')
      notify_sales_team(e)
      nil
    end

    private

    def renosy_account_email
      @contract.opportunity&.mypage_registered_email
    end

    def notify_sales_team(error)
      # 担当営業への連携処理（Slack通知など）
      # 実装詳細は要確認
    end
  end
end
```

**注意**: 実装方式（テンプレート使用の可否）は確認事項2を参照

### 3. AGNT側: DocumentSignFileクラスの拡張

#### 3.1 事前送付用ファイル取得メソッドの追加

**影響ファイル**: `verdandi/app/models/document_sign_file.rb`

**変更内容**:
- `hashes_for_pre_delivery`メソッドを追加（署名欄なしのドキュメントのみ）
- `rental_contract_presentation_hashes`メソッドを追加
- `sublease_contract_hash`メソッドを追加

**実装コード例**:
```ruby
# document_sign_file.rb（クラスメソッドとして追加）
def hashes_for_pre_delivery(contract)
  [
    presentation_of_important_info_hash(contract), # 重要事項説明書（署名欄なし）
    *rental_contract_presentation_hashes(contract), # 賃貸借契約の重要事項説明書（署名欄なし）
    sublease_contract_hash(contract) # サブリース契約書（署名欄なし、条件付き）
  ].compact
end

private

def rental_contract_presentation_hashes(contract)
  # 賃貸借契約の重要事項説明書のみを返す（署名欄なし）
  case contract.rental_contract
  when Contract.rental_contract.renosy_wide_plan
    [rental_contarct_presentation_of_important_info_wide_hash(contract)]
  when Contract.rental_contract.agency_guarantee
    [rental_contarct_presentation_of_important_info_collection_agency_hash(contract)]
  # ... 他のケースも同様
  else
    all_rental_contarct_presentation_of_important_info_hashes(contract)
  end
end

def sublease_contract_hash(contract)
  # 特定賃貸借物件の場合のみ、サブリース契約書を返す
  return nil unless contract.sublease_contract_required?
  
  case contract.rental_contract
  when Contract.rental_contract.agency_guarantee_sublease
    collection_agency_sublease_hash(contract)
  when Contract.rental_contract.renosy_wide_sublease
    wide_sublease_hash(contract)
  when Contract.rental_contract.agency_guarantee_pro_sublease
    collection_agency_pro_sublease_hash(contract)
  else
    nil
  end
end
```

**既存コードの確認**:
- ✅ `hashes_for_envelope`メソッドが存在（行69-80）

### 4. エラーハンドリングの強化

**影響ファイル**: `verdandi/lib/document_sign/pre_delivery_envelope.rb`（新規作成）

**変更内容**:
- `Rollbar.error`でのエラーログ記録を追加
- メールバウンス時の担当営業への連携処理を追加

**実装コード例**:
```ruby
rescue DocuSign_eSign::ApiError => e
  Rails.logger.error("DocuSignAPI FAILED (PreDelivery), error_code: #{e.code}, error_info: #{e.response_body}")
  Rollbar.error(e, contract_id: @contract.id, error_type: 'pre_delivery_failed')
  notify_sales_team(e)
  nil
end
```

**既存コードの確認**:
- ✅ 既存の`DocumentSign::Envelope`では`Notifier.ping_warning(e)`を使用（行48）

---

## 📁 影響ファイル一覧

### 新規作成が必要なファイル

1. **`verdandi/lib/document_sign/pre_delivery_envelope.rb`**
   - 事前送付用エンベロープ処理クラス
   - `DocumentSign::Envelope`を参考に実装

### 修正が必要なファイル（AGNT側）

1. **`verdandi/lib/document_sign/envelope.rb`**
   - 行107-114: `presentation_of_important_info_date_signed`の定義を削除
   - 行272: `dateSignedTabs`配列から`presentation_of_important_info_date_signed`を削除

2. **`verdandi/app/models/contract.rb`**
   - `after_update :send_pre_delivery_documents, if: :contract_preparation?`を追加
   - `send_pre_delivery_documents`メソッドを追加
   - `sublease_contract_required?`メソッドを追加（サブリース判定用）

3. **`verdandi/app/models/document_sign_file.rb`**
   - `hashes_for_pre_delivery`メソッドを追加
   - `rental_contract_presentation_hashes`メソッドを追加
   - `sublease_contract_hash`メソッドを追加

### 変更不要なファイル

1. **`verdandi/app/controllers/customer_api/v1/generate_docusign_urls_controller.rb`**
   - 既存処理は維持（変更不要）
   - 理由: 事前送付用のメール送信は別の処理として実装するため

2. **`repositories/data/renosy_asset/app/controllers/investment/mypage/contracts/docusign_controller.rb`**
   - 既存処理は維持（変更不要）
   - 理由: マイページ側のDocusign処理は、実際の契約締結時の処理として維持するため

### 修正が必要なファイル（SUPPLIER側）

1. **送信専用の箱へのファイル格納ロジックの実装**（新規開発が必要）
   - 対象ファイル: 未確定（以下のいずれかに実装）
     - `supplier-article/app/models/sales_contract_file.rb` にメソッド追加
     - 新規サービスクラス（例: `app/services/pre_delivery_file_storage_service.rb`）
     - コントローラーまたはAPIエンドポイントの追加
   - サブリース契約書を送信専用の箱に格納する処理
   - 送信専用の箱からファイルを取得する処理（AGNT側がAPI経由で取得するため）
   - 理由: `sales_contract_files`テーブルには「送信専用の箱」を表すカラムが存在しない。既存の`store_dir`メソッド（`supplier-article/articles/supplier/#{article.id}/sales_contract_fields/#{sales_contract_field_id}`）は通常の格納場所を指しており、送信専用の箱とは別の概念。会議議事録（2025-11-04）で「新規で箱を作る」ことが決定しているが、具体的な実装方法（DBカラム追加、別テーブル作成、S3パス構造変更など）は未確定
   - 参考: 会議議事録 `documents/3_executing/meetings/meeting_minutes_2025-11-04_sublease_contract_storage.md`


---

## 📊 実装優先順位

### 最優先（リリース前に必須）

1. **SUPPLIER側の変更内容確認** ⚠️ **最優先**（SUP側の変更も必要）
   - サブリース契約書の格納場所（送信専用の箱）の決定（新規開発が必要）
   - SUPPLIER側の開発スケジュール確認

2. **重要事項説明書の署名欄廃止**
   - `verdandi/lib/document_sign/envelope.rb`の修正

3. **SUPから契約書情報連携時の事前送付処理追加**
   - `verdandi/app/models/contract.rb`の修正

4. **事前送付用メール送信処理の追加**
   - `verdandi/lib/document_sign/pre_delivery_envelope.rb`の新規作成
   - ⚠️ 新規実装要（署名欄なしのViewer役割で送信、既存のSigner役割とは異なる）

5. **DocumentSignFileクラスの拡張**
   - `verdandi/app/models/document_sign_file.rb`の修正

### 高優先度（リリース前に推奨）

6. **エラーハンドリングの強化**
   - `Rollbar.error`の追加
   - 担当営業への連携処理の実装

---

## 📝 注意事項

### 1. 既存処理の維持

- 既存のDocusign URL生成処理は変更不要
- マイページ側のDocusign処理は変更不要
- 実際の契約締結時の処理は維持

### 2. 署名欄の廃止

- 重要事項説明書の署名欄を廃止する
- 事前送付用のドキュメントには署名欄を含めない

### 3. サブリース契約書の送付

- 特定賃貸借物件の場合のみ、サブリース契約書を送付対象に含める
- **重要**: サブリース契約書には署名欄は不要（送付のみ、署名欄を含めない）
- 既存のサブリース契約書処理は署名欄ありのため、事前送付用には別処理が必要

### 4. RENOSYアカウントのメールアドレス取得

- **実装不要**: 既存の`contract.opportunity.mypage_registered_email`メソッドを使用
- メールアドレスが`nil`のケースは考慮不要（契約フェーズ以降の改修のため、メールアドレスが`nil`の場合は契約に進めない仕様）

### 5. トリガーの変更

- 契約認証から契約書類準備完了に変更
- SUPから契約書情報が連携されたタイミングで送信
- `contract_preparation`ステータスへの変更をトリガーに実装

