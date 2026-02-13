/**
 * ========================================
 * LMS Shared Utilities - V2 (エラーハンドリング・ログ機能強化版)
 * ========================================
 * 
 * 共通ユーティリティクラス。
 * 
 * 主要機能:
 *  - 設定値管理
 *  - Slack通知
 *  - カレンダー操作
 *  - エラーハンドリング基盤
 *  - ログ機能
 *  - 共通エラーメッセージ定義
 * 
 * @version 2.0
 * @author プロダクト企画チーム
 * @since 2025-12-25
 */
class LMSUtils {

  /**
   * コンストラクタ
   * スクリプトプロパティを初期化
   */
  constructor() {
    this.props = PropertiesService.getScriptProperties();
  }

  // --------------------------------------------------

  // プロパティ・設定値

  // --------------------------------------------------

  getConfig() {

    return {

      presetValues: {

        creation_trigger: "設定する",

        created: "設定済み",

        has_appointment: "済み",

        no_appointment: "未",

        error_dates: "日時問題",

        error_general: "設定不可",

        action_remind: "未予約者へリマインド"

      },

      sheets: {

        attendees: {

          name: "参加情報",

          rows: {

            FIRST: 2

          },

          columns: {

            NAME: 1,              // A: 対象者

            EMAIL: 2,             // B: メールアドレス

            GROUP: 3,             // C: 所属グループ

            COURSE_START_COL: 4,  // D: コース1（参加シート番号1）

            COURSE_1: 4,          // D: コース1

            COURSE_12: 15         // O: コース12

          }

        },

        events: {

          name: "予約一覧",

          rows: { FIRST: 2 },

          columns: {

            NUMBER: 1,              // A: 予約ID(自動発行)

            COURSE_ID: 2,           // B: コースID

            COURSE_NAME: 3,         // C: 予約名（自動反映）

            COURSE_DETAILS: 4,      // D: コース案内（自動反映）

            TARGET_GROUP: 5,        // E: グループ名

            COURSE_DATE: 6,         // F: 日程

            COURSE_START_TIME: 7,    // G: 開始日時

            COURSE_END_TIME: 8,     // H: 完了日時

            LOCATION: 9,            // I: 開催場所

            EVENT_ID: 10,           // J: イベントID

            EVENT_URL: 10,          // J: イベントID（EVENT_IDのエイリアス、後方互換性のため）

            STATUS: 11              // K: 予約状況

          }

        },

        dashboard: {

          name: "ダッシュボード",

          rows: { FIRST: 2 },

          columns: {

            GROUP: 1,               // A: グループ

            COURSE_NAME: 2,         // B: コース名

            TARGET_COUNT: 3,        // C: 対象者人数

            RESERVED_COUNT: 4,      // D: 予約済み

            RATE: 5,                // E: 予約率

            TRIGGER: 6,              // F: アクション

            LAST_REMINDER: 7        // G: 最後のリマインド

          }

        },

        groups: {

          name: "グループ一覧",

          rows: { FIRST: 2 },

          columns: {

            GROUP_NAME: 1,          // A: グループ名

            TRAINING_TYPE: 2,       // B: 実施中の研修

            MEMBER_COUNT: 3,        // C: 在籍メンバー数

            SLACK_CHANNEL_ID: 4,     // D: SlackチャンネルID

            FORM_URL: 5             // E: フォームURL

          }

        },

        courseList: {

          name: "コース一覧",

          rows: { FIRST: 2 },

          columns: {

            COURSE_ID: 1,           // A: コースID(自動発行)

            TRAINING_TYPE: 2,       // B: 研修種別（継続研修/アベンジャーズ等、人事評価用）

            SHEET_NUMBER: 3,        // C: 参加シート番号

            COURSE_NAME: 4,         // D: コース名

            COURSE_DETAILS: 5,      // E: コース案内

            DURATION: 6,            // F: 授業時間（分）

            MATERIALS: 7            // G: 研修資料

          }

        },

        attendance: {

          name: "出欠簿",

          rows: { FIRST: 2 },

          columns: {

            NAME: 1,                // A: 参加者名

            EMAIL: 2,               // B: メールアドレス

            COURSE_ID: 3,           // C: コースID

            STATUS: 4,               // D: 出席状況（出席/欠席/遅刻）

            TEST_SCORE: 5,          // E: テスト結果

            PASS_FAIL: 6            // F: 合格/不合格

          }

        },

        personnelEvalSummary: {

          name: "人事評価サマリ",

          rows: { FIRST: 2 },

          columns: {

            NAME: 1,                      // A: 参加者名

            EMAIL: 2,                     // B: メールアドレス

            GROUP: 3,                     // C: 所属グループ

            CONTINUING_PARTICIPATION: 4,  // D: 継続研修参加回数

            AVENGERS_PARTICIPATION: 5,    // E: アベンジャーズ研修参加回数

            UNREPORTED_COUNT: 6,          // F: 未報告回数

            SURVEY_RESPONSE_RATE: 7       // G: サーベイ回答率（%）

          }

        }

      },

      courseHeaders: [

        "コンプライアンス＆会社ルールについて",

        "契約＆契約手続きについて",

        "お客様対応について",

        "契約の解約・解除＆損害賠償請求について",

        "個人情報について",

        "クレーム対応の極意について",

        "クレーム対応の文書/メール作成について",

        "販売契約＆売買取引トラブル＆実需仲介について",

        "仕入れ契約＆仕入れについて",

        "マスターリース・サブリース＆トラブルについて",

        "管理委託＆賃貸借契約、賃貸借トラブル対応",

        "賃貸借トラブル対応"

      ]

    };

  }

  getFormConfig() {

    return {

      sheets: {

        attendees: {

          name: '参加情報',

          rows: { FIRST: 2 },

          columns: {

            NAME: 1,

            EMAIL: 2,

            GROUP: 3,

            COURSE_START_COL: 4

          }

        },

        events: {

          name: '予約一覧',

          rows: { FIRST: 2 },

          columns: {

            NUMBER: 1,              // A: 予約ID(自動発行)

            COURSE_ID: 2,           // B: コースID

            COURSE_NAME: 3,         // C: 予約名（自動反映）

            COURSE_DETAILS: 4,      // D: コース案内（自動反映）

            TARGET_GROUP: 5,        // E: グループ名

            COURSE_DATE: 6,         // F: 日程

            COURSE_START_TIME: 7,    // G: 開始日時

            COURSE_END_TIME: 8,     // H: 完了日時

            LOCATION: 9,            // I: 開催場所

            EVENT_ID: 10,           // J: イベントID

            EVENT_URL: 10,          // J: イベントID（EVENT_IDのエイリアス、後方互換性のため）

            STATUS: 11              // K: 予約状況

          }

        }

      },

      status: Object.freeze({

        hasAppointment: '済み',

        noAppointment: '未'

      }),

      groups: ['1期生', '2期生', '3期生'],

      form: Object.freeze({

        title: '継続研修 参加予約フォーム',

        confirmationMessage: '送信ありがとうございます。Google カレンダーの招待メールをご確認ください。',

        description:

          'このフォームでは継続研修の参加枠を予約します。メールアドレスは自動的に収集されます。',

        steps: [

          {

            title: 'STEP 1 / 2: 受講者情報の確認',

            helpText:

              '氏名を入力し、必要事項を確認してください。社内アカウントでのみ回答できます。',

            items: [

              {

                type: 'TEXT',

                title: '氏名',

                required: true,

                placeholder: '例）山田 太郎'

              },

              {

                type: 'GROUP_SELECT',

                title: '所属グループを選択してください',

                required: true,

                helpText: 'ご自身が所属するグループを選択してください。'

              },

              {

                type: 'PARAGRAPH',

                title: '備考（任意）',

                required: false,

                helpText: '連絡事項があれば入力してください。'

              }

            ]

          },

          {

            title: 'STEP 2 / 2: 参加希望日の選択',

            helpText: '参加したい研修枠を 1 つ選択してください。',

            items: [

              {

                type: 'MULTIPLE_CHOICE',

                title: '参加希望の研修枠を選択してください',

                required: true

              }

            ]

          }

        ],

        // フォーム設定
        respondentDomain: this.getProperty('RESPONDENT_DOMAIN') || null,
        spreadsheetId: this.getProperty('SPREADSHEET_ID') || '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE', // 研修管理スプレッドシートID
        spreadsheetUrl: this.getProperty('SPREADSHEET_URL') || null

      })

    };

  }

  getCalendarId() {

    return this.getProperty('CALENDAR_ID');

  }

  getSiteUrl() {

    return this.getProperty('SITE_URL') || "https://sites.google.com/ga-tech.co.jp/poc-ga-university/home";

  }

  getSlackWebhookUrl() {

    return this.getProperty('SLACK_WEBHOOK_URL');

  }

  getSlackChannel() {

    return this.getProperty('SLACK_CHANNEL') || "#bpi-solution-public";

  }

  getSlackChannelId() {

    return this.getProperty('SLACK_CHANNEL_ID') || "C068DD0619D"; // テスト用デフォルト

  }

  /**
   * グループ一覧シートから指定グループのSlackチャンネルIDを取得
   * @param {string} groupName - グループ名（例: "1期生", "2期生", "3期生"）
   * @returns {string|null} SlackチャンネルID、見つからない場合はnull
   */
  getSlackChannelIdForGroup(groupName) {
    try {
      const config = this.getConfig();
      const sheets = config.sheets;
      const spreadsheetId = this.getProperty('SPREADSHEET_ID') || '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
      
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const groupsSheet = spreadsheet.getSheetByName(sheets.groups.name);
      
      if (!groupsSheet) {
        Logger.log(`getSlackChannelIdForGroup: グループ一覧シートが見つかりません: ${sheets.groups.name}`);
        return null;
      }
      
      const lastRow = groupsSheet.getLastRow();
      if (lastRow < 2) {
        Logger.log('getSlackChannelIdForGroup: グループ一覧シートにデータがありません');
        return null;
      }
      
      const dataRows = groupsSheet.getRange(2, 1, lastRow - 1, groupsSheet.getLastColumn()).getValues();
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowGroupName = String(row[sheets.groups.columns.GROUP_NAME - 1]).trim();
        
        if (rowGroupName === groupName) {
          const slackChannelId = String(row[sheets.groups.columns.SLACK_CHANNEL_ID - 1]).trim();
          Logger.log(`getSlackChannelIdForGroup: グループ「${groupName}」のSlackチャンネルID: ${slackChannelId}`);
          return slackChannelId || null;
        }
      }
      
      Logger.log(`getSlackChannelIdForGroup: グループ「${groupName}」が見つかりませんでした`);
      return null;
    } catch (error) {
      Logger.log(`getSlackChannelIdForGroup: エラーが発生しました: ${error.toString()}`);
      return null;
    }
  }

  getSlackUsername() {

    return this.getProperty('SLACK_USERNAME') || "Googleセミナー・個別面談申込通知bot";

  }

  getInvalidValueSet() {

    return new Set(["", "#REF!", null, undefined]);

  }

  getProperty(key) {

    if (!this.props) return null;

    return this.props.getProperty(key);

  }

  // --------------------------------------------------

  // エラーハンドリング・ログ機能

  // --------------------------------------------------

  /**
   * 共通エラーメッセージ定義
   */
  getErrorMessages() {
    return {
      // スプレッドシート関連
      SPREADSHEET_NOT_FOUND: 'スプレッドシートが見つかりません',
      SHEET_NOT_FOUND: 'シートが見つかりません: {sheetName}',
      INVALID_SHEET_DATA: 'シートデータが無効です: {sheetName}',
      
      // カレンダー関連
      CALENDAR_NOT_FOUND: 'カレンダーが見つかりません: {calendarId}',
      EVENT_NOT_FOUND: 'イベントが見つかりません: {eventId}',
      CALENDAR_ACCESS_DENIED: 'カレンダーへのアクセスが拒否されました',
      
      // 予約関連
      RESERVATION_NOT_FOUND: '予約が見つかりません: {reservationId}',
      RESERVATION_ALREADY_EXISTS: '既に予約済みです: {email}',
      RESERVATION_FULL: '定員に達しています: {eventId}',
      RESERVATION_DEADLINE_PASSED: '予約期限を過ぎています: {deadline}',
      RESERVATION_CHANGE_LIMIT_EXCEEDED: '変更回数の上限に達しています（最大1回）',
      RESERVATION_CHANGE_DEADLINE_PASSED: '変更期限を過ぎています（3日前まで）',
      
      // フォーム関連
      FORM_NOT_FOUND: 'フォームが見つかりません',
      FORM_SUBMISSION_INVALID: 'フォーム送信データが無効です',
      EMAIL_NOT_FOUND: 'メールアドレスが見つかりません',
      
      // データ関連
      INVALID_DATA: 'データが無効です: {details}',
      MISSING_REQUIRED_FIELD: '必須項目が不足しています: {field}',
      DATA_TYPE_MISMATCH: 'データ型が一致しません: {field}',
      
      // システム関連
      PERMISSION_DENIED: '権限が不足しています',
      API_ERROR: 'API呼び出しエラー: {apiName}',
      TIMEOUT: 'タイムアウトが発生しました',
      UNKNOWN_ERROR: '予期しないエラーが発生しました: {error}'
    };
  }

  /**
   * エラーメッセージを取得（プレースホルダー置換対応）
   * @param {string} errorKey - エラーキー
   * @param {Object} params - プレースホルダーの値
   * @returns {string} エラーメッセージ
   */
  getErrorMessage(errorKey, params = {}) {
    const messages = this.getErrorMessages();
    let message = messages[errorKey] || messages.UNKNOWN_ERROR;
    
    // プレースホルダーを置換
    Object.keys(params).forEach(key => {
      message = message.replace(`{${key}}`, params[key]);
    });
    
    return message;
  }

  /**
   * カスタムエラークラス
   */
  createError(errorKey, params = {}, originalError = null) {
    const message = this.getErrorMessage(errorKey, params);
    const error = new Error(message);
    error.errorKey = errorKey;
    error.params = params;
    if (originalError) {
      error.originalError = originalError;
      error.stack = originalError.stack;
    }
    return error;
  }

  /**
   * ログレベル定義
   */
  getLogLevels() {
    return {
      DEBUG: 'DEBUG',
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR',
      FATAL: 'FATAL'
    };
  }

  /**
   * ログを記録（スプレッドシートにも保存）
   * @param {string} level - ログレベル
   * @param {string} message - ログメッセージ
   * @param {Object} context - コンテキスト情報
   * @param {Error} error - エラーオブジェクト（オプション）
   */
  log(level, message, context = {}, error = null) {
    const timestamp = new Date().toISOString();
    const logLevels = this.getLogLevels();
    
    // Loggerに出力
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    if (level === logLevels.ERROR || level === logLevels.FATAL) {
      Logger.log(`❌ ${logMessage}`);
      if (error) {
        Logger.log(`   エラー詳細: ${error.toString()}`);
        Logger.log(`   スタックトレース: ${error.stack || 'N/A'}`);
      }
    } else if (level === logLevels.WARN) {
      Logger.log(`⚠️  ${logMessage}`);
    } else {
      Logger.log(`ℹ️  ${logMessage}`);
    }
    
    // コンテキスト情報を出力
    if (Object.keys(context).length > 0) {
      Logger.log(`   コンテキスト: ${JSON.stringify(context)}`);
    }
    
    // スプレッドシートにログを保存（オプション）
    try {
      this.saveLogToSheet(level, message, context, error);
    } catch (logError) {
      // ログ保存の失敗は無視（無限ループを防ぐ）
      Logger.log(`ログ保存に失敗しました: ${logError.toString()}`);
    }
  }

  /**
   * スプレッドシートにログを保存
   * @param {string} level - ログレベル
   * @param {string} message - ログメッセージ
   * @param {Object} context - コンテキスト情報
   * @param {Error} error - エラーオブジェクト
   */
  saveLogToSheet(level, message, context = {}, error = null) {
    try {
      const spreadsheetId = this.getProperty('SPREADSHEET_ID') || '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      
      let logSheet = spreadsheet.getSheetByName('実行ログ');
      if (!logSheet) {
        logSheet = spreadsheet.insertSheet('実行ログ');
        logSheet.appendRow(['タイムスタンプ', 'レベル', 'メッセージ', 'コンテキスト', 'エラー詳細']);
      }
      
      const timestamp = new Date();
      const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
      const errorStr = error ? error.toString() : '';
      
      logSheet.appendRow([timestamp, level, message, contextStr, errorStr]);
      
      // ログが1000行を超えたら古いログを削除
      const lastRow = logSheet.getLastRow();
      if (lastRow > 1000) {
        logSheet.deleteRows(2, lastRow - 1000);
      }
    } catch (e) {
      // ログ保存の失敗は無視
    }
  }

  /**
   * エラーハンドリングヘルパー関数
   * @param {Function} fn - 実行する関数
   * @param {string} functionName - 関数名
   * @param {Object} context - コンテキスト情報
   * @returns {*} 関数の戻り値
   */
  handleError(fn, functionName, context = {}) {
    try {
      return fn();
    } catch (error) {
      this.log(this.getLogLevels().ERROR, `${functionName}: エラーが発生しました`, 
        { ...context, errorMessage: error.message }, error);
      
      // カスタムエラーの場合はそのまま再スロー
      if (error.errorKey) {
        throw error;
      }
      
      // その他のエラーはラップして再スロー
      throw this.createError('UNKNOWN_ERROR', { error: error.message }, error);
    }
  }

  /**
   * デバッグログ
   */
  debug(message, context = {}) {
    this.log(this.getLogLevels().DEBUG, message, context);
  }

  /**
   * 情報ログ
   */
  info(message, context = {}) {
    this.log(this.getLogLevels().INFO, message, context);
  }

  /**
   * 警告ログ
   */
  warn(message, context = {}) {
    this.log(this.getLogLevels().WARN, message, context);
  }

  /**
   * エラーログ
   */
  error(message, context = {}, errorObj = null) {
    this.log(this.getLogLevels().ERROR, message, context, errorObj);
  }

  /**
   * 致命的エラーログ
   */
  fatal(message, context = {}, errorObj = null) {
    this.log(this.getLogLevels().FATAL, message, context, errorObj);
  }

  // --------------------------------------------------

  // Slack

  // --------------------------------------------------

  /**
   * Slackメッセージを送信
   * @param {string} messageText - 送信するメッセージ
   * @param {string} channelId - 送信先のSlackチャンネルID（省略可、グループ一覧シートから取得）
   * @param {string} groupName - グループ名（channelIdが指定されていない場合、グループ一覧シートから取得）
   * @returns {boolean} 送信成功時true
   */
  sendSlack(messageText, channelId = null, groupName = null) {

    if (!messageText) {

      Logger.log("❌ Slack メッセージが空です。");

      return false;

    }

    // channelIdが指定されていない場合、グループ名から取得を試みる
    if (!channelId && groupName) {
      channelId = this.getSlackChannelIdForGroup(groupName);
    }

    // それでもchannelIdが取得できない場合、デフォルトを使用
    if (!channelId) {
      channelId = this.getProperty('SLACK_CHANNEL_ID') || this.getSlackChannelId();
    }

    // Bot Tokenが設定されている場合はSlack Web APIを使用
    const botToken = this.getProperty('SLACK_BOT_TOKEN');
    
    if (botToken && channelId) {
      return this.sendSlackWithAPI(messageText, botToken, channelId);
    }

    // Webhook URLが設定されている場合はIncoming Webhooksを使用
    const webhookUrl = this.getSlackWebhookUrl();
    if (webhookUrl) {
      return this.sendSlackWithWebhook(messageText, webhookUrl);
    }

    Logger.log("❌ Slack Webhook URLまたはBot Tokenが設定されていません。");
    Logger.log("💡 設定方法:");
    Logger.log("   1. Webhook URLを設定: スクリプトプロパティに「SLACK_WEBHOOK_URL」を追加");
    Logger.log("   2. またはBot Tokenを設定: スクリプトプロパティに「SLACK_BOT_TOKEN」と「SLACK_CHANNEL_ID」を追加");
    return false;

  }

  /**
   * Slack Web APIを使用してメッセージを送信
   */
  sendSlackWithAPI(messageText, botToken, channelId) {
    try {
      const apiUrl = 'https://slack.com/api/chat.postMessage';
      const payload = {
        channel: channelId,
        text: messageText,
        username: this.getSlackUsername()
      };

      const options = {
        method: 'post',
        headers: {
          'Authorization': 'Bearer ' + botToken,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      Logger.log(`📤 Slack送信（Web API）: ${messageText.substring(0, 60)}...`);

      const response = UrlFetchApp.fetch(apiUrl, options);
      const status = response.getResponseCode();
      const text = response.getContentText();
      const responseData = JSON.parse(text);

      Logger.log(`📡 Slackレスポンス: ${status} ${text}`);

      if (status === 200 && responseData.ok) {
        Logger.log("✅ Slack通知送信成功");
        return true;
      } else {
        Logger.log(`❌ Slack通知送信失敗: ${responseData.error || text}`);
        return false;
      }
    } catch (error) {
      Logger.log(`❌ Slack API送信エラー: ${error.toString()}`);
      return false;
    }
  }

  /**
   * Incoming Webhooksを使用してメッセージを送信
   */
  sendSlackWithWebhook(messageText, webhookUrl) {
    const channelId = this.getProperty('SLACK_CHANNEL_ID');
    const channelName = this.getSlackChannel();
    
    const payload = {
      text: messageText,
      username: this.getSlackUsername(),
      link_names: true
    };
    
    // SLACK_CHANNEL_IDが設定されていない場合のみ、channelパラメータを追加
    // （Webhook URLが特定チャンネルに紐づいている場合、channelパラメータを指定するとエラーになる）
    if (!channelId && channelName) {
      payload.channel = channelName;
    }

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    Logger.log(`📤 Slack送信（Webhook）: ${messageText.substring(0, 60)}...`);

    const response = UrlFetchApp.fetch(webhookUrl, options);
    const status = response.getResponseCode();
    const text = response.getContentText();

    Logger.log(`📡 Slackレスポンス: ${status} ${text}`);

    if (status === 200 || text === 'ok') {
      Logger.log("✅ Slack通知送信成功");
      return true;
    }

    Logger.log(`❌ Slack通知送信失敗 status=${status} body=${text}`);
    return false;
  }

  extractIdFromQuestionString(string) {

    const regex = /\(id:\s*([^)]+)\)$/;

    const match = string.match(regex);

    if (match && match[1]) {

      return match[1];

    }

    else {

      return "";

    }

  }

  calendarApp() {

    return CalendarApp;

  }

  addGuestToCalendarEvent(calendarId, eventId, guestEmail) {

    const calendar = CalendarApp.getCalendarById(calendarId);

    if (!calendar) {

      Logger.log('Calendar not found: ' + calendarId);

      return false;

    }

    const event = calendar.getEventById(eventId);

    if (!event) {

      Logger.log('Event not found:' + eventId);

      return false;

    }

    event.addGuest(guestEmail);

    return true;

  }

  removeGuestFromCalendarEvent(calendarId, eventId, guestEmail) {

    const calendar = CalendarApp.getCalendarById(calendarId);

    if (!calendar) {

      Logger.log('removeGuestFromCalendarEvent: Calendar not found: ' + calendarId);

      return false;

    }

    let event = calendar.getEventById(eventId);

    if (!event && eventId.indexOf('@') === -1) {

      event = calendar.getEventById(`${eventId}@google.com`);

    }

    if (!event) {

      Logger.log('removeGuestFromCalendarEvent: Event not found: ' + eventId);

      return false;

    }

    const normalizedEmail = guestEmail.trim().toLowerCase();

    const existingGuests = event

      .getGuestList()

      .map((guest) => guest.getEmail().trim().toLowerCase());

    if (!existingGuests.includes(normalizedEmail)) {

      Logger.log(`removeGuestFromCalendarEvent: ゲストは既に削除済みです email=${guestEmail}, eventId=${eventId}`);

      return true;

    }

    event.removeGuest(guestEmail);

    Logger.log(`removeGuestFromCalendarEvent: ゲスト削除完了 email=${guestEmail}, eventId=${eventId}`);

    return true;

  }

  eventIdFromURL(url) {

    const id = url.split("eid=")[1];

    const decoded = this.base64DecodeString(id);

    return decoded.split(" ")[0];

  }

  base64DecodeString(encodedString, encoding = 'UTF-8') {

    try {

      const decodedBytes = Utilities.base64Decode(encodedString);

      const decodedBlob = Utilities.newBlob(decodedBytes);

      return decodedBlob.getDataAsString(encoding);

    }

    catch (e) {

      Logger.log("Error decoding Base64 string: " + e.message);

      return "";

    }

  }

  getSheetByName(name) {

    const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();

    return spreadSheet.getSheetByName(name);

  }

  description() {

    return "LMS Shared Utilities";

  }

}

/* 

Factory, because Libraries in GAS do not give access to new, let, etc. 

*/

function Utils() {

  return new LMSUtils();

}

class LMSSlack {

  constructor(webhookURL, username, channel) {

    this.webhookURL = webhookURL;

    this.data = {

      channel: channel,

      username: username,

      link_names: true,

      icon_emoji: ":cooke_inc3:"

    };

  }

  send(text) {

    this.data.text = text;

    return this.sendRequest(this.data);

  }

  sendRequest(data) {

    const requestDetails = {

      "method": "POST",

      "contentType": "application/json",

      "payload": JSON.stringify(data),

      "muteHttpExceptions": true,

    };

    return UrlFetchApp.fetch(this.webhookURL, requestDetails);

  }

  description() {

    return "LMS Slack Integration";

  }

}

/* 

Factory, because Libraries in GAS do not give access to new, let, etc. 

*/

function Slack(webhookURL, username, channel) {

  return new LMSSlack(webhookURL, username, channel);

}
