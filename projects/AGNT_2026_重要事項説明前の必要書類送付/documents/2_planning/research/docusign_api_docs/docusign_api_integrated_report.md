# DocuSign API 統合レポート

**作成日**: 2025-11-26  
**作成者**: AIアシスタント  
**プロジェクト**: AGNT_2026_重要事項説明前の必要書類送付  


---

## 📋 目次

1. [概要](#概要)
2. [公式ドキュメントへのリンク](#公式ドキュメントへのリンク)
3. [重要な前提: テンプレートとエンベロープの関係](#重要な前提-テンプレートとエンベロープの関係)
4. [会議で議論された課題への回答と実現可能性判断](#会議で議論された課題への回答と実現可能性判断)
5. [APIエンドポイント詳細](#apiエンドポイント詳細)
6. [テンプレート使用 vs テンプレート不使用の比較](#テンプレート使用-vs-テンプレート不使用の比較)
7. [実装時の推奨事項](#実装時の推奨事項)
8. [実装時の注意事項](#実装時の注意事項)

---

## 概要

本レポートは、AGNTからDocuSign APIでテンプレートを用いて重要事項説明前の必要書類送付機能を実現するための統合ドキュメントです。

会議で議論された4つの課題について、実現可能性の判断と具体的な実装方法をまとめています。

---

## 公式ドキュメントへのリンク

### 主要なAPIドキュメント
- **How-to guides overview**: 
  - URL: https://developers.docusign.com/docs/esign-rest-api/how-to/

- **DocuSign eSignature REST API v2.1 ドキュメント**
  - URL: https://developers.docusign.com/docs/esign-rest-api/
  - 内容: APIの概要、エンドポイント、サンプルコード、認証方法など

- **DocuSign API クイックスタートガイド**
  - URL: https://developers.docusign.com/docs/esign-rest-api/esign101/
  - 内容: 基本的なAPIの使い方、認証、エンベロープ作成のチュートリアル

- **DocuSign API How-To ガイド（実装方法）**
  - URL: https://developers.docusign.com/docs/esign-rest-api/how-to/
  - 内容: **AGNTからDocuSignをAPIで操作し、テンプレートを用いて実現したいことが可能か判断するためのリファレンス**
  - 含まれる内容:
    - テンプレートの作成と管理
    - テンプレートからエンベロープを作成する方法
    - エンベロープのステータス管理方法
    - エンベロープの再送方法
    - テンプレートとエンベロープの関係
    - 実装例とサンプルコード

- **DocuSign API リファレンス（全エンドポイント）**
  - URL: https://developers.docusign.com/docs/esign-rest-api/reference/
  - 内容: すべてのAPIエンドポイントの詳細な仕様

### その他の参考資料

- **PostmanによるDocuSign eSignature APIの呼び出し**
  - URL: https://www.docusign.com/ja-jp/blog/developers/how-to-use-the-DocuSign-eSignature-Postman-collection
  - 内容: Postmanコレクションを使用したAPIテスト方法

- **DocuSign API のルールと制限**
  - URL: https://help.liferay.com/hc/ja/articles/23697121910029-DocuSign-API-%E3%81%AE%E3%83%AB%E3%83%BC%E3%83%AB%E3%81%A8%E5%88%B6%E9%99%90
  - 内容: APIの使用制限、レート制限、ベストプラクティス

---

## 重要な前提: テンプレートとエンベロープの関係

### テンプレートとは

- 再利用可能な設計図（テンプレート自体には「ステータス」や「進行状況」の概念はない）
- テンプレート自体を送信することはできない
- テンプレートから**エンベロープ**を作成して送信する

### エンベロープとは

- テンプレートから作成される実際の送信オブジェクト
- エンベロープには「ステータス」や「進行状況」がある
- ステータス管理、再送、Webhookなどの操作は**エンベロープ**に対して行う

### 結論

以下のAPIエンドポイントは、**テンプレートから作成されたエンベロープ**に対してすべて適用可能です。

### テンプレートとエンベロープの特徴比較

| 項目 | テンプレート | エンベロープ（テンプレートから作成） |
|------|------------|--------------------------------|
| **ステータス管理** | ❌ 進行ステータス管理の概念がない（メタデータは取得可能） | ✅ ステータスを取得・管理可能 |
| **再送** | ❌ 再送することはできない | ✅ 再送可能 |
| **送信** | ❌ 送信することはできない | ✅ 送信可能 |
| **作成** | ✅ 作成可能 | ✅ 作成可能 |
| **更新** | ✅ 更新可能（既存エンベロープには影響しない） | ✅ 内容を更新可能 |
| **削除** | ✅ 削除可能（既存エンベロープには影響しない） | ✅ 無効化可能 |
| **取得** | ✅ 詳細情報を取得可能 | ✅ 詳細情報を取得可能 |
| **Webhook** | ❌ 該当なし | ✅ 状態変更をリアルタイムで追跡可能 |

---

## 会議で議論された課題への回答と実現可能性判断

### ① ワークフロー進行ステータス管理

**課題**: テンプレートがワークフロー的な場合の進行ステータスをどうやって取得・管理していくのか不明

**判断**: ✅ **実現可能**

**回答**: テンプレート自体にはステータス管理の概念はありませんが、**テンプレートから作成されたエンベロープ**に対して以下のAPIエンドポイントを使用してステータス管理が可能です。

**関連APIエンドポイント**:

1. **エンベロープステータスの取得**
   - `GET /accounts/{accountId}/envelopes/{envelopeId}`
   - エンベロープ全体のステータスを取得
   - レスポンスに `status` フィールドが含まれる（例: `sent`, `delivered`, `completed`, `declined`）

2. **受信者ステータスの取得**
   - `GET /accounts/{accountId}/envelopes/{envelopeId}/recipients`
   - 各受信者のステータスを取得
   - レスポンスに各受信者の `status` フィールドが含まれる（例: `sent`, `delivered`, `signed`, `declined`）

3. **エンベロープイベントの取得**
   - `GET /accounts/{accountId}/envelopes/{envelopeId}/audit_events`
   - エンベロープのイベント履歴を取得
   - 各ステップの完了状況を追跡可能

4. **Webhook（イベント通知）の設定**
   - `POST /accounts/{accountId}/connect/envelopes`
   - エンベロープの状態変更時に自動通知を受信
   - ワークフロー進行をリアルタイムで追跡可能

**実装方法**:
- エンベロープ作成時に `envelopeId` を保存
- 定期的に `GET /accounts/{accountId}/envelopes/{envelopeId}` でステータスを取得
- または、Webhookを設定してリアルタイムでステータス変更を取得

**推奨アプローチ**: **Webhookを使用したリアルタイム追跡**を推奨
- ポーリング方式よりも効率的
- リアルタイムでステータス変更を取得可能
- サーバー負荷を軽減

**参考ドキュメント**:
- DocuSign API How-To ガイド: https://developers.docusign.com/docs/esign-rest-api/how-to/
- Envelopes API Reference: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/Envelopes/
- EnvelopeRecipients API Reference: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/EnvelopeRecipients/
- Connect (Webhooks) API Reference: https://developers.docusign.com/docs/esign-rest-api/reference/Connect/

---

### ② 再送機能の実装

**課題**: 再送するときはどうやってやるのかイメージがわいていない

**判断**: ✅ **実現可能**

**回答**: テンプレート自体を再送することはできませんが、**テンプレートから作成されたエンベロープ**に対して以下のAPIエンドポイントを使用して再送が可能です。

**関連APIエンドポイント**:

1. **エンベロープの再送**
   - `PUT /accounts/{accountId}/envelopes/{envelopeId}/recipients`
   - 受信者情報を更新して再送
   - 既存の受信者を更新するか、新しい受信者を追加可能

2. **通知の再送**
   - `POST /accounts/{accountId}/envelopes/{envelopeId}/recipients/{recipientId}/resend`
   - 特定の受信者に通知を再送
   - エンベロープ全体を再送するのではなく、通知のみ再送可能

3. **エンベロープの修正**
   - `PUT /accounts/{accountId}/envelopes/{envelopeId}`
   - エンベロープの内容を修正して再送
   - 受信者の追加・削除、文書の追加・削除が可能

**実装方法**:
- 受信者情報を更新して再送: `PUT /accounts/{accountId}/envelopes/{envelopeId}/recipients`
- 通知のみ再送: `POST /accounts/{accountId}/envelopes/{envelopeId}/recipients/{recipientId}/resend`
- エンベロープ内容を修正して再送: `PUT /accounts/{accountId}/envelopes/{envelopeId}`

**推奨アプローチ**: **通知の再送** (`POST /accounts/{accountId}/envelopes/{envelopeId}/recipients/{recipientId}/resend`) を推奨
- エンベロープ全体を再送するのではなく、通知のみ再送可能
- より軽量で効率的

**参考ドキュメント**:
- DocuSign API How-To ガイド: https://developers.docusign.com/docs/esign-rest-api/how-to/
- EnvelopeRecipients API Reference: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/EnvelopeRecipients/
- Envelopes API Reference: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/Envelopes/

---

### ③ UI作成時のAPIトリガー連携

**課題**: UIで作るときはAPIトリガーを複数回叩く想定だが、何を指定するのかイメージがわいていない

**判断**: ✅ **実現可能**

**関連APIエンドポイント**:

1. **テンプレートの一覧取得**
   - `GET /accounts/{accountId}/templates`
   - 利用可能なテンプレートの一覧を取得
   - UIでテンプレート選択時に使用

2. **テンプレートの取得**
   - `GET /accounts/{accountId}/templates/{templateId}`
   - テンプレートの詳細情報を取得
   - テンプレート内のフィールドや受信者情報を確認

3. **エンベロープの作成（テンプレートから）**
   - `POST /accounts/{accountId}/envelopes`
   - リクエストボディに `templateId` を指定
   - `templateRoles` で受信者情報を指定

4. **エンベロープの送信**
   - `PUT /accounts/{accountId}/envelopes/{envelopeId}` (status: `sent`)
   - または `POST /accounts/{accountId}/envelopes` の `status` を `sent` に設定

**典型的なUI作成フロー**:
1. テンプレート一覧を取得 → `GET /accounts/{accountId}/templates`
2. 選択したテンプレートの詳細を取得 → `GET /accounts/{accountId}/templates/{templateId}`
3. エンベロープを作成（ドラフト状態） → `POST /accounts/{accountId}/envelopes` (status: `created`)
4. 必要に応じてフィールドを設定 → `POST /accounts/{accountId}/envelopes/{envelopeId}/documents/{documentId}/fields`
5. エンベロープを送信 → `PUT /accounts/{accountId}/envelopes/{envelopeId}` (status: `sent`)

**各API呼び出しで指定すべきパラメータ**:
- テンプレートからエンベロープ作成時: `templateId`, `templateRoles` を指定
- エンベロープ作成時: `status: "created"` でドラフト状態で作成可能
- エンベロープ送信時: `status: "sent"` で送信可能

**推奨アプローチ**: **ドラフト状態でエンベロープを作成**してから送信する方式を推奨
- ユーザーが内容を確認してから送信可能
- エラーハンドリングが容易

**参考ドキュメント**:
- DocuSign API How-To ガイド: https://developers.docusign.com/docs/esign-rest-api/how-to/
- Create Envelope (テンプレートから作成): https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/Envelopes/create/
- Templates API Reference: https://developers.docusign.com/docs/esign-rest-api/reference/templates/templates/
- Envelopes API Reference: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/Envelopes/

---

### ④ テンプレート変更時のエンベロープへの影響

**課題**: テンプレートを作った後にエンベロープ生成して、そのテンプレートが変更されたらどうなるのか？

**判断**: ✅ **実現可能（明確な動作が定義されている）**

**重要なポイント**:

1. **エンベロープ生成時のテンプレートスナップショット**
   - エンベロープを作成する際、テンプレートの内容がエンベロープにコピーされる
   - エンベロープは独立したオブジェクトとして存在する
   - テンプレートの変更は、**既存のエンベロープには影響しない**

2. **テンプレートの更新**
   - `PUT /accounts/{accountId}/templates/{templateId}` でテンプレートを更新可能
   - 更新後のテンプレートは、**新規作成されるエンベロープにのみ反映される**

3. **エンベロープの修正**
   - 既存のエンベロープを修正する場合は、エンベロープ自体を更新する必要がある
   - `PUT /accounts/{accountId}/envelopes/{envelopeId}`
   - テンプレートの変更を既存エンベロープに反映するには、エンベロープを修正する必要がある

**実装時の注意事項**:
- テンプレート変更後も既存エンベロープは独立して存在するため、既存エンベロープの管理は継続可能
- 新規エンベロープを作成する際は、更新後のテンプレートが使用される
- 既存エンベロープにテンプレートの変更を反映したい場合は、エンベロープ自体を修正する必要がある

**推奨アプローチ**: **テンプレートとエンベロープの独立性を理解**して実装
- 既存エンベロープは独立して存在するため、テンプレート変更の影響を受けない
- 新規エンベロープ作成時のみ、更新後のテンプレートが使用される

**参考ドキュメント**:
- DocuSign API How-To ガイド: https://developers.docusign.com/docs/esign-rest-api/how-to/
- Templates 概念ガイド: https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/templates/
- Templates API Reference: https://developers.docusign.com/docs/esign-rest-api/reference/templates/templates/

---

## 📊 実現可能性の総合判断

| 課題 | 実現可能性 | 実装の複雑度 | 備考 |
|------|----------|------------|------|
| ① ワークフロー進行ステータス管理 | ✅ 実現可能 | 中 | Webhookを使用することで効率的に実装可能 |
| ② 再送機能の実装 | ✅ 実現可能 | 低 | 明確なAPIエンドポイントが存在 |
| ③ UI作成時のAPIトリガー連携 | ✅ 実現可能 | 中 | 典型的なフローが明確に定義されている |
| ④ テンプレート変更時のエンベロープへの影響 | ✅ 実現可能（動作が明確） | 低 | 動作が明確に定義されている |

**総合判断**: ✅ **すべての課題について、DocuSign APIで実現可能**

---

## APIエンドポイント詳細

### エンベロープ管理

#### エンベロープの作成（テンプレートから）

**エンドポイント**: `POST /accounts/{accountId}/envelopes`

**リクエスト例**:
```json
{
  "templateId": "template-id-here",
  "status": "sent",
  "templateRoles": [
    {
      "email": "recipient@example.com",
      "name": "Recipient Name",
      "roleName": "Signer",
      "routingOrder": "1"
    }
  ],
  "emailSubject": "重要事項説明前の必要書類",
  "emailBlurb": "ご確認をお願いいたします。"
}
```

**レスポンス例**:
```json
{
  "envelopeId": "envelope-id-here",
  "status": "sent",
  "statusDateTime": "2025-11-26T10:00:00Z",
  "uri": "/envelopes/envelope-id-here"
}
```

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/Envelopes/create/

---

#### エンベロープの取得

**エンドポイント**: `GET /accounts/{accountId}/envelopes/{envelopeId}`

**レスポンス例**:
```json
{
  "envelopeId": "envelope-id-here",
  "status": "completed",
  "statusDateTime": "2025-11-26T10:30:00Z",
  "documentsUri": "/envelopes/envelope-id-here/documents",
  "recipientsUri": "/envelopes/envelope-id-here/recipients",
  "attachmentsUri": "/envelopes/envelope-id-here/attachments",
  "envelopeUri": "/envelopes/envelope-id-here"
}
```

**ステータスの種類**:
- `created`: 作成済み（ドラフト）
- `sent`: 送信済み
- `delivered`: 配信済み
- `completed`: 完了
- `declined`: 拒否
- `voided`: 無効化
- `correct`: 修正中

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/Envelopes/get/

---

#### エンベロープの修正

**エンドポイント**: `PUT /accounts/{accountId}/envelopes/{envelopeId}`

**リクエスト例**:
```json
{
  "status": "sent",
  "recipients": {
    "signers": [
      {
        "email": "new-recipient@example.com",
        "name": "New Recipient",
        "recipientId": "1",
        "routingOrder": "1"
      }
    ]
  }
}
```

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/Envelopes/update/

---

### テンプレート管理

#### テンプレートの一覧取得

**エンドポイント**: `GET /accounts/{accountId}/templates`

**クエリパラメータ**:
- `search_text`: テンプレート名で検索
- `order_by`: ソート順（例: `name`, `created`)
- `order`: 昇順/降順（`asc`, `desc`）
- `count`: 取得件数
- `start_position`: 開始位置

**レスポンス例**:
```json
{
  "envelopeTemplates": [
    {
      "templateId": "template-id-1",
      "name": "重要事項説明書類",
      "description": "重要事項説明前の必要書類送付用テンプレート",
      "created": "2025-11-01T10:00:00Z",
      "modified": "2025-11-20T15:00:00Z"
    }
  ],
  "resultSetSize": 1,
  "totalSetSize": 1,
  "startPosition": 0
}
```

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/templates/templates/list/

---

#### テンプレートの詳細取得

**エンドポイント**: `GET /accounts/{accountId}/templates/{templateId}`

**取得可能な情報**:
- テンプレート名、説明
- 作成日時、更新日時
- テンプレート内の文書情報
- テンプレート内の受信者情報（役割名、ルーティング順序など）
- テンプレート内のフィールド情報

**レスポンス例**:
```json
{
  "templateId": "template-id-here",
  "name": "重要事項説明書類",
  "description": "重要事項説明前の必要書類送付用テンプレート",
  "created": "2025-11-01T10:00:00Z",
  "modified": "2025-11-20T15:00:00Z",
  "documents": [
    {
      "documentId": "1",
      "name": "重要事項説明書.pdf",
      "fileExtension": "pdf"
    }
  ],
  "recipients": {
    "signers": [
      {
        "recipientId": "1",
        "roleName": "Signer",
        "routingOrder": "1",
        "name": "{{SignerName}}",
        "email": "{{SignerEmail}}"
      }
    ]
  }
}
```

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/templates/templates/get/

---

#### テンプレートの作成

**エンドポイント**: `POST /accounts/{accountId}/templates`

**リクエスト例**:
```json
{
  "name": "重要事項説明書類",
  "description": "重要事項説明前の必要書類送付用テンプレート",
  "documents": [
    {
      "documentBase64": "base64-encoded-pdf-content",
      "name": "重要事項説明書.pdf",
      "fileExtension": "pdf",
      "documentId": "1"
    }
  ],
  "recipients": {
    "signers": [
      {
        "recipientId": "1",
        "roleName": "Signer",
        "routingOrder": "1"
      }
    ]
  },
  "emailSubject": "重要事項説明前の必要書類",
  "emailBlurb": "ご確認をお願いいたします。"
}
```

**レスポンス例**:
```json
{
  "templateId": "template-id-here",
  "name": "重要事項説明書類",
  "uri": "/templates/template-id-here"
}
```

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/templates/templates/create/

---

#### テンプレートの更新

**エンドポイント**: `PUT /accounts/{accountId}/templates/{templateId}`

**リクエスト例**:
```json
{
  "name": "重要事項説明書類（更新版）",
  "description": "更新されたテンプレート",
  "documents": [
    {
      "documentId": "1",
      "name": "重要事項説明書_v2.pdf",
      "fileExtension": "pdf",
      "documentBase64": "base64-encoded-pdf-content"
    }
  ],
  "recipients": {
    "signers": [
      {
        "recipientId": "1",
        "roleName": "Signer",
        "routingOrder": "1"
      }
    ]
  }
}
```

**重要な注意事項**:
- テンプレートを更新しても、**既存のエンベロープには影響しない**
- テンプレートの変更は、**新規作成されるエンベロープにのみ反映される**

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/templates/templates/

---

#### テンプレートの削除

**エンドポイント**: `DELETE /accounts/{accountId}/templates/{templateId}`

**レスポンス例**:
```json
{
  "templateId": "template-id-here"
}
```

**重要な注意事項**:
- テンプレートを削除しても、**既存のエンベロープには影響しない**
  - **根拠**: エンベロープ作成時にテンプレートの内容がエンベロープにコピーされ、エンベロープは独立したオブジェクトとして存在するため
- 削除されたテンプレートからは、新しいエンベロープを作成できなくなる

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/templates/templates/

---

### 受信者管理

#### 受信者の取得

**エンドポイント**: `GET /accounts/{accountId}/envelopes/{envelopeId}/recipients`

**レスポンス例**:
```json
{
  "signers": [
    {
      "recipientId": "1",
      "name": "Recipient Name",
      "email": "recipient@example.com",
      "status": "completed",
      "signedDateTime": "2025-11-26T10:30:00Z",
      "routingOrder": "1"
    }
  ],
  "recipientsCount": 1
}
```

**ステータスの種類**:
- `created`: 作成済み
- `sent`: 送信済み
- `delivered`: 配信済み
- `signed`: 署名済み
- `completed`: 完了
- `declined`: 拒否
- `voided`: 無効化

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/EnvelopeRecipients/list/

---

#### 受信者の更新（再送）

**エンドポイント**: `PUT /accounts/{accountId}/envelopes/{envelopeId}/recipients`

**リクエスト例**:
```json
{
  "signers": [
    {
      "recipientId": "1",
      "email": "new-email@example.com",
      "name": "New Recipient Name",
      "routingOrder": "1"
    }
  ]
}
```

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/EnvelopeRecipients/update/

---

#### 通知の再送

**エンドポイント**: `POST /accounts/{accountId}/envelopes/{envelopeId}/recipients/{recipientId}/resend`

**リクエスト例**:
```json
{
  "resendEnvelope": true
}
```

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/EnvelopeRecipients/resend/

---

### ステータス管理

#### エンベロープイベントの取得

**エンドポイント**: `GET /accounts/{accountId}/envelopes/{envelopeId}/audit_events`

**レスポンス例**:
```json
{
  "auditEvents": [
    {
      "eventFields": [
        {
          "name": "Event",
          "value": "Envelope Sent"
        },
        {
          "name": "User",
          "value": "sender@example.com"
        },
        {
          "name": "DateTime",
          "value": "2025-11-26T10:00:00Z"
        }
      ]
    }
  ]
}
```

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/Envelopes/EnvelopeAuditEvents/get/

---

### Webhook設定

#### Connect（Webhook）の設定

**エンドポイント**: `POST /accounts/{accountId}/connect/envelopes`

**リクエスト例**:
```json
{
  "url": "https://your-app.com/docusign/webhook",
  "envelopeEvents": [
    {
      "envelopeEventStatusCode": "sent",
      "includeDocuments": false
    },
    {
      "envelopeEventStatusCode": "delivered",
      "includeDocuments": false
    },
    {
      "envelopeEventStatusCode": "completed",
      "includeDocuments": true
    },
    {
      "envelopeEventStatusCode": "declined",
      "includeDocuments": false
    }
  ],
  "includeData": [
    "envelopes",
    "recipients",
    "documents"
  ]
}
```

**イベントの種類**:
- `sent`: エンベロープ送信時
- `delivered`: エンベロープ配信時
- `completed`: エンベロープ完了時
- `declined`: エンベロープ拒否時
- `voided`: エンベロープ無効化時
- `correct`: エンベロープ修正時

**参考**: https://developers.docusign.com/docs/esign-rest-api/reference/Connect/

---

## テンプレート使用 vs テンプレート不使用の比較

### 実現可能性と実装の複雑度の比較

| 課題 | テンプレート使用 | テンプレート不使用 | 推奨 |
|------|----------------|------------------|------|
| ① ワークフロー進行ステータス管理 | ✅ 実現可能（複雑度: 中） | ✅ 実現可能（複雑度: 中） | どちらも同等 |
| ② 再送機能の実装 | ✅ 実現可能（複雑度: 低） | ✅ 実現可能（複雑度: 低） | どちらも同等 |
| ③ UI作成時のAPIトリガー連携 | ✅ 実現可能（複雑度: 中） | ✅ 実現可能（複雑度: 高） | **テンプレート使用を推奨** |
| ④ テンプレート変更時のエンベロープへの影響 | ✅ 動作が明確（複雑度: 低） | ✅ 該当なし | テンプレート不使用の方がシンプル |

**注**: 「複雑度: 高」は「実装の複雑度が高い（実装が難しい）」という意味です。実現可能性自体はどちらも同等ですが、テンプレート不使用の方が実装が複雑になります。

### 観点別の実装の複雑度比較

| 観点 | テンプレート使用 | テンプレート不使用 |
|------|----------------|------------------|
| **エンベロープ作成の複雑度** | 低（テンプレート情報を自動適用） | 高（文書、受信者、フィールドを個別に指定） |
| **フィールド配置の複雑度** | 低（テンプレート内で事前定義） | 高（座標で個別に指定） |
| **API呼び出し回数** | 少ない（テンプレート情報を再利用） | 多い（各エンベロープごとに詳細を指定） |
| **保守性** | 高い（テンプレート変更で一括更新可能） | 低（各エンベロープを個別に更新） |
| **柔軟性** | 中（テンプレートに依存） | 高（各エンベロープごとに自由に設定可能） |

### 推奨アプローチ

**テンプレート使用を推奨する理由**:

1. **実装の複雑度が低い**
   - テンプレートを使用することで、エンベロープ作成時の設定が簡素化される
   - フィールドの配置がテンプレート内で事前定義されているため、座標指定が不要

2. **保守性が高い**
   - テンプレートを更新することで、新規作成されるエンベロープに一括で反映される
   - テンプレート不使用の場合、各エンベロープを個別に更新する必要がある

3. **API呼び出し回数が少ない**
   - テンプレート情報を再利用できるため、API呼び出し回数が削減される
   - テンプレート不使用の場合、各エンベロープごとに詳細を指定する必要がある

**テンプレート不使用が適している場合**:

1. **各エンベロープごとに大幅に異なる設定が必要な場合**
   - テンプレートでは対応できない特殊な要件がある場合

2. **テンプレート管理のオーバーヘッドが大きい場合**
   - テンプレート数が非常に多く、管理が困難な場合

3. **動的な文書生成が必要な場合**
   - エンベロープ作成時に動的に文書を生成する必要がある場合

---

## 実装時の推奨事項

### 1. ワークフロー進行ステータス管理

**推奨アプローチ**: **Webhookを使用したリアルタイム追跡**

**実装手順**:
1. WebhookエンドポイントをAGNT側に実装
2. `POST /accounts/{accountId}/connect/envelopes` でWebhookを設定
3. エンベロープの状態変更時にAGNT側で処理

**メリット**:
- ポーリング方式よりも効率的
- リアルタイムでステータス変更を取得可能
- サーバー負荷を軽減

---

### 2. 再送機能の実装

**推奨アプローチ**: **通知の再送** (`POST /accounts/{accountId}/envelopes/{envelopeId}/recipients/{recipientId}/resend`)

**実装手順**:
1. 再送が必要な受信者の `recipientId` を特定
2. `POST /accounts/{accountId}/envelopes/{envelopeId}/recipients/{recipientId}/resend` を実行

**メリット**:
- エンベロープ全体を再送するのではなく、通知のみ再送可能
- より軽量で効率的

---

### 3. UI作成時のAPIトリガー連携

**推奨アプローチ**: **ドラフト状態でエンベロープを作成**してから送信する方式

**実装手順**:
1. テンプレート一覧を取得してユーザーに表示
2. ユーザーがテンプレートを選択
3. エンベロープをドラフト状態で作成（`status: "created"`）
4. 必要に応じてフィールドを設定
5. ユーザーが確認後、エンベロープを送信（`status: "sent"`）

**メリット**:
- ユーザーが内容を確認してから送信可能
- エラーハンドリングが容易

---

### 4. テンプレート変更時のエンベロープへの影響

**推奨アプローチ**: **テンプレートとエンベロープの独立性を理解**して実装

**実装時の注意事項**:
- テンプレート変更後も既存エンベロープの管理は継続可能
- 既存エンベロープにテンプレートの変更を反映したい場合は、エンベロープ自体を修正する必要がある

---

## 実装時の注意事項

### 認証方法

**OAuth 2.0認証**:
- DocuSign APIはOAuth 2.0を使用した認証をサポート
- 認証フロー: 認証コード取得 → アクセストークン取得 → APIリクエストにアクセストークンを付与

**参考**: https://developers.docusign.com/docs/esign-rest-api/esign101/

---

### エラーハンドリング

**エラーレスポンス例**:
```json
{
  "errorCode": "INVALID_REQUEST_PARAMETER",
  "message": "The request contained at least one invalid parameter."
}
```

**主要なエラーコード**:
- `INVALID_REQUEST_PARAMETER`: リクエストパラメータが無効
- `ENVELOPE_NOT_FOUND`: エンベロープが見つからない
- `TEMPLATE_NOT_FOUND`: テンプレートが見つからない
- `INVALID_RECIPIENT`: 受信者情報が無効
- `RATE_LIMIT_EXCEEDED`: レート制限超過

**参考**: https://developers.docusign.com/docs/esign-rest-api/esign101/

---

### レート制限

**レスポンスヘッダー**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000
```

**レート制限の種類**:
- **Per User**: ユーザーごとの制限
- **Per Application**: アプリケーションごとの制限
- **Per Account**: アカウントごとの制限

**参考**: https://developers.docusign.com/docs/esign-rest-api/esign101/

---

### ベストプラクティス

1. **Webhookの活用**: エンベロープの状態変更をリアルタイムで追跡
2. **バッチ処理**: 大量のエンベロープを処理する場合は、バッチ処理を検討
3. **エラーハンドリング**: 適切なエラーハンドリングとリトライロジックの実装
4. **セキュリティ**: アクセストークンの適切な管理と保護

---

## 📝 次のステップ

1. **DocuSign API How-To ガイドの詳細確認**
   - https://developers.docusign.com/docs/esign-rest-api/how-to/
   - 実装例とサンプルコードを確認

2. **Postmanコレクションの活用**
   - DocuSignのPostmanコレクションを使用してAPIをテスト
   - 実際のAPIリクエスト/レスポンスを確認

3. **サンドボックス環境でのテスト**
   - DocuSignのサンドボックス環境でAPIをテスト
   - 各課題の実装可能性を実際に確認

4. **実装計画の策定**
   - 各課題に対する実装方針を決定
   - APIエンドポイントの選定と実装順序の決定

5. **開発チームとの共有**
   - 実現可能性の判断結果を開発チームと共有
   - 実装方針について合意形成

---

**最終更新**: 2025-11-26

