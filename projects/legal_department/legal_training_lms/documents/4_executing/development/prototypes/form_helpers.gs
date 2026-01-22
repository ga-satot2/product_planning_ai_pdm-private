/**
 * ========================================
 * form_helpers.gs
 * ========================================
 * 注意: このファイルの関数は form_data.gs と form_utils.gs に統合されています。
 * 後方互換性のためのエイリアスのみを提供します。
 */

function form_findSelectedSessionResponse(itemResponses) {
  for (const response of itemResponses) {
    const title = response.getItem().getTitle();
    if (title === form_getFormConfiguration().steps[1].items[0].title) {
      return response.getResponse();
    }
  }
  return null;
}

// 後方互換性のためのエイリアス（form_data.gs と form_utils.gs の関数を参照）
function mergeDateAndTime(datePart, timePart) { return form_mergeDateAndTime(datePart, timePart); }
function formatDate(date) { return form_formatDate(date); }
function formatTime(date) { return form_formatTime(date); }
function buildSessionChoiceLabel(session, utils) { return form_buildSessionChoiceLabel(session, utils); }
function findSelectedSessionResponse(itemResponses) { return form_findSelectedSessionResponse(itemResponses); }
function getUtilsInstance() { return form_getUtilsInstance(); }
function isSessionAvailableForGroup(session, groupName) { return form_isSessionAvailableForGroup(session, groupName); }

