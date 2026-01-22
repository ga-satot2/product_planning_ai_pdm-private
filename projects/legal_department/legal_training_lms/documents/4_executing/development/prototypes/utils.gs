/*
 * ========================================
 * 共通ユーティリティ関数
 * ========================================
 */

// --- 共通ユーティリティ（遅延初期化） ---

let _utils = null;

/**
 * Utilsインスタンスを取得（遅延初期化）
 */
function getUtils() {
  if (!_utils) {
    if (typeof Utils === 'function') {
      _utils = Utils();
    } else if (typeof LMSUtils !== 'undefined') {
      try {
        if (typeof LMSUtils.Utils === 'function') {
          _utils = LMSUtils.Utils();
        } else {
          _utils = new LMSUtils();
        }
      } catch (error) {
        Logger.log(`getUtils: LMSUtils からの初期化に失敗: ${error}`);
        throw new ReferenceError('Utils ライブラリが読み込まれていません。');
      }
    } else {
      throw new ReferenceError('Utils 関数が定義されていません。LMSUtils.gs が読み込まれているか確認してください。');
    }
  }
  return _utils;
}

/**
 * 設定値を取得する関数（遅延初期化）
 */
function getConfig() {
  return getUtils().getConfig();
}

// 設定値アクセス関数（遅延初期化対応）
function getPresetValues() { return getConfig().presetValues; }
function getSheets() { return getConfig().sheets; }
function getCourseHeaders() { return getConfig().courseHeaders; }

const preset_values = getPresetValues();

const reminder_action_aliases = new Set([
  preset_values.action_remind,
  "未予約者に対してリマインド"
]);

const sheets = getSheets();

const COURSE_HEADERS = getCourseHeaders();

function getCalendarId() {
  return getUtils().getCalendarId();
}

function getSiteUrl() {
  return getUtils().getSiteUrl();
}

function getInvalidValueSet() {
  return getUtils().getInvalidValueSet();
}

const calendarId = getCalendarId();

const site_url = getSiteUrl();

const invalid_values = getInvalidValueSet();

/*
 * ========================================
 * ユーティリティ関数
 * ========================================
 */

const CustomUtils = {
  // Slack送信
  sendSlack: (messageText) => getUtils().sendSlack(messageText),

  // getSheetByName (エラーハンドリング強化)
  getSheetByName: (name) => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sheet) {
      throw new Error(`Sheet not found: ${name}`);
    }
    return sheet;
  }
};


