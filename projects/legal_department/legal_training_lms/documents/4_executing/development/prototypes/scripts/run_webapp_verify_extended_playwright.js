/**
 * 要手動確認項目のうち Playwright で検証できるものを実行し、結果を JSON で出力する。
 * 実行: node scripts/run_webapp_verify_extended_playwright.js [WebAppURL]
 * 出力: 1行目に JSON 結果（verify_admin, verify_reservation_flow 等）、2行目以降はログ。
 */

const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

const BASE_TIMEOUT = 30000;
const USER_DATA_DIR = path.join(os.homedir(), '.playwright_chrome_profile');

async function getDeployUrlFromClasp() {
  const { execSync } = require('child_process');
  try {
    const out = execSync('clasp deployments 2>/dev/null', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
    });
    const m = out.match(/-\s+([A-Za-z0-9_-]+)\s+@HEAD/);
    if (m && m[1]) return `https://script.google.com/macros/s/${m[1].trim()}/exec`;
  } catch (e) {}
  return null;
}

function log(msg) {
  const line = typeof msg === 'string' ? msg : JSON.stringify(msg);
  if (process.stdout.isTTY) console.log(line);
  else console.log(line);
}

async function verifyAdminPage(page, baseUrl) {
  const url = baseUrl.replace(/\/$/, '') + '?page=admin';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: BASE_TIMEOUT });
  await page.waitForTimeout(3000);
  const bodyText = await page.locator('body').textContent().catch(() => '');
  if (bodyText && bodyText.includes('ページが見つかりません')) return { pass: false, reason: 'error_page' };
  if (bodyText && (bodyText.includes('アクセス権') || bodyText.includes('Access denied'))) return { pass: false, reason: 'access_denied' };
  const hasAdminContent = bodyText && (bodyText.includes('管理者') || bodyText.includes('管理者権限が必要です') || bodyText.includes('統計'));
  return { pass: !!hasAdminContent, reason: hasAdminContent ? 'ok' : 'no_admin_content' };
}

async function verifyReservationFlow(page, baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  await page.goto(base + '?page=courses', { waitUntil: 'domcontentloaded', timeout: BASE_TIMEOUT });
  await page.waitForTimeout(3000);
  const link = await page.locator('a[href*="page=reservation"]').first();
  const linkCount = await link.count().catch(() => 0);
  if (linkCount === 0) return { pass: null, reason: 'skip_no_reservation_link', detail: 'コースまたは予約するリンクなし' };
  await link.click();
  await page.waitForTimeout(3000);
  const form = page.locator('form#reservationForm');
  const formVisible = await form.isVisible().catch(() => false);
  if (!formVisible) return { pass: null, reason: 'skip_no_form', detail: '予約フォームなし（セッション未設定の可能性）' };
  const radio = page.locator('input[name="sessionId"]:not([disabled])').first();
  const radioCount = await radio.count().catch(() => 0);
  if (radioCount === 0) return { pass: null, reason: 'skip_no_session', detail: '選択可能なセッションなし' };
  await page.on('dialog', (d) => d.accept());
  await radio.check();
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').click();
  try {
    await page.waitForURL(/page=mypage/, { timeout: 15000 });
    return { pass: true, reason: 'navigated_to_mypage' };
  } catch (e) {
    const bodyText = await page.locator('body').textContent().catch(() => '');
    const failed = bodyText && (bodyText.includes('予約に失敗') || bodyText.includes('エラー'));
    return { pass: false, reason: failed ? 'reservation_failed' : 'timeout_before_mypage', detail: e.message };
  }
}

async function main() {
  let baseUrl = process.argv[2];
  if (!baseUrl || baseUrl === '') baseUrl = await getDeployUrlFromClasp();
  if (!baseUrl || !baseUrl.includes('script.google.com/macros')) {
    console.error('Usage: node run_webapp_verify_extended_playwright.js <WebAppURL>');
    process.exit(2);
  }

  const results = { admin: null, reservation_flow: null };
  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    timeout: BASE_TIMEOUT,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    log('Verify admin page...');
    results.admin = await verifyAdminPage(page, baseUrl);
    log(results.admin.pass ? 'Pass: admin' : `Fail/Skip: admin (${results.admin.reason})`);

    log('Verify reservation flow...');
    results.reservation_flow = await verifyReservationFlow(page, baseUrl);
    const r = results.reservation_flow;
    if (r.pass === true) log('Pass: reservation_flow');
    else if (r.pass === null) log(`Skip: reservation_flow (${r.reason})`);
    else log(`Fail: reservation_flow (${r.reason})`);

    await page.close();
  } finally {
    await browser.close();
  }

  log('RESULT_JSON:' + JSON.stringify(results));
  const hasFail = (results.admin && results.admin.pass === false) || (results.reservation_flow && results.reservation_flow.pass === false);
  process.exit(hasFail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
