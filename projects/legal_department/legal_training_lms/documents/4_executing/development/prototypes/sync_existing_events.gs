/**
 * ========================================
 * 既存カレンダーイベントとの同期
 * ========================================
 */

/**
 * 予約一覧シートの既存データに対して、カレンダーから既存イベントを検索してeventIdを設定する
 * 
 * 実行方法:
 * 1. Apps Scriptエディタでこの関数を選択
 * 2. 「実行」ボタンをクリック
 * 
 * 処理内容:
 * - 予約一覧シートの各行を確認
 * - 日程・開始日時・完了日時が設定されているが、eventIdが空の行を対象
 * - アクセス可能なすべてのカレンダーから既存イベントを検索
 * - 見つかった場合はeventIdを設定
 */
function syncExistingCalendarEvents() {
  Logger.log('=== syncExistingCalendarEvents: 開始 ===');
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      Logger.log('❌ スプレッドシートが取得できませんでした');
      return;
    }
    
    const eventsSheet = spreadsheet.getSheetByName(sheets.events.name);
    if (!eventsSheet) {
      Logger.log(`❌ シート「${sheets.events.name}」が見つかりません`);
      return;
    }
    
    const lastRow = eventsSheet.getLastRow();
    if (lastRow < sheets.events.rows.FIRST) {
      Logger.log('⚠️ 予約一覧にデータがありません');
      return;
    }
    
    Logger.log(`📊 予約一覧シートの最終行: ${lastRow}`);
    
    // CALENDAR_IDプロパティから優先カレンダーIDを取得
    const utils = getUtils();
    const priorityCalendarId = utils.getCalendarId();
    Logger.log(`📋 優先カレンダーID (CALENDAR_ID): ${priorityCalendarId || '(未設定)'}`);
    
    // アクセス可能なすべてのカレンダーを取得
    const allCalendars = CalendarApp.getAllCalendars();
    
    // 検索対象のカレンダーのみを抽出
    const hiramatsuCalendars = [];
    const resourceCalendars = [];
    const groupCalendars = new Map(); // グループ名 -> カレンダー配列
    
    allCalendars.forEach((cal) => {
      const calName = cal.getName();
      const calId = cal.getId();
      
      // CALENDAR_IDプロパティで指定されたカレンダーを優先的に検出
      const isPriorityCalendar = priorityCalendarId && (
        calId === priorityCalendarId ||
        calId.includes(priorityCalendarId) ||
        priorityCalendarId.includes(calId)
      );
      
      // 平松さんのカレンダーを特定（CALENDAR_IDプロパティを優先、フォールバックとして名前やメールアドレスから）
      const isHiramatsu = isPriorityCalendar || 
                          calName.includes('平松') || 
                          calName.includes('Hiramatsu') || 
                          calName.includes('hiramatsu') ||
                          calId.includes('hiramatsu') ||
                          calId.includes('t_hiramatsu') ||
                          calId === 't_hiramatsu@ga-tech.co.jp';
      
      // リソースカレンダーを特定（会議室、設備など）
      // リソースカレンダーは通常、特定のパターンがある
      const isResource = calName.includes('会議室') ||
                        calName.includes('Conference') ||
                        calName.includes('Room') ||
                        calName.includes('リソース') ||
                        calName.includes('Resource') ||
                        calName.includes('設備') ||
                        calName.includes('Facility') ||
                        calId.includes('resource') ||
                        calId.includes('room') ||
                        calId.includes('facility') ||
                        // 会議室の命名パターン（例: ISLAND, KANKOKU-KANなど）
                        /^[A-Z]+(-[A-Z]+)*(@|$)/.test(calId.split('@')[0]);
      
      // N期生のカレンダーを特定（例: "1期生", "2期生", "3期生"）
      const groupMatch = calName.match(/(\d+)期生/) || calId.match(/(\d+)期生/);
      const groupName = groupMatch ? `${groupMatch[1]}期生` : null;
      
      if (isHiramatsu) {
        hiramatsuCalendars.push(cal);
        if (isPriorityCalendar) {
          Logger.log(`  ✅ 優先カレンダーを検出 (CALENDAR_ID): ${calName} (${calId})`);
        } else {
          Logger.log(`  ✅ 平松さんのカレンダーを検出: ${calName}`);
        }
      } else if (isResource) {
        resourceCalendars.push(cal);
      } else if (groupName) {
        if (!groupCalendars.has(groupName)) {
          groupCalendars.set(groupName, []);
        }
        groupCalendars.get(groupName).push(cal);
        Logger.log(`  ✅ ${groupName}のカレンダーを検出: ${calName}`);
      }
    });
    
    Logger.log(`\n🔍 検索対象カレンダー:`);
    Logger.log(`  - 平松さんのカレンダー: ${hiramatsuCalendars.length}個`);
    Logger.log(`  - リソースカレンダー: ${resourceCalendars.length}個`);
    groupCalendars.forEach((cals, groupName) => {
      Logger.log(`  - ${groupName}のカレンダー: ${cals.length}個`);
    });
    
    if (hiramatsuCalendars.length === 0 && resourceCalendars.length === 0 && groupCalendars.size === 0) {
      Logger.log(`⚠️ 検索対象のカレンダーが見つかりませんでした`);
      return;
    }
    
    // 予約一覧のデータを取得
    const dataRange = eventsSheet.getRange(
      sheets.events.rows.FIRST,
      1,
      lastRow - sheets.events.rows.FIRST + 1,
      sheets.events.columns.STATUS
    );
    const data = dataRange.getValues();
    
    let processedCount = 0;
    let matchedCount = 0;
    let notFoundCount = 0;
    
    Logger.log(`📋 データ行数: ${data.length}`);
    
    // 各行を処理
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = sheets.events.rows.FIRST + i;
      
      const courseId = row[sheets.events.columns.COURSE_ID - 1];
      const courseName = row[sheets.events.columns.COURSE_NAME - 1];
      const courseDetails = row[sheets.events.columns.COURSE_DETAILS - 1];
      const targetGroup = row[sheets.events.columns.TARGET_GROUP - 1];
      const courseDateRaw = row[sheets.events.columns.COURSE_DATE - 1];
      const startTimeRaw = row[sheets.events.columns.COURSE_START_TIME - 1];
      const endTimeRaw = row[sheets.events.columns.COURSE_END_TIME - 1];
      const location = row[sheets.events.columns.LOCATION - 1];
      const eventId = row[sheets.events.columns.EVENT_ID - 1];
      const status = row[sheets.events.columns.STATUS - 1];
      
      // eventIdが既に設定されている場合はスキップ
      if (eventId && eventId.toString().trim() !== '') {
        if (i < 10) {
          Logger.log(`  ⏭️  行${rowNum}: eventIdが既に設定済み (${eventId})`);
        }
        continue;
      }
      
      // 必須フィールドのチェック
      if (!courseName || !courseDateRaw || !startTimeRaw || !endTimeRaw) {
        if (i < 10) {
          Logger.log(`  ⏭️  行${rowNum}: 必須フィールドが不足 (courseName: ${courseName || '(空)'}, courseDate: ${courseDateRaw || '(空)'}, startTime: ${startTimeRaw || '(空)'}, endTime: ${endTimeRaw || '(空)'})`);
        }
        continue;
      }
      
      // 日付・時刻の型チェック（Dateオブジェクトまたは文字列/数値から変換可能な値）
      let courseDate = courseDateRaw;
      let startTime = startTimeRaw;
      let endTime = endTimeRaw;
      
      // Dateオブジェクトでない場合は変換を試みる
      if (!(courseDateRaw instanceof Date)) {
        courseDate = new Date(courseDateRaw);
        if (isNaN(courseDate.getTime())) {
          if (i < 10) {
            Logger.log(`  ⏭️  行${rowNum}: 日程が無効な日付形式 (${courseDateRaw}, 型: ${typeof courseDateRaw})`);
          }
          continue;
        }
      }
      
      if (!(startTimeRaw instanceof Date)) {
        startTime = new Date(startTimeRaw);
        if (isNaN(startTime.getTime())) {
          if (i < 10) {
            Logger.log(`  ⏭️  行${rowNum}: 開始時刻が無効な日付形式 (${startTimeRaw}, 型: ${typeof startTimeRaw})`);
          }
          continue;
        }
      }
      
      if (!(endTimeRaw instanceof Date)) {
        endTime = new Date(endTimeRaw);
        if (isNaN(endTime.getTime())) {
          if (i < 10) {
            Logger.log(`  ⏭️  行${rowNum}: 終了時刻が無効な日付形式 (${endTimeRaw}, 型: ${typeof endTimeRaw})`);
          }
          continue;
        }
      }
      
      // デバッグ: 最初の数行について詳細をログ出力
      if (i < 5) {
        Logger.log(`  ✅ 行${rowNum}: 処理開始 - ${courseName} (${courseDate}, ${startTime}, ${endTime})`);
      }
      
      processedCount++;
      
      // 日時を構築
      const constructDate = (date, time) => {
        // dateが日付のみの場合、timeから時刻を取得
        // timeが時刻のみの場合、dateから日付を取得
        const datePart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const timePart = new Date(time);
        
        // 時刻部分を取得（時・分のみ）
        const hours = timePart.getHours();
        const minutes = timePart.getMinutes();
        
        // 日付と時刻を結合
        return new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), hours, minutes, 0);
      };
      
      const courseStart = constructDate(courseDate, startTime);
      const courseEnd = constructDate(courseDate, endTime);
      
      Logger.log(`\n📝 行${rowNum}を処理中: ${courseName} (${courseStart})`);
      
      // targetGroupに基づいて該当するカレンダーを先に判定
      let searchOrder = [];
      if (targetGroup && targetGroup.toString().trim() !== '') {
        const groupName = targetGroup.toString().trim();
        const groupCals = groupCalendars.get(groupName);
        
        if (groupCals && groupCals.length > 0) {
          // N期生のカレンダーが存在する場合は、そのカレンダーのみを検索対象とする
          searchOrder = [...hiramatsuCalendars, ...groupCals, ...resourceCalendars];
          Logger.log(`  📋 対象グループ: ${groupName} → ${groupCals.length}個のカレンダーを検索対象`);
        } else {
          // N期生のカレンダーが存在しない場合は、該当するカレンダーがないためスキップ
          Logger.log(`  ⏭️  行${rowNum}: ${groupName}のカレンダーが見つかりません。スキップします。`);
          notFoundCount++;
          continue;
        }
      } else {
        // targetGroupが設定されていない場合は、平松さんのカレンダーとリソースカレンダーのみを検索
        searchOrder = [...hiramatsuCalendars, ...resourceCalendars];
        Logger.log(`  📋 対象グループ未設定 → 平松さんのカレンダーとリソースカレンダーを検索`);
      }
      
      // 検索範囲: 開始時刻の前後1時間以内
      const searchStart = new Date(courseStart.getTime() - 60 * 60 * 1000);
      const searchEnd = new Date(courseEnd.getTime() + 60 * 60 * 1000);
      
      let foundEvent = null;
      let foundCalendar = null;
      
      // すべてのカレンダーから検索（平松さんのカレンダーを優先）
      Logger.log(`  🔍 検索条件: タイトル「${courseName}」、日時「${courseStart} ~ ${courseEnd}」、場所「${location || '(未設定)'}」`);
      
      for (let calIdx = 0; calIdx < searchOrder.length; calIdx++) {
        const cal = searchOrder[calIdx];
        const isResourceCalendar = resourceCalendars.includes(cal);
        const isGroupCalendar = targetGroup && groupCalendars.has(targetGroup.toString().trim()) && 
                                groupCalendars.get(targetGroup.toString().trim()).includes(cal);
        
        try {
          const events = cal.getEvents(searchStart, searchEnd);
          if (!isResourceCalendar) {
            Logger.log(`  📅 カレンダー「${cal.getName()}」から${events.length}件のイベントを取得`);
          }
          
          for (let evtIdx = 0; evtIdx < events.length; evtIdx++) {
            const event = events[evtIdx];
            const eventTitle = event.getTitle() || '';
            const eventStart = event.getStartTime();
            const eventEnd = event.getEndTime();
            const eventLocation = event.getLocation() || '';
            
            if (!isResourceCalendar) {
              Logger.log(`    📋 イベント${evtIdx + 1}: 「${eventTitle}」 (${eventStart} ~ ${eventEnd}, 場所: ${eventLocation || '(未設定)'})`);
            }
            
            // タイトルが空のイベントはスキップ
            if (!eventTitle || eventTitle.trim() === '') {
              if (!isResourceCalendar) {
                Logger.log(`      ⏭️  タイトルが空のためスキップ`);
              }
              continue;
            }
            
            // タイトルマッチング（プレフィックスを除去して比較）
            const eventTitleClean = eventTitle
              .replace(/^【.*?】\s*/, '')
              .replace(/^\[.*?\]\s*/, '')
              .trim();
            const courseNameClean = courseName
              .replace(/^【.*?】\s*/, '')
              .replace(/^\[.*?\]\s*/, '')
              .trim();
            
            if (!isResourceCalendar) {
              Logger.log(`      タイトル比較: 「${eventTitleClean}」 vs 「${courseNameClean}」`);
            }
            
            // タイトルマッチングを厳格化（完全一致または包含関係をチェック）
            const titleMatch = eventTitle.includes(courseName) ||
                              eventTitle.includes(courseNameClean) ||
                              courseName.includes(eventTitleClean) ||
                              courseNameClean.includes(eventTitleClean) ||
                              // コース名の主要キーワードが含まれているかチェック
                              (courseNameClean.length > 3 && eventTitleClean.includes(courseNameClean.substring(0, Math.min(5, courseNameClean.length))));
            
            // タイトルが一致しない場合はスキップ
            if (!titleMatch) {
              if (!isResourceCalendar) {
                Logger.log(`      ⏭️  タイトルが一致しないためスキップ`);
              }
              continue;
            }
            
            if (!isResourceCalendar) {
              Logger.log(`      ✅ タイトル一致`);
            }
            
            // 日時マッチング（開始時刻のみをチェック、5分以内の誤差を許容）
            const startTimeDiff = Math.abs(eventStart.getTime() - courseStart.getTime());
            const timeMatch = startTimeDiff < 5 * 60 * 1000;
            
            if (!isResourceCalendar) {
              Logger.log(`      日時比較: 開始時刻差 ${Math.round(startTimeDiff / 1000 / 60)}分`);
            }
            
            if (!timeMatch) {
              if (!isResourceCalendar) {
                Logger.log(`      ⏭️  開始時刻が一致しないためスキップ`);
              }
              continue;
            }
            
            if (!isResourceCalendar) {
              Logger.log(`      ✅ 開始時刻一致`);
            }
            
            // 場所マッチング（場所が設定されている場合）
            let locationMatch = true;
            if (location && location.toString().trim() !== '') {
              if (eventLocation && eventLocation.toString().trim() !== '') {
                const locationStr = location.toString().trim();
                const eventLocationStr = eventLocation.toString().trim();
                
                // 場所名から主要キーワードを抽出（例: "ISLAND(39F)" → ["ISLAND", "39"]）
                const extractKeywords = (str) => {
                  // 括弧内の数字を抽出（例: "(39F)" → "39"）
                  const numbers = str.match(/\d+/g) || [];
                  // アルファベットの大文字部分を抽出（例: "ISLAND" → "ISLAND"）
                  const words = str.match(/[A-Z]+/g) || [];
                  // 日本語の階数表記を抽出（例: "39階" → "39"）
                  const floorNumbers = str.match(/(\d+)階/g) || [];
                  floorNumbers.forEach(f => {
                    const num = f.match(/\d+/);
                    if (num) numbers.push(num[0]);
                  });
                  return {
                    numbers: [...new Set(numbers)],
                    words: [...new Set(words.map(w => w.toUpperCase()))]
                  };
                };
                
                const locationKeywords = extractKeywords(locationStr);
                const eventKeywords = extractKeywords(eventLocationStr);
                
                // 数字が一致するかチェック（例: "39" が両方に含まれる）
                const numberMatch = locationKeywords.numbers.length === 0 || 
                                   eventKeywords.numbers.length === 0 ||
                                   locationKeywords.numbers.some(n => eventKeywords.numbers.includes(n));
                
                // キーワードが一致するかチェック（例: "ISLAND" が両方に含まれる）
                const wordMatch = locationKeywords.words.length === 0 ||
                                 eventKeywords.words.length === 0 ||
                                 locationKeywords.words.some(w => eventKeywords.words.includes(w)) ||
                                 // 部分一致もチェック（例: "ISLAND" が "本社-39-(社内)ISLAND" に含まれる）
                                 locationKeywords.words.some(w => eventLocationStr.toUpperCase().includes(w)) ||
                                 eventKeywords.words.some(w => locationStr.toUpperCase().includes(w));
                
                // 完全一致または包含関係もチェック
                const fullMatch = eventLocationStr.includes(locationStr) ||
                                 locationStr.includes(eventLocationStr) ||
                                 eventLocationStr.toLowerCase().includes(locationStr.toLowerCase()) ||
                                 locationStr.toLowerCase().includes(eventLocationStr.toLowerCase());
                
                locationMatch = fullMatch || (numberMatch && wordMatch);
                
                if (!isResourceCalendar) {
                  Logger.log(`      場所比較: 「${eventLocationStr}」 vs 「${locationStr}」`);
                  Logger.log(`        数字マッチ: ${numberMatch} (${locationKeywords.numbers.join(',')} vs ${eventKeywords.numbers.join(',')})`);
                  Logger.log(`        キーワードマッチ: ${wordMatch} (${locationKeywords.words.join(',')} vs ${eventKeywords.words.join(',')})`);
                  Logger.log(`        完全一致: ${fullMatch}`);
                  Logger.log(`        → ${locationMatch ? '一致' : '不一致'}`);
                }
              } else {
                // 予約一覧に場所が設定されているが、イベントに場所が設定されていない場合は不一致
                locationMatch = false;
                if (!isResourceCalendar) {
                  Logger.log(`      ⏭️  イベントに場所が設定されていないため不一致`);
                }
              }
            } else {
              if (!isResourceCalendar) {
                Logger.log(`      ℹ️  場所のチェックはスキップ（予約一覧に場所が未設定）`);
              }
            }
            
            if (titleMatch && timeMatch && locationMatch) {
              foundEvent = event;
              foundCalendar = cal;
              Logger.log(`  ✅ 既存イベントを発見: ${cal.getName()} - ${eventTitle}`);
              Logger.log(`     日時: ${eventStart} ~ ${eventEnd}`);
              Logger.log(`     場所: ${eventLocation || '(未設定)'}`);
              break;
            } else {
              if (!isResourceCalendar) {
                Logger.log(`      ⏭️  マッチ条件を満たさない（タイトル: ${titleMatch}, 開始時刻: ${timeMatch}, 場所: ${locationMatch}）`);
              }
            }
          }
          
          if (foundEvent) {
            break;
          }
        } catch (calError) {
          if (!isResourceCalendar) {
            Logger.log(`  ⚠️ カレンダー「${cal.getName()}」の検索中にエラー: ${calError.message}`);
          }
          continue;
        }
      }
      
      if (!foundEvent) {
        // targetGroupが設定されている場合、該当するカレンダーにイベントが見つからなかった場合は無効としてスキップ
        if (targetGroup && targetGroup.toString().trim() !== '') {
          const groupName = targetGroup.toString().trim();
          const groupCals = groupCalendars.get(groupName);
          if (groupCals && groupCals.length > 0) {
            Logger.log(`  ⚠️ ${groupName}のカレンダーに該当するイベントが見つかりませんでした。スキップします。`);
            notFoundCount++;
            continue;
          }
        }
        Logger.log(`  ⚠️ 既存イベントが見つかりませんでした`);
      }
      
      if (foundEvent) {
        // 既存イベントのeventIdを設定
        const eventIdValue = foundEvent.getId().split("@")[0];
        eventsSheet.getRange(rowNum, sheets.events.columns.EVENT_ID).setValue(eventIdValue);
        matchedCount++;
        Logger.log(`  ✅ eventIdを設定しました: ${eventIdValue}`);
      } else {
        // 既存イベントが見つからない場合はスキップ（新規作成しない）
        notFoundCount++;
        Logger.log(`  ⚠️ 既存イベントが見つかりませんでした。eventIdは設定されません。`);
        Logger.log(`     → 平松さんのカレンダーまたはリソースカレンダーに該当するイベントが存在するか確認してください。`);
      }
    }
    
    Logger.log('\n=== syncExistingCalendarEvents: 完了 ===');
    Logger.log(`📊 処理結果:`);
    Logger.log(`  - 処理対象: ${processedCount}件`);
    Logger.log(`  - 既存イベントにマッチ: ${matchedCount}件`);
    Logger.log(`  - 既存イベントが見つからず: ${notFoundCount}件`);
    
  } catch (error) {
    Logger.log(`❌ syncExistingCalendarEvents: エラーが発生しました`);
    Logger.log(`エラーメッセージ: ${error.message}`);
    Logger.log(`スタックトレース: ${error.stack}`);
    throw error;
  }
}
