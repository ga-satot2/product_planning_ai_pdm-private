#!/usr/bin/env python3
"""
createTestEvent()のみを実行する簡易スクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import os

# URLs
SPREADSHEET_SCRIPT_URL = "https://script.google.com/u/0/home/projects/1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-/edit"

# 関数名
CREATE_TEST_EVENT_FUNCTION = "createTestEvent"


async def select_function_and_run(page, function_name):
    """関数を選択して実行"""
    print(f"\n📝 {function_name}() を実行中...")
    
    try:
        # 関数選択ドロップダウンをクリック
        print("  1. 関数選択ドロップダウンをクリック...")
        await page.click('div[aria-label="実行する関数を選択"]', timeout=10000)
        await asyncio.sleep(1)
        
        # 関数名を入力
        print(f"  2. 関数名「{function_name}」を入力...")
        await page.type('div[aria-label="実行する関数を選択"]', function_name)
        await page.press('div[aria-label="実行する関数を選択"]', 'Enter')
        await asyncio.sleep(2)
        
        # 実行ボタンをクリック
        print("  3. 実行ボタンをクリック...")
        run_button_selectors = [
            'button[aria-label="選択した関数を実行"]',
            'button:has-text("実行")',
            'button.run-button'
        ]
        
        run_button = None
        for selector in run_button_selectors:
            try:
                run_button = await page.wait_for_selector(selector, timeout=5000)
                if run_button:
                    break
            except:
                continue
        
        if run_button:
            await run_button.click()
            print(f"  ✅ {function_name}() の実行を開始しました")
        else:
            # キーボードショートカットで実行
            await page.keyboard.press("Control+Enter")
            print(f"  ✅ {function_name}() の実行を開始しました（キーボードショートカット）")
        
        # 実行完了を待機
        print("  ⏳ 実行完了を待機中（15秒）...")
        await asyncio.sleep(15)
        
        print(f"  ✅ {function_name}() の実行が完了しました")
        return True
        
    except Exception as e:
        print(f"  ❌ エラー: {e}")
        return False


async def main():
    """メイン処理"""
    print("="*60)
    print("createTestEvent() 実行スクリプト")
    print("="*60)
    
    async with async_playwright() as p:
        print("\n🌐 ブラウザを起動中...")
        
        # 永続コンテキストを使用
        home_dir = os.path.expanduser("~")
        user_data_dir = os.path.join(home_dir, ".playwright_chrome_profile")
        os.makedirs(user_data_dir, exist_ok=True)
        
        print(f"  ユーザーデータディレクトリ: {user_data_dir}")
        
        context = await p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            viewport={"width": 1920, "height": 1080},
            args=['--disable-blink-features=AutomationControlled']
        )
        
        pages = context.pages
        if pages:
            page = pages[0]
        else:
            page = await context.new_page()
        
        try:
            # Apps Scriptエディタを開く
            print(f"\n📂 Apps Scriptエディタを開いています...")
            await page.goto(SPREADSHEET_SCRIPT_URL, wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(5)
            print("  ✅ Apps Scriptエディタを開きました")
            
            # tests.gsファイルを開く
            print("📄 tests.gsファイルを開いています...")
            try:
                await page.click('text="tests.gs"', timeout=10000)
                await asyncio.sleep(3)
                print("  ✅ tests.gsファイルを開きました")
            except Exception as e:
                print(f"  ⚠️ tests.gsファイルが見つかりませんでした（既に開いている可能性があります）: {e}")
            
            # createTestEvent()を実行
            success = await select_function_and_run(page, CREATE_TEST_EVENT_FUNCTION)
            
            if success:
                print("\n🎉 createTestEvent() の実行が完了しました！")
                print("\n⏳ 30秒後にブラウザを閉じます...")
                await asyncio.sleep(30)
            else:
                print("\n❌ createTestEvent() の実行に失敗しました")
                print("\n⏳ 30秒後にブラウザを閉じます...")
                await asyncio.sleep(30)
            
        except Exception as e:
            print(f"\n❌ 予期しないエラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
            print("\n⏳ 30秒後にブラウザを閉じます...")
            await asyncio.sleep(30)
        
        finally:
            await context.close()
            print("\n✅ ブラウザを閉じました")


if __name__ == "__main__":
    asyncio.run(main())

