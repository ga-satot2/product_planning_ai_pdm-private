/**
 * ========================================
 * form_rebuild.gs
 * ========================================
 */

function form_rebuildTrainingFormsForAllGroups() {
  try {
    Logger.log('=== form_rebuildTrainingFormsForAllGroups: 開始 ===');
    
    const groups = form_getFormGroups();
    Logger.log(`📋 対象グループ: ${groups.join(', ')}`);
    
    const results = [];
    
    for (const groupName of groups) {
      try {
        Logger.log(`\n📝 グループ「${groupName}」のフォームを作成中...`);
        const formId = form_rebuildTrainingFormForGroup(groupName);
        results.push({ group: groupName, success: true, formId: formId });
        Logger.log(`✅ グループ「${groupName}」のフォームを作成しました: ${formId}`);
      } catch (error) {
        Logger.log(`❌ グループ「${groupName}」のフォーム作成に失敗しました: ${error.message}`);
        results.push({ group: groupName, success: false, error: error.message });
      }
    }
    
    Logger.log('\n=== form_rebuildTrainingFormsForAllGroups: 完了 ===');
    Logger.log('📊 作成結果:');
    results.forEach(result => {
      if (result.success) {
        Logger.log(`  ✅ ${result.group}: ${result.formId}`);
      } else {
        Logger.log(`  ❌ ${result.group}: ${result.error}`);
      }
    });
    
    return results;
  } catch (error) {
    Logger.log('❌ form_rebuildTrainingFormsForAllGroups: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
    throw error;
  }
}

function form_rebuildTrainingFormForGroup(groupName) {
  try {
    Logger.log(`=== form_rebuildTrainingFormForGroup: 開始 (グループ: ${groupName}) ===`);
    
    const props = PropertiesService.getScriptProperties();
    const formIdKey = `FORM_ID_${groupName}`;
    let formId = props.getProperty(formIdKey);
    
    let form = null;
    
    if (formId) {
      try {
        form = FormApp.openById(formId);
        Logger.log(`✅ 既存のフォームを取得しました: ${form.getTitle()}`);
      } catch (error) {
        Logger.log(`⚠️ フォームID「${formId}」でフォームを開けませんでした: ${error.message}`);
        Logger.log('   新しいフォームを作成します...');
        formId = null;
      }
    }
    
    if (!form) {
      // 新しいフォームを作成
      form = FormApp.create(`${form_getFormConfiguration().formTitle} - ${groupName}`);
      formId = form.getId();
      props.setProperty(formIdKey, formId);
      Logger.log(`✅ 新しいフォームを作成しました: ${formId}`);
    }
    
    Logger.log('🧹 ステップ0: 古いForm Responsesシートを削除中...');
    form_cleanupOldFormResponseSheets(form);
    Logger.log('✅ 古いForm Responsesシートの削除が完了しました');

    Logger.log('📝 ステップ1: フォームメタ情報を設定中...');
    form_configureFormMeta(form);
    Logger.log('✅ フォームメタ情報の設定が完了しました');

    Logger.log('🗑️ ステップ2: 既存アイテムを削除中...');
    form_clearAllItems(form);
    Logger.log('✅ 既存アイテムの削除が完了しました');

    Logger.log('🏗️ ステップ3: 単一グループフォームを構築中...');
    form_buildSingleGroupForm(form, groupName);
    Logger.log('✅ 単一グループフォームの構築が完了しました');

    // フォームURLをグループ一覧シートに書き込む
    Logger.log('📝 ステップ4: フォームURLをグループ一覧シートに書き込み中...');
    form_updateGroupFormUrl(groupName, formId);
    Logger.log('✅ フォームURLの書き込みが完了しました');

    Logger.log(`=== form_rebuildTrainingFormForGroup: 完了 (グループ: ${groupName}) ===`);
    return formId;
  } catch (error) {
    Logger.log(`❌ form_rebuildTrainingFormForGroup: エラーが発生しました (グループ: ${groupName})`);
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
    throw error;
  }
}

function form_rebuildTrainingForm(formId) {
  try {
    Logger.log('=== form_rebuildTrainingForm: 開始 ===');
    
    let form = null;
    
    // フォームIDが指定されている場合はそれを使用、否则はアクティブなフォームを取得
    if (formId) {
      try {
        form = FormApp.openById(formId);
        Logger.log(`✅ フォームを取得しました（ID指定）: ${form.getTitle()}`);
      } catch (error) {
        Logger.log(`⚠️ フォームID「${formId}」でフォームを開けませんでした: ${error.message}`);
        Logger.log('   アクティブなフォームを取得します...');
        form = FormApp.getActiveForm();
      }
    } else {
      // フォームIDが指定されていない場合は、アクティブなフォームを取得
      form = FormApp.getActiveForm();
    }
    
    if (!form) {
      // スクリプトプロパティからフォームIDを取得
      const props = PropertiesService.getScriptProperties();
      const defaultFormId = props.getProperty('FORM_ID') || '1zdRfVLnbtfh0dxNLk8Cz5ItYDPuEqjbukGYpfsg5WQo';
      try {
        form = FormApp.openById(defaultFormId);
        Logger.log(`✅ フォームを取得しました（スクリプトプロパティ）: ${form.getTitle()}`);
      } catch (error) {
        throw new Error(`フォームが見つかりません。フォームIDを指定するか、スクリプトプロパティ「FORM_ID」を設定してください。エラー: ${error.message}`);
      }
    }
    
    Logger.log('✅ フォームを取得しました: ' + form.getTitle());

    Logger.log('🧹 ステップ0: 古いForm Responsesシートを削除中...');
    form_cleanupOldFormResponseSheets(form);
    Logger.log('✅ 古いForm Responsesシートの削除が完了しました');

    Logger.log('📝 ステップ1: フォームメタ情報を設定中...');
    form_configureFormMeta(form);
    Logger.log('✅ フォームメタ情報の設定が完了しました');

    Logger.log('🗑️ ステップ2: 既存アイテムを削除中...');
    form_clearAllItems(form);
    
    // 削除が完了したことを確認（最大3回まで再試行）
    let remainingItems = form.getItems().length;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (remainingItems > 0 && retryCount < maxRetries) {
      Logger.log(`⚠️ 警告: ${remainingItems}個のアイテムが残っています。再度削除を試みます... (${retryCount + 1}/${maxRetries})`);
      Utilities.sleep(500); // 少し待機
      form_clearAllItems(form); // 再試行
      remainingItems = form.getItems().length;
      retryCount++;
    }
    
    if (remainingItems > 0) {
      Logger.log(`❌ エラー: ${remainingItems}個のアイテムが残っています。手動で削除してください。`);
      Logger.log('残っているアイテム:');
      form.getItems().forEach((item, idx) => {
        Logger.log(`  ${idx + 1}. ${item.getTitle()} (${item.getType()})`);
      });
      throw new Error(`フォームのクリアに失敗しました。${remainingItems}個のアイテムが残っています。`);
    }
    Logger.log('✅ 既存アイテムの削除が完了しました');

    Logger.log('🏗️ ステップ3: 2ステップフォームを構築中...');
    form_buildTwoStepForm(form);
    Logger.log('✅ 2ステップフォームの構築が完了しました');

    Logger.log('=== form_rebuildTrainingForm: 完了 ===');
  } catch (error) {
    Logger.log('❌ form_rebuildTrainingForm: エラーが発生しました');
    Logger.log('エラーメッセージ: ' + error.toString());
    Logger.log('スタックトレース: ' + error.stack);
    throw error;
  }
}

// 後方互換性のためのエイリアス
function rebuildTrainingFormsForAllGroups() { return form_rebuildTrainingFormsForAllGroups(); }
function rebuildTrainingFormForGroup(groupName) { return form_rebuildTrainingFormForGroup(groupName); }
function rebuildTrainingForm(formId) { return form_rebuildTrainingForm(formId); }

