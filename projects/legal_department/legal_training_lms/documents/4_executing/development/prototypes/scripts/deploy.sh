#!/usr/bin/env bash
# LMS Web App デプロイスクリプト
# 用法: prototypes ディレクトリで実行するか、ワークスペースルートから ./development/prototypes/scripts/deploy.sh
# 前提: .clasp.json が prototypes に存在し、clasp login 済みであること

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -f ".clasp.json" ]; then
  echo "エラー: .clasp.json が見つかりません。$PROJECT_DIR に .clasp.json を配置してください。"
  exit 1
fi

DESC="LMS Web App $(date +%Y-%m-%d)"

echo "clasp push を実行しています..."
clasp push

echo "clasp deploy を実行しています (description: $DESC)..."
clasp deploy --description "$DESC"

echo ""
echo "デプロイが完了しました。WebアプリのURLを取得するには:"
echo "  clasp deployments"
echo "で「Web アプリ」のデプロイURLを確認するか、Apps Script エディタの「デプロイ」->「デプロイを管理」からURLをコピーしてください。"
