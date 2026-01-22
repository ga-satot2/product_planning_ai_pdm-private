/**
 * Playwrightを使用してGoogle Apps Scriptのテストを自動実行するスクリプト
 * 
 * 使用方法:
 *   node scripts/run_tests_playwright.js [テスト関数名]
 * 
 * 例:
 *   node scripts/run_tests_playwright.js testAllNewFunctions
 *   node scripts/run_tests_playwright.js testGetReservedCountForGroupAndCourse
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  spreadsheetId: '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE',
  scriptId: '1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-',
  timeout: 60000, // 60秒
  headless: false, // ブラウザを表示する（デバッグ用）
};

// テスト関数のリスト
const TEST_FUNCTIONS = [
  'testGetReservedCountForGroupAndCourse',
  'testGetCourseNumberFromCourseListByCourseName',
  'testUpdateDashboardAfterReservation',
  'testAllNewFunctions',
  'testAllUntestedFunctions',
  'testAllBoundaryAndEdgeCases',
];

/**
 * ログをファイルに保存
 */
function saveLog(testFunction, logContent) {
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(logDir, `playwright_test_${testFunction}_${timestamp}.log`);
  
  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`\n📝 ログを保存しました: ${logFile}`);
  
  return logFile;
}

/**
 * Google Apps Scriptエディタでテスト関数を実行
 */
async function runTestFunction(testFunction) {
  console.log(`\n🚀 テスト関数を実行します: ${testFunction}`);
  
  // 認証済みブラウザプロファイルを使用
  const os = require('os');
  const userDataDir = path.join(os.homedir(), '.playwright_chrome_profile');
  
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: CONFIG.headless,
    slowMo: 1000, // デバッグ用: 各操作を1秒遅延
    viewport: { width: 1920, height: 1080 },
  });
  
  const pages = context.pages;
  const page = pages.length > 0 ? pages[0] : await context.newPage();
  
  try {
    // Apps Scriptエディタを直接開く（認証済みプロファイルを使用）
    console.log('🔧 Apps Scriptエディタを開いています...');
    const scriptUrl = `https://script.google.com/home/projects/${CONFIG.scriptId}/edit`;
    console.log(`   URL: ${scriptUrl}`);
    
    await page.goto(scriptUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });
    
    // エディタが読み込まれるまで待機
    console.log('⏳ エディタの読み込みを待機しています...');
    await page.waitForTimeout(5000);
    
    // 関数選択ドロップダウンを探す
    console.log(`🔍 関数選択ドロップダウンを探しています...`);
    
    // 関数選択ドロップダウンのセレクタを試す
    const functionSelectors = [
      'select[aria-label*="関数"]',
      'select[aria-label*="function"]',
      'select.select-function',
      'div[role="combobox"]',
      'input[placeholder*="関数"]',
      'input[placeholder*="function"]',
    ];
    
    let functionSelector = null;
    for (const selector of functionSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          functionSelector = selector;
          console.log(`   ✅ セレクタが見つかりました: ${selector}`);
          break;
        }
      } catch (e) {
        // 次のセレクタを試す
      }
    }
    
    if (!functionSelector || functionSelector === 'javascript') {
      if (functionSelector === 'javascript') {
        // JavaScriptで既に選択済み
        console.log(`📝 テスト関数を選択済み: ${testFunction}`);
      } else {
        console.log('⚠️  関数選択ドロップダウンが見つかりませんでした。');
        console.log('   手動でテスト関数を選択して実行してください。');
        console.log(`   テスト関数名: ${testFunction}`);
        console.log('\n   ブラウザが開いたままです。手動で実行後、Enterキーを押してください。');
        await page.waitForTimeout(60000); // 60秒待機
        return { success: null, logFile: null, message: '手動実行が必要' };
      }
    } else {
      // 関数選択ドロップダウンをクリック
      const functionDropdown = page.locator(functionSelector).first();
      await functionDropdown.click();
      await page.waitForTimeout(1000);
      
      // テスト関数を選択
      console.log(`📝 テスト関数を選択しています: ${testFunction}`);
      const functionOption = page.locator(`text=${testFunction}`).first();
      if (await functionOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await functionOption.click();
      } else {
        // select要素の場合は直接値を設定
        await functionDropdown.selectOption({ label: testFunction }).catch(async () => {
          await functionDropdown.selectOption({ value: testFunction }).catch(() => {});
        });
      }
      await page.waitForTimeout(2000);
      
      // 実行ボタンをクリック
      console.log('▶️  実行ボタンをクリックしています...');
      const runButtonSelectors = [
        'button[aria-label*="実行"]',
        'button[aria-label*="Run"]',
        'button:has-text("実行")',
        'button:has-text("Run")',
        'div[role="button"]:has-text("実行")',
        'div[role="button"]:has-text("Run")',
      ];
      
      let runButton = null;
      for (const selector of runButtonSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
            runButton = button;
            console.log(`   ✅ 実行ボタンが見つかりました: ${selector}`);
            break;
          }
        } catch (e) {
          // 次のセレクタを試す
        }
      }
      
      if (runButton) {
        await runButton.click();
        console.log('✅ テストを実行しました');
      } else {
        console.log('⚠️  実行ボタンが見つかりませんでした。');
        console.log('   手動で実行ボタンをクリックしてください。');
      }
      
      // 実行ログを待機
      console.log('⏳ 実行ログの表示を待機しています...');
      await page.waitForTimeout(10000); // 10秒待機
      
      // 実行ログを取得
      console.log('📋 実行ログを取得しています...');
      const logSelectors = [
        'div[role="log"]',
        'div.execution-log',
        'div.log-output',
        'pre',
        'div:has-text("実行ログ")',
      ];
      
      let logContent = '';
      for (const selector of logSelectors) {
        try {
          const logElement = page.locator(selector).first();
          if (await logElement.isVisible({ timeout: 2000 }).catch(() => false)) {
            logContent = await logElement.textContent();
            if (logContent && logContent.trim().length > 0) {
              console.log(`   ✅ ログを取得しました（セレクタ: ${selector}）`);
              break;
            }
          }
        } catch (e) {
          // 次のセレクタを試す
        }
      }
      
      if (!logContent || logContent.trim().length === 0) {
        // ページ全体のテキストからログを探す
        const pageText = await page.textContent('body');
        if (pageText && pageText.includes('=== ')) {
          // ログらしい部分を抽出
          const logMatch = pageText.match(/===[\s\S]*?(?=\n\n|\n$|$)/);
          if (logMatch) {
            logContent = logMatch[0];
          }
        }
      }
      
      if (logContent && logContent.trim().length > 0) {
        console.log('\n📊 実行ログ:');
        console.log('─'.repeat(80));
        console.log(logContent);
        console.log('─'.repeat(80));
        
        // ログをファイルに保存
        const logFile = saveLog(testFunction, logContent);
        
        // 成功/失敗を判定
        if (logContent.includes('✅') && !logContent.includes('❌')) {
          console.log('\n✅ テストが成功しました！');
          return { success: true, logFile };
        } else if (logContent.includes('❌')) {
          console.log('\n❌ テストでエラーが発生しました。');
          return { success: false, logFile };
        } else {
          console.log('\n⚠️  テストの結果が不明です。ログを確認してください。');
          return { success: null, logFile };
        }
      } else {
        console.log('\n⚠️  実行ログを取得できませんでした。');
        console.log('   ブラウザで手動でログを確認してください。');
        console.log('   ブラウザが開いたままです。確認後、Enterキーを押してください。');
        await page.waitForTimeout(60000); // 60秒待機
        return { success: null, logFile: null };
      }
    }
  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(error);
    
    // スクリーンショットを保存
    const screenshotPath = path.join(__dirname, '..', 'logs', `error_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 スクリーンショットを保存しました: ${screenshotPath}`);
    
    return { success: false, error: error.message, screenshot: screenshotPath };
  } finally {
    if (CONFIG.headless) {
      await context.close();
    } else {
      console.log('\n💡 ブラウザを閉じるには、Ctrl+Cを押してください。');
      // ヘッドレスモードでない場合は、ブラウザを開いたままにする
    }
  }
}

/**
 * メイン処理
 */
async function main() {
  const testFunction = process.argv[2] || 'testAllNewFunctions';
  
  console.log('🎭 Playwrightを使用してGoogle Apps Scriptのテストを実行します');
  console.log('─'.repeat(80));
  console.log(`📋 テスト関数: ${testFunction}`);
  console.log(`📊 スプレッドシートID: ${CONFIG.spreadsheetId}`);
  console.log(`🔧 スクリプトID: ${CONFIG.scriptId}`);
  console.log('─'.repeat(80));
  
  if (!TEST_FUNCTIONS.includes(testFunction)) {
    console.log(`\n⚠️  警告: ${testFunction}はテスト関数リストにありません。`);
    console.log('   利用可能なテスト関数:');
    TEST_FUNCTIONS.forEach(fn => console.log(`     - ${fn}`));
    console.log('\n   続行しますか？ (y/n)');
    // 簡易的な確認（実際には入力待ちが必要）
  }
  
  const result = await runTestFunction(testFunction);
  
  console.log('\n' + '─'.repeat(80));
  if (result.success === true) {
    console.log('✅ テスト実行が完了しました（成功）');
  } else if (result.success === false) {
    console.log('❌ テスト実行が完了しました（失敗）');
  } else {
    console.log('⚠️  テスト実行が完了しました（結果不明）');
  }
  console.log('─'.repeat(80));
  
  process.exit(result.success === true ? 0 : 1);
}

// 実行
main().catch(error => {
  console.error('致命的なエラー:', error);
  process.exit(1);
});
