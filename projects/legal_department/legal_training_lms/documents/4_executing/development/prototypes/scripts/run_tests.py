#!/usr/bin/env python3
"""
Google Apps Script テスト実行スクリプト

このスクリプトはGoogle Apps Script APIを使用してテスト関数を実行します。
"""

import os
import sys
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# スコープ
SCOPES = ['https://www.googleapis.com/auth/script.scriptapp']

# プロジェクトID
SCRIPT_ID = '1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-'

# 実行するテスト関数
TEST_FUNCTIONS = [
    'createTestEvent',  # テスト用データの準備
    'testAllUntestedFunctions',  # 統合テスト
]

def get_credentials():
    """認証情報を取得"""
    creds = None
    token_file = 'token.json'
    credentials_file = 'credentials.json'
    
    # 既存のトークンを読み込む
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
    
    # トークンが無効または存在しない場合、再認証
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_file):
                print(f"❌ {credentials_file} が見つかりません。")
                print("Google Cloud ConsoleでOAuth2認証情報を作成してください。")
                sys.exit(1)
            
            flow = InstalledAppFlow.from_client_secrets_file(
                credentials_file, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # トークンを保存
        with open(token_file, 'w') as token:
            token.write(creds.to_json())
    
    return creds

def run_function(service, function_name):
    """関数を実行"""
    try:
        print(f"\n🔄 {function_name}() を実行中...")
        
        request = {
            'function': function_name
        }
        
        response = service.scripts().run(
            scriptId=SCRIPT_ID,
            body=request
        ).execute()
        
        if 'error' in response:
            error = response['error']['details'][0]
            print(f"❌ エラー: {error.get('errorMessage', 'Unknown error')}")
            return False
        else:
            result = response.get('response', {}).get('result', {})
            print(f"✅ {function_name}() 実行完了")
            
            # ログを表示（もしあれば）
            if 'logs' in result:
                print("\n📋 実行ログ:")
                for log in result['logs']:
                    print(f"  {log}")
            
            return True
            
    except HttpError as error:
        print(f"❌ HTTPエラー: {error}")
        return False
    except Exception as error:
        print(f"❌ エラー: {error}")
        return False

def main():
    """メイン処理"""
    print("=" * 60)
    print("Google Apps Script テスト実行スクリプト")
    print("=" * 60)
    
    # 認証情報を取得
    print("\n🔐 認証情報を取得中...")
    creds = get_credentials()
    
    # APIサービスを構築
    print("🔧 APIサービスを構築中...")
    service = build('script', 'v1', credentials=creds)
    
    # テスト関数を実行
    print(f"\n📝 {len(TEST_FUNCTIONS)}個のテスト関数を実行します")
    
    results = []
    for function_name in TEST_FUNCTIONS:
        success = run_function(service, function_name)
        results.append((function_name, success))
    
    # 結果を表示
    print("\n" + "=" * 60)
    print("テスト実行結果")
    print("=" * 60)
    
    for function_name, success in results:
        status = "✅ 成功" if success else "❌ 失敗"
        print(f"{status}: {function_name}()")
    
    # 成功したテストの数を表示
    success_count = sum(1 for _, success in results if success)
    print(f"\n📊 成功: {success_count}/{len(results)}")
    
    if success_count == len(results):
        print("\n🎉 すべてのテストが成功しました！")
    else:
        print("\n⚠️ 一部のテストが失敗しました。ログを確認してください。")

if __name__ == '__main__':
    main()



