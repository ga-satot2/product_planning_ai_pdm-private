/**
 * ========================================
 * フォーム関連ユーティリティ関数
 * ========================================
 */

// ========================================
// 定数・設定値（遅延初期化）
// ========================================

let _formUtils = null;

/**
 * Utilsインスタンスを取得（遅延初期化）
 */
function form_getFormUtils() {
  if (!_formUtils) {
    _formUtils = form_getUtilsInstance();
  }
  return _formUtils;
}

/**
 * 設定値を取得する関数（遅延初期化）
 */
function form_getFormConfig() {
  return form_getFormUtils().getFormConfig();
}

function form_getFormInvalidValues() {
  return form_getFormUtils().getInvalidValueSet();
}

// 設定値アクセス関数（遅延初期化対応）
function form_getFormSheets() { return form_getFormConfig().sheets; }
function form_getFormStatus() { return form_getFormConfig().status; }
function form_getFormGroups() { return form_getFormConfig().groups; }
function form_getFormConfiguration() { return form_getFormConfig().form; }

/**
 * ソーススプレッドシートを開く
 */
function form_openSourceSpreadsheet() {
  const formConfig = form_getFormConfiguration();
  if (formConfig.spreadsheetId) {
    try {
      return SpreadsheetApp.openById(formConfig.spreadsheetId);
    } catch (error) {
      Logger.log(`form_openSourceSpreadsheet: openById 失敗 ${error}`);
    }
  }

  if (formConfig.spreadsheetUrl) {
    try {
      Logger.log(`form_openSourceSpreadsheet: スクリプトプロパティのURLで開きます: ${formConfig.spreadsheetUrl}`);
      return SpreadsheetApp.openByUrl(formConfig.spreadsheetUrl);
    } catch (error) {
      Logger.log(`form_openSourceSpreadsheet: openByUrl 失敗 ${error}`);
    }
  }

  // 3. アクティブなスプレッドシートを取得（フォームがバインドされている場合）
  try {
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSpreadsheet) {
      Logger.log(`form_openSourceSpreadsheet: アクティブなスプレッドシートを使用します: ${activeSpreadsheet.getName()}`);
      return activeSpreadsheet;
    }
  } catch (error) {
    Logger.log(`form_openSourceSpreadsheet: getActiveSpreadsheet 失敗 ${error}`);
  }

  Logger.log('form_openSourceSpreadsheet: 使用可能なスプレッドシートが見つかりません。スクリプトプロパティ「SPREADSHEET_ID」または「SPREADSHEET_URL」を設定するか、スプレッドシートを開いた状態で実行してください。');
  return null;
}

/**
 * Utilsインスタンスを取得
 */
function form_getUtilsInstance() {
  if (typeof Utils === 'function') {
    return Utils();
  }

  if (typeof LMSUtils !== 'undefined') {
    try {
      if (typeof LMSUtils.Utils === 'function') {
        return LMSUtils.Utils();
      }
      return new LMSUtils();
    } catch (error) {
      Logger.log(`form_getUtilsInstance: LMSUtils からの初期化に失敗: ${error}`);
    }
  }

  throw new ReferenceError('Utils ライブラリが読み込まれていません。');
}

// 後方互換性のためのエイリアス
function getFormUtils() { return form_getFormUtils(); }
function getFormConfig() { return form_getFormConfig(); }
function getFormInvalidValues() { return form_getFormInvalidValues(); }
function getFormSheets() { return form_getFormSheets(); }
function getFormStatus() { return form_getFormStatus(); }
function getFormGroups() { return form_getFormGroups(); }
function getFormConfiguration() { return form_getFormConfiguration(); }
function openSourceSpreadsheet() { return form_openSourceSpreadsheet(); }
function getUtilsInstance() { return form_getUtilsInstance(); }

