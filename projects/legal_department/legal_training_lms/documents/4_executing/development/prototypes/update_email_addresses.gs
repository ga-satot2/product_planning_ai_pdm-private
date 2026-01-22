/**
 * 人事データスプレッドシートから参加情報シートのメールアドレス欄を更新するスクリプト
 *
 * 更新履歴：
 * - 2025-11-20: スペースなし氏名検索機能を追加
 *   - 人事データJ列のスペースなし氏名に対応
 *   - 参加者検索時もスペースなしで検索可能
 *
 * 処理内容：
 * 1. 人事データスプレッドシート（gid=1491723672）から人事データを読み取る
 * 2. 参加情報シートの参加者名と人事データの名前をマッチング（スペースあり・なし両対応）
 * 3. マッチした参加者のメールアドレス欄を更新
 *
 * データソース：
 * - 人事データ: https://docs.google.com/spreadsheets/d/1BtGHA_A8itKNh5Yu53S84oavdQvFrFbe6gKz1OAgeNY/edit?gid=1491723672
 * - 参加情報シート: 1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE
 */

function updateEmailAddressesFromHRData() {
  // ===== 設定 =====
  // 人事データスプレッドシートのID
  var hrSpreadsheetId = '1BtGHA_A8itKNh5Yu53S84oavdQvFrFbe6gKz1OAgeNY';
  var hrSheetGid = '1491723672'; // シートのGID
  
  // 参加情報シートのID
  var participantsSpreadsheetId = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
  var participantsSheetName = '参加情報';
  
  // デバッグモード
  var debugMode = true;
  
  console.log('='.repeat(50));
  console.log('メールアドレス更新処理を開始します...');
  console.log('='.repeat(50));
  var startTime = new Date();
  
  // 人事データスプレッドシートを取得
  var hrSpreadsheet = SpreadsheetApp.openById(hrSpreadsheetId);
  console.log('人事データスプレッドシートを取得しました: ' + hrSpreadsheet.getName());
  
  // シートを取得（GIDからシート名を特定）
  var hrSheets = hrSpreadsheet.getSheets();
  var hrSheet = null;
  
  // GIDからシートを特定
  for (var i = 0; i < hrSheets.length; i++) {
    var sheet = hrSheets[i];
    var sheetId = sheet.getSheetId().toString();
    if (sheetId === hrSheetGid) {
      hrSheet = sheet;
      console.log('✅ 人事データシートを発見: ' + sheet.getName() + ' (GID: ' + sheetId + ')');
      break;
    }
  }
  
  if (!hrSheet) {
    console.log('❌ エラー: GID=' + hrSheetGid + ' のシートが見つかりません');
    console.log('利用可能なシート一覧:');
    for (var i = 0; i < hrSheets.length; i++) {
      console.log('  - ' + hrSheets[i].getName() + ' (GID: ' + hrSheets[i].getSheetId() + ')');
    }
    return {
      success: false,
      error: '人事データシートが見つかりません'
    };
  }
  
  // 人事データを読み取る
  var hrData = hrSheet.getDataRange().getValues();
  if (hrData.length <= 1) {
    console.log('❌ エラー: 人事データがありません');
    return {
      success: false,
      error: '人事データがありません'
    };
  }
  
  // ヘッダー行を取得
  var hrHeaders = hrData[0];
  console.log('\n=== 人事データシートのヘッダー ===');
  console.log(hrHeaders.join(', '));
  
  // 名前列とメールアドレス列を特定
  var nameColumnIndex = -1;
  var emailColumnIndex = -1;
  
  for (var i = 0; i < hrHeaders.length; i++) {
    var header = String(hrHeaders[i]).toLowerCase();
    if (header.includes('名前') || header.includes('氏名') || header.includes('name') || header.includes('フルネーム')) {
      nameColumnIndex = i;
    }
    if (header.includes('メール') || header.includes('email') || header.includes('mail')) {
      emailColumnIndex = i;
    }
  }
  
  if (nameColumnIndex === -1) {
    console.log('❌ エラー: 名前列が見つかりません');
    console.log('検索条件: 「名前」「氏名」「name」「フルネーム」を含む列');
    return {
      success: false,
      error: '名前列が見つかりません'
    };
  }
  
  if (emailColumnIndex === -1) {
    console.log('❌ エラー: メールアドレス列が見つかりません');
    console.log('検索条件: 「メール」「email」「mail」を含む列');
    return {
      success: false,
      error: 'メールアドレス列が見つかりません'
    };
  }
  
  console.log('名前列: ' + (nameColumnIndex + 1) + '列目 (' + hrHeaders[nameColumnIndex] + ')');
  console.log('メールアドレス列: ' + (emailColumnIndex + 1) + '列目 (' + hrHeaders[emailColumnIndex] + ')');
  
  // 人事データをマップに変換（名前 -> メールアドレス）
  var hrDataMap = {};
  var hrDataCount = 0;
  
  for (var i = 1; i < hrData.length; i++) {
    var row = hrData[i];
    var name = String(row[nameColumnIndex]).trim();
    var email = String(row[emailColumnIndex]).trim();

    if (name && email && email.includes('@')) {
      // 名前の正規化（全角スペース・半角スペースを統一）
      var normalizedName = name.replace(/\s+/g, ' ').trim();

      // スペースありの名前を登録
      hrDataMap[normalizedName] = email;

      // スペースなしの名前も登録（J列のスペースなし氏名に対応）
      var noSpaceName = normalizedName.replace(/\s+/g, '');
      if (noSpaceName !== normalizedName) {
        hrDataMap[noSpaceName] = email;
      }

      hrDataCount++;
    }
  }
  
  console.log('\n=== 人事データマップ ===');
  console.log('読み込んだ人事データ数: ' + hrDataCount + '件（スペースあり・なし両方登録）');
  if (debugMode) {
    var sampleCount = 0;
    for (var name in hrDataMap) {
      if (sampleCount < 5) {
        console.log('  ' + name + ' -> ' + hrDataMap[name]);
        sampleCount++;
      }
    }
    if (hrDataCount > 5) {
      console.log('  ... (他 ' + (hrDataCount - 5) + '件)');
    }
  }
  
  // 参加情報シートを取得
  var participantsSpreadsheet = SpreadsheetApp.openById(participantsSpreadsheetId);
  console.log('\n参加情報スプレッドシートを取得しました: ' + participantsSpreadsheet.getName());
  
  var participantsSheet = participantsSpreadsheet.getSheetByName(participantsSheetName);
  if (!participantsSheet) {
    console.log('❌ エラー: 「' + participantsSheetName + '」シートが見つかりません');
    return {
      success: false,
      error: '参加情報シートが見つかりません'
    };
  }
  
  console.log('✅ 「' + participantsSheetName + '」シートを取得しました');
  
  // 参加情報シートのデータを取得
  var participantsData = participantsSheet.getDataRange().getValues();
  if (participantsData.length <= 1) {
    console.log('❌ エラー: 参加情報シートにデータがありません');
    return {
      success: false,
      error: '参加情報シートにデータがありません'
    };
  }
  
  // 参加情報シートのヘッダーを取得
  var participantsHeaders = participantsData[0];
  console.log('\n=== 参加情報シートのヘッダー ===');
  console.log(participantsHeaders.join(', '));
  
  // 参加者名列とメールアドレス列を特定
  var participantNameColumnIndex = -1;
  var participantEmailColumnIndex = -1;
  
  // まず、より具体的な条件で検索（優先度: 高）
  for (var i = 0; i < participantsHeaders.length; i++) {
    var header = String(participantsHeaders[i]).trim();
    var headerLower = header.toLowerCase();
    
    // 参加者名列の特定（より具体的な条件を優先）
    if (participantNameColumnIndex === -1) {
      if (header.includes('対象者') || header.includes('参加者') || 
          headerLower.includes('name') && !headerLower.includes('email') && !headerLower.includes('mail')) {
        participantNameColumnIndex = i;
        console.log('参加者名列を特定: ' + (i + 1) + '列目 (' + header + ')');
      }
    }
    
    // メールアドレス列の特定（より具体的な条件を優先、最初に見つかった列を使用）
    if (participantEmailColumnIndex === -1) {
      // 「= メールアドレス」のような形式も考慮
      var headerNormalized = header.replace(/^=\s*/, '').trim().toLowerCase();
      if (headerNormalized.includes('メールアドレス') || 
          (headerNormalized.includes('メール') && !headerNormalized.includes('クレーム')) ||
          headerNormalized === 'email' || 
          headerNormalized.includes('email address')) {
        participantEmailColumnIndex = i;
        console.log('メールアドレス列を特定: ' + (i + 1) + '列目 (' + header + ')');
        break; // 最初に見つかった列で確定
      }
    }
  }
  
  // より緩い条件で再検索（最初の検索で見つからなかった場合）
  if (participantNameColumnIndex === -1) {
    for (var i = 0; i < participantsHeaders.length; i++) {
      var header = String(participantsHeaders[i]).trim().toLowerCase();
      if (header.includes('名前')) {
        participantNameColumnIndex = i;
        console.log('参加者名列を特定（緩い条件）: ' + (i + 1) + '列目 (' + participantsHeaders[i] + ')');
        break;
      }
    }
  }
  
  if (participantEmailColumnIndex === -1) {
    for (var i = 0; i < participantsHeaders.length; i++) {
      var header = String(participantsHeaders[i]).trim();
      var headerNormalized = header.replace(/^=\s*/, '').trim().toLowerCase();
      // 「クレーム」を含む列は除外
      if ((headerNormalized.includes('メール') || headerNormalized.includes('email')) && 
          !headerNormalized.includes('クレーム')) {
        participantEmailColumnIndex = i;
        console.log('メールアドレス列を特定（緩い条件）: ' + (i + 1) + '列目 (' + header + ')');
        break;
      }
    }
  }
  
  if (participantNameColumnIndex === -1) {
    console.log('❌ エラー: 参加者名列が見つかりません');
    console.log('検索条件: 「対象者」「参加者」「名前」「name」を含む列');
    console.log('実際のヘッダー: ' + participantsHeaders.join(', '));
    return {
      success: false,
      error: '参加者名列が見つかりません'
    };
  }
  
  if (participantEmailColumnIndex === -1) {
    console.log('❌ エラー: メールアドレス列が見つかりません');
    console.log('検索条件: 「メールアドレス」「メール」「email」を含む列（「クレーム」を含む列は除外）');
    console.log('実際のヘッダー: ' + participantsHeaders.join(', '));
    return {
      success: false,
      error: 'メールアドレス列が見つかりません'
    };
  }
  
  console.log('\n=== 列の特定結果 ===');
  console.log('参加者名列: ' + (participantNameColumnIndex + 1) + '列目 (' + participantsHeaders[participantNameColumnIndex] + ')');
  console.log('メールアドレス列: ' + (participantEmailColumnIndex + 1) + '列目 (' + participantsHeaders[participantEmailColumnIndex] + ')');
  
  // メールアドレスを更新
  var updateCount = 0;
  var notFoundCount = 0;
  var alreadyHasEmailCount = 0;
  
  console.log('\n=== メールアドレス更新処理 ===');
  
  for (var i = 1; i < participantsData.length; i++) {
    var row = participantsData[i];
    var participantName = String(row[participantNameColumnIndex]).trim();
    var currentEmail = String(row[participantEmailColumnIndex]).trim();
    
    if (!participantName) {
      continue; // 名前が空の行はスキップ
    }
    
    // 名前の正規化（全角スペース・半角スペースを統一）
    var normalizedParticipantName = participantName.replace(/\s+/g, ' ').trim();

    // 既にメールアドレスが設定されているか確認
    if (currentEmail && currentEmail.includes('@')) {
      alreadyHasEmailCount++;
      if (debugMode) {
        console.log('スキップ: ' + participantName + ' (既にメールアドレスあり: ' + currentEmail + ')');
      }
      continue;
    }

    // 人事データからメールアドレスを検索（スペースあり → スペースなしの順）
    var email = hrDataMap[normalizedParticipantName];

    // スペースありで見つからない場合、スペースなしでも検索
    if (!email) {
      var noSpaceParticipantName = normalizedParticipantName.replace(/\s+/g, '');
      email = hrDataMap[noSpaceParticipantName];
      if (email && debugMode) {
        console.log('スペースなし検索で発見: ' + participantName + ' -> ' + noSpaceParticipantName + ' -> ' + email);
      }
    }
    
    if (email) {
      // メールアドレスを更新
      participantsSheet.getRange(i + 1, participantEmailColumnIndex + 1).setValue(email);
      updateCount++;
      if (debugMode) {
        console.log('更新: ' + participantName + ' -> ' + email);
      }
    } else {
      notFoundCount++;
      if (debugMode) {
        console.log('未発見: ' + participantName + ' (人事データに該当なし)');
      }
    }
  }
  
  var endTime = new Date();
  var executionTime = (endTime - startTime) / 1000;
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ メールアドレス更新処理が完了しました！');
  console.log('='.repeat(50));
  console.log('実行時間: ' + executionTime + '秒');
  console.log('更新したメールアドレス数: ' + updateCount + '件');
  console.log('既にメールアドレスあり: ' + alreadyHasEmailCount + '件');
  console.log('人事データに該当なし: ' + notFoundCount + '件');
  console.log('='.repeat(50));
  
  // 結果を返す
  return {
    success: true,
    executionTime: executionTime,
    updated: updateCount,
    alreadyHasEmail: alreadyHasEmailCount,
    notFound: notFoundCount,
    message: 'メールアドレス更新処理が完了しました'
  };
}

