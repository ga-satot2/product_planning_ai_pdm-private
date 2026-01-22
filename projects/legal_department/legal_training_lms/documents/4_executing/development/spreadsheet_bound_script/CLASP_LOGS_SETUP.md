# clasp logs 設定手順

`clasp logs`コマンドで実行ログを取得するための設定手順です。

## 📋 クイックスタート

1. Google Cloud Consoleでプロジェクトを作成
2. Apps Script APIを有効化
3. `.clasp.json`に`projectId`を追加
4. `clasp login`で再認証
5. `clasp logs`でテスト

## 🚀 詳細手順

詳細な手順は、以下のドキュメントを参照してください：

**`../prototypes/docs/GOOGLE_API_SETUP.md`** の「📊 clasp logs でログ取得を有効化する方法」セクション

## 📝 .clasp.json の設定例

```json
{
  "scriptId": "1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-",
  "rootDir": "",
  "projectId": "123456789012",
  ...
}
```

**注意**: `projectId`は、Google Cloud Consoleで作成したプロジェクトの**プロジェクトID**（数字）です。プロジェクト名ではありません。

## 🔗 参考リンク

- **Apps Script API 有効化**: https://console.cloud.google.com/apis/library/script.googleapis.com
- **Google Cloud Console**: https://console.cloud.google.com/
- **clasp ドキュメント**: https://github.com/google/clasp

