#!/bin/bash
# 技術環境構築の確認・整理スクリプト
# clasp設定、Git連携、GASプロジェクト、Google API、スクリプトプロパティを確認・整理

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$PROJECT_DIR/docs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/tech_environment_report_${TIMESTAMP}.md"

mkdir -p "$REPORT_DIR"

echo "🔍 技術環境構築の確認・整理を開始します..."
echo ""

# レポートファイルの初期化
cat > "$REPORT_FILE" << EOF
# 技術環境構築確認レポート

**作成日時**: $(date)
**プロジェクト**: 法務研修LMSシステム

---

EOF

# 1. clasp設定の確認・更新
echo "## 1. clasp設定の確認・更新" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "📋 1. clasp設定の確認・更新..."

if command -v clasp &> /dev/null; then
    CLASP_VERSION=$(clasp --version)
    echo "✅ clasp インストール済み: $CLASP_VERSION" | tee -a "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    echo "❌ clasp がインストールされていません" | tee -a "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# .clasp.jsonファイルの確認
echo "### clasp設定ファイル" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "$PROJECT_DIR/.clasp.json.form" ]; then
    echo "✅ .clasp.json.form 存在" | tee -a "$REPORT_FILE"
    echo "\`\`\`json" >> "$REPORT_FILE"
    cat "$PROJECT_DIR/.clasp.json.form" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    echo "❌ .clasp.json.form が見つかりません" | tee -a "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ -f "$PROJECT_DIR/.clasp.json.sheet" ]; then
    echo "✅ .clasp.json.sheet 存在" | tee -a "$REPORT_FILE"
    echo "\`\`\`json" >> "$REPORT_FILE"
    cat "$PROJECT_DIR/.clasp.json.sheet" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    echo "❌ .clasp.json.sheet が見つかりません" | tee -a "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# claspログイン状態の確認
echo "### claspログイン状態" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if clasp login --status >> "$REPORT_FILE" 2>&1; then
    echo "✅ clasp ログイン済み" | tee -a "$REPORT_FILE"
else
    echo "⚠️  clasp ログインが必要です" | tee -a "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# 2. Git連携の確認
echo "## 2. Git連携の確認" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "📋 2. Git連携の確認..."

cd "$PROJECT_DIR"

if [ -d ".git" ]; then
    echo "✅ Gitリポジトリとして初期化済み" | tee -a "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # リモートリポジトリの確認
    echo "### リモートリポジトリ" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    git remote -v >> "$REPORT_FILE" 2>&1 || echo "リモートリポジトリが設定されていません" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # ブランチ情報
    echo "### ブランチ情報" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "現在のブランチ: $(git branch --show-current)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # .gitignoreの確認
    if [ -f ".gitignore" ]; then
        echo "✅ .gitignore 存在" | tee -a "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    else
        echo "⚠️  .gitignore が見つかりません" | tee -a "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
else
    echo "❌ Gitリポジトリとして初期化されていません" | tee -a "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# 3. 既存GASプロジェクトの整理
echo "## 3. 既存GASプロジェクトの整理" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "📋 3. 既存GASプロジェクトの整理..."

echo "### GASファイル一覧" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# .gsファイルの一覧
GS_FILES=$(find "$PROJECT_DIR" -maxdepth 1 -name "*.gs" -type f | sort)
GS_COUNT=$(echo "$GS_FILES" | grep -c . || echo "0")

echo "**GASファイル数**: $GS_COUNT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ "$GS_COUNT" -gt 0 ]; then
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "$GS_FILES" | sed "s|$PROJECT_DIR/||" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # 各ファイルの行数
    echo "### ファイルサイズ" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "| ファイル名 | 行数 | サイズ |" >> "$REPORT_FILE"
    echo "|-----------|------|--------|" >> "$REPORT_FILE"
    
    for file in $GS_FILES; do
        filename=$(basename "$file")
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        size=$(du -h "$file" | cut -f1)
        echo "| $filename | $lines | $size |" >> "$REPORT_FILE"
    done
    echo "" >> "$REPORT_FILE"
else
    echo "⚠️  .gsファイルが見つかりません" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# 4. Google APIの有効化確認
echo "## 4. Google APIの有効化確認" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "📋 4. Google APIの有効化確認..."

echo "### 必要なGoogle API" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "以下のAPIが有効化されている必要があります:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **Calendar API** - カレンダーイベントの作成・更新・削除" >> "$REPORT_FILE"
echo "2. **Sheets API** - スプレッドシートの読み書き" >> "$REPORT_FILE"
echo "3. **Gmail API** - メール送信機能" >> "$REPORT_FILE"
echo "4. **Apps Script API** - clasp連携" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### API有効化確認方法" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. [Google Cloud Console](https://console.cloud.google.com/apis/library)" >> "$REPORT_FILE"
echo "2. プロジェクトを選択" >> "$REPORT_FILE"
echo "3. 各APIライブラリから検索して有効化" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Apps Script API有効化" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "[Apps Script API設定](https://script.google.com/home/usersettings)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 5. スクリプトプロパティの整理・設定
echo "## 5. スクリプトプロパティの整理・設定" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "📋 5. スクリプトプロパティの整理・設定..."

echo "### 必要なスクリプトプロパティ" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "以下のスクリプトプロパティが設定されている必要があります:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "| プロパティ名 | 説明 | 設定場所 |" >> "$REPORT_FILE"
echo "|------------|------|---------|" >> "$REPORT_FILE"
echo "| SPREADSHEET_ID | スプレッドシートID | Apps Scriptエディタ → プロジェクトの設定 → スクリプトプロパティ |" >> "$REPORT_FILE"
echo "| SPREADSHEET_URL | スプレッドシートURL（代替） | 同上 |" >> "$REPORT_FILE"
echo "| CALENDAR_ID | Google Calendar ID | 同上 |" >> "$REPORT_FILE"
echo "| SLACK_WEBHOOK_URL | Slack通知用Webhook URL | 同上 |" >> "$REPORT_FILE"
echo "| SLACK_CHANNEL | Slackチャンネル名 | 同上 |" >> "$REPORT_FILE"
echo "| SLACK_CHANNEL_ID | SlackチャンネルID | 同上 |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 現在の設定値（コード内のデフォルト値）" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "コード内で確認されたデフォルト値:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **SPREADSHEET_ID**: \`1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE\`" >> "$REPORT_FILE"
echo "- **FORM_PROJECT_ID**: \`1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo\`" >> "$REPORT_FILE"
echo "- **SHEET_PROJECT_ID**: \`1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 設定方法" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Apps Scriptエディタを開く" >> "$REPORT_FILE"
echo "2. 「プロジェクトの設定」（⚙️）をクリック" >> "$REPORT_FILE"
echo "3. 「スクリプトプロパティ」タブを選択" >> "$REPORT_FILE"
echo "4. 「スクリプトプロパティを追加」をクリック" >> "$REPORT_FILE"
echo "5. プロパティ名と値を入力" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# まとめ
echo "## まとめ" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### 確認済み項目" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- ✅ clasp設定ファイルの確認" >> "$REPORT_FILE"
echo "- ✅ Git連携の確認" >> "$REPORT_FILE"
echo "- ✅ GASプロジェクトファイルの整理" >> "$REPORT_FILE"
echo "- ✅ Google API有効化の確認方法" >> "$REPORT_FILE"
echo "- ✅ スクリプトプロパティの整理" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### 次のステップ" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Google APIの有効化確認（手動）" >> "$REPORT_FILE"
echo "2. スクリプトプロパティの設定（手動）" >> "$REPORT_FILE"
echo "3. claspログイン状態の確認" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo ""
echo "✅ 技術環境構築の確認・整理が完了しました"
echo "📄 レポート: $REPORT_FILE"





