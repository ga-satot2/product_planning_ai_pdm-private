# ブラウザプロセスクリーンアップ手順

**作成日時**: 2025-12-25  
**問題**: Playwrightのブラウザプロセスが常駐してブラウザ操作ができない

---

## 🔍 問題の確認

PlaywrightのChromeプロセスが常駐している場合、以下のコマンドで確認できます：

```bash
# Playwright関連のプロセスを確認
ps aux | grep "mcp-chrome\|mcp-server-playwright" | grep -v grep

# プロセス数
ps aux | grep "mcp-chrome\|mcp-server-playwright" | grep -v grep | wc -l
```

---

## 🧹 クリーンアップ手順

### 1. Playwright Chromeプロセスの終了

```bash
# Playwright Chromeプロセスを終了
ps aux | grep "mcp-chrome-b98a3fd" | grep -v grep | awk '{print $2}' | xargs kill -9
```

### 2. Playwright MCPサーバーの終了

```bash
# Playwright MCPサーバーを終了
ps aux | grep "mcp-server-playwright" | grep -v grep | awk '{print $2}' | xargs kill -9
```

### 3. キャッシュディレクトリの削除

```bash
# Playwrightキャッシュディレクトリを削除
rm -rf /Users/t_sato2/Library/Caches/ms-playwright/mcp-chrome-b98a3fd
```

---

## ✅ 確認

クリーンアップ後、以下のコマンドで確認：

```bash
# Playwright関連プロセスが残っていないか確認
ps aux | grep "mcp-chrome\|mcp-server-playwright" | grep -v grep | wc -l
# 0 が返れば正常
```

---

## 🔄 再起動

クリーンアップ後、Playwrightを使用する場合は、Cursorを再起動するか、MCPサーバーを再起動してください。

---

## ⚠️ 注意事項

- 通常のChromeプロセスは終了しないでください
- Playwright関連のプロセスのみを終了してください
- クリーンアップ後は、ブラウザ操作が正常に動作するはずです

---

**作成者**: プロダクト企画チーム  
**最終更新**: 2025-12-25





