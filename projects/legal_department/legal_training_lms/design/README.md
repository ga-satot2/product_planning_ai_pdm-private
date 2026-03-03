# デザインデータ

デザイナーが管理するデザインシステム用データ。開発者は実装時にここを参照する。

## RENOSY カラースキーム

- **ファイル**: `renosy_color_scheme.json`
- **取得**: Figma MCP で RENOSY のカラーが定義された Figma ファイルの URL を指定し、`get_design_context` または `get_screenshot` を実行する。返却の色・CSS 変数などを `renosy_color_scheme.json` に反映し、`source_figma_url` と `updated_at` を記録する。現在の取得元: [Figma file 6PHuIH8Ocx5wc4EzPXKhPU, node 66321:7211](https://www.figma.com/file/6PHuIH8Ocx5wc4EzPXKhPU?node-id=66321-7211)。
- **利用**: 開発は `design/renosy_color_scheme.json` を参照し、スタイルやテーマに適用する。
