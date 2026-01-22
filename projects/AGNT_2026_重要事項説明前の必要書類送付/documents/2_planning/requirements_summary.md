# AGNT 2026 重要事項説明前の必要書類送付 要件定義

**プロジェクト名**: AGNT 2026 重要事項説明前の必要書類送付  
**ドキュメント種別**: 要件定義サマリー  
**作成日**: 2025-12-10  
**最終更新**: 2025-12-10  
**出典**: [Confluence - AGNT 2026 重要事項説明前の必要書類送付 要件定義](https://ga-tech.atlassian.net/wiki/spaces/AGNT/pages/5220368412/AGNT+2026+%E9%87%8D%E8%A6%81%E4%BA%8B%E9%A0%85%E8%AA%AC%E6%98%8E%E5%89%8D%E3%81%AE%E5%BF%85%E8%A6%81%E6%9B%B8%E9%A1%9E%E9%80%81%E4%BB%98+%E8%A6%81%E4%BB%B6%E5%AE%9A%E7%BE%A9)

---

## ドキュサイン連携部分

| **機能** | **トリガー** | **技術的内容・補足** |
| --- | --- | --- |
| 事前送付（重説のみ） | SUPでの契約準備完了 | この段階ですべてのドキュメントを設定してドキュサインに連携。<br>ワークフロー機能によって本送付を一時停止した状態にする。 |
| 本送付（重説以外すべて） | AGNT契約詳細から「マイページ契約」押下 | 一時停止したワークフローを停止解除することで契約書などが送信される。 |
| 顧客が重説を閲覧していないと契約ボタンを押せないようにする | 契約詳細ページを開いた時 | このAPIを使ってRecipientsのステータスを確認する<br>[listRecipients REST API](https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/enveloperecipients/list/)<br>`completed`じゃなければNGにする処理を追加 |
| 重説の署名印字を削除する | SUPでの契約準備完了<br>→ドキュサインへ連携している処理の中で行なっている | AGNT側で座標指定で印字を行なっており、該当コードを削除する |

---

## 参考資料

* [開発要件定義書（DocuSign）](./development_requirements_docusign.md)
* [プロジェクト概要書](./project_overview.md)



















