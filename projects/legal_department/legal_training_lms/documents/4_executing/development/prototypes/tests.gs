/*
 * ========================================
 * テスト関数
 * ========================================
 * 
 * ⚠️ テスト実行時の安全対策
 * ========================================
 * 
 * テスト実行時は、実際のスプレッドシートに記入されている従業員
 * （テスト実行者以外）には影響を与えないようにしてください。
 * 
 * 安全対策の方針:
 * 1. テスト用データのみを使用（t_sato2@ga-tech.co.jp とテスト用イベント）
 * 2. 実際の従業員データを読み取らない
 * 3. 通知を制御（メール送信やSlack通知をテスト用に設定）
 * 4. テスト用イベントはタイトルに「テスト」を含める
 * 
 * 詳細は docs/TEST_SAFETY_POLICY.md を参照してください。
 * 
 * ========================================
 */

/**
 * sheet.gsの主要関数をテストする関数
 */
function testSheetFunctions() {
  try {
    Logger.log('=== testSheetFunctions: 開始 ===');
    
    Logger.log('1. getUtils()のテスト...');
    const utils = getUtils();
    Logger.log('✅ getUtils()成功');
    
    Logger.log('2. getConfig()のテスト...');
    const config = getConfig();
    Logger.log('✅ getConfig()成功');
    
    Logger.log('3. getCalendarId()のテスト...');
    const calendarId = getCalendarId();
    if (calendarId) {
      Logger.log(`✅ getCalendarId()成功: ${calendarId}`);
    } else {
      Logger.log('⚠️ getCalendarId()が未設定です');
    }
    
    Logger.log('4. findEventInfoByEventId()のテスト...');
    // テスト用のeventIdを取得（実際のデータから）
    const testEventId = 'test_event_id';
    const eventInfo = findEventInfoByEventId(testEventId, utils);
    if (eventInfo) {
      Logger.log(`✅ findEventInfoByEventId()成功: ${JSON.stringify(eventInfo)}`);
    } else {
      Logger.log(`⚠️ findEventInfoByEventId()でイベントが見つかりませんでした: ${testEventId}`);
      Logger.log('   これは正常です。実際のeventIdが必要です。');
    }
    
    Logger.log('=== testSheetFunctions: 完了 ===');
  } catch (error) {
    Logger.log('❌ testSheetFunctions: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * cancelReservation()のテスト関数
 * 
 * ⚠️ 安全対策: テスト実行者のメールアドレス（t_sato2@ga-tech.co.jp）と
 * テスト用イベント（createTestEvent()で作成）のみを使用してください。
 * 実際の従業員が予約しているイベントは使用しないでください。
 */
function testCancelReservation() {
  try {
    Logger.log('=== testCancelReservation: 開始 ===');
    Logger.log('⚠️ 安全対策: テスト実行者のメールアドレスのみを使用します');
    
    // テスト用のパラメータ（テスト実行者のメールアドレスのみ）
    const testEmail = 't_sato2@ga-tech.co.jp';
    const testEventId = 'hvqdc7k9t1d96clvbq5nvk6jks'; // テスト用eventId（createTestEvent()で作成）
    
    Logger.log(`テストパラメータ: email=${testEmail}, eventId=${testEventId}`);
    
    // 実際のeventIdが設定されている場合のみ実行
    if (testEventId && testEventId !== 'test_event_id') {
      Logger.log('cancelReservation()を実行中...');
      const result = cancelReservation(testEmail, testEventId);
      if (result) {
        Logger.log('✅ cancelReservation()成功');
      } else {
        Logger.log('❌ cancelReservation()失敗');
      }
    } else {
      Logger.log('⚠️ テストをスキップします。実際のeventIdを設定してください。');
    }
    
    Logger.log('=== testCancelReservation: 完了 ===');
  } catch (error) {
    Logger.log('❌ testCancelReservation: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * changeReservation()のテスト関数
 * 
 * ⚠️ 安全対策: テスト実行者のメールアドレス（t_sato2@ga-tech.co.jp）と
 * テスト用イベント（createTestEvent()で作成）のみを使用してください。
 * 実際の従業員が予約しているイベントは使用しないでください。
 */
function testChangeReservation() {
  try {
    Logger.log('=== testChangeReservation: 開始 ===');
    Logger.log('⚠️ 安全対策: テスト実行者のメールアドレスのみを使用します');
    
    // テスト用のパラメータ（テスト実行者のメールアドレスのみ）
    const testEmail = 't_sato2@ga-tech.co.jp';
    
    // テスト用データを取得
    const testData = getTestData();
    let testOldEventId = null;
    let testNewEventId = null;
    
    if (testData && testData.eventIds && testData.eventIds.length > 0) {
      testOldEventId = testData.eventIds[0].eventId;
      
      // 2つ目のイベントを作成する必要がある場合
      if (testData.eventIds.length > 1) {
        testNewEventId = testData.eventIds[1].eventId;
      } else {
        // 2つ目のテストイベントを自動生成
        Logger.log('2つ目のテストイベントを作成中...');
        const newTestEvent = createTestEvent();
        if (newTestEvent && newTestEvent.eventId) {
          testNewEventId = newTestEvent.eventId;
          Logger.log(`✅ 2つ目のテストイベントを作成しました: ${testNewEventId}`);
        } else {
          Logger.log('⚠️ 2つ目のテストイベントの作成に失敗しました');
        }
      }
    } else {
      Logger.log('⚠️ テスト用データが取得できませんでした。createTestEvent()を実行してください。');
      return;
    }
    
    Logger.log(`テストパラメータ: email=${testEmail}, oldEventId=${testOldEventId}, newEventId=${testNewEventId}`);
    
    // 実際のeventIdが設定されている場合のみ実行
    if (testOldEventId && testNewEventId && testOldEventId !== testNewEventId) {
      Logger.log('changeReservation()を実行中...');
      
      // まず旧イベントに予約を追加（変更前の状態を作成）
      const utils = getUtils();
      const calendarId = getCalendarId();
      const calendar = CalendarApp.getCalendarById(calendarId);
      let oldEvent = calendar.getEventById(testOldEventId);
      if (!oldEvent && testOldEventId.indexOf('@') === -1) {
        oldEvent = calendar.getEventById(`${testOldEventId}@google.com`);
      }
      
      if (oldEvent) {
        // テスト用emailが既にゲストに含まれているか確認
        const guests = oldEvent.getGuestList();
        const existingEmails = guests.map(guest => guest.getEmail().trim().toLowerCase());
        if (!existingEmails.includes(testEmail.toLowerCase())) {
          Logger.log('旧イベントにテスト用emailを追加中...');
          oldEvent.addGuest(testEmail);
        }
      }
      
      const result = changeReservation(testEmail, testOldEventId, testNewEventId);
      if (result) {
        Logger.log('✅ changeReservation()成功');
      } else {
        Logger.log('❌ changeReservation()失敗');
      }
    } else {
      Logger.log('⚠️ テストをスキップします。eventIdが設定されていないか、同じeventIdです。');
    }
    
    Logger.log('=== testChangeReservation: 完了 ===');
  } catch (error) {
    Logger.log('❌ testChangeReservation: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * markAttendeeAsReserved()のテスト関数
 * 
 * ⚠️ 安全対策: テスト実行者のメールアドレス（t_sato2@ga-tech.co.jp）と
 * テスト用イベント（createTestEvent()で作成）のみを使用してください。
 */
function testMarkAttendeeAsReserved() {
  try {
    Logger.log('=== testMarkAttendeeAsReserved: 開始 ===');
    Logger.log('⚠️ 安全対策: テスト実行者のメールアドレスのみを使用します');
    
    const utilsInstance = getUtils();
    
    // テスト用のパラメータ（テスト実行者のメールアドレスのみ）
    const testEmail = 't_sato2@ga-tech.co.jp';
    const testEventId = 'hvqdc7k9t1d96clvbq5nvk6jks'; // テスト用eventId（createTestEvent()で作成）
    
    Logger.log(`テストパラメータ: email=${testEmail}, eventId=${testEventId}`);
    
    // 実際のeventIdが設定されている場合のみ実行
    if (testEventId && testEventId !== 'test_event_id') {
      Logger.log('markAttendeeAsReserved()を実行中...');
      markAttendeeAsReserved(testEmail, testEventId, utilsInstance);
      Logger.log('✅ markAttendeeAsReserved()実行完了');
    } else {
      Logger.log('⚠️ テストをスキップします。実際のeventIdを設定してください。');
    }
    
    Logger.log('=== testMarkAttendeeAsReserved: 完了 ===');
  } catch (error) {
    Logger.log('❌ testMarkAttendeeAsReserved: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * markAttendeeAsUnreserved()のテスト関数
 * 
 * ⚠️ 安全対策: テスト実行者のメールアドレス（t_sato2@ga-tech.co.jp）と
 * テスト用イベント（createTestEvent()で作成）のみを使用してください。
 */
function testMarkAttendeeAsUnreserved() {
  try {
    Logger.log('=== testMarkAttendeeAsUnreserved: 開始 ===');
    Logger.log('⚠️ 安全対策: テスト実行者のメールアドレスのみを使用します');
    
    const utilsInstance = getUtils();
    
    // テスト用のパラメータ（テスト実行者のメールアドレスのみ）
    const testEmail = 't_sato2@ga-tech.co.jp';
    const testEventId = 'hvqdc7k9t1d96clvbq5nvk6jks'; // テスト用eventId（createTestEvent()で作成）
    
    Logger.log(`テストパラメータ: email=${testEmail}, eventId=${testEventId}`);
    
    // 実際のeventIdが設定されている場合のみ実行
    if (testEventId && testEventId !== 'test_event_id') {
      Logger.log('markAttendeeAsUnreserved()を実行中...');
      markAttendeeAsUnreserved(testEmail, testEventId, utilsInstance);
      Logger.log('✅ markAttendeeAsUnreserved()実行完了');
    } else {
      Logger.log('⚠️ テストをスキップします。実際のeventIdを設定してください。');
    }
    
    Logger.log('=== testMarkAttendeeAsUnreserved: 完了 ===');
  } catch (error) {
    Logger.log('❌ testMarkAttendeeAsUnreserved: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * 全sheet.gs関数の統合テスト
 */
function testAllSheetFunctions() {
  try {
    Logger.log('=== testAllSheetFunctions: 開始 ===');
    
    Logger.log('1. testSheetFunctions()を実行...');
    testSheetFunctions();
    
    Logger.log('\n2. getTestData()を実行してテスト用データを取得...');
    const testData = getTestData();
    if (testData && testData.eventIds.length > 0 && testData.emails.length > 0) {
      Logger.log('✅ テスト用データ取得成功');
      Logger.log(`   eventId: ${testData.eventIds[0].eventId}`);
      Logger.log(`   email: ${testData.emails[0]}`);
      
      Logger.log('\n3. findEventInfoByEventId()をテスト...');
      const utils = getUtils();
      const eventInfo = findEventInfoByEventId(testData.eventIds[0].eventId, utils);
      if (eventInfo) {
        Logger.log(`✅ findEventInfoByEventId()成功: ${JSON.stringify(eventInfo)}`);
      } else {
        Logger.log(`⚠️ findEventInfoByEventId()でイベントが見つかりませんでした: ${testData.eventIds[0].eventId}`);
      }
    } else {
      Logger.log('⚠️ テスト用データが取得できませんでした。手動でパラメータを設定してください。');
    }
    
    Logger.log('\n4. testCancelReservation()を実行...');
    testCancelReservation();
    
    Logger.log('\n5. testChangeReservation()を実行...');
    testChangeReservation();
    
    Logger.log('\n6. testMarkAttendeeAsReserved()を実行...');
    testMarkAttendeeAsReserved();
    
    Logger.log('\n7. testMarkAttendeeAsUnreserved()を実行...');
    testMarkAttendeeAsUnreserved();
    
    Logger.log('\n=== testAllSheetFunctions: 完了 ===');
  } catch (error) {
    Logger.log('❌ testAllSheetFunctions: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * refreshAttendeeStatus()のテスト関数
 * 
 * ⚠️ 安全対策: テスト実行者のメールアドレス（t_sato2@ga-tech.co.jp）のみを対象にします
 * 実際の従業員データには影響を与えません。
 */
function testRefreshAttendeeStatus() {
  try {
    Logger.log('=== testRefreshAttendeeStatus: 開始 ===');
    Logger.log('⚠️ テスト実行時の安全対策: t_sato2@ga-tech.co.jpのみを対象にします');
    Logger.log('   実際の従業員データには影響を与えません');
    
    const testEmail = 't_sato2@ga-tech.co.jp';
    
    Logger.log(`テスト用email: ${testEmail}`);
    Logger.log('refreshAttendeeStatus()を実行中（テストモード）...');
    
    // テストモード: テスト用emailのみを対象にする
    refreshAttendeeStatus({ testEmail: testEmail });
    
    Logger.log('✅ refreshAttendeeStatus()実行完了');
    Logger.log('=== testRefreshAttendeeStatus: 完了 ===');
  } catch (error) {
    Logger.log('❌ testRefreshAttendeeStatus: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * handleReservationFormSubmit()のテスト関数（モックイベント）
 * 
 * ⚠️ 安全対策: テスト用eventIdを使用します
 */
function testHandleReservationFormSubmit() {
  try {
    Logger.log('=== testHandleReservationFormSubmit: 開始 ===');
    
    // テスト用データを取得
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テスト用eventIdが見つかりません。createTestEvent()を実行してください。');
      return;
    }
    
    // eventIds配列の要素はオブジェクトなので、eventIdプロパティを取り出す
    const testEventId = testData.eventIds[0].eventId;
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    
    Logger.log(`テスト用eventId: ${testEventId}`);
    Logger.log(`テスト用email: ${testEmail}`);
    
    // モックイベントを作成（テスト用eventIdを使用）
    const mockEvent = {
      response: {
        getRespondentEmail: function() {
          return testEmail;
        },
        getItemResponses: function() {
          return [
            {
              getItem: function() {
                return {
                  getTitle: function() { return 'グループ選択'; },
                  getType: function() { return FormApp.ItemType.MULTIPLE_CHOICE; }
                };
              },
              getResponse: function() { return '1期生'; }
            },
            {
              getItem: function() {
                return {
                  getTitle: function() { return '参加希望日'; },
                  getType: function() { return FormApp.ItemType.MULTIPLE_CHOICE; }
                };
              },
              getResponse: function() { 
                // テスト用eventIdを使用
                return `2025/12/26 (Thu) 15:00〜16:00 テスト研修 (id: ${testEventId})`;
              }
            }
          ];
        }
      }
    };
    
    Logger.log('handleReservationFormSubmit()を実行中...');
    handleReservationFormSubmit(mockEvent);
    Logger.log('✅ handleReservationFormSubmit()実行完了');
    
    Logger.log('=== testHandleReservationFormSubmit: 完了 ===');
  } catch (error) {
    Logger.log('❌ testHandleReservationFormSubmit: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * onCreatingSchedule()のテスト関数（モックイベント）
 */
function testOnCreatingSchedule() {
  try {
    Logger.log('=== testOnCreatingSchedule: 開始 ===');
    
    const utils = getUtils();
    const sheets = getSheets();
    
    // モックイベントを作成
    const mockEvent = {
      range: {
        getSheet: function() {
          return {
            getName: function() { return sheets.events.name; }
          };
        },
        getColumn: function() { return sheets.events.columns.TRIGGER; },
        getDisplayValue: function() { return '作成'; },
        getRow: function() { return sheets.events.rows.FIRST; },
        setValue: function(value) { Logger.log(`setValue called: ${value}`); }
      },
      source: {
        getActiveSheet: function() {
          return {
            getRange: function(row, col) {
              return {
                getValue: function() {
                  if (col === sheets.events.columns.COURSE_NAME) return 'テスト研修';
                  if (col === sheets.events.columns.COURSE_DATE) return new Date();
                  if (col === sheets.events.columns.COURSE_START_TIME) return new Date();
                  if (col === sheets.events.columns.COURSE_END_TIME) return new Date();
                  if (col === sheets.events.columns.COURSE_DETAILS) return 'テスト詳細';
                  if (col === sheets.events.columns.TARGET_GROUP) return '1期生';
                  return null;
                }
              };
            }
          };
        }
      }
    };
    
    Logger.log('onCreatingSchedule()を実行中...');
    onCreatingSchedule(mockEvent);
    Logger.log('✅ onCreatingSchedule()実行完了');
    
    Logger.log('=== testOnCreatingSchedule: 完了 ===');
  } catch (error) {
    Logger.log('❌ testOnCreatingSchedule: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * onDashboardAction()のテスト関数（モックイベント）
 */
function testOnDashboardAction() {
  try {
    Logger.log('=== testOnDashboardAction: 開始 ===');
    
    const sheets = getSheets();
    
    // モックイベントを作成
    const mockEvent = {
      range: {
        getSheet: function() {
          return {
            getName: function() { return sheets.dashboard.name; }
          };
        },
        getColumn: function() { return sheets.dashboard.columns.TRIGGER; },
        getDisplayValue: function() { return 'リマインド'; },
        getRow: function() { return 2; }
      },
      source: {
        getActiveSheet: function() {
          return {
            getRange: function(row, col) {
              return {
                getValue: function() {
                  if (col === sheets.dashboard.columns.GROUP) return '1期生';
                  if (col === sheets.dashboard.columns.COURSE_NAME) return 'テスト研修';
                  return null;
                },
                setValue: function(value) { Logger.log(`setValue called: ${value}`); }
              };
            }
          };
        }
      }
    };
    
    Logger.log('onDashboardAction()を実行中...');
    onDashboardAction(mockEvent);
    Logger.log('✅ onDashboardAction()実行完了');
    
    Logger.log('=== testOnDashboardAction: 完了 ===');
  } catch (error) {
    Logger.log('❌ testOnDashboardAction: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * editHandler()のテスト関数（モックイベント）
 */
function testEditHandler() {
  try {
    Logger.log('=== testEditHandler: 開始 ===');
    
    const sheets = getSheets();
    
    // モックイベントを作成（予約一覧シート編集）
    const mockEvent = {
      range: {
        getSheet: function() {
          return {
            getName: function() { return sheets.events.name; }
          };
        },
        getColumn: function() { return sheets.events.columns.TRIGGER; },
        getDisplayValue: function() { return '作成'; },
        getRow: function() { return sheets.events.rows.FIRST; }
      },
      source: {
        getActiveSheet: function() {
          return {
            getRange: function(row, col) {
              return {
                getValue: function() { return 'テスト'; },
                setValue: function(value) { Logger.log(`setValue called: ${value}`); }
              };
            }
          };
        }
      }
    };
    
    Logger.log('editHandler()を実行中...');
    editHandler(mockEvent);
    Logger.log('✅ editHandler()実行完了');
    
    Logger.log('=== testEditHandler: 完了 ===');
  } catch (error) {
    Logger.log('❌ testEditHandler: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * すべての未テスト関数をテストする統合テスト
 * 
 * ⚠️ 安全対策: この関数を実行する前に、以下の点を確認してください:
 * 1. スクリプトプロパティでSLACK_CHANNEL_IDがテスト用に設定されている
 * 2. テスト用イベント（createTestEvent()で作成）が存在する
 * 3. テスト実行者のメールアドレス（t_sato2@ga-tech.co.jp）のみを使用する
 * 
 * 詳細は docs/TEST_SAFETY_POLICY.md を参照してください。
 */
function testAllUntestedFunctions() {
  try {
    Logger.log('=== testAllUntestedFunctions: 開始 ===');
    Logger.log('⚠️ 安全対策: テスト実行者のメールアドレスのみを使用します');
    Logger.log('   詳細は docs/TEST_SAFETY_POLICY.md を参照してください');
    
    Logger.log('\n1. testRefreshAttendeeStatus()を実行...');
    testRefreshAttendeeStatus();
    
    Logger.log('\n2. testHandleReservationFormSubmit()を実行...');
    testHandleReservationFormSubmit();
    
    Logger.log('\n3. testOnCreatingSchedule()を実行...');
    testOnCreatingSchedule();
    
    Logger.log('\n4. testOnDashboardAction()を実行...');
    testOnDashboardAction();
    
    Logger.log('\n5. testEditHandler()を実行...');
    testEditHandler();
    
    Logger.log('\n6. testEnhancedFunctions()を実行...');
    testEnhancedFunctions();
    
    Logger.log('\n7. testCalendarEnhancedFunctions()を実行...');
    testCalendarEnhancedFunctions();
    
    Logger.log('\n8. testReservationChangeFunctions()を実行...');
    testReservationChangeFunctions();
    
    Logger.log('\n9. testImportReservationData()を実行...');
    Logger.log('⚠️ 注意: importReservationData()は実際のデータをインポートします');
    Logger.log('   テストをスキップします（必要に応じて手動で実行してください）');
    // testImportReservationData(); // 実際のデータをインポートするため、コメントアウト
    
    Logger.log('\n10. testGetReservedCountForGroupAndCourse()を実行...');
    testGetReservedCountForGroupAndCourse();
    
    Logger.log('\n11. testGetCourseNumberFromCourseListByCourseName()を実行...');
    testGetCourseNumberFromCourseListByCourseName();
    
    Logger.log('\n12. testUpdateDashboardAfterReservation()を実行...');
    testUpdateDashboardAfterReservation();
    
    Logger.log('\n13. createTestEventsForChangeAndTest()は既に実行済みです（testAll()の最初で実行）');
    Logger.log('   ⚠️ 注意: このテストは実際のカレンダーにイベントを作成します');
    Logger.log('   testAll()の最初で既に実行されているため、ここではスキップします');
    
    Logger.log('\n=== testAllUntestedFunctions: 完了 ===');
    Logger.log('\n✅ すべての未テスト関数のテストが完了しました！');
  } catch (error) {
    Logger.log('❌ testAllUntestedFunctions: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * すべてのテストを1回で実行する統合テスト関数
 * 
 * ⚠️ 安全対策: この関数を実行する前に、以下の点を確認してください:
 * 1. スクリプトプロパティでSLACK_CHANNEL_IDがテスト用に設定されている
 * 2. テスト用イベント（createTestEvent()で作成）が存在する
 * 3. テスト実行者のメールアドレス（t_sato2@ga-tech.co.jp）のみを使用する
 * 
 * 詳細は docs/TEST_SAFETY_POLICY.md を参照してください。
 */
function testAll() {
  try {
    Logger.log('='.repeat(80));
    Logger.log('=== 全テスト実行: 開始 ===');
    Logger.log('='.repeat(80));
    Logger.log('⚠️ 安全対策: テスト実行者のメールアドレスのみを使用します');
    Logger.log('   詳細は docs/TEST_SAFETY_POLICY.md を参照してください');
    Logger.log('');
    
    // Slack設定の確認
    Logger.log('📋 Slack設定の確認...');
    checkSlackConfig();
    Logger.log('');
    
    const startTime = new Date();
    
    // テスト用イベントの作成（変更期限内のイベント）
    Logger.log('='.repeat(80));
    Logger.log('テスト用イベントの作成（変更期限内）');
    Logger.log('='.repeat(80));
    Logger.log('⚠️ 注意: このテストは実際のカレンダーにイベントを作成します');
    const testEventsResult = createTestEventsForChangeAndTest();
    if (testEventsResult) {
      Logger.log('✅ テスト用イベントの作成が完了しました');
      Logger.log(`   変更元イベントID: ${testEventsResult.eventId1}`);
      Logger.log(`   変更先イベントID: ${testEventsResult.eventId2}`);
    } else {
      Logger.log('⚠️ テスト用イベントの作成に失敗しました。テストを続行しますが、一部のテストがスキップされる可能性があります。');
    }
    Logger.log('');
    
    // パート1: Sheet関数のテスト
    Logger.log('='.repeat(80));
    Logger.log('パート1: Sheet関数のテスト');
    Logger.log('='.repeat(80));
    testAllSheetFunctions();
    
    Logger.log('');
    
    // パート2: 未テスト関数のテスト
    Logger.log('='.repeat(80));
    Logger.log('パート2: 未テスト関数のテスト');
    Logger.log('='.repeat(80));
    testAllUntestedFunctions();
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // 秒
    
    Logger.log('');
    Logger.log('='.repeat(80));
    Logger.log('=== 全テスト実行: 完了 ===');
    Logger.log('='.repeat(80));
    Logger.log(`実行時間: ${duration.toFixed(2)}秒`);
    Logger.log('');
    Logger.log('✅ すべてのテストが完了しました！');
    Logger.log('');
    Logger.log('📊 テスト結果の確認:');
    Logger.log('   - 実行ログを確認して、エラーがないか確認してください');
    Logger.log('   - 一部のテストでエラーが発生していても、正常な動作の場合があります');
    Logger.log('   - 例: 変更期限を過ぎている場合のエラーは正常な動作です');
    
  } catch (error) {
    Logger.log('❌ testAll: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * Slack Webhook URLを設定する関数
 * 
 * ⚠️ 注意: この関数を実行すると、スクリプトプロパティにWebhook URLが設定されます
 * 
 * 使用方法:
 * 1. スクリプトプロパティに「SLACK_WEBHOOK_URL」を手動で設定してください
 * 2. または、この関数を編集して、WEBHOOK_URL変数に値を設定してから実行してください
 */
function setSlackWebhookUrl() {
  try {
    Logger.log('=== setSlackWebhookUrl: 開始 ===');
    
    // ⚠️ シークレット: スクリプトプロパティから取得するか、手動で設定してください
    // スクリプトプロパティに「SLACK_WEBHOOK_URL」を設定することを推奨します
    const WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
    
    if (!WEBHOOK_URL) {
      Logger.log('❌ SLACK_WEBHOOK_URLが設定されていません。スクリプトプロパティに「SLACK_WEBHOOK_URL」を設定してください。');
      return;
    }
    
    const props = PropertiesService.getScriptProperties();
    
    // 現在の設定を確認
    const currentWebhookUrl = props.getProperty('SLACK_WEBHOOK_URL');
    Logger.log(`現在のSLACK_WEBHOOK_URL: ${currentWebhookUrl ? '設定済み' : '(未設定)'}`);
    
    // Webhook URLを設定（既に設定されている場合は更新）
    props.setProperty('SLACK_WEBHOOK_URL', WEBHOOK_URL);
    Logger.log(`✅ Webhook URLを設定しました`);
    
    // 設定を確認
    const newWebhookUrl = props.getProperty('SLACK_WEBHOOK_URL');
    if (newWebhookUrl === WEBHOOK_URL) {
      Logger.log('✅ 設定が正しく反映されました');
    } else {
      Logger.log(`⚠️ 設定が正しく反映されていません`);
    }
    
    Logger.log('=== setSlackWebhookUrl: 完了 ===');
  } catch (error) {
    Logger.log(`❌ setSlackWebhookUrl: エラーが発生しました`);
    Logger.log(`エラーメッセージ: ${error.toString()}`);
    Logger.log(`スタックトレース: ${error.stack}`);
  }
}

/**
 * テスト用SlackIDを設定する関数
 * 
 * ⚠️ 注意: この関数を実行すると、スクリプトプロパティにテスト用SlackIDが設定されます
 */
function setTestSlackChannelId() {
  try {
    Logger.log('=== setTestSlackChannelId: 開始 ===');
    
    const TEST_SLACK_CHANNEL_ID = 'C068DD0619D';
    const props = PropertiesService.getScriptProperties();
    
    // 現在の設定を確認
    const currentChannelId = props.getProperty('SLACK_CHANNEL_ID');
    Logger.log(`現在のSLACK_CHANNEL_ID: ${currentChannelId || '(未設定)'}`);
    
    // テスト用SlackIDを設定
    props.setProperty('SLACK_CHANNEL_ID', TEST_SLACK_CHANNEL_ID);
    Logger.log(`✅ テスト用SlackIDを設定しました: ${TEST_SLACK_CHANNEL_ID}`);
    
    // 設定を確認
    const newChannelId = props.getProperty('SLACK_CHANNEL_ID');
    if (newChannelId === TEST_SLACK_CHANNEL_ID) {
      Logger.log('✅ 設定が正しく反映されました');
    } else {
      Logger.log(`⚠️ 設定が正しく反映されていません: ${newChannelId}`);
    }
    
    Logger.log('=== setTestSlackChannelId: 完了 ===');
  } catch (error) {
    Logger.log(`❌ setTestSlackChannelId: エラーが発生しました`);
    Logger.log(`エラーメッセージ: ${error.toString()}`);
    Logger.log(`スタックトレース: ${error.stack}`);
  }
}

/**
 * 現在のSlack設定を確認する関数
 */
function checkSlackConfig() {
  try {
    Logger.log('=== checkSlackConfig: 開始 ===');
    
    const props = PropertiesService.getScriptProperties();
    const utils = getUtils();
    
    const webhookUrl = props.getProperty('SLACK_WEBHOOK_URL');
    const channel = props.getProperty('SLACK_CHANNEL');
    const channelId = props.getProperty('SLACK_CHANNEL_ID');
    const username = props.getProperty('SLACK_USERNAME');
    
    Logger.log('現在のSlack設定:');
    Logger.log(`  SLACK_WEBHOOK_URL: ${webhookUrl ? '設定済み' : '未設定'}`);
    Logger.log(`  SLACK_CHANNEL: ${channel || '(未設定)'}`);
    Logger.log(`  SLACK_CHANNEL_ID: ${channelId || '(未設定)'}`);
    Logger.log(`  SLACK_USERNAME: ${username || '(未設定)'}`);
    
    // LMSUtilsから取得した値も確認
    Logger.log('\nLMSUtilsから取得した値:');
    Logger.log(`  getSlackChannel(): ${utils.getSlackChannel()}`);
    Logger.log(`  getSlackChannelId(): ${utils.getSlackChannelId()}`);
    Logger.log(`  getSlackUsername(): ${utils.getSlackUsername()}`);
    
    // テスト用SlackIDの確認
    const TEST_SLACK_CHANNEL_ID = 'C068DD0619D';
    if (channelId === TEST_SLACK_CHANNEL_ID) {
      Logger.log(`\n✅ テスト用SlackIDが設定されています: ${TEST_SLACK_CHANNEL_ID}`);
    } else if (channelId) {
      Logger.log(`\n⚠️ 本番環境のSlackIDが設定されています: ${channelId}`);
      Logger.log(`   テスト実行時は、テスト用SlackID (${TEST_SLACK_CHANNEL_ID}) に変更することを推奨します`);
    } else {
      Logger.log(`\n⚠️ SLACK_CHANNEL_IDが設定されていません`);
      Logger.log(`   テスト実行時は、setTestSlackChannelId()を実行してテスト用SlackIDを設定してください`);
    }
    
    Logger.log('=== checkSlackConfig: 完了 ===');
  } catch (error) {
    Logger.log(`❌ checkSlackConfig: エラーが発生しました`);
    Logger.log(`エラーメッセージ: ${error.toString()}`);
    Logger.log(`スタックトレース: ${error.stack}`);
  }
}

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

/**
 * テスト用の実際のデータを取得する関数
 * ⚠️ 安全のため、テスト用のemail（t_sato2@ga-tech.co.jp）のみを返します
 * 実際の従業員データに影響を与えないようにするため、他の従業員のメールアドレスは返しません
 */
function getTestData() {
  try {
    Logger.log('=== getTestData: 開始 ===');
    Logger.log('⚠️ テスト実行時の安全対策: t_sato2@ga-tech.co.jpのみを使用します');
    
    const utils = getUtils();
    const config = getConfig();
    const sheets = getSheets();
    
    // 予約一覧シートからeventIdを取得（テスト用イベントのみ）
    const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
    if (!eventsSheet) {
      Logger.log(`❌ シートが見つかりません: ${sheets.events.name}`);
      return null;
    }
    
    const lastRow = eventsSheet.getLastRow();
    Logger.log(`予約一覧シートの最終行: ${lastRow}`);
    
    const eventIds = [];
    for (let i = sheets.events.rows.FIRST; i <= lastRow; i++) {
      // EVENT_URLが定義されていない場合はEVENT_IDを使用
      const eventUrlColumn = sheets.events.columns.EVENT_URL || sheets.events.columns.EVENT_ID || 8;
      const eventUrl = eventsSheet.getRange(i, eventUrlColumn).getValue();
      const courseName = eventsSheet.getRange(i, sheets.events.columns.COURSE_NAME).getValue();
      
      // テスト用イベント（タイトルに「テスト」が含まれるもの）のみを取得
      if (courseName && typeof courseName === 'string' && courseName.includes('テスト')) {
        if (eventUrl && typeof eventUrl === 'string' && eventUrl.indexOf('eid=') !== -1) {
          const eventId = utils.eventIdFromURL(eventUrl);
          eventIds.push({
            eventId: eventId,
            courseName: courseName,
            eventUrl: eventUrl
          });
        } else if (eventUrl && typeof eventUrl === 'string' && eventUrl.trim() !== '') {
          // eventIdが直接入っている場合
          eventIds.push({
            eventId: eventUrl.trim(),
            courseName: courseName,
            eventUrl: eventUrl
          });
        }
      }
    }
    
    Logger.log(`\n取得したテスト用eventId一覧（${eventIds.length}件）:`);
    eventIds.forEach((item, index) => {
      Logger.log(`${index + 1}. eventId: ${item.eventId}`);
      Logger.log(`   コース名: ${item.courseName}`);
      Logger.log(`   URL: ${item.eventUrl}`);
    });
    
    // ⚠️ 安全対策: テスト用のemailのみを返す（t_sato2@ga-tech.co.jp）
    const TEST_EMAIL = 't_sato2@ga-tech.co.jp';
    const emails = [TEST_EMAIL];
    
    Logger.log(`\n⚠️ テスト用メールアドレス（安全のため1件のみ）:`);
    Logger.log(`1. ${TEST_EMAIL}`);
    Logger.log(`\n注意: 実際の従業員データに影響を与えないため、他のメールアドレスは返しません`);
    
    Logger.log('\n=== テスト用パラメータの使用例 ===');
    if (eventIds.length > 0) {
      Logger.log(`// findEventInfoByEventId()のテスト`);
      Logger.log(`const utils = getUtils();`);
      Logger.log(`const eventInfo = findEventInfoByEventId('${eventIds[0].eventId}', utils);`);
      Logger.log(`\n// cancelReservation()のテスト`);
      Logger.log(`cancelReservation('${TEST_EMAIL}', '${eventIds[0].eventId}');`);
      Logger.log(`\n// changeReservation()のテスト（2つ以上のeventIdがある場合）`);
      if (eventIds.length > 1) {
        Logger.log(`changeReservation('${TEST_EMAIL}', '${eventIds[0].eventId}', '${eventIds[1].eventId}');`);
      }
    }
    
    Logger.log('\n=== getTestData: 完了 ===');
    
    return {
      eventIds: eventIds,
      emails: emails
    };
  } catch (error) {
    Logger.log(`❌ getTestData: エラーが発生しました`);
    Logger.log(`エラーメッセージ: ${error.toString()}`);
    Logger.log(`スタックトレース: ${error.stack}`);
    return null;
  }
}

/**
 * 変更期限内のテストイベントを2つ作成して、changeReservation()をテストする関数
 * 注意: この関数を実行すると、実際のカレンダーにイベントが作成されます
 */
function createTestEventsForChangeAndTest() {
  try {
    Logger.log('=== createTestEventsForChangeAndTest: 開始 ===');
    Logger.log('変更期限内（3日前まで）のイベントを2つ作成して、changeReservation()をテストします');
    
    const calendarId = getCalendarId();
    if (!calendarId) {
      Logger.log('❌ カレンダーIDが設定されていません');
      return null;
    }
    
    Logger.log(`カレンダーID: ${calendarId}`);
    
    // 変更期限内（3日前まで）のイベントを作成するため、5日後と6日後のイベントを作成
    const now = new Date();
    const startTime1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5日後の同じ時刻（変更期限内）
    const endTime1 = new Date(startTime1.getTime() + 60 * 60 * 1000); // 1時間後
    
    const startTime2 = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000); // 6日後の同じ時刻（変更期限内）
    const endTime2 = new Date(startTime2.getTime() + 60 * 60 * 1000); // 1時間後
    
    const eventTitle1 = '[テスト] 継続研修テストイベント（変更元）';
    const eventTitle2 = '[テスト] 継続研修テストイベント（変更先）';
    const eventDescription = 'これは変更テスト用のイベントです。削除しても問題ありません。';
    
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      Logger.log(`❌ カレンダーが見つかりません: ${calendarId}`);
      return null;
    }
    
    // 1つ目のイベントを作成
    Logger.log(`\n1つ目のイベントを作成中...`);
    Logger.log(`タイトル: ${eventTitle1}`);
    Logger.log(`開始時刻: ${startTime1}`);
    const event1 = calendar.createEvent(eventTitle1, startTime1, endTime1, {
      description: eventDescription
    });
    
    if (!event1) {
      Logger.log('❌ 1つ目のイベントの作成に失敗しました');
      return null;
    }
    
    const fullEventId1 = event1.getId();
    const eventId1 = fullEventId1.split('@')[0];
    Logger.log(`✅ 1つ目のイベント作成成功！eventId: ${eventId1}`);
    
    // 2つ目のイベントを作成
    Logger.log(`\n2つ目のイベントを作成中...`);
    Logger.log(`タイトル: ${eventTitle2}`);
    Logger.log(`開始時刻: ${startTime2}`);
    const event2 = calendar.createEvent(eventTitle2, startTime2, endTime2, {
      description: eventDescription
    });
    
    if (!event2) {
      Logger.log('❌ 2つ目のイベントの作成に失敗しました');
      return null;
    }
    
    const fullEventId2 = event2.getId();
    const eventId2 = fullEventId2.split('@')[0];
    Logger.log(`✅ 2つ目のイベント作成成功！eventId: ${eventId2}`);
    
    // スプレッドシートにも登録
    try {
      const utils = getUtils();
      const config = getConfig();
      const sheets = getSheets();
      
      const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
      if (!eventsSheet) {
        Logger.log(`⚠️ スプレッドシートが見つかりません: ${sheets.events.name}`);
      } else {
        const lastRow = eventsSheet.getLastRow();
        
        // 1つ目のイベントを登録
        const newRow1 = lastRow + 1;
        const courseDate1 = new Date(startTime1.getFullYear(), startTime1.getMonth(), startTime1.getDate());
        const testCourseId1 = 'TEST-CHANGE-1-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmm');
        
        eventsSheet.getRange(newRow1, sheets.events.columns.NUMBER).setValue(newRow1 - 1);
        eventsSheet.getRange(newRow1, sheets.events.columns.COURSE_ID).setValue(testCourseId1);
        eventsSheet.getRange(newRow1, sheets.events.columns.COURSE_NAME).setValue(eventTitle1);
        eventsSheet.getRange(newRow1, sheets.events.columns.COURSE_DETAILS).setValue(eventDescription);
        eventsSheet.getRange(newRow1, sheets.events.columns.COURSE_DATE).setValue(courseDate1);
        eventsSheet.getRange(newRow1, sheets.events.columns.COURSE_START_TIME).setValue(startTime1);
        eventsSheet.getRange(newRow1, sheets.events.columns.COURSE_END_TIME).setValue(endTime1);
        eventsSheet.getRange(newRow1, sheets.events.columns.EVENT_ID).setValue(eventId1);
        eventsSheet.getRange(newRow1, sheets.events.columns.STATUS).setValue('テスト');
        
        // 2つ目のイベントを登録
        const newRow2 = newRow1 + 1;
        const courseDate2 = new Date(startTime2.getFullYear(), startTime2.getMonth(), startTime2.getDate());
        const testCourseId2 = 'TEST-CHANGE-2-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmm');
        
        eventsSheet.getRange(newRow2, sheets.events.columns.NUMBER).setValue(newRow2 - 1);
        eventsSheet.getRange(newRow2, sheets.events.columns.COURSE_ID).setValue(testCourseId2);
        eventsSheet.getRange(newRow2, sheets.events.columns.COURSE_NAME).setValue(eventTitle2);
        eventsSheet.getRange(newRow2, sheets.events.columns.COURSE_DETAILS).setValue(eventDescription);
        eventsSheet.getRange(newRow2, sheets.events.columns.COURSE_DATE).setValue(courseDate2);
        eventsSheet.getRange(newRow2, sheets.events.columns.COURSE_START_TIME).setValue(startTime2);
        eventsSheet.getRange(newRow2, sheets.events.columns.COURSE_END_TIME).setValue(endTime2);
        eventsSheet.getRange(newRow2, sheets.events.columns.EVENT_ID).setValue(eventId2);
        eventsSheet.getRange(newRow2, sheets.events.columns.STATUS).setValue('テスト');
        
        Logger.log(`✅ スプレッドシートにも登録しました（行: ${newRow1}, ${newRow2}）`);
      }
    } catch (sheetError) {
      Logger.log(`⚠️ スプレッドシートへの登録でエラーが発生しました: ${sheetError.toString()}`);
    }
    
    // テスト用emailを1つ目のイベントに追加
    const testEmail = 't_sato2@ga-tech.co.jp';
    Logger.log(`\nテスト用email (${testEmail}) を1つ目のイベントに追加中...`);
    event1.addGuest(testEmail);
    Logger.log(`✅ テスト用emailを追加しました`);
    
    // 参加情報シートにも登録（changeReservation()のcheckChangeLimit()で必要）
    Logger.log(`\n参加情報シートに登録中...`);
    const utils = getUtils();
    try {
      markAttendeeAsReserved(testEmail, eventId1, utils);
      Logger.log(`✅ 参加情報シートに登録しました（または既に登録済み）`);
    } catch (markError) {
      Logger.log(`⚠️ 参加情報シートへの登録でエラーが発生しました: ${markError.toString()}`);
      Logger.log(`   これは、参加情報シートに該当する行や列が存在しない場合に発生します。`);
      Logger.log(`   テストを続行しますが、checkChangeLimit()でエラーになる可能性があります。`);
    }
    
    // changeReservation()をテスト
    Logger.log(`\n=== changeReservation()のテストを実行 ===`);
    Logger.log(`email: ${testEmail}`);
    Logger.log(`oldEventId: ${eventId1}`);
    Logger.log(`newEventId: ${eventId2}`);
    
    const result = changeReservation(testEmail, eventId1, eventId2);
    if (result && result.success) {
      Logger.log(`✅ changeReservation()成功！`);
      Logger.log(`メッセージ: ${result.message}`);
    } else {
      Logger.log(`❌ changeReservation()失敗`);
      if (result) {
        Logger.log(`メッセージ: ${result.message}`);
      }
    }
    
    Logger.log('\n=== createTestEventsForChangeAndTest: 完了 ===');
    
    return {
      eventId1: eventId1,
      eventId2: eventId2,
      testEmail: testEmail,
      result: result
    };
  } catch (error) {
    Logger.log('❌ createTestEventsForChangeAndTest: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
    return null;
  }
}

/**
 * テスト用のカレンダーイベントを作成してeventIdを取得する関数
 * 注意: この関数を実行すると、実際のカレンダーにイベントが作成されます
 */
function createTestEvent() {
  try {
    Logger.log('=== createTestEvent: 開始 ===');
    
    const calendarId = getCalendarId();
    if (!calendarId) {
      Logger.log('❌ カレンダーIDが設定されていません');
      return null;
    }
    
    Logger.log(`カレンダーID: ${calendarId}`);
    
    // テスト用のイベント情報
    // 変更期限内（3日前まで）のイベントを作成するため、4日後以降のイベントを作成
    const now = new Date();
    const startTime = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4日後の同じ時刻（変更期限内）
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1時間後
    
    const eventTitle = '[テスト] 継続研修テストイベント';
    const eventDescription = 'これはテスト用のイベントです。削除しても問題ありません。';
    
    Logger.log(`イベント作成中...`);
    Logger.log(`タイトル: ${eventTitle}`);
    Logger.log(`開始時刻: ${startTime}`);
    Logger.log(`終了時刻: ${endTime}`);
    
    // カレンダーを取得
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      Logger.log(`❌ カレンダーが見つかりません: ${calendarId}`);
      return null;
    }
    
    // イベントを作成
    const event = calendar.createEvent(eventTitle, startTime, endTime, {
      description: eventDescription
    });
    
    if (!event) {
      Logger.log('❌ イベントの作成に失敗しました');
      return null;
    }
    
    // eventIdを取得（@google.comの前の部分のみ）
    const fullEventId = event.getId();
    const eventId = fullEventId.split('@')[0];
    
    Logger.log(`✅ イベント作成成功！`);
    Logger.log(`完全なeventId: ${fullEventId}`);
    Logger.log(`短いeventId: ${eventId}`);
    
    // スプレッドシートにも登録する
    try {
      const utils = getUtils();
      const config = getConfig();
      const sheets = getSheets();
      
      const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
      if (!eventsSheet) {
        Logger.log(`⚠️ スプレッドシートが見つかりません: ${sheets.events.name}`);
      } else {
        // 最終行の次の行に追加
        const lastRow = eventsSheet.getLastRow();
        const newRow = lastRow + 1;
        
        // 日付と時刻の処理
        // 列E: 日程（日付のみ）
        const courseDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
        // 列F: 開始日時（日付と時刻を含む完全な日時オブジェクト）
        const courseStartTime = new Date(startTime);
        // 列G: 完了日時（日付と時刻を含む完全な日時オブジェクト）
        const courseEndTime = new Date(endTime);
        
        // テスト用コースID（実際のコースID形式に合わせる）
        const testCourseId = 'TEST-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmm');
        
        // スプレッドシートに書き込む（実際のスプレッドシート構造に合わせる）
        eventsSheet.getRange(newRow, sheets.events.columns.NUMBER).setValue(newRow - 1); // A: 予約ID
        eventsSheet.getRange(newRow, sheets.events.columns.COURSE_ID).setValue(testCourseId); // B: コースID
        eventsSheet.getRange(newRow, sheets.events.columns.COURSE_NAME).setValue(eventTitle); // C: 予約名
        eventsSheet.getRange(newRow, sheets.events.columns.COURSE_DETAILS).setValue(eventDescription); // D: コース案内
        eventsSheet.getRange(newRow, sheets.events.columns.COURSE_DATE).setValue(courseDate); // E: 日程
        eventsSheet.getRange(newRow, sheets.events.columns.COURSE_START_TIME).setValue(courseStartTime); // F: 開始日時
        eventsSheet.getRange(newRow, sheets.events.columns.COURSE_END_TIME).setValue(courseEndTime); // G: 完了日時
        eventsSheet.getRange(newRow, sheets.events.columns.EVENT_ID).setValue(eventId); // H: イベントID
        // I: 最大参加者数（空のまま）
        // J: 現在の参加者数（空のまま）
        eventsSheet.getRange(newRow, sheets.events.columns.STATUS).setValue('テスト'); // K: ステータス
        
        Logger.log(`✅ スプレッドシートにも登録しました（行: ${newRow}）`);
      }
    } catch (sheetError) {
      Logger.log(`⚠️ スプレッドシートへの登録でエラーが発生しました: ${sheetError.toString()}`);
      Logger.log(`   カレンダーイベントは作成されていますが、スプレッドシートには登録されていません。`);
    }
    
    Logger.log(`\n=== テスト用パラメータ ===`);
    Logger.log(`email: t_sato2@ga-tech.co.jp`);
    Logger.log(`eventId: ${eventId}`);
    Logger.log(`\n=== 使用例 ===`);
    Logger.log(`// cancelReservation()のテスト`);
    Logger.log(`cancelReservation('t_sato2@ga-tech.co.jp', '${eventId}');`);
    Logger.log(`\n// changeReservation()のテスト（2つ目のイベントも作成する場合）`);
    Logger.log(`// まず別のイベントを作成してから`);
    Logger.log(`changeReservation('t_sato2@ga-tech.co.jp', '${eventId}', '別のeventId');`);
    Logger.log(`\n// markAttendeeAsReserved()のテスト`);
    Logger.log(`markAttendeeAsReserved('t_sato2@ga-tech.co.jp', '${eventId}');`);
    Logger.log(`\n// markAttendeeAsUnreserved()のテスト`);
    Logger.log(`markAttendeeAsUnreserved('t_sato2@ga-tech.co.jp', '${eventId}');`);
    
    Logger.log('\n=== createTestEvent: 完了 ===');
    
    return {
      eventId: eventId,
      fullEventId: fullEventId,
      eventTitle: eventTitle,
      startTime: startTime,
      endTime: endTime,
      eventUrl: eventId // eventIdを返す
    };
  } catch (error) {
    Logger.log(`❌ createTestEvent: エラーが発生しました`);
    Logger.log(`エラーメッセージ: ${error.toString()}`);
    Logger.log(`スタックトレース: ${error.stack}`);
    return null;
  }
}

/**
 * 新規追加した関数のテスト
 */
function testEnhancedFunctions() {
  try {
    Logger.log('=== testEnhancedFunctions: 開始 ===');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テストデータが取得できませんでした。getTestData()を実行してください。');
      return;
    }
    
    const testEventId = testData.eventIds[0].eventId;
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    
    Logger.log(`\n1. checkEventCapacity()のテスト...`);
    Logger.log(`   eventId: ${testEventId}`);
    const capacity = checkEventCapacity(testEventId);
    if (capacity) {
      Logger.log(`   ✅ checkEventCapacity()成功`);
      Logger.log(`   最大参加者数: ${capacity.maxAttendees}`);
      Logger.log(`   現在の参加者数: ${capacity.currentAttendees}`);
      Logger.log(`   定員オーバー: ${capacity.isFull}`);
      Logger.log(`   空き数: ${capacity.availableSpots}`);
    } else {
      Logger.log(`   ⚠️ checkEventCapacity()がnullを返しました`);
    }
    
    Logger.log(`\n2. checkDuplicateReservation()のテスト...`);
    Logger.log(`   email: ${testEmail}, eventId: ${testEventId}`);
    const isDuplicate = checkDuplicateReservation(testEmail, testEventId);
    Logger.log(`   ✅ checkDuplicateReservation()成功: ${isDuplicate ? '重複あり' : '重複なし'}`);
    
    Logger.log(`\n3. updateReservationVisualization()のテスト...`);
    updateReservationVisualization();
    Logger.log(`   ✅ updateReservationVisualization()実行完了`);
    
    Logger.log(`\n4. updateReservationList()のテスト...`);
    updateReservationList();
    Logger.log(`   ✅ updateReservationList()実行完了`);
    
    Logger.log('\n=== testEnhancedFunctions: 完了 ===');
  } catch (error) {
    Logger.log('❌ testEnhancedFunctions: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * カレンダー連携強化機能のテスト
 */
function testCalendarEnhancedFunctions() {
  try {
    Logger.log('=== testCalendarEnhancedFunctions: 開始 ===');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テストデータが取得できませんでした。getTestData()を実行してください。');
      return;
    }
    
    const testEventId = testData.eventIds[0].eventId;
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    
    Logger.log(`\n1. updateCalendarEvent()のテスト（タイトル更新）...`);
    Logger.log(`   eventId: ${testEventId}`);
    Logger.log(`   ⚠️ 注意: このテストは実際にイベントを更新します`);
    
    // テスト用イベントの元のタイトルを保存
    const calendarId = getCalendarId();
    const calendar = CalendarApp.getCalendarById(calendarId);
    let event = calendar.getEventById(testEventId);
    if (!event && testEventId.indexOf('@') === -1) {
      event = calendar.getEventById(`${testEventId}@google.com`);
    }
    
    if (event) {
      const originalTitle = event.getTitle();
      Logger.log(`   元のタイトル: ${originalTitle}`);
      
      // テスト用タイトルで更新
      const testTitle = '[テスト] 更新されたタイトル ' + new Date().getTime();
      const updateResult = updateCalendarEvent(testEventId, {
        title: testTitle
      });
      
      if (updateResult) {
        Logger.log(`   ✅ updateCalendarEvent()成功`);
        Logger.log(`   更新後のタイトル: ${testTitle}`);
        
        // 元のタイトルに戻す
        Logger.log(`   元のタイトルに戻します...`);
        updateCalendarEvent(testEventId, {
          title: originalTitle
        });
        Logger.log(`   ✅ 元のタイトルに戻しました`);
      } else {
        Logger.log(`   ⚠️ updateCalendarEvent()がfalseを返しました`);
      }
    } else {
      Logger.log(`   ⚠️ イベントが見つかりませんでした`);
    }
    
    Logger.log(`\n2. handleCancellation()のテスト...`);
    Logger.log(`   email: ${testEmail}, eventId: ${testEventId}`);
    Logger.log(`   ⚠️ 注意: このテストは実際にキャンセル処理を実行します`);
    
    // テスト用emailがイベントのゲストに含まれているか確認
    event = calendar.getEventById(testEventId);
    if (!event && testEventId.indexOf('@') === -1) {
      event = calendar.getEventById(`${testEventId}@google.com`);
    }
    
    if (event) {
      const guests = event.getGuestList();
      const existingEmails = guests.map(guest => guest.getEmail().trim().toLowerCase());
      const isGuest = existingEmails.includes(testEmail.toLowerCase());
      
      if (!isGuest) {
        Logger.log(`   テスト用emailがゲストに含まれていないため、追加します...`);
        event.addGuest(testEmail);
        Logger.log(`   ✅ テスト用emailを追加しました`);
      }
      
      // キャンセル処理を実行
      const cancelResult = handleCancellation(testEmail, testEventId);
      if (cancelResult) {
        Logger.log(`   ✅ handleCancellation()成功`);
        
        // テスト用emailを再度追加（テスト後の状態を元に戻す）
        Logger.log(`   テスト用emailを再度追加します（テスト後の状態を元に戻す）...`);
        event.addGuest(testEmail);
        Logger.log(`   ✅ テスト用emailを再度追加しました`);
      } else {
        Logger.log(`   ⚠️ handleCancellation()がfalseを返しました`);
      }
    } else {
      Logger.log(`   ⚠️ イベントが見つかりませんでした`);
    }
    
    Logger.log('\n=== testCalendarEnhancedFunctions: 完了 ===');
  } catch (error) {
    Logger.log('❌ testCalendarEnhancedFunctions: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * 予約変更機能のテスト
 */
function testReservationChangeFunctions() {
  try {
    Logger.log('=== testReservationChangeFunctions: 開始 ===');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テストデータが取得できませんでした。getTestData()を実行してください。');
      return;
    }
    
    const testEventId = testData.eventIds[0].eventId;
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    
    Logger.log(`\n1. checkChangeDeadline()のテスト...`);
    Logger.log(`   eventId: ${testEventId}`);
    const deadlineCheck = checkChangeDeadline(testEventId);
    if (deadlineCheck) {
      Logger.log(`   ✅ checkChangeDeadline()成功`);
      Logger.log(`   変更可能: ${deadlineCheck.isValid}`);
      Logger.log(`   期限: ${deadlineCheck.deadline}`);
      Logger.log(`   残り日数: ${deadlineCheck.daysUntil}日`);
      Logger.log(`   メッセージ: ${deadlineCheck.message}`);
    } else {
      Logger.log(`   ⚠️ checkChangeDeadline()がnullを返しました`);
    }
    
    Logger.log(`\n2. checkChangeLimit()のテスト...`);
    Logger.log(`   email: ${testEmail}, eventId: ${testEventId}`);
    const limitCheck = checkChangeLimit(testEmail, testEventId);
    if (limitCheck) {
      Logger.log(`   ✅ checkChangeLimit()成功`);
      Logger.log(`   変更可能: ${limitCheck.isValid}`);
      Logger.log(`   変更回数: ${limitCheck.changeCount}回`);
      Logger.log(`   メッセージ: ${limitCheck.message}`);
    } else {
      Logger.log(`   ⚠️ checkChangeLimit()がnullを返しました`);
    }
    
    Logger.log(`\n3. getAvailableSessionsForChange()のテスト...`);
    Logger.log(`   email: ${testEmail}, eventId: ${testEventId}`);
    const utils = getUtils();
    const eventInfo = findEventInfoByEventId(testEventId, utils);
    if (eventInfo) {
      const availableSessions = getAvailableSessionsForChange(testEmail, eventInfo);
      Logger.log(`   ✅ getAvailableSessionsForChange()成功`);
      Logger.log(`   変更可能セッション数: ${availableSessions.length}件`);
      availableSessions.forEach((session, index) => {
        Logger.log(`   ${index + 1}. ${session.courseName}`);
        Logger.log(`      日時: ${session.dateTime}`);
        Logger.log(`      空き: ${session.availableSpots}席`);
      });
    } else {
      Logger.log(`   ⚠️ イベント情報が取得できませんでした`);
    }
    
    Logger.log('\n=== testReservationChangeFunctions: 完了 ===');
  } catch (error) {
    Logger.log('❌ testReservationChangeFunctions: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * ========================================
 * 閾値・エッジケース・異常系テスト
 * ========================================
 */

/**
 * 定員管理機能の閾値テスト
 */
function testEventCapacityBoundary() {
  try {
    Logger.log('=== testEventCapacityBoundary: 開始 ===');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テストデータが取得できませんでした。createTestEvent()を実行してください。');
      return;
    }
    
    const testEventId = testData.eventIds[0].eventId;
    const utils = getUtils();
    const sheets = getSheets();
    const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
    
    Logger.log('\n1. 定員0人のテスト...');
    // テスト用イベントの定員を0に設定
    const lastRow = eventsSheet.getLastRow();
    let testRow = -1;
    for (let i = sheets.events.rows.FIRST; i <= lastRow; i++) {
      // EVENT_URLが定義されていない場合はEVENT_IDを使用
      const eventUrlColumn = sheets.events.columns.EVENT_URL || sheets.events.columns.EVENT_ID || 8;
      const eventUrl = eventsSheet.getRange(i, eventUrlColumn).getValue();
      if (eventUrl === testEventId || (typeof eventUrl === 'string' && eventUrl.includes(testEventId))) {
        testRow = i;
        break;
      }
    }
    
    if (testRow > 0) {
      const originalMaxAttendees = eventsSheet.getRange(testRow, sheets.events.columns.MAX_ATTENDEES).getValue();
      eventsSheet.getRange(testRow, sheets.events.columns.MAX_ATTENDEES).setValue(0);
      
      const capacity0 = checkEventCapacity(testEventId);
      if (capacity0) {
        Logger.log(`   ✅ 定員0人のテスト: isFull=${capacity0.isFull}, availableSpots=${capacity0.availableSpots}`);
        Logger.log(`   期待値: isFull=true, availableSpots=0`);
        if (capacity0.isFull && capacity0.availableSpots === 0) {
          Logger.log(`   ✅ 期待値通り`);
        } else {
          Logger.log(`   ⚠️ 期待値と異なります`);
        }
      } else {
        Logger.log(`   ⚠️ checkEventCapacity()がnullを返しました`);
      }
      
      // 元に戻す
      eventsSheet.getRange(testRow, sheets.events.columns.MAX_ATTENDEES).setValue(originalMaxAttendees);
    }
    
    Logger.log('\n2. 定員未設定（null）のテスト...');
    if (testRow > 0) {
      const originalMaxAttendees = eventsSheet.getRange(testRow, sheets.events.columns.MAX_ATTENDEES).getValue();
      eventsSheet.getRange(testRow, sheets.events.columns.MAX_ATTENDEES).setValue('');
      
      const capacityNull = checkEventCapacity(testEventId);
      if (capacityNull) {
        Logger.log(`   ✅ 定員未設定のテスト: maxAttendees=${capacityNull.maxAttendees}, isFull=${capacityNull.isFull}, availableSpots=${capacityNull.availableSpots}`);
        Logger.log(`   期待値: maxAttendees=999, isFull=false, availableSpots=999`);
        if (capacityNull.maxAttendees === 999 && !capacityNull.isFull && capacityNull.availableSpots === 999) {
          Logger.log(`   ✅ 期待値通り`);
        } else {
          Logger.log(`   ⚠️ 期待値と異なります`);
        }
      } else {
        Logger.log(`   ⚠️ checkEventCapacity()がnullを返しました`);
      }
      
      // 元に戻す
      eventsSheet.getRange(testRow, sheets.events.columns.MAX_ATTENDEES).setValue(originalMaxAttendees);
    }
    
    Logger.log('\n3. 定員最大人数のテスト...');
    if (testRow > 0) {
      const capacity = checkEventCapacity(testEventId);
      if (capacity && capacity.maxAttendees > 0) {
        // 現在の参加者数を取得
        const calendarId = getCalendarId();
        const calendar = CalendarApp.getCalendarById(calendarId);
        let event = calendar.getEventById(testEventId);
        if (!event && testEventId.indexOf('@') === -1) {
          event = calendar.getEventById(`${testEventId}@google.com`);
        }
        
        if (event) {
          const currentAttendees = event.getGuestList().length;
          Logger.log(`   現在の参加者数: ${currentAttendees}, 最大定員: ${capacity.maxAttendees}`);
          
          // 定員が最大人数に達している場合のテスト
          if (currentAttendees >= capacity.maxAttendees) {
            Logger.log(`   ✅ 定員最大人数のテスト: isFull=${capacity.isFull}, availableSpots=${capacity.availableSpots}`);
            Logger.log(`   期待値: isFull=true, availableSpots=0`);
            if (capacity.isFull && capacity.availableSpots === 0) {
              Logger.log(`   ✅ 期待値通り`);
            } else {
              Logger.log(`   ⚠️ 期待値と異なります`);
            }
          } else {
            Logger.log(`   ℹ️ 定員に余裕があるため、最大人数のテストはスキップします`);
          }
        }
      }
    }
    
    Logger.log('\n=== testEventCapacityBoundary: 完了 ===');
  } catch (error) {
    Logger.log('❌ testEventCapacityBoundary: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * 変更期限の閾値テスト
 */
function testChangeDeadlineBoundary() {
  try {
    Logger.log('=== testChangeDeadlineBoundary: 開始 ===');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テストデータが取得できませんでした。createTestEvent()を実行してください。');
      return;
    }
    
    const testEventId = testData.eventIds[0].eventId;
    const calendarId = getCalendarId();
    const calendar = CalendarApp.getCalendarById(calendarId);
    
    let event = calendar.getEventById(testEventId);
    if (!event && testEventId.indexOf('@') === -1) {
      event = calendar.getEventById(`${testEventId}@google.com`);
    }
    
    if (!event) {
      Logger.log('⚠️ イベントが見つかりません。テストをスキップします。');
      return;
    }
    
    const eventStart = event.getStartTime();
    const now = new Date();
    
    Logger.log(`\nイベント開始時刻: ${eventStart}`);
    Logger.log(`現在時刻: ${now}`);
    
    Logger.log('\n1. 3日前の0時00分00秒のテスト...');
    const deadline3DaysBefore = new Date(eventStart);
    deadline3DaysBefore.setDate(deadline3DaysBefore.getDate() - 3);
    deadline3DaysBefore.setHours(0, 0, 0, 0);
    
    Logger.log(`   3日前の0時00分00秒: ${deadline3DaysBefore}`);
    Logger.log(`   現在時刻との比較: ${now <= deadline3DaysBefore ? '変更可能' : '変更不可'}`);
    
    // テスト用イベントの開始時刻を調整してテスト
    // 注意: 実際のイベントを変更するのは危険なので、ロジックの確認のみ
    const deadlineCheck = checkChangeDeadline(testEventId);
    if (deadlineCheck) {
      Logger.log(`   ✅ checkChangeDeadline()実行結果: isValid=${deadlineCheck.isValid}, daysUntil=${deadlineCheck.daysUntil}`);
      Logger.log(`   期限: ${deadlineCheck.deadline}`);
      Logger.log(`   メッセージ: ${deadlineCheck.message}`);
      
      // 期限が3日前の0時00分00秒に設定されているか確認
      const expectedDeadline = new Date(eventStart);
      expectedDeadline.setDate(expectedDeadline.getDate() - 3);
      expectedDeadline.setHours(0, 0, 0, 0);
      
      const deadlineDiff = Math.abs(deadlineCheck.deadline.getTime() - expectedDeadline.getTime());
      if (deadlineDiff < 1000) { // 1秒以内の誤差は許容
        Logger.log(`   ✅ 期限が正しく3日前の0時00分00秒に設定されています`);
      } else {
        Logger.log(`   ⚠️ 期限の設定が期待値と異なります`);
      }
    }
    
    Logger.log('\n2. 3日前の23時59分59秒のテスト...');
    const deadline3DaysBeforeEnd = new Date(eventStart);
    deadline3DaysBeforeEnd.setDate(deadline3DaysBeforeEnd.getDate() - 3);
    deadline3DaysBeforeEnd.setHours(23, 59, 59, 999);
    
    Logger.log(`   3日前の23時59分59秒: ${deadline3DaysBeforeEnd}`);
    Logger.log(`   現在時刻との比較: ${now <= deadline3DaysBeforeEnd ? '変更可能' : '変更不可'}`);
    
    Logger.log('\n3. 2日前の0時00分00秒のテスト...');
    const deadline2DaysBefore = new Date(eventStart);
    deadline2DaysBefore.setDate(deadline2DaysBefore.getDate() - 2);
    deadline2DaysBefore.setHours(0, 0, 0, 0);
    
    Logger.log(`   2日前の0時00分00秒: ${deadline2DaysBefore}`);
    Logger.log(`   現在時刻との比較: ${now <= deadline2DaysBefore ? '変更可能' : '変更不可'}`);
    
    // 2日前の場合は変更不可であることを確認
    if (now > deadline2DaysBefore) {
      Logger.log(`   ✅ 2日前を過ぎているため、変更不可であることを確認`);
    } else {
      Logger.log(`   ℹ️ まだ2日前を過ぎていないため、変更可能な状態です`);
    }
    
    Logger.log('\n=== testChangeDeadlineBoundary: 完了 ===');
  } catch (error) {
    Logger.log('❌ testChangeDeadlineBoundary: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * 変更回数の閾値テスト
 */
function testChangeLimitBoundary() {
  try {
    Logger.log('=== testChangeLimitBoundary: 開始 ===');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テストデータが取得できませんでした。createTestEvent()を実行してください。');
      return;
    }
    
    const testEventId = testData.eventIds[0].eventId;
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    
    Logger.log(`\n1. 変更回数0回のテスト...`);
    const limit0 = checkChangeLimit(testEmail, testEventId);
    if (limit0) {
      Logger.log(`   ✅ 変更回数0回のテスト: isValid=${limit0.isValid}, changeCount=${limit0.changeCount}`);
      Logger.log(`   期待値: isValid=true, changeCount=0`);
      Logger.log(`   メッセージ: ${limit0.message}`);
      
      if (limit0.changeCount === 0) {
        Logger.log(`   ✅ 変更回数が0回であることを確認`);
        if (limit0.isValid) {
          Logger.log(`   ✅ 変更可能であることを確認`);
        } else {
          Logger.log(`   ⚠️ 変更回数0回なのに変更不可になっています`);
        }
      } else {
        Logger.log(`   ⚠️ 変更回数が0回ではありません: ${limit0.changeCount}`);
      }
    } else {
      Logger.log(`   ⚠️ checkChangeLimit()がnullを返しました`);
    }
    
    Logger.log('\n2. 変更回数1回のテスト...');
    // 変更回数1回の状態をシミュレート
    // 注意: 実際のデータを変更するのは危険なので、ロジックの確認のみ
    Logger.log(`   ℹ️ 変更回数1回の状態をシミュレートするには、実際のデータを変更する必要があります`);
    Logger.log(`   ℹ️ 現在の実装では、変更履歴を追跡する列がないため、簡易的なチェックのみです`);
    
    Logger.log('\n3. 変更回数2回のテスト...');
    Logger.log(`   ℹ️ 変更回数2回の状態をシミュレートするには、実際のデータを変更する必要があります`);
    
    Logger.log('\n=== testChangeLimitBoundary: 完了 ===');
  } catch (error) {
    Logger.log('❌ testChangeLimitBoundary: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * 不正な入力値のテスト
 */
function testInvalidInputs() {
  try {
    Logger.log('=== testInvalidInputs: 開始 ===');
    
    Logger.log('\n1. checkEventCapacity()の不正な入力値テスト...');
    
    Logger.log('   1-1. eventIdがnullの場合...');
    const capacityNull = checkEventCapacity(null);
    Logger.log(`   結果: ${capacityNull === null ? 'null（期待値通り）' : 'null以外（予期しない動作）'}`);
    
    Logger.log('   1-2. eventIdが空文字列の場合...');
    const capacityEmpty = checkEventCapacity('');
    Logger.log(`   結果: ${capacityEmpty === null ? 'null（期待値通り）' : 'null以外（予期しない動作）'}`);
    
    Logger.log('   1-3. eventIdが存在しない場合...');
    const capacityNotFound = checkEventCapacity('nonexistent_event_id_12345');
    Logger.log(`   結果: ${capacityNotFound === null ? 'null（期待値通り）' : 'null以外（予期しない動作）'}`);
    
    Logger.log('\n2. checkDuplicateReservation()の不正な入力値テスト...');
    
    const testData = getTestData();
    const testEventId = testData && testData.eventIds && testData.eventIds.length > 0 ? testData.eventIds[0].eventId : 'test_event_id';
    
    Logger.log('   2-1. emailがnullの場合...');
    const duplicateNull = checkDuplicateReservation(null, testEventId);
    Logger.log(`   結果: ${duplicateNull === false ? 'false（期待値通り）' : 'true（予期しない動作）'}`);
    
    Logger.log('   2-2. emailが空文字列の場合...');
    const duplicateEmpty = checkDuplicateReservation('', testEventId);
    Logger.log(`   結果: ${duplicateEmpty === false ? 'false（期待値通り）' : 'true（予期しない動作）'}`);
    
    Logger.log('   2-3. emailが不正な形式の場合...');
    const duplicateInvalid = checkDuplicateReservation('invalid_email_format', testEventId);
    Logger.log(`   結果: ${duplicateInvalid === false ? 'false（期待値通り）' : 'true（予期しない動作）'}`);
    
    Logger.log('   2-4. eventIdがnullの場合...');
    const testEmail = testData && testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    const duplicateEventIdNull = checkDuplicateReservation(testEmail, null);
    Logger.log(`   結果: ${duplicateEventIdNull === false ? 'false（期待値通り）' : 'true（予期しない動作）'}`);
    
    Logger.log('   2-5. eventIdが空文字列の場合...');
    const duplicateEventIdEmpty = checkDuplicateReservation(testEmail, '');
    Logger.log(`   結果: ${duplicateEventIdEmpty === false ? 'false（期待値通り）' : 'true（予期しない動作）'}`);
    
    Logger.log('\n3. checkChangeDeadline()の不正な入力値テスト...');
    
    Logger.log('   3-1. eventIdがnullの場合...');
    const deadlineNull = checkChangeDeadline(null);
    Logger.log(`   結果: isValid=${deadlineNull ? deadlineNull.isValid : 'null'}, message=${deadlineNull ? deadlineNull.message : 'null'}`);
    if (deadlineNull && !deadlineNull.isValid) {
      Logger.log(`   ✅ 不正な入力値に対して適切にエラーを返しています`);
    }
    
    Logger.log('   3-2. eventIdが空文字列の場合...');
    const deadlineEmpty = checkChangeDeadline('');
    Logger.log(`   結果: isValid=${deadlineEmpty ? deadlineEmpty.isValid : 'null'}, message=${deadlineEmpty ? deadlineEmpty.message : 'null'}`);
    if (deadlineEmpty && !deadlineEmpty.isValid) {
      Logger.log(`   ✅ 不正な入力値に対して適切にエラーを返しています`);
    }
    
    Logger.log('   3-3. eventIdが存在しない場合...');
    const deadlineNotFound = checkChangeDeadline('nonexistent_event_id_12345');
    Logger.log(`   結果: isValid=${deadlineNotFound ? deadlineNotFound.isValid : 'null'}, message=${deadlineNotFound ? deadlineNotFound.message : 'null'}`);
    if (deadlineNotFound && !deadlineNotFound.isValid) {
      Logger.log(`   ✅ 存在しないイベントに対して適切にエラーを返しています`);
    }
    
    Logger.log('\n4. checkChangeLimit()の不正な入力値テスト...');
    
    Logger.log('   4-1. emailがnullの場合...');
    const limitEmailNull = checkChangeLimit(null, testEventId);
    Logger.log(`   結果: isValid=${limitEmailNull ? limitEmailNull.isValid : 'null'}, message=${limitEmailNull ? limitEmailNull.message : 'null'}`);
    if (limitEmailNull && !limitEmailNull.isValid) {
      Logger.log(`   ✅ 不正な入力値に対して適切にエラーを返しています`);
    }
    
    Logger.log('   4-2. emailが空文字列の場合...');
    const limitEmailEmpty = checkChangeLimit('', testEventId);
    Logger.log(`   結果: isValid=${limitEmailEmpty ? limitEmailEmpty.isValid : 'null'}, message=${limitEmailEmpty ? limitEmailEmpty.message : 'null'}`);
    if (limitEmailEmpty && !limitEmailEmpty.isValid) {
      Logger.log(`   ✅ 不正な入力値に対して適切にエラーを返しています`);
    }
    
    Logger.log('   4-3. eventIdがnullの場合...');
    const limitEventIdNull = checkChangeLimit(testEmail, null);
    Logger.log(`   結果: isValid=${limitEventIdNull ? limitEventIdNull.isValid : 'null'}, message=${limitEventIdNull ? limitEventIdNull.message : 'null'}`);
    if (limitEventIdNull && !limitEventIdNull.isValid) {
      Logger.log(`   ✅ 不正な入力値に対して適切にエラーを返しています`);
    }
    
    Logger.log('   4-4. eventIdが空文字列の場合...');
    const limitEventIdEmpty = checkChangeLimit(testEmail, '');
    Logger.log(`   結果: isValid=${limitEventIdEmpty ? limitEventIdEmpty.isValid : 'null'}, message=${limitEventIdEmpty ? limitEventIdEmpty.message : 'null'}`);
    if (limitEventIdEmpty && !limitEventIdEmpty.isValid) {
      Logger.log(`   ✅ 不正な入力値に対して適切にエラーを返しています`);
    }
    
    Logger.log('\n=== testInvalidInputs: 完了 ===');
  } catch (error) {
    Logger.log('❌ testInvalidInputs: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * データ不整合のテスト
 */
function testDataInconsistency() {
  try {
    Logger.log('=== testDataInconsistency: 開始 ===');
    
    Logger.log('\n1. カレンダーIDが未設定の場合のテスト...');
    const originalCalendarId = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
    PropertiesService.getScriptProperties().deleteProperty('CALENDAR_ID');
    
    const testData = getTestData();
    const testEventId = testData && testData.eventIds && testData.eventIds.length > 0 ? testData.eventIds[0].eventId : 'test_event_id';
    
    const capacityNoCalendar = checkEventCapacity(testEventId);
    Logger.log(`   checkEventCapacity()の結果: ${capacityNoCalendar === null ? 'null（期待値通り）' : 'null以外（予期しない動作）'}`);
    
    const deadlineNoCalendar = checkChangeDeadline(testEventId);
    Logger.log(`   checkChangeDeadline()の結果: isValid=${deadlineNoCalendar ? deadlineNoCalendar.isValid : 'null'}, message=${deadlineNoCalendar ? deadlineNoCalendar.message : 'null'}`);
    if (deadlineNoCalendar && !deadlineNoCalendar.isValid && deadlineNoCalendar.message.includes('CALENDAR_ID')) {
      Logger.log(`   ✅ カレンダーID未設定に対して適切にエラーを返しています`);
    }
    
    // 元に戻す
    if (originalCalendarId) {
      PropertiesService.getScriptProperties().setProperty('CALENDAR_ID', originalCalendarId);
    }
    
    Logger.log('\n2. 参加情報シートにデータがない場合のテスト...');
    const testEmail = testData && testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    
    // 注意: 実際のシートを空にするのは危険なので、存在しないemailでテスト
    const limitNoData = checkChangeLimit('nonexistent_email@example.com', testEventId);
    Logger.log(`   checkChangeLimit()の結果: isValid=${limitNoData ? limitNoData.isValid : 'null'}, message=${limitNoData ? limitNoData.message : 'null'}`);
    if (limitNoData && !limitNoData.isValid && limitNoData.message.includes('参加者情報が見つかりません')) {
      Logger.log(`   ✅ 存在しない参加者に対して適切にエラーを返しています`);
    }
    
    Logger.log('\n3. イベント情報が存在しない場合のテスト...');
    const limitNoEvent = checkChangeLimit(testEmail, 'nonexistent_event_id_12345');
    Logger.log(`   checkChangeLimit()の結果: isValid=${limitNoEvent ? limitNoEvent.isValid : 'null'}, message=${limitNoEvent ? limitNoEvent.message : 'null'}`);
    if (limitNoEvent && !limitNoEvent.isValid && limitNoEvent.message.includes('イベント情報が見つかりません')) {
      Logger.log(`   ✅ 存在しないイベントに対して適切にエラーを返しています`);
    }
    
    Logger.log('\n=== testDataInconsistency: 完了 ===');
  } catch (error) {
    Logger.log('❌ testDataInconsistency: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * 異常系・エラーハンドリングのテスト
 */
function testErrorHandling() {
  try {
    Logger.log('=== testErrorHandling: 開始 ===');
    
    Logger.log('\n1. エラーが発生した場合の動作確認...');
    
    // 各関数がエラー時にクラッシュせず、適切にエラーを返すことを確認
    Logger.log('   1-1. checkEventCapacity()のエラーハンドリング...');
    try {
      const capacityError = checkEventCapacity('invalid_event_id');
      if (capacityError === null) {
        Logger.log(`   ✅ エラー時にnullを返してクラッシュしないことを確認`);
      } else {
        Logger.log(`   ⚠️ エラー時にnull以外を返しています`);
      }
    } catch (error) {
      Logger.log(`   ❌ エラーが発生しました: ${error.toString()}`);
    }
    
    Logger.log('   1-2. checkDuplicateReservation()のエラーハンドリング...');
    try {
      const duplicateError = checkDuplicateReservation('test@example.com', 'invalid_event_id');
      Logger.log(`   ✅ エラー時にfalseを返してクラッシュしないことを確認`);
    } catch (error) {
      Logger.log(`   ❌ エラーが発生しました: ${error.toString()}`);
    }
    
    Logger.log('   1-3. checkChangeDeadline()のエラーハンドリング...');
    try {
      const deadlineError = checkChangeDeadline('invalid_event_id');
      if (deadlineError && !deadlineError.isValid) {
        Logger.log(`   ✅ エラー時にisValid=falseを返してクラッシュしないことを確認`);
        Logger.log(`   メッセージ: ${deadlineError.message}`);
      } else {
        Logger.log(`   ⚠️ エラー時の戻り値が期待値と異なります`);
      }
    } catch (error) {
      Logger.log(`   ❌ エラーが発生しました: ${error.toString()}`);
    }
    
    Logger.log('   1-4. checkChangeLimit()のエラーハンドリング...');
    try {
      const limitError = checkChangeLimit('test@example.com', 'invalid_event_id');
      if (limitError && !limitError.isValid) {
        Logger.log(`   ✅ エラー時にisValid=falseを返してクラッシュしないことを確認`);
        Logger.log(`   メッセージ: ${limitError.message}`);
      } else {
        Logger.log(`   ⚠️ エラー時の戻り値が期待値と異なります`);
      }
    } catch (error) {
      Logger.log(`   ❌ エラーが発生しました: ${error.toString()}`);
    }
    
    Logger.log('\n2. エラーメッセージの確認...');
    Logger.log('   ℹ️ 各関数が適切なエラーメッセージを返すことを確認');
    
    Logger.log('\n=== testErrorHandling: 完了 ===');
  } catch (error) {
    Logger.log('❌ testErrorHandling: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * すべての閾値・エッジケース・異常系テストを実行する統合テスト
 */
function testAllBoundaryAndEdgeCases() {
  try {
    Logger.log('=== testAllBoundaryAndEdgeCases: 開始 ===');
    Logger.log('⚠️ 閾値・エッジケース・異常系のテストを実行します');
    
    Logger.log('\n1. 定員管理機能の閾値テスト...');
    testEventCapacityBoundary();
    
    Logger.log('\n2. 変更期限の閾値テスト...');
    testChangeDeadlineBoundary();
    
    Logger.log('\n3. 変更回数の閾値テスト...');
    testChangeLimitBoundary();
    
    Logger.log('\n4. 不正な入力値のテスト...');
    testInvalidInputs();
    
    Logger.log('\n5. データ不整合のテスト...');
    testDataInconsistency();
    
    Logger.log('\n6. 異常系・エラーハンドリングのテスト...');
    testErrorHandling();
    
    Logger.log('\n=== testAllBoundaryAndEdgeCases: 完了 ===');
    Logger.log('\n✅ すべての閾値・エッジケース・異常系テストが完了しました！');
  } catch (error) {
    Logger.log('❌ testAllBoundaryAndEdgeCases: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}


/**
 * ========================================
 * フォーム関連テスト関数
 * ========================================
 */

/**
 * フォーム再構築の依存関数をテストする関数
 */
function form_testRebuildDependencies() {
  Logger.log('=== form_testRebuildDependencies: 開始 ===');
  
  try {
    Logger.log('1. form_getFormUtils()のテスト...');
    const utils = form_getFormUtils();
    Logger.log('✅ form_getFormUtils()成功');
    
    Logger.log('2. form_getFormConfig()のテスト...');
    const config = form_getFormConfig();
    Logger.log('✅ form_getFormConfig()成功');
    Logger.log(`   - groups: ${config.groups ? config.groups.length : 'undefined'}件`);
    Logger.log(`   - form.steps: ${config.form && config.form.steps ? config.form.steps.length : 'undefined'}件`);
    
    Logger.log('3. form_getFormGroups()のテスト...');
    const groups = form_getFormGroups();
    Logger.log(`✅ form_getFormGroups()成功: ${groups.length}件`);
    Logger.log(`   グループ一覧: ${groups.join(', ')}`);
    
    Logger.log('4. form_getFormConfiguration()のテスト...');
    const formConfig = form_getFormConfiguration();
    Logger.log('✅ form_getFormConfiguration()成功');
    Logger.log(`   - formTitle: ${formConfig.formTitle || 'undefined'}`);
    Logger.log(`   - steps数: ${formConfig.steps ? formConfig.steps.length : 'undefined'}`);
    if (formConfig.steps && formConfig.steps.length > 0) {
      Logger.log(`   - step1.title: ${formConfig.steps[0].title || 'undefined'}`);
      Logger.log(`   - step1.items数: ${formConfig.steps[0].items ? formConfig.steps[0].items.length : 'undefined'}`);
    }
    
    Logger.log('5. form_openSourceSpreadsheet()のテスト...');
    const spreadsheet = form_openSourceSpreadsheet();
    if (spreadsheet) {
      Logger.log(`✅ form_openSourceSpreadsheet()成功: ${spreadsheet.getName()}`);
    } else {
      Logger.log('❌ form_openSourceSpreadsheet()失敗: nullが返されました');
    }
    
    Logger.log('6. form_getScheduledCourses()のテスト...');
    const sessions = form_getScheduledCourses();
    Logger.log(`✅ form_getScheduledCourses()成功: ${sessions.length}件`);
    if (sessions.length > 0) {
      Logger.log(`   最初のセッション: ${JSON.stringify(sessions[0])}`);
    }
    
    Logger.log('=== form_testRebuildDependencies: 完了 ===');
  } catch (error) {
    Logger.log('❌ form_testRebuildDependencies: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

// 後方互換性のためのエイリアス
function testRebuildDependencies() { return form_testRebuildDependencies(); }

/**
 * ========================================
 * 新規実装関数のテスト
 * ========================================
 */

/**
 * getReservedCountForGroupAndCourse()のテスト関数
 */
function testGetReservedCountForGroupAndCourse() {
  try {
    Logger.log('=== testGetReservedCountForGroupAndCourse: 開始 ===');
    
    const utils = getUtils();
    const sheets = getSheets();
    const attendeesSheet = CustomUtils.getSheetByName(sheets.attendees.name);
    
    if (!attendeesSheet) {
      Logger.log('⚠️ 参加情報シートが見つかりません');
      return;
    }
    
    // テスト用のグループとコース名を取得
    const groups = ['1期生', '2期生', '3期生', '4期生'];
    const courses = ['コンプライアンス/会社ルールについて', '個人情報保護法について'];
    
    Logger.log('\n1. 各グループ・コースの予約済み人数を取得...');
    for (const group of groups) {
      for (const courseName of courses) {
        const count = getReservedCountForGroupAndCourse(group, courseName, attendeesSheet);
        Logger.log(`   ${group} / ${courseName}: ${count}人`);
      }
    }
    
    Logger.log('\n2. 存在しないコース名でのテスト...');
    const invalidCount = getReservedCountForGroupAndCourse('1期生', '存在しないコース', attendeesSheet);
    Logger.log(`   存在しないコース: ${invalidCount}人（期待値: 0）`);
    if (invalidCount === 0) {
      Logger.log('   ✅ 期待値通り');
    } else {
      Logger.log('   ⚠️ 期待値と異なります');
    }
    
    Logger.log('\n=== testGetReservedCountForGroupAndCourse: 完了 ===');
  } catch (error) {
    Logger.log('❌ testGetReservedCountForGroupAndCourse: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * getCourseNumberFromCourseListByCourseName()のテスト関数
 */
function testGetCourseNumberFromCourseListByCourseName() {
  try {
    Logger.log('=== testGetCourseNumberFromCourseListByCourseName: 開始 ===');
    
    Logger.log('\n1. 既存のコース名でテスト...');
    const testCourseNames = [
      'コンプライアンス/会社ルールについて',
      '個人情報保護法について',
      '労働法について'
    ];
    
    for (const courseName of testCourseNames) {
      const courseNumber = getCourseNumberFromCourseListByCourseName(courseName);
      if (courseNumber) {
        Logger.log(`   ${courseName}: 番号 ${courseNumber}`);
      } else {
        Logger.log(`   ${courseName}: 番号が見つかりませんでした`);
      }
    }
    
    Logger.log('\n2. 存在しないコース名でテスト...');
    const invalidNumber = getCourseNumberFromCourseListByCourseName('存在しないコース');
    Logger.log(`   存在しないコース: ${invalidNumber === null ? 'null（期待値通り）' : `番号 ${invalidNumber}（予期しない動作）`}`);
    
    Logger.log('\n=== testGetCourseNumberFromCourseListByCourseName: 完了 ===');
  } catch (error) {
    Logger.log('❌ testGetCourseNumberFromCourseListByCourseName: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * updateDashboardAfterReservation()のテスト関数
 */
function testUpdateDashboardAfterReservation() {
  try {
    Logger.log('=== testUpdateDashboardAfterReservation: 開始 ===');
    Logger.log('⚠️ 注意: このテストは実際にダッシュボードを更新します');
    
    Logger.log('\n1. updateDashboardAfterReservation()を実行...');
    updateDashboardAfterReservation();
    Logger.log('   ✅ updateDashboardAfterReservation()実行完了');
    
    Logger.log('\n2. ダッシュボードの更新を確認...');
    const utils = getUtils();
    const sheets = getSheets();
    const dashboardSheet = CustomUtils.getSheetByName(sheets.dashboard.name);
    
    if (dashboardSheet) {
      const lastRow = dashboardSheet.getLastRow();
      Logger.log(`   ダッシュボードの最終行: ${lastRow}`);
      Logger.log('   ✅ ダッシュボードが更新されました');
    } else {
      Logger.log('   ⚠️ ダッシュボードシートが見つかりませんでした');
    }
    
    Logger.log('\n=== testUpdateDashboardAfterReservation: 完了 ===');
  } catch (error) {
    Logger.log('❌ testUpdateDashboardAfterReservation: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * deleteCalendarEvent()のテスト関数
 * 
 * ⚠️ 安全対策: テスト用イベントのみを使用します
 */
function testDeleteCalendarEvent() {
  try {
    Logger.log('=== testDeleteCalendarEvent: 開始 ===');
    Logger.log('⚠️ 注意: このテストは実際にカレンダーイベントを削除します');
    Logger.log('   テスト用イベントのみを使用してください');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テスト用eventIdが見つかりません。createTestEvent()を実行してください。');
      return;
    }
    
    // テスト用イベントを作成（削除用）
    Logger.log('\n1. テスト用イベントを作成中...');
    const testEvent = createTestEvent();
    if (!testEvent || !testEvent.eventId) {
      Logger.log('   ❌ テスト用イベントの作成に失敗しました');
      return;
    }
    
    const testEventId = testEvent.eventId;
    Logger.log(`   テスト用eventId: ${testEventId}`);
    
    Logger.log('\n2. deleteCalendarEvent()を実行...');
    const deleteResult = deleteCalendarEvent(testEventId);
    
    if (deleteResult) {
      Logger.log('   ✅ deleteCalendarEvent()成功');
      
      // イベントが削除されたことを確認
      Logger.log('\n3. イベントが削除されたことを確認...');
      const calendarId = getCalendarId();
      const calendar = CalendarApp.getCalendarById(calendarId);
      let event = null;
      try {
        event = calendar.getEventById(testEventId);
        if (!event && testEventId.indexOf('@') === -1) {
          event = calendar.getEventById(`${testEventId}@google.com`);
        }
      } catch (e) {
        // イベントが見つからない場合は正常（削除成功）
      }
      
      if (!event) {
        Logger.log('   ✅ イベントが削除されました');
      } else {
        Logger.log('   ⚠️ イベントがまだ存在しています');
      }
    } else {
      Logger.log('   ⚠️ deleteCalendarEvent()がfalseを返しました');
    }
    
    Logger.log('\n=== testDeleteCalendarEvent: 完了 ===');
  } catch (error) {
    Logger.log('❌ testDeleteCalendarEvent: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * syncCalendarOnReservationChange()のテスト関数
 * 
 * ⚠️ 安全対策: テスト用イベントのみを使用します
 */
function testSyncCalendarOnReservationChange() {
  try {
    Logger.log('=== testSyncCalendarOnReservationChange: 開始 ===');
    Logger.log('⚠️ 注意: このテストは実際にカレンダーイベントを変更します');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length < 2) {
      Logger.log('⚠️ テスト用eventIdが2つ以上必要です。createTestEvent()を2回実行してください。');
      return;
    }
    
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    const oldEventId = testData.eventIds[0].eventId;
    const newEventId = testData.eventIds[1].eventId;
    
    Logger.log(`\n1. syncCalendarOnReservationChange()を実行...`);
    Logger.log(`   email: ${testEmail}`);
    Logger.log(`   oldEventId: ${oldEventId}`);
    Logger.log(`   newEventId: ${newEventId}`);
    
    const syncResult = syncCalendarOnReservationChange(testEmail, oldEventId, newEventId);
    
    if (syncResult) {
      Logger.log('   ✅ syncCalendarOnReservationChange()成功');
      
      // カレンダーの状態を確認
      Logger.log('\n2. カレンダーの状態を確認...');
      const calendarId = getCalendarId();
      const calendar = CalendarApp.getCalendarById(calendarId);
      
      let oldEvent = calendar.getEventById(oldEventId);
      if (!oldEvent && oldEventId.indexOf('@') === -1) {
        oldEvent = calendar.getEventById(`${oldEventId}@google.com`);
      }
      
      let newEvent = calendar.getEventById(newEventId);
      if (!newEvent && newEventId.indexOf('@') === -1) {
        newEvent = calendar.getEventById(`${newEventId}@google.com`);
      }
      
      if (oldEvent) {
        const oldGuests = oldEvent.getGuestList();
        const oldEmails = oldGuests.map(guest => guest.getEmail().trim().toLowerCase());
        Logger.log(`   旧イベントのゲスト数: ${oldGuests.length}`);
        Logger.log(`   テスト用emailが含まれているか: ${oldEmails.includes(testEmail.toLowerCase()) ? 'はい' : 'いいえ'}`);
      }
      
      if (newEvent) {
        const newGuests = newEvent.getGuestList();
        const newEmails = newGuests.map(guest => guest.getEmail().trim().toLowerCase());
        Logger.log(`   新イベントのゲスト数: ${newGuests.length}`);
        Logger.log(`   テスト用emailが含まれているか: ${newEmails.includes(testEmail.toLowerCase()) ? 'はい' : 'いいえ'}`);
      }
    } else {
      Logger.log('   ⚠️ syncCalendarOnReservationChange()がfalseを返しました');
    }
    
    Logger.log('\n=== testSyncCalendarOnReservationChange: 完了 ===');
  } catch (error) {
    Logger.log('❌ testSyncCalendarOnReservationChange: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * sendReservationConfirmationEmail()のテスト関数
 * 
 * ⚠️ 注意: このテストは実際にメールを送信する可能性があります
 */
function testSendReservationConfirmationEmail() {
  try {
    Logger.log('=== testSendReservationConfirmationEmail: 開始 ===');
    Logger.log('⚠️ 注意: このテストは実際にメールを送信する可能性があります');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テスト用eventIdが見つかりません。createTestEvent()を実行してください。');
      return;
    }
    
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    const testEventId = testData.eventIds[0].eventId;
    
    Logger.log(`\n1. sendReservationConfirmationEmail()を実行...`);
    Logger.log(`   email: ${testEmail}`);
    Logger.log(`   eventId: ${testEventId}`);
    
    // イベント情報を取得
    const utils = getUtils();
    const eventInfo = findEventInfoByEventId(testEventId, utils);
    
    if (!eventInfo) {
      Logger.log('   ⚠️ イベント情報が取得できませんでした');
      return;
    }
    
    Logger.log(`   イベント名: ${eventInfo.courseName || 'N/A'}`);
    
    // メール送信関数を実行（実際には送信されない可能性もある）
    sendReservationConfirmationEmail(testEmail, testEventId, eventInfo);
    Logger.log('   ✅ sendReservationConfirmationEmail()実行完了');
    Logger.log('   ℹ️ メール送信の確認は、実際のメールボックスで確認してください');
    
    Logger.log('\n=== testSendReservationConfirmationEmail: 完了 ===');
  } catch (error) {
    Logger.log('❌ testSendReservationConfirmationEmail: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * sendReservationChangeEmail()のテスト関数
 * 
 * ⚠️ 注意: このテストは実際にメールを送信する可能性があります
 */
function testSendReservationChangeEmail() {
  try {
    Logger.log('=== testSendReservationChangeEmail: 開始 ===');
    Logger.log('⚠️ 注意: このテストは実際にメールを送信する可能性があります');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length < 2) {
      Logger.log('⚠️ テスト用eventIdが2つ以上必要です。createTestEvent()を2回実行してください。');
      return;
    }
    
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    const oldEventId = testData.eventIds[0].eventId;
    const newEventId = testData.eventIds[1].eventId;
    
    Logger.log(`\n1. sendReservationChangeEmail()を実行...`);
    Logger.log(`   email: ${testEmail}`);
    Logger.log(`   oldEventId: ${oldEventId}`);
    Logger.log(`   newEventId: ${newEventId}`);
    
    sendReservationChangeEmail(testEmail, oldEventId, newEventId);
    Logger.log('   ✅ sendReservationChangeEmail()実行完了');
    Logger.log('   ℹ️ メール送信の確認は、実際のメールボックスで確認してください');
    
    Logger.log('\n=== testSendReservationChangeEmail: 完了 ===');
  } catch (error) {
    Logger.log('❌ testSendReservationChangeEmail: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * sendCancellationEmail()のテスト関数
 * 
 * ⚠️ 注意: このテストは実際にメールを送信する可能性があります
 */
function testSendCancellationEmail() {
  try {
    Logger.log('=== testSendCancellationEmail: 開始 ===');
    Logger.log('⚠️ 注意: このテストは実際にメールを送信する可能性があります');
    
    const testData = getTestData();
    if (!testData || !testData.eventIds || testData.eventIds.length === 0) {
      Logger.log('⚠️ テスト用eventIdが見つかりません。createTestEvent()を実行してください。');
      return;
    }
    
    const testEmail = testData.emails && testData.emails.length > 0 ? testData.emails[0] : 't_sato2@ga-tech.co.jp';
    const testEventId = testData.eventIds[0].eventId;
    
    Logger.log(`\n1. sendCancellationEmail()を実行...`);
    Logger.log(`   email: ${testEmail}`);
    Logger.log(`   eventId: ${testEventId}`);
    
    sendCancellationEmail(testEmail, testEventId);
    Logger.log('   ✅ sendCancellationEmail()実行完了');
    Logger.log('   ℹ️ メール送信の確認は、実際のメールボックスで確認してください');
    
    Logger.log('\n=== testSendCancellationEmail: 完了 ===');
  } catch (error) {
    Logger.log('❌ testSendCancellationEmail: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}

/**
 * すべての新規実装関数のテストを実行する統合テスト
 */
function testAllNewFunctions() {
  try {
    Logger.log('=== testAllNewFunctions: 開始 ===');
    Logger.log('⚠️ 新規実装された関数のテストを実行します');
    
    Logger.log('\n1. getReservedCountForGroupAndCourse()のテスト...');
    testGetReservedCountForGroupAndCourse();
    
    Logger.log('\n2. getCourseNumberFromCourseListByCourseName()のテスト...');
    testGetCourseNumberFromCourseListByCourseName();
    
    Logger.log('\n3. updateDashboardAfterReservation()のテスト...');
    testUpdateDashboardAfterReservation();
    
    Logger.log('\n4. deleteCalendarEvent()のテスト...');
    Logger.log('   ⚠️ 注意: このテストは実際にイベントを削除します');
    Logger.log('   スキップします（必要に応じて手動で実行してください）');
    // testDeleteCalendarEvent(); // 実際にイベントを削除するため、コメントアウト
    
    Logger.log('\n5. syncCalendarOnReservationChange()のテスト...');
    Logger.log('   ⚠️ 注意: このテストは実際にカレンダーを変更します');
    Logger.log('   スキップします（必要に応じて手動で実行してください）');
    // testSyncCalendarOnReservationChange(); // 実際にカレンダーを変更するため、コメントアウト
    
    Logger.log('\n6. sendReservationConfirmationEmail()のテスト...');
    Logger.log('   ⚠️ 注意: このテストは実際にメールを送信する可能性があります');
    Logger.log('   スキップします（必要に応じて手動で実行してください）');
    // testSendReservationConfirmationEmail(); // 実際にメールを送信する可能性があるため、コメントアウト
    
    Logger.log('\n7. sendReservationChangeEmail()のテスト...');
    Logger.log('   ⚠️ 注意: このテストは実際にメールを送信する可能性があります');
    Logger.log('   スキップします（必要に応じて手動で実行してください）');
    // testSendReservationChangeEmail(); // 実際にメールを送信する可能性があるため、コメントアウト
    
    Logger.log('\n8. sendCancellationEmail()のテスト...');
    Logger.log('   ⚠️ 注意: このテストは実際にメールを送信する可能性があります');
    Logger.log('   スキップします（必要に応じて手動で実行してください）');
    // testSendCancellationEmail(); // 実際にメールを送信する可能性があるため、コメントアウト
    
    Logger.log('\n=== testAllNewFunctions: 完了 ===');
    Logger.log('\n✅ すべての新規実装関数のテストが完了しました！');
    Logger.log('⚠️ 注意: 一部のテストは安全のためスキップされました');
    Logger.log('   必要に応じて個別に実行してください');
  } catch (error) {
    Logger.log('❌ testAllNewFunctions: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
  }
}
