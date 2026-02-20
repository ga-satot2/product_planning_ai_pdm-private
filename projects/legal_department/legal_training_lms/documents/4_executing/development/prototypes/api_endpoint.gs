/**
 * WebアプリとしてデプロイしてAPI経由で実行するためのエンドポイント
 * 
 * デプロイ方法：
 * 1. Apps Scriptエディタで「デプロイ」→「新しいデプロイ」
 * 2. 「種類の選択」→「Webアプリ」を選択
 * 3. 「次のユーザーとして実行」→「自分」を選択
 * 4. 「アクセスできるユーザー」→「全員」または「自分のみ」を選択
 * 5. 「デプロイ」をクリック
 * 6. WebアプリのURLをコピー
 */

/**
 * POSTリクエストで関数を実行するエンドポイント（Web App UIのdoPostから呼び出される）
 */
function runApiEndpointPost(e) {
  try {
    var functionName = e.parameter.function || e.postData.contents ? JSON.parse(e.postData.contents).function : 'syncParticipantsFromAttendance';
    
    if (functionName === 'syncParticipantsFromAttendance') {
      syncParticipantsFromAttendance();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: '参加情報シートの同期処理が完了しました'
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (functionName === 'updateEmailAddressesFromHRData') {
      var result = updateEmailAddressesFromHRData();
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    } else if (functionName === 'cancelReservation') {
      var params = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : e.parameter;
      var email = params.email;
      var eventId = params.eventId;
      if (!email || !eventId) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'email and eventId parameters are required'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var result = cancelReservation(email, eventId);
      return ContentService.createTextOutput(JSON.stringify({
        success: result,
        message: result ? '予約削除が完了しました' : '予約削除に失敗しました'
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (functionName === 'changeReservation') {
      var params = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : e.parameter;
      var email = params.email;
      var oldEventId = params.oldEventId;
      var newEventId = params.newEventId;
      if (!email || !oldEventId || !newEventId) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'email, oldEventId, and newEventId parameters are required'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var result = changeReservation(email, oldEventId, newEventId);
      return ContentService.createTextOutput(JSON.stringify({
        success: result,
        message: result ? '予約変更が完了しました' : '予約変更に失敗しました'
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unknown function: ' + functionName
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストで関数を実行するエンドポイント（テスト用。Web App UIのdoGetから呼び出される）
 */
function runApiEndpointGet(e) {
  var functionName = e.parameter.function || 'syncParticipantsFromAttendance';
  
  if (functionName === 'syncParticipantsFromAttendance') {
    try {
      // 実行ログを取得するために、ログを文字列として収集
      var logMessages = [];
      var originalLog = console.log;
      console.log = function() {
        var args = Array.prototype.slice.call(arguments);
        var logMessage = args.join(' ');
        logMessages.push(logMessage);
        originalLog.apply(console, arguments);
      };
      
      var syncResult = syncParticipantsFromAttendance();
      
      // 実行ログシートの存在確認
      var participantsSpreadsheetId = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
      var participantsSpreadsheet = SpreadsheetApp.openById(participantsSpreadsheetId);
      var logSheetExists = participantsSpreadsheet.getSheetByName('実行ログ') !== null;
      
      // HTML形式で結果を返す（ブラウザで見やすく）
      var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>実行結果</title>';
      html += '<style>body{font-family:monospace;padding:20px;background:#f5f5f5;}';
      html += '.success{color:green;font-weight:bold;font-size:18px;margin-bottom:20px;}';
      html += '.error{color:red;font-weight:bold;}';
      html += '.warning{color:orange;font-weight:bold;}';
      html += '.log{background:white;padding:15px;border-radius:5px;margin-top:10px;white-space:pre-wrap;font-size:12px;}';
      html += 'h2{color:#333;border-bottom:2px solid #ddd;padding-bottom:5px;}';
      html += 'a{color:#1a73e8;text-decoration:none;}a:hover{text-decoration:underline;}</style></head><body>';
      
      html += '<div class="success">✅ 参加情報シートの同期処理が完了しました</div>';
      
      if (syncResult) {
        html += '<h2>実行結果</h2>';
        html += '<div class="log">';
        html += '実行時間: ' + syncResult.executionTime + '秒<br>';
        html += '更新したコース数: ' + (syncResult.coursesUpdated || 0) + '件<br>';
        html += '新規追加した参加者数: ' + (syncResult.newParticipants || 0) + '名<br>';
        html += '総参加者数: ' + (syncResult.totalParticipants || 0) + '名<br>';
        html += '</div>';
      }
      
      html += '<h2>実行ログシートの状態</h2>';
      if (logSheetExists) {
        html += '<div class="success">✅ 「実行ログ」シートが存在します</div>';
        html += '<p><a href="https://docs.google.com/spreadsheets/d/' + participantsSpreadsheetId + '/edit#gid=0" target="_blank">参加情報シートを開く</a></p>';
      } else {
        html += '<div class="warning">⚠️ 「実行ログ」シートが見つかりません</div>';
        html += '<p>スプレッドシートID: ' + participantsSpreadsheetId + '</p>';
        html += '<p><a href="https://docs.google.com/spreadsheets/d/' + participantsSpreadsheetId + '/edit" target="_blank">参加情報シートを開く</a></p>';
      }
      
      html += '<h2>実行ログ</h2>';
      html += '<div class="log">' + logMessages.join('\n').replace(/\n/g, '<br>') + '</div>';
      html += '</body></html>';
      
      // 実行ログをコンソールにも出力（デバッグ用）
      console.log('実行ログメッセージ数: ' + logMessages.length);
      console.log('実行ログ（最初の10行）:');
      for (var i = 0; i < Math.min(10, logMessages.length); i++) {
        console.log('  ' + logMessages[i]);
      }
      
      return HtmlService.createHtmlOutput(html);
    } catch (error) {
      var errorHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>エラー</title>';
      errorHtml += '<style>body{font-family:monospace;padding:20px;background:#f5f5f5;}';
      errorHtml += '.error{color:red;font-weight:bold;background:white;padding:15px;border-radius:5px;}</style></head><body>';
      errorHtml += '<div class="error">❌ エラー: ' + error.toString() + '<br><br>' + error.stack + '</div>';
      errorHtml += '</body></html>';
      return HtmlService.createHtmlOutput(errorHtml);
    }
  } else if (functionName === 'analyzeSheetStructure') {
    try {
      var result = analyzeSheetStructure();
      var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>構造分析結果</title>';
      html += '<style>body{font-family:monospace;padding:20px;background:#f5f5f5;}';
      html += '.success{color:green;font-weight:bold;}';
      html += '.log{background:white;padding:15px;border-radius:5px;margin-top:10px;white-space:pre-wrap;font-size:12px;}</style></head><body>';
      html += '<div class="success">✅ スプレッドシート構造分析が完了しました</div>';
      html += '<div class="log">スプレッドシート名: ' + result.spreadsheetName + '<br>';
      html += 'シート数: ' + result.sheets.length + '<br>';
      html += 'シート一覧: ' + result.sheets.join(', ') + '<br>';
      html += 'コース一覧シート: ' + (result.courseSheetFound ? result.courseSheetName : '見つかりませんでした') + '</div>';
      html += '</body></html>';
      return HtmlService.createHtmlOutput(html);
    } catch (error) {
      var errorHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>エラー</title>';
      errorHtml += '<style>body{font-family:monospace;padding:20px;background:#f5f5f5;}';
      errorHtml += '.error{color:red;font-weight:bold;background:white;padding:15px;border-radius:5px;}</style></head><body>';
      errorHtml += '<div class="error">❌ エラー: ' + error.toString() + '<br><br>' + error.stack + '</div>';
      errorHtml += '</body></html>';
      return HtmlService.createHtmlOutput(errorHtml);
    }
  } else if (functionName === 'updateEmailAddressesFromHRData') {
    try {
      var result = updateEmailAddressesFromHRData();
      var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>メールアドレス更新結果</title>';
      html += '<style>body{font-family:monospace;padding:20px;background:#f5f5f5;}';
      html += '.success{color:green;font-weight:bold;font-size:18px;margin-bottom:20px;}';
      html += '.error{color:red;font-weight:bold;}';
      html += '.log{background:white;padding:15px;border-radius:5px;margin-top:10px;white-space:pre-wrap;font-size:12px;}</style></head><body>';
      
      if (result.success) {
        html += '<div class="success">✅ メールアドレス更新処理が完了しました</div>';
        html += '<div class="log">';
        html += '実行時間: ' + result.executionTime + '秒<br>';
        html += '更新したメールアドレス数: ' + result.updated + '件<br>';
        html += '既にメールアドレスあり: ' + result.alreadyHasEmail + '件<br>';
        html += '人事データに該当なし: ' + result.notFound + '件<br>';
        html += '</div>';
        html += '<p><a href="https://docs.google.com/spreadsheets/d/1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE/edit" target="_blank">参加情報シートを開く</a></p>';
      } else {
        html += '<div class="error">❌ エラー: ' + result.error + '</div>';
      }
      html += '</body></html>';
      return HtmlService.createHtmlOutput(html);
    } catch (error) {
      var errorHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>エラー</title>';
      errorHtml += '<style>body{font-family:monospace;padding:20px;background:#f5f5f5;}';
      errorHtml += '.error{color:red;font-weight:bold;background:white;padding:15px;border-radius:5px;}</style></head><body>';
      errorHtml += '<div class="error">❌ エラー: ' + error.toString() + '<br><br>' + error.stack + '</div>';
      errorHtml += '</body></html>';
      return HtmlService.createHtmlOutput(errorHtml);
    }
  } else {
    return ContentService.createTextOutput('❌ Unknown function: ' + functionName);
  }
}

