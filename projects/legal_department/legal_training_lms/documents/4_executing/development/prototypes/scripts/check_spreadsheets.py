#!/usr/bin/env python3
"""
3つのスプレッドシート（1期生、2期生、3期生）の構造を確認するスクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import json

# 3つのスプレッドシートのURL
SPREADSHEETS = [
    {
        'name': '1期生',
        'url': 'https://docs.google.com/spreadsheets/d/1IaunHch_ugiEIw91AaDEHEHKNaP0RDHm5ZFN_gTU5Fs/edit?gid=115666812#gid=115666812',
        'id': '1IaunHch_ugiEIw91AaDEHEHKNaP0RDHm5ZFN_gTU5Fs'
    },
    {
        'name': '2期生',
        'url': 'https://docs.google.com/spreadsheets/d/1tyn9AelB-MTEd1ywVvMMr4H7hKQ1wjoIVUDLkZl_iBg/edit?gid=2079770910#gid=2079770910',
        'id': '1tyn9AelB-MTEd1ywVvMMr4H7hKQ1wjoIVUDLkZl_iBg'
    },
    {
        'name': '3期生',
        'url': 'https://docs.google.com/spreadsheets/d/1fWvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQclI/edit?gid=1024145159#gid=1024145159',
        'id': '1fWvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQclI'
    }
]

async def check_spreadsheet(page, spreadsheet_info):
    """スプレッドシートの構造を確認"""
    name = spreadsheet_info['name']
    url = spreadsheet_info['url']
    spreadsheet_id = spreadsheet_info['id']
    
    print(f"\n{'='*80}")
    print(f"📊 {name}のスプレッドシートを確認中...")
    print(f"{'='*80}")
    print(f"URL: {url}")
    print(f"ID: {spreadsheet_id}")
    
    try:
        # スプレッドシートを開く
        print(f"\n🌐 {name}のスプレッドシートを開いています...")
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=120000)
            await asyncio.sleep(5)  # 読み込み待機（Google Sheetsは読み込みに時間がかかる）
        except Exception as e:
            print(f"⚠️ ページ読み込みでタイムアウトまたはエラー: {e}")
            print("   ページが部分的に読み込まれている可能性があります。続行します...")
            await asyncio.sleep(3)
        
        # スプレッドシートのタイトルを取得
        try:
            title = await page.title()
            print(f"✅ タイトル: {title}")
        except Exception as e:
            print(f"⚠️ タイトルの取得に失敗: {e}")
        
        # シート一覧を取得
        print(f"\n📋 シート一覧を確認中...")
        try:
            # JavaScriptでシート名を取得（より確実な方法）
            await asyncio.sleep(2)  # シートタブが読み込まれるまで待機
            sheet_names_js = await page.evaluate("""
                () => {
                    // 複数の方法でシートタブを探す
                    const selectors = [
                        '[role="tab"]',
                        '[data-sheet-name]',
                        '.docs-sheet-tab',
                        '[aria-label*="シート"]',
                        '[aria-label*="Sheet"]'
                    ];
                    
                    let sheetNames = new Set();
                    
                    for (const selector of selectors) {
                        const elements = document.querySelectorAll(selector);
                        for (const el of elements) {
                            // データ属性から取得
                            const sheetName = el.getAttribute('data-sheet-name') || 
                                            el.getAttribute('aria-label') ||
                                            el.textContent?.trim();
                            
                            if (sheetName && 
                                !sheetName.includes('高度なオプション') &&
                                !sheetName.includes('抽出') &&
                                !sheetName.includes('更新と管理') &&
                                !sheetName.includes('Advanced') &&
                                !sheetName.includes('Extract') &&
                                !sheetName.includes('Update')) {
                                sheetNames.add(sheetName);
                            }
                        }
                    }
                    
                    // シートタブコンテナから直接取得
                    const sheetContainer = document.querySelector('[role="tablist"]');
                    if (sheetContainer) {
                        const tabs = sheetContainer.querySelectorAll('[role="tab"]');
                        for (const tab of tabs) {
                            const name = tab.getAttribute('data-sheet-name') || 
                                       tab.getAttribute('aria-label') ||
                                       tab.textContent?.trim();
                            if (name && name.length > 0 && name.length < 50) {
                                sheetNames.add(name);
                            }
                        }
                    }
                    
                    return Array.from(sheetNames);
                }
            """)
            
            if sheet_names_js and len(sheet_names_js) > 0:
                print(f"✅ シート一覧（{len(sheet_names_js)}件）:")
                for i, sheet_name in enumerate(sheet_names_js, 1):
                    print(f"   {i}. {sheet_name}")
            else:
                print("⚠️ シートタブが見つかりませんでした")
                # フォールバック: すべてのタブを表示
                all_tabs = await page.query_selector_all('[role="tab"]')
                if all_tabs:
                    print(f"   見つかったタブ要素数: {len(all_tabs)}")
                    for i, tab in enumerate(all_tabs[:10], 1):  # 最初の10個のみ
                        try:
                            tab_text = await tab.text_content()
                            tab_aria = await tab.get_attribute('aria-label')
                            tab_data = await tab.get_attribute('data-sheet-name')
                            print(f"   タブ{i}: text='{tab_text}', aria-label='{tab_aria}', data-sheet-name='{tab_data}'")
                        except:
                            pass
        except Exception as e:
            print(f"⚠️ シート一覧の取得に失敗: {e}")
            import traceback
            traceback.print_exc()
        
        # データが含まれそうなシートを探す（「予約一覧」または日付形式のシート名）
        print(f"\n📊 データシートを確認中...")
        try:
            # シート名のリストが取得できているか確認
            if not sheet_names_js or len(sheet_names_js) == 0:
                print("⚠️ シート名のリストが取得できていません")
                return
            
            # データが含まれそうなシート名の候補
            candidate_sheet_names = ['予約一覧', 'カレンダー', '予約', 'スケジュール']
            
            # 日付形式のシート名も探す（例: "026年1月", "025年12月"など）
            import re
            date_pattern = re.compile(r'\d{2,4}年\d{1,2}月')
            
            # シート名のリストから候補を探す
            target_sheet_name = None
            for sheet_name in sheet_names_js:
                # 「予約一覧」などの候補名と一致するか
                if any(candidate in sheet_name for candidate in candidate_sheet_names):
                    target_sheet_name = sheet_name
                    break
                # 日付形式のシート名か
                if date_pattern.search(sheet_name):
                    target_sheet_name = sheet_name
                    break
            
            if not target_sheet_name:
                # 最初のデータらしいシートを探す（「カレンダー」など）
                for sheet_name in sheet_names_js:
                    if not any(exclude in sheet_name for exclude in ['Keep', 'ToDo', 'コンタクト', 'マップ', 'Atlassian', 'アドオン', 'スプレッドシート', 'シート', 'AppSheet', 'ホーム']):
                        if len(sheet_name) > 0 and len(sheet_name) < 30:
                            target_sheet_name = sheet_name
                            break
            
            if target_sheet_name:
                print(f"✅ 対象シート: {target_sheet_name}")
                
                # JavaScriptでシートをクリック
                clicked = await page.evaluate(f"""
                    () => {{
                        const tabs = document.querySelectorAll('[role="tab"]');
                        for (const tab of tabs) {{
                            const name = tab.getAttribute('data-sheet-name') || 
                                       tab.getAttribute('aria-label') ||
                                       tab.textContent?.trim();
                            if (name && name.includes('{target_sheet_name}')) {{
                                tab.click();
                                return true;
                            }}
                        }}
                        return false;
                    }}
                """)
                
                if clicked:
                    await asyncio.sleep(3)  # シート切り替え待機
                else:
                    print(f"⚠️ シート「{target_sheet_name}」のクリックに失敗しました")
                    return
            
            # ヘッダー行を取得
            await asyncio.sleep(2)  # シートが読み込まれるまで待機
            header_row = await page.evaluate("""
                () => {
                    const sheet = document.querySelector('[role="grid"]');
                    if (!sheet) return null;
                    
                    const firstRow = sheet.querySelector('[role="row"]');
                    if (!firstRow) return null;
                    
                    const cells = firstRow.querySelectorAll('[role="gridcell"]');
                    return Array.from(cells).slice(0, 15).map(cell => {
                        const input = cell.querySelector('input');
                        return input ? input.value : cell.textContent?.trim() || '';
                    }).filter(Boolean);
                }
            """)
            
            if header_row:
                print(f"\n✅ ヘッダー行（{len(header_row)}列）:")
                for i, header in enumerate(header_row, 1):
                    print(f"   {i}. {header}")
            else:
                print("⚠️ ヘッダー行が取得できませんでした")
            
            # データ行数を取得
            data_row_count = await page.evaluate("""
                () => {
                    const sheet = document.querySelector('[role="grid"]');
                    if (!sheet) return 0;
                    
                    const rows = sheet.querySelectorAll('[role="row"]');
                    return rows.length - 1; // ヘッダー行を除く
                }
            """)
            
            print(f"\n✅ データ行数: {data_row_count}行（ヘッダー除く）")
            
            # 最初の数行のデータを取得
            if data_row_count > 0:
                sample_data = await page.evaluate("""
                    () => {
                        const sheet = document.querySelector('[role="grid"]');
                        if (!sheet) return [];
                        
                        const rows = Array.from(sheet.querySelectorAll('[role="row"]')).slice(1, 4); // 最初の3行
                        return rows.map(row => {
                            const cells = row.querySelectorAll('[role="gridcell"]');
                            return Array.from(cells).slice(0, 12).map(cell => {
                                const input = cell.querySelector('input');
                                return input ? input.value : cell.textContent?.trim() || '';
                            });
                        });
                    }
                """)
                
                if sample_data:
                    print(f"\n📝 サンプルデータ（最初の{len(sample_data)}行）:")
                    for i, row in enumerate(sample_data, 1):
                        print(f"   行{i+1}: {row}")
                else:
                    print("⚠️ サンプルデータが取得できませんでした")
        except Exception as e:
            print(f"⚠️ 「予約一覧」シートの確認に失敗: {e}")
            import traceback
            traceback.print_exc()
        
        # スクリーンショットを取得
        try:
            screenshot_path = f"/tmp/spreadsheet_{name.replace('期生', '')}.png"
            await page.screenshot(path=screenshot_path, full_page=False)
            print(f"📸 スクリーンショットを保存: {screenshot_path}")
        except Exception as e:
            print(f"⚠️ スクリーンショットの保存に失敗: {e}")
        
    except Exception as e:
        print(f"❌ {name}のスプレッドシート確認中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """メイン処理"""
    print("="*80)
    print("📊 3つのスプレッドシート（1期生、2期生、3期生）の構造確認")
    print("="*80)
    
    async with async_playwright() as p:
        # 永続的なコンテキストを使用（ログイン状態を維持）
        user_data_dir = os.path.expanduser('~/.playwright_chrome_profile')
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1920, 'height': 1080},
            args=['--disable-blink-features=AutomationControlled']
        )
        
        page = await context.new_page()
        
        try:
            # 各スプレッドシートを確認
            for spreadsheet_info in SPREADSHEETS:
                await check_spreadsheet(page, spreadsheet_info)
                await asyncio.sleep(2)  # 各スプレッドシート間で少し待機
            
            print("\n" + "="*80)
            print("✅ すべてのスプレッドシートの確認が完了しました")
            print("="*80)
            
        except Exception as e:
            print(f"\n❌ エラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # ブラウザを閉じない（ログイン状態を維持するため）
            print("\n💡 ブラウザは開いたままにしておきます（ログイン状態を維持）")
            print("   手動で閉じるか、Ctrl+Cで終了してください")

if __name__ == '__main__':
    import os
    asyncio.run(main())


3つのスプレッドシート（1期生、2期生、3期生）の構造を確認するスクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import json

# 3つのスプレッドシートのURL
SPREADSHEETS = [
    {
        'name': '1期生',
        'url': 'https://docs.google.com/spreadsheets/d/1IaunHch_ugiEIw91AaDEHEHKNaP0RDHm5ZFN_gTU5Fs/edit?gid=115666812#gid=115666812',
        'id': '1IaunHch_ugiEIw91AaDEHEHKNaP0RDHm5ZFN_gTU5Fs'
    },
    {
        'name': '2期生',
        'url': 'https://docs.google.com/spreadsheets/d/1tyn9AelB-MTEd1ywVvMMr4H7hKQ1wjoIVUDLkZl_iBg/edit?gid=2079770910#gid=2079770910',
        'id': '1tyn9AelB-MTEd1ywVvMMr4H7hKQ1wjoIVUDLkZl_iBg'
    },
    {
        'name': '3期生',
        'url': 'https://docs.google.com/spreadsheets/d/1fWvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQclI/edit?gid=1024145159#gid=1024145159',
        'id': '1fWvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQclI'
    }
]

async def check_spreadsheet(page, spreadsheet_info):
    """スプレッドシートの構造を確認"""
    name = spreadsheet_info['name']
    url = spreadsheet_info['url']
    spreadsheet_id = spreadsheet_info['id']
    
    print(f"\n{'='*80}")
    print(f"📊 {name}のスプレッドシートを確認中...")
    print(f"{'='*80}")
    print(f"URL: {url}")
    print(f"ID: {spreadsheet_id}")
    
    try:
        # スプレッドシートを開く
        print(f"\n🌐 {name}のスプレッドシートを開いています...")
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=120000)
            await asyncio.sleep(5)  # 読み込み待機（Google Sheetsは読み込みに時間がかかる）
        except Exception as e:
            print(f"⚠️ ページ読み込みでタイムアウトまたはエラー: {e}")
            print("   ページが部分的に読み込まれている可能性があります。続行します...")
            await asyncio.sleep(3)
        
        # スプレッドシートのタイトルを取得
        try:
            title = await page.title()
            print(f"✅ タイトル: {title}")
        except Exception as e:
            print(f"⚠️ タイトルの取得に失敗: {e}")
        
        # シート一覧を取得
        print(f"\n📋 シート一覧を確認中...")
        try:
            # JavaScriptでシート名を取得（より確実な方法）
            await asyncio.sleep(2)  # シートタブが読み込まれるまで待機
            sheet_names_js = await page.evaluate("""
                () => {
                    // 複数の方法でシートタブを探す
                    const selectors = [
                        '[role="tab"]',
                        '[data-sheet-name]',
                        '.docs-sheet-tab',
                        '[aria-label*="シート"]',
                        '[aria-label*="Sheet"]'
                    ];
                    
                    let sheetNames = new Set();
                    
                    for (const selector of selectors) {
                        const elements = document.querySelectorAll(selector);
                        for (const el of elements) {
                            // データ属性から取得
                            const sheetName = el.getAttribute('data-sheet-name') || 
                                            el.getAttribute('aria-label') ||
                                            el.textContent?.trim();
                            
                            if (sheetName && 
                                !sheetName.includes('高度なオプション') &&
                                !sheetName.includes('抽出') &&
                                !sheetName.includes('更新と管理') &&
                                !sheetName.includes('Advanced') &&
                                !sheetName.includes('Extract') &&
                                !sheetName.includes('Update')) {
                                sheetNames.add(sheetName);
                            }
                        }
                    }
                    
                    // シートタブコンテナから直接取得
                    const sheetContainer = document.querySelector('[role="tablist"]');
                    if (sheetContainer) {
                        const tabs = sheetContainer.querySelectorAll('[role="tab"]');
                        for (const tab of tabs) {
                            const name = tab.getAttribute('data-sheet-name') || 
                                       tab.getAttribute('aria-label') ||
                                       tab.textContent?.trim();
                            if (name && name.length > 0 && name.length < 50) {
                                sheetNames.add(name);
                            }
                        }
                    }
                    
                    return Array.from(sheetNames);
                }
            """)
            
            if sheet_names_js and len(sheet_names_js) > 0:
                print(f"✅ シート一覧（{len(sheet_names_js)}件）:")
                for i, sheet_name in enumerate(sheet_names_js, 1):
                    print(f"   {i}. {sheet_name}")
            else:
                print("⚠️ シートタブが見つかりませんでした")
                # フォールバック: すべてのタブを表示
                all_tabs = await page.query_selector_all('[role="tab"]')
                if all_tabs:
                    print(f"   見つかったタブ要素数: {len(all_tabs)}")
                    for i, tab in enumerate(all_tabs[:10], 1):  # 最初の10個のみ
                        try:
                            tab_text = await tab.text_content()
                            tab_aria = await tab.get_attribute('aria-label')
                            tab_data = await tab.get_attribute('data-sheet-name')
                            print(f"   タブ{i}: text='{tab_text}', aria-label='{tab_aria}', data-sheet-name='{tab_data}'")
                        except:
                            pass
        except Exception as e:
            print(f"⚠️ シート一覧の取得に失敗: {e}")
            import traceback
            traceback.print_exc()
        
        # データが含まれそうなシートを探す（「予約一覧」または日付形式のシート名）
        print(f"\n📊 データシートを確認中...")
        try:
            # シート名のリストが取得できているか確認
            if not sheet_names_js or len(sheet_names_js) == 0:
                print("⚠️ シート名のリストが取得できていません")
                return
            
            # データが含まれそうなシート名の候補
            candidate_sheet_names = ['予約一覧', 'カレンダー', '予約', 'スケジュール']
            
            # 日付形式のシート名も探す（例: "026年1月", "025年12月"など）
            import re
            date_pattern = re.compile(r'\d{2,4}年\d{1,2}月')
            
            # シート名のリストから候補を探す
            target_sheet_name = None
            for sheet_name in sheet_names_js:
                # 「予約一覧」などの候補名と一致するか
                if any(candidate in sheet_name for candidate in candidate_sheet_names):
                    target_sheet_name = sheet_name
                    break
                # 日付形式のシート名か
                if date_pattern.search(sheet_name):
                    target_sheet_name = sheet_name
                    break
            
            if not target_sheet_name:
                # 最初のデータらしいシートを探す（「カレンダー」など）
                for sheet_name in sheet_names_js:
                    if not any(exclude in sheet_name for exclude in ['Keep', 'ToDo', 'コンタクト', 'マップ', 'Atlassian', 'アドオン', 'スプレッドシート', 'シート', 'AppSheet', 'ホーム']):
                        if len(sheet_name) > 0 and len(sheet_name) < 30:
                            target_sheet_name = sheet_name
                            break
            
            if target_sheet_name:
                print(f"✅ 対象シート: {target_sheet_name}")
                
                # JavaScriptでシートをクリック
                clicked = await page.evaluate(f"""
                    () => {{
                        const tabs = document.querySelectorAll('[role="tab"]');
                        for (const tab of tabs) {{
                            const name = tab.getAttribute('data-sheet-name') || 
                                       tab.getAttribute('aria-label') ||
                                       tab.textContent?.trim();
                            if (name && name.includes('{target_sheet_name}')) {{
                                tab.click();
                                return true;
                            }}
                        }}
                        return false;
                    }}
                """)
                
                if clicked:
                    await asyncio.sleep(3)  # シート切り替え待機
                else:
                    print(f"⚠️ シート「{target_sheet_name}」のクリックに失敗しました")
                    return
            
            # ヘッダー行を取得
            await asyncio.sleep(2)  # シートが読み込まれるまで待機
            header_row = await page.evaluate("""
                () => {
                    const sheet = document.querySelector('[role="grid"]');
                    if (!sheet) return null;
                    
                    const firstRow = sheet.querySelector('[role="row"]');
                    if (!firstRow) return null;
                    
                    const cells = firstRow.querySelectorAll('[role="gridcell"]');
                    return Array.from(cells).slice(0, 15).map(cell => {
                        const input = cell.querySelector('input');
                        return input ? input.value : cell.textContent?.trim() || '';
                    }).filter(Boolean);
                }
            """)
            
            if header_row:
                print(f"\n✅ ヘッダー行（{len(header_row)}列）:")
                for i, header in enumerate(header_row, 1):
                    print(f"   {i}. {header}")
            else:
                print("⚠️ ヘッダー行が取得できませんでした")
            
            # データ行数を取得
            data_row_count = await page.evaluate("""
                () => {
                    const sheet = document.querySelector('[role="grid"]');
                    if (!sheet) return 0;
                    
                    const rows = sheet.querySelectorAll('[role="row"]');
                    return rows.length - 1; // ヘッダー行を除く
                }
            """)
            
            print(f"\n✅ データ行数: {data_row_count}行（ヘッダー除く）")
            
            # 最初の数行のデータを取得
            if data_row_count > 0:
                sample_data = await page.evaluate("""
                    () => {
                        const sheet = document.querySelector('[role="grid"]');
                        if (!sheet) return [];
                        
                        const rows = Array.from(sheet.querySelectorAll('[role="row"]')).slice(1, 4); // 最初の3行
                        return rows.map(row => {
                            const cells = row.querySelectorAll('[role="gridcell"]');
                            return Array.from(cells).slice(0, 12).map(cell => {
                                const input = cell.querySelector('input');
                                return input ? input.value : cell.textContent?.trim() || '';
                            });
                        });
                    }
                """)
                
                if sample_data:
                    print(f"\n📝 サンプルデータ（最初の{len(sample_data)}行）:")
                    for i, row in enumerate(sample_data, 1):
                        print(f"   行{i+1}: {row}")
                else:
                    print("⚠️ サンプルデータが取得できませんでした")
        except Exception as e:
            print(f"⚠️ 「予約一覧」シートの確認に失敗: {e}")
            import traceback
            traceback.print_exc()
        
        # スクリーンショットを取得
        try:
            screenshot_path = f"/tmp/spreadsheet_{name.replace('期生', '')}.png"
            await page.screenshot(path=screenshot_path, full_page=False)
            print(f"📸 スクリーンショットを保存: {screenshot_path}")
        except Exception as e:
            print(f"⚠️ スクリーンショットの保存に失敗: {e}")
        
    except Exception as e:
        print(f"❌ {name}のスプレッドシート確認中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """メイン処理"""
    print("="*80)
    print("📊 3つのスプレッドシート（1期生、2期生、3期生）の構造確認")
    print("="*80)
    
    async with async_playwright() as p:
        # 永続的なコンテキストを使用（ログイン状態を維持）
        user_data_dir = os.path.expanduser('~/.playwright_chrome_profile')
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1920, 'height': 1080},
            args=['--disable-blink-features=AutomationControlled']
        )
        
        page = await context.new_page()
        
        try:
            # 各スプレッドシートを確認
            for spreadsheet_info in SPREADSHEETS:
                await check_spreadsheet(page, spreadsheet_info)
                await asyncio.sleep(2)  # 各スプレッドシート間で少し待機
            
            print("\n" + "="*80)
            print("✅ すべてのスプレッドシートの確認が完了しました")
            print("="*80)
            
        except Exception as e:
            print(f"\n❌ エラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # ブラウザを閉じない（ログイン状態を維持するため）
            print("\n💡 ブラウザは開いたままにしておきます（ログイン状態を維持）")
            print("   手動で閉じるか、Ctrl+Cで終了してください")

if __name__ == '__main__':
    import os
    asyncio.run(main())


3つのスプレッドシート（1期生、2期生、3期生）の構造を確認するスクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import json

# 3つのスプレッドシートのURL
SPREADSHEETS = [
    {
        'name': '1期生',
        'url': 'https://docs.google.com/spreadsheets/d/1IaunHch_ugiEIw91AaDEHEHKNaP0RDHm5ZFN_gTU5Fs/edit?gid=115666812#gid=115666812',
        'id': '1IaunHch_ugiEIw91AaDEHEHKNaP0RDHm5ZFN_gTU5Fs'
    },
    {
        'name': '2期生',
        'url': 'https://docs.google.com/spreadsheets/d/1tyn9AelB-MTEd1ywVvMMr4H7hKQ1wjoIVUDLkZl_iBg/edit?gid=2079770910#gid=2079770910',
        'id': '1tyn9AelB-MTEd1ywVvMMr4H7hKQ1wjoIVUDLkZl_iBg'
    },
    {
        'name': '3期生',
        'url': 'https://docs.google.com/spreadsheets/d/1fWvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQclI/edit?gid=1024145159#gid=1024145159',
        'id': '1fWvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQclI'
    }
]

async def check_spreadsheet(page, spreadsheet_info):
    """スプレッドシートの構造を確認"""
    name = spreadsheet_info['name']
    url = spreadsheet_info['url']
    spreadsheet_id = spreadsheet_info['id']
    
    print(f"\n{'='*80}")
    print(f"📊 {name}のスプレッドシートを確認中...")
    print(f"{'='*80}")
    print(f"URL: {url}")
    print(f"ID: {spreadsheet_id}")
    
    try:
        # スプレッドシートを開く
        print(f"\n🌐 {name}のスプレッドシートを開いています...")
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=120000)
            await asyncio.sleep(5)  # 読み込み待機（Google Sheetsは読み込みに時間がかかる）
        except Exception as e:
            print(f"⚠️ ページ読み込みでタイムアウトまたはエラー: {e}")
            print("   ページが部分的に読み込まれている可能性があります。続行します...")
            await asyncio.sleep(3)
        
        # スプレッドシートのタイトルを取得
        try:
            title = await page.title()
            print(f"✅ タイトル: {title}")
        except Exception as e:
            print(f"⚠️ タイトルの取得に失敗: {e}")
        
        # シート一覧を取得
        print(f"\n📋 シート一覧を確認中...")
        try:
            # JavaScriptでシート名を取得（より確実な方法）
            await asyncio.sleep(2)  # シートタブが読み込まれるまで待機
            sheet_names_js = await page.evaluate("""
                () => {
                    // 複数の方法でシートタブを探す
                    const selectors = [
                        '[role="tab"]',
                        '[data-sheet-name]',
                        '.docs-sheet-tab',
                        '[aria-label*="シート"]',
                        '[aria-label*="Sheet"]'
                    ];
                    
                    let sheetNames = new Set();
                    
                    for (const selector of selectors) {
                        const elements = document.querySelectorAll(selector);
                        for (const el of elements) {
                            // データ属性から取得
                            const sheetName = el.getAttribute('data-sheet-name') || 
                                            el.getAttribute('aria-label') ||
                                            el.textContent?.trim();
                            
                            if (sheetName && 
                                !sheetName.includes('高度なオプション') &&
                                !sheetName.includes('抽出') &&
                                !sheetName.includes('更新と管理') &&
                                !sheetName.includes('Advanced') &&
                                !sheetName.includes('Extract') &&
                                !sheetName.includes('Update')) {
                                sheetNames.add(sheetName);
                            }
                        }
                    }
                    
                    // シートタブコンテナから直接取得
                    const sheetContainer = document.querySelector('[role="tablist"]');
                    if (sheetContainer) {
                        const tabs = sheetContainer.querySelectorAll('[role="tab"]');
                        for (const tab of tabs) {
                            const name = tab.getAttribute('data-sheet-name') || 
                                       tab.getAttribute('aria-label') ||
                                       tab.textContent?.trim();
                            if (name && name.length > 0 && name.length < 50) {
                                sheetNames.add(name);
                            }
                        }
                    }
                    
                    return Array.from(sheetNames);
                }
            """)
            
            if sheet_names_js and len(sheet_names_js) > 0:
                print(f"✅ シート一覧（{len(sheet_names_js)}件）:")
                for i, sheet_name in enumerate(sheet_names_js, 1):
                    print(f"   {i}. {sheet_name}")
            else:
                print("⚠️ シートタブが見つかりませんでした")
                # フォールバック: すべてのタブを表示
                all_tabs = await page.query_selector_all('[role="tab"]')
                if all_tabs:
                    print(f"   見つかったタブ要素数: {len(all_tabs)}")
                    for i, tab in enumerate(all_tabs[:10], 1):  # 最初の10個のみ
                        try:
                            tab_text = await tab.text_content()
                            tab_aria = await tab.get_attribute('aria-label')
                            tab_data = await tab.get_attribute('data-sheet-name')
                            print(f"   タブ{i}: text='{tab_text}', aria-label='{tab_aria}', data-sheet-name='{tab_data}'")
                        except:
                            pass
        except Exception as e:
            print(f"⚠️ シート一覧の取得に失敗: {e}")
            import traceback
            traceback.print_exc()
        
        # データが含まれそうなシートを探す（「予約一覧」または日付形式のシート名）
        print(f"\n📊 データシートを確認中...")
        try:
            # シート名のリストが取得できているか確認
            if not sheet_names_js or len(sheet_names_js) == 0:
                print("⚠️ シート名のリストが取得できていません")
                return
            
            # データが含まれそうなシート名の候補
            candidate_sheet_names = ['予約一覧', 'カレンダー', '予約', 'スケジュール']
            
            # 日付形式のシート名も探す（例: "026年1月", "025年12月"など）
            import re
            date_pattern = re.compile(r'\d{2,4}年\d{1,2}月')
            
            # シート名のリストから候補を探す
            target_sheet_name = None
            for sheet_name in sheet_names_js:
                # 「予約一覧」などの候補名と一致するか
                if any(candidate in sheet_name for candidate in candidate_sheet_names):
                    target_sheet_name = sheet_name
                    break
                # 日付形式のシート名か
                if date_pattern.search(sheet_name):
                    target_sheet_name = sheet_name
                    break
            
            if not target_sheet_name:
                # 最初のデータらしいシートを探す（「カレンダー」など）
                for sheet_name in sheet_names_js:
                    if not any(exclude in sheet_name for exclude in ['Keep', 'ToDo', 'コンタクト', 'マップ', 'Atlassian', 'アドオン', 'スプレッドシート', 'シート', 'AppSheet', 'ホーム']):
                        if len(sheet_name) > 0 and len(sheet_name) < 30:
                            target_sheet_name = sheet_name
                            break
            
            if target_sheet_name:
                print(f"✅ 対象シート: {target_sheet_name}")
                
                # JavaScriptでシートをクリック
                clicked = await page.evaluate(f"""
                    () => {{
                        const tabs = document.querySelectorAll('[role="tab"]');
                        for (const tab of tabs) {{
                            const name = tab.getAttribute('data-sheet-name') || 
                                       tab.getAttribute('aria-label') ||
                                       tab.textContent?.trim();
                            if (name && name.includes('{target_sheet_name}')) {{
                                tab.click();
                                return true;
                            }}
                        }}
                        return false;
                    }}
                """)
                
                if clicked:
                    await asyncio.sleep(3)  # シート切り替え待機
                else:
                    print(f"⚠️ シート「{target_sheet_name}」のクリックに失敗しました")
                    return
            
            # ヘッダー行を取得
            await asyncio.sleep(2)  # シートが読み込まれるまで待機
            header_row = await page.evaluate("""
                () => {
                    const sheet = document.querySelector('[role="grid"]');
                    if (!sheet) return null;
                    
                    const firstRow = sheet.querySelector('[role="row"]');
                    if (!firstRow) return null;
                    
                    const cells = firstRow.querySelectorAll('[role="gridcell"]');
                    return Array.from(cells).slice(0, 15).map(cell => {
                        const input = cell.querySelector('input');
                        return input ? input.value : cell.textContent?.trim() || '';
                    }).filter(Boolean);
                }
            """)
            
            if header_row:
                print(f"\n✅ ヘッダー行（{len(header_row)}列）:")
                for i, header in enumerate(header_row, 1):
                    print(f"   {i}. {header}")
            else:
                print("⚠️ ヘッダー行が取得できませんでした")
            
            # データ行数を取得
            data_row_count = await page.evaluate("""
                () => {
                    const sheet = document.querySelector('[role="grid"]');
                    if (!sheet) return 0;
                    
                    const rows = sheet.querySelectorAll('[role="row"]');
                    return rows.length - 1; // ヘッダー行を除く
                }
            """)
            
            print(f"\n✅ データ行数: {data_row_count}行（ヘッダー除く）")
            
            # 最初の数行のデータを取得
            if data_row_count > 0:
                sample_data = await page.evaluate("""
                    () => {
                        const sheet = document.querySelector('[role="grid"]');
                        if (!sheet) return [];
                        
                        const rows = Array.from(sheet.querySelectorAll('[role="row"]')).slice(1, 4); // 最初の3行
                        return rows.map(row => {
                            const cells = row.querySelectorAll('[role="gridcell"]');
                            return Array.from(cells).slice(0, 12).map(cell => {
                                const input = cell.querySelector('input');
                                return input ? input.value : cell.textContent?.trim() || '';
                            });
                        });
                    }
                """)
                
                if sample_data:
                    print(f"\n📝 サンプルデータ（最初の{len(sample_data)}行）:")
                    for i, row in enumerate(sample_data, 1):
                        print(f"   行{i+1}: {row}")
                else:
                    print("⚠️ サンプルデータが取得できませんでした")
        except Exception as e:
            print(f"⚠️ 「予約一覧」シートの確認に失敗: {e}")
            import traceback
            traceback.print_exc()
        
        # スクリーンショットを取得
        try:
            screenshot_path = f"/tmp/spreadsheet_{name.replace('期生', '')}.png"
            await page.screenshot(path=screenshot_path, full_page=False)
            print(f"📸 スクリーンショットを保存: {screenshot_path}")
        except Exception as e:
            print(f"⚠️ スクリーンショットの保存に失敗: {e}")
        
    except Exception as e:
        print(f"❌ {name}のスプレッドシート確認中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """メイン処理"""
    print("="*80)
    print("📊 3つのスプレッドシート（1期生、2期生、3期生）の構造確認")
    print("="*80)
    
    async with async_playwright() as p:
        # 永続的なコンテキストを使用（ログイン状態を維持）
        user_data_dir = os.path.expanduser('~/.playwright_chrome_profile')
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1920, 'height': 1080},
            args=['--disable-blink-features=AutomationControlled']
        )
        
        page = await context.new_page()
        
        try:
            # 各スプレッドシートを確認
            for spreadsheet_info in SPREADSHEETS:
                await check_spreadsheet(page, spreadsheet_info)
                await asyncio.sleep(2)  # 各スプレッドシート間で少し待機
            
            print("\n" + "="*80)
            print("✅ すべてのスプレッドシートの確認が完了しました")
            print("="*80)
            
        except Exception as e:
            print(f"\n❌ エラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # ブラウザを閉じない（ログイン状態を維持するため）
            print("\n💡 ブラウザは開いたままにしておきます（ログイン状態を維持）")
            print("   手動で閉じるか、Ctrl+Cで終了してください")

if __name__ == '__main__':
    import os
    asyncio.run(main())


3つのスプレッドシート（1期生、2期生、3期生）の構造を確認するスクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import json

# 3つのスプレッドシートのURL
SPREADSHEETS = [
    {
        'name': '1期生',
        'url': 'https://docs.google.com/spreadsheets/d/1IaunHch_ugiEIw91AaDEHEHKNaP0RDHm5ZFN_gTU5Fs/edit?gid=115666812#gid=115666812',
        'id': '1IaunHch_ugiEIw91AaDEHEHKNaP0RDHm5ZFN_gTU5Fs'
    },
    {
        'name': '2期生',
        'url': 'https://docs.google.com/spreadsheets/d/1tyn9AelB-MTEd1ywVvMMr4H7hKQ1wjoIVUDLkZl_iBg/edit?gid=2079770910#gid=2079770910',
        'id': '1tyn9AelB-MTEd1ywVvMMr4H7hKQ1wjoIVUDLkZl_iBg'
    },
    {
        'name': '3期生',
        'url': 'https://docs.google.com/spreadsheets/d/1fWvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQclI/edit?gid=1024145159#gid=1024145159',
        'id': '1fWvxFEULuq7Va2YxSoy6LGCFp7Rfk0sn7yGuVxhQclI'
    }
]

async def check_spreadsheet(page, spreadsheet_info):
    """スプレッドシートの構造を確認"""
    name = spreadsheet_info['name']
    url = spreadsheet_info['url']
    spreadsheet_id = spreadsheet_info['id']
    
    print(f"\n{'='*80}")
    print(f"📊 {name}のスプレッドシートを確認中...")
    print(f"{'='*80}")
    print(f"URL: {url}")
    print(f"ID: {spreadsheet_id}")
    
    try:
        # スプレッドシートを開く
        print(f"\n🌐 {name}のスプレッドシートを開いています...")
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=120000)
            await asyncio.sleep(5)  # 読み込み待機（Google Sheetsは読み込みに時間がかかる）
        except Exception as e:
            print(f"⚠️ ページ読み込みでタイムアウトまたはエラー: {e}")
            print("   ページが部分的に読み込まれている可能性があります。続行します...")
            await asyncio.sleep(3)
        
        # スプレッドシートのタイトルを取得
        try:
            title = await page.title()
            print(f"✅ タイトル: {title}")
        except Exception as e:
            print(f"⚠️ タイトルの取得に失敗: {e}")
        
        # シート一覧を取得
        print(f"\n📋 シート一覧を確認中...")
        try:
            # JavaScriptでシート名を取得（より確実な方法）
            await asyncio.sleep(2)  # シートタブが読み込まれるまで待機
            sheet_names_js = await page.evaluate("""
                () => {
                    // 複数の方法でシートタブを探す
                    const selectors = [
                        '[role="tab"]',
                        '[data-sheet-name]',
                        '.docs-sheet-tab',
                        '[aria-label*="シート"]',
                        '[aria-label*="Sheet"]'
                    ];
                    
                    let sheetNames = new Set();
                    
                    for (const selector of selectors) {
                        const elements = document.querySelectorAll(selector);
                        for (const el of elements) {
                            // データ属性から取得
                            const sheetName = el.getAttribute('data-sheet-name') || 
                                            el.getAttribute('aria-label') ||
                                            el.textContent?.trim();
                            
                            if (sheetName && 
                                !sheetName.includes('高度なオプション') &&
                                !sheetName.includes('抽出') &&
                                !sheetName.includes('更新と管理') &&
                                !sheetName.includes('Advanced') &&
                                !sheetName.includes('Extract') &&
                                !sheetName.includes('Update')) {
                                sheetNames.add(sheetName);
                            }
                        }
                    }
                    
                    // シートタブコンテナから直接取得
                    const sheetContainer = document.querySelector('[role="tablist"]');
                    if (sheetContainer) {
                        const tabs = sheetContainer.querySelectorAll('[role="tab"]');
                        for (const tab of tabs) {
                            const name = tab.getAttribute('data-sheet-name') || 
                                       tab.getAttribute('aria-label') ||
                                       tab.textContent?.trim();
                            if (name && name.length > 0 && name.length < 50) {
                                sheetNames.add(name);
                            }
                        }
                    }
                    
                    return Array.from(sheetNames);
                }
            """)
            
            if sheet_names_js and len(sheet_names_js) > 0:
                print(f"✅ シート一覧（{len(sheet_names_js)}件）:")
                for i, sheet_name in enumerate(sheet_names_js, 1):
                    print(f"   {i}. {sheet_name}")
            else:
                print("⚠️ シートタブが見つかりませんでした")
                # フォールバック: すべてのタブを表示
                all_tabs = await page.query_selector_all('[role="tab"]')
                if all_tabs:
                    print(f"   見つかったタブ要素数: {len(all_tabs)}")
                    for i, tab in enumerate(all_tabs[:10], 1):  # 最初の10個のみ
                        try:
                            tab_text = await tab.text_content()
                            tab_aria = await tab.get_attribute('aria-label')
                            tab_data = await tab.get_attribute('data-sheet-name')
                            print(f"   タブ{i}: text='{tab_text}', aria-label='{tab_aria}', data-sheet-name='{tab_data}'")
                        except:
                            pass
        except Exception as e:
            print(f"⚠️ シート一覧の取得に失敗: {e}")
            import traceback
            traceback.print_exc()
        
        # データが含まれそうなシートを探す（「予約一覧」または日付形式のシート名）
        print(f"\n📊 データシートを確認中...")
        try:
            # シート名のリストが取得できているか確認
            if not sheet_names_js or len(sheet_names_js) == 0:
                print("⚠️ シート名のリストが取得できていません")
                return
            
            # データが含まれそうなシート名の候補
            candidate_sheet_names = ['予約一覧', 'カレンダー', '予約', 'スケジュール']
            
            # 日付形式のシート名も探す（例: "026年1月", "025年12月"など）
            import re
            date_pattern = re.compile(r'\d{2,4}年\d{1,2}月')
            
            # シート名のリストから候補を探す
            target_sheet_name = None
            for sheet_name in sheet_names_js:
                # 「予約一覧」などの候補名と一致するか
                if any(candidate in sheet_name for candidate in candidate_sheet_names):
                    target_sheet_name = sheet_name
                    break
                # 日付形式のシート名か
                if date_pattern.search(sheet_name):
                    target_sheet_name = sheet_name
                    break
            
            if not target_sheet_name:
                # 最初のデータらしいシートを探す（「カレンダー」など）
                for sheet_name in sheet_names_js:
                    if not any(exclude in sheet_name for exclude in ['Keep', 'ToDo', 'コンタクト', 'マップ', 'Atlassian', 'アドオン', 'スプレッドシート', 'シート', 'AppSheet', 'ホーム']):
                        if len(sheet_name) > 0 and len(sheet_name) < 30:
                            target_sheet_name = sheet_name
                            break
            
            if target_sheet_name:
                print(f"✅ 対象シート: {target_sheet_name}")
                
                # JavaScriptでシートをクリック
                clicked = await page.evaluate(f"""
                    () => {{
                        const tabs = document.querySelectorAll('[role="tab"]');
                        for (const tab of tabs) {{
                            const name = tab.getAttribute('data-sheet-name') || 
                                       tab.getAttribute('aria-label') ||
                                       tab.textContent?.trim();
                            if (name && name.includes('{target_sheet_name}')) {{
                                tab.click();
                                return true;
                            }}
                        }}
                        return false;
                    }}
                """)
                
                if clicked:
                    await asyncio.sleep(3)  # シート切り替え待機
                else:
                    print(f"⚠️ シート「{target_sheet_name}」のクリックに失敗しました")
                    return
            
            # ヘッダー行を取得
            await asyncio.sleep(2)  # シートが読み込まれるまで待機
            header_row = await page.evaluate("""
                () => {
                    const sheet = document.querySelector('[role="grid"]');
                    if (!sheet) return null;
                    
                    const firstRow = sheet.querySelector('[role="row"]');
                    if (!firstRow) return null;
                    
                    const cells = firstRow.querySelectorAll('[role="gridcell"]');
                    return Array.from(cells).slice(0, 15).map(cell => {
                        const input = cell.querySelector('input');
                        return input ? input.value : cell.textContent?.trim() || '';
                    }).filter(Boolean);
                }
            """)
            
            if header_row:
                print(f"\n✅ ヘッダー行（{len(header_row)}列）:")
                for i, header in enumerate(header_row, 1):
                    print(f"   {i}. {header}")
            else:
                print("⚠️ ヘッダー行が取得できませんでした")
            
            # データ行数を取得
            data_row_count = await page.evaluate("""
                () => {
                    const sheet = document.querySelector('[role="grid"]');
                    if (!sheet) return 0;
                    
                    const rows = sheet.querySelectorAll('[role="row"]');
                    return rows.length - 1; // ヘッダー行を除く
                }
            """)
            
            print(f"\n✅ データ行数: {data_row_count}行（ヘッダー除く）")
            
            # 最初の数行のデータを取得
            if data_row_count > 0:
                sample_data = await page.evaluate("""
                    () => {
                        const sheet = document.querySelector('[role="grid"]');
                        if (!sheet) return [];
                        
                        const rows = Array.from(sheet.querySelectorAll('[role="row"]')).slice(1, 4); // 最初の3行
                        return rows.map(row => {
                            const cells = row.querySelectorAll('[role="gridcell"]');
                            return Array.from(cells).slice(0, 12).map(cell => {
                                const input = cell.querySelector('input');
                                return input ? input.value : cell.textContent?.trim() || '';
                            });
                        });
                    }
                """)
                
                if sample_data:
                    print(f"\n📝 サンプルデータ（最初の{len(sample_data)}行）:")
                    for i, row in enumerate(sample_data, 1):
                        print(f"   行{i+1}: {row}")
                else:
                    print("⚠️ サンプルデータが取得できませんでした")
        except Exception as e:
            print(f"⚠️ 「予約一覧」シートの確認に失敗: {e}")
            import traceback
            traceback.print_exc()
        
        # スクリーンショットを取得
        try:
            screenshot_path = f"/tmp/spreadsheet_{name.replace('期生', '')}.png"
            await page.screenshot(path=screenshot_path, full_page=False)
            print(f"📸 スクリーンショットを保存: {screenshot_path}")
        except Exception as e:
            print(f"⚠️ スクリーンショットの保存に失敗: {e}")
        
    except Exception as e:
        print(f"❌ {name}のスプレッドシート確認中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """メイン処理"""
    print("="*80)
    print("📊 3つのスプレッドシート（1期生、2期生、3期生）の構造確認")
    print("="*80)
    
    async with async_playwright() as p:
        # 永続的なコンテキストを使用（ログイン状態を維持）
        user_data_dir = os.path.expanduser('~/.playwright_chrome_profile')
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1920, 'height': 1080},
            args=['--disable-blink-features=AutomationControlled']
        )
        
        page = await context.new_page()
        
        try:
            # 各スプレッドシートを確認
            for spreadsheet_info in SPREADSHEETS:
                await check_spreadsheet(page, spreadsheet_info)
                await asyncio.sleep(2)  # 各スプレッドシート間で少し待機
            
            print("\n" + "="*80)
            print("✅ すべてのスプレッドシートの確認が完了しました")
            print("="*80)
            
        except Exception as e:
            print(f"\n❌ エラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # ブラウザを閉じない（ログイン状態を維持するため）
            print("\n💡 ブラウザは開いたままにしておきます（ログイン状態を維持）")
            print("   手動で閉じるか、Ctrl+Cで終了してください")

if __name__ == '__main__':
    import os
    asyncio.run(main())

