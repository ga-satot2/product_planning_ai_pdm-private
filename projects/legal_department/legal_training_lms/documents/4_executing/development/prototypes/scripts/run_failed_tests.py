#!/usr/bin/env python3
"""
失敗したテストのみを再実行するスクリプト
"""

import asyncio
import sys
import os

# run_all_tests.pyをインポート
sys.path.insert(0, os.path.dirname(__file__))
from run_all_tests import (
    async_playwright,
    run_test_function,
    parse_test_results,
    extract_execution_logs,
    save_log,
    SPREADSHEET_SCRIPT_URL
)

# 失敗したテスト関数のリスト
FAILED_TEST_FUNCTIONS = [
    'testErrorHandling',
    'testAllBoundaryAndEdgeCases',
    'testRebuildDependencies',
    'testUpdateDashboardAfterReservation',
]

async def run_failed_tests():
    """失敗したテスト関数のみを実行"""
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
            print("🎭 失敗したテスト関数を再実行します")
            print("="*80)
            print(f"📋 再実行するテスト関数数: {len(FAILED_TEST_FUNCTIONS)}")
            print("="*80)
            
            for i, test_function in enumerate(FAILED_TEST_FUNCTIONS, 1):
                print(f"\n[{i}/{len(FAILED_TEST_FUNCTIONS)}] {test_function}")
                print("-"*80)
                
                # ネットワークエラーが発生した場合のリトライ処理
                max_retries = 3  # リトライ回数を増やす
                test_result = None
                for retry in range(max_retries):
                    try:
                        test_result = await run_test_function(context, test_function)
                        # ネットワークエラーでない場合はリトライ不要
                        if 'ERR_ADDRESS_UNREACHABLE' not in str(test_result.get('error', '')):
                            break
                        elif retry < max_retries - 1:
                            print(f"   ⚠️  ネットワークエラーが発生しました。リトライします... ({retry + 1}/{max_retries})")
                            await asyncio.sleep(10)  # リトライ前に待機時間を延長
                    except Exception as e:
                        if 'ERR_ADDRESS_UNREACHABLE' in str(e) and retry < max_retries - 1:
                            print(f"   ⚠️  ネットワークエラーが発生しました。リトライします... ({retry + 1}/{max_retries})")
                            await asyncio.sleep(10)
                            continue
                        else:
                            test_result = {'success': False, 'test_function': test_function, 'error': str(e)}
                            break
                
                if test_result is None:
                    test_result = {'success': False, 'test_function': test_function, 'error': 'テスト実行に失敗'}
                
                results.append(test_result)
                
                # 結果を表示
                if test_result.get('success') == True:
                    print(f"✅ {test_function}: 成功")
                else:
                    print(f"❌ {test_function}: 失敗")
                    if test_result.get('errors'):
                        print(f"   エラー数: {len(test_result['errors'])}")
                        for err in test_result['errors'][:3]:
                            print(f"     - {err[:80]}")
                    if test_result.get('error'):
                        print(f"   エラー: {test_result['error'][:100]}")
                
                # テスト間の待機時間
                if i < len(FAILED_TEST_FUNCTIONS):
                    print("\n⏳ 次のテストまで15秒待機します...")
                    await asyncio.sleep(15)
            
            # 結果サマリーを生成
            print("\n" + "="*80)
            print("📊 テスト実行結果サマリー")
            print("="*80)
            
            success_count = sum(1 for r in results if r.get('success') == True)
            failure_count = len(results) - success_count
            
            print(f"✅ 成功: {success_count}/{len(results)}")
            print(f"❌ 失敗: {failure_count}/{len(results)}")
            print("="*80)
            
            # 失敗したテストの詳細
            failed_tests = [r for r in results if r.get('success') != True]
            if failed_tests:
                print("\n❌ 失敗したテスト:")
                for r in failed_tests:
                    func = r.get('test_function', 'unknown')
                    error = r.get('error', '')
                    errors = r.get('errors', [])
                    print(f"  - {func}")
                    if error:
                        print(f"    エラー: {error[:100]}")
                    if errors:
                        print(f"    エラー詳細: {errors[0][:100]}")
            
            # JSONレポートを保存
            report_data = {
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total': len(results),
                    'success': success_count,
                    'failure': failure_count,
                },
                'results': results
            }
            
            report_file = os.path.join(os.path.dirname(__file__), '..', 'logs', 
                                     f'failed_tests_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            os.makedirs(os.path.dirname(report_file), exist_ok=True)
            
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n📝 レポートを保存しました: {report_file}")
            
        finally:
            await context.close()

if __name__ == "__main__":
    from datetime import datetime
    import json
    asyncio.run(run_failed_tests())
