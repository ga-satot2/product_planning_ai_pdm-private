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
 * 
 * 注意: テスト用Webhook URLはスクリプトプロパティの「TEST_SLACK_WEBHOOK_URL」から取得してください
 * テスト用チャンネルIDはスクリプトプロパティの「TEST_SLACK_CHANNEL_ID」から取得してください
 */
function testManualExecution() {
  var testWebhookUrl = PropertiesService.getScriptProperties().getProperty('TEST_SLACK_WEBHOOK_URL');
  var testChannelId = PropertiesService.getScriptProperties().getProperty('TEST_SLACK_CHANNEL_ID');
  
  if (!testWebhookUrl) {
    Logger.log('❌ テスト用Webhook URLが設定されていません。スクリプトプロパティに「TEST_SLACK_WEBHOOK_URL」を設定してください。');
    return;
  }
  
  Logger.log('📤 手動実行テスト開始（テスト用Webhook URL、テスト用チャンネルID: ' + (testChannelId || '未設定') + '）');
  
  // テスト用チャンネルIDを一時的に設定
  if (testChannelId) {
    PropertiesService.getScriptProperties().setProperty('SLACK_CHANNEL_ID_TEMP', testChannelId);
  }
  
  checkNewSubleaseApplicationsPeriodicallyWithWebhook(testWebhookUrl);
  
  // テスト完了後、一時的な設定を削除（コメントアウトしているので残ります）
  // PropertiesService.getScriptProperties().deleteProperty('SLACK_CHANNEL_ID_TEMP');
}

/**
 * テスト用: 指定したCONTRACT_IDからチェックを開始
 * @param {number} startContractId - 開始CONTRACT_ID（例: 43000）
 * 例: testFromContractId(43000)
 * 
 * 注意: テスト用Webhook URLはスクリプトプロパティの「TEST_SLACK_WEBHOOK_URL」から取得してください
 * テスト用チャンネルIDはスクリプトプロパティの「TEST_SLACK_CHANNEL_ID」から取得してください
 */
function testFromContractId(startContractId) {
  var testWebhookUrl = PropertiesService.getScriptProperties().getProperty('TEST_SLACK_WEBHOOK_URL');
  var testChannelId = PropertiesService.getScriptProperties().getProperty('TEST_SLACK_CHANNEL_ID');
  
  if (!testWebhookUrl) {
    Logger.log('❌ テスト用Webhook URLが設定されていません。スクリプトプロパティに「TEST_SLACK_WEBHOOK_URL」を設定してください。');
    return;
  }
  
  Logger.log('📤 テスト実行開始（開始CONTRACT_ID: ' + startContractId + '、varシートを更新しません）');
  
  // テスト用チャンネルIDを一時的に設定
  if (testChannelId) {
    PropertiesService.getScriptProperties().setProperty('SLACK_CHANNEL_ID_TEMP', testChannelId);
  }
  
  checkNewSubleaseApplicationsPeriodicallyWithWebhookInternalWithStartId(testWebhookUrl, true, startContractId);
  
  // テスト完了後、一時的な設定を削除（コメントアウトしているので残ります）
  // PropertiesService.getScriptProperties().deleteProperty('SLACK_CHANNEL_ID_TEMP');
}

/**
 * テスト用: CONTRACT_ID 43000からチェックを開始
 * この関数を実行すると、CONTRACT_ID 43000からチェックを開始します
 * 
 * 注意: テスト用チャンネルIDはスクリプトプロパティの「TEST_SLACK_CHANNEL_ID」から取得してください
 */
function testFrom43000() {
  // テスト用チャンネルIDを一時的に設定
  var testChannelId = PropertiesService.getScriptProperties().getProperty('TEST_SLACK_CHANNEL_ID');
  if (testChannelId) {
    PropertiesService.getScriptProperties().setProperty('SLACK_CHANNEL_ID_TEMP', testChannelId);
  }
  testFromContractId(43000);
}

/**
 * テスト用: CONTRACT_ID 43500からチェックを開始
 * この関数を実行すると、CONTRACT_ID 43500からチェックを開始します
 * 
 * 注意: テスト用チャンネルIDはスクリプトプロパティの「TEST_SLACK_CHANNEL_ID」から取得してください
 */
function testFrom43500() {
  // テスト用チャンネルIDを一時的に設定
  var testChannelId = PropertiesService.getScriptProperties().getProperty('TEST_SLACK_CHANNEL_ID');
  if (testChannelId) {
    PropertiesService.getScriptProperties().setProperty('SLACK_CHANNEL_ID_TEMP', testChannelId);
  }
  testFromContractId(43500);
}

/**
 * テスト用: CONTRACT_ID 44000からチェックを開始
 * この関数を実行すると、CONTRACT_ID 44000からチェックを開始します
 * 
 * 注意: テスト用チャンネルIDはスクリプトプロパティの「TEST_SLACK_CHANNEL_ID」から取得してください
 */
function testFrom44000() {
  // テスト用チャンネルIDを一時的に設定
  var testChannelId = PropertiesService.getScriptProperties().getProperty('TEST_SLACK_CHANNEL_ID');
  if (testChannelId) {
    PropertiesService.getScriptProperties().setProperty('SLACK_CHANNEL_ID_TEMP', testChannelId);
  }
  testFromContractId(44000);
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
    
    // 必要な範囲だけを取得
    var dataRange = dataSheet.getRange(startRow, 1, rowsToCheck, dataSheet.getLastColumn());
    var values = dataRange.getValues();
    
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
    
    // Slack Web APIでメイン通知を送信し、スレッドIDを取得（Webhookと重複しないように）
    var threadTs = sendSlackMessageWithAPI(message, propertyName);
    
    if (threadTs) {
      Logger.log('✅ 通知送信: ' + propertyName);
      
      // スレッドに検索結果を投稿
      searchAndPostToThread(propertyName, buildingName, roomNumber, threadTs);
      
      return true;
    } else {
      // Web APIが失敗した場合、Webhookで送信（フォールバック）
      var success = sendSlackNotificationWithUrl(message, webhookUrl);
      if (success) {
        Logger.log('✅ 通知送信（Webhook経由）: ' + propertyName);
      }
      return success;
    }
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
    // 本番実行時はSLACK_CHANNEL_IDのみを使用（SLACK_CHANNEL_ID_TEMPは無視）
    var channelId = PropertiesService.getScriptProperties().getProperty('SLACK_CHANNEL_ID');
    
    if (!botToken) {
      Logger.log('⚠️ Slack Bot Tokenが設定されていません。スレッド機能はスキップします。');
      return null;
    }
    
    if (!channelId) {
      Logger.log('⚠️ SLACK_CHANNEL_IDが設定されていません。スレッド機能はスキップします。');
      Logger.log('💡 設定方法: スクリプトプロパティに「SLACK_CHANNEL_ID」を追加してください（例: C08V2C9HGKF）');
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
      Logger.log('   設定されているChannel ID: ' + (channelId ? channelId : '（未設定）'));
      if (responseData.error === 'channel_not_found') {
        Logger.log('💡 チャンネルIDが正しくない可能性があります。以下を確認してください:');
        Logger.log('   1. チャンネルIDが正しいか（C08V2C9HGKF のような形式）');
        Logger.log('   2. Botがそのチャンネルに参加しているか');
        Logger.log('   3. Botに「chat:write」権限があるか');
      }
      return null;
    }
  } catch (error) {
    Logger.log('❌ Slack API送信エラー: ' + error.toString());
    Logger.log('スタック: ' + error.stack);
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
    // 本番実行時はSLACK_CHANNEL_IDのみを使用（SLACK_CHANNEL_ID_TEMPは無視）
    var channelId = PropertiesService.getScriptProperties().getProperty('SLACK_CHANNEL_ID');
    // 検索チャンネルIDも本番用のみを使用
    var searchChannelId = PropertiesService.getScriptProperties().getProperty('SLACK_SEARCH_CHANNEL_ID') || channelId;
    
    Logger.log('🔍 検索対象チャンネルID: ' + searchChannelId);
    
    if (!botToken || !threadTs) {
      Logger.log('⚠️ Slack Bot TokenまたはスレッドIDが設定されていません。検索機能はスキップします。');
      return;
    }
    
    // 検索機能が明示的に無効化されている場合はスキップ
    // （'false'が明示的に設定されている場合のみ。未設定やnullの場合は有効）
    var searchEnabled = PropertiesService.getScriptProperties().getProperty('SLACK_SEARCH_ENABLED');
    if (searchEnabled === 'false') {
      Logger.log('ℹ️ 検索機能は明示的に無効化されています。');
      Logger.log('💡 検索機能を再有効化するには、スクリプトプロパティの「SLACK_SEARCH_ENABLED」を削除するか、「true」に設定してください。');
      return;
    }
    
    // 検索キーワードを構築（物件名、建物名、部屋番号）
    // 部屋番号だけでは誤検知を防ぐため、建物名と部屋番号の組み合わせも追加
    var searchKeywords = [];
    var searchPhrases = []; // 完全一致フレーズ（建物名+部屋番号の組み合わせ）
    
    if (buildingName) {
      searchKeywords.push(buildingName);
    }
    if (roomNumber) {
      searchKeywords.push(roomNumber);
      // 建物名と部屋番号の組み合わせを追加
      if (buildingName) {
        searchPhrases.push(buildingName + ' ' + roomNumber);
        searchPhrases.push(buildingName + roomNumber); // スペースなしも試す
      }
    }
    if (propertyName && propertyName !== buildingName + ' ' + roomNumber) {
      searchKeywords.push(propertyName);
      searchPhrases.push(propertyName);
    }
    
    if (searchKeywords.length === 0) {
      Logger.log('⚠️ 検索キーワードがありません。検索をスキップします。');
      return;
    }
    
    
    // conversations.history APIを使用してチャンネルのメッセージを取得し、キーワードでフィルタリング
    // search.messages APIが使えない場合の代替方法
    // searchPhrasesも渡す（完全一致フレーズ検索用）
    var searchPhrases = [];
    if (buildingName && roomNumber) {
      searchPhrases.push(buildingName + ' ' + roomNumber);
      searchPhrases.push(buildingName + roomNumber);
    }
    if (propertyName && propertyName !== buildingName + ' ' + roomNumber) {
      searchPhrases.push(propertyName);
    }
    var matches = searchMessagesUsingHistory(searchChannelId, searchKeywords, botToken, searchPhrases);
    
    if (matches && matches.length > 0) {
      // 検索結果をスレッドに投稿（契約予定日があるもののみ）
      var threadMessage = createSearchResultMessage(matches, searchKeywords);
      if (threadMessage) {
        postToThread(threadMessage, channelId, threadTs, botToken);
      }
    } else {
      Logger.log('📭 検索結果なし（キーワード: ' + searchKeywords.join(', ') + '）');
    }
  } catch (error) {
    Logger.log('❌ 検索・スレッド投稿エラー: ' + error.toString());
    Logger.log('スタック: ' + error.stack);
  }
}

/**
 * conversations.history APIを使用してメッセージを検索
 * @param {string} channelId - チャンネルID
 * @param {Array} keywords - 検索キーワード配列
 * @param {string} botToken - Bot Token
 * @param {Array} searchPhrases - 完全一致フレーズ配列（オプション）
 * @return {Array} マッチしたメッセージの配列
 */
function searchMessagesUsingHistory(channelId, keywords, botToken, searchPhrases) {
  try {
    // conversations.history APIでメッセージを取得（ページネーション対応）
    var historyUrl = 'https://slack.com/api/conversations.history';
    var allMessages = [];
    var cursor = null;
    var maxPages = 1; // 1ページ（200件）のみ取得
    var pageCount = 0;
    
    // ページネーションでメッセージを取得
    do {
      var historyApiUrl = historyUrl + '?channel=' + encodeURIComponent(channelId) + '&limit=200'; // 1ページあたり200件
      if (cursor) {
        historyApiUrl += '&cursor=' + encodeURIComponent(cursor);
      }
      
      var historyResponse = UrlFetchApp.fetch(historyApiUrl, {
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + botToken
        },
        muteHttpExceptions: true
      });
      
      var historyStatus = historyResponse.getResponseCode();
      var historyResponseText = historyResponse.getContentText();
      var historyData = JSON.parse(historyResponseText);
      
      if (historyStatus !== 200 || !historyData.ok || !historyData.messages) {
        var errorMsg = historyData.error || 'Unknown error';
        Logger.log('⚠️ メッセージ取得失敗: ' + errorMsg);
        
        if (errorMsg === 'missing_scope') {
          Logger.log('💡 conversations.history APIを使用するには、以下のスコープが必要です:');
          Logger.log('   - channels:history（パブリックチャンネル用）');
          Logger.log('   - groups:history（プライベートチャンネル用）');
          Logger.log('   Slackアプリの「OAuth & Permissions」でスコープを追加し、アプリを再インストールしてください。');
        }
        break;
      }
      
      // メッセージを追加
      if (historyData.messages && historyData.messages.length > 0) {
        allMessages = allMessages.concat(historyData.messages);
      }
      
      // 次のページがあるかチェック
      cursor = historyData.response_metadata && historyData.response_metadata.next_cursor ? historyData.response_metadata.next_cursor : null;
      pageCount++;
      
      // マッチが5件見つかったら早期終了
      if (allMessages.length > 0) {
        var tempMatches = [];
        for (var checkI = 0; checkI < allMessages.length; checkI++) {
          var checkMsg = allMessages[checkI];
          var checkText = String(checkMsg.text || '');
          if (checkMsg.blocks) {
            var blocksText = extractTextFromBlocks(checkMsg.blocks);
            if (blocksText) {
              checkText = checkText ? (checkText + ' ' + blocksText) : blocksText;
            }
          }
          checkText = checkText.toLowerCase();
          
          for (var checkJ = 0; checkJ < keywords.length; checkJ++) {
            var checkKeyword = String(keywords[checkJ] || '').toLowerCase();
            if (checkKeyword && checkText.indexOf(checkKeyword) !== -1) {
              tempMatches.push(checkMsg);
              break;
            }
          }
          if (tempMatches.length >= 5) {
            break;
          }
        }
        if (tempMatches.length >= 5) {
          Logger.log('✅ 5件のマッチが見つかったため、検索を終了します');
          break;
        }
      }
      
    } while (cursor && pageCount < maxPages);
    
    var messages = allMessages;
    var matches = [];
    
    if (!messages || messages.length === 0) {
      return [];
    }
    
    // 各メッセージをキーワードでフィルタリング
    for (var i = 0; i < messages.length && matches.length < 5; i++) {
      var message = messages[i];
      
      
      // message.textが空の場合は、blocksからテキストを抽出
      var text = String(message.text || '');
      
      // attachmentsからテキストを抽出（verdandiはattachments形式で送信している）
      if (message.attachments && Array.isArray(message.attachments)) {
        for (var a = 0; a < message.attachments.length; a++) {
          var attachment = message.attachments[a];
          if (attachment.text) {
            text = text ? (text + ' ' + attachment.text) : attachment.text;
          }
          // pretextやtitleも追加
          if (attachment.pretext) {
            text = text ? (text + ' ' + attachment.pretext) : attachment.pretext;
          }
          if (attachment.title) {
            text = text ? (text + ' ' + attachment.title) : attachment.title;
          }
        }
      }
      
      // blocksからテキストを抽出（Slackのメッセージはblocks形式の場合がある）
      if (message.blocks) {
        var blocksText = extractTextFromBlocks(message.blocks);
        if (blocksText) {
          text = text ? (text + ' ' + blocksText) : blocksText;
        }
      }
      
      text = text.toLowerCase();
      
      // キーワードマッチング（改善版）
      // 1. まず完全一致フレーズをチェック（誤検知を防ぐ）
      var matched = false;
      var matchedKeyword = null;
      
      // 完全一致フレーズをチェック（searchPhrasesが渡される場合）
      if (typeof searchPhrases !== 'undefined' && searchPhrases.length > 0) {
        for (var p = 0; p < searchPhrases.length; p++) {
          var phrase = String(searchPhrases[p] || '').toLowerCase();
          if (phrase && text.indexOf(phrase) !== -1) {
            matched = true;
            matchedKeyword = phrase;
            break;
          }
        }
      }
      
      // 2. フレーズでマッチしなかった場合、個別キーワードをチェック
      // ただし、部屋番号だけではマッチしない（建物名も必要）
      if (!matched) {
        var hasBuildingName = false;
        var hasRoomNumber = false;
        
        for (var j = 0; j < keywords.length; j++) {
          var keyword = String(keywords[j] || '').toLowerCase();
          if (!keyword) continue;
          
          // 建物名か部屋番号かを判定（簡易的）
          var isRoomNumber = /^\d+$/.test(keyword.trim());
          
          if (text.indexOf(keyword) !== -1) {
            if (isRoomNumber) {
              hasRoomNumber = true;
            } else {
              hasBuildingName = true;
            }
          }
        }
        
        // 建物名と部屋番号の両方が含まれている場合のみマッチ
        if (hasBuildingName && hasRoomNumber) {
          matched = true;
          matchedKeyword = 'building+room';
        }
      }
      
      if (matched) {
        // メッセージリンクを作成
        var permalink = 'https://slack.com/archives/' + channelId + '/p' + message.ts.replace('.', '');
        
        // 表示用テキストを取得（attachmentsのtextを優先、なければblocksから抽出）
        var displayText = '';
        
        // attachmentsからテキストを取得（優先）
        if (message.attachments && Array.isArray(message.attachments)) {
          for (var a = 0; a < message.attachments.length; a++) {
            var attachment = message.attachments[a];
            if (attachment.text) {
              displayText += (displayText ? '\n\n' : '') + attachment.text;
            }
          }
        }
        
        // attachmentsがない場合は、message.textとblocksから抽出
        if (!displayText) {
          displayText = String(message.text || '');
          if (message.blocks) {
            var blocksText = extractTextFromBlocks(message.blocks);
            if (blocksText) {
              displayText = displayText ? (displayText + ' ' + blocksText) : blocksText;
            }
          }
        }
        
        // ユーザー名を取得（Botアプリの場合はbot_idやusernameを使用）
        var username = 'Unknown';
        if (message.user) {
          username = message.user;
        } else if (message.bot_id) {
          username = 'Bot (' + message.bot_id + ')';
        } else if (message.username) {
          username = message.username;
        } else if (message.app_id) {
          username = 'App (' + message.app_id + ')';
        }
        
        matches.push({
          text: displayText || '',
          ts: message.ts || '',
          username: username,
          permalink: permalink
        });
        
        // マッチしたメッセージの内容をログ出力（最初の500文字）
        var logText = displayText || '';
        if (logText.length > 500) {
          logText = logText.substring(0, 500) + '...';
        }
        Logger.log('✅ マッチ: ' + logText);
      }
    }
    
    return matches;
  } catch (error) {
    Logger.log('❌ メッセージ検索エラー: ' + error.toString());
    return [];
  }
}

/**
 * Slackメッセージのblocksからテキストを抽出
 * @param {Array} blocks - Slackメッセージのblocks配列
 * @return {string} 抽出されたテキスト
 */
function extractTextFromBlocks(blocks) {
  if (!blocks || !Array.isArray(blocks)) {
    return '';
  }
  
  var text = '';
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    
    // headerブロック
    if (block.type === 'header' && block.text && block.text.text) {
      text += block.text.text + ' ';
    }
    
    // sectionブロックのtextフィールド
    if (block.type === 'section') {
      if (block.text) {
        // block.textがオブジェクトの場合
        if (typeof block.text === 'object' && block.text.text) {
          text += block.text.text + ' ';
        } else if (typeof block.text === 'string') {
          text += block.text + ' ';
        }
      }
      
      // sectionブロックのfields（重要: 物件名などの詳細情報がここに含まれる）
      if (block.fields && Array.isArray(block.fields)) {
        for (var j = 0; j < block.fields.length; j++) {
          var field = block.fields[j];
          if (field) {
            var fieldText = '';
            
            // fieldがオブジェクトの場合
            if (typeof field === 'object') {
              // field.textがオブジェクトの場合（mrkdwn形式など）
              if (field.text) {
                if (typeof field.text === 'object') {
                  // field.text.textがある場合
                  if (field.text.text) {
                    fieldText = field.text.text;
                  }
                  // field.textが配列の場合（複数のテキスト要素）
                  else if (Array.isArray(field.text)) {
                    for (var t = 0; t < field.text.length; t++) {
                      if (typeof field.text[t] === 'object' && field.text[t].text) {
                        fieldText += field.text[t].text + ' ';
                      } else if (typeof field.text[t] === 'string') {
                        fieldText += field.text[t] + ' ';
                      }
                    }
                  }
                } else if (typeof field.text === 'string') {
                  fieldText = field.text;
                }
              }
              // field自体がテキストを持っている場合
              else if (typeof field === 'string') {
                fieldText = field;
              }
            } else if (typeof field === 'string') {
              fieldText = field;
            }
            
            if (fieldText) {
              text += fieldText + ' ';
            }
          }
        }
      }
    }
    
    // contextブロック
    if (block.type === 'context' && block.elements && Array.isArray(block.elements)) {
      for (var k = 0; k < block.elements.length; k++) {
        var element = block.elements[k];
        if (element) {
          if (typeof element === 'object') {
            if (element.text) {
              if (typeof element.text === 'object' && element.text.text) {
                text += element.text.text + ' ';
              } else if (typeof element.text === 'string') {
                text += element.text + ' ';
              }
            }
          } else if (typeof element === 'string') {
            text += element + ' ';
          }
        }
      }
    }
    
    // rich_textブロック（Slackの新しい形式）
    if (block.type === 'rich_text' && block.elements && Array.isArray(block.elements)) {
      for (var r = 0; r < block.elements.length; r++) {
        var richElement = block.elements[r];
        if (richElement.type === 'rich_text_section' && richElement.elements) {
          for (var rs = 0; rs < richElement.elements.length; rs++) {
            var sectionElement = richElement.elements[rs];
            if (sectionElement.type === 'text' && sectionElement.text) {
              text += sectionElement.text + ' ';
            }
          }
        } else if (richElement.type === 'text' && richElement.text) {
          text += richElement.text + ' ';
        }
      }
    }
    
    // dividerブロックはスキップ
    if (block.type === 'divider') {
      continue;
    }
  }
  
  return text.trim();
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
    }
  ];
  
  // 検索結果を追加（最大5件、契約予定日があるもののみ）
  var validMatches = [];
  for (var i = 0; i < matches.length && validMatches.length < 5; i++) {
    var match = matches[i];
    var text = match.text || '';
    
    // 「契約予定日：yyyy-mm-dd」を抽出
    var contractDateMatch = text.match(/契約予定日[：:]\s*(\d{4}-\d{2}-\d{2})/);
    
    // 契約予定日が抽出できない場合はスキップ
    if (!contractDateMatch || !contractDateMatch[1]) {
      continue;
    }
    
    validMatches.push({
      match: match,
      contractDate: contractDateMatch[1]
    });
  }
  
  // 有効なマッチのみを表示
  for (var j = 0; j < validMatches.length; j++) {
    var validMatch = validMatches[j];
    var match = validMatch.match;
    var contractDate = validMatch.contractDate;
    var user = match.username || 'Unknown';
    var permalink = match.permalink || '';
    
    // 内容を一番上に、リンクと投稿者を下に配置
    var resultText = '```\n契約予定日：' + contractDate + '\n```\n';
    if (permalink) {
      resultText += '<' + permalink + '|メッセージ' + (j + 1) + '>\n';
    }
    resultText += '*投稿者:* ' + user;
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: resultText
      }
    });
    
    if (j < validMatches.length - 1) {
      blocks.push({
        type: 'divider'
      });
    }
  }
  
  // 有効なマッチ数に基づいてメッセージを返す
  if (validMatches.length === 0) {
    return null; // 有効なマッチがない場合はnullを返す
  }
  
  return {
    text: '🔍 関連情報が見つかりました（' + validMatches.length + '件）',
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
