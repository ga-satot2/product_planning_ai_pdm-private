#!/usr/bin/env python3
"""
Playwrightを使用してGoogle Apps Scriptのテストを実行するスクリプト
既存のcheck_test_results.pyを拡張して、テスト実行機能を追加
"""

import asyncio
import sys
from playwright.async_api import async_playwright
import os
import re
from datetime import datetime

SPREADSHEET_SCRIPT_URL = "https://script.google.com/u/0/home/projects/1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-/edit"

# テスト関数のリスト
TEST_FUNCTIONS = [
    'testGetReservedCountForGroupAndCourse',
    'testGetCourseNumberFromCourseListByCourseName',
    'testUpdateDashboardAfterReservation',
    'testAllNewFunctions',
    'testAllUntestedFunctions',
    'testAllBoundaryAndEdgeCases',
]

def save_log(test_function, log_content):
    """ログをファイルに保存"""
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = os.path.join(log_dir, f'playwright_test_{test_function}_{timestamp}.log')
    
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write(log_content)
    
    print(f"\n📝 ログを保存しました: {log_file}")
    return log_file

async def run_test_function(test_function):
    """テスト関数を実行"""
    async with async_playwright() as p:
        home_dir = os.path.expanduser("~")
        user_data_dir = os.path.join(home_dir, ".playwright_chrome_profile")
        
        context = await p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            viewport={"width": 1920, "height": 1080}
        )
        
        pages = context.pages
        page = pages[0] if pages else await context.new_page()
        
        try:
            print(f"\n🚀 テスト関数を実行します: {test_function}")
            print("📂 Apps Scriptエディタを開いています...")
            await page.goto(SPREADSHEET_SCRIPT_URL, wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(5)
            
            # 関数選択ドロップダウンを探す
            print("🔍 関数選択ドロップダウンを探しています...")
            
            # より確実な方法で関数を選択
            function_selected = await page.evaluate(f'''
                (functionName) => {{
                    // 方法1: select要素を探す
                    const selects = document.querySelectorAll('select');
                    for (const select of selects) {{
                        const options = Array.from(select.options);
                        // 完全一致または部分一致で探す
                        const found = options.find(opt => 
                            opt.textContent.trim() === functionName || 
                            opt.textContent.includes(functionName) ||
                            opt.value === functionName
                        );
                        if (found) {{
                            select.value = found.value;
                            select.dispatchEvent(new Event('change', {{ bubbles: true }}));
                            select.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            return true;
                        }}
                    }}
                    
                    // 方法2: ドロップダウンを探してクリック
                    const dropdowns = document.querySelectorAll('[role="combobox"], [aria-haspopup="listbox"]');
                    for (const dropdown of dropdowns) {{
                        try {{
                            dropdown.click();
                            // オプションを探す
                            setTimeout(() => {{
                                const options = document.querySelectorAll('[role="option"]');
                                for (const opt of options) {{
                                    if (opt.textContent.includes(functionName)) {{
                                        opt.click();
                                        return true;
                                    }}
                                }}
                            }}, 500);
                        }} catch (e) {{
                            // エラーは無視
                        }}
                    }}
                    
                    // 方法3: 関数名を直接入力
                    const inputs = document.querySelectorAll('input[type="text"], input[placeholder*="関数"], input[placeholder*="function"]');
                    for (const input of inputs) {{
                        input.value = functionName;
                        input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        return true;
                    }}
                    
                    return false;
                }}
            ''', test_function)
            
            await asyncio.sleep(3)  # 選択が反映されるまで待機
            
            if function_selected:
                print(f"   ✅ 関数を選択しました: {test_function}")
            else:
                print(f"   ⚠️  自動選択に失敗しました。手動選択を試みます...")
                # 手動選択のための待機時間を短縮
                await asyncio.sleep(5)
            
            # 実行ボタンを探してクリック
            print("▶️  実行ボタンを探しています...")
            run_button_selectors = [
                'button[aria-label*="実行"]',
                'button[aria-label*="Run"]',
                'button:has-text("実行")',
                'button:has-text("Run")',
                '[role="button"][aria-label*="実行"]',
                '[role="button"][aria-label*="Run"]',
            ]
            
            run_button_clicked = False
            for selector in run_button_selectors:
                try:
                    run_button = await page.wait_for_selector(selector, timeout=3000)
                    if run_button:
                        await run_button.click()
                        print(f"   ✅ 実行ボタンをクリックしました: {selector}")
                        run_button_clicked = True
                        await asyncio.sleep(2)
                        break
                except:
                    continue
            
            if not run_button_clicked:
                print("   ⚠️  実行ボタンが見つかりませんでした")
                print("   手動で実行ボタンをクリックしてください")
                print("   30秒待機します...")
                await asyncio.sleep(30)
            
            # 実行ログを待機（より長く待機）
            print("⏳ 実行ログの表示を待機しています...")
            print("   （テスト実行には時間がかかる場合があります）")
            await asyncio.sleep(20)  # 20秒待機（テスト実行時間を考慮）
            
            # 実行ログパネルを開く（「実行ログ」ボタンをクリック）
            print("📋 実行ログパネルを開いています...")
            log_button_selectors = [
                'button[aria-label*="実行ログ"]',
                'button[aria-label*="Execution log"]',
                'button:has-text("実行ログ")',
                'button:has-text("Execution log")',
                '[role="button"][aria-label*="ログ"]',
            ]
            
            log_panel_opened = False
            for selector in log_button_selectors:
                try:
                    log_button = await page.wait_for_selector(selector, timeout=3000)
                    if log_button:
                        await log_button.click()
                        print(f"   ✅ 実行ログボタンをクリックしました: {selector}")
                        log_panel_opened = True
                        await asyncio.sleep(3)
                        break
                except:
                    continue
            
            if not log_panel_opened:
                print("   ⚠️  実行ログボタンが見つかりませんでした")
            
            # 実行ログを取得（check_test_results.pyのロジックを完全にコピー）
            print("📋 実行ログを取得しています...")
            await asyncio.sleep(5)  # ログが表示されるまで待機
            
            # 実行ログパネルが開いていることを確認
            # 実行ログパネルのテキストエリアやpre要素を直接探す
            log_content = await page.evaluate('''
                () => {
                    // 実行ログパネルを探す（check_test_results.pyと同じロジック）
                    const logSelectors = [
                        '[class*="log"]',
                        '[class*="execution"]',
                        '[aria-label*="ログ"]',
                        '[aria-label*="log"]',
                        '[role="log"]',
                        '[role="textbox"][readonly]',
                        'pre',
                        'code',
                        'textarea[readonly]'
                    ];
                    
                    let logText = '';
                    let maxLength = 0;
                    
                    // すべてのセレクターを試す
                    for (const selector of logSelectors) {
                        try {
                            const elements = document.querySelectorAll(selector);
                            for (const el of elements) {
                                const text = el.textContent || el.innerText || '';
                                // Logger.logの出力を含む要素を探す（テスト関数名を含むもの）
                                if (text.length > maxLength && 
                                    (text.includes('testAllUntestedFunctions') || 
                                     text.includes('testRefreshAttendeeStatus') ||
                                     text.includes('testHandleReservationFormSubmit') ||
                                     text.includes('testOnCreatingSchedule') ||
                                     text.includes('testOnDashboardAction') ||
                                     text.includes('testEditHandler') ||
                                     text.includes('testEnhancedFunctions') ||
                                     text.includes('testCalendarEnhancedFunctions') ||
                                     text.includes('testReservationChangeFunctions') ||
                                     text.includes('testChangeReservation') ||
                                     text.includes('testGetReservedCountForGroupAndCourse') ||
                                     text.includes('testGetCourseNumberFromCourseListByCourseName') ||
                                     text.includes('testUpdateDashboardAfterReservation') ||
                                     text.includes('testAllNewFunctions') ||
                                     text.includes('開始') ||
                                     text.includes('完了') ||
                                     text.includes('成功') ||
                                     text.includes('エラー') ||
                                     text.includes('Logger') ||
                                     text.includes('✅') ||
                                     text.includes('❌') ||
                                     text.includes('⚠️'))) {
                                    logText = text;
                                    maxLength = text.length;
                                }
                            }
                        } catch (e) {
                            // セレクターエラーは無視
                        }
                    }
                    
                    // 見つからない場合、すべての要素を確認
                    if (!logText || logText.length < 100) {
                        const allElements = document.querySelectorAll('*');
                        for (const el of allElements) {
                            const text = el.textContent || el.innerText || '';
                            if (text.length > 200 && 
                                (text.includes('testAllUntestedFunctions') || 
                                 text.includes('testGetReservedCountForGroupAndCourse') ||
                                 text.includes('開始') || 
                                 text.includes('完了'))) {
                                logText = text;
                                break;
                            }
                        }
                    }
                    
                    return logText || '';
                }
            ''')
            
            # ログが見つからない場合、実行ログパネルを再度開く
            if not log_content or len(log_content.strip()) < 100:
                print("   ⚠️  実行ログが見つかりませんでした。実行ログパネルを再度開きます...")
                # 実行ログボタンを再度クリック
                for selector in log_button_selectors:
                    try:
                        log_button = await page.wait_for_selector(selector, timeout=2000)
                        if log_button:
                            await log_button.click()
                            await asyncio.sleep(3)
                            # 再度ログを取得
                            log_content = await page.evaluate('''
                                () => {
                                    const logSelectors = [
                                        '[class*="log"]',
                                        '[class*="execution"]',
                                        '[role="log"]',
                                        '[role="textbox"][readonly]',
                                        'pre',
                                        'code',
                                        'textarea[readonly]'
                                    ];
                                    
                                    let logText = '';
                                    let maxLength = 0;
                                    
                                    for (const selector of logSelectors) {
                                        try {
                                            const elements = document.querySelectorAll(selector);
                                            for (const el of elements) {
                                                const text = el.textContent || el.innerText || '';
                                                if (text.length > maxLength && 
                                                    (text.includes('開始') || 
                                                     text.includes('完了') ||
                                                     text.includes('✅') ||
                                                     text.includes('❌'))) {
                                                    logText = text;
                                                    maxLength = text.length;
                                                }
                                            }
                                        } catch (e) {}
                                    }
                                    
                                    return logText || '';
                                }
                            ''')
                            break
                    except:
                        continue
            
            if log_content and len(log_content.strip()) > 0:
                print("\n" + "="*80)
                print("実行ログ")
                print("="*80)
                print(log_content[:10000])  # 最初の10000文字
                
                # ログをファイルに保存
                log_file = save_log(test_function, log_content)
                
                # 成功/失敗を判定
                if '✅' in log_content and '❌' not in log_content:
                    print("\n✅ テストが成功しました！")
                    return {'success': True, 'log_file': log_file}
                elif '❌' in log_content:
                    print("\n❌ テストでエラーが発生しました")
                    return {'success': False, 'log_file': log_file}
                else:
                    print("\n⚠️  テストの結果が不明です。ログを確認してください。")
                    return {'success': None, 'log_file': log_file}
            else:
                print("\n⚠️  実行ログを取得できませんでした")
                print("💡 Apps Scriptエディタで手動で「実行ログ」ボタンをクリックして確認してください")
                print("   30秒待機します...")
                await asyncio.sleep(30)
                return {'success': None, 'log_file': None}
                
        except Exception as e:
            print(f"\n❌ エラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
            
            # スクリーンショットを保存
            screenshot_path = os.path.join(os.path.dirname(__file__), '..', 'logs', f'error_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 スクリーンショットを保存しました: {screenshot_path}")
            
            return {'success': False, 'error': str(e), 'screenshot': screenshot_path}
        finally:
            print("\n⏳ 10秒後にブラウザを閉じます...")
            await asyncio.sleep(10)
            await context.close()

async def main():
    """メイン処理"""
    test_function = sys.argv[1] if len(sys.argv) > 1 else 'testAllNewFunctions'
    
    print("🎭 Playwrightを使用してGoogle Apps Scriptのテストを実行します")
    print("="*80)
    print(f"📋 テスト関数: {test_function}")
    print("="*80)
    
    if test_function not in TEST_FUNCTIONS:
        print(f"\n⚠️  警告: {test_function}はテスト関数リストにありません。")
        print("   利用可能なテスト関数:")
        for fn in TEST_FUNCTIONS:
            print(f"     - {fn}")
        print("\n   続行します...")
    
    result = await run_test_function(test_function)
    
    print("\n" + "="*80)
    if result.get('success') == True:
        print("✅ テスト実行が完了しました（成功）")
    elif result.get('success') == False:
        print("❌ テスト実行が完了しました（失敗）")
    else:
        print("⚠️  テスト実行が完了しました（結果不明）")
    print("="*80)
    
    sys.exit(0 if result.get('success') == True else 1)

if __name__ == "__main__":
    asyncio.run(main())
