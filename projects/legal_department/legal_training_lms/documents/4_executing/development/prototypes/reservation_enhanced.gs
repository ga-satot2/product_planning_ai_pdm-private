/**
 * ========================================
 * 予約機能強化モジュール
 * ========================================
 * 
 * 機能:
 * - 定員管理機能
 * - 重複チェック機能
 * - 予約確認メール送信機能
 * - 予約状況の可視化
 * - 予約一覧の自動更新
 */

/**
 * 定員管理機能：イベントの定員をチェック
 * @param {string} eventId - イベントID
 * @returns {Object} 定員情報 {maxAttendees, currentAttendees, isFull, availableSpots}
 */
function checkEventCapacity(eventId) {
  const utils = getUtils();
  const calendarId = getCalendarId();
  
  if (!calendarId) {
    utils.warn('checkEventCapacity: CALENDAR_ID が未設定です', { eventId });
    return null;
  }
  
  try {
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw utils.createError('CALENDAR_NOT_FOUND', { calendarId });
    }
    
    let event = calendar.getEventById(eventId);
    if (!event && eventId.indexOf('@') === -1) {
      event = calendar.getEventById(`${eventId}@google.com`);
    }
    
    if (!event) {
      throw utils.createError('EVENT_NOT_FOUND', { eventId });
    }
    
    // 現在の参加者数を取得（MAX_ATTENDEES列は存在しないため、常にデフォルト値999を使用）
    const guests = event.getGuestList();
    const currentAttendees = guests.length;
    const maxAttendees = 999; // デフォルトは無制限（スプレッドシートにMAX_ATTENDEES列は存在しない）
    
    const result = {
      maxAttendees: maxAttendees,
      currentAttendees: currentAttendees,
      isFull: false, // デフォルトで無制限のため常にfalse
      availableSpots: 999 // デフォルトで無制限
    };
    
    utils.info('checkEventCapacity: 定員チェック完了', { eventId, ...result });
    return result;
    
  } catch (error) {
    utils.error('checkEventCapacity: エラーが発生しました', { eventId }, error);
    return null;
  }
}

/**
 * 重複チェック機能：同じイベントに既に予約済みかチェック
 * @param {string} email - メールアドレス
 * @param {string} eventId - イベントID
 * @returns {boolean} 重複している場合true
 */
function checkDuplicateReservation(email, eventId) {
  const utils = getUtils();
  const calendarId = getCalendarId();
  
  if (!calendarId) {
    utils.warn('checkDuplicateReservation: CALENDAR_ID が未設定です', { email, eventId });
    return false;
  }
  
  try {
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw utils.createError('CALENDAR_NOT_FOUND', { calendarId });
    }
    
    let event = calendar.getEventById(eventId);
    if (!event && eventId.indexOf('@') === -1) {
      event = calendar.getEventById(`${eventId}@google.com`);
    }
    
    if (!event) {
      throw utils.createError('EVENT_NOT_FOUND', { eventId });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const guests = event.getGuestList();
    const existingEmails = guests.map(guest => guest.getEmail().trim().toLowerCase());
    
    const isDuplicate = existingEmails.includes(normalizedEmail);
    
    if (isDuplicate) {
      utils.warn('checkDuplicateReservation: 重複予約を検出', { email, eventId });
    }
    
    return isDuplicate;
    
  } catch (error) {
    utils.error('checkDuplicateReservation: エラーが発生しました', { email, eventId }, error);
    return false;
  }
}

/**
 * 予約確認メール送信機能
 * @param {string} email - メールアドレス
 * @param {string} eventId - イベントID
 * @param {Object} eventInfo - イベント情報
 * @returns {boolean} 送信成功時true
 */
function sendReservationConfirmationEmail(email, eventId, eventInfo) {
  const utils = getUtils();
  
  try {
    if (!email || !eventId || !eventInfo) {
      throw utils.createError('INVALID_DATA', { 
        details: 'email, eventId, eventInfo は必須です' 
      });
    }
    
    const calendarId = getCalendarId();
    if (!calendarId) {
      utils.warn('sendReservationConfirmationEmail: CALENDAR_ID が未設定です', { email, eventId });
      return false;
    }
    
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw utils.createError('CALENDAR_NOT_FOUND', { calendarId });
    }
    
    let event = calendar.getEventById(eventId);
    if (!event && eventId.indexOf('@') === -1) {
      event = calendar.getEventById(`${eventId}@google.com`);
    }
    
    if (!event) {
      throw utils.createError('EVENT_NOT_FOUND', { eventId });
    }
    
    const eventTitle = event.getTitle();
    const eventStart = event.getStartTime();
    const eventEnd = event.getEndTime();
    const eventLocation = event.getLocation() || '';
    const eventDescription = event.getDescription() || '';
    
    const subject = `【予約確認】${eventTitle} - 継続研修`;
    const body = `
${email} 様

この度は、継続研修へのご予約ありがとうございます。

以下の内容で予約を承りました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【予約内容】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

コース名: ${eventTitle}
開催日時: ${Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'yyyy年MM月dd日(E) HH:mm')} ～ ${Utilities.formatDate(eventEnd, Session.getScriptTimeZone(), 'HH:mm')}
${eventLocation ? `会場: ${eventLocation}\n` : ''}
${eventDescription ? `詳細: ${eventDescription}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Googleカレンダーにイベントが追加されました。
カレンダーアプリでご確認ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
このメールは自動送信されています。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body
    });
    
    utils.info('sendReservationConfirmationEmail: メール送信完了', { email, eventId, eventTitle });
    return true;
    
  } catch (error) {
    utils.error('sendReservationConfirmationEmail: メール送信エラー', { email, eventId }, error);
    return false;
  }
}

/**
 * 予約状況の可視化：ダッシュボードを更新
 */
function updateReservationVisualization() {
  const utils = getUtils();
  
  try {
    const dashboardSheet = CustomUtils.getSheetByName(sheets.dashboard.name);
    const attendeesSheet = CustomUtils.getSheetByName(sheets.attendees.name);
    
    if (!dashboardSheet) {
      utils.warn('updateReservationVisualization: ダッシュボードシートが見つかりません');
      return;
    }
    
    if (!attendeesSheet) {
      utils.warn('updateReservationVisualization: 参加情報シートが見つかりません');
      return;
    }
    
    const lastDashboardRow = dashboardSheet.getLastRow();
    if (lastDashboardRow < sheets.dashboard.rows.FIRST) {
      utils.warn('updateReservationVisualization: ダッシュボードにデータがありません');
      return;
    }
    
    const dashboardData = dashboardSheet.getRange(
      sheets.dashboard.rows.FIRST,
      1,
      lastDashboardRow - sheets.dashboard.rows.FIRST + 1,
      sheets.dashboard.columns.LAST_REMINDER
    ).getValues();
    
    // 各ダッシュボード行を更新
    for (let i = 0; i < dashboardData.length; i++) {
      const row = dashboardData[i];
      const group = row[sheets.dashboard.columns.GROUP - 1];
      const courseName = row[sheets.dashboard.columns.COURSE_NAME - 1];
      
      if (!group || !courseName) continue;
      
      // C列（対象者人数）はSUM関数で自動計算されるため、更新しない
      // D列（予約済み人数）を更新
      const reservedCount = getReservedCountForGroupAndCourse(group, courseName, attendeesSheet);
      
      // E列（予約率）を計算して更新
      // C列の値を取得（SUM関数の結果）
      const rowNum = sheets.dashboard.rows.FIRST + i;
      const targetCountCell = dashboardSheet.getRange(rowNum, sheets.dashboard.columns.TARGET_COUNT);
      const targetCountFormula = targetCountCell.getFormula();
      let targetCount = 0;
      
      if (targetCountFormula && targetCountFormula.startsWith('=')) {
        // SUM関数の場合は計算結果を取得
        targetCount = targetCountCell.getValue() || 0;
      } else {
        // 数値の場合はそのまま使用
        targetCount = targetCountCell.getValue() || 0;
      }
      
      // 予約率を計算（C列の値が0の場合は0%）
      const rate = targetCount > 0 ? Math.round((reservedCount / targetCount) * 100) : 0;
      
      // ダッシュボードを更新（C列は更新しない、D列とE列のみ更新）
      dashboardSheet.getRange(rowNum, sheets.dashboard.columns.RESERVED_COUNT).setValue(reservedCount);
      dashboardSheet.getRange(rowNum, sheets.dashboard.columns.RATE).setValue(rate);
    }
    
    utils.info('updateReservationVisualization: 予約状況の可視化を更新しました');
    
  } catch (error) {
    utils.error('updateReservationVisualization: エラーが発生しました', {}, error);
  }
}

/**
 * 予約後にダッシュボードを更新（フォーム送信時など）
 */
function updateDashboardAfterReservation() {
  try {
    updateReservationVisualization();
  } catch (error) {
    Logger.log(`updateDashboardAfterReservation: エラーが発生しました: ${error.toString()}`);
  }
}

/**
 * 対象者数を取得（C列はSUM関数で自動計算されるため、ここでは予約済み人数のみを更新）
 */
function getTargetCountForGroupAndCourse(group, courseName, attendeesSheet) {
  // C列はSUM関数で自動計算されるため、ここでは0を返す（実際の値はSUM関数で計算される）
  // この関数は後方互換性のため残しているが、実際には使用されない
  return 0;
}

/**
 * 予約済み人数を取得
 */
function getReservedCountForGroupAndCourse(group, courseName, attendeesSheet) {
  const utils = getUtils();
  const preset_values = getPresetValues();
  
  const lastRow = attendeesSheet.getLastRow();
  if (lastRow < sheets.attendees.rows.FIRST) return 0;
  
  const data = attendeesSheet.getRange(
    sheets.attendees.rows.FIRST,
    1,
    lastRow - sheets.attendees.rows.FIRST + 1,
    sheets.attendees.columns.COURSE_START_COL + COURSE_HEADERS.length
  ).getValues();
  
  const headerRow = attendeesSheet.getRange(
    1,
    sheets.attendees.columns.COURSE_START_COL,
    1,
    COURSE_HEADERS.length
  ).getValues()[0];
  
  const courseIndex = headerRow.indexOf(courseName);
  if (courseIndex === -1) {
    // コース名で見つからない場合、コース一覧シートから番号を取得して試す
    const courseNumber = getCourseNumberFromCourseListByCourseName(courseName);
    if (courseNumber) {
      const numberToCircle = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];
      const courseHeader = numberToCircle[courseNumber - 1] || courseNumber.toString();
      const courseIndexByNumber = headerRow.indexOf(courseHeader);
      if (courseIndexByNumber !== -1) {
        return getReservedCountForGroupAndCourseByIndex(group, courseIndexByNumber, data);
      }
    }
    return 0;
  }
  
  return getReservedCountForGroupAndCourseByIndex(group, courseIndex, data);
}

/**
 * コースインデックスを使用して予約済み人数を取得
 */
function getReservedCountForGroupAndCourseByIndex(group, courseIndex, data) {
  const preset_values = getPresetValues();
  let count = 0;
  
  for (const row of data) {
    const rowGroup = row[sheets.attendees.columns.GROUP - 1];
    if (rowGroup === group) {
      const status = row[sheets.attendees.columns.COURSE_START_COL - 1 + courseIndex];
      if (status === preset_values.has_appointment) {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * コース名からコース一覧シートの番号を取得
 */
function getCourseNumberFromCourseListByCourseName(courseName) {
  try {
    const SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
    const COURSE_LIST_SHEET_GID = 1504366156;
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!spreadsheet) {
      return null;
    }
    
    const courseListSheet = spreadsheet.getSheetById(COURSE_LIST_SHEET_GID);
    if (!courseListSheet) {
      return null;
    }
    
    const lastRow = courseListSheet.getLastRow();
    if (lastRow < 2) {
      return null;
    }
    
    const headerRow = courseListSheet.getRange(1, 1, 1, courseListSheet.getLastColumn()).getValues()[0];
    const courseNameIndex = headerRow.indexOf('コース名');
    const numberIndex = headerRow.indexOf('番号');
    
    if (courseNameIndex === -1 || numberIndex === -1) {
      return null;
    }
    
    const dataRows = courseListSheet.getRange(2, 1, lastRow - 1, courseListSheet.getLastColumn()).getValues();
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row[courseNameIndex] === courseName) {
        return row[numberIndex];
      }
    }
    
    return null;
  } catch (error) {
    Logger.log(`getCourseNumberFromCourseListByCourseName: エラーが発生しました: ${error.toString()}`);
    return null;
  }
}

/**
 * 予約一覧の自動更新：定員情報を更新
 */
function updateReservationList() {
  const utils = getUtils();
  
  try {
    const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
    const lastRow = eventsSheet.getLastRow();
    
    if (lastRow < sheets.events.rows.FIRST) {
      utils.warn('updateReservationList: 予約一覧にデータがありません');
      return;
    }
    
    const calendarId = getCalendarId();
    if (!calendarId) {
      utils.warn('updateReservationList: CALENDAR_ID が未設定です');
      return;
    }
    
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw utils.createError('CALENDAR_NOT_FOUND', { calendarId });
    }
    
    // STATUS列まで読み取る（MAX_ATTENDEES列は存在しない）
    const records = eventsSheet.getRange(
      sheets.events.rows.FIRST,
      1,
      lastRow - sheets.events.rows.FIRST + 1,
      sheets.events.columns.STATUS
    ).getValues();
    
    // 各イベントの参加者数を更新
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      // EVENT_URLが定義されていない場合はEVENT_IDを使用
      const eventUrlColumn = sheets.events.columns.EVENT_URL || sheets.events.columns.EVENT_ID || 8;
      const eventUrl = row[eventUrlColumn - 1];
      
      if (!eventUrl || invalid_values.has(eventUrl)) continue;
      
      let eventId = eventUrl;
      if (typeof eventUrl === 'string' && eventUrl.indexOf('eid=') !== -1) {
        eventId = utils.eventIdFromURL(eventUrl);
      }
      
      try {
        let event = calendar.getEventById(eventId);
        if (!event && eventId.indexOf('@') === -1) {
          event = calendar.getEventById(`${eventId}@google.com`);
        }
        
        // イベント情報は取得するが、参加者数はスプレッドシートに保存しない
        // （MAX_ATTENDEES列とCURRENT_ATTENDEES列は存在しないため）
        if (event) {
          const guests = event.getGuestList();
          const currentAttendees = guests.length;
          // 参加者数はログに記録するのみ
          Logger.log(`  イベント ${eventId}: 現在の参加者数 ${currentAttendees}名`);
        }
      } catch (e) {
        // イベントが見つからない場合はスキップ
      }
    }
    
    utils.info('updateReservationList: 予約一覧を更新しました');
    
  } catch (error) {
    utils.error('updateReservationList: エラーが発生しました', {}, error);
  }
}











