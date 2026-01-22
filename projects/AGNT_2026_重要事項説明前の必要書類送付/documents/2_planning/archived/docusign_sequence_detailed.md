# Docusign連携詳細シーケンス図

## 概要

重要事項説明の必要書類交付における、Docusign API連携を含む詳細な業務シーケンス図です。

## 詳細シーケンス図

```mermaid
sequenceDiagram
    participant SUP as SUPPLIER<br/>(CMS)
    participant AGNT_BE as AGNT<br/>(Backend/Verdandi)
    participant AGNT_FE as AGNT(Mypage)<br/>(Frontend)
    participant WEB as WEB動画システム
    participant 従業員 as 従業員
    participant 顧客 as 顧客
    participant 決済 as 決済システム
    participant DS_API as Docusign API<br/>(DocuSign_eSign)
    participant DS_UI as Docusign UI<br/>(docusign.net)

    Note over SUP,AGNT_BE: 【フェーズ1: 契約書・重要事項説明書の連携】
    SUP->>AGNT_BE: 1. 契約書・重要事項説明書データ送信<br/>(API連携)
    AGNT_BE->>AGNT_BE: 2. Contractモデルに保存<br/>DocumentSignFileとして管理

    Note over WEB,顧客: 【フェーズ2: Web面談での重要事項説明】
    従業員->>WEB: 3. MTG URL発行
    顧客->>WEB: 4. Web面談に参加
    従業員->>WEB: 5. Web面談に参加
    従業員->>WEB: 6. 重要事項説明書を画面表示・スクロール
    WEB->>顧客: 7. 書類を閲覧（PDF等を画面共有）
    顧客-->>従業員: 8. 両重説完了（形式的には）

    Note over 従業員,決済: 【フェーズ3: 手付金支払い】
    従業員->>顧客: 9. 手付金支払い依頼
    顧客->>決済: 10. 手付金支払い
    決済->>AGNT_BE: 11. 契約認証フラグON<br/>(Webhook/API連携)
    AGNT_BE->>AGNT_BE: 12. Opportunity.contract_authenticated = true

    Note over 従業員,AGNT_FE: 【フェーズ4: マイページ契約開始】
    従業員->>AGNT_FE: 13. 「マイページ契約」ボタン押下<br/>(管理画面操作)
    AGNT_FE->>AGNT_BE: 14. POST /document_sign_envelopes/create_from_mypage<br/>{contract_id: xxx}
    AGNT_BE->>AGNT_BE: 15. Contract.can_sign_request? チェック
    AGNT_BE->>DS_API: 16. DocumentSign::Envelope.new.send()<br/>create_envelope(ACCOUNT_ID, envelope_definition)
    Note right of DS_API: EnvelopeDefinition作成:<br/>- documents: 契約書・重要事項説明書PDF<br/>- recipients: 顧客情報<br/>- status: 'sent'
    DS_API-->>AGNT_BE: 17. Envelope作成成功<br/>{envelope_id: "xxx", status: "sent"}
    AGNT_BE->>AGNT_BE: 18. DocumentSignEnvelope作成<br/>(is_for_mypage: true, envelope_id保存)
    AGNT_BE->>AGNT_BE: 19. Opportunity.generate_document_sign_authentication_code<br/>(8桁英数字生成)
    AGNT_BE-->>AGNT_FE: 20. リダイレクト: マイページ契約画面

    Note over AGNT_FE,顧客: 【フェーズ5: 契約認証コード入力】
    AGNT_FE->>顧客: 21. 「契約をはじめる」ボタン表示<br/>(契約認証フラグON時のみ)
    顧客->>AGNT_FE: 22. 「契約をはじめる」ボタン押下<br/>(★契約認証)
    AGNT_FE->>AGNT_FE: 23. GET /investment/mypage/contracts/:id/documents/:contract_id/authentication
    AGNT_FE->>顧客: 24. 契約認証コード入力画面表示
    顧客->>AGNT_FE: 25. 認証コード入力<br/>(8桁英数字)
    AGNT_FE->>AGNT_FE: 26. JavaScript: contractAuthentication()<br/>入力検証

    Note over AGNT_FE,DS_UI: 【フェーズ6: Docusign URL生成とリダイレクト】
    AGNT_FE->>AGNT_FE: 27. POST /investment/mypage/contracts/:id/docusign/:contract_id<br/>{authentication_code: "xxxx"}
    AGNT_FE->>AGNT_FE: 28. Mypage::Contract.validate!(:authentication_code)<br/>(8桁英数字チェック)
    AGNT_FE->>AGNT_FE: 29. session["authentication_code_#{opportunity_id}"] = code
    AGNT_FE->>AGNT_BE: 30. POST /customer_api/v1/contracts/:contract_id/generate_docusign_url<br/>{account_id, authentication_code, redirect_url}
    AGNT_BE->>AGNT_BE: 31. Contract.generate_docusign_url_from_mypage(redirect_url)
    AGNT_BE->>AGNT_BE: 32. DocumentSignEnvelope.for_mypage.order(:id).last取得
    AGNT_BE->>AGNT_BE: 33. DocumentSignEnvelope.generate_recipient_view_url(redirect_url)
    AGNT_BE->>DS_API: 34. DocumentSign::Envelope.new<br/>create_recipient_view(ACCOUNT_ID, envelope_id, view_request)
    Note right of DS_API: RecipientViewRequest:<br/>- returnUrl: redirect_url<br/>- authenticationMethod: 'none'<br/>- email: 顧客メール<br/>- userName: 顧客名<br/>- clientUserId: customer_id
    DS_API-->>AGNT_BE: 35. {url: "https://demo.docusign.net/..."}
    AGNT_BE-->>AGNT_FE: 36. {url: "https://demo.docusign.net/..."}
    AGNT_FE->>DS_UI: 37. redirect_to docusign_url<br/>(allow_other_host: true)

    Note over 顧客,DS_UI: 【フェーズ7: Docusignでの書類サイン】
    DS_UI->>顧客: 38. 契約書・重要事項説明書プレビュー表示
    顧客->>DS_UI: 39. 書類確認・スクロール
    顧客->>DS_UI: 40. サイン実行
    DS_UI->>DS_API: 41. サイン処理
    DS_API->>DS_API: 42. Envelope status更新: 'Completed'

    Note over DS_API,AGNT_BE: 【フェーズ8: Docusignコールバック処理】
    DS_API->>AGNT_BE: 43. POST /api/docusign/v1/envelope/callback<br/>(XML形式: DocuSignEnvelopeInformation)
    AGNT_BE->>AGNT_BE: 44. CallbacksController#create<br/>XML解析: {Status: "Completed", EnvelopeID: "xxx"}
    AGNT_BE->>AGNT_BE: 45. DocumentSignEnvelope.find_by(envelope_id)
    alt is_for_mypage == false
        AGNT_BE->>AGNT_BE: 46. envelope.update_relations_after_signed
        AGNT_BE->>DS_API: 47. get_list_documents(envelope_id)
        DS_API-->>AGNT_BE: 48. documents情報
        AGNT_BE->>AGNT_BE: 49. envelope.save_signed_documents(documents_info)
    end
    AGNT_BE-->>DS_API: 50. HTTP 201 Created

    Note over AGNT_FE,顧客: 【フェーズ9: サイン完了後のリダイレクト】
    DS_UI->>AGNT_FE: 51. redirect to redirect_url<br/>(/investment/mypage/contracts/:id/docusign/:contract_id/callback)
    AGNT_FE->>AGNT_BE: 52. GET /investment/mypage/contracts/:id/docusign/:contract_id/callback<br/>{contract_id, event: "signing_complete"}
    AGNT_FE->>AGNT_BE: 53. Agnt::SignedCallbackResponse.fetch<br/>(contract_id, account_id)
    AGNT_BE->>AGNT_BE: 54. Contract.fetch_signed_docusign_documents<br/>(envelope_id取得 → Docusign API呼び出し)
    AGNT_BE->>DS_API: 55. get_envelope(envelope_id)
    DS_API-->>AGNT_BE: 56. Envelope情報 (status: "Completed")
    AGNT_BE->>DS_API: 57. get_list_documents(envelope_id)
    DS_API-->>AGNT_BE: 58. サイン済書類リスト
    AGNT_BE->>AGNT_BE: 59. DocumentSignEnvelope.save_signed_documents<br/>(DocumentSignFile作成)
    AGNT_BE-->>AGNT_FE: 60. サイン済書類情報
    AGNT_FE->>顧客: 61. 書類表示・ダウンロード画面<br/>(thanks_investment_mypage_contract_documents_path)
```

## 主要なAPIエンドポイント

### AGNT Backend (Verdandi)

1. **契約書作成（マイページ用）**
   - `POST /document_sign_envelopes/create_from_mypage`
   - パラメータ: `{contract_id: xxx}`
   - 処理: Docusign Envelope作成、認証コード生成

2. **Docusign URL生成**
   - `POST /customer_api/v1/contracts/:contract_id/generate_docusign_url`
   - パラメータ: `{account_id, authentication_code, redirect_url}`
   - レスポンス: `{url: "https://demo.docusign.net/..."}`

3. **Docusignコールバック**
   - `POST /api/docusign/v1/envelope/callback`
   - 形式: XML (DocuSignEnvelopeInformation)
   - 処理: Envelope status更新、サイン済書類保存

### AGNT Frontend (Mypage)

1. **契約認証画面**
   - `GET /investment/mypage/contracts/:id/documents/:contract_id/authentication`
   - 画面: 認証コード入力フォーム

2. **Docusign開始**
   - `POST /investment/mypage/contracts/:id/docusign/:contract_id`
   - パラメータ: `{authentication_code: "xxxx"}`

3. **Docusignコールバック処理**
   - `GET /investment/mypage/contracts/:id/docusign/:contract_id/callback`
   - パラメータ: `{contract_id, event}`

### Docusign API

1. **Envelope作成**
   - `POST /v2.1/accounts/{accountId}/envelopes`
   - メソッド: `DocumentSign::Envelope#send()`
   - 処理: `@envelopes_api.create_envelope(ACCOUNT_ID, envelope_definition)`

2. **Recipient View URL生成**
   - `POST /v2.1/accounts/{accountId}/envelopes/{envelopeId}/views/recipient`
   - メソッド: `DocumentSign::Envelope#generate_recipient_view_url()`
   - 処理: `@envelopes_api.create_recipient_view(ACCOUNT_ID, envelope_id, view_request)`

3. **Envelope情報取得**
   - `GET /v2.1/accounts/{accountId}/envelopes/{envelopeId}`
   - メソッド: `DocumentSign::Envelope#get()`

4. **書類リスト取得**
   - `GET /v2.1/accounts/{accountId}/envelopes/{envelopeId}/documents`
   - メソッド: `DocumentSign::Envelope#get_list_documents()`

## データフロー

### 契約書・重要事項説明書の流れ

1. **SUPPLIER → AGNT Backend**
   - SUPPLIERから契約書・重要事項説明書のPDFデータが送信される
   - AGNT Backendの`Contract`モデルに保存
   - `DocumentSignFile`として管理

2. **AGNT Backend → Docusign**
   - `DocumentSign::Envelope#send()`でEnvelope作成
   - PDFをBase64エンコードして`EnvelopeDefinition.documents`に設定
   - 顧客情報を`Recipients.signers`に設定

3. **Docusign → 顧客**
   - `create_recipient_view()`で生成されたURLにリダイレクト
   - 顧客がDocusign UIで書類を確認・サイン

4. **Docusign → AGNT Backend**
   - コールバック（XML形式）でサイン完了を通知
   - `get_list_documents()`でサイン済書類を取得
   - `DocumentSignFile`として保存

5. **AGNT Backend → AGNT Frontend**
   - サイン済書類をマイページで表示・ダウンロード可能にする

## 認証フロー

### 契約認証コード

1. **生成タイミング**
   - `create_from_mypage`実行時
   - `Opportunity.generate_document_sign_authentication_code`で8桁英数字を生成

2. **検証タイミング**
   - 顧客が「契約をはじめる」ボタン押下時
   - `Mypage::Contract.validate!(:authentication_code)`で検証
   - セッションに保存: `session["authentication_code_#{opportunity_id}"]`

3. **使用タイミング**
   - `generate_docusign_url` API呼び出し時に`authentication_code`パラメータとして送信
   - AGNT Backendで認証コードと契約IDの整合性を確認

## エラーハンドリング

### 認証コードエラー

- **形式エラー**: `ActiveModel::ValidationError` → 認証画面にリダイレクト（エラーメッセージ表示）
- **認証失敗**: `Agnt::ApiClient::Unauthorized` → 認証画面にリダイレクト（「確認コードが一致しません」）

### Docusign APIエラー

- **API呼び出し失敗**: `Agnt::ApiClient::ApiError` → エラーメッセージ表示、前の画面に戻る
- **コールバックエラー**: `StandardError` → Slack通知、HTTP 500返却

## 関連ファイル

### Backend (Verdandi)

- `app/models/contract.rb` - Contractモデル（Docusign連携ロジック）
- `app/models/document_sign_envelope.rb` - Envelopeモデル
- `app/controllers/document_sign_envelopes_controller.rb` - Envelope作成コントローラー
- `app/controllers/api/docusign/v1/envelope/callbacks_controller.rb` - コールバック処理
- `lib/document_sign/envelope.rb` - Docusign APIクライアント
- `config/routes.rb` - ルーティング定義

### Frontend (Mypage)

- `app/controllers/investment/mypage/contracts/docusign_controller.rb` - Docusignコントローラー
- `app/models/agnt/generate_docusign_url_response.rb` - URL生成APIクライアント
- `app/views/investment/mypage/contracts/documents/authentication.html.erb` - 認証画面
- `frontend/src/js/views/mypage/_contract_authentication.ts` - 認証コード入力検証

---

**作成日**: 2025-11-27  
**最終更新**: 2025-11-27  
**作成者**: {{env.USER_EMAIL}}

