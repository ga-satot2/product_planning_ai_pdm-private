# LMS Webアプリ 検証手順

**対象**: `webapp.gs` および HTML テンプレートで提供する Web アプリ（ホーム・コース一覧・予約・マイページ・管理者）

---

## 1. 検証の前提

- 研修管理スプレッドシート（`SPREADSHEET_ID`）のスクリプトプロパティが設定済みであること
- コース一覧・予約一覧・参加情報シートにデータが入っていること（空でも表示は確認可能）
- 検証用の Google アカウントが、デプロイ先の「アクセスできるユーザー」に含まれること

---

## 2. デプロイ後の検証手順

### 2.1 デプロイの実行

```bash
cd development/prototypes
./scripts/deploy.sh
```

初回は Apps Script エディタで「デプロイ」→「新しいデプロイ」→「種類: Web アプリ」でデプロイを作成し、URL を控える。

### 2.2 Web アプリ URL の取得

- 方法A: `clasp deployments` の出力で「Web アプリ」の URL を確認
- 方法B: Apps Script エディタ → 「デプロイ」→「デプロイを管理」→ 該当デプロイの URL をコピー

URL の形式: `https://script.google.com/macros/s/【デプロイID】/exec`

### 2.3 画面ごとの確認

ブラウザでログインした状態で、次の URL にアクセスする。

| 確認項目 | URL | 期待する結果 |
|----------|-----|--------------|
| ホーム | `{URL}?page=home` | トップが表示され、参加情報に自分のメールが登録されていれば「あなたの情報」が表示される |
| コース一覧 | `{URL}?page=courses` | コース一覧シートの内容が表示され、グループ一致時は「予約する」リンクが出る |
| 予約ページ | `{URL}?page=reservation&courseId={コースID}` | 該当コースの予約一覧枠（セッション）が表示される。コースID はコース一覧のリンクから遷移で確認 |
| マイページ | `{URL}?page=mypage` | 参加情報に自分のメールがあれば「予約一覧」に予約済み/参加済みのコースが表示される |
| 管理者 | `{URL}?page=admin` | `isAdmin()` で許可されたメールのみ統計カードとメニューが表示される。それ以外は「管理者権限が必要です」 |

### 2.4 API エンドポイントの確認（従来 API）

Web アプリの同一 URL で、`?function=...` を付けると API として動作する。

| 確認項目 | URL 例 | 期待する結果 |
|----------|--------|--------------|
| 参加情報同期 | `{URL}?function=syncParticipantsFromAttendance` | HTML または JSON で実行結果が返る |

POST で `function` を指定する場合は、Body に `{"function": "syncParticipantsFromAttendance"}` などを送信して確認する。

### 2.5 エラー系の確認

- 存在しないページ: `{URL}?page=unknown` → 「ページが見つかりません」が表示されること
- 未ログインまたは権限外: デプロイの「アクセスできるユーザー」によってはログイン画面または 403 が表示されること

---

## 3. データ整合性の確認

- **コース一覧**: スプレッドシートの「コース一覧」シートと表示内容（コース名・グループ）が一致するか
- **予約一覧（枠）**: 「予約一覧」シートでイベントIDが入っている行のみ「セッション」として表示される。予約状況が「予約受付中」等の有効値であること
- **マイページ**: 参加情報シートの該当メールの行で、コース列が「予約済み」「参加済み」の列に対応するコースが表示されること

---

## 4. トラブル時の確認ポイント

- 画面が真っ白: ブラウザの開発者ツールでコンソールエラーを確認。`getUserEmail()` や `include()` の失敗がないか
- 「シートが見つかりません」: スクリプトプロパティの `SPREADSHEET_ID` と、実際のスプレッドシートのシート名（コース一覧・予約一覧・参加情報）が一致しているか
- コース/予約が一件も出ない: シートのデータ開始行（ヘッダー下一行目）と `WEBAPP_CONFIG` の `*_ROW_FIRST` が一致しているか、列インデックスが実シートと合っているか

---

---

## 5. clasp run での動作確認（API 実行可能デプロイ済みの場合）

以下は同一プロジェクトで `clasp run 関数名` を実行したときの結果例。スプレッドシート／カレンダーに依存する関数は clasp run の実行権限で失敗することがある（その場合は GAS エディタで実行）。

| 関数 | 結果 | 備考 |
|------|------|------|
| getSystemStats | OK | オブジェクト返却 |
| getUserEmail | OK | メールアドレス返却 |
| isAdmin(email) | OK | true/false（例: `--params '["t_sato2@ga-tech.co.jp"]'`） |
| formatDate(date) | OK | 日付文字列（例: `--params '["2026-02-20"]'`） |
| getAvailableGroups | 権限エラー | SpreadsheetApp のスコープが clasp run で付与されない場合あり |
| testSheetFunctions | 完了 | 戻り値なし。Logger は GAS の実行ログで確認 |
| testAllSheetFunctions | 完了 | 同上 |
| testAll | 完了 | 同上。カレンダー／シートに依存する処理は環境次第 |

---

## 6. 手動で権限を付与する手順（clasp run で SpreadsheetApp 等を使う場合）

`clasp run getAvailableGroups` などで「You do not have permission to call SpreadsheetApp.openById」が出る場合、**GAS エディタで一度その関数を実行し、ブラウザの権限ダイアログで「許可」すると、同じアカウントで clasp run が通ることがある**。

### 6.1 前提

- 対象スプレッドシート（`SPREADSHEET_ID` のシート）を、**clasp でログインしているアカウント**（例: t_sato2@ga-tech.co.jp）と**共有**しておく（閲覧者以上）。共有されていないとスプレッドシートへのアクセスは許可されない。

### 6.2 手順

1. **GAS エディタを開く**
   - **推奨**: ターミナルで `cd private/projects/legal_department/legal_training_lms/documents/4_executing/development/prototypes` に移動し、`clasp open` を実行する。紐付いているプロジェクト（法務研修LMS の prototypes 用スクリプト）がブラウザで開く。
   - **直接URL**: 同じプロジェクトを開く URL は `https://script.google.com/d/{scriptId}/edit`。scriptId は `development/prototypes/.clasp.json` の `scriptId`（例: `1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-`）なので、`https://script.google.com/d/1DiZUSkJU_Z4Yc0bBcNgOUH3iqHux8xnSS7qILL5YZMfKgw86QeMvx0S-/edit` で開ける。
   - または [script.google.com](https://script.google.com) の「マイ プロジェクト」から、**法務研修LMS / 研修管理用のスタンドアロンスクリプト**（名前は環境により異なる）を選ぶ。

2. **権限が必要な関数を選んで実行**
   - 上部の「実行する関数を選択」プルダウンから、例えば **getAvailableGroups** や **getSystemStats** を選ぶ
   - 「実行」ボタン（再生アイコン）をクリック

3. **初回のみ: 権限の許可**
   - 「権限を確認」や「承認が必要です」と出たら「権限を確認」をクリック
   - 表示された Google アカウントでログイン（clasp で使っているアカウントを選ぶ）
   - 「このアプリは確認されていません」と出たら「詳細」→「〇〇（安全なページ）に移動」をクリック
   - 「〇〇が次の権限をリクエストしています」で **「許可」** をクリック（スプレッドシートへのアクセスなどが一覧表示される）

4. **実行完了を確認**
   - エディタ下部の「実行ログ」にエラーがなければ、そのアカウントでスプレッドシート等の権限が付与された状態になる

5. **clasp run を再試行**
   - ターミナルで `clasp run getAvailableGroups` を再度実行。同じアカウントで実行されるため、通ることがある

### 6.3 それでも clasp run が通らない場合

- 組織の「API のアクセス制御」で Apps Script の実行 API が制限されていると、clasp run だけ権限が付かないことがある。
- その場合は **clasp は push 用に使い、関数の実行・検証は GAS エディタで「実行する関数を選択」から行う**運用でよい。

**参照**: ワークスペース共通の `scripts/google_apps_script/inquiry_similarity/CLASP_TROUBLESHOOTING.md` の「clasp run が動かないとき」「SpreadsheetApp.openById の権限がない」の節。

---

**参照**: [deployment.md](../../deployment.md) Step 5・Step 6、[開発セットアップガイド](../02_development/開発セットアップガイド.md) デプロイ節
