/**
 * ========================================
 * form_build.gs
 * ========================================
 */

function form_configureFormMeta(form) {
  form.setTitle(form_getFormConfiguration().formTitle);
  form.setDescription(form_getFormConfiguration().description);
  form.setConfirmationMessage(form_getFormConfiguration().confirmationMessage);
  form.setShowLinkToRespondAgain(false);
  form.setCollectEmail(true);
  form.setAllowResponseEdits(false);

  const formConfig = form_getFormConfiguration();
  if (formConfig.respondentDomain) {
    form.setRequireLogin(true);
    form.setLimitOneResponsePerUser(true);
    if (formConfig.spreadsheetId) {
      try {
        form.setDestination(FormApp.DestinationType.SPREADSHEET, formConfig.spreadsheetId);
      } catch (error) {
        Logger.log(`configureFormMeta: setDestination でエラーが発生しました。ID=${formConfig.spreadsheetId}, error=${error}`);
      }
    }
    form.setPublishingSummary(false);
  }
}

function form_clearAllItems(form) {
  Logger.log(`form_clearAllItems: 開始 - 既存アイテム数: ${form.getItems().length}`);
  
  form_resetFormNavigation(form);
  let items = form.getItems();
  let deletedCount = 0;
  
  // 複数回削除を試行（削除中にアイテム数が変わる可能性があるため）
  let maxAttempts = 10;
  let attempt = 0;
  
  while (items.length > 0 && attempt < maxAttempts) {
    for (let i = items.length - 1; i >= 0; i--) {
      try {
        const itemTitle = items[i].getTitle();
        form.deleteItem(items[i]);
        deletedCount++;
        Logger.log(`  ✅ 削除: ${itemTitle}`);
      } catch (error) {
        Logger.log(`  ❌ 削除失敗 (${items[i].getId()}): ${error}`);
      }
    }
    
    // 再度アイテムを取得
    items = form.getItems();
    attempt++;
    
    if (items.length > 0) {
      Logger.log(`  ⚠️ 残りのアイテム数: ${items.length}。再試行します...`);
      Utilities.sleep(100); // 少し待機
    }
  }
  
  const remainingItems = form.getItems().length;
  Logger.log(`form_clearAllItems: 完了 - 削除数: ${deletedCount}, 残り: ${remainingItems}`);
  
  if (remainingItems > 0) {
    Logger.log(`⚠️ 警告: ${remainingItems}個のアイテムが残っています。手動で削除してください。`);
  }
}

function form_resetFormNavigation(form) {
  const items = form.getItems();
  items.forEach((item) => {
    const type = item.getType();
    try {
      switch (type) {
        case FormApp.ItemType.MULTIPLE_CHOICE: {
          const mcItem = item.asMultipleChoiceItem();
          const choices = mcItem.getChoices().map((choice) => mcItem.createChoice(choice.getValue()));
          mcItem.setChoices(choices);
          break;
        }
        case FormApp.ItemType.LIST: {
          const listItem = item.asListItem();
          const choices = listItem.getChoices().map((choice) => listItem.createChoice(choice.getValue()));
          listItem.setChoices(choices);
          break;
        }
        case FormApp.ItemType.CHECKBOX: {
          const checkboxItem = item.asCheckboxItem();
          const choices = checkboxItem.getChoices().map((choice) => choice.getValue());
          checkboxItem.setChoices(choices.map(choice => checkboxItem.createChoice(choice)));
          break;
        }
        case FormApp.ItemType.PAGE_BREAK: {
          item.asPageBreakItem().setGoToPage(FormApp.PageNavigationType.CONTINUE);
          break;
        }
        default:
          break;
      }
    } catch (error) {
      Logger.log(`resetFormNavigation: type=${type} でナビゲーションリセットに失敗: ${error}`);
    }
  });
}

function form_buildTwoStepForm(form) {
  Logger.log('form_buildTwoStepForm: 開始');
  
  Logger.log('📊 予約可能な研修枠を取得中...');
  const sessions = form_getScheduledCourses();
  Logger.log(`✅ 取得した研修枠数: ${sessions.length}件`);
  if (sessions.length === 0) {
    Logger.log('⚠️ 警告: 研修枠が0件です。フォームは空のままになります。');
  }
  
  const utils = form_getUtilsInstance();
  Logger.log('✅ Utilsインスタンスを取得しました');

  Logger.log('📋 フォーム設定を取得中...');
  const step1 = form_getFormConfiguration().steps[0];
  Logger.log(`✅ ステップ1の設定を取得しました: ${step1.title}`);
  
  form.addSectionHeaderItem().setTitle(step1.title).setHelpText(step1.helpText);
  Logger.log('✅ ステップ1のセクションヘッダーを追加しました');

  let groupSelectItem = null;
  const step1Titles = new Set(); // ステップ1のタイトル重複チェック用

  step1.items.forEach((itemConfig, itemIndex) => {
    // タイトルを一意にする（重複している場合）
    let itemTitle = itemConfig.title;
    if (step1Titles.has(itemTitle)) {
      Logger.log(`⚠️ 警告: ステップ1で重複するタイトルが検出されました: ${itemTitle}`);
      itemTitle = `${itemTitle} [${itemIndex + 1}]`;
    }
    step1Titles.add(itemTitle);
    
    switch (itemConfig.type) {
      case 'TEXT': {
        const item = form.addTextItem().setTitle(itemTitle).setRequired(itemConfig.required);
        if (itemConfig.placeholder) {
          item.setHelpText(itemConfig.placeholder);
        }
        break;
      }
      case 'PARAGRAPH': {
        const item = form
          .addParagraphTextItem()
          .setTitle(itemTitle)
          .setRequired(itemConfig.required || false);
        if (itemConfig.helpText) {
          item.setHelpText(itemConfig.helpText);
        }
        break;
      }
      case 'GROUP_SELECT': {
        const item = form
          .addMultipleChoiceItem()
          .setTitle(itemTitle)
          .setRequired(itemConfig.required !== false);
        if (itemConfig.helpText) {
          item.setHelpText(itemConfig.helpText);
        }
        groupSelectItem = item;
        break;
      }
      default:
        Logger.log(`未対応のアイテムタイプ: ${itemConfig.type}`);
    }
  });

  const step2 = form_getFormConfiguration().steps[1];
  Logger.log(`✅ ステップ2の設定を取得しました: ${step2.title}`);
  
  Logger.log('👥 グループ一覧を取得中...');
  const groupsRaw = form_getFormGroups();
  // 重複を除去（念のため）
  const groups = [...new Set(groupsRaw)];
  Logger.log(`✅ 取得したグループ数: ${groups.length}件（重複除去前: ${groupsRaw.length}件）`);
  Logger.log(`グループ一覧: ${groups.join(', ')}`);
  
  if (groups.length === 0) {
    Logger.log('⚠️ 警告: グループが0件です。フォームにグループ選択肢が追加されません。');
  }
  
  const groupPageMap = {};
  const existingTitles = new Set(step1Titles); // タイトル重複チェック用（ステップ1のタイトルも含める）

  groups.forEach((groupName, index) => {
    Logger.log(`📄 グループ「${groupName}」のページブレークを作成中...`);
    const pageBreak = form
      .addPageBreakItem()
      .setTitle(`${step2.title}（${groupName}）`)
      .setHelpText(step2.helpText);

    groupPageMap[groupName] = pageBreak;

    const groupSessions = sessions.filter((session) => form_isSessionAvailableForGroup(session, groupName));
    Logger.log(`  ✅ グループ「${groupName}」に利用可能な研修枠: ${groupSessions.length}件`);

    // タイトルを一意にする（グループ名とインデックスを含める）
    let questionTitle = `${groupName} の研修枠を選択してください`;
    
    // 重複チェック（念のため）
    if (existingTitles.has(questionTitle)) {
      Logger.log(`  ⚠️ 警告: 重複するタイトルが検出されました: ${questionTitle}`);
      questionTitle = `${questionTitle} [${index + 1}]`;
    }
    existingTitles.add(questionTitle);
    Logger.log(`  📝 質問タイトル: "${questionTitle}"`);

    const question = form
      .addMultipleChoiceItem()
      .setTitle(questionTitle)
      .setRequired(groupSessions.length > 0);

    if (groupSessions.length === 0) {
      question.setChoices([
        question.createChoice('現在選択できる研修枠はありません（時間をおいて再度ご確認ください）')
      ]);
      question.setHelpText('管理者は「予約一覧」シートへ対象グループの枠を追加後、フォーム再生成を実行してください。');
    } else {
      const choiceItems = groupSessions
        .map((session) => form_buildSessionChoiceLabel(session, utils))
        .filter((label) => !!label)
        .map((label) => question.createChoice(label));
      question.setChoices(choiceItems);
    }
  });

  if (groupSelectItem) {
    Logger.log('🔗 グループ選択肢にページ遷移を設定中...');
    const groupChoices = groups.map((groupName) => {
      const targetPage = groupPageMap[groupName];
      return groupSelectItem.createChoice(groupName, targetPage);
    });
    groupSelectItem.setChoices(groupChoices);
    Logger.log(`✅ ${groupChoices.length}個のグループ選択肢を設定しました`);
  } else {
    Logger.log('⚠️ 警告: groupSelectItemがnullです。グループ選択肢が設定されません。');
  }
  
  Logger.log('form_buildTwoStepForm: 完了');
}

function form_buildSingleGroupForm(form, groupName) {
  Logger.log(`form_buildSingleGroupForm: 開始 (グループ: ${groupName})`);
  
  Logger.log('📊 予約可能な研修枠を取得中...');
  const sessions = form_getScheduledCourses();
  Logger.log(`✅ 取得した研修枠数: ${sessions.length}件`);
  
  // 対象グループの研修枠のみをフィルタリング
  const groupSessions = sessions.filter((session) => form_isSessionAvailableForGroup(session, groupName));
  Logger.log(`✅ グループ「${groupName}」に利用可能な研修枠: ${groupSessions.length}件`);
  
  if (groupSessions.length === 0) {
    Logger.log('⚠️ 警告: グループ「' + groupName + '」の研修枠が0件です。フォームは空のままになります。');
  }
  
  const utils = form_getUtilsInstance();
  Logger.log('✅ Utilsインスタンスを取得しました');

  Logger.log('📋 フォーム設定を取得中...');
  const step1 = form_getFormConfiguration().steps[0];
  Logger.log(`✅ ステップ1の設定を取得しました: ${step1.title}`);
  
  // ステップ1のセクションヘッダー（グループ名を含める）
  form.addSectionHeaderItem()
    .setTitle(`${step1.title} - ${groupName}`)
    .setHelpText(step1.helpText + `\n\n対象グループ: ${groupName}`);
  Logger.log('✅ ステップ1のセクションヘッダーを追加しました');

  const step1Titles = new Set(); // ステップ1のタイトル重複チェック用

  // ステップ1のアイテムを追加（グループ選択を除く）
  step1.items.forEach((itemConfig, itemIndex) => {
    // GROUP_SELECTタイプはスキップ（グループごとにフォームを分けるため不要）
    if (itemConfig.type === 'GROUP_SELECT') {
      Logger.log(`  ⏭️  グループ選択アイテムをスキップ（グループごとにフォームを分けるため）`);
      return;
    }
    
    // タイトルを一意にする（重複している場合）
    let itemTitle = itemConfig.title;
    if (step1Titles.has(itemTitle)) {
      Logger.log(`⚠️ 警告: ステップ1で重複するタイトルが検出されました: ${itemTitle}`);
      itemTitle = `${itemTitle} [${itemIndex + 1}]`;
    }
    step1Titles.add(itemTitle);
    
    switch (itemConfig.type) {
      case 'TEXT': {
        const item = form.addTextItem().setTitle(itemTitle).setRequired(itemConfig.required);
        if (itemConfig.placeholder) {
          item.setHelpText(itemConfig.placeholder);
        }
        break;
      }
      case 'PARAGRAPH': {
        const item = form
          .addParagraphTextItem()
          .setTitle(itemTitle)
          .setRequired(itemConfig.required || false);
        if (itemConfig.helpText) {
          item.setHelpText(itemConfig.helpText);
        }
        break;
      }
      default:
        Logger.log(`未対応のアイテムタイプ: ${itemConfig.type}`);
    }
  });

  // ステップ2: 研修枠選択（グループ選択なし）
  const step2 = form_getFormConfiguration().steps[1];
  Logger.log(`✅ ステップ2の設定を取得しました: ${step2.title}`);
  
  form.addSectionHeaderItem()
    .setTitle(`${step2.title} - ${groupName}`)
    .setHelpText(step2.helpText);
  
  const questionTitle = `${groupName} の研修枠を選択してください`;
  Logger.log(`  📝 質問タイトル: "${questionTitle}"`);

  const question = form
    .addMultipleChoiceItem()
    .setTitle(questionTitle)
    .setRequired(groupSessions.length > 0);

  if (groupSessions.length === 0) {
    question.setChoices([
      question.createChoice('現在選択できる研修枠はありません（時間をおいて再度ご確認ください）')
    ]);
    question.setHelpText('管理者は「予約一覧」シートへ対象グループの枠を追加後、フォーム再生成を実行してください。');
  } else {
    const choiceItems = groupSessions
      .map((session) => form_buildSessionChoiceLabel(session, utils))
      .filter((label) => !!label)
      .map((label) => question.createChoice(label));
    question.setChoices(choiceItems);
    Logger.log(`  ✅ ${choiceItems.length}件の研修枠選択肢を追加しました`);
  }
  
  Logger.log(`form_buildSingleGroupForm: 完了 (グループ: ${groupName})`);
}

function form_updateGroupFormUrl(groupName, formId) {
  try {
    const spreadsheet = form_openSourceSpreadsheet();
    if (!spreadsheet) {
      Logger.log('⚠️ form_updateGroupFormUrl: スプレッドシートが取得できませんでした');
      return;
    }

    // デバッグ: form_getFormSheets()の結果を確認
    const formSheets = form_getFormSheets();
    Logger.log(`form_updateGroupFormUrl: formSheets取得 - keys: ${formSheets ? Object.keys(formSheets).join(', ') : 'null'}`);
    
    if (!formSheets) {
      Logger.log(`⚠️ form_updateGroupFormUrl: formSheetsがnullです`);
      return;
    }
    
    if (!formSheets.groups) {
      Logger.log(`⚠️ form_updateGroupFormUrl: formSheets.groupsがundefinedです`);
      Logger.log(`   formSheetsのキー: ${Object.keys(formSheets).join(', ')}`);
      // groupsが存在しない場合は、直接シート名を使用
      const groupsSheet = spreadsheet.getSheetByName('グループ一覧');
      if (!groupsSheet) {
        Logger.log(`⚠️ form_updateGroupFormUrl: シート「グループ一覧」が見つかりません`);
        return;
      }
      // フォールバック処理（シート名を直接使用）
      const lastRow = groupsSheet.getLastRow();
      if (lastRow < 2) {
        Logger.log('⚠️ form_updateGroupFormUrl: グループ一覧にデータがありません');
        return;
      }
      const dataRange = groupsSheet.getRange(2, 1, lastRow - 1, 1);
      const groupNames = dataRange.getValues();
      for (let i = 0; i < groupNames.length; i++) {
        const rowGroupName = String(groupNames[i][0]).trim();
        if (rowGroupName === groupName) {
          const targetRow = 2 + i;
          const formUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
          groupsSheet.getRange(targetRow, 5).setValue(formUrl); // E列（FORM_URL）
          Logger.log(`✅ グループ「${groupName}」のフォームURLを書き込みました: ${formUrl}`);
          return;
        }
      }
      Logger.log(`⚠️ form_updateGroupFormUrl: グループ「${groupName}」が見つかりませんでした`);
      return;
    }

    const groupsSheet = spreadsheet.getSheetByName(formSheets.groups.name);
    if (!groupsSheet) {
      Logger.log(`⚠️ form_updateGroupFormUrl: シート「${formSheets.groups.name}」が見つかりません`);
      return;
    }

    const lastRow = groupsSheet.getLastRow();
    if (lastRow < formSheets.groups.rows.FIRST) {
      Logger.log('⚠️ form_updateGroupFormUrl: グループ一覧にデータがありません');
      return;
    }

    // グループ名で行を検索
    const dataRange = groupsSheet.getRange(
      formSheets.groups.rows.FIRST,
      formSheets.groups.columns.GROUP_NAME,
      lastRow - formSheets.groups.rows.FIRST + 1,
      1
    );
    const groupNames = dataRange.getValues();

    for (let i = 0; i < groupNames.length; i++) {
      const rowGroupName = String(groupNames[i][0]).trim();
      
      if (rowGroupName === groupName) {
        const targetRow = formSheets.groups.rows.FIRST + i;
        const formUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
        
        groupsSheet.getRange(targetRow, formSheets.groups.columns.FORM_URL).setValue(formUrl);
        Logger.log(`✅ グループ「${groupName}」のフォームURLを書き込みました: ${formUrl}`);
        return;
      }
    }

    Logger.log(`⚠️ form_updateGroupFormUrl: グループ「${groupName}」が見つかりませんでした`);
  } catch (error) {
    Logger.log(`⚠️ form_updateGroupFormUrl: エラーが発生しました: ${error.message}`);
  }
}

// 後方互換性のためのエイリアス
function configureFormMeta(form) { return form_configureFormMeta(form); }
function clearAllItems(form) { return form_clearAllItems(form); }
function resetFormNavigation(form) { return form_resetFormNavigation(form); }
function buildTwoStepForm(form) { return form_buildTwoStepForm(form); }
function buildSingleGroupForm(form, groupName) { return form_buildSingleGroupForm(form, groupName); }
function updateGroupFormUrl(groupName, formId) { return form_updateGroupFormUrl(groupName, formId); }

