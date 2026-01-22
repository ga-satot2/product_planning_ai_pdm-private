/*

 * ========================================

 * ① スプレッドシート側 (Spreadsheet GAS) - V11 (環境変数対応)

 * ========================================

 */



// --- 共通ユーティリティ（遅延初期化） ---

let _utils = null;

/**
 * Utilsインスタンスを取得（遅延初期化）
 */
function getUtils() {
  if (!_utils) {
    Logger.log(`getUtils: 初期化開始 - typeof Utils=${typeof Utils}, typeof LMSUtils=${typeof LMSUtils}`);
    if (typeof Utils === 'function') {
      Logger.log('getUtils: Utils関数を使用');
      _utils = Utils();
    } else if (typeof LMSUtils !== 'undefined') {
      try {
        if (typeof LMSUtils.Utils === 'function') {
          Logger.log('getUtils: LMSUtils.Utils関数を使用');
          _utils = LMSUtils.Utils();
        } else {
          Logger.log('getUtils: new LMSUtils()を使用');
          _utils = new LMSUtils();
        }
        Logger.log(`getUtils: 初期化成功 - _utils=${_utils}`);
      } catch (error) {
        Logger.log(`getUtils: LMSUtils からの初期化に失敗: ${error}`);
        Logger.log(`getUtils: エラースタック: ${error.stack}`);
        throw new ReferenceError('Utils ライブラリが読み込まれていません。');
      }
    } else {
      Logger.log('getUtils: UtilsもLMSUtilsも定義されていません');
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
  try {
    // スプレッドシートにバインドされたスクリプトのプロパティを直接取得
    // ライブラリとして読み込まれたLMSUtilsは、ライブラリ側のスクリプトプロパティを参照するため
    const props = PropertiesService.getScriptProperties();
    const calendarId = props.getProperty('CALENDAR_ID');
    Logger.log(`getCalendarId: 直接取得 - calendarId=${calendarId}`);
    
    // ライブラリ経由でも試す（フォールバック）
    if (!calendarId) {
      const utils = getUtils();
      const libCalendarId = utils.getCalendarId();
      Logger.log(`getCalendarId: ライブラリ経由 - calendarId=${libCalendarId}`);
      return libCalendarId;
    }
    
    return calendarId;
  } catch (error) {
    Logger.log(`getCalendarId: エラーが発生しました: ${error.message}`);
    Logger.log(`getCalendarId: エラースタック: ${error.stack}`);
    throw error;
  }
}

function getSiteUrl() {
  // スプレッドシートにバインドされたスクリプトのプロパティを直接取得
  const props = PropertiesService.getScriptProperties();
  const siteUrl = props.getProperty('SITE_URL');
  return siteUrl || getUtils().getSiteUrl(); // フォールバック
}

function getInvalidValueSet() {
  return getUtils().getInvalidValueSet();
}

// 遅延初期化: 実行時に取得する関数に変更（定数ではなく関数として使用）



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



    const added = addGuestToCalendarEvent(getCalendarId(), eventId, email);

    if (!added) {

      Logger.log(`handleReservationFormSubmit: カレンダーへのゲスト追加に失敗しました (email=${email}, eventId=${eventId})`);

      return;

    }



    markAttendeeAsReserved(email, eventId, getUtils());

  } catch (error) {

    Logger.log(`handleReservationFormSubmit: エラーが発生しました: ${error}`);

  }

}



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

    sheets.attendees.columns.CANDIDATES,

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



function findEventInfoByEventId(eventId, utilsInstance) {

  if (!eventId) return null;



  const instance = utilsInstance || getUtils();

  const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);

  const lastRow = eventsSheet.getLastRow();



  if (lastRow < sheets.events.rows.FIRST) {

    return null;

  }



  const records = eventsSheet.getRange(

    sheets.events.rows.FIRST,

    1,

    lastRow - sheets.events.rows.FIRST + 1,

    sheets.events.columns.TARGET_GROUP

  ).getValues();



  for (const row of records) {

    const courseName = row[sheets.events.columns.COURSE_NAME - 1];

    const eventUrl = row[sheets.events.columns.EVENT_URL - 1];



    if (!eventUrl || getInvalidValueSet().has(eventUrl)) {

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

        targetGroup: row[sheets.events.columns.TARGET_GROUP - 1]

      };

    }

  }



  return null;

}





/*

 * ========================================

 * メインロジック (Triggers)

 * ========================================

 */



/*

  Open Trigger (または手動実行)

  履修状況（参加情報シート）をカレンダーの最新状態に基づいて全更新する

*/

function refreshAttendeeStatus(e) {

  Logger.log("refreshAttendeeStatus: 実行開始");

  try {
    // スクリプトプロパティからカレンダーIDを取得
    const calendarId = getCalendarId();
    Logger.log(`refreshAttendeeStatus: calendarId=${calendarId}, type=${typeof calendarId}`);
    if (!calendarId) {

        Logger.log("Calendar IDが設定されていません。");
        Logger.log("スクリプトプロパティ 'CALENDAR_ID' を確認してください。");

        return;

    }

    let calendar;
    try {
      calendar = CalendarApp.getCalendarById(calendarId);
    } catch (error) {
      Logger.log(`カレンダーの取得に失敗しました: ${error.message}`);
      Logger.log(`カレンダーID: ${calendarId}`);
      throw new Error(`カレンダーが見つかりません。カレンダーIDを確認してください: ${error.message}`);
    }

    let eventsSheet;
    let attendeesSheet;
    try {
      eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
      attendeesSheet = CustomUtils.getSheetByName(sheets.attendees.name);
    } catch (error) {
      Logger.log(`シートの取得に失敗しました: ${error.message}`);
      throw new Error(`必要なシートが見つかりません: ${error.message}`);
    }

    // 1. 予約一覧（全枠）の情報を取得

    // Map<eventId, {name: string(単元名), group: string(対象G)}>

    const eventMap = new Map();

    const eventData = eventsSheet.getRange(

      sheets.events.rows.FIRST, 1,

      Math.max(1, eventsSheet.getLastRow() - sheets.events.rows.FIRST + 1), // データ0件対応

      sheets.events.columns.TARGET_GROUP

    ).getValues();



    eventData.forEach(row => {

      // G列は eventId が「直接」入っている

      const eventId = row[sheets.events.columns.EVENT_URL - 1]; // G列

      const courseName = row[sheets.events.columns.COURSE_NAME - 1];

      const targetGroup = row[sheets.events.columns.TARGET_GROUP - 1]; // "1期生" or "All"

      

      // eventId を検証
      const invalidValues = getInvalidValueSet();
      if (invalidValues.has(eventId) || invalidValues.has(courseName)) return;



      eventMap.set(eventId, { name: courseName, group: targetGroup });

    });

    Logger.log(`eventMap size: ${eventMap.size}`);

    if (eventMap.size === 0) {

      Logger.log("予約一覧に有効なイベントがありません。処理を終了します。");

      return;

    }



    // 2. 全参加者の情報を取得

    // 参加情報シートのD列〜O列（12単元）のヘッダー名を取得

    const headerRow = attendeesSheet.getRange(1, sheets.attendees.columns.COURSE_START_COL, 1, COURSE_HEADERS.length).getValues()[0];

    // Map<単元名, 列インデックス(0始まり)>

    const courseColMap = new Map();

    headerRow.forEach((name, index) => {

      courseColMap.set(name, index + sheets.attendees.columns.COURSE_START_COL);

    });

    

    const lastAttendeeRow = attendeesSheet.getLastRow();

    if (lastAttendeeRow < sheets.attendees.rows.FIRST) {

      Logger.log("参加情報に有効な受講者がいません。処理を終了します。");

      return;

    }

    

    // 参照範囲を A列(NAME) から O列(COURSE_12) までに変更

    const attendeesRange = attendeesSheet.getRange(

      sheets.attendees.rows.FIRST,

      sheets.attendees.columns.NAME, // 1 (A列) から取得開始

      lastAttendeeRow - sheets.attendees.rows.FIRST + 1,

      (sheets.attendees.columns.COURSE_12 - sheets.attendees.columns.NAME) + 1 // A列からO列までの列数

    );

    const attendeesData = attendeesRange.getValues();



    // 3. Map<email, Map<courseName, boolean>> の履修状況マップを作成

    // 全員のステータスを一旦「未」で初期化

    const attendanceMap = new Map();

    attendeesData.forEach(row => {

      // 配列インデックスを修正 (A列=0)

      const email = row[sheets.attendees.columns.CANDIDATES - sheets.attendees.columns.NAME]; // B列 - A列 = 1

      const userGroup = row[sheets.attendees.columns.GROUP - sheets.attendees.columns.NAME]; // C列 - A列 = 2

      if (getInvalidValueSet().has(email)) return;

      

      const userCourses = new Map();

      COURSE_HEADERS.forEach(courseName => {

        userCourses.set(courseName, preset_values.no_appointment);

      });

      attendanceMap.set(email, { group: userGroup, courses: userCourses });

    });



    // 4. カレンダーイベントを横断して履修状況を更新

    // getEvents(start, end) で一括取得

    const now = new Date();

    const startTime = new Date(now.getFullYear(), 0, 1); // 今年の1月1日

    const endTime = new Date(now.getFullYear(), 11, 31); // 今年の12月31日



    const events = calendar.getEvents(startTime, endTime);

    Logger.log(`Found ${events.length} events in calendar this year.`);



    events.forEach(event => {

      const eventId = event.getId().split("@")[0];

      

      // 1. で作成した eventMap に含まれるイベント（＝LMS管理対象）か判定

      if (eventMap.has(eventId)) {

        const { name: courseName, group: targetGroup } = eventMap.get(eventId);

        const guests = event.getGuestList();

        

        guests.forEach(guest => {

          const email = guest.getEmail();

          

          // 2. で作成した attendanceMap に含まれる受講者か判定

          if (attendanceMap.has(email)) {

            const userData = attendanceMap.get(email);

            const userGroup = userData.group;



            // 3. 受講者の所属グループと、イベントの対象グループがマッチするか判定

            if (targetGroup === "All" || targetGroup === userGroup) {

              // 履修状況を「済み」に更新

              userData.courses.set(courseName, preset_values.has_appointment);

            }

          }

        });

      }

    });



    // 5. スプレッドシートに履修状況を書き込む

    // attendeesData (2D配列) を直接変更する

    attendeesData.forEach(row => {

      // 配列インデックスを修正

      const email = row[sheets.attendees.columns.CANDIDATES - sheets.attendees.columns.NAME]; // 1

      if (!attendanceMap.has(email)) return;



      const userData = attendanceMap.get(email);

      

      // D列〜O列のステータスを上書き

      COURSE_HEADERS.forEach((courseName, index) => {

        // 配列インデックスを修正

        const colIndex = (sheets.attendees.columns.COURSE_START_COL - sheets.attendees.columns.NAME) + index; // (4 - 1) + index = 3 + index

        row[colIndex] = userData.courses.get(courseName) || preset_values.no_appointment;

      });

    });



    // 変更したデータでRange全体を一括書き込み

    attendeesRange.setValues(attendeesData);



    Logger.log("refreshAttendeeStatus: 実行完了");

  } catch (error) {
    Logger.log(`refreshAttendeeStatus: エラーが発生しました: ${error.message}`);
    Logger.log(`エラースタック: ${error.stack}`);
    throw error; // エラーを再スローして実行履歴に記録されるようにする
  }

}





/*

  Edit Trigger

  編集されたシートに応じて処理を振り分ける

 */

function editHandler(e) {

  try {
    if (!e || !e.range) {
      Logger.log("editHandler: イベントオブジェクトが無効です");
      return;
    }

    const sheet = e.range.getSheet();

    if (!sheet) {
      Logger.log("editHandler: シートを取得できませんでした");
      return;
    }

    const sheetName = sheet.getName();

    Logger.log(`editHandler: シート "${sheetName}" が編集されました`);

    switch (sheetName) {

      case sheets.dashboard.name:

        return onDashboardAction(e);

      case sheets.events.name:

        return onCreatingSchedule(e);

      // case sheets.attendees.name: // 参加情報シートの手動編集はトリガーしない

      //   return;

      default:

        return;

    }
  } catch (error) {
    Logger.log(`editHandler: エラーが発生しました: ${error.message}`);
    Logger.log(`エラースタック: ${error.stack}`);
    throw error; // エラーを再スローして実行履歴に記録されるようにする
  }

}



/*

  予約一覧シート (events) 編集時

  カレンダーイベントを作成する

*/

function onCreatingSchedule(e) {

  const editedCell = e.range;



  try {

    if (editedCell.getColumn() === sheets.events.columns.TRIGGER &&

      editedCell.getDisplayValue() === preset_values.creation_trigger) {



      // スクリプトプロパティからカレンダーIDを取得
      const calendarId = getCalendarId();
      if (!calendarId) {

        throw new Error("Calendar IDが設定されていません。");

      }



      const row = editedCell.getRow();

      const sheet = e.source.getActiveSheet();

      

      const getValue = (column) => {

        return sheet.getRange(row, column).getValue()

      };



      const valueCourseName = getValue(sheets.events.columns.COURSE_NAME);

      const valueCourseDate = getValue(sheets.events.columns.COURSE_DATE);

      const valueStartTime = getValue(sheets.events.columns.COURSE_START_TIME);

      const valueEndTime = getValue(sheets.events.columns.COURSE_END_TIME);

      const valueDetails = getValue(sheets.events.columns.COURSE_DETAILS);

      const valueTargetGroup = getValue(sheets.events.columns.TARGET_GROUP); // "1期生" etc.

      

      if (valueCourseDate instanceof Date == false ||

        valueStartTime instanceof Date == false ||

        valueEndTime instanceof Date == false) {

        editedCell.setValue(preset_values.error_dates);

        throw ("Invalid date/time values");

      }



      const constructDate = (date, time) => {

        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0);

      }



      const courseStart = constructDate(valueCourseDate, valueStartTime);

      const courseEnd = constructDate(valueCourseDate, valueEndTime);

      

      // タイトルにグループ情報を追加

      const eventTitle = `[${valueTargetGroup || 'All'}] ${valueCourseName}`;

      

      const calendar = CalendarApp.getCalendarById(calendarId); // プロパティから取得したIDを使用

      const event = calendar.createEvent(eventTitle, courseStart, courseEnd, { description: valueDetails });



      if (!event) {

        editedCell.setValue(preset_values.error_general);

        throw ("Cannot create event");

      }



      editedCell.setValue(preset_values.created);



      // G列に htmlLink ではなく eventId (短いID) を保存する

      const eventId = event.getId().split("@")[0];

      sheet.getRange(editedCell.getRow(), sheets.events.columns.EVENT_URL).setValue(eventId);

    }

  }

  catch (e) {

    Logger.log("Error creating schedule: " + e.message);

    editedCell.setValue(preset_values.error_general);

  }

}



/*

  ダッシュボードシート (dashboard) 編集時

  グループ別・コース別にリマインドを送信する

*/

function onDashboardAction(e) {

  const editedCell = e.range;

  const currentSheet = e.source.getActiveSheet();



  try {

    // トリガー列を F列(6) に変更

    if (editedCell.getColumn() === sheets.dashboard.columns.TRIGGER) {

      const triggerValue = (editedCell.getDisplayValue() || "").trim();

      if (!reminder_action_aliases.has(triggerValue)) {

        return;

      }



      const editedRow = editedCell.getRow();

      

      // F列が押された行の A列(Group) と B列(CourseName) を取得

      const targetGroup = currentSheet.getRange(editedRow, sheets.dashboard.columns.GROUP).getValue();

      const targetCourse = currentSheet.getRange(editedRow, sheets.dashboard.columns.COURSE_NAME).getValue();

      

      Logger.log(`Remind action triggered for: Group=[${targetGroup}], Course=[${targetCourse}]`);

      

      // 1. まずステータスを最新化する

      refreshAttendeeStatus();

      

      // 2. 参加情報シートから全データを取得

      const attendeesSheet = CustomUtils.getSheetByName(sheets.attendees.name);

      const lastAttendeeRow = attendeesSheet.getLastRow();

      

      if (lastAttendeeRow < sheets.attendees.rows.FIRST) {

         Logger.log("リマインド対象の受講者がいません。");

         return;

      }

      

      // 参照範囲を A列(NAME) から O列(COURSE_12) までに変更

      const attendeesData = attendeesSheet.getRange(

        sheets.attendees.rows.FIRST,

        sheets.attendees.columns.NAME, // 1 (A列) から取得開始

        lastAttendeeRow - sheets.attendees.rows.FIRST + 1,

        (sheets.attendees.columns.COURSE_12 - sheets.attendees.columns.NAME) + 1 // A列からO列までの列数

      ).getValues();



      // 3. 参加情報シートのヘッダーから、対象コースが何列目か特定する (ヘッダー取得範囲の修正)

      const headerRow = attendeesSheet.getRange(1, sheets.attendees.columns.COURSE_START_COL, 1, COURSE_HEADERS.length).getValues()[0];

      const courseNameIndex = headerRow.indexOf(targetCourse); // D列から数えた相対インデックス (0始まり)



      if (courseNameIndex === -1) {

        throw new Error(`対象のコース名がヘッダーに見つかりません: ${targetCourse}`);

      }

      

      // 4. リマインド対象者をフィルタリング

      let candidatesToRemind = attendeesData

        .map(row => {

          // 配列インデックスを修正

          const email = row[sheets.attendees.columns.CANDIDATES - sheets.attendees.columns.NAME]; // 1

          const userGroup = row[sheets.attendees.columns.GROUP - sheets.attendees.columns.NAME]; // 2

          

          // D列〜O列のステータス配列から、該当コースのステータスを取得

          // 配列インデックスを修正

          const statusColIndex = (sheets.attendees.columns.COURSE_START_COL - sheets.attendees.columns.NAME) + courseNameIndex; // (4 - 1) + index = 3 + index

          const status = row[statusColIndex];



          return { email, userGroup, status };

        })

        .filter(user => {

          if (getInvalidValueSet().has(user.email)) return false;

          // 該当グループでフィルタ

          if (user.userGroup !== targetGroup) return false;

          // 該当コースが「未」の人

          return user.status === preset_values.no_appointment;

        })

        .map((candidate) => "@" + candidate.email.split("@")[0]); // Slackメンション形式に



      candidatesToRemind = [...new Set(candidatesToRemind)]; // 重複排除



      // 5. コース固有のSlackメッセージを送信

      let messageText = "";

      if (candidatesToRemind.length > 0) {

        // Slack メッセージ内のURLをプロパティから取得

        messageText = `[${targetGroup} / ${targetCourse}] 以下の皆さんはこのコースが未予約です。LMSを確認して予約してください。\n`

                    + candidatesToRemind.join("\n")

                    + "\n\n" + getSiteUrl(); // プロパティから取得したサイトURL

      } else {

        messageText = `[${targetGroup} / ${targetCourse}] は全員予約済みです！ 🎉`;

      }



      const slackSent = CustomUtils.sendSlack(messageText);

      if (!slackSent) {

        Logger.log(`⚠️ Slack通知送信に失敗しましたが、処理は継続します`);

      }



      // 実行日時 (G列) とトリガー (F列) をクリア

      const lastReminderCell = currentSheet.getRange(editedRow, sheets.dashboard.columns.LAST_REMINDER);

      lastReminderCell.setValue(new Date());



      const remindActionCell = currentSheet.getRange(editedRow, sheets.dashboard.columns.TRIGGER);

      remindActionCell.setValue("");

    }

  }

  catch (e) {

    Logger.log("Dashboard action failed: " + e.message);

  }

}



/*

  権限承認用のダミー関数

*/

function enablePermissions() {

  // スクリプトプロパティからカレンダーIDを取得

  const localCalendarId = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');

  if (!localCalendarId) {

    Logger.log("Calendar IDがスクリプトプロパティに設定されていません。");

    return;

  }

  

  // Calendar API (v3)

  let calendar = CalendarApp.getCalendarById(localCalendarId);

  if (!calendar) {

      Logger.log(`カレンダーが見つかりません: ${localCalendarId}`);

      return;

  }

  let event = calendar.createEvent("null event", new Date(), new Date());

  let eventId = event.getId().split("@")[0];

  try {

    var details = Calendar.Events.get(localCalendarId, eventId); // Calendar v3 API

  } catch (e) {

      Logger.log("Calendar API v3の有効化、または権限が不足している可能性があります。" + e);

  }

  event.addGuest("test@example.com"); // ダミーゲスト

  var guests = event.getGuestList();

  event.deleteEvent(); // 不要なイベントは削除

  Logger.log(guests.toString());

  

  // Spreadsheet

  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheets.attendees.name);

  

  // Slack (UrlFetch)

  const localSlackUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');

  if (localSlackUrl) {

    UrlFetchApp.fetch(localSlackUrl, { method: 'post', payload: '{}', contentType: 'application/json', muteHttpExceptions: true });

  } else {

      Logger.log("Slack Webhook URLがスクリプトプロパティに設定されていません。");

  }

  Logger.log("権限承認のためのダミー実行が完了しました。エラーが出ていなければ成功です。");

}