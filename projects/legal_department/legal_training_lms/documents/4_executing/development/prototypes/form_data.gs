/**
 * ========================================
 * フォーム関連データ取得関数
 * ========================================
 */

/**
 * シートから予約可能な研修枠を取得
 * 指定されたスプレッドシートの「予約一覧」シートからデータを取得
 */
function form_getScheduledCourses() {
  const spreadsheet = form_openSourceSpreadsheet();
  if (!spreadsheet) {
    Logger.log('form_getScheduledCourses: スプレッドシートが取得できませんでした。');
    return [];
  }

  const sheet = spreadsheet.getSheetByName(form_getFormSheets().events.name);
  if (!sheet) {
    Logger.log(`form_getScheduledCourses: シートが見つかりません: ${form_getFormSheets().events.name}`);
    Logger.log('form_getScheduledCourses: 利用可能なシート名:', spreadsheet.getSheets().map(s => s.getName()));
    return [];
  }

  const lastRow = sheet.getLastRow();
  Logger.log(`form_getScheduledCourses: シート「${form_getFormSheets().events.name}」の最終行: ${lastRow}`);
  Logger.log(`form_getScheduledCourses: データ開始行: ${form_getFormSheets().events.rows.FIRST}`);

  if (lastRow < form_getFormSheets().events.rows.FIRST) {
    Logger.log('form_getScheduledCourses: データがありません。');
    return [];
  }

  const dataRows = lastRow - form_getFormSheets().events.rows.FIRST + 1;
  Logger.log(`form_getScheduledCourses: 取得するデータ行数: ${dataRows}`);

  const fetchRows = sheet
    .getRange(
      form_getFormSheets().events.rows.FIRST,
      1,
      dataRows,
      form_getFormSheets().events.columns.STATUS
    )
    .getValues();

  Logger.log(`form_getScheduledCourses: 取得した生データ行数: ${fetchRows.length}`);
  if (fetchRows.length > 0) {
    Logger.log(`form_getScheduledCourses: 最初の行のデータ: ${fetchRows[0]}`);
  }

  const utils = form_getUtilsInstance();
  let invalidCount = 0;
  const records = fetchRows
    .map((row, index) => {
      // 最初の5行について詳細ログを出力
      if (index < 5) {
        Logger.log(`form_getScheduledCourses: 行${index + form_getFormSheets().events.rows.FIRST} を処理中...`);
        Logger.log(`  courseId: ${row[form_getFormSheets().events.columns.COURSE_ID - 1]}`);
        Logger.log(`  courseName: ${row[form_getFormSheets().events.columns.COURSE_NAME - 1]}`);
        Logger.log(`  eventId: "${row[form_getFormSheets().events.columns.EVENT_ID - 1]}"`);
        Logger.log(`  rawDate: ${row[form_getFormSheets().events.columns.COURSE_DATE - 1]}`);
        Logger.log(`  rawStart: ${row[form_getFormSheets().events.columns.COURSE_START_TIME - 1]}`);
        Logger.log(`  rawEnd: ${row[form_getFormSheets().events.columns.COURSE_END_TIME - 1]}`);
      }
      
      const result = form_mapEventRow(row, utils, null, index);
      if (!result || !result.isValid) {
        invalidCount++;
        // 最初の5件だけログ出力（デバッグ用）
        if (invalidCount <= 5) {
          Logger.log(`form_getScheduledCourses: 行${index + form_getFormSheets().events.rows.FIRST} は無効: ${row.slice(0, 5).join(', ')}...`);
        }
      } else if (index < 5) {
        Logger.log(`form_getScheduledCourses: 行${index + form_getFormSheets().events.rows.FIRST} は有効`);
      }
      return result;
    })
    .filter((record) => record && record.isValid);

  if (invalidCount > 5) {
    Logger.log(`form_getScheduledCourses: 他に ${invalidCount - 5} 件の無効な行があります（ログ省略）`);
  }
  Logger.log(`form_getScheduledCourses: 有効な研修枠 = ${records.length} 件、無効な行 = ${invalidCount} 件`);
  return records;
}

function form_mapEventRow(row, utils, period, index) {
  // COURSE_CODEは存在しないので、COURSE_IDを使用
  // 列インデックスは0ベースなので、列番号から1を引く
  const courseId = row[form_getFormSheets().events.columns.COURSE_ID - 1];
  const courseName = row[form_getFormSheets().events.columns.COURSE_NAME - 1];
  const courseDetails = row[form_getFormSheets().events.columns.COURSE_DETAILS - 1];
  const targetGroup = row[form_getFormSheets().events.columns.TARGET_GROUP - 1];
  const rawDate = row[form_getFormSheets().events.columns.COURSE_DATE - 1];
  const rawStart = row[form_getFormSheets().events.columns.COURSE_START_TIME - 1];
  const rawEnd = row[form_getFormSheets().events.columns.COURSE_END_TIME - 1];
  const location = row[form_getFormSheets().events.columns.LOCATION - 1];
  const eventId = row[form_getFormSheets().events.columns.EVENT_ID - 1];
  const status = row[form_getFormSheets().events.columns.STATUS - 1];

  // デバッグ: 最初の5行についてのみログ出力
  const isDebugRow = (typeof index !== 'undefined' && index < 5);
  if (isDebugRow) {
    Logger.log(`form_mapEventRow[デバッグ行${index}]: courseId=${courseId}, courseName=${courseName}, targetGroup=${targetGroup}, rawDate=${rawDate}, rawStart=${rawStart}, rawEnd=${rawEnd}, location=${location}, eventId=${eventId}, status=${status}`);
  }
  
  // 必須フィールドのチェック
  if (!courseName || !rawDate || !rawStart || !rawEnd) {
    if (isDebugRow) {
      Logger.log(`form_mapEventRow: 必須フィールドが不足 (courseName: ${!!courseName}, rawDate: ${!!rawDate}, rawStart: ${!!rawStart}, rawEnd: ${!!rawEnd})`);
    }
    return null;
  }

  // 無効値のチェック
  if (form_getFormInvalidValues().has(courseName) || form_getFormInvalidValues().has(eventId)) {
    Logger.log(`form_mapEventRow: 無効値が検出されました (courseName: ${courseName}, eventId: ${eventId})`);
    return null;
  }

  // 日付と時刻をDateオブジェクトに変換
  const startTime = form_mergeDateAndTime(rawDate, rawStart);
  const endTime = form_mergeDateAndTime(rawDate, rawEnd);
  if (!startTime || !endTime) {
    Logger.log(`form_mapEventRow: 日時変換に失敗 (rawDate: ${rawDate}, rawStart: ${rawStart}, rawEnd: ${rawEnd})`);
    return null;
  }

  // eventId は直接使用（URLからの解析は不要）
  const processedEventId = eventId ? eventId.toString().trim() : '';
  
  // 期の情報を含めたコース名を作成（期の情報がある場合）
  const displayName = period ? `${courseName}（${period}）` : courseName;

  // 有効性の判定: eventIdが必須（カレンダーイベントに招待するために必要）
  // eventIdが空の場合は、フォームに表示しない（カレンダーイベントがまだ作成されていないため）
  const isValid = Boolean(processedEventId && processedEventId !== '');
  
  if (!isValid) {
    Logger.log(`form_mapEventRow: eventIdが空のため無効と判定 (courseName: ${courseName}, eventId: "${processedEventId}")`);
  }

  return {
    code: courseId, // COURSE_IDを使用
    name: courseName, // 元のコース名（検索・マッチング用）
    displayName: displayName, // 表示用のコース名（期の情報を含む）
    period: period || null, // 期の情報
    startTime,
    endTime,
    eventId: processedEventId || '', // eventIdが空の場合は空文字列
    location: courseDetails || '',
    status: status || '',
    isValid: isValid
  };
}

function form_mergeDateAndTime(datePart, timePart) {
  // 空の値チェック
  if (!datePart || !timePart) {
    return null;
  }

  // Dateオブジェクトに変換
  let dateObj = null;
  let timeObj = null;

  // datePartの処理
  if (datePart instanceof Date) {
    dateObj = datePart;
  } else if (typeof datePart === 'string' && datePart.trim() !== '') {
    // 文字列の場合、パースを試みる
    dateObj = new Date(datePart);
    if (isNaN(dateObj.getTime())) {
      return null;
    }
  } else if (typeof datePart === 'number') {
    // 数値（シリアル値）の場合
    dateObj = new Date((datePart - 25569) * 86400000); // Excelシリアル値から変換
  } else {
    return null;
  }

  // timePartの処理
  if (timePart instanceof Date) {
    // Dateオブジェクトの場合、時刻部分のみを抽出（日付部分は無視）
    // 1899年12月30日などの不正な日付が含まれている可能性があるため
    const hours = timePart.getHours();
    const minutes = timePart.getMinutes();
    const seconds = timePart.getSeconds();
    timeObj = new Date(1970, 0, 1, hours, minutes, seconds);
  } else if (typeof timePart === 'string' && timePart.trim() !== '') {
    // 文字列の場合、パースを試みる
    timeObj = new Date('1970-01-01T' + timePart + ':00');
    if (isNaN(timeObj.getTime())) {
      // HH:MM形式を試す
      const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        timeObj = new Date(1970, 0, 1, parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10));
      } else {
        return null;
      }
    }
  } else if (typeof timePart === 'number') {
    // 数値（シリアル値）の場合、時刻部分を抽出
    const timeSerial = timePart - Math.floor(timePart);
    const hours = Math.floor(timeSerial * 24);
    const minutes = Math.floor((timeSerial * 24 - hours) * 60);
    timeObj = new Date(1970, 0, 1, hours, minutes);
  } else {
    return null;
  }

  // 日付と時刻をマージ
  const merged = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    timeObj.getHours(),
    timeObj.getMinutes(),
    timeObj.getSeconds()
  );
  
  if (isNaN(merged.getTime())) {
    return null;
  }
  
  return merged;
}

function form_formatDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '-';
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd (E)');
}

function form_formatTime(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '--:--';
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'HH:mm');
}

function form_buildSessionChoiceLabel(session, utils) {
  const displayDate = form_formatDate(session.startTime);
  const displayStart = form_formatTime(session.startTime);
  const displayEnd = form_formatTime(session.endTime);
  const groupLabel = session.targetGroup ? `（${session.targetGroup}向け）` : '';

  let eventId = session.eventId;
  if (!eventId && session.eventUrl && session.eventUrl.indexOf('eid=') !== -1) {
    eventId = utils.eventIdFromURL(session.eventUrl);
  }

  // eventIdが空の場合はnullを返す（この関数が呼ばれる時点で、isValid=trueのものだけが渡されるはず）
  if (!eventId || eventId.trim() === '') {
    return null;
  }

  // 表示用のコース名を使用（期の情報を含む）
  const courseName = session.displayName || session.name;
  const locationLabel = session.location ? `場所: ${session.location}` : '場所: オンライン/未定';
  return `${displayDate} ${displayStart}〜${displayEnd} ${courseName}${groupLabel}\n${locationLabel}\n(id: ${eventId})`;
}

function form_isSessionAvailableForGroup(session, groupName) {
  // targetGroup が指定されている場合は一致するグループのみ表示
  const target = (session.targetGroup || '').toString().trim();
  if (target !== '') {
    return target === groupName;
  }

  // targetGroup が空の場合はコースIDからグループを判定
  const courseCode = (session.code || '').toString().trim();
  if (courseCode.startsWith('FY26-')) {
    const groupCode = courseCode.split('-')[1]; // FY26-XX-XX のXX部分を取得
    switch (groupCode) {
      case '01':
        return groupName === '1期生';
      case '02':
        return groupName === '2期生';
      case '03':
        return groupName === '3期生';
      default:
        // 不明なグループコードの場合は全てのグループで表示
        break;
    }
  }

  // それ以外の場合は全てのグループで表示（後方互換性）
  return true;
}

function form_findSelectedSessionResponse(itemResponses) {
  for (const response of itemResponses) {
    const title = response.getItem().getTitle();
    if (title === form_getFormConfiguration().steps[1].items[0].title) {
      return response.getResponse();
    }
  }
  return null;
}

// 後方互換性のためのエイリアス
function getScheduledCourses() { return form_getScheduledCourses(); }
function mapEventRow(row, utils, period, index) { return form_mapEventRow(row, utils, period, index); }
function mergeDateAndTime(datePart, timePart) { return form_mergeDateAndTime(datePart, timePart); }
function formatDate(date) { return form_formatDate(date); }
function formatTime(date) { return form_formatTime(date); }
function buildSessionChoiceLabel(session, utils) { return form_buildSessionChoiceLabel(session, utils); }
function isSessionAvailableForGroup(session, groupName) { return form_isSessionAvailableForGroup(session, groupName); }
function findSelectedSessionResponse(itemResponses) { return form_findSelectedSessionResponse(itemResponses); }
