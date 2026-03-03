/**
 * Web アプリの実画面をスクリーンショットで保存する。
 * 使用: node scripts/capture_webapp_screenshot.js [URL]
 */

const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

const USER_DATA_DIR = path.join(os.homedir(), '.playwright_chrome_profile');
const OUT_DIR = path.join(__dirname, '..');
const TIMEOUT = 30000;

async function main() {
  const baseUrl = process.argv[2] || '';
  if (!baseUrl || !baseUrl.includes('script.google.com/macros')) {
    console.error('Usage: node capture_webapp_screenshot.js <WebAppURL>');
    process.exit(2);
  }

  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    timeout: TIMEOUT,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(4000);

    const outPath = path.join(OUT_DIR, 'webapp_screenshot_home.png');
    await page.screenshot({ path: outPath, fullPage: false });
    console.log('Saved:', outPath);

    await page.goto(baseUrl + '?page=courses', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const outPathCourses = path.join(OUT_DIR, 'webapp_screenshot_courses.png');
    await page.screenshot({ path: outPathCourses, fullPage: false });
    console.log('Saved:', outPathCourses);

    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
