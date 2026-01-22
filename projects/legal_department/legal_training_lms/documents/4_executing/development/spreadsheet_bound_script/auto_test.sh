#!/bin/bash
# Google Apps Script の自動デプロイ・実行・ログ取得スクリプト
# 使用方法: ./auto_test.sh [関数名] [待機秒数]
# 例: ./auto_test.sh refreshAttendeeStatus 5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 関数名（デフォルト: refreshAttendeeStatus）
FUNCTION_NAME="${1:-refreshAttendeeStatus}"
WAIT_SECONDS="${2:-5}"  # ログが記録されるまでの待機時間（デフォルト: 5秒）

echo "=========================================="
echo "Google Apps Script 自動テスト"
echo "=========================================="
echo "関数名: $FUNCTION_NAME"
echo "待機時間: ${WAIT_SECONDS}秒"
echo ""

# Script ID を取得
if [ ! -f ".clasp.json" ]; then
    echo "❌ .clasp.json が見つかりません"
    exit 1
fi

SCRIPT_ID=$(grep -o '"scriptId": "[^"]*"' .clasp.json | cut -d'"' -f4)
if [ -z "$SCRIPT_ID" ]; then
    echo "❌ Script ID を取得できませんでした"
    exit 1
fi

echo "📋 Script ID: $SCRIPT_ID"
echo ""

# 1. デプロイ
echo "📤 デプロイ中..."
if ! clasp push > /tmp/clasp_push.log 2>&1; then
    echo "❌ デプロイに失敗しました:"
    cat /tmp/clasp_push.log
    exit 1
fi
echo "✅ デプロイ完了"
echo ""

# 2. 実行方法の案内
echo "=========================================="
echo "実行方法"
echo "=========================================="
echo ""
echo "スプレッドシートにバインドされたスクリプトの場合、以下のいずれかで実行してください:"
echo ""
echo "【方法1】Google Apps Script エディタで手動実行"
echo "  1. 以下のURLを開く:"
echo "     https://script.google.com/home/projects/$SCRIPT_ID/edit"
echo "  2. 関数 '$FUNCTION_NAME' を選択して実行"
echo ""
echo "【方法2】スプレッドシートのトリガーで実行"
echo "  - スプレッドシートを編集すると自動実行されます"
echo ""
echo "実行後、${WAIT_SECONDS}秒待機してからログを取得します..."
echo ""
read -p "実行が完了したら Enter キーを押してください（または Ctrl+C でキャンセル）: "
echo ""

# 3. ログ取得（複数回試行）
echo "📋 実行ログを取得中..."
LOG_FILE="/tmp/clasp_logs_$(date +%Y%m%d_%H%M%S).txt"
MAX_RETRIES=3
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep "$WAIT_SECONDS"
    
    if clasp logs --json > "$LOG_FILE" 2>&1; then
        # ログが空でないか確認
        if [ -s "$LOG_FILE" ]; then
            # JSON形式かどうか確認
            if jq empty "$LOG_FILE" 2>/dev/null; then
                LOG_COUNT=$(jq '. | length' "$LOG_FILE" 2>/dev/null || echo "0")
                if [ "$LOG_COUNT" -gt 0 ]; then
                    SUCCESS=true
                    break
                fi
            fi
        fi
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "  ⏳ 再試行中... ($RETRY_COUNT/$MAX_RETRIES)"
    fi
done

if [ "$SUCCESS" = true ]; then
    echo "✅ ログ取得完了: $LOG_FILE"
    echo ""
    echo "=========================================="
    echo "最新のログ（関数 '$FUNCTION_NAME' 関連）:"
    echo "=========================================="
    
    # jq が使える場合は整形して表示
    if command -v jq >/dev/null 2>&1; then
        # 関数名を含むログをフィルタリング
        jq -r '.[] | select(.message | contains("'$FUNCTION_NAME'") or contains("getUtils") or contains("getCalendarId") or contains("refreshAttendeeStatus") or contains("エラー") or contains("エラースタック")) | "\(.timestamp) [\(.severity)] \(.message)"' "$LOG_FILE" 2>/dev/null | tail -30
        
        echo ""
        echo "=========================================="
        echo "全ログ（最後の30行）:"
        echo "=========================================="
        jq -r '.[] | "\(.timestamp) [\(.severity)] \(.message)"' "$LOG_FILE" | tail -30
    else
        # jq がない場合は生のログを表示
        tail -50 "$LOG_FILE"
    fi
    
    echo ""
    echo "全ログは以下を確認してください:"
    echo "  cat $LOG_FILE"
else
    echo "⚠️  ログ取得に失敗しました"
    echo ""
    echo "以下のURLで実行履歴を確認してください:"
    echo "  https://script.google.com/home/projects/$SCRIPT_ID/executions"
    echo ""
    echo "取得したログ（生データ）:"
    cat "$LOG_FILE" 2>/dev/null || echo "（ログファイルが空です）"
fi

echo ""
echo "=========================================="
echo "完了"
echo "=========================================="

