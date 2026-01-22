/**
 * ========================================
 * form_triggers.gs
 * ========================================
 */

function form_clearBrokenTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let clearedCount = 0;

  Logger.log(`現在設定されているトリガー数: ${triggers.length}`);

  triggers.forEach((trigger) => {
    const handlerFunc = trigger.getHandlerFunction();
    const eventType = trigger.getTriggerSource().toString();

    Logger.log(`トリガー: ${handlerFunc} (イベント: ${eventType})`);

    // addMultipleChoiceQuestion や他の存在しない関数のトリガーを削除
    if (
      handlerFunc === 'addMultipleChoiceQuestion' ||
      handlerFunc === 'addTextItem' ||
      handlerFunc === 'addParagraphTextItem'
    ) {
      Logger.log(`❌ 不要なトリガーを削除: ${handlerFunc}`);
      ScriptApp.deleteTrigger(trigger);
      clearedCount++;
    }
  });

  Logger.log(`✅ ${clearedCount} 件のトリガーを削除しました`);
}

function form_autoRebuildFormOnSchedule() {
  try {
    const timestamp = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
    Logger.log(`📅 [${timestamp}] form_autoRebuildFormOnSchedule: 開始`);
    
    // スプレッドシートから最新の研修枠データを取得
    const sessions = form_getScheduledCourses();
    if (sessions.length === 0) {
      Logger.log('⚠️ 予約可能な研修枠がありません。フォーム再構築をスキップします');
      return;
    }
    
    Logger.log(`📊 ${sessions.length}個の研修枠を検出しました`);
    
    // フォームを再構築（スプレッドシート値に基づいて設問を更新）
    form_rebuildTrainingForm();
    
    Logger.log(`✅ [${timestamp}] フォーム再構築完了`);
  } catch (error) {
    Logger.log(`❌ form_autoRebuildFormOnSchedule: エラーが発生しました: ${error.toString()}`);
    Logger.log(`スタックトレース: ${error.stack}`);
  }
}

/**
 * 時間ベーストリガーを設定する（手動実行用）
 * Apps Script エディタから手動実行可能
 * 例）毎時間フォームを更新したい場合
 */
function form_setupAutoRebuildTrigger(intervalHours = 1) {
  try {
    Logger.log(`🔧 トリガー設定: 毎${intervalHours}時間ごとにフォーム更新`);
    
    // 既存の form_autoRebuildFormOnSchedule トリガーを全て削除
    const triggers = ScriptApp.getProjectTriggers();
    let deletedCount = 0;
    
    triggers.forEach((trigger) => {
      if (trigger.getHandlerFunction() === 'form_autoRebuildFormOnSchedule' || trigger.getHandlerFunction() === 'autoRebuildFormOnSchedule') {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
        Logger.log(`削除: ${trigger.getHandlerFunction()} トリガー`);
      }
    });
    
    if (deletedCount > 0) {
      Logger.log(`既存の ${deletedCount} 件のトリガーを削除しました`);
    }
    
    // 新しい時間ベーストリガーを設定
    ScriptApp.newTrigger('form_autoRebuildFormOnSchedule')
      .timeBased()
      .everyHours(intervalHours)
      .create();
    
    Logger.log(`✅ form_autoRebuildFormOnSchedule トリガーを設定しました`);
    Logger.log(`   実行間隔: ${intervalHours}時間ごと`);
    Logger.log(`   次回実行: 約${intervalHours}時間後`);
  } catch (error) {
    Logger.log(`❌ トリガー設定エラー: ${error.toString()}`);
  }
}

function form_listAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  Logger.log(`=== 現在設定されているトリガー数: ${triggers.length} ===`);
  
  triggers.forEach((trigger, index) => {
    const handlerFunc = trigger.getHandlerFunction();
    const source = trigger.getTriggerSource().toString();
    const eventType = trigger.getEventType().toString();
    
    Logger.log(`[${index + 1}] 関数: ${handlerFunc}`);
    Logger.log(`     ソース: ${source}`);
    Logger.log(`     イベント: ${eventType}`);
  });
  
  if (triggers.length === 0) {
    Logger.log('✅ アクティブなトリガーはありません');
  }
}

// 後方互換性のためのエイリアス
function clearBrokenTriggers() { return form_clearBrokenTriggers(); }
function autoRebuildFormOnSchedule() { return form_autoRebuildFormOnSchedule(); }
function setupAutoRebuildTrigger(intervalHours = 1) { return form_setupAutoRebuildTrigger(intervalHours); }
function listAllTriggers() { return form_listAllTriggers(); }

