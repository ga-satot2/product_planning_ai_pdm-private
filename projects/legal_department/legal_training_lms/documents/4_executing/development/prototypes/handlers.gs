/*
 * ========================================
 * イベントハンドラー関数
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
    if (!calendarId) {
        Logger.log("Calendar IDが設定されていません。");
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
    // A列から最後の列まで取得（TARGET_GROUPが存在する場合はその列まで、存在しない場合はSTATUS列まで）
    const lastColumn = sheets.events.columns.TARGET_GROUP || sheets.events.columns.STATUS || 11;
    const eventData = eventsSheet.getRange(
      sheets.events.rows.FIRST, 1,
      Math.max(1, eventsSheet.getLastRow() - sheets.events.rows.FIRST + 1), // データ0件対応
      lastColumn
    ).getValues();

    eventData.forEach(row => {
      // G列は eventId が「直接」入っている
      // EVENT_URLが定義されていない場合はEVENT_IDを使用
      const eventUrlColumn = sheets.events.columns.EVENT_URL || sheets.events.columns.EVENT_ID || 10;
      const eventId = row[eventUrlColumn - 1];
      const courseName = row[sheets.events.columns.COURSE_NAME - 1];
      const targetGroup = sheets.events.columns.TARGET_GROUP ? row[sheets.events.columns.TARGET_GROUP - 1] : null; // "1期生" or "All"
      
      // eventId を検証
      if (invalid_values.has(eventId) || invalid_values.has(courseName)) return;

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
    // ⚠️ テストモード: テスト用emailのみを対象にする
    const testEmailFilter = e && e.testEmail ? e.testEmail : null;
    const attendanceMap = new Map();
    attendeesData.forEach(row => {
      // 配列インデックスを修正 (A列=0)
      const email = row[sheets.attendees.columns.EMAIL - sheets.attendees.columns.NAME]; // B列 - A列 = 1
      const userGroup = row[sheets.attendees.columns.GROUP - sheets.attendees.columns.NAME]; // C列 - A列 = 2
      if (invalid_values.has(email)) return;
      
      // テストモード: テスト用emailのみを対象にする
      if (testEmailFilter && email !== testEmailFilter) return;
      
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
    // ⚠️ テストモード: テスト用emailのみを更新する
    attendeesData.forEach(row => {
      // 配列インデックスを修正
      const email = row[sheets.attendees.columns.EMAIL - sheets.attendees.columns.NAME]; // 1
      if (!attendanceMap.has(email)) return;
      
      // テストモード: テスト用emailのみを更新する
      if (testEmailFilter && email !== testEmailFilter) return;

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
  
  トリガー方法:
  1. TRIGGER列に「設定する」を入力（手動トリガー）
  2. 日程・開始日時・完了日時のいずれかが編集され、eventIdが空の場合（自動トリガー）
*/
function onCreatingSchedule(e) {
  const editedCell = e.range;
  const editedColumn = editedCell.getColumn();
  const row = editedCell.getRow();
  const sheet = e.source.getActiveSheet();

  try {
    // 手動トリガー: TRIGGER列に「設定する」を入力
    const isManualTrigger = editedColumn === sheets.events.columns.TRIGGER &&
      editedCell.getDisplayValue() === preset_values.creation_trigger;
    
    // 自動トリガー: 日程・開始日時・完了日時のいずれかが編集された場合
    const dateTimeColumns = [
      sheets.events.columns.COURSE_DATE,
      sheets.events.columns.COURSE_START_TIME,
      sheets.events.columns.COURSE_END_TIME
    ];
    const isAutoTrigger = dateTimeColumns.includes(editedColumn);
    
    if (!isManualTrigger && !isAutoTrigger) {
      return; // トリガー条件に該当しない場合は何もしない
    }

    const getValue = (column) => {
      return sheet.getRange(row, column).getValue()
    };

    const valueCourseName = getValue(sheets.events.columns.COURSE_NAME);
    const valueCourseDate = getValue(sheets.events.columns.COURSE_DATE);
    const valueStartTime = getValue(sheets.events.columns.COURSE_START_TIME);
    const valueEndTime = getValue(sheets.events.columns.COURSE_END_TIME);
    const valueDetails = getValue(sheets.events.columns.COURSE_DETAILS);
    const valueTargetGroup = getValue(sheets.events.columns.TARGET_GROUP);
    const valueEventId = getValue(sheets.events.columns.EVENT_ID);
    const valueLocation = getValue(sheets.events.columns.LOCATION);
    
    // 自動トリガーの場合、eventIdが既に設定されている場合は何もしない
    if (isAutoTrigger && valueEventId && valueEventId.toString().trim() !== '') {
      return;
    }
    
    // 必須フィールドのチェック
    if (!valueCourseName || !valueCourseDate || !valueStartTime || !valueEndTime) {
      if (isManualTrigger) {
        editedCell.setValue(preset_values.error_dates);
      }
      return;
    }
    
    // 日付・時刻の型チェック
    if (!(valueCourseDate instanceof Date) ||
        !(valueStartTime instanceof Date) ||
        !(valueEndTime instanceof Date)) {
      if (isManualTrigger) {
        editedCell.setValue(preset_values.error_dates);
      }
      return;
    }

    // スクリプトプロパティからカレンダーIDを取得
    const calendarId = getCalendarId();
    if (!calendarId) {
      Logger.log("onCreatingSchedule: Calendar IDが設定されていません。");
      return;
    }

    const constructDate = (date, time) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0);
    }

    const courseStart = constructDate(valueCourseDate, valueStartTime);
    const courseEnd = constructDate(valueCourseDate, valueEndTime);
    
    // タイトルにグループ情報を追加
    const eventTitle = `[${valueTargetGroup || 'All'}] ${valueCourseName}`;
    
    // 既存のカレンダーイベントを検索（タイトルと日時で検索）
    // 検索範囲: 開始時刻の前後1時間以内
    const searchStart = new Date(courseStart.getTime() - 60 * 60 * 1000); // 1時間前
    const searchEnd = new Date(courseEnd.getTime() + 60 * 60 * 1000); // 1時間後
    
    let existingEvent = null;
    
    // アクセス可能なすべてのカレンダーから検索（共有されているカレンダーも含む）
    try {
      const allCalendars = CalendarApp.getAllCalendars();
      Logger.log(`onCreatingSchedule: ${allCalendars.length}個のカレンダーから検索します`);
      
      for (let calIdx = 0; calIdx < allCalendars.length; calIdx++) {
        const cal = allCalendars[calIdx];
        try {
          const events = cal.getEvents(searchStart, searchEnd);
          Logger.log(`onCreatingSchedule: カレンダー「${cal.getName()}」から${events.length}件のイベントを取得`);
          
          for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const eventStart = event.getStartTime();
            const eventEnd = event.getEndTime();
            
            // タイトルが一致するか、またはコース名が含まれているかチェック
            // タイトルから【継続⑤】などのプレフィックスを除去して比較
            const eventTitleClean = event.getTitle().replace(/^【.*?】\s*/, '').replace(/^\[.*?\]\s*/, '');
            const courseNameClean = valueCourseName.replace(/^【.*?】\s*/, '').replace(/^\[.*?\]\s*/, '');
            
            const eventTitleMatch = event.getTitle().includes(valueCourseName) || 
                                    event.getTitle().includes(courseNameClean) ||
                                    valueCourseName.includes(eventTitleClean) ||
                                    courseNameClean.includes(eventTitleClean);
            
            // 日時が一致するかチェック（5分以内の誤差を許容）
            const timeDiff = Math.abs(eventStart.getTime() - courseStart.getTime());
            const timeMatch = timeDiff < 5 * 60 * 1000; // 5分以内
            
            if (eventTitleMatch && timeMatch) {
              existingEvent = event;
              Logger.log(`onCreatingSchedule: 既存のカレンダーイベントを発見しました (calendar: ${cal.getName()}, title: ${event.getTitle()}, start: ${eventStart})`);
              break;
            }
          }
          
          if (existingEvent) {
            break; // 見つかったら検索を終了
          }
        } catch (calError) {
          Logger.log(`onCreatingSchedule: カレンダー「${cal.getName()}」の検索中にエラー: ${calError.message}`);
          continue; // 次のカレンダーを検索
        }
      }
    } catch (error) {
      Logger.log(`onCreatingSchedule: 既存イベント検索中にエラー: ${error.message}`);
    }
    
    // 既存イベントが見つからなかった場合、デフォルトのカレンダーを使用
    const calendar = CalendarApp.getCalendarById(calendarId);
    
    let event;
    if (existingEvent) {
      // 既存のイベントを使用
      event = existingEvent;
      Logger.log(`onCreatingSchedule: 既存のカレンダーイベントを使用します`);
    } else {
      // 新規イベントを作成
      // イベントの説明にコース案内と開催場所を追加
      let eventDescription = valueDetails || '';
      if (valueLocation && valueLocation.toString().trim() !== '') {
        eventDescription += (eventDescription ? '\n\n' : '') + `開催場所: ${valueLocation}`;
      }
      
      event = calendar.createEvent(eventTitle, courseStart, courseEnd, { 
        description: eventDescription,
        location: valueLocation || ''
      });
      
      if (!event) {
        if (isManualTrigger) {
          editedCell.setValue(preset_values.error_general);
        }
        Logger.log("onCreatingSchedule: カレンダーイベントの作成に失敗しました");
        return;
      }
      
      Logger.log(`onCreatingSchedule: 新しいカレンダーイベントを作成しました`);
    }

      if (!event) {
        if (isManualTrigger) {
          editedCell.setValue(preset_values.error_general);
        }
        Logger.log("onCreatingSchedule: カレンダーイベントの作成に失敗しました");
        return;
      }

      // eventId (短いID) を取得
      const eventId = event.getId().split("@")[0];
      
      // EVENT_ID列にeventIdを保存
      sheet.getRange(row, sheets.events.columns.EVENT_ID).setValue(eventId);
      
      // 手動トリガーの場合のみ、TRIGGER列を更新
      if (isManualTrigger) {
        editedCell.setValue(preset_values.created);
      }
      
      Logger.log(`onCreatingSchedule: カレンダーイベントを作成しました (eventId: ${eventId}, row: ${row})`);
  }
  catch (e) {
    Logger.log("onCreatingSchedule: エラーが発生しました: " + e.message);
    Logger.log("onCreatingSchedule: スタックトレース: " + e.stack);
    if (isManualTrigger) {
      editedCell.setValue(preset_values.error_general);
    }
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
          const email = row[sheets.attendees.columns.EMAIL - sheets.attendees.columns.NAME]; // 1
          const userGroup = row[sheets.attendees.columns.GROUP - sheets.attendees.columns.NAME]; // 2
          
          // D列〜O列のステータス配列から、該当コースのステータスを取得
          // 配列インデックスを修正
          const statusColIndex = (sheets.attendees.columns.COURSE_START_COL - sheets.attendees.columns.NAME) + courseNameIndex; // (4 - 1) + index = 3 + index
          const status = row[statusColIndex];

          return { email, userGroup, status };
        })
        .filter(user => {
          if (invalid_values.has(user.email)) return false;
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
                    + "\n\n" + site_url; // プロパティから取得したサイトURL
      } else {
        messageText = `[${targetGroup} / ${targetCourse}] は全員予約済みです！ 🎉`;
      }

      // Slack通知を送信（グループ一覧シートからSlackチャンネルIDを取得）
      const utils = getUtils();
      const slackSent = utils.sendSlack(messageText, null, targetGroup);
      if (!slackSent) {
        Logger.log(`⚠️ Slack通知送信に失敗しましたが、処理は継続します`);
      } else {
        Logger.log(`✅ Slack通知を送信しました: ${targetGroup} / ${targetCourse}`);
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

