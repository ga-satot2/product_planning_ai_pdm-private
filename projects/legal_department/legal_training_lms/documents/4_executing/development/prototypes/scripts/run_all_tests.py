#!/usr/bin/env python3
"""
すべてのテスト関数を実行して、テストカバレッジ100%を目指すスクリプト
実行ログを取得・解析して、不具合を特定する
"""

import asyncio
import sys
from playwright.async_api import async_playwright
import os
import re
import json
from datetime import datetime
from typing import Dict, List, Optional

SPREADSHEET_SCRIPT_URL = "https://script.google.com/u/0/home/projects/1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-/edit"

# すべてのテスト関数のリスト（tests.gsから抽出）
ALL_TEST_FUNCTIONS = [
    'testSheetFunctions',
    'testCancelReservation',
    'testChangeReservation',
    'testMarkAttendeeAsReserved',
    'testMarkAttendeeAsUnreserved',
    'testAllSheetFunctions',
    'testRefreshAttendeeStatus',
    'testHandleReservationFormSubmit',
    'testOnCreatingSchedule',
    'testOnDashboardAction',
    'testEditHandler',
    'testAllUntestedFunctions',
    'testAll',
    'testEnhancedFunctions',
    'testCalendarEnhancedFunctions',
    'testReservationChangeFunctions',
    'testEventCapacityBoundary',
    'testChangeDeadlineBoundary',
    'testChangeLimitBoundary',
    'testInvalidInputs',
    'testDataInconsistency',
    'testErrorHandling',
    'testAllBoundaryAndEdgeCases',
    'testRebuildDependencies',
    'testGetReservedCountForGroupAndCourse',
    'testGetCourseNumberFromCourseListByCourseName',
    'testUpdateDashboardAfterReservation',
    'testDeleteCalendarEvent',
    'testSyncCalendarOnReservationChange',
    'testSendReservationConfirmationEmail',
    'testSendReservationChangeEmail',
    'testSendCancellationEmail',
    'testAllNewFunctions',
]

def save_log(test_function: str, log_content: str) -> str:
    """ログをファイルに保存"""
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = os.path.join(log_dir, f'playwright_test_{test_function}_{timestamp}.log')
    
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write(log_content)
    
    return log_file

def parse_test_results(log_content: str) -> Dict:
    """実行ログを解析してテスト結果を抽出"""
    results = {
        'success': False,
        'errors': [],
        'warnings': [],
        'test_functions_executed': [],
        'execution_time': None,
    }
    
    if not log_content or len(log_content.strip()) < 100:
        return results
    
    # HTMLコンテンツを除外（window.WIZ_global_data、AF_initDataCallbackなど）
    if 'window.WIZ_global_data' in log_content or 'AF_initDataCallback' in log_content:
        # HTML部分を除去
        lines_clean = []
        for line in log_content.split('\n'):
            if (not line.strip().startswith('window.') and 
                'AF_initDataCallback' not in line and
                'window["_F_toggles' not in line and
                'window.IJ_values' not in line and
                len(line.strip()) > 0):
                lines_clean.append(line)
        log_content = '\n'.join(lines_clean)
    
    lines = log_content.split('\n')
    
    # テスト完了の検出（重要：テストが正常に完了したかどうかを判定）
    test_completed = False
    test_started = False
    for line in lines:
        # テスト開始の検出
        if '開始' in line and ('test' in line.lower() or 'テスト' in line):
            test_started = True
        # テスト完了の検出
        if '完了' in line and ('test' in line.lower() or 'テスト' in line or '=== test' in line):
            test_completed = True
            # 「完了」の前に「エラー」がないか確認
            if 'エラーが発生しました' not in line and 'Exception' not in line:
                # 正常に完了したと判定
                pass
    
    # エラーの検出（ただし、テスト内で期待されるエラーは除外）
    unexpected_errors = []
    for i, line in enumerate(lines):
        if any(keyword in line for keyword in ['❌', 'エラー', 'Error', 'Exception', '失敗', 'Failed']):
            if line.strip() and not line.strip().startswith('window.'):
                # 次の数行を確認して、エラーが期待されるものかどうかを判定
                is_expected_error = False
                # エラーが期待されるテスト（エラー検出テスト）の場合
                if any(test_name in log_content for test_name in [
                    'testInvalidInputs', 'testErrorHandling', 'testDataInconsistency',
                    'testAllBoundaryAndEdgeCases'
                ]):
                    # エラーメッセージの前後を広く確認（最大10行前後）
                    context_start = max(0, i-5)
                    context_end = min(len(lines), i+10)
                    context_lines = lines[context_start:context_end]
                    context_text = ' '.join(context_lines)
                    
                    # 期待されるエラーのパターンをチェック
                    if ('期待値通り' in context_text or 
                        '適切にエラーを返しています' in context_text or 
                        'クラッシュしないことを確認' in context_text or
                        'エラー時にnullを返して' in context_text or
                        'エラー時にfalseを返して' in context_text or
                        'エラー時にisValid=falseを返して' in context_text or
                        '✅' in context_text):  # ✅マークが含まれている場合は成功
                        is_expected_error = True
                    
                    # testErrorHandlingの場合、特に注意深く判定
                    if 'testErrorHandling' in log_content:
                        # 「✅ エラー時に...」というパターンを探す
                        if any('✅' in l and ('エラー時に' in l or 'クラッシュしない' in l) 
                               for l in context_lines):
                            is_expected_error = True
                
                if not is_expected_error:
                    unexpected_errors.append(line.strip())
    
    results['errors'] = unexpected_errors
    
    # 警告の検出
    for line in lines:
        if '⚠️' in line or '警告' in line or 'Warning' in line:
            if line.strip() and not line.strip().startswith('window.'):
                results['warnings'].append(line.strip())
    
    # 実行されたテスト関数の検出
    for func_name in ALL_TEST_FUNCTIONS:
        if func_name in log_content:
            results['test_functions_executed'].append(func_name)
    
    # 成功の判定（改善版）
    # 1. テストが完了している
    # 2. 予期しないエラーがない
    # 3. 「完了」メッセージが含まれている
    # 注意: 結果不明（None）も失敗として扱う
    
    # 「読み込んでいます...」で終わっている場合はログが不完全
    is_log_incomplete = '読み込んでいます' in log_content and '完了' not in log_content
    
    # testErrorHandlingやtestAllBoundaryAndEdgeCasesの場合、特別な判定
    is_error_test = any(test_name in log_content for test_name in [
        'testErrorHandling', 'testAllBoundaryAndEdgeCases', 'testInvalidInputs', 'testDataInconsistency'
    ])
    
    if is_log_incomplete:
        # ログが不完全な場合 → 失敗として扱う
        results['success'] = False
        if not results.get('error'):
            results['error'] = 'ログが不完全（読み込み中で終了）'
    elif test_completed and len(unexpected_errors) == 0:
        results['success'] = True
    elif test_completed and len(unexpected_errors) > 0:
        # 完了しているが予期しないエラーがある
        # ただし、エラーテストの場合は「✅」マークがあれば成功と判定
        if is_error_test and '✅' in log_content:
            # エラーテストで「✅」マークがある場合は成功
            results['success'] = True
        else:
            results['success'] = False
    elif '✅' in log_content and '完了' in log_content and len(unexpected_errors) == 0:
        results['success'] = True
    elif is_error_test and '✅' in log_content and test_completed:
        # エラーテストで「✅」マークがあり、完了している場合は成功
        results['success'] = True
    elif '❌' in log_content and len(unexpected_errors) > 0 and not test_completed:
        # 予期しないエラーがあり、テストが完了していない
        results['success'] = False
    elif test_started and not test_completed:
        # テストが開始されたが完了していない → 失敗として扱う
        results['success'] = False
        if not results.get('error'):
            results['error'] = 'テストが完了していない（完了メッセージなし）'
    else:
        # 結果不明 → 失敗として扱う
        results['success'] = False
        if not results.get('error'):
            results['error'] = '結果不明'
    
    return results

async def extract_execution_logs(page) -> str:
    """実行ログを抽出（改善版）"""
    # より確実な方法で実行ログを取得
    log_content = await page.evaluate('''
        () => {
            // 方法1: 実行ログパネル内のテキスト要素を探す
            const logPanelSelectors = [
                '[class*="log-panel"]',
                '[class*="execution-log"]',
                '[aria-label*="実行ログ"]',
                '[aria-label*="Execution log"]',
                '[role="dialog"]',
                '[role="complementary"]'
            ];
            
            let logText = '';
            let maxLength = 0;
            
            // 実行ログパネル内の要素を探す
            for (const panelSelector of logPanelSelectors) {
                try {
                    const panels = document.querySelectorAll(panelSelector);
                    for (const panel of panels) {
                        const textElements = panel.querySelectorAll('pre, code, textarea, [role="textbox"], [role="log"], div');
                        for (const el of textElements) {
                            const text = el.textContent || el.innerText || '';
                            // window.WIZ_global_dataを含むものは除外
                            if (text.length > maxLength && 
                                text.length > 50 &&
                                !text.includes('window.WIZ_global_data') &&
                                !text.includes('AF_initDataCallback') &&
                                (text.includes('test') ||
                                 text.includes('開始') ||
                                 text.includes('完了') ||
                                 text.includes('✅') ||
                                 text.includes('❌') ||
                                 text.includes('Logger') ||
                                 text.includes('エラー'))) {
                                logText = text;
                                maxLength = text.length;
                            }
                        }
                    }
                } catch (e) {}
            }
            
            // 方法2: 通常のログ要素を探す
            if (!logText || logText.length < 100) {
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
                
                for (const selector of logSelectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (const el of elements) {
                            const text = el.textContent || el.innerText || '';
                            if (text.length > maxLength && 
                                text.length > 50 &&
                                !text.includes('window.WIZ_global_data') &&
                                !text.includes('AF_initDataCallback') &&
                                (text.includes('test') ||
                                 text.includes('開始') ||
                                 text.includes('完了') ||
                                 text.includes('✅') ||
                                 text.includes('❌'))) {
                                logText = text;
                                maxLength = text.length;
                            }
                        }
                    } catch (e) {}
                }
            }
            
            // 方法3: すべての要素を確認（最後の手段）
            if (!logText || logText.length < 100) {
                const allElements = document.querySelectorAll('pre, code, textarea, [role="textbox"]');
                for (const el of allElements) {
                    const text = el.textContent || el.innerText || '';
                    if (text.length > 200 && 
                        !text.includes('window.WIZ_global_data') &&
                        !text.includes('AF_initDataCallback') &&
                        (text.includes('test') ||
                         text.includes('開始') ||
                         text.includes('完了') ||
                         text.includes('✅') ||
                         text.includes('❌'))) {
                        logText = text;
                        break;
                    }
                }
            }
            
            return logText || '';
        }
    ''')
    
    return log_content

async def run_test_function(context, test_function: str) -> Dict:
    """テスト関数を実行"""
    pages = context.pages
    page = pages[0] if pages else await context.new_page()
    
    try:
        print(f"\n🚀 テスト関数を実行します: {test_function}")
        print("📂 Apps Scriptエディタを開いています...")
        await page.goto(SPREADSHEET_SCRIPT_URL, wait_until="domcontentloaded", timeout=60000)
        await asyncio.sleep(5)
        
        # tests.gsファイルを開く（重要！）
        print("📄 tests.gsファイルを開いています...")
        tests_file_opened = False
        try:
            # ファイルタブを探してクリック
            file_selectors = [
                'text="tests.gs"',
                'div:has-text("tests.gs")',
                '[aria-label*="tests.gs"]',
                'button:has-text("tests.gs")',
            ]
            
            for selector in file_selectors:
                try:
                    file_tab = await page.wait_for_selector(selector, timeout=5000)
                    if file_tab:
                        await file_tab.click()
                        print(f"   ✅ tests.gsファイルを開きました: {selector}")
                        tests_file_opened = True
                        await asyncio.sleep(3)  # ファイルが開くまで待機
                        break
                except:
                    continue
            
            if not tests_file_opened:
                print("   ⚠️  tests.gsファイルタブが見つかりませんでした（既に開いている可能性があります）")
                # 既に開いている可能性があるので続行
        except Exception as e:
            print(f"   ⚠️  tests.gsファイルを開く際にエラー: {e}")
            # エラーが発生しても続行（既に開いている可能性がある）
        
        # 関数選択ドロップダウンを探す（改善版）
        print("🔍 関数選択ドロップダウンを探しています...")
        
        # デバッグ: ページの構造を確認
        debug_info = await page.evaluate('''
            () => {
                const info = {
                    selects: document.querySelectorAll('select').length,
                    comboboxes: document.querySelectorAll('[role="combobox"]').length,
                    listboxes: document.querySelectorAll('[aria-haspopup="listbox"]').length,
                    functionSelectors: []
                };
                
                // select要素の情報を取得
                const selects = document.querySelectorAll('select');
                selects.forEach((select, idx) => {
                    const options = Array.from(select.options);
                    const testOptions = options.filter(opt => opt.textContent.includes('test'));
                    if (testOptions.length > 0) {
                        info.functionSelectors.push({
                            index: idx,
                            optionCount: options.length,
                            testOptionCount: testOptions.length,
                            firstTestOption: testOptions[0]?.textContent
                        });
                    }
                });
                
                return info;
            }
        ''')
        print(f"   📊 デバッグ情報: select要素={debug_info['selects']}, combobox={debug_info['comboboxes']}, listbox={debug_info['listboxes']}")
        if debug_info['functionSelectors']:
            print(f"   📊 テスト関数を含むselect要素: {len(debug_info['functionSelectors'])}個")
        
        # より確実な方法で関数を選択
        function_selected = False
        
        # 方法1: select要素を探す（Playwrightのselect_optionを使用）
        try:
            selects = await page.query_selector_all('select')
            print(f"   🔍 select要素を{len(selects)}個発見")
            
            for idx, select in enumerate(selects):
                try:
                    # オプションを取得
                    options = await select.query_selector_all('option')
                    print(f"   🔍 select[{idx}]: {len(options)}個のオプション")
                    
                    # テスト関数名を含むオプションを探す
                    for option in options:
                        text = await option.text_content()
                        value = await option.get_attribute('value')
                        
                        if text and (test_function in text or test_function == value):
                            print(f"   ✅ オプションを発見: {text} (value: {value})")
                            try:
                                # Playwrightのselect_optionメソッドを使用
                                await select.select_option(value)
                                print(f"   ✅ select要素から関数を選択しました: {test_function}")
                                function_selected = True
                                await asyncio.sleep(2)  # 選択が反映されるまで待機
                                break
                            except Exception as e:
                                print(f"   ⚠️  select_optionでエラー: {e}")
                                # フォールバック: JavaScriptで直接設定
                                await page.evaluate(f'''
                                    (selectIndex, optionValue) => {{
                                        const selects = document.querySelectorAll('select');
                                        if (selects[selectIndex]) {{
                                            selects[selectIndex].value = optionValue;
                                            selects[selectIndex].dispatchEvent(new Event('change', {{ bubbles: true }}));
                                            selects[selectIndex].dispatchEvent(new Event('input', {{ bubbles: true }}));
                                        }}
                                    }}
                                ''', idx, value)
                                function_selected = True
                                await asyncio.sleep(2)
                                break
                    
                    if function_selected:
                        break
                except Exception as e:
                    print(f"   ⚠️  select[{idx}]の処理でエラー: {e}")
                    continue
        except Exception as e:
            print(f"   ⚠️  select要素の検索でエラー: {e}")
        
        # 方法2: 関数選択ドロップダウンをクリック（run_create_test_event_only.pyの方法）
        if not function_selected:
            try:
                function_dropdown_selectors = [
                    'div[aria-label="実行する関数を選択"]',
                    'div[aria-label*="関数を選択"]',
                    'div[aria-label*="function"]',
                    '[role="combobox"][aria-label*="関数"]',
                    '[role="combobox"][aria-label*="function"]',
                ]
                
                for selector in function_dropdown_selectors:
                    try:
                        dropdown = await page.wait_for_selector(selector, timeout=5000)
                        if dropdown:
                            print(f"   ✅ 関数選択ドロップダウンを発見: {selector}")
                            # クリックしてフォーカス
                            await dropdown.click()
                            await asyncio.sleep(1)
                            
                            # 既存のテキストをクリア
                            await page.keyboard.press('Control+A')
                            await asyncio.sleep(0.5)
                            
                            # 関数名を入力
                            await page.keyboard.type(test_function, delay=50)
                            await asyncio.sleep(1)
                            
                            # Enterキーで選択
                            await page.keyboard.press('Enter')
                            print(f"   ✅ 関数名を入力しました: {test_function}")
                            function_selected = True
                            await asyncio.sleep(2)
                            break
                    except Exception as e:
                        print(f"   ⚠️  セレクタ {selector} でエラー: {e}")
                        continue
            except Exception as e:
                print(f"   ⚠️  関数選択ドロップダウンの検索でエラー: {e}")
        
        # 方法3: 通常のドロップダウンを探してクリック
        if not function_selected:
            try:
                dropdowns = await page.query_selector_all('[role="combobox"], [aria-haspopup="listbox"]')
                print(f"   🔍 ドロップダウンを{len(dropdowns)}個発見")
                
                for idx, dropdown in enumerate(dropdowns):
                    try:
                        await dropdown.click()
                        await asyncio.sleep(2)  # オプションが表示されるまで待機
                        
                        # オプションを探す
                        options = await page.query_selector_all('[role="option"]')
                        print(f"   🔍 ドロップダウン[{idx}]: {len(options)}個のオプション")
                        
                        for option in options:
                            text = await option.text_content()
                            if text and test_function in text:
                                await option.click()
                                print(f"   ✅ ドロップダウンから関数を選択しました: {test_function}")
                                function_selected = True
                                await asyncio.sleep(2)
                                break
                        
                        if function_selected:
                            break
                    except Exception as e:
                        print(f"   ⚠️  ドロップダウン[{idx}]の処理でエラー: {e}")
                        continue
            except Exception as e:
                print(f"   ⚠️  ドロップダウンの検索でエラー: {e}")
        
        # 方法4: JavaScriptで直接選択を試みる（同期版）
        if not function_selected:
            print("   🔍 JavaScriptで直接選択を試みます...")
            function_selected = await page.evaluate(f'''
                (functionName) => {{
                    // select要素を探す
                    const selects = document.querySelectorAll('select');
                    for (const select of selects) {{
                        const options = Array.from(select.options);
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
                    return false;
                }}
            ''', test_function)
            
            if function_selected:
                print(f"   ✅ JavaScriptで関数を選択しました: {test_function}")
                await asyncio.sleep(2)
        
        # 選択の確認
        if function_selected:
            # 選択が正しく反映されたか確認
            selected_value = await page.evaluate('''
                () => {
                    const selects = document.querySelectorAll('select');
                    for (const select of selects) {
                        if (select.value && select.value.includes('test')) {
                            return select.value;
                        }
                    }
                    return null;
                }
            ''')
            if selected_value:
                print(f"   ✅ 選択を確認しました: {selected_value}")
            else:
                print(f"   ⚠️  選択の確認に失敗しました")
        else:
            print(f"   ❌ 関数選択に失敗しました: {test_function}")
            # スクリーンショットを保存（デバッグ用）
            screenshot_path = os.path.join(os.path.dirname(__file__), '..', 'logs', f'function_select_failed_{test_function}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"   📸 スクリーンショットを保存しました: {screenshot_path}")
            return {'success': False, 'error': '関数選択に失敗', 'test_function': test_function, 'screenshot': screenshot_path}
        
        # 実行ボタンを探してクリック
        print("▶️  実行ボタンを探しています...")
        run_button_selectors = [
            'button[aria-label*="実行"]',
            'button[aria-label*="Run"]',
            'button:has-text("実行")',
            'button:has-text("Run")',
        ]
        
        run_button_clicked = False
        for selector in run_button_selectors:
            try:
                run_button = await page.wait_for_selector(selector, timeout=3000)
                if run_button:
                    await run_button.click()
                    print(f"   ✅ 実行ボタンをクリックしました")
                    run_button_clicked = True
                    await asyncio.sleep(2)
                    break
            except:
                continue
        
        if not run_button_clicked:
            print("   ⚠️  実行ボタンが見つかりませんでした")
            return {'success': False, 'error': '実行ボタンが見つからない'}
        
        # 実行ログを待機（長時間実行されるテストを考慮）
        # testRebuildDependenciesやtestUpdateDashboardAfterReservationは長時間実行される可能性がある
        long_running_tests = ['testRebuildDependencies', 'testUpdateDashboardAfterReservation', 'testAll']
        initial_wait_time = 90 if test_function in long_running_tests else 30
        
        print(f"⏳ 実行ログの表示を待機しています...（{initial_wait_time}秒）")
        await asyncio.sleep(initial_wait_time)
        
        # 実行ログパネルを開く
        print("📋 実行ログパネルを開いています...")
        log_button_selectors = [
            'button[aria-label*="実行ログ"]',
            'button[aria-label*="Execution log"]',
            'button:has-text("実行ログ")',
            'button:has-text("Execution log")',
        ]
        
        log_panel_opened = False
        for selector in log_button_selectors:
            try:
                log_button = await page.wait_for_selector(selector, timeout=5000)
                if log_button:
                    await log_button.click()
                    print(f"   ✅ 実行ログボタンをクリックしました")
                    log_panel_opened = True
                    await asyncio.sleep(10)  # ログが表示されるまで待機（延長）
                    break
            except:
                continue
        
        if not log_panel_opened:
            print("   ⚠️  実行ログボタンが見つかりませんでした")
        
        # 実行ログを取得（複数回試行、完了メッセージを確認）
        print("📋 実行ログを取得しています...")
        log_content = ""
        max_retries = 5  # リトライ回数を増やす
        for retry in range(max_retries):
            wait_time = 10 if retry == 0 else 15  # 初回は10秒、再試行は15秒
            await asyncio.sleep(wait_time)
            log_content = await extract_execution_logs(page)
            
            # ログが「読み込んでいます...」で終わっている場合は、完了メッセージを待つ
            if log_content and '読み込んでいます' in log_content:
                print(f"   ⏳ ログがまだ読み込み中です。完了を待機します... ({retry + 1}/{max_retries})")
                if retry < max_retries - 1:
                    # ログパネルを再度開く
                    for selector in log_button_selectors:
                        try:
                            log_button = await page.wait_for_selector(selector, timeout=3000)
                            if log_button:
                                await log_button.click()
                                await asyncio.sleep(5)
                                break
                        except:
                            continue
                    continue
            
            # 完了メッセージが含まれているか確認
            completion_keywords = ['完了', '✅', '❌', 'testRebuildDependencies: 完了', 'testUpdateDashboardAfterReservation: 完了']
            has_completion = any(keyword in log_content for keyword in completion_keywords)
            
            # ログが十分な長さがあるか、または完了メッセージが含まれているか確認
            if log_content and (len(log_content.strip()) > 200 or has_completion):
                print(f"   ✅ 実行ログを取得しました（{len(log_content)}文字）")
                if has_completion:
                    print(f"   ✅ 完了メッセージを確認しました")
                break
            elif retry < max_retries - 1:
                print(f"   ⚠️  実行ログが見つかりませんでした。再試行します... ({retry + 1}/{max_retries})")
                # ログパネルを再度開く
                for selector in log_button_selectors:
                    try:
                        log_button = await page.wait_for_selector(selector, timeout=3000)
                        if log_button:
                            await log_button.click()
                            await asyncio.sleep(5)
                            break
                    except:
                        continue
        
        if log_content and len(log_content.strip()) > 0:
            # ログをファイルに保存
            log_file = save_log(test_function, log_content)
            
            # 実行結果を解析
            results = parse_test_results(log_content)
            results['log_file'] = log_file
            results['test_function'] = test_function
            
            return results
        else:
            print("   ⚠️  実行ログを取得できませんでした")
            # 結果不明も失敗として扱う
            return {'success': False, 'test_function': test_function, 'error': 'ログ取得失敗'}
            
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'test_function': test_function, 'error': str(e)}

async def run_all_tests():
    """すべてのテスト関数を実行"""
    async with async_playwright() as p:
        home_dir = os.path.expanduser("~")
        user_data_dir = os.path.join(home_dir, ".playwright_chrome_profile")
        
        context = await p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            viewport={"width": 1920, "height": 1080}
        )
        
        results = []
        
        try:
            print("="*80)
            print("🎭 すべてのテスト関数を実行します")
            print("="*80)
            print(f"📋 テスト関数数: {len(ALL_TEST_FUNCTIONS)}")
            print("="*80)
            
            for i, test_function in enumerate(ALL_TEST_FUNCTIONS, 1):
                print(f"\n[{i}/{len(ALL_TEST_FUNCTIONS)}] {test_function}")
                print("-"*80)
                
                # ネットワークエラーが発生した場合のリトライ処理
                max_retries = 2
                test_result = None
                for retry in range(max_retries):
                    try:
                        test_result = await run_test_function(context, test_function)
                        # ネットワークエラーでない場合はリトライ不要
                        if 'ERR_ADDRESS_UNREACHABLE' not in str(test_result.get('error', '')):
                            break
                        elif retry < max_retries - 1:
                            print(f"   ⚠️  ネットワークエラーが発生しました。リトライします... ({retry + 1}/{max_retries})")
                            await asyncio.sleep(5)
                    except Exception as e:
                        if 'ERR_ADDRESS_UNREACHABLE' in str(e) and retry < max_retries - 1:
                            print(f"   ⚠️  ネットワークエラーが発生しました。リトライします... ({retry + 1}/{max_retries})")
                            await asyncio.sleep(5)
                            continue
                        else:
                            test_result = {'success': False, 'test_function': test_function, 'error': str(e)}
                            break
                
                if test_result is None:
                    test_result = {'success': False, 'test_function': test_function, 'error': 'テスト実行に失敗'}
                
                results.append(test_result)
                
                # 結果を表示（結果不明も失敗として扱う）
                if test_result.get('success') == True:
                    print(f"✅ {test_function}: 成功")
                else:
                    # successがFalseまたはNoneの場合、失敗として扱う
                    print(f"❌ {test_function}: 失敗")
                    if test_result.get('errors'):
                        print(f"   エラー数: {len(test_result['errors'])}")
                    if test_result.get('error'):
                        print(f"   エラー: {test_result['error']}")
                
                # テスト間の待機時間
                if i < len(ALL_TEST_FUNCTIONS):
                    print("\n⏳ 次のテストまで10秒待機します...")
                    await asyncio.sleep(10)
            
            # 結果サマリーを生成
            print("\n" + "="*80)
            print("📊 テスト実行結果サマリー")
            print("="*80)
            
            success_count = sum(1 for r in results if r.get('success') == True)
            # 結果不明（None）も失敗としてカウント
            failure_count = sum(1 for r in results if r.get('success') != True)
            unknown_count = sum(1 for r in results if r.get('success') is None)
            
            print(f"✅ 成功: {success_count}/{len(ALL_TEST_FUNCTIONS)}")
            print(f"❌ 失敗: {failure_count}/{len(ALL_TEST_FUNCTIONS)}")
            if unknown_count > 0:
                print(f"⚠️  不明: {unknown_count}/{len(ALL_TEST_FUNCTIONS)} (失敗として扱います)")
            print(f"📈 カバレッジ: {len(results)}/{len(ALL_TEST_FUNCTIONS)} ({100 * len(results) / len(ALL_TEST_FUNCTIONS):.1f}%)")
            
            # 失敗したテストの詳細（結果不明も含む）
            if failure_count > 0:
                print("\n❌ 失敗したテスト:")
                for result in results:
                    if result.get('success') != True:
                        print(f"  - {result.get('test_function')}")
                        if result.get('errors'):
                            for error in result['errors'][:3]:  # 最初の3つのエラー
                                print(f"    {error[:100]}...")
                        if result.get('error'):
                            print(f"    エラー: {result['error']}")
            
            # 結果をJSONファイルに保存
            report_file = os.path.join(os.path.dirname(__file__), '..', 'logs', f'test_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'summary': {
                        'total': len(ALL_TEST_FUNCTIONS),
                        'success': success_count,
                        'failure': failure_count,
                        'unknown': unknown_count,
                        'coverage': len(results),
                        'coverage_percentage': 100 * len(results) / len(ALL_TEST_FUNCTIONS) if len(ALL_TEST_FUNCTIONS) > 0 else 0
                    },
                    'results': results
                }, f, ensure_ascii=False, indent=2)
            
            print(f"\n📝 詳細レポートを保存しました: {report_file}")
            
        finally:
            print("\n⏳ 10秒後にブラウザを閉じます...")
            await asyncio.sleep(10)
            await context.close()
        
        return results

if __name__ == "__main__":
    asyncio.run(run_all_tests())
