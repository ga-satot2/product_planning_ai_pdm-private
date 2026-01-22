/**
 * ========================================
 * カレンダー連携強化モジュール
 * ========================================
 * 
 * 機能:
 * - イベント更新/削除機能実装
 * - 予約変更時のカレンダー同期
 * - キャンセル時のイベント削除
 */

/**
 * イベント更新機能
 * @param {string} eventId - イベントID
 * @param {Object} updates - 更新内容 {title, startTime, endTime, location, description}
 * @returns {boolean} 更新成功時true
 */
function updateCalendarEvent(eventId, updates) {
  const utils = getUtils();
  const calendarId = getCalendarId();
  
  if (!calendarId) {
    utils.warn('updateCalendarEvent: CALENDAR_ID が未設定です', { eventId });
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
    
    // タイトル更新
    if (updates.title) {
      event.setTitle(updates.title);
    }
    
    // 日時更新
    if (updates.startTime && updates.endTime) {
      event.setTime(updates.startTime, updates.endTime);
    }
    
    // 場所更新
    if (updates.location !== undefined) {
      event.setLocation(updates.location);
    }
    
    // 説明更新
    if (updates.description !== undefined) {
      event.setDescription(updates.description);
    }
    
    utils.info('updateCalendarEvent: イベント更新完了', { eventId, updates });
    return true;
    
  } catch (error) {
    utils.error('updateCalendarEvent: エラーが発生しました', { eventId, updates }, error);
    return false;
  }
}

/**
 * イベント削除機能
 * @param {string} eventId - イベントID
 * @returns {boolean} 削除成功時true
 */
function deleteCalendarEvent(eventId) {
  const utils = getUtils();
  const calendarId = getCalendarId();
  
  if (!calendarId) {
    utils.warn('deleteCalendarEvent: CALENDAR_ID が未設定です', { eventId });
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
    
    event.deleteEvent();
    
    utils.info('deleteCalendarEvent: イベント削除完了', { eventId });
    return true;
    
  } catch (error) {
    utils.error('deleteCalendarEvent: エラーが発生しました', { eventId }, error);
    return false;
  }
}

/**
 * 予約変更時のカレンダー同期
 * @param {string} email - メールアドレス
 * @param {string} oldEventId - 旧イベントID
 * @param {string} newEventId - 新イベントID
 * @returns {boolean} 同期成功時true
 */
function syncCalendarOnReservationChange(email, oldEventId, newEventId) {
  const utils = getUtils();
  
  try {
    // 旧イベントからゲストを削除
    const removed = removeGuestFromCalendarEvent(getCalendarId(), oldEventId, email);
    if (!removed) {
      utils.warn('syncCalendarOnReservationChange: 旧イベントからのゲスト削除に失敗', { email, oldEventId });
      // 続行（新イベントへの追加は試行）
    }
    
    // 新イベントにゲストを追加
    const added = addGuestToCalendarEvent(getCalendarId(), newEventId, email);
    if (!added) {
      throw utils.createError('API_ERROR', { apiName: 'Calendar API - addGuest' });
    }
    
    // 参加情報を更新
    markAttendeeAsUnreserved(email, oldEventId, utils);
    markAttendeeAsReserved(email, newEventId, utils);
    
    utils.info('syncCalendarOnReservationChange: カレンダー同期完了', { email, oldEventId, newEventId });
    return true;
    
  } catch (error) {
    utils.error('syncCalendarOnReservationChange: エラーが発生しました', { email, oldEventId, newEventId }, error);
    
    // ロールバック: 旧イベントに戻す
    try {
      addGuestToCalendarEvent(getCalendarId(), oldEventId, email);
      markAttendeeAsReserved(email, oldEventId, utils);
      removeGuestFromCalendarEvent(getCalendarId(), newEventId, email);
      utils.warn('syncCalendarOnReservationChange: ロールバック完了', { email, oldEventId });
    } catch (rollbackError) {
      utils.error('syncCalendarOnReservationChange: ロールバックに失敗', { email, oldEventId }, rollbackError);
    }
    
    return false;
  }
}

/**
 * キャンセル時のイベント削除（ゲストのみ削除、イベント自体は削除しない）
 * @param {string} email - メールアドレス
 * @param {string} eventId - イベントID
 * @returns {boolean} 削除成功時true
 */
function handleCancellation(email, eventId) {
  const utils = getUtils();
  
  try {
    // カレンダーからゲストを削除
    const removed = removeGuestFromCalendarEvent(getCalendarId(), eventId, email);
    if (!removed) {
      utils.warn('handleCancellation: カレンダーからのゲスト削除に失敗', { email, eventId });
      // 続行（参加情報の更新は試行）
    }
    
    // 参加情報を更新
    markAttendeeAsUnreserved(email, eventId, utils);
    
    // キャンセル通知メールを送信（オプション）
    sendCancellationEmail(email, eventId);
    
    utils.info('handleCancellation: キャンセル処理完了', { email, eventId });
    return true;
    
  } catch (error) {
    utils.error('handleCancellation: エラーが発生しました', { email, eventId }, error);
    return false;
  }
}

/**
 * 予約変更通知送信（メール + Slack）
 */
function sendReservationChangeEmail(email, oldEventId, newEventId) {
  const utils = getUtils();
  
  try {
    const calendarId = getCalendarId();
    if (!calendarId) return false;
    
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) return false;
    
    // 旧イベント情報を取得
    let oldEvent = calendar.getEventById(oldEventId);
    if (!oldEvent && oldEventId.indexOf('@') === -1) {
      oldEvent = calendar.getEventById(`${oldEventId}@google.com`);
    }
    
    // 新イベント情報を取得
    let newEvent = calendar.getEventById(newEventId);
    if (!newEvent && newEventId.indexOf('@') === -1) {
      newEvent = calendar.getEventById(`${newEventId}@google.com`);
    }
    
    if (!oldEvent || !newEvent) return false;
    
    const oldEventTitle = oldEvent.getTitle();
    const oldEventStart = oldEvent.getStartTime();
    const newEventTitle = newEvent.getTitle();
    const newEventStart = newEvent.getStartTime();
    
    // メール送信
    const subject = `【予約変更】${newEventTitle} - 継続研修`;
    const body = `
${email} 様

以下の研修の予約を変更いたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【変更前】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

コース名: ${oldEventTitle}
開催日時: ${Utilities.formatDate(oldEventStart, Session.getScriptTimeZone(), 'yyyy年MM月dd日(E) HH:mm')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【変更後】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

コース名: ${newEventTitle}
開催日時: ${Utilities.formatDate(newEventStart, Session.getScriptTimeZone(), 'yyyy年MM月dd日(E) HH:mm')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    
    // Slack通知も送信
    const slackMessage = `予約変更通知\n\n${email} 様が以下の研修の予約を変更しました。\n\n【変更前】\nコース名: ${oldEventTitle}\n開催日時: ${Utilities.formatDate(oldEventStart, Session.getScriptTimeZone(), 'yyyy年MM月dd日(E) HH:mm')}\n\n【変更後】\nコース名: ${newEventTitle}\n開催日時: ${Utilities.formatDate(newEventStart, Session.getScriptTimeZone(), 'yyyy年MM月dd日(E) HH:mm')}`;
    const slackSent = utils.sendSlack(slackMessage);
    if (!slackSent) {
      utils.warn('sendReservationChangeEmail: Slack通知送信に失敗しましたが、処理は継続します', { email, oldEventId, newEventId });
    }
    
    utils.info('sendReservationChangeEmail: 予約変更通知送信完了', { email, oldEventId, newEventId });
    return true;
    
  } catch (error) {
    utils.error('sendReservationChangeEmail: 通知送信エラー', { email, oldEventId, newEventId }, error);
    return false;
  }
}

/**
 * キャンセル通知メール送信
 */
function sendCancellationEmail(email, eventId) {
  const utils = getUtils();
  
  try {
    const calendarId = getCalendarId();
    if (!calendarId) return false;
    
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) return false;
    
    let event = calendar.getEventById(eventId);
    if (!event && eventId.indexOf('@') === -1) {
      event = calendar.getEventById(`${eventId}@google.com`);
    }
    
    if (!event) return false;
    
    const eventTitle = event.getTitle();
    const eventStart = event.getStartTime();
    
    const subject = `【予約キャンセル】${eventTitle} - 継続研修`;
    const body = `
${email} 様

以下の研修の予約をキャンセルいたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【キャンセル内容】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

コース名: ${eventTitle}
開催日時: ${Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'yyyy年MM月dd日(E) HH:mm')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    
    // Slack通知も送信
    const slackMessage = `予約キャンセル通知\n\n${email} 様が以下の研修の予約をキャンセルしました。\n\nコース名: ${eventTitle}\n開催日時: ${Utilities.formatDate(eventStart, Session.getScriptTimeZone(), 'yyyy年MM月dd日(E) HH:mm')}`;
    const slackSent = utils.sendSlack(slackMessage);
    if (!slackSent) {
      utils.warn('sendCancellationEmail: Slack通知送信に失敗しましたが、処理は継続します', { email, eventId });
    }
    
    utils.info('sendCancellationEmail: キャンセルメール送信完了', { email, eventId });
    return true;
    
  } catch (error) {
    utils.error('sendCancellationEmail: メール送信エラー', { email, eventId }, error);
    return false;
  }
}

