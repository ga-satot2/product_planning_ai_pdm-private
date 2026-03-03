/**
 * Playwright で Web アプリ（デプロイ済み URL）の画面を開き、表示可否を検証する。
 * 使用方法: node scripts/run_webapp_verify_playwright.js [WebアプリURL]
 * 例: node scripts/run_webapp_verify_playwright.js "https://script.google.com/macros/s/AKfycby.../exec"
 * URL 省略時は clasp deployments の @HEAD から取得を試みる（要 clasp）。
 */

const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

const BASE_TIMEOUT = 25000;
const USER_DATA_DIR = path.join(os.homedir(), '.playwright_chrome_profile');

const PAGES = [
  { page: 'home', urlSuffix: '?page=home', expectNot: 'ページが見つかりません' },
  { page: 'courses', urlSuffix: '?page=courses', expectNot: 'ページが見つかりません' },
  { page: 'mypage', urlSuffix: '?page=mypage', expectNot: 'ページが見つかりません' },
  { page: 'register', urlSuffix: '?page=register', expectNot: 'ページが見つかりません' },
];

async function getDeployUrlFromClasp() {
  const { execSync } = require('child_process');
  try {
    const out = execSync('clasp deployments 2>/dev/null', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
    });
    const m = out.match(/-\s+([A-Za-z0-9_-]+)\s+@HEAD/);
    if (m && m[1]) {
      const id = m[1].trim();
      return `https://script.google.com/macros/s/${id}/exec`;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function verifyPage(context, baseUrl, { page: pageName, urlSuffix, expectNot }) {
  const url = baseUrl.replace(/\/exec$/, '/exec').replace(/\/$/, '') + urlSuffix;
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: BASE_TIMEOUT });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent().catch(() => '');
    const failed = bodyText && bodyText.includes(expectNot);
    const accessDenied = bodyText && (bodyText.includes('アクセス権') || bodyText.includes('Access denied') || bodyText.includes('sign in'));
    await page.close();
    if (accessDenied) return { page: pageName, pass: false, reason: 'access_denied' };
    if (failed) return { page: pageName, pass: false, reason: 'error_page' };
    return { page: pageName, pass: true };
  } catch (err) {
    await page.close().catch(() => {});
    return { page: pageName, pass: false, reason: err.message || 'timeout' };
  }
}

async function main() {
  let baseUrl = process.argv[2];
  if (!baseUrl || baseUrl === '') {
    baseUrl = await getDeployUrlFromClasp();
  }
  if (!baseUrl || !baseUrl.includes('script.google.com/macros')) {
    console.error('Usage: node run_webapp_verify_playwright.js <WebAppURL>');
    console.error('Or set URL via first argument. URL can be obtained by: clasp deployments (use @HEAD id)');
    process.exit(2);
  }

  const results = [];
  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    timeout: BASE_TIMEOUT,
    args: ['--no-sandbox'],
  });

  try {
    for (const p of PAGES) {
      const r = await verifyPage(browser, baseUrl, p);
      results.push(r);
      console.log(r.pass ? `Pass: ${r.page}` : `Fail: ${r.page} (${r.reason})`);
    }
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log('');
  console.log(`Result: ${passed}/${results.length} passed`);
  if (failed.length) {
    failed.forEach((r) => console.log(`  Fail ${r.page}: ${r.reason}`));
  }
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
