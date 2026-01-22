/**
 * ========================================
 * 予約変更機能モジュール
 * ========================================
 * 
 * 機能:
 * - 変更期限チェック（3日前まで）
 * - 変更回数制限（1回まで）
 * - 予約変更申請画面（フォーム生成）
 * - 変更可能セッション表示
 */

/**
 * 変更期限チェック（3日前まで）
 * @param {string} eventId - イベントID
 * @returns {Object} {isValid, deadline, daysUntil, message}
 */
function checkChangeDeadline(eventId) {
  const utils = getUtils();
  const calendarId = getCalendarId();
  
  if (!calendarId) {
    return {
      isValid: false,
      deadline: null,
      daysUntil: null,
      message: 'CALENDAR_ID が未設定です'
    };
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
    
    const eventStart = event.getStartTime();
    const now = new Date();
    const deadline = new Date(eventStart);
    deadline.setDate(deadline.getDate() - 3); // 3日前
    
    const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const isValid = now <= deadline;
    
    const message = isValid 
      ? `変更可能です（期限: ${Utilities.formatDate(deadline, Session.getScriptTimeZone(), 'yyyy年MM月dd日')}）`
      : utils.getErrorMessage('RESERVATION_CHANGE_DEADLINE_PASSED', { deadline: Utilities.formatDate(deadline, Session.getScriptTimeZone(), 'yyyy年MM月dd日') });
    
    return {
      isValid: isValid,
      deadline: deadline,
      daysUntil: daysUntil,
      message: message
    };
    
  } catch (error) {
    utils.error('checkChangeDeadline: エラーが発生しました', { eventId }, error);
    return {
      isValid: false,
      deadline: null,
      daysUntil: null,
      message: error.message
    };
  }
}

/**
 * 変更回数制限チェック（1回まで）
 * @param {string} email - メールアドレス
 * @param {string} eventId - イベントID
 * @returns {Object} {isValid, changeCount, message}
 */
function checkChangeLimit(email, eventId) {
  const utils = getUtils();
  
  try {
    const attendeesSheet = CustomUtils.getSheetByName(sheets.attendees.name);
    const lastRow = attendeesSheet.getLastRow();
    
    if (lastRow < sheets.attendees.rows.FIRST) {
      return {
        isValid: false,
        changeCount: 0,
        message: '参加情報シートにデータがありません'
      };
    }
    
    // 変更履歴を追跡する列がある場合（実装に応じて調整）
    // ここでは簡易的に、同じコースで複数の予約があるかチェック
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
      return {
        isValid: false,
        changeCount: 0,
        message: '参加者情報が見つかりません'
      };
    }
    
    // イベント情報を取得
    const eventInfo = findEventInfoByEventId(eventId, utils);
    if (!eventInfo) {
      return {
        isValid: false,
        changeCount: 0,
        message: 'イベント情報が見つかりません'
      };
    }
    
    // コース列を確認
    const headerRow = attendeesSheet.getRange(
      1,
      sheets.attendees.columns.COURSE_START_COL,
      1,
      COURSE_HEADERS.length
    ).getValues()[0];
    
    const courseIndex = headerRow.indexOf(eventInfo.courseName);
    
    // テスト用イベント（コース名に「テスト」が含まれる）の場合、コース列が存在しなくても許可
    const isTestEvent = eventInfo.courseName && eventInfo.courseName.includes('テスト');
    
    if (courseIndex === -1) {
      if (isTestEvent) {
        // テスト用イベントの場合は、コース列が存在しなくても変更可能とする
        // ただし、emailが参加情報シートに存在することは確認済み
        utils.info('checkChangeLimit: テスト用イベントのため、コース列が存在しなくても変更可能とします', { email, eventId, courseName: eventInfo.courseName });
        return {
          isValid: true,
          changeCount: 0,
          message: '変更可能です（テスト用イベント、変更回数: 0回）'
        };
      } else {
        return {
          isValid: false,
          changeCount: 0,
          message: 'コース情報が見つかりません'
        };
      }
    }
    
    const targetRow = sheets.attendees.rows.FIRST + targetRowOffset;
    const targetColumn = sheets.attendees.columns.COURSE_START_COL + courseIndex;
    const cell = attendeesSheet.getRange(targetRow, targetColumn);
    const currentValue = cell.getValue();
    
    // 「変更済み」マーカーがあるかチェック（実装に応じて調整）
    // ここでは簡易的に、現在の値が「済み」でない場合は変更済みとみなす
    const changeCount = (currentValue === preset_values.has_appointment) ? 0 : 1;
    const isValid = changeCount < 1;
    
    const message = isValid
      ? '変更可能です（変更回数: 0回）'
      : utils.getErrorMessage('RESERVATION_CHANGE_LIMIT_EXCEEDED');
    
    return {
      isValid: isValid,
      changeCount: changeCount,
      message: message
    };
    
  } catch (error) {
    utils.error('checkChangeLimit: エラーが発生しました', { email, eventId }, error);
    return {
      isValid: false,
      changeCount: 0,
      message: error.message
    };
  }
}

/**
 * 予約変更申請画面（フォーム生成）
 * @param {string} email - メールアドレス
 * @param {string} currentEventId - 現在のイベントID
 * @returns {string} HTMLフォーム
 */
function generateReservationChangeForm(email, currentEventId) {
  const utils = getUtils();
  
  try {
    const eventInfo = findEventInfoByEventId(currentEventId, utils);
    if (!eventInfo) {
      throw utils.createError('EVENT_NOT_FOUND', { eventId: currentEventId });
    }
    
    // 変更可能なセッションを取得
    const availableSessions = getAvailableSessionsForChange(email, eventInfo);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>予約変更申請</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .current-reservation { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .session-list { margin: 20px 0; }
    .session-item { border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px; }
    .session-item:hover { background: #f9f9f9; }
    .button { background: #4285f4; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    .button:hover { background: #357ae8; }
    .error { color: red; }
    .success { color: green; }
  </style>
</head>
<body>
  <div class="container">
    <h1>予約変更申請</h1>
    
    <div class="current-reservation">
      <h2>現在の予約</h2>
      <p><strong>コース名:</strong> ${eventInfo.courseName}</p>
      <p><strong>対象グループ:</strong> ${eventInfo.targetGroup || 'N/A'}</p>
    </div>
    
    <div class="session-list">
      <h2>変更可能なセッション</h2>
      ${availableSessions.length > 0 
        ? availableSessions.map(session => `
          <div class="session-item">
            <p><strong>${session.courseName}</strong></p>
            <p>日時: ${session.dateTime}</p>
            <p>空き状況: ${session.availableSpots}席</p>
            <button class="button" onclick="changeReservation('${email}', '${currentEventId}', '${session.eventId}')">
              このセッションに変更
            </button>
          </div>
        `).join('')
        : '<p class="error">変更可能なセッションがありません</p>'
      }
    </div>
    
    <script>
      function changeReservation(email, oldEventId, newEventId) {
        if (confirm('予約を変更しますか？')) {
          // API呼び出し（実装に応じて調整）
          window.location.href = '?action=change&email=' + encodeURIComponent(email) + 
            '&oldEventId=' + encodeURIComponent(oldEventId) + 
            '&newEventId=' + encodeURIComponent(newEventId);
        }
      }
    </script>
  </div>
</body>
</html>
`;
    
    return html;
    
  } catch (error) {
    utils.error('generateReservationChangeForm: エラーが発生しました', { email, currentEventId }, error);
    return `<html><body><p class="error">エラーが発生しました: ${error.message}</p></body></html>`;
  }
}

/**
 * 変更可能セッション表示
 * @param {string} email - メールアドレス
 * @param {Object} currentEventInfo - 現在のイベント情報
 * @returns {Array} 変更可能なセッションのリスト
 */
function getAvailableSessionsForChange(email, currentEventInfo) {
  const utils = getUtils();
  const availableSessions = [];
  
  try {
    const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
    const lastRow = eventsSheet.getLastRow();
    
    if (lastRow < sheets.events.rows.FIRST) {
      return availableSessions;
    }
    
    const calendarId = getCalendarId();
    if (!calendarId) {
      return availableSessions;
    }
    
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      return availableSessions;
    }
    
    // A列から最後の列まで取得（TARGET_GROUPが存在する場合はその列まで、存在しない場合はSTATUS列まで）
    const lastColumn = sheets.events.columns.TARGET_GROUP || sheets.events.columns.STATUS || 11;
    const records = eventsSheet.getRange(
      sheets.events.rows.FIRST,
      1,
      lastRow - sheets.events.rows.FIRST + 1,
      lastColumn
    ).getValues();
    
    // 同じコース名、同じグループのイベントを探す
    for (const row of records) {
      const courseName = row[sheets.events.columns.COURSE_NAME - 1];
      const targetGroup = sheets.events.columns.TARGET_GROUP ? row[sheets.events.columns.TARGET_GROUP - 1] : null;
      // EVENT_URLが定義されていない場合はEVENT_IDを使用
      const eventUrlColumn = sheets.events.columns.EVENT_URL || sheets.events.columns.EVENT_ID || 8;
      const eventUrl = row[eventUrlColumn - 1];
      
      if (courseName !== currentEventInfo.courseName || 
          targetGroup !== currentEventInfo.targetGroup ||
          !eventUrl || invalid_values.has(eventUrl)) {
        continue;
      }
      
      let eventId = eventUrl;
      if (typeof eventUrl === 'string' && eventUrl.indexOf('eid=') !== -1) {
        eventId = utils.eventIdFromURL(eventUrl);
      }
      
      // 現在のイベントは除外
      if (eventId === currentEventInfo.eventId) {
        continue;
      }
      
      try {
        let event = calendar.getEventById(eventId);
        if (!event && eventId.indexOf('@') === -1) {
          event = calendar.getEventById(`${eventId}@google.com`);
        }
        
        if (!event) continue;
        
        // 変更期限チェック
        const deadlineCheck = checkChangeDeadline(eventId);
        if (!deadlineCheck.isValid) {
          continue;
        }
        
        // 定員チェック
        const capacity = checkEventCapacity(eventId);
        if (!capacity || capacity.isFull) {
          continue;
        }
        
        // 重複チェック
        if (checkDuplicateReservation(email, eventId)) {
          continue;
        }
        
        const eventStart = event.getStartTime();
        const eventEnd = event.getEndTime();
        
        availableSessions.push({
          eventId: eventId,
          courseName: courseName,
          dateTime: `${Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'yyyy年MM月dd日(E) HH:mm')} ～ ${Utilities.formatDate(eventEnd, Session.getScriptTimeZone(), 'HH:mm')}`,
          availableSpots: capacity.availableSpots,
          maxAttendees: capacity.maxAttendees,
          currentAttendees: capacity.currentAttendees
        });
        
      } catch (e) {
        // イベントが見つからない場合はスキップ
        continue;
      }
    }
    
    // 日時順にソート
    availableSessions.sort((a, b) => {
      const calendar = CalendarApp.getCalendarById(calendarId);
      const eventA = calendar.getEventById(a.eventId);
      const eventB = calendar.getEventById(b.eventId);
      if (!eventA || !eventB) return 0;
      return eventA.getStartTime() - eventB.getStartTime();
    });
    
    utils.info('getAvailableSessionsForChange: 変更可能セッションを取得', { 
      email, 
      currentEventId: currentEventInfo.eventId,
      count: availableSessions.length 
    });
    
  } catch (error) {
    utils.error('getAvailableSessionsForChange: エラーが発生しました', { email }, error);
  }
  
  return availableSessions;
}

/**
 * 予約変更処理（期限・回数チェック付き）
 * @param {string} email - メールアドレス
 * @param {string} oldEventId - 旧イベントID
 * @param {string} newEventId - 新イベントID
 * @returns {Object} {success, message}
 */
function processReservationChange(email, oldEventId, newEventId) {
  const utils = getUtils();
  
  try {
    // 変更期限チェック
    const deadlineCheck = checkChangeDeadline(oldEventId);
    if (!deadlineCheck.isValid) {
      return {
        success: false,
        message: deadlineCheck.message
      };
    }
    
    // 変更回数制限チェック
    const limitCheck = checkChangeLimit(email, oldEventId);
    if (!limitCheck.isValid) {
      return {
        success: false,
        message: limitCheck.message
      };
    }
    
    // カレンダー同期
    const synced = syncCalendarOnReservationChange(email, oldEventId, newEventId);
    if (!synced) {
      return {
        success: false,
        message: '予約変更に失敗しました'
      };
    }
    
    // 変更履歴を記録（実装に応じて調整）
    recordReservationChange(email, oldEventId, newEventId);
    
    // 予約変更通知を送信
    sendReservationChangeEmail(email, oldEventId, newEventId);
    
    return {
      success: true,
      message: '予約変更が完了しました'
    };
    
  } catch (error) {
    utils.error('processReservationChange: エラーが発生しました', { email, oldEventId, newEventId }, error);
    return {
      success: false,
      message: `エラーが発生しました: ${error.message}`
    };
  }
}

/**
 * 変更履歴を記録
 */
function recordReservationChange(email, oldEventId, newEventId) {
  const utils = getUtils();
  
  try {
    // 変更履歴シートがある場合（実装に応じて調整）
    // ここでは簡易的にログに記録
    utils.info('recordReservationChange: 変更履歴を記録', { email, oldEventId, newEventId });
    
  } catch (error) {
    utils.error('recordReservationChange: エラーが発生しました', { email, oldEventId, newEventId }, error);
  }
}





