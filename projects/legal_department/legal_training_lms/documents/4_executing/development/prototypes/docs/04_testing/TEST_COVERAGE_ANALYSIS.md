# テストカバレッジ分析レポート

**分析日**: 2026-04-04（全ファイル精読に基づく改訂版）
**分析対象**: Legal Training LMS + Slack通知システム

---

## 1. 現状サマリー

| 項目 | 値 |
|------|-----|
| プロダクションコード総量 | 約26ファイル, ~9,600行 |
| テストファイル | 1ファイル (`tests.gs`, ~2,500行) |
| テスト関数数 | 34関数 |
| テスト対象の本番関数 | 約25関数 (部分的カバレッジ含む) |
| テスト未対象の本番関数 | 約40関数以上 |
| テストフレームワーク | なし (Logger.logベースの手動検証) |
| アサーション手法 | 目視確認 (✅/❌ログ出力) |
| CI/CD連携 | なし (Playwrightスクリプトによる半自動実行) |

---

## 2. ファイル別テストカバレッジ

### テスト済み (部分的含む)

| ファイル | 行数 | テスト関数 | カバレッジ評価 |
|---------|------|-----------|-------------|
| `reservation.gs` | 273行 | `testCancelReservation`, `testChangeReservation`, `testMarkAttendeeAsReserved`, `testMarkAttendeeAsUnreserved` | **中** - 主要フローは網羅だが、エッジケースの独立テストなし |
| `reservation_enhanced.gs` | 486行 | `testEnhancedFunctions`, `testGetReservedCountForGroupAndCourse`, `testUpdateDashboardAfterReservation` | **低〜中** - `checkEventCapacity`, `checkDuplicateReservation`は呼び出すのみ、`updateReservationVisualization`のロジック検証なし |
| `handlers.gs` | 532行 | `testRefreshAttendeeStatus`, `testOnCreatingSchedule`, `testOnDashboardAction`, `testEditHandler` | **中** - モックイベントで動作確認済み、但しモックが不完全 |
| `calendar_enhanced.gs` | 342行 | `testCalendarEnhancedFunctions`, `testDeleteCalendarEvent`, `testSyncCalendarOnReservationChange` | **中** - ロールバック動作のテストなし |
| `reservation_change.gs` | 487行 | `testReservationChangeFunctions`, `testChangeDeadlineBoundary`, `testChangeLimitBoundary` | **中** - 境界テストあるが`getAvailableSessionsForChange`, `generateReservationChangeForm`は未テスト |

### テスト未実施 (テスト関数なし)

| ファイル | 行数 | 主要関数 | リスクレベル |
|---------|------|---------|-----------|
| **`LMSUtils.gs`** | 1,146行 | `getConfig`, `getErrorMessage`, `createError`, `handleError`, `log`, `sendSlack`, `sendSlackWithAPI`, `sendSlackWithWebhook`, `extractIdFromQuestionString`, `eventIdFromURL`, `addGuestToCalendarEvent`, `removeGuestFromCalendarEvent` | **最高** |
| **`webapp.gs`** | 828行 | `doGet`, `doPost`, `handleCreateReservation`, `handleCancelReservation`, `getParticipantByEmail`, `getReservationsByEmail`, `isAdmin`, `getSystemStats`, `webapp_registerParticipant` | **高** |
| **`sync_existing_events.gs`** | 487行 | `syncExistingCalendarEvents` (タイトル/日時/場所マッチング、複数カレンダー横断検索) | **高** |
| **`form_submit.gs`** | 314行 | `form_onFormSubmit`, `form_updateAttendeeStatus`, `form_getCourseNumberFromCourseList` | **高** |
| **`api_endpoint.gs`** | 208行 | `runApiEndpointPost`, `runApiEndpointGet` (関数名によるディスパッチ、パラメータ検証) | **中〜高** |
| **`form_build.gs`** | ~400行 | フォーム動的生成 | **中** |
| **`form_data.gs`** | ~300行 | フォーム回答データ取得・解析 | **中** |
| **`form_helpers.gs`** | ~200行 | フォームユーティリティ | **低〜中** |
| **`form_config.gs`** | ~150行 | フォーム設定 | **低** |
| **`form_triggers.gs`** | ~100行 | トリガー管理 | **低** |
| **`form_cleanup.gs`** | ~100行 | フォームクリーンアップ | **低** |
| **`form_rebuild.gs`** | ~200行 | フォーム再構築 | **中** |
| **`personnel_eval_aggregate.gs`** | ~300行 | 人事評価集計 | **中** |
| **`update_email_addresses.gs`** | ~200行 | メールアドレス更新 | **中** |
| **`utils.gs`** | ~100行 | グローバルユーティリティ | **低** |
| **`calendar.gs`** | ~100行 | 基本カレンダー操作 | **低** |
| **`notify_sublease_application.gs`** (別プロジェクト) | 827行 | Slack通知、CONTRACT_IDフィルタリング、日付検証、スレッド投稿 | **高** |
| **`src/code.gs`** | ~1,400行 | スプレッドシートバウンドスクリプト (重複コード) | **中** |
| **`src/data_migration.gs`** | ~200行 | データマイグレーション | **低** |

---

## 3. テスト品質の課題

### 3.1 アサーションの欠如

現在のテストは全て`Logger.log()`による目視確認に依存しています。

**問題例** (`testMarkAttendeeAsReserved`):
```javascript
markAttendeeAsReserved(testEmail, testEventId, utilsInstance);
Logger.log('✅ markAttendeeAsReserved()実行完了');
```
- 関数がエラーなく完了したことしか確認していない
- 実際にスプレッドシートの値が変更されたかを検証していない
- 戻り値・副作用の検証がない

**改善案**: `assertEqual()`ヘルパーの導入
```javascript
function assertEqual(actual, expected, message) {
  if (actual === expected) {
    Logger.log(`✅ PASS: ${message}`);
    return true;
  } else {
    Logger.log(`❌ FAIL: ${message}`);
    Logger.log(`   期待値: ${JSON.stringify(expected)}`);
    Logger.log(`   実際値: ${JSON.stringify(actual)}`);
    return false;
  }
}
```

### 3.2 テストデータの依存性

テストは実際のGoogle APIs（Calendar, Sheets, Forms）に依存しており：
- テスト実行のたびにカレンダーイベントが作成される
- ネットワーク状態やAPI制限に影響される
- テスト結果が非決定的

### 3.3 モックの不完全性

`testOnCreatingSchedule()`のモックイベントは`setValue()`をログ出力するだけで、実際のシート更新を検証していません。

### 3.4 テストの独立性

`testAll()`は全テストを逐次実行しますが、テスト間に状態依存があり（例: `createTestEventsForChangeAndTest`の結果を後続テストが利用）、個別テスト実行時に失敗する可能性があります。

---

## 4. 改善提案（優先度順）

### Priority 1: 最重要（リスク最高、影響範囲最大）

#### 4.1 `LMSUtils.gs` のユニットテスト追加

全モジュールが依存するコアライブラリにテストがありません。

**テストすべき関数と観点**:

| 関数 | テスト観点 |
|------|----------|
| `extractIdFromQuestionString(string)` | 正常パターン `"テスト研修 (id: abc123)"` → `"abc123"`, 不正パターン（idなし、空文字、null） |
| `eventIdFromURL(url)` | 正常なカレンダーURL, eid=が無いURL, 空文字 |
| `getErrorMessage(errorKey, params)` | 全エラーキー、プレースホルダー置換、未定義キーのフォールバック |
| `createError(errorKey, params, originalError)` | errorKey/params/stackの保持、originalErrorのチェーン |
| `handleError(fn, functionName, context)` | 正常実行時の戻り値、カスタムエラーの再スロー、一般エラーのラッピング |
| `sendSlack(messageText, channelId, groupName)` | 空メッセージ, Bot Token経由, Webhook経由, フォールバック順序 |
| `getConfig()` | 設定構造の整合性（シート名、列番号の妥当性） |
| `getInvalidValueSet()` | セットの内容確認 |

#### 4.2 `webapp.gs` のユニットテスト追加

ユーザー向けWebアプリに一切のテストがありません（828行、30+関数）。

**テストすべき関数と観点**:

| 関数 | テスト観点 |
|------|----------|
| `doGet(e)` | 各pageパラメータへのルーティング、不明ページのエラーハンドリング、API呼び出しのディスパッチ |
| `doPost(e)` | 各actionパラメータへのルーティング、不明アクションのレスポンス |
| `isAdmin(email)` | 管理者メール判定の正確性 |
| `handleCreateReservation(params, user)` | 必須パラメータ欠如、未登録ユーザー、重複予約、正常予約 |
| `handleCancelReservation(params, user)` | 予約なしキャンセル、正常キャンセル |
| `getParticipantByEmail(email)` | 存在するメール、存在しないメール、null入力 |
| `getReservationsByEmail(email)` | 予約あり/なしの両パターン |
| `webapp_updateAttendeeStatus(email, courseNumber, status)` | 範囲外コース番号（0, 13）、存在しないメール |
| `webapp_registerParticipant(name, email, group)` | 新規登録、重複登録 |

### Priority 2: 高リスク

#### 4.3 `sync_existing_events.gs` のテスト追加

487行のデータ照合ロジックにテストがゼロです。

**テストすべき観点**:
- タイトルマッチング（プレフィックス除去: `【継続⑤】` → コース名の一致判定）
- 日時マッチング（5分以内の誤差許容ロジック）
- 場所マッチング（キーワード抽出: `"ISLAND(39F)"` → 数字`39`とキーワード`ISLAND`の部分一致）
- eventId既設定行のスキップ判定
- 必須フィールド不足行のスキップ判定
- 複数カレンダー横断検索の優先順序

**特記**: `syncExistingCalendarEvents()`内の`extractKeywords()`や日時構築ロジックは純粋関数に抽出してユニットテスト可能にすべきです。

#### 4.4 `form_submit.gs` のテスト追加

フォーム送信はユーザー操作の主要エントリポイントです。

**テストすべき観点**:
- `form_onFormSubmit(e)`: モックイベントでの正常フロー（定員チェック→重複チェック→カレンダー追加→参加情報更新→メール送信）
- `form_updateAttendeeStatus()`: コースID→番号→丸数字（①②...）変換とスプレッドシート更新
- `form_getCourseNumberFromCourseList()`: 正常検索、存在しないコースID

#### 4.5 `api_endpoint.gs` のテスト追加

外部APIエンドポイントは入力バリデーションが重要です。

**テストすべき観点**:
- `runApiEndpointPost()`: 各functionNameへのディスパッチ、未知のfunctionName、必須パラメータ欠如
- `runApiEndpointGet()`: 各functionNameへのディスパッチ

### Priority 3: 中リスク

#### 4.6 `notify_sublease_application.gs` のテスト追加（別プロジェクト）

827行のSlack通知システムにテスト関数はありますが、フィルタリングロジックのユニットテストがありません。

**テストすべき観点**:
- CONTRACT_IDフィルタリング（前回IDより大きいものだけ通知）
- ORDERED_DATE検証（90日以内チェック）
- STATUS/CURRENT_SITUATIONの複合フィルタ
- `createSlackMessage()` のBlock Kit形式
- `getColumnValue()` の境界値（列が存在しない、値がnull）

#### 4.7 既存テストの品質向上

| 改善項目 | 内容 |
|---------|------|
| **アサーション導入** | `assertEqual()`, `assertNotNull()`, `assertThrows()`ヘルパー関数を追加 |
| **結果の自動判定** | テスト実行時にpass/fail/skipカウントを自動集計 |
| **テストファイル分割** | `tests.gs`を`tests_reservation.gs`, `tests_handlers.gs`等に分割 |
| **テスト隔離** | 各テスト前後でデータのsetup/teardownを明示化 |

---

## 5. 構造的改善提案

### 5.1 テストヘルパーの導入

```javascript
// test_helpers.gs
var TestResults = { passed: 0, failed: 0, skipped: 0, errors: [] };

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    TestResults.passed++;
    Logger.log(`  ✅ ${message}`);
  } else {
    TestResults.failed++;
    TestResults.errors.push(message);
    Logger.log(`  ❌ ${message}: 期待=${JSON.stringify(expected)}, 実際=${JSON.stringify(actual)}`);
  }
}

function assertNotNull(value, message) {
  assertEqual(value !== null && value !== undefined, true, message);
}

function assertThrows(fn, message) {
  try {
    fn();
    TestResults.failed++;
    Logger.log(`  ❌ ${message}: 例外が発生しませんでした`);
  } catch (e) {
    TestResults.passed++;
    Logger.log(`  ✅ ${message}: ${e.message}`);
  }
}

function printTestSummary() {
  Logger.log('\n' + '='.repeat(60));
  Logger.log(`テスト結果: ${TestResults.passed} passed, ${TestResults.failed} failed, ${TestResults.skipped} skipped`);
  if (TestResults.errors.length > 0) {
    Logger.log('失敗したテスト:');
    TestResults.errors.forEach(e => Logger.log(`  - ${e}`));
  }
  Logger.log('='.repeat(60));
}
```

### 5.2 純粋関数の抽出

テスト困難なコード（Google APIs依存）からロジック部分を分離：

- `sync_existing_events.gs`の`extractKeywords()` → 独立関数に抽出
- `LMSUtils.gs`の`extractIdFromQuestionString()` → 既に純粋関数、テスト追加のみ
- `webapp.gs`の`isAdmin()` → テスト容易
- `reservation_change.gs`の日付計算ロジック → 純粋関数に抽出

### 5.3 テストモードの統一

現在テストモードの管理が散在しています（`testEmail`フィルタ、`isTest`フラグ等）。統一的なテストコンテキスト管理を導入すべきです。

---

## 6. 全ファイル詳細分析（2026-04-04 追加）

### 6.1 フォーム関連モジュール群（テスト0件）

フォーム関連は8ファイルに分割されていますが、**いずれもテスト関数がありません**。

#### `form_data.gs` (313行) — **テスト優先度: 高**

純粋関数が多く、テスト容易性が高いファイルです。

| 関数 | テスト観点 | 難易度 |
|------|----------|--------|
| `form_mergeDateAndTime(datePart, timePart)` | **最優先**: Date型、文字列`"15:00"`、Excelシリアル値、null、無効値。GAS外でもテスト可能な純粋関数 | 低 |
| `form_formatDate(date)` / `form_formatTime(date)` | 正常Date、NaN Date、null | 低 |
| `form_mapEventRow(row, utils, period, index)` | 必須フィールド不足時のnull返却、無効値(#REF!等)のフィルタ、eventId空時の`isValid=false` | 中 |
| `form_isSessionAvailableForGroup(session, groupName)` | targetGroup完全一致、コースID`FY26-01`→`1期生`マッピング、targetGroup空時の全グループ表示 | 低 |
| `form_buildSessionChoiceLabel(session, utils)` | eventId空時のnull返却、日時フォーマット、`(id: xxx)`形式の生成 | 低 |

#### `form_build.gs` (446行) — **テスト優先度: 中**

Google Forms APIに強く依存するため直接のユニットテストは難しいですが、以下のロジック検証は可能：

| 関数 | テスト観点 |
|------|----------|
| `form_buildTwoStepForm(form)` | グループ0件時の動作、重複タイトル処理 |
| `form_buildSingleGroupForm(form, groupName)` | GROUP_SELECTスキップの確認、研修枠0件時の選択肢 |
| `form_updateGroupFormUrl(groupName, formId)` | `formSheets.groups`がundefined時のフォールバック処理 |

#### `form_submit.gs` (314行) — **テスト優先度: 高**

ユーザーのフォーム送信を処理する重要モジュール。

| 関数 | テスト観点 |
|------|----------|
| `form_onFormSubmit(e)` | 正常フロー全体(定員チェック→重複チェック→カレンダー追加→メール送信)、e.response無し時のエラー |
| `form_updateAttendeeStatus(email, eventId)` | コースID→番号→丸数字(`①`~`⑫`)変換、コース番号取得失敗時のフォールバック（コース名検索） |
| `form_getCourseNumberFromCourseList(courseId)` | 正常取得、存在しないコースID、ヘッダーに必須列が無い場合 |

#### `form_rebuild.gs` (194行) — **テスト優先度: 低〜中**

| 関数 | テスト観点 |
|------|----------|
| `form_rebuildTrainingFormForGroup(groupName)` | 既存フォームID有/無、フォーム取得失敗時の再作成 |
| `form_rebuildTrainingForm(formId)` | アイテム削除リトライ(最大3回)の動作確認 |

#### その他フォーム関連

| ファイル | 行数 | 内容 | テスト優先度 |
|---------|------|------|-----------|
| `form_utils.gs` | 110行 | 遅延初期化、スプレッドシートopen(ID/URL/Active) | 低 |
| `form_config.gs` | 35行 | 設定アクセス関数のエイリアス | 低 |
| `form_helpers.gs` | 28行 | 後方互換エイリアスのみ | 不要 |
| `form_triggers.gs` | 123行 | トリガー管理（設定/削除/一覧） | 低 |
| `form_cleanup.gs` | 105行 | Form Responsesシート削除(正規表現`/^Form\s+responses?\s+\d+$/i`) | 低 |

### 6.2 `utils.gs` (98行) — グローバル初期化

テスト不要ですが、**テスト時の注意点**があります：

```javascript
// グローバルスコープで実行される（テスト時も含む）
const preset_values = getPresetValues();
const sheets = getSheets();
const COURSE_HEADERS = getCourseHeaders();
const calendarId = getCalendarId();
const site_url = getSiteUrl();
const invalid_values = getInvalidValueSet();
```

これらのグローバル定数は、テスト環境でPropertiesServiceが使えない場合にエラーを起こします。テスト実行時の環境分離が必要。

### 6.3 `calendar.gs` (124行) — **テスト優先度: 中**

| 関数 | テスト観点 |
|------|----------|
| `extractEmailFromEvent(e)` | `e.response.getRespondentEmail()`経由、`e.namedValues`経由、e無し、メール無し |
| `extractEventIdFromEvent(e, utils)` | `(id: xxx)`形式からの抽出、配列回答、回答無し |
| `extractEventIdFromAnswer(answer, utils)` | 文字列に`(id: xxx)`含む、配列の再帰処理、null |
| `addGuestToCalendarEvent(calendarId, eventId, email)` | 既存ゲスト重複時の`true`返却、`@google.com`サフィックス追加 |

**特記**: `extractEmailFromEvent()`と`extractEventIdFromAnswer()`は純粋関数に近く、モック無しでテスト可能。

### 6.4 `personnel_eval_aggregate.gs` (131行) — **テスト優先度: 中**

| 関数 | テスト観点 |
|------|----------|
| `buildCourseNameToTrainingType(sheet, col)` | コース名→研修種別マッピング、未設定時のデフォルト「継続研修」 |
| `aggregateFromAttendees(sheet, col, map)` | 「参加済み」ステータスのカウント、アベンジャーズ/継続の分類 |
| `writeSummary(sheet, stats, col)` | 空配列時の早期リターン |

### 6.5 `update_email_addresses.gs` (350行) — **テスト優先度: 低〜中**

| 関数 | テスト観点 |
|------|----------|
| `updateEmailAddressesFromHRData()` | ヘッダー自動検出ロジック（「名前」「氏名」「name」等）、スペースあり/なし名前の正規化マッチング、既存メール時のスキップ |

### 6.6 `webapp.gs` (828行) — 全関数詳細

前回レポートに追加して、以下の関数が特にテスト重要：

| 関数 | 行 | テスト観点 | 重要度 |
|------|-----|----------|--------|
| `handleCreateReservation()` | 586-641 | 未登録ユーザー拒否、カレンダー未設定時のフォールバック、重複予約チェック(`RESERVED_STATUS_VALUES`)、正常予約後のシート更新 | **最高** |
| `webapp_registerParticipant()` | 763-796 | 必須項目検証、重複メール拒否、存在しないグループ拒否、`setValues`の列数計算（`AT.COURSE_START + 12`） | **高** |
| `isAdmin()` | 693-696 | ハードコードされた管理者リスト`['admin@example.com', 't_sato2@ga-tech.co.jp']` — **セキュリティ上の問題**: 本番環境で`admin@example.com`が残っている | **高** |
| `getReservationsByEmail()` | 453-483 | コース列offset計算、`RESERVED_STATUS_VALUES`(`['予約済み', '参加済み']`)との突合 | 中 |
| `getCourseIdByNumberAndGroup()` | 485-495 | 番号+グループ名の複合マッチング | 中 |

### 6.7 `notify_sublease_application.gs` (827行, 別プロジェクト) — テスト関数の問題

テスト関数は存在しますが、全て**手動実行テスト**（`testManualExecution`, `testFrom43000`等）で、フィルタリングロジック自体のユニットテストはありません。

**テストすべき純粋ロジック**:
- `getColumnValue(row, headerRow, columnName)` — 列名→値の取得、列不存在時
- CONTRACT_IDによる新規判定ロジック（`lastContractId`との比較）
- ORDERED_DATEの90日以内フィルタ
- STATUS=`申込` かつ CURRENT_SITUATION=`サブリース中` の複合条件
- `createSlackMessage()` — Block Kit形式の出力検証

---

## 7. 既存テストの具体的問題点（コード精読結果）

### 7.1 偽陽性テスト

`testEventCapacityBoundary()`（1499-1609行）は定員0人・null・最大値をテストしますが、**実際の`checkEventCapacity()`は常にmaxAttendees=999を返す設計**（reservation_enhanced.gs:46-47行）のため、定員0テストのsetValue操作は無意味です：

```javascript
// reservation_enhanced.gs:46-47
const maxAttendees = 999; // デフォルトは無制限（スプレッドシートにMAX_ATTENDEES列は存在しない）
```

テストコードは`sheets.events.columns.MAX_ATTENDEES`を参照しますが、**この列は存在しません**。

### 7.2 モック不完全テスト

`testOnCreatingSchedule()`のモックは`getRange().getValue()`を返しますが、`getRange().setValue()`を呼ぶ実装パスを`Logger.log`で消化するだけで、**値が正しく設定されたかを検証していません**。

### 7.3 テスト間依存

`testAll()`→`createTestEventsForChangeAndTest()`→`testAllSheetFunctions()`→`testAllUntestedFunctions()`の順序で実行され、最初のテスト用イベント作成が失敗すると後続の全テストが`⚠️ テストデータが取得できませんでした`でスキップされます。

---

## 8. 推奨実装順序（改訂版）

1. **テストヘルパー導入** (`assertEqual`, `assertNotNull`, `assertThrows`, `printTestSummary`) — 全テスト品質の底上げ
2. **`form_data.gs`の純粋関数テスト** — `form_mergeDateAndTime`, `form_isSessionAvailableForGroup`等。テスト容易、即効性高
3. **`LMSUtils.gs`テスト** — `extractIdFromQuestionString`, `getErrorMessage`, `handleError`。全モジュールが依存する基盤
4. **`calendar.gs`テスト** — `extractEmailFromEvent`, `extractEventIdFromAnswer`。純粋関数でテスト容易
5. **`webapp.gs`テスト** — `handleCreateReservation`, `isAdmin`, `webapp_registerParticipant`。ユーザー向け機能
6. **`sync_existing_events.gs`テスト** — タイトル/日時/場所マッチングロジック。データ破損リスク高
7. **`form_submit.gs`テスト** — `form_onFormSubmit`フロー、コース番号→丸数字変換
8. **`api_endpoint.gs`テスト** — 入力バリデーション
9. **`isAdmin()`のセキュリティ修正** — `admin@example.com`の除去、設定ベースの管理者リストへの移行
10. **既存テストのアサーション強化** — 偽陽性(`testEventCapacityBoundary`等)の修正
