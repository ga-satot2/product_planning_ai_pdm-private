#!/bin/bash
# Google Apps Script テスト実行用の簡単なスクリプト
# ブラウザでApps Scriptエディタを開いてテストを実行する

SCRIPT_ID="1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-"
URL="https://script.google.com/d/${SCRIPT_ID}/edit"

echo "=========================================="
echo "Google Apps Script テスト実行"
echo "=========================================="
echo ""
echo "以下のURLでApps Scriptエディタを開きます:"
echo "$URL"
echo ""
echo "実行手順:"
echo "1. ブラウザでApps Scriptエディタが開きます"
echo "2. 関数選択ドロップダウンから 'createTestEvent' を選択"
echo "3. 「実行」ボタンをクリック"
echo "4. 実行ログで eventId を確認"
echo "5. 関数選択ドロップダウンから 'testAllUntestedFunctions' を選択"
echo "6. 「実行」ボタンをクリック"
echo "7. 実行ログを確認"
echo ""
echo "ブラウザを開きますか？ (y/n)"
read -r answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    if command -v open &> /dev/null; then
        open "$URL"
        echo "✅ ブラウザを開きました"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$URL"
        echo "✅ ブラウザを開きました"
    else
        echo "❌ ブラウザを開くコマンドが見つかりません"
        echo "手動で以下のURLを開いてください: $URL"
    fi
else
    echo "手動で以下のURLを開いてください: $URL"
fi



