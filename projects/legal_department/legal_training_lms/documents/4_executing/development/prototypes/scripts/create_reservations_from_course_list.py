#!/usr/bin/env python3
"""
コース一覧シートから3期生のコースを取得し、予約一覧シートに登録するスクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import os

# スプレッドシートID
SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE'
COURSE_LIST_SHEET_GID = '1504366156'  # コース一覧シート
RESERVATION_LIST_SHEET_GID = '0'  # 予約一覧シート

SPREADSHEET_URL = f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit'

async def get_course_list(page):
    """コース一覧シートから3期生のコースを取得"""
    print('📋 コース一覧シートを開いています...')
    
    # コース一覧シートのURL（gid指定）
    course_list_url = f'{SPREADSHEET_URL}?gid={COURSE_LIST_SHEET_GID}#gid={COURSE_LIST_SHEET_GID}'
    await page.goto(course_list_url, wait_until='domcontentloaded', timeout=60000)
    await asyncio.sleep(5)
    
    print('📊 コース一覧シートのデータを取得中...')
    
    # シートのデータを取得
    course_data = await page.evaluate('''
        () => {
            // テーブル要素を探す
            const tables = Array.from(document.querySelectorAll('table'));
            let targetTable = null;
            let maxRows = 0;
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    maxRows = rows.length;
                    targetTable = table;
                }
            }
            
            if (!targetTable) {
                return { error: 'テーブルが見つかりませんでした' };
            }
            
            const rows = Array.from(targetTable.querySelectorAll('tr'));
            const data = [];
            
            // ヘッダー行を取得
            const headerRow = rows[0];
            const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => {
                return (cell.textContent || cell.innerText || '').trim();
            });
            
            // データ行を取得
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = Array.from(row.querySelectorAll('td'));
                const rowData = {};
                
                cells.forEach((cell, index) => {
                    const header = headers[index] || `列${index + 1}`;
                    rowData[header] = (cell.textContent || cell.innerText || '').trim();
                });
                
                // 3期生のコースのみを取得
                if (rowData['期生'] === '3期生' || rowData['期'] === '3期生' || 
                    (rowData['コース名'] && rowData['コース名'].includes('3期生'))) {
                    data.push(rowData);
                }
            }
            
            return {
                headers: headers,
                courses: data
            };
        }
    ''')
    
    return course_data

async def create_reservations(page, courses):
    """予約一覧シートに予約セッションを作成"""
    print('📝 予約一覧シートを開いています...')
    
    # 予約一覧シートのURL（gid指定）
    reservation_list_url = f'{SPREADSHEET_URL}?gid={RESERVATION_LIST_SHEET_GID}#gid={RESERVATION_LIST_SHEET_GID}'
    await page.goto(reservation_list_url, wait_until='domcontentloaded', timeout=60000)
    await asyncio.sleep(5)
    
    print(f'📊 {len(courses)}件のコースを予約一覧シートに登録します...')
    
    # 予約一覧シートの最終行を取得
    last_row = await page.evaluate('''
        () => {
            // テーブル要素を探す
            const tables = Array.from(document.querySelectorAll('table'));
            let targetTable = null;
            let maxRows = 0;
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    maxRows = rows.length;
                    targetTable = table;
                }
            }
            
            if (!targetTable) {
                return 1;
            }
            
            const rows = targetTable.querySelectorAll('tr');
            return rows.length;
        }
    ''')
    
    print(f'📊 予約一覧シートの現在の行数: {last_row}')
    
    # 各コースに対して予約セッションを作成
    for i, course in enumerate(courses):
        print(f'\n📝 コース {i+1}/{len(courses)}: {course.get("コース名", "不明")}')
        
        # 予約一覧シートにデータを追加（手動で行を追加する必要があるため、ログに出力）
        print(f'  コースID: {course.get("コースID", "")}')
        print(f'  コース名: {course.get("コース名", "")}')
        print(f'  期生: {course.get("期生", course.get("期", ""))}')
        
        # 予約一覧シートの構造に合わせてデータを準備
        reservation_data = {
            '予約ID': last_row + i,  # 自動採番
            'コースID': course.get('コースID', ''),
            '予約名': course.get('コース名', ''),
            'コース案内': course.get('コース案内', course.get('概要', '')),
            '日程': '',  # 後で設定
            '開始日時': '',  # 後で設定
            '完了日時': '',  # 後で設定
            'イベントID': '',  # 後で設定
            '最大参加者数': course.get('最大参加者数', ''),
            '現在の参加者数': '0',
            'ステータス': '予約受付中',
            '対象グループ': '3期生'
        }
        
        print(f'  予約データ: {reservation_data}')
    
    print(f'\n✅ {len(courses)}件のコースデータを準備しました')
    print('⚠️  注意: 実際の予約セッション作成は、Google Apps Scriptで実行する必要があります')

async def main():
    async with async_playwright() as p:
        user_data_dir = os.path.expanduser('~/.playwright_chrome_profile')
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        
        print('='*60)
        print('コース一覧から3期生の予約セッションを作成')
        print('='*60)
        
        # コース一覧を取得
        course_data = await get_course_list(page)
        
        if 'error' in course_data:
            print(f'❌ エラー: {course_data["error"]}')
            return
        
        print(f'\n✅ コース一覧のヘッダー: {course_data["headers"]}')
        print(f'✅ 3期生のコース数: {len(course_data["courses"])}件')
        
        if len(course_data["courses"]) == 0:
            print('⚠️  3期生のコースが見つかりませんでした')
            return
        
        # 各コースの情報を表示
        for i, course in enumerate(course_data["courses"]):
            print(f'\nコース {i+1}:')
            for key, value in course.items():
                if value:
                    print(f'  {key}: {value}')
        
        # 予約一覧シートにデータを作成
        await create_reservations(page, course_data["courses"])
        
        print('\n✅ 完了しました')
        await asyncio.sleep(5)

if __name__ == '__main__':
    asyncio.run(main())


"""
コース一覧シートから3期生のコースを取得し、予約一覧シートに登録するスクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import os

# スプレッドシートID
SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE'
COURSE_LIST_SHEET_GID = '1504366156'  # コース一覧シート
RESERVATION_LIST_SHEET_GID = '0'  # 予約一覧シート

SPREADSHEET_URL = f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit'

async def get_course_list(page):
    """コース一覧シートから3期生のコースを取得"""
    print('📋 コース一覧シートを開いています...')
    
    # コース一覧シートのURL（gid指定）
    course_list_url = f'{SPREADSHEET_URL}?gid={COURSE_LIST_SHEET_GID}#gid={COURSE_LIST_SHEET_GID}'
    await page.goto(course_list_url, wait_until='domcontentloaded', timeout=60000)
    await asyncio.sleep(5)
    
    print('📊 コース一覧シートのデータを取得中...')
    
    # シートのデータを取得
    course_data = await page.evaluate('''
        () => {
            // テーブル要素を探す
            const tables = Array.from(document.querySelectorAll('table'));
            let targetTable = null;
            let maxRows = 0;
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    maxRows = rows.length;
                    targetTable = table;
                }
            }
            
            if (!targetTable) {
                return { error: 'テーブルが見つかりませんでした' };
            }
            
            const rows = Array.from(targetTable.querySelectorAll('tr'));
            const data = [];
            
            // ヘッダー行を取得
            const headerRow = rows[0];
            const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => {
                return (cell.textContent || cell.innerText || '').trim();
            });
            
            // データ行を取得
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = Array.from(row.querySelectorAll('td'));
                const rowData = {};
                
                cells.forEach((cell, index) => {
                    const header = headers[index] || `列${index + 1}`;
                    rowData[header] = (cell.textContent || cell.innerText || '').trim();
                });
                
                // 3期生のコースのみを取得
                if (rowData['期生'] === '3期生' || rowData['期'] === '3期生' || 
                    (rowData['コース名'] && rowData['コース名'].includes('3期生'))) {
                    data.push(rowData);
                }
            }
            
            return {
                headers: headers,
                courses: data
            };
        }
    ''')
    
    return course_data

async def create_reservations(page, courses):
    """予約一覧シートに予約セッションを作成"""
    print('📝 予約一覧シートを開いています...')
    
    # 予約一覧シートのURL（gid指定）
    reservation_list_url = f'{SPREADSHEET_URL}?gid={RESERVATION_LIST_SHEET_GID}#gid={RESERVATION_LIST_SHEET_GID}'
    await page.goto(reservation_list_url, wait_until='domcontentloaded', timeout=60000)
    await asyncio.sleep(5)
    
    print(f'📊 {len(courses)}件のコースを予約一覧シートに登録します...')
    
    # 予約一覧シートの最終行を取得
    last_row = await page.evaluate('''
        () => {
            // テーブル要素を探す
            const tables = Array.from(document.querySelectorAll('table'));
            let targetTable = null;
            let maxRows = 0;
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    maxRows = rows.length;
                    targetTable = table;
                }
            }
            
            if (!targetTable) {
                return 1;
            }
            
            const rows = targetTable.querySelectorAll('tr');
            return rows.length;
        }
    ''')
    
    print(f'📊 予約一覧シートの現在の行数: {last_row}')
    
    # 各コースに対して予約セッションを作成
    for i, course in enumerate(courses):
        print(f'\n📝 コース {i+1}/{len(courses)}: {course.get("コース名", "不明")}')
        
        # 予約一覧シートにデータを追加（手動で行を追加する必要があるため、ログに出力）
        print(f'  コースID: {course.get("コースID", "")}')
        print(f'  コース名: {course.get("コース名", "")}')
        print(f'  期生: {course.get("期生", course.get("期", ""))}')
        
        # 予約一覧シートの構造に合わせてデータを準備
        reservation_data = {
            '予約ID': last_row + i,  # 自動採番
            'コースID': course.get('コースID', ''),
            '予約名': course.get('コース名', ''),
            'コース案内': course.get('コース案内', course.get('概要', '')),
            '日程': '',  # 後で設定
            '開始日時': '',  # 後で設定
            '完了日時': '',  # 後で設定
            'イベントID': '',  # 後で設定
            '最大参加者数': course.get('最大参加者数', ''),
            '現在の参加者数': '0',
            'ステータス': '予約受付中',
            '対象グループ': '3期生'
        }
        
        print(f'  予約データ: {reservation_data}')
    
    print(f'\n✅ {len(courses)}件のコースデータを準備しました')
    print('⚠️  注意: 実際の予約セッション作成は、Google Apps Scriptで実行する必要があります')

async def main():
    async with async_playwright() as p:
        user_data_dir = os.path.expanduser('~/.playwright_chrome_profile')
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        
        print('='*60)
        print('コース一覧から3期生の予約セッションを作成')
        print('='*60)
        
        # コース一覧を取得
        course_data = await get_course_list(page)
        
        if 'error' in course_data:
            print(f'❌ エラー: {course_data["error"]}')
            return
        
        print(f'\n✅ コース一覧のヘッダー: {course_data["headers"]}')
        print(f'✅ 3期生のコース数: {len(course_data["courses"])}件')
        
        if len(course_data["courses"]) == 0:
            print('⚠️  3期生のコースが見つかりませんでした')
            return
        
        # 各コースの情報を表示
        for i, course in enumerate(course_data["courses"]):
            print(f'\nコース {i+1}:')
            for key, value in course.items():
                if value:
                    print(f'  {key}: {value}')
        
        # 予約一覧シートにデータを作成
        await create_reservations(page, course_data["courses"])
        
        print('\n✅ 完了しました')
        await asyncio.sleep(5)

if __name__ == '__main__':
    asyncio.run(main())

"""
コース一覧シートから3期生のコースを取得し、予約一覧シートに登録するスクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import os

# スプレッドシートID
SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE'
COURSE_LIST_SHEET_GID = '1504366156'  # コース一覧シート
RESERVATION_LIST_SHEET_GID = '0'  # 予約一覧シート

SPREADSHEET_URL = f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit'

async def get_course_list(page):
    """コース一覧シートから3期生のコースを取得"""
    print('📋 コース一覧シートを開いています...')
    
    # コース一覧シートのURL（gid指定）
    course_list_url = f'{SPREADSHEET_URL}?gid={COURSE_LIST_SHEET_GID}#gid={COURSE_LIST_SHEET_GID}'
    await page.goto(course_list_url, wait_until='domcontentloaded', timeout=60000)
    await asyncio.sleep(5)
    
    print('📊 コース一覧シートのデータを取得中...')
    
    # シートのデータを取得
    course_data = await page.evaluate('''
        () => {
            // テーブル要素を探す
            const tables = Array.from(document.querySelectorAll('table'));
            let targetTable = null;
            let maxRows = 0;
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    maxRows = rows.length;
                    targetTable = table;
                }
            }
            
            if (!targetTable) {
                return { error: 'テーブルが見つかりませんでした' };
            }
            
            const rows = Array.from(targetTable.querySelectorAll('tr'));
            const data = [];
            
            // ヘッダー行を取得
            const headerRow = rows[0];
            const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => {
                return (cell.textContent || cell.innerText || '').trim();
            });
            
            // データ行を取得
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = Array.from(row.querySelectorAll('td'));
                const rowData = {};
                
                cells.forEach((cell, index) => {
                    const header = headers[index] || `列${index + 1}`;
                    rowData[header] = (cell.textContent || cell.innerText || '').trim();
                });
                
                // 3期生のコースのみを取得
                if (rowData['期生'] === '3期生' || rowData['期'] === '3期生' || 
                    (rowData['コース名'] && rowData['コース名'].includes('3期生'))) {
                    data.push(rowData);
                }
            }
            
            return {
                headers: headers,
                courses: data
            };
        }
    ''')
    
    return course_data

async def create_reservations(page, courses):
    """予約一覧シートに予約セッションを作成"""
    print('📝 予約一覧シートを開いています...')
    
    # 予約一覧シートのURL（gid指定）
    reservation_list_url = f'{SPREADSHEET_URL}?gid={RESERVATION_LIST_SHEET_GID}#gid={RESERVATION_LIST_SHEET_GID}'
    await page.goto(reservation_list_url, wait_until='domcontentloaded', timeout=60000)
    await asyncio.sleep(5)
    
    print(f'📊 {len(courses)}件のコースを予約一覧シートに登録します...')
    
    # 予約一覧シートの最終行を取得
    last_row = await page.evaluate('''
        () => {
            // テーブル要素を探す
            const tables = Array.from(document.querySelectorAll('table'));
            let targetTable = null;
            let maxRows = 0;
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    maxRows = rows.length;
                    targetTable = table;
                }
            }
            
            if (!targetTable) {
                return 1;
            }
            
            const rows = targetTable.querySelectorAll('tr');
            return rows.length;
        }
    ''')
    
    print(f'📊 予約一覧シートの現在の行数: {last_row}')
    
    # 各コースに対して予約セッションを作成
    for i, course in enumerate(courses):
        print(f'\n📝 コース {i+1}/{len(courses)}: {course.get("コース名", "不明")}')
        
        # 予約一覧シートにデータを追加（手動で行を追加する必要があるため、ログに出力）
        print(f'  コースID: {course.get("コースID", "")}')
        print(f'  コース名: {course.get("コース名", "")}')
        print(f'  期生: {course.get("期生", course.get("期", ""))}')
        
        # 予約一覧シートの構造に合わせてデータを準備
        reservation_data = {
            '予約ID': last_row + i,  # 自動採番
            'コースID': course.get('コースID', ''),
            '予約名': course.get('コース名', ''),
            'コース案内': course.get('コース案内', course.get('概要', '')),
            '日程': '',  # 後で設定
            '開始日時': '',  # 後で設定
            '完了日時': '',  # 後で設定
            'イベントID': '',  # 後で設定
            '最大参加者数': course.get('最大参加者数', ''),
            '現在の参加者数': '0',
            'ステータス': '予約受付中',
            '対象グループ': '3期生'
        }
        
        print(f'  予約データ: {reservation_data}')
    
    print(f'\n✅ {len(courses)}件のコースデータを準備しました')
    print('⚠️  注意: 実際の予約セッション作成は、Google Apps Scriptで実行する必要があります')

async def main():
    async with async_playwright() as p:
        user_data_dir = os.path.expanduser('~/.playwright_chrome_profile')
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        
        print('='*60)
        print('コース一覧から3期生の予約セッションを作成')
        print('='*60)
        
        # コース一覧を取得
        course_data = await get_course_list(page)
        
        if 'error' in course_data:
            print(f'❌ エラー: {course_data["error"]}')
            return
        
        print(f'\n✅ コース一覧のヘッダー: {course_data["headers"]}')
        print(f'✅ 3期生のコース数: {len(course_data["courses"])}件')
        
        if len(course_data["courses"]) == 0:
            print('⚠️  3期生のコースが見つかりませんでした')
            return
        
        # 各コースの情報を表示
        for i, course in enumerate(course_data["courses"]):
            print(f'\nコース {i+1}:')
            for key, value in course.items():
                if value:
                    print(f'  {key}: {value}')
        
        # 予約一覧シートにデータを作成
        await create_reservations(page, course_data["courses"])
        
        print('\n✅ 完了しました')
        await asyncio.sleep(5)

if __name__ == '__main__':
    asyncio.run(main())


"""
コース一覧シートから3期生のコースを取得し、予約一覧シートに登録するスクリプト
"""

import asyncio
from playwright.async_api import async_playwright
import os

# スプレッドシートID
SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE'
COURSE_LIST_SHEET_GID = '1504366156'  # コース一覧シート
RESERVATION_LIST_SHEET_GID = '0'  # 予約一覧シート

SPREADSHEET_URL = f'https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit'

async def get_course_list(page):
    """コース一覧シートから3期生のコースを取得"""
    print('📋 コース一覧シートを開いています...')
    
    # コース一覧シートのURL（gid指定）
    course_list_url = f'{SPREADSHEET_URL}?gid={COURSE_LIST_SHEET_GID}#gid={COURSE_LIST_SHEET_GID}'
    await page.goto(course_list_url, wait_until='domcontentloaded', timeout=60000)
    await asyncio.sleep(5)
    
    print('📊 コース一覧シートのデータを取得中...')
    
    # シートのデータを取得
    course_data = await page.evaluate('''
        () => {
            // テーブル要素を探す
            const tables = Array.from(document.querySelectorAll('table'));
            let targetTable = null;
            let maxRows = 0;
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    maxRows = rows.length;
                    targetTable = table;
                }
            }
            
            if (!targetTable) {
                return { error: 'テーブルが見つかりませんでした' };
            }
            
            const rows = Array.from(targetTable.querySelectorAll('tr'));
            const data = [];
            
            // ヘッダー行を取得
            const headerRow = rows[0];
            const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => {
                return (cell.textContent || cell.innerText || '').trim();
            });
            
            // データ行を取得
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = Array.from(row.querySelectorAll('td'));
                const rowData = {};
                
                cells.forEach((cell, index) => {
                    const header = headers[index] || `列${index + 1}`;
                    rowData[header] = (cell.textContent || cell.innerText || '').trim();
                });
                
                // 3期生のコースのみを取得
                if (rowData['期生'] === '3期生' || rowData['期'] === '3期生' || 
                    (rowData['コース名'] && rowData['コース名'].includes('3期生'))) {
                    data.push(rowData);
                }
            }
            
            return {
                headers: headers,
                courses: data
            };
        }
    ''')
    
    return course_data

async def create_reservations(page, courses):
    """予約一覧シートに予約セッションを作成"""
    print('📝 予約一覧シートを開いています...')
    
    # 予約一覧シートのURL（gid指定）
    reservation_list_url = f'{SPREADSHEET_URL}?gid={RESERVATION_LIST_SHEET_GID}#gid={RESERVATION_LIST_SHEET_GID}'
    await page.goto(reservation_list_url, wait_until='domcontentloaded', timeout=60000)
    await asyncio.sleep(5)
    
    print(f'📊 {len(courses)}件のコースを予約一覧シートに登録します...')
    
    # 予約一覧シートの最終行を取得
    last_row = await page.evaluate('''
        () => {
            // テーブル要素を探す
            const tables = Array.from(document.querySelectorAll('table'));
            let targetTable = null;
            let maxRows = 0;
            
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    maxRows = rows.length;
                    targetTable = table;
                }
            }
            
            if (!targetTable) {
                return 1;
            }
            
            const rows = targetTable.querySelectorAll('tr');
            return rows.length;
        }
    ''')
    
    print(f'📊 予約一覧シートの現在の行数: {last_row}')
    
    # 各コースに対して予約セッションを作成
    for i, course in enumerate(courses):
        print(f'\n📝 コース {i+1}/{len(courses)}: {course.get("コース名", "不明")}')
        
        # 予約一覧シートにデータを追加（手動で行を追加する必要があるため、ログに出力）
        print(f'  コースID: {course.get("コースID", "")}')
        print(f'  コース名: {course.get("コース名", "")}')
        print(f'  期生: {course.get("期生", course.get("期", ""))}')
        
        # 予約一覧シートの構造に合わせてデータを準備
        reservation_data = {
            '予約ID': last_row + i,  # 自動採番
            'コースID': course.get('コースID', ''),
            '予約名': course.get('コース名', ''),
            'コース案内': course.get('コース案内', course.get('概要', '')),
            '日程': '',  # 後で設定
            '開始日時': '',  # 後で設定
            '完了日時': '',  # 後で設定
            'イベントID': '',  # 後で設定
            '最大参加者数': course.get('最大参加者数', ''),
            '現在の参加者数': '0',
            'ステータス': '予約受付中',
            '対象グループ': '3期生'
        }
        
        print(f'  予約データ: {reservation_data}')
    
    print(f'\n✅ {len(courses)}件のコースデータを準備しました')
    print('⚠️  注意: 実際の予約セッション作成は、Google Apps Scriptで実行する必要があります')

async def main():
    async with async_playwright() as p:
        user_data_dir = os.path.expanduser('~/.playwright_chrome_profile')
        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        
        print('='*60)
        print('コース一覧から3期生の予約セッションを作成')
        print('='*60)
        
        # コース一覧を取得
        course_data = await get_course_list(page)
        
        if 'error' in course_data:
            print(f'❌ エラー: {course_data["error"]}')
            return
        
        print(f'\n✅ コース一覧のヘッダー: {course_data["headers"]}')
        print(f'✅ 3期生のコース数: {len(course_data["courses"])}件')
        
        if len(course_data["courses"]) == 0:
            print('⚠️  3期生のコースが見つかりませんでした')
            return
        
        # 各コースの情報を表示
        for i, course in enumerate(course_data["courses"]):
            print(f'\nコース {i+1}:')
            for key, value in course.items():
                if value:
                    print(f'  {key}: {value}')
        
        # 予約一覧シートにデータを作成
        await create_reservations(page, course_data["courses"])
        
        print('\n✅ 完了しました')
        await asyncio.sleep(5)

if __name__ == '__main__':
    asyncio.run(main())

