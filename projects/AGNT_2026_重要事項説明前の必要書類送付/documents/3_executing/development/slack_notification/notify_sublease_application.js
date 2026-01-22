/**
 * サブリース物件の申込通知スクリプト
 * 
 * 機能:
 * - 15分おきにスプレッドシートをチェックし、新しい申込があった場合、サブリース物件（STATUS=申込 かつ CURRENT_SITUATION=サブリース中）のみSlack通知
 * - 通知内容: 物件名（BUILDING_NAME + ROOM_NUMBER）、契約予定日（CLOSED_DATE）、SUPPLIER ARTICLE IDのURL、RENTAL_CONTRACT_TYPE
 * - 通知後、Slackの特定チャンネルからデータを検索してスレッドに投稿
 * 
 * 設定方法:
 * 1. スクリプトプロパティに以下を設定:
 *    - SLACK_WEBHOOK_URL: Slack Webhook URL（メイン通知用）
 *    - SLACK_BOT_TOKEN: Slack Bot Token（スレッド投稿・検索用、xoxb-で始まる）
 *    - SLACK_CHANNEL_ID: 通知先チャンネルID（C08V2C9HGKFなど）
 *    - SLACK_SEARCH_CHANNEL_ID: 検索対象チャンネルID（オプション、未設定の場合は通知先チャンネルを検索）
 * 2. setupTimeBasedTrigger() 関数を実行して15分おきのトリガーを設定
 */

/**
 * 15分おきに実行されるメイン関数
 */
function checkNewSubleaseApplicationsPeriodically() {
  var webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
  checkNewSubleaseApplicationsPeriodicallyWithWebhook(webhookUrl);
}

/**
 * 手動実行用テスト関数（テスト用Webhook URLで実行）
 * 実行後は削除してください
 */
function testManualExecution() {
  var testWebhookUrl = 'PropertiesService.getScriptProperties().getProperty("TEST_SLACK_WEBHOOK_URL")';
  Logger.log('📤 手動実行テスト開始（テスト用Webhook URL）');
  checkNewSubleaseApplicationsPeriodicallyWithWebhook(testWebhookUrl);
}

/**
 * 指定されたWebhook URLで定期チェックを実行
 */
function checkNewSubleaseApplicationsPeriodicallyWithWebhook(webhookUrl) {
  checkNewSubleaseApplicationsPeriodicallyWithWebhookInternal(webhookUrl, false);
}

/**
 * 内部実装: 指定されたWebhook URLで定期チェックを実行
 * @param {string} webhookUrl - Slack Webhook URL
 * @param {boolean} isTest - テスト実行かどうか（trueの場合、varシートを更新しない）
 */
function checkNewSubleaseApplicationsPeriodicallyWithWebhookInternal(webhookUrl, isTest) {
  var spreadsheetId = '1JrKqewme3RwAYYb3ESWD6Oh_dGu8F769wcWowQaFXIo';
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
  // varシートを取得（存在しない場合は作成）
  var varSheet = spreadsheet.getSheetByName('var');
  if (!varSheet) {
    varSheet = spreadsheet.insertSheet('var');
    varSheet.getRange(1, 1).setValue('最終CONTRACT_ID');
    varSheet.getRange(2, 1).setValue('保存場所: B2');
  }
  
  // 前回実行時の最終CONTRACT_IDを取得
  var lastContractId = varSheet.getRange(2, 2).getValue();
  
  checkNewSubleaseApplicationsPeriodicallyWithWebhookInternalWithStartId(webhookUrl, isTest, lastContractId);
}

/**
 * 内部実装: 指定された開始CONTRACT_IDから定期チェックを実行
 * @param {string} webhookUrl - Slack Webhook URL
 * @param {boolean} isTest - テスト実行かどうか（trueの場合、varシートを更新しない）
 * @param {number} startContractId - 開始CONTRACT_ID（nullの場合は初回実行として扱う）
 */
function checkNewSubleaseApplicationsPeriodicallyWithWebhookInternalWithStartId(webhookUrl, isTest, startContractId) {
  try {
    Logger.log('=== サブリース物件チェック開始 ===');
    
    var spreadsheetId = '1JrKqewme3RwAYYb3ESWD6Oh_dGu8F769wcWowQaFXIo';
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // データシートを取得（import_from_toroccoシート）
    var dataSheet = spreadsheet.getSheetByName('import_from_torocco');
    if (!dataSheet) {
      Logger.log('❌ エラー: データシート「import_from_torocco」が見つかりません');
      return;
    }
    
    // varシートを取得（存在しない場合は作成）
    var varSheet = spreadsheet.getSheetByName('var');
    if (!varSheet) {
      varSheet = spreadsheet.insertSheet('var');
      varSheet.getRange(1, 1).setValue('最終CONTRACT_ID');
      varSheet.getRange(2, 1).setValue('保存場所: B2');
    }
    
    // 開始CONTRACT_IDを設定
    var lastContractId = startContractId;
    
    var lastRow = dataSheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('データがありません');
      return;
    }
    
    // ヘッダー行を取得
    var headerRow = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn()).getValues()[0];
    
    // CONTRACT_ID列のインデックスを確認
    var contractIdIndex = -1;
    for (var h = 0; h < headerRow.length; h++) {
      var colName = String(headerRow[h] || '').trim();
      if (colName === 'CONTRACT_ID' || colName === 'Contract ID' || colName === 'contract_id' || colName === 'CONTRACT ID') {
        contractIdIndex = h;
        break;
      }
    }
    
    if (contractIdIndex === -1) {
      Logger.log('❌ エラー: CONTRACT_ID列が見つかりません');
      return;
    }
    
    var notifiedCount = 0;
    var checkedCount = 0;
    var maxContractId = lastContractId || 0;
    
    // デバッグ用カウンター
    var skippedByContractId = 0;
    var skippedByOrderedDate = 0;
    var skippedByStatus = 0;
    var processedContractIds = [];
    var firstFewContractIds = [];
    
    Logger.log('前回の最終CONTRACT_ID: ' + (lastContractId || '（初回実行）'));
    
    // 効率化: 降順なので、上から順に処理し、最終ID以下の行が見つかったら終了
    // 最大1000行までチェック（必要に応じて調整可能）
    var maxRowsToCheck = 1000;
    var startRow = 2;
    var endRow = Math.min(startRow + maxRowsToCheck - 1, lastRow);
    var rowsToCheck = endRow - startRow + 1;
    
    Logger.log('チェック対象行数: ' + rowsToCheck + '行（最大' + maxRowsToCheck + '行まで）');
    
    // 必要な範囲だけを取得
    var dataRange = dataSheet.getRange(startRow, 1, rowsToCheck, dataSheet.getLastColumn());
    var values = dataRange.getValues();
    
    // 最初の10件のCONTRACT_IDを確認（デバッグ用）
    for (var d = 0; d < Math.min(10, values.length); d++) {
      var debugRow = values[d];
      var debugContractId = null;
      if (contractIdIndex >= 0 && contractIdIndex < debugRow.length) {
        debugContractId = debugRow[contractIdIndex];
      }
      if (debugContractId !== null && debugContractId !== undefined && debugContractId !== '' && typeof debugContractId === 'number') {
        firstFewContractIds.push(debugContractId);
      }
    }
    if (firstFewContractIds.length > 0) {
      Logger.log('最初の10件のCONTRACT_ID: ' + firstFewContractIds.join(', '));
    }
    
    // 各行をチェック（CONTRACT_IDは降順なので、上から順に処理）
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var rowNumber = i + startRow;
      
      // CONTRACT_IDを取得（直接インデックスで取得）
      var contractId = null;
      if (contractIdIndex >= 0 && contractIdIndex < row.length) {
        contractId = row[contractIdIndex];
      } else {
        // フォールバック: getColumnValueを使用
        contractId = getColumnValue(row, 'CONTRACT_ID', dataSheet);
      }
      
      if (contractId === null || contractId === undefined || contractId === '' || typeof contractId !== 'number') {
        continue;
      }
      
      // CONTRACT_IDが最終ID以下の場合はスキップ（降順でないため、全ての行をチェックする必要がある）
      if (lastContractId && contractId <= lastContractId) {
        skippedByContractId++;
        continue; // この行はスキップして次の行をチェック
      }
      
      processedContractIds.push(contractId);
      
      // ORDERED_DATE_FROM_NOTIFICATIONを取得
      var orderedDate = getColumnValue(row, 'ORDERED_DATE_FROM_NOTIFICATION', dataSheet);
      if (!orderedDate) {
        skippedByOrderedDate++;
        if (contractId > maxContractId) {
          maxContractId = contractId;
        }
        continue;
      }
      
      // 日付をDateオブジェクトに変換
      var orderedDateObj = null;
      if (orderedDate instanceof Date) {
        orderedDateObj = orderedDate;
      } else if (typeof orderedDate === 'string') {
        orderedDateObj = new Date(orderedDate);
        if (isNaN(orderedDateObj.getTime())) {
          skippedByOrderedDate++;
          if (contractId > maxContractId) {
            maxContractId = contractId;
          }
          continue;
        }
      } else {
        skippedByOrderedDate++;
        if (contractId > maxContractId) {
          maxContractId = contractId;
        }
        continue;
      }
      
      // 昨日の日付を取得（時刻は00:00:00）
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      // ORDERED_DATE_FROM_NOTIFICATIONが昨日以降かチェック
      var orderedDateOnly = new Date(orderedDateObj);
      orderedDateOnly.setHours(0, 0, 0, 0);
      
      if (orderedDateOnly < yesterday) {
        skippedByOrderedDate++;
        if (contractId > maxContractId) {
          maxContractId = contractId;
        }
        continue;
      }
      
      // STATUSが「申込」かつCURRENT_SITUATIONが「サブリース中」かチェック
      var status = getColumnValue(row, 'STATUS', dataSheet);
      var currentSituation = getColumnValue(row, 'CURRENT_SITUATION', dataSheet);
      
      if (status !== '申込' || currentSituation !== 'サブリース中') {
        skippedByStatus++;
        if (contractId > maxContractId) {
          maxContractId = contractId;
        }
        continue;
      }
      
      checkedCount++;
      
      // 通知を送信
      var success = sendSubleaseNotificationWithWebhook(row, dataSheet, rowNumber, webhookUrl);
      
      if (success) {
        notifiedCount++;
      }
      
      if (contractId > maxContractId) {
        maxContractId = contractId;
      }
    }
    
    // varシートのB2セルに最終CONTRACT_IDを保存（テスト実行時は更新しない）
    if (!isTest && maxContractId > (lastContractId || 0)) {
      varSheet.getRange(2, 2).setValue(maxContractId);
    }
    
    Logger.log('=== チェック完了 ===');
    Logger.log('通知送信: ' + notifiedCount + '件');
    Logger.log('フィルタリング詳細:');
    Logger.log('  - CONTRACT_ID条件でスキップ: ' + skippedByContractId + '件');
    Logger.log('  - ORDERED_DATE条件でスキップ: ' + skippedByOrderedDate + '件');
    Logger.log('  - STATUS/CURRENT_SITUATION条件でスキップ: ' + skippedByStatus + '件');
    if (processedContractIds.length > 0) {
      Logger.log('処理したCONTRACT_ID範囲: ' + Math.min.apply(null, processedContractIds) + ' ～ ' + Math.max.apply(null, processedContractIds));
    }
    if (maxContractId > (lastContractId || 0)) {
      Logger.log('最大CONTRACT_ID: ' + maxContractId + (isTest ? ' (テストモードのため未保存)' : ''));
    }
    
  } catch (error) {
    Logger.log('❌ エラーが発生しました: ' + error.toString());
    Logger.log('スタック: ' + error.stack);
  }
}

/**
 * サブリース物件の通知を送信（指定されたWebhook URLを使用）
 */
function sendSubleaseNotificationWithWebhook(rowData, sheet, rowNumber, webhookUrl) {
  try {
    // 物件名: BUILDING_NAMEとROOM_NUMBERを結合
    var buildingName = getColumnValue(rowData, 'BUILDING_NAME', sheet) || '';
    var roomNumber = getColumnValue(rowData, 'ROOM_NUMBER', sheet) || '';
    var propertyName = '';
    if (buildingName && roomNumber) {
      propertyName = buildingName + ' ' + roomNumber;
    } else if (buildingName) {
      propertyName = buildingName;
    } else if (roomNumber) {
      propertyName = roomNumber;
    } else {
      propertyName = getColumnValue(rowData, '物件名', sheet) || getColumnValue(rowData, 'PROPERTY_NAME', sheet) || '（物件名不明）';
    }
    
    // CONTRACT_IDを取得
    var contractId = getColumnValue(rowData, 'CONTRACT_ID', sheet);
    
    // 契約予定日を取得（未設定の場合はnull）
    var closedDate = getColumnValue(rowData, 'CLOSED_DATE', sheet) || getColumnValue(rowData, '契約予定日', sheet);
    var formattedDate = null;
    if (closedDate) {
      formattedDate = formatDate(closedDate);
      // 「（未設定）」の場合はnullにする
      if (formattedDate === '（未設定）') {
        formattedDate = null;
      }
    }
    
    var supplierArticleId = getColumnValue(rowData, 'SUPPLIER_ARTICLE_ID', sheet) || getColumnValue(rowData, 'SUPPLIER ARTICLE ID', sheet) || '';
    var rentalContractType = getColumnValue(rowData, 'RENTAL_CONTRACT_TYPE', sheet) || getColumnValue(rowData, '賃貸契約種別', sheet) || '（未設定）';
    
    var supplierUrl = '';
    if (supplierArticleId) {
      supplierUrl = 'https://supplier.ga-tech.co.jp/articles/' + supplierArticleId + '/';
    } else {
      supplierUrl = '（SUPPLIER ARTICLE ID未設定）';
    }
    
    // AGNT URLを作成
    var agntUrl = '';
    if (contractId) {
      agntUrl = 'https://crm.ga-tech.co.jp/contracts/' + contractId;
    } else {
      agntUrl = '（CONTRACT_ID未設定）';
    }
    
    var message = createSlackMessage(propertyName, formattedDate, supplierUrl, rentalContractType, agntUrl);
    
    // Webhookでメイン通知を送信
    var success = sendSlackNotificationWithUrl(message, webhookUrl);
    
    if (success) {
      Logger.log('✅ 通知送信: ' + propertyName);
      
      // Slack Web APIでメイン通知を送信し、スレッドIDを取得
      var threadTs = sendSlackMessageWithAPI(message, propertyName);
      
      if (threadTs) {
        // スレッドに検索結果を投稿
        searchAndPostToThread(propertyName, buildingName, roomNumber, threadTs);
      }
    }
    
    return success;
  } catch (error) {
    Logger.log('通知送信エラー: ' + error.toString());
    Logger.log('スタック: ' + error.stack);
    return false;
  }
}

/**
 * 列名から値を取得
 */
function getColumnValue(rowData, columnName, sheet) {
  try {
    var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var columnIndex = -1;
    for (var i = 0; i < headerRow.length; i++) {
      if (headerRow[i] === columnName) {
        columnIndex = i;
        break;
      }
    }
    
    if (columnIndex === -1 || columnIndex >= rowData.length) {
      return null;
    }
    
    var value = rowData[columnIndex];
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    
    return value;
  } catch (error) {
    Logger.log('列値取得エラー (' + columnName + '): ' + error.toString());
    return null;
  }
}

/**
 * 日付をフォーマット（YYYY-MM-DD形式のみ）
 * @param {Date|string} dateValue - 日付値
 * @return {string|null} フォーマットされた日付（YYYY-MM-DD）、無効な場合はnull
 */
function formatDate(dateValue) {
  if (!dateValue) {
    return null;
  }
  
  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      return null;
    }
    var year = dateValue.getFullYear();
    var month = ('0' + (dateValue.getMonth() + 1)).slice(-2);
    var day = ('0' + dateValue.getDate()).slice(-2);
    return year + '-' + month + '-' + day;
  }
  
  if (typeof dateValue === 'string') {
    var dateMatch = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // 日付として解釈できない場合はnullを返す
    return null;
  }
  
  return null;
}

/**
 * Slackメッセージを作成
 * @param {string} propertyName - 物件名
 * @param {string|null} closedDate - 契約予定日（nullの場合は表示しない）
 * @param {string} supplierUrl - Supplier Article URL
 * @param {string} rentalContractType - 賃貸契約種別
 * @param {string} agntUrl - AGNT契約ページURL
 */
function createSlackMessage(propertyName, closedDate, supplierUrl, rentalContractType, agntUrl) {
  var fields = [
    {
      "type": "mrkdwn",
      "text": "*物件名:*\n" + propertyName
    }
  ];
  
  // 契約予定日が設定されている場合のみ追加
  if (closedDate) {
    fields.push({
      "type": "mrkdwn",
      "text": "*契約予定日:*\n" + closedDate
    });
  }
  
  fields.push({
    "type": "mrkdwn",
    "text": "*賃貸契約種別:*\n" + rentalContractType
  });
  
  fields.push({
    "type": "mrkdwn",
    "text": "*Supplier Article:*\n<" + supplierUrl + "|SUPPLIER URL>"
  });
  
  fields.push({
    "type": "mrkdwn",
    "text": "*AGNT契約ページ:*\n<" + agntUrl + "|AGNT URL>"
  });
  
  return {
    "text": "🏢 サブリース物件の申込が入りました",
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "🏢 サブリース物件の申込通知"
        }
      },
      {
        "type": "section",
        "fields": fields
      }
    ]
  };
}

/**
 * 指定されたWebhook URLでSlack通知を送信
 */
function sendSlackNotificationWithUrl(message, webhookUrl) {
  try {
    if (!webhookUrl) {
      Logger.log('❌ Webhook URLが指定されていません');
      return false;
    }
    
    var payload = JSON.stringify(message);
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(webhookUrl, options);
    var status = response.getResponseCode();
    var responseText = response.getContentText();
    
    if (status === 200 || responseText === 'ok') {
      return true;
    } else {
      Logger.log('❌ Slack通知送信失敗 status=' + status + ' body=' + responseText);
      return false;
    }
  } catch (error) {
    Logger.log('❌ Slack通知送信エラー: ' + error.toString());
    return false;
  }
}

/**
 * 15分おきの時間ベーストリガーを設定
 */
function setupTimeBasedTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var deletedCount = 0;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'checkNewSubleaseApplicationsPeriodically') {
        ScriptApp.deleteTrigger(triggers[i]);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      Logger.log('既存のトリガーを ' + deletedCount + ' 個削除しました');
    }
    
    ScriptApp.newTrigger('checkNewSubleaseApplicationsPeriodically')
      .timeBased()
      .everyMinutes(15)
      .create();
    
    Logger.log('✅ 15分おきのトリガーを設定しました');
    Logger.log('次回実行予定: 約15分後');
    
    var allTriggers = ScriptApp.getProjectTriggers();
    Logger.log('\n設定されているトリガー:');
    for (var i = 0; i < allTriggers.length; i++) {
      var trigger = allTriggers[i];
      Logger.log('- ' + trigger.getHandlerFunction() + ' (' + trigger.getEventType() + ')');
    }
    
    // varシートの確認
    var spreadsheetId = '1JrKqewme3RwAYYb3ESWD6Oh_dGu8F769wcWowQaFXIo';
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var varSheet = spreadsheet.getSheetByName('var');
    if (!varSheet) {
      varSheet = spreadsheet.insertSheet('var');
      varSheet.getRange(1, 1).setValue('最終CONTRACT_ID');
      varSheet.getRange(2, 1).setValue('保存場所: B2');
      Logger.log('varシートを作成しました');
    }
    
  } catch (error) {
    Logger.log('❌ トリガー設定エラー: ' + error.toString());
    Logger.log('スタック: ' + error.stack);
  }
}

/**
 * 時間ベーストリガーを削除
 */
function deleteTimeBasedTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var deletedCount = 0;
    
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'checkNewSubleaseApplicationsPeriodically') {
        ScriptApp.deleteTrigger(triggers[i]);
        deletedCount++;
      }
    }
    
    Logger.log('削除したトリガー数: ' + deletedCount);
    
    if (deletedCount === 0) {
      Logger.log('削除するトリガーが見つかりませんでした');
    }
  } catch (error) {
    Logger.log('❌ トリガー削除エラー: ' + error.toString());
  }
}

/**
 * Slack Web APIでメッセージを送信し、スレッドID（ts）を取得
 * @param {Object} message - Slackメッセージオブジェクト
 * @param {string} propertyName - 物件名（ログ用）
 * @return {string|null} スレッドID（ts）、失敗時はnull
 */
function sendSlackMessageWithAPI(message, propertyName) {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
    var channelId = PropertiesService.getScriptProperties().getProperty('SLACK_CHANNEL_ID');
    
    if (!botToken || !channelId) {
      Logger.log('⚠️ Slack Bot TokenまたはChannel IDが設定されていません。スレッド機能はスキップします。');
      return null;
    }
    
    // Slack Web APIでメッセージを送信
    var apiUrl = 'https://slack.com/api/chat.postMessage';
    var payload = {
      channel: channelId,
      text: message.text,
      blocks: message.blocks
    };
    
    var options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + botToken,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(apiUrl, options);
    var status = response.getResponseCode();
    var responseText = response.getContentText();
    var responseData = JSON.parse(responseText);
    
    if (status === 200 && responseData.ok) {
      var threadTs = responseData.ts;
      Logger.log('✅ スレッドID取得: ' + threadTs + ' (' + propertyName + ')');
      return threadTs;
    } else {
      Logger.log('❌ Slack API送信失敗: ' + responseData.error);
      return null;
    }
  } catch (error) {
    Logger.log('❌ Slack API送信エラー: ' + error.toString());
    return null;
  }
}

/**
 * Slackの特定チャンネルからデータを検索してスレッドに投稿
 * @param {string} propertyName - 物件名（検索キーワード）
 * @param {string} buildingName - 建物名（検索キーワード）
 * @param {string} roomNumber - 部屋番号（検索キーワード）
 * @param {string} threadTs - スレッドID（ts）
 */
function searchAndPostToThread(propertyName, buildingName, roomNumber, threadTs) {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
    var channelId = PropertiesService.getScriptProperties().getProperty('SLACK_CHANNEL_ID');
    var searchChannelId = PropertiesService.getScriptProperties().getProperty('SLACK_SEARCH_CHANNEL_ID') || channelId;
    
    if (!botToken || !threadTs) {
      Logger.log('⚠️ Slack Bot TokenまたはスレッドIDが設定されていません。検索機能はスキップします。');
      return;
    }
    
    // 検索キーワードを構築（物件名、建物名、部屋番号）
    var searchKeywords = [];
    if (buildingName) searchKeywords.push(buildingName);
    if (roomNumber) searchKeywords.push(roomNumber);
    if (propertyName && propertyName !== buildingName + ' ' + roomNumber) {
      searchKeywords.push(propertyName);
    }
    
    if (searchKeywords.length === 0) {
      Logger.log('⚠️ 検索キーワードがありません。検索をスキップします。');
      return;
    }
    
    // 検索クエリを構築（チャンネル指定 + キーワード）
    var query = 'in:' + searchChannelId + ' ' + searchKeywords.join(' ');
    
    // Slack Web APIで検索（GETリクエストでクエリパラメータを使用）
    var searchUrl = 'https://slack.com/api/search.messages';
    var searchApiUrl = searchUrl + '?query=' + encodeURIComponent(query) + '&count=5&sort=timestamp&sort_dir=desc';
    var searchResponse = UrlFetchApp.fetch(searchApiUrl, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + botToken
      },
      muteHttpExceptions: true
    });
    
    var searchStatus = searchResponse.getResponseCode();
    var searchResponseText = searchResponse.getContentText();
    var searchData = JSON.parse(searchResponseText);
    
    if (searchStatus === 200 && searchData.ok && searchData.messages && searchData.messages.matches) {
      var matches = searchData.messages.matches;
      
      if (matches.length > 0) {
        // 検索結果をスレッドに投稿
        var threadMessage = createSearchResultMessage(matches, searchKeywords);
        postToThread(threadMessage, channelId, threadTs, botToken);
      } else {
        Logger.log('📭 検索結果なし: ' + query);
      }
    } else {
      Logger.log('❌ Slack検索失敗: ' + (searchData.error || 'Unknown error'));
    }
  } catch (error) {
    Logger.log('❌ 検索・スレッド投稿エラー: ' + error.toString());
    Logger.log('スタック: ' + error.stack);
  }
}

/**
 * 検索結果メッセージを作成
 * @param {Array} matches - 検索結果のマッチリスト
 * @param {Array} keywords - 検索キーワード
 * @return {Object} Slackメッセージオブジェクト
 */
function createSearchResultMessage(matches, keywords) {
  var blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔍 関連情報'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*検索キーワード:* ' + keywords.join(', ')
      }
    }
  ];
  
  // 検索結果を追加（最大5件）
  var maxResults = Math.min(matches.length, 5);
  for (var i = 0; i < maxResults; i++) {
    var match = matches[i];
    var text = match.text || '';
    var timestamp = match.ts || '';
    var user = match.username || 'Unknown';
    var permalink = match.permalink || '';
    
    // テキストが長すぎる場合は切り詰め
    if (text.length > 200) {
      text = text.substring(0, 200) + '...';
    }
    
    var resultText = '';
    if (permalink) {
      resultText += '<' + permalink + '|メッセージ' + (i + 1) + '>\n';
    }
    resultText += '*投稿者:* ' + user + '\n';
    resultText += '*内容:* ' + text;
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: resultText
      }
    });
    
    if (i < maxResults - 1) {
      blocks.push({
        type: 'divider'
      });
    }
  }
  
  return {
    text: '🔍 関連情報が見つかりました（' + matches.length + '件）',
    blocks: blocks
  };
}

/**
 * スレッドにメッセージを投稿
 * @param {Object} message - Slackメッセージオブジェクト
 * @param {string} channelId - チャンネルID
 * @param {string} threadTs - スレッドID（ts）
 * @param {string} botToken - Bot Token
 */
function postToThread(message, channelId, threadTs, botToken) {
  try {
    var apiUrl = 'https://slack.com/api/chat.postMessage';
    var payload = {
      channel: channelId,
      thread_ts: threadTs,
      text: message.text,
      blocks: message.blocks
    };
    
    var options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + botToken,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(apiUrl, options);
    var status = response.getResponseCode();
    var responseText = response.getContentText();
    var responseData = JSON.parse(responseText);
    
    if (status === 200 && responseData.ok) {
      Logger.log('✅ スレッドに投稿完了');
    } else {
      Logger.log('❌ スレッド投稿失敗: ' + responseData.error);
    }
  } catch (error) {
    Logger.log('❌ スレッド投稿エラー: ' + error.toString());
  }
}
