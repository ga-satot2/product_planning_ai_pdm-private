# Legal Workshop Management System（法務研修LMS）

このリポジトリで Agent が従う基本方針です。

## 基本方針

### 1. 実行結果を確認してから報告する

スクリプト・clasp・ツールを実行したあとは、**終了コードと出力を確認してから**ユーザーに結果を伝える。成功と誤認しない。失敗時はエラー内容と対処を報告する。

### 2. ドキュメント・成果物の品質（AI Slop 防止）

- 絵文字禁止（業務・技術ドキュメント・コミットメッセージ）
- 指示語（「これ」「その」）を避け、主語を明確に
- 事実ベースで、存在しない仕様を「ある」と書かない
- 生成後は簡潔にレビュー視点で確認（構成・事実・冗長・曖昧表現）

### 3. Git に機密を含めない

- `.env`、認証ファイル（credentials、*.pem、*.key 等）はコミット・push しない
- `.clasp.json` の scriptId は可。シークレットやトークンは含めない
- 新規ファイル追加時は `.gitignore` を確認する

### 4. GAS 編集後は push とテストを忘れずに

`documents/4_executing/development/` 配下の GAS（.gs、.html 等）を編集したら、次を行う。

1. **clasp push**: 対象プロジェクトのディレクトリで `clasp push` を実行する
2. **テスト**: `runUnitTests` や主要関数があれば `clasp run 関数名` で実行し、結果を確認する

報告する前に push とテストの結果を確認し、失敗時は修正してから報告する。

### 5. マルチエージェント協業（Claude Code / 複数 Agent 前提）

複数 Agent が同じリポジトリで作業するときの約束。

- **引き継ぎ**: 作業開始時は、直近のコミット（`git log -3 --oneline`）と必要なら `CHANGELOG.md` を確認し、前の担当の変更内容を把握してから手を付ける。
- **変更の明示**: 自分が変更したファイル・ディレクトリは、コミットメッセージに簡潔に書く。理由や影響範囲が分かるようにする。`CHANGELOG.md` に追記すると、次の Agent の引き継ぎがしやすい。
- **競合の回避**: 同じファイルを別 Agent が同時に編集しそうな場合は、まず該当ファイルの現状を読んでから編集する。大きな機能単位で分けられる場合は、担当範囲をコミットメッセージや PR 説明に書く。
- **コンテキストの境界**: 依頼が「別のプロジェクト」「別のリポジトリ」「これまでの会話と無関係な新規タスク」になったら、New Agent（新規チャット）で進めるよう案内する。続行を選んだ場合のみ当チャットで作業する。
- **単一の情報源**: 仕様・パス・手順はリポジトリ内のファイル（AGENTS.md、.cursor/rules、deployment.md、development/README.md）を優先して参照する。会話の記憶だけに頼らない。

---

## リポジトリ構成

- **ルート**: このリポジトリのルート
- **プロジェクト文書**: `documents/`（1_initiating ～ 6_closing、PMBOK フェーズ）
- **本番用 GAS**: `documents/4_executing/development/src/`
- **プロトタイプ**: `documents/4_executing/development/prototypes/`
- **スプレッドシート紐付けスクリプト**: `documents/4_executing/development/spreadsheet_bound_script/`
- **デプロイ手順**: `documents/4_executing/deployment.md`
- **開発クイックスタート**: `documents/4_executing/development/README.md`

パス一覧は `.cursor/rules/00_reference_paths.mdc` を参照。
