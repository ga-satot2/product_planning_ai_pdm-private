/**
 * ========================================
 * フォームクリーンアップ関数
 * ========================================
 */

/**
 * 古いForm Responsesシートを削除する
 * 列名重複エラーを防ぐため、古い回答シートを削除
 */
function form_cleanupOldFormResponseSheets(form) {
  try {
    // フォームが指定されていない場合は、フォーム設定からスプレッドシートを取得
    let spreadsheet = null;
    
    if (form) {
      // フォームにバインドされているスプレッドシートを取得
      try {
        const formResponses = form.getDestinationId();
        if (formResponses) {
          spreadsheet = SpreadsheetApp.openById(formResponses);
        }
      } catch (error) {
        Logger.log(`form_cleanupOldFormResponseSheets: フォームからスプレッドシートを取得できませんでした: ${error.message}`);
      }
    }
    
    // フォームから取得できない場合は、設定から取得
    if (!spreadsheet) {
      const formConfig = form_getFormConfiguration();
      if (!formConfig.spreadsheetId) {
        Logger.log('⚠️ form_cleanupOldFormResponseSheets: スプレッドシートIDが設定されていません');
        return;
      }
      spreadsheet = SpreadsheetApp.openById(formConfig.spreadsheetId);
    }
    
    if (!spreadsheet) {
      Logger.log(`⚠️ form_cleanupOldFormResponseSheets: スプレッドシートを開けませんでした`);
      return;
    }

    const sheets = spreadsheet.getSheets();
    
    // デバッグ: すべてのシート名をログに出力
    Logger.log(`form_cleanupOldFormResponseSheets: スプレッドシート「${spreadsheet.getName()}」のシート一覧:`);
    sheets.forEach((sheet, index) => {
      Logger.log(`  [${index + 1}] ${sheet.getName()}`);
    });
    
    const formResponseSheets = sheets.filter(sheet => {
      const sheetName = sheet.getName();
      // Form Responses の後に数字が続くパターン（スペースの数は1つ以上、大文字小文字を区別しない）
      return /^Form\s+responses?\s+\d+$/i.test(sheetName);
    });

    Logger.log(`form_cleanupOldFormResponseSheets: Form Responsesシートを${formResponseSheets.length}件検出しました`);
    formResponseSheets.forEach((sheet, index) => {
      Logger.log(`  [${index + 1}] ${sheet.getName()}`);
    });

    if (formResponseSheets.length === 0) {
      Logger.log('⚠️ form_cleanupOldFormResponseSheets: Form Responsesシートが見つかりませんでした');
      return;
    }

    // 最新のシートを残して、古いシートを削除
    formResponseSheets.sort((a, b) => {
      const numA = parseInt(a.getName().match(/\d+$/)[0]);
      const numB = parseInt(b.getName().match(/\d+$/)[0]);
      return numB - numA; // 降順ソート
    });

    const latestSheet = formResponseSheets[0];
    const oldSheets = formResponseSheets.slice(1);

    Logger.log(`📊 Form Responsesシート: 最新=${latestSheet.getName()}, 古いシート=${oldSheets.length}件`);

           oldSheets.forEach(sheet => {
             try {
               // シートが存在するか確認してから削除
               const sheetName = sheet.getName();
               const sheetToDelete = spreadsheet.getSheetByName(sheetName);
               if (sheetToDelete) {
                 spreadsheet.deleteSheet(sheetToDelete);
                 Logger.log(`  ✅ 削除: ${sheetName}`);
               } else {
                 Logger.log(`  ⚠️ シート「${sheetName}」は既に存在しません（スキップ）`);
               }
             } catch (error) {
               Logger.log(`  ❌ 削除失敗 (${sheet.getName()}): ${error.message || error}`);
               // エラーが発生しても処理を続行
             }
           });

    Logger.log(`✅ form_cleanupOldFormResponseSheets: ${oldSheets.length}件の古いシートを削除しました`);
  } catch (error) {
    Logger.log(`⚠️ form_cleanupOldFormResponseSheets: エラーが発生しました: ${error}`);
    // エラーが発生しても処理を続行
  }
}

// 後方互換性のためのエイリアス
function cleanupOldFormResponseSheets(form) { return form_cleanupOldFormResponseSheets(form); }

