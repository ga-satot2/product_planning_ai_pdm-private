# 法務研修LMS - 開発ディレクトリ

**プロジェクト**: 法務研修LMSシステム  
**作成日**: 2025-11-14

---

## 📁 ディレクトリ構造

```
development/
├── README.md               # このファイル
├── prototypes/             # プロトタイプコード（GASスクリプト）
│   ├── *.gs               # Google Apps Scriptファイル
│   ├── *.csv              # データファイル
│   ├── README.md          # プロトタイプ説明
│   ├── docs/              # ドキュメント
│   │   ├── prototype_progress.md
│   │   ├── CLASP_SETUP.md
│   │   ├── GOOGLE_API_SETUP.md
│   │   └── SLACK_CONFIG.md
│   ├── config/             # 設定ファイル
│   │   ├── .clasp.json.template
│   │   └── .claspignore
│   └── scripts/            # スクリプト
│       ├── deploy.sh
│       └── setup_clasp.sh
└── src/                    # ソースコード（本番用）
    ├── appsscript.json     # Apps Script設定
    ├── code.gs             # メインコード
    ├── data_migration.gs   # データ移行スクリプト
    ├── home.html           # ホームページ
    ├── courses.html        # コース一覧
    ├── reservation.html    # 予約ページ
    ├── my_page.html        # マイページ
    ├── admin.html          # 管理者ページ
    ├── header.html         # ヘッダー
    ├── footer.html         # フッター
    ├── navigation.html     # ナビゲーション
    └── stylesheet.html     # スタイルシート
```

---

## 🚀 クイックスタート

### 1. claspのセットアップ（プロトタイプ用）

```bash
# プロトタイプディレクトリに移動
cd prototypes

# セットアップスクリプトを実行
./scripts/setup_clasp.sh
```

詳細は [プロトタイプREADME](prototypes/README.md) と [claspセットアップガイド](prototypes/docs/CLASP_SETUP.md) を参照してください。

### 2. コードのアップロード

```bash
# コードをGoogle Apps Scriptにアップロード
clasp push
```

### 3. デプロイ（プロトタイプ用）

```bash
# プロトタイプディレクトリに移動
cd prototypes

# デプロイスクリプトを実行
./scripts/deploy.sh
```

---

## 📝 開発フロー

1. **ローカルでコードを編集**
   ```bash
   # src/ディレクトリ内のファイルを編集
   vim src/code.gs
   ```

2. **変更をアップロード**
   ```bash
   clasp push
   ```

3. **動作確認**
   ```bash
   # ブラウザでプロジェクトを開く
   clasp open
   ```

4. **デプロイ**
   ```bash
   ./deploy.sh
   ```

---

## 🔧 便利なコマンド

| コマンド | 説明 |
|---------|------|
| `clasp push` | コードをアップロード |
| `clasp deploy` | デプロイ |
| `clasp open` | ブラウザでプロジェクトを開く |
| `clasp logs` | ログを確認 |
| `clasp run <関数名>` | 関数を実行 |

---

## 📚 関連ドキュメント

- [プロトタイプREADME](prototypes/README.md) - プロトタイプコードの説明
- [プロトタイプ進捗状況](prototypes/docs/prototype_progress.md)
- [claspセットアップガイド](prototypes/docs/CLASP_SETUP.md)
- [Google APIセットアップガイド](prototypes/docs/GOOGLE_API_SETUP.md)
- [Slack設定ガイド](prototypes/docs/SLACK_CONFIG.md)
- [デプロイ手順書](../deployment.md)

---

**更新者**: プロダクト企画チーム  
**最終更新**: 2025-11-14


