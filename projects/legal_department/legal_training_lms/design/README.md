# デザインデータ

デザイナーが管理するデザインシステム用データ。開発者は実装時にここを参照する。

## RENOSY カラースキーム

- **ファイル**: `renosy_color_scheme.json`
- **取得**: Figma MCP で RENOSY のカラーが定義された Figma ファイルの URL（例: figma.com/design/&lt;fileKey&gt;/...）を指定し、`get_design_context` または `get_metadata` を実行する。返却の色・CSS 変数などを `renosy_color_scheme.json` の `colors` / `css_variables` に反映し、`source_figma_url` と `updated_at` を記録する。RENOSY の Figma URL を共有いただければ、Agent が取得してこのファイルを更新する。
- **利用**: 開発は `design/renosy_color_scheme.json` を参照し、スタイルやテーマに適用する。
