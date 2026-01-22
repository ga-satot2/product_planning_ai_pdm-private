/*
 * ========================================
 * 予約管理関数
 * ========================================
 */

/**
 * フォーム送信を検知してカレンダーにゲスト追加＆参加情報を更新する
 * インストール型トリガー（フォーム送信時）から呼び出してください。
 */
function handleReservationFormSubmit(e) {
  try {
    const email = extractEmailFromEvent(e);
    const eventId = extractEventIdFromEvent(e, getUtils());

    if (!email || !eventId) {
      Logger.log('handleReservationFormSubmit: email または eventId を取得できませんでした。処理を中断します。');
      return;
    }

    const localCalendarId = getCalendarId();
    const added = addGuestToCalendarEvent(localCalendarId, eventId, email);
    if (!added) {
      Logger.log(`handleReservationFormSubmit: カレンダーへのゲスト追加に失敗しました (email=${email}, eventId=${eventId})`);
      return;
    }

    markAttendeeAsReserved(email, eventId, getUtils());
  } catch (error) {
    Logger.log(`handleReservationFormSubmit: エラーが発生しました: ${error}`);
  }
}

/**
 * 予約キャンセル処理
 * 
 * エラーハンドリング強化版:
 * - カレンダーからゲスト削除
 * - 参加情報を更新
 * - キャンセル通知メール送信
 * 
 * @param {string} email - メールアドレス
 * @param {string} eventId - イベントID
 * @returns {boolean} キャンセル成功時true
 */
function cancelReservation(email, eventId) {
  const utils = getUtils();
  
  return utils.handleError(() => {
    utils.info('cancelReservation: 予約削除を開始', { email, eventId });

    const calendarId = getCalendarId();
    if (!calendarId) {
      throw utils.createError('MISSING_REQUIRED_FIELD', { field: 'CALENDAR_ID' });
    }

    // キャンセル処理（カレンダーから削除、参加情報更新、メール送信）
    const success = handleCancellation(email, eventId);
    if (!success) {
      throw utils.createError('API_ERROR', { apiName: 'Calendar API - removeGuest' });
    }

    utils.info('cancelReservation: 予約削除完了', { email, eventId });
    return true;
    
  }, 'cancelReservation', { email, eventId }) || false;
}

/**
 * 予約変更処理（期限・回数チェック付き）
 * 
 * エラーハンドリング強化版:
 * - 変更期限チェック（3日前まで）
 * - 変更回数制限チェック（1回まで）
 * - カレンダー同期
 * - ロールバック機能
 * 
 * @param {string} email - メールアドレス
 * @param {string} oldEventId - 旧イベントID
 * @param {string} newEventId - 新イベントID
 * @returns {boolean} 変更成功時true
 */
function changeReservation(email, oldEventId, newEventId) {
  const utils = getUtils();
  
  return utils.handleError(() => {
    utils.info('changeReservation: 予約変更を開始', { email, oldEventId, newEventId });

    // 予約変更処理（期限・回数チェック付き）
    const result = processReservationChange(email, oldEventId, newEventId);
    if (!result.success) {
      throw utils.createError('INVALID_DATA', { details: result.message });
    }

    utils.info('changeReservation: 予約変更完了', { email, oldEventId, newEventId });
    return true;
    
  }, 'changeReservation', { email, oldEventId, newEventId }) || false;
}

function markAttendeeAsReserved(email, eventId, utilsInstance) {
  const instance = utilsInstance || getUtils();
  const attendeesSheet = CustomUtils.getSheetByName(sheets.attendees.name);
  const eventInfo = findEventInfoByEventId(eventId, instance);

  if (!eventInfo) {
    Logger.log(`markAttendeeAsReserved: イベント情報を取得できませんでした eventId=${eventId}`);
    return;
  }

  const headerRow = attendeesSheet
    .getRange(1, sheets.attendees.columns.COURSE_START_COL, 1, COURSE_HEADERS.length)
    .getValues()[0];
  const courseIndex = headerRow.indexOf(eventInfo.courseName);

  if (courseIndex === -1) {
    Logger.log(`markAttendeeAsReserved: 研修名 "${eventInfo.courseName}" に対応する列が見つかりません`);
    return;
  }

  const lastRow = attendeesSheet.getLastRow();
  if (lastRow < sheets.attendees.rows.FIRST) {
    Logger.log('markAttendeeAsReserved: 参加情報シートにデータがありません');
    return;
  }

  const emailRange = attendeesSheet.getRange(
    sheets.attendees.rows.FIRST,
    sheets.attendees.columns.EMAIL,
    lastRow - sheets.attendees.rows.FIRST + 1,
    1
  );
  const emailValues = emailRange.getValues();
  const normalizedEmail = email.trim().toLowerCase();
  let targetRowOffset = -1;

  for (let i = 0; i < emailValues.length; i++) {
    const cellValue = (emailValues[i][0] || '').toString().trim().toLowerCase();
    if (cellValue === normalizedEmail) {
      targetRowOffset = i;
      break;
    }
  }

  if (targetRowOffset === -1) {
    Logger.log(`markAttendeeAsReserved: email=${email} に一致する受講者が見つかりません`);
    return;
  }

  const targetRow = sheets.attendees.rows.FIRST + targetRowOffset;
  const targetColumn = sheets.attendees.columns.COURSE_START_COL + courseIndex;
  const cell = attendeesSheet.getRange(targetRow, targetColumn);

  const currentValue = cell.getValue();
  if (currentValue === preset_values.has_appointment) {
    Logger.log(`markAttendeeAsReserved: ステータスは既に "${preset_values.has_appointment}" です`);
    return;
  }

  cell.setValue(preset_values.has_appointment);
  Logger.log(`markAttendeeAsReserved: ${email} の "${eventInfo.courseName}" を "${preset_values.has_appointment}" に更新しました`);
}

function markAttendeeAsUnreserved(email, eventId, utilsInstance) {
  const instance = utilsInstance || getUtils();
  const attendeesSheet = CustomUtils.getSheetByName(sheets.attendees.name);
  const eventInfo = findEventInfoByEventId(eventId, instance);

  if (!eventInfo) {
    Logger.log(`markAttendeeAsUnreserved: イベント情報を取得できませんでした eventId=${eventId}`);
    return;
  }

  const headerRow = attendeesSheet
    .getRange(1, sheets.attendees.columns.COURSE_START_COL, 1, COURSE_HEADERS.length)
    .getValues()[0];
  const courseIndex = headerRow.indexOf(eventInfo.courseName);

  if (courseIndex === -1) {
    Logger.log(`markAttendeeAsUnreserved: 研修名 "${eventInfo.courseName}" に対応する列が見つかりません`);
    return;
  }

  const lastRow = attendeesSheet.getLastRow();
  if (lastRow < sheets.attendees.rows.FIRST) {
    Logger.log('markAttendeeAsUnreserved: 参加情報シートにデータがありません');
    return;
  }

  const emailRange = attendeesSheet.getRange(
    sheets.attendees.rows.FIRST,
    sheets.attendees.columns.EMAIL,
    lastRow - sheets.attendees.rows.FIRST + 1,
    1
  );
  const emailValues = emailRange.getValues();
  const normalizedEmail = email.trim().toLowerCase();
  let targetRowOffset = -1;

  for (let i = 0; i < emailValues.length; i++) {
    const cellValue = (emailValues[i][0] || '').toString().trim().toLowerCase();
    if (cellValue === normalizedEmail) {
      targetRowOffset = i;
      break;
    }
  }

  if (targetRowOffset === -1) {
    Logger.log(`markAttendeeAsUnreserved: email=${email} に一致する受講者が見つかりません`);
    return;
  }

  const targetRow = sheets.attendees.rows.FIRST + targetRowOffset;
  const targetColumn = sheets.attendees.columns.COURSE_START_COL + courseIndex;
  const cell = attendeesSheet.getRange(targetRow, targetColumn);

  const currentValue = cell.getValue();
  if (currentValue === preset_values.no_appointment) {
    Logger.log(`markAttendeeAsUnreserved: ステータスは既に "${preset_values.no_appointment}" です`);
    return;
  }

  cell.setValue(preset_values.no_appointment);
  Logger.log(`markAttendeeAsUnreserved: ${email} の "${eventInfo.courseName}" を "${preset_values.no_appointment}" に更新しました`);
}

function findEventInfoByEventId(eventId, utilsInstance) {
  if (!eventId) return null;

  const instance = utilsInstance || getUtils();
  const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
  const lastRow = eventsSheet.getLastRow();

  if (lastRow < sheets.events.rows.FIRST) {
    return null;
  }

  // A列から最後の列まで取得（TARGET_GROUPが存在する場合はその列まで、存在しない場合はSTATUS列まで）
  const lastColumn = sheets.events.columns.TARGET_GROUP || sheets.events.columns.STATUS || 11;
  const records = eventsSheet.getRange(
    sheets.events.rows.FIRST,
    1,
    lastRow - sheets.events.rows.FIRST + 1,
    lastColumn
  ).getValues();

  for (const row of records) {
    const courseName = row[sheets.events.columns.COURSE_NAME - 1];
    const eventUrl = row[sheets.events.columns.EVENT_URL - 1];

    if (!eventUrl || invalid_values.has(eventUrl)) {
      continue;
    }

    let rowEventId = eventUrl;
    if (typeof eventUrl === 'string' && eventUrl.indexOf('eid=') !== -1) {
      rowEventId = instance.eventIdFromURL(eventUrl);
    }

    if (rowEventId === eventId) {
      return {
        courseName,
        eventUrl,
        targetGroup: sheets.events.columns.TARGET_GROUP ? row[sheets.events.columns.TARGET_GROUP - 1] : null
      };
    }
  }

  return null;
}


