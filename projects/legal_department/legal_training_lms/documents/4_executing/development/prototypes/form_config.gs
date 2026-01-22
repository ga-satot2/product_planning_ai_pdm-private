/**
 * ========================================
 * フォーム設定・ユーティリティ関数
 * ========================================
 */

// ========================================
// 定数・設定値（遅延初期化）
// ========================================

/**
 * Utilsインスタンスを取得（遅延初期化）
 * form_utils.gs の form_getFormUtils() を使用
 */
function getFormUtils() {
  return form_getFormUtils();
}

/**
 * 設定値を取得する関数（遅延初期化）
 */
function getFormConfig() {
  return getFormUtils().getFormConfig();
}

function getFormInvalidValues() {
  return getFormUtils().getInvalidValueSet();
}

// 設定値アクセス関数（遅延初期化対応）
function getFormSheets() { return getFormConfig().sheets; }
function getFormStatus() { return getFormConfig().status; }
function getFormGroups() { return getFormConfig().groups; }
function getFormConfiguration() { return getFormConfig().form; }

