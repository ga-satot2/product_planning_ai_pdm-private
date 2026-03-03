# LMS プロジェクト用サブエージェント

法務研修LMS（legal_training_lms）配下で利用する専用エージェント一覧です。

**ユーザーとの会話の相手**: **lms-manager**（LMSマネージャー）。ユーザーはこのエージェントと会話し、マネージャーが要件定義者・デザイナー・実装者・テストランナー・ユーザー部門を管理し、意思決定と委譲を行う。

| エージェント | ファイル | 主な用途 |
|-------------|----------|----------|
| **LMSマネージャー** | lms-manager.md | **ユーザーと会話する窓口**。他エージェントの管理・意思決定・委譲・報告 |
| 要件定義者 | requirements-definer.md | PRD・要件の作成・更新。**納品まで自律駆動**（納品ロードマップ更新、他エージェントへの依頼） |
| デザイナー | designer.md | Webアプリの画面・導線・UIの設計・改善 |
| プログラム実装者 | implementer.md | 実装のとりまとめ。必要に応じて backend / frontend に委譲 |
| 実装者（バックエンド） | implementer-backend.md | .gs の実装（webapp.gs, api_endpoint.gs, データ層・Spreadsheet/Calendar） |
| 実装者（フロントエンド） | implementer-frontend.md | .html の実装（テンプレート・フォーム・クライアント側挙動） |
| テストランナー | test-runner.md | 検証手順の実行・テスト設計・結果記録 |
| ユーザー部門 | user-department.md | 引き渡し・利用開始マニュアル・ロールアウトの確認 |

**使い方**: ユーザーは「lms-manager で」「LMSマネージャーと話したい」などと指定すると、マネージャーが会話の相手となり、納品の進め方・タスクの振り分け・優先度の決定を行う。個別の役割に直接依頼したい場合は「requirements-definer で〜」「test-runner で〜」のように指定する。

**参照**: サブエージェントの作成ルールは `~/.cursor/skills-cursor/create-subagent/SKILL.md` を参照。
