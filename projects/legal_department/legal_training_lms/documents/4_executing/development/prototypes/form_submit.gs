/**
 * ========================================
 * form_submit.gs
 * ========================================
 */

function form_onFormSubmit(e) {
  const utils = getUtilsInstance();
  
  return utils.handleError(() => {
    if (!e || !e.response) {
      throw utils.createError('FORM_SUBMISSION_INVALID', { details: 'イベント情報が取得できませんでした' });
    }

    const calendarId = form_getFormUtils().getCalendarId();
    if (!calendarId) {
      throw utils.createError('MISSING_REQUIRED_FIELD', { field: 'CALENDAR_ID' });
    }

    const respondentEmail = e.response.getRespondentEmail();
    const itemResponses = e.response.getItemResponses();

    if (!respondentEmail) {
      throw utils.createError('EMAIL_NOT_FOUND');
    }

    const selectedSession = form_findSelectedSessionResponse(itemResponses);
    if (!selectedSession) {
      throw utils.createError('FORM_SUBMISSION_INVALID', { details: '研修枠の回答が見つかりません' });
    }

    const eventId = utils.extractIdFromQuestionString(selectedSession);
    if (!eventId) {
      throw utils.createError('FORM_SUBMISSION_INVALID', { details: `研修枠の識別子を解析できませんでした: ${selectedSession}` });
    }

    // 定員チェック
    const capacity = checkEventCapacity(eventId);
    if (capacity && capacity.isFull) {
      throw utils.createError('RESERVATION_FULL', { eventId });
    }

    // 重複チェック
    if (checkDuplicateReservation(respondentEmail, eventId)) {
      throw utils.createError('RESERVATION_ALREADY_EXISTS', { email: respondentEmail });
    }

    // カレンダーにゲスト追加
    const success = utils.addGuestToCalendarEvent(calendarId, eventId, respondentEmail);
    if (!success) {
      throw utils.createError('API_ERROR', { apiName: 'Calendar API - addGuest' });
    }

    utils.info('form_onFormSubmit: カレンダーへゲスト追加完了', { eventId, email: respondentEmail });

    // 参加情報を更新
    form_updateAttendeeStatus(respondentEmail, eventId);

    // イベント情報を取得してメール送信
    const eventInfo = findEventInfoByEventId(eventId, utils);
    if (eventInfo) {
      sendReservationConfirmationEmail(respondentEmail, eventId, eventInfo);
    }

    utils.info('form_onFormSubmit: フォーム送信処理完了', { email: respondentEmail, eventId });
    
  }, 'form_onFormSubmit', { email: e?.response?.getRespondentEmail?.() || 'unknown' });
}

// Google Formsのトリガー関数名はonFormSubmitで固定されているため、エイリアスとして残す
function onFormSubmit(e) { return form_onFormSubmit(e); }

function form_getCourseNumberFromCourseList(courseId) {
  try {
    const SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
    const COURSE_LIST_SHEET_GID = 1504366156;
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!spreadsheet) {
      Logger.log('form_getCourseNumberFromCourseList: スプレッドシートが取得できませんでした');
      return null;
    }
    
    const courseListSheet = spreadsheet.getSheetById(COURSE_LIST_SHEET_GID);
    if (!courseListSheet) {
      Logger.log('form_getCourseNumberFromCourseList: コース一覧シートが見つかりませんでした');
      return null;
    }
    
    const lastRow = courseListSheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('form_getCourseNumberFromCourseList: コース一覧シートにデータがありません');
      return null;
    }
    
    // ヘッダー行を取得
    const headerRow = courseListSheet.getRange(1, 1, 1, courseListSheet.getLastColumn()).getValues()[0];
    const courseIdIndex = headerRow.indexOf('コースID');
    const numberIndex = headerRow.indexOf('番号');
    
    if (courseIdIndex === -1 || numberIndex === -1) {
      Logger.log('form_getCourseNumberFromCourseList: 必要な列が見つかりませんでした');
      return null;
    }
    
    // データ行を検索
    const dataRows = courseListSheet.getRange(2, 1, lastRow - 1, courseListSheet.getLastColumn()).getValues();
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row[courseIdIndex] === courseId) {
        const courseNumber = row[numberIndex];
        Logger.log(`form_getCourseNumberFromCourseList: コースID=${courseId} の番号=${courseNumber}`);
        return courseNumber;
      }
    }
    
    Logger.log(`form_getCourseNumberFromCourseList: コースID=${courseId} が見つかりませんでした`);
    return null;
  } catch (error) {
    Logger.log(`form_getCourseNumberFromCourseList: エラーが発生しました: ${error.toString()}`);
    return null;
  }
}

function form_updateAttendeeStatus(email, eventId) {
  if (!email || !eventId) {
    Logger.log('form_updateAttendeeStatus: email または eventId が無効です');
    return;
  }

  const spreadsheet = form_openSourceSpreadsheet();
  if (!spreadsheet) {
    Logger.log('form_updateAttendeeStatus: スプレッドシートを取得できませんでした');
    return;
  }

  const attendeesSheet = spreadsheet.getSheetByName(form_getFormSheets().attendees.name);
  if (!attendeesSheet) {
    Logger.log(`form_updateAttendeeStatus: シートが見つかりません: ${form_getFormSheets().attendees.name}`);
    return;
  }

  // 予約一覧シートからコースIDを取得
  const eventsSheet = spreadsheet.getSheetByName(form_getFormSheets().events.name);
  if (!eventsSheet) {
    Logger.log(`form_updateAttendeeStatus: 予約一覧シートが見つかりません: ${form_getFormSheets().events.name}`);
    return;
  }

  const lastEventRow = eventsSheet.getLastRow();
  if (lastEventRow < form_getFormSheets().events.rows.FIRST) {
    Logger.log('form_updateAttendeeStatus: 予約一覧シートにデータがありません');
    return;
  }

  // eventIdからコースIDを取得
  const eventRows = eventsSheet.getRange(
    form_getFormSheets().events.rows.FIRST,
    1,
    lastEventRow - form_getFormSheets().events.rows.FIRST + 1,
    form_getFormSheets().events.columns.STATUS
  ).getValues();

  let courseId = null;
  for (const row of eventRows) {
    const rowEventId = row[form_getFormSheets().events.columns.EVENT_ID - 1];
    if (rowEventId === eventId) {
      courseId = row[form_getFormSheets().events.columns.COURSE_ID - 1];
      break;
    }
  }

  if (!courseId) {
    Logger.log(`form_updateAttendeeStatus: eventId=${eventId} に一致するコースIDが見つかりません`);
    return;
  }

  Logger.log(`form_updateAttendeeStatus: コースID=${courseId} を取得しました`);

  // コース一覧シートから番号を取得
  const courseNumber = form_getCourseNumberFromCourseList(courseId);
  if (!courseNumber) {
    Logger.log(`form_updateAttendeeStatus: コースID=${courseId} の番号を取得できませんでした`);
    // フォールバック: コース名で検索
    const sessions = form_getScheduledCourses();
    const targetSession = sessions.find((session) => session.eventId === eventId);
    if (!targetSession) {
      Logger.log(`form_updateAttendeeStatus: eventId=${eventId} に一致する研修枠が見つかりません`);
      return;
    }
    
    const headerRow = attendeesSheet
      .getRange(
        1,
        form_getFormSheets().attendees.columns.COURSE_START_COL,
        1,
        COURSE_HEADERS.length
      )
      .getValues()[0];

    const courseIndex = headerRow.indexOf(targetSession.name);
    if (courseIndex === -1) {
      Logger.log(`form_updateAttendeeStatus: 研修名 "${targetSession.name}" に一致する列が参加情報シートに見つかりません`);
      return;
    }

    const lastRow = attendeesSheet.getLastRow();
    if (lastRow < form_getFormSheets().attendees.rows.FIRST) {
      Logger.log('form_updateAttendeeStatus: 参加情報シートに有効なデータがありません');
      return;
    }

    const totalRows = lastRow - form_getFormSheets().attendees.rows.FIRST + 1;
    const emailValues = attendeesSheet
      .getRange(
        form_getFormSheets().attendees.rows.FIRST,
        form_getFormSheets().attendees.columns.EMAIL,
        totalRows,
        1
      )
      .getValues();

    const normalizedEmail = email.trim().toLowerCase();
    let targetRowOffset = -1;
    for (let i = 0; i < emailValues.length; i++) {
      const value = (emailValues[i][0] || '').toString().trim().toLowerCase();
      if (value === normalizedEmail) {
        targetRowOffset = i;
        break;
      }
    }

    if (targetRowOffset === -1) {
      Logger.log(`form_updateAttendeeStatus: email=${email} に一致する受講者が見つかりません`);
      return;
    }

    const targetRow = form_getFormSheets().attendees.rows.FIRST + targetRowOffset;
    const targetColumn = form_getFormSheets().attendees.columns.COURSE_START_COL + courseIndex;
    attendeesSheet.getRange(targetRow, targetColumn).setValue(form_getFormStatus().hasAppointment);

    Logger.log(`form_updateAttendeeStatus: ${email} / ${targetSession.name} を "${form_getFormStatus().hasAppointment}" に更新しました`);
    return;
  }

  // 番号に対応するコース列を更新
  // 参加情報シートのヘッダーは「①」「②」などの形式を想定
  const headerRow = attendeesSheet
    .getRange(
      1,
      form_getFormSheets().attendees.columns.COURSE_START_COL,
      1,
      COURSE_HEADERS.length
    )
    .getValues()[0];

  // 番号を「①」「②」などの形式に変換
  const numberToCircle = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];
  const courseHeader = numberToCircle[courseNumber - 1] || courseNumber.toString();

  const courseIndex = headerRow.indexOf(courseHeader);
  if (courseIndex === -1) {
    Logger.log(`form_updateAttendeeStatus: 番号 ${courseNumber} (${courseHeader}) に対応する列が参加情報シートに見つかりません`);
    Logger.log(`form_updateAttendeeStatus: 利用可能なヘッダー: ${headerRow.join(', ')}`);
    return;
  }

  const lastRow = attendeesSheet.getLastRow();
  if (lastRow < form_getFormSheets().attendees.rows.FIRST) {
    Logger.log('form_updateAttendeeStatus: 参加情報シートに有効なデータがありません');
    return;
  }

  const totalRows = lastRow - form_getFormSheets().attendees.rows.FIRST + 1;
  const emailValues = attendeesSheet
    .getRange(
      form_getFormSheets().attendees.rows.FIRST,
      form_getFormSheets().attendees.columns.EMAIL,
      totalRows,
      1
    )
    .getValues();

  const normalizedEmail = email.trim().toLowerCase();
  let targetRowOffset = -1;
  for (let i = 0; i < emailValues.length; i++) {
    const value = (emailValues[i][0] || '').toString().trim().toLowerCase();
    if (value === normalizedEmail) {
      targetRowOffset = i;
      break;
    }
  }

  if (targetRowOffset === -1) {
    Logger.log(`form_updateAttendeeStatus: email=${email} に一致する受講者が見つかりません`);
    return;
  }

  const targetRow = form_getFormSheets().attendees.rows.FIRST + targetRowOffset;
  const targetColumn = form_getFormSheets().attendees.columns.COURSE_START_COL + courseIndex;
  attendeesSheet.getRange(targetRow, targetColumn).setValue(form_getFormStatus().hasAppointment);

  Logger.log(`form_updateAttendeeStatus: ${email} / コース番号${courseNumber} (${courseHeader}) を "${form_getFormStatus().hasAppointment}" に更新しました`);
  
  // ダッシュボードを更新
  updateDashboardAfterReservation();
}

// 後方互換性のためのエイリアス
function getCourseNumberFromCourseList(courseId) { return form_getCourseNumberFromCourseList(courseId); }
function updateAttendeeStatus(email, eventId) { return form_updateAttendeeStatus(email, eventId); }
function findSelectedSessionResponse(itemResponses) { return form_findSelectedSessionResponse(itemResponses); }

