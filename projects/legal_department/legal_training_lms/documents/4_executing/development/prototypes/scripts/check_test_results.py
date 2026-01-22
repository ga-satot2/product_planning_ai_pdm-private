#!/usr/bin/env python3
"""
実行されたテストの結果を確認するスクリプト
Apps Scriptエディタの実行ログを取得して解析
"""

import asyncio
from playwright.async_api import async_playwright
import os
import re

SPREADSHEET_SCRIPT_URL = "https://script.google.com/u/0/home/projects/1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-/edit"

async def get_execution_logs():
    """実行ログを取得"""
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
        
        print("📂 Apps Scriptエディタを開いています...")
        await page.goto(SPREADSHEET_SCRIPT_URL, wait_until="domcontentloaded", timeout=60000)
        await asyncio.sleep(5)
        
        print("🔍 実行ログパネルを探しています...")
        
        # 実行ログパネルを開く（「実行ログ」ボタンをクリック）
        try:
            # 「実行ログ」ボタンを探してクリック
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
                        await asyncio.sleep(2)
                        print(f"  ✅ 実行ログボタンをクリックしました: {selector}")
                        log_panel_opened = True
                        break
                except:
                    continue
            
            if not log_panel_opened:
                print("  ⚠️ 実行ログボタンが見つかりませんでした")
        except Exception as e:
            print(f"  ⚠️ 実行ログボタンのクリックに失敗: {e}")
        
        # 実行ログの内容を取得
        await asyncio.sleep(3)
        
        log_content = await page.evaluate('''
            () => {
                // 実行ログパネルを探す
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
                            // Logger.logの出力を含む要素を探す
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
        
        if log_content and len(log_content.strip()) > 0:
            print("\n" + "="*60)
            print("実行ログの内容")
            print("="*60)
            print(log_content[:5000])  # 最初の5000文字
            
            # ログを解析
            print("\n" + "="*60)
            print("テスト実行結果の解析")
            print("="*60)
            
            lines = log_content.split('\n')
            
            # テスト関数の実行状況を確認
            test_functions = [
                'testRefreshAttendeeStatus',
                'testHandleReservationFormSubmit',
                'testOnCreatingSchedule',
                'testOnDashboardAction',
                'testEditHandler',
                'testEnhancedFunctions',
                'testCalendarEnhancedFunctions',
                'testReservationChangeFunctions',
                'testChangeReservation'
            ]
            
            print("\n📊 実行されたテスト関数:")
            for test_func in test_functions:
                found = False
                for line in lines:
                    if test_func in line:
                        found = True
                        # 成功/失敗を判定
                        if '✅' in line or '成功' in line:
                            print(f"  ✅ {test_func}: 成功")
                        elif '❌' in line or 'エラー' in line or 'Error' in line:
                            print(f"  ❌ {test_func}: エラー")
                        elif '⚠️' in line or '警告' in line:
                            print(f"  ⚠️  {test_func}: 警告")
                        else:
                            print(f"  ℹ️  {test_func}: 実行済み")
                        break
                if not found:
                    print(f"  ❓ {test_func}: 未確認")
            
            # エラーの検出
            errors = []
            for line in lines:
                if any(keyword in line for keyword in ['❌', 'エラー', 'Error', 'Exception', '失敗', 'Failed']):
                    errors.append(line.strip())
            
            if errors:
                print("\n⚠️  検出されたエラー:")
                for error in errors[:20]:  # 最初の20個のエラー
                    print(f"  - {error}")
            else:
                print("\n✅ エラーは検出されませんでした")
            
        else:
            print("\n⚠️  実行ログが見つかりませんでした")
            print("💡 Apps Scriptエディタで手動で「実行ログ」ボタンをクリックして確認してください")
        
        print("\n⏳ 10秒後にブラウザを閉じます...")
        await asyncio.sleep(10)
        await context.close()

if __name__ == "__main__":
    asyncio.run(get_execution_logs())

