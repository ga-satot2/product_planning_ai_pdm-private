# テストカバレッジ分析レポート

**分析日**: 2026-03-30
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

## 6. 推奨実装順序

1. **テストヘルパー導入** (`assertEqual`等) — 全テスト品質の底上げ
2. **`LMSUtils.gs`テスト** — 全モジュールが依存する基盤
3. **`webapp.gs`テスト** — ユーザー向け機能のカバレッジ確保
4. **`sync_existing_events.gs`テスト** — データ破損リスクの高い照合ロジック
5. **`form_submit.gs`テスト** — 主要ユーザーフローの保護
6. **`api_endpoint.gs`テスト** — 外部入力の検証
7. **既存テストのアサーション強化** — 偽陽性の排除
