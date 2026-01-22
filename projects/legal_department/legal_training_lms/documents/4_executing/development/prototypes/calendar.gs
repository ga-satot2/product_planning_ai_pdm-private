/*
 * ========================================
 * カレンダー連携関数
 * ========================================
 */

function extractEmailFromEvent(e) {
  if (!e) return '';

  if (e.response && typeof e.response.getRespondentEmail === 'function') {
    const respondent = e.response.getRespondentEmail();
    if (respondent) return respondent.trim();
  }

  if (e.namedValues) {
    for (const key in e.namedValues) {
      if (!Object.prototype.hasOwnProperty.call(e.namedValues, key)) continue;
      const values = e.namedValues[key];
      if (!values || values.length === 0) continue;

      if (/メールアドレス/i.test(key)) {
        return values[0].trim();
      }
    }
  }

  return '';
}

function extractEventIdFromEvent(e, utilsInstance) {
  if (!e) return '';
  const instance = utilsInstance || getUtils();

  if (e.response && typeof e.response.getItemResponses === 'function') {
    const responses = e.response.getItemResponses();
    for (const itemResponse of responses) {
      const answer = itemResponse.getResponse();
      const eventId = extractEventIdFromAnswer(answer, instance);
      if (eventId) return eventId;
    }
  }

  if (e.namedValues) {
    for (const key in e.namedValues) {
      if (!Object.prototype.hasOwnProperty.call(e.namedValues, key)) continue;
      const values = e.namedValues[key];
      if (!values || values.length === 0) continue;

      const eventId = extractEventIdFromAnswer(values[0], instance);
      if (eventId) return eventId;
    }
  }

  return '';
}

function extractEventIdFromAnswer(answer, utilsInstance) {
  if (!answer) return '';
  const instance = utilsInstance || getUtils();

  if (typeof answer === 'string') {
    if (answer.indexOf('(id:') !== -1) {
      return instance.extractIdFromQuestionString(answer);
    }
  } else if (Array.isArray(answer)) {
    for (const value of answer) {
      const eventId = extractEventIdFromAnswer(value, instance);
      if (eventId) return eventId;
    }
  }

  return '';
}

function addGuestToCalendarEvent(calendarId, eventId, email) {
  if (!calendarId) {
    Logger.log('addGuestToCalendarEvent: CALENDAR_ID が未設定のためゲスト追加をスキップします');
    return false;
  }

  const calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) {
    Logger.log(`addGuestToCalendarEvent: カレンダーが見つかりません calendarId=${calendarId}`);
    return false;
  }

  let event = calendar.getEventById(eventId);
  if (!event && eventId.indexOf('@') === -1) {
    event = calendar.getEventById(`${eventId}@google.com`);
  }

  if (!event) {
    Logger.log(`addGuestToCalendarEvent: イベントが見つかりません eventId=${eventId}`);
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingGuests = event
    .getGuestList()
    .map((guest) => guest.getEmail().trim().toLowerCase());

  if (existingGuests.includes(normalizedEmail)) {
    Logger.log(`addGuestToCalendarEvent: ゲストは既に追加済みです email=${email}, eventId=${eventId}`);
    return true;
  }

  event.addGuest(email);
  Logger.log(`addGuestToCalendarEvent: ゲスト追加完了 email=${email}, eventId=${eventId}`);
  return true;
}

function removeGuestFromCalendarEvent(calendarId, eventId, email) {
  if (!calendarId) {
    Logger.log('removeGuestFromCalendarEvent: CALENDAR_ID が未設定のためゲスト削除をスキップします');
    return false;
  }

  const utils = getUtils();
  const success = utils.removeGuestFromCalendarEvent(calendarId, eventId, email);
  return success;
}


