# スプレッドシート内のID関連整理

**作成日**: 2026-01-05  
**スプレッドシートID**: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`

---

## 📋 概要

このドキュメントは、研修管理スプレッドシート内の各シートに存在するIDと、それらの関連性を整理したものです。特に、**予約一覧の予約IDと参加情報の紐付け方法**について詳しく説明します。

---

## 🔑 各シートのID一覧

### 1. グループ一覧シート

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | グループ名 | **グループ名** | 1期生、2期生、3期生など |

**特徴**:
- グループ名が主キーとして機能
- 他のシートから参照される

---

### 2. コース一覧シート（GID: 1504366156）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 番号 | **番号** | ①、②、③...に対応する数値（1, 2, 3...） |
| B | 開催年度 | - | FY26など |
| C | 所属グループ | **グループ名** | グループ一覧シートを参照 |
| D | コースID | **コースID** | FY26-XX-XX形式の一意識別子 |
| E | コース名 | - | コースの名称 |

**特徴**:
- **コースID**が主キーとして機能
- **番号**は参加情報シートの列名（①、②、③...）に対応
- **所属グループ**でグループ一覧シートと関連

---

### 3. 予約一覧シート（GID: 0）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 予約ID | **予約ID** | 自動採番される一意識別子 |
| B | コースID | **コースID** | コース一覧シートを参照 |
| C | 予約名 | - | コース名 |
| D | コース案内 | - | コース説明 |
| E | 日程 | - | 開催日 |
| F | 開始日時 | - | 開始時刻 |
| G | 完了日時 | - | 終了時刻 |
| H | イベントID | **イベントID** | Google CalendarイベントID |
| I | 最大参加者数 | - | 定員 |
| J | 現在の参加者数 | - | 現在の予約数 |
| K | ステータス | - | 予約ステータス |
| L | 対象グループ | **グループ名** | グループ一覧シートを参照 |

**特徴**:
- **予約ID**が主キーとして機能
- **コースID**でコース一覧シートと関連
- **イベントID**でGoogle Calendarと関連
- **対象グループ**でグループ一覧シートと関連

---

### 4. 参加情報シート

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 参加者名 | - | 参加者の名前 |
| B | メールアドレス | **メールアドレス** | 参加者のメールアドレス（主キー相当） |
| C | 所属グループ | **グループ名** | グループ一覧シートを参照 |
| D以降 | ①、②、③... | **コース番号** | 各コースの参加状況 |

**特徴**:
- **メールアドレス**が主キーとして機能
- **所属グループ**でグループ一覧シートと関連
- **コース列（①、②、③...）**はコース一覧シートの「番号」に対応

---

### 5. ダッシュボードシート（GID: 644656396）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | グループ | **グループ名** | グループ一覧シートを参照 |
| B | コース名 | - | コース名 |
| C | 対象者人数 | - | SUM関数で自動計算 |
| D | 予約済み人数 | - | 参加情報シートから自動カウント |
| E | 予約率 | - | 自動計算 |
| F | トリガー | - | リマインド用セレクトボックス |
| G | 最終リマインド | - | 最終リマインド日時 |

**特徴**:
- **グループ名**と**コース名**の組み合わせで一意性を保つ
- 参加情報シートから集計データを取得

---

## 🔗 ID間の関連性

### 予約一覧と参加情報の紐付け方法

**重要なポイント**: 予約一覧の**予約ID**と参加情報は**直接紐付けられていません**。代わりに、以下の間接的な紐付けが使用されます：

```
フォーム送信
  ↓
イベントID（eventId）
  ↓
予約一覧シートで検索
  ↓
コースID（courseId）を取得
  ↓
コース一覧シートで検索
  ↓
番号（1, 2, 3...）を取得
  ↓
参加情報シートのメールアドレスで行を特定
  ↓
対応するコース列（①、②、③...）を更新
```

### 詳細な紐付けフロー

#### 1. フォーム送信時の処理

```javascript
// form.gs / Code.gs
onFormSubmit(e) {
  const eventId = e.values[EVENT_ID_COLUMN];
  const email = e.values[EMAIL_COLUMN];
  
  // カレンダーにゲスト追加
  addGuestToCalendarEvent(email, eventId);
  
  // 参加情報を更新
  updateAttendeeStatus(email, eventId);
}
```

#### 2. 参加情報更新の処理

```javascript
// form.gs / Code.gs
updateAttendeeStatus(email, eventId) {
  // Step 1: 予約一覧シートからコースIDを取得
  const eventsSheet = spreadsheet.getSheetByName("予約一覧");
  const eventRows = eventsSheet.getDataRange().getValues();
  
  let courseId = null;
  for (const row of eventRows) {
    if (row[EVENT_ID_COLUMN - 1] === eventId) {
      courseId = row[COURSE_ID_COLUMN - 1];  // B列
      break;
    }
  }
  
  // Step 2: コース一覧シートから番号を取得
  const courseNumber = getCourseNumberFromCourseList(courseId);
  // コース一覧シートで courseId を検索し、「番号」列（A列）を取得
  
  // Step 3: 参加情報シートを更新
  const attendeesSheet = spreadsheet.getSheetByName("参加情報");
  
  // メールアドレスで行を特定
  const emailValues = attendeesSheet.getRange(2, 2, lastRow, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      targetRow = i + 2;  // ヘッダー行を考慮
      break;
    }
  }
  
  // 番号を「①」「②」「③」形式に変換
  const courseHeader = numberToCircle[courseNumber - 1];  // ①、②、③...
  
  // ヘッダー行からコース列のインデックスを取得
  const headerRow = attendeesSheet.getRange(1, 4, 1, 12).getValues()[0];
  const courseIndex = headerRow.indexOf(courseHeader);
  
  // 参加情報を更新
  attendeesSheet.getRange(targetRow, 4 + courseIndex).setValue("済み");
}
```

---

## 📊 関係図

```
┌─────────────────┐
│  グループ一覧    │
│  (グループ名)    │
└────────┬────────┘
         │
         │ 所属グループ
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│   コース一覧     │  │   参加情報    │
│  (コースID)      │  │  (メール)     │
│  (番号: 1,2,3)  │  │  (グループ)   │
└────────┬────────┘  │  (①,②,③...) │
         │           └──────────────┘
         │ コースID
         │
         ▼
┌─────────────────┐
│   予約一覧       │
│  (予約ID)       │
│  (コースID)      │
│  (イベントID)    │
└────────┬────────┘
         │ イベントID
         │
         ▼
┌─────────────────┐
│ Google Calendar  │
│  (イベントID)    │
└─────────────────┘
```

---

## 🔍 よくある質問

### Q1: 予約IDと参加情報はどう紐付いているの？

**A**: 予約IDと参加情報は**直接紐付けられていません**。以下の経路で間接的に紐付けられます：

1. **フォーム送信時**: `イベントID`が渡される
2. **予約一覧シート**: `イベントID`で検索 → `コースID`を取得
3. **コース一覧シート**: `コースID`で検索 → `番号`を取得
4. **参加情報シート**: `メールアドレス`で行を特定 → `番号`に対応する列（①、②、③...）を更新

### Q2: なぜ予約IDを直接使わないの？

**A**: システムの設計上、以下の理由があります：

1. **フォーム送信時にイベントIDが利用可能**: Google Formsから送信されるデータには`イベントID`が含まれているため、これを使用する方が自然
2. **コース単位での管理**: 参加情報シートはコース単位（①、②、③...）で管理されており、特定の予約セッションではなく、コース全体の参加状況を記録する
3. **複数セッション対応**: 同じコースに複数の予約セッション（予約ID）が存在する可能性があるため、コース単位で管理する方が適切

### Q3: 予約IDから参加者を逆引きするには？

**A**: 以下の手順で可能です：

1. **予約一覧シート**: `予約ID`で検索 → `イベントID`を取得
2. **Google Calendar**: `イベントID`で検索 → ゲスト（参加者）のメールアドレス一覧を取得
3. **参加情報シート**: メールアドレスで検索 → 参加者情報を取得

ただし、現在のシステムではこの逆引き機能は実装されていません。

---

## 📝 実装上の注意点

### 1. 予約IDの使用箇所

現在のコードでは、**予約IDは主に予約一覧シート内での識別にのみ使用**されています。他のシートとの紐付けには使用されていません。

### 2. イベントIDの重要性

**イベントID**が以下の役割を担っています：

- フォーム送信時の識別子
- Google Calendarとの連携
- 予約一覧シートとコース一覧シートの橋渡し

### 3. コースIDの役割

**コースID**が以下の役割を担っています：

- コース一覧シートの主キー
- 予約一覧シートとコース一覧シートの関連キー
- コース番号（①、②、③...）への変換の起点

### 4. メールアドレスの役割

**メールアドレス**が以下の役割を担っています：

- 参加情報シートの主キー（実質的）
- Google Calendarのゲスト識別
- フォーム送信者の識別

---

## 🛠️ コード内での参照例

### 予約一覧からコースIDを取得

```javascript
// reservation.gs
function findEventInfoByEventId(eventId, utilsInstance) {
  const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
  const eventRows = eventsSheet.getRange(
    sheets.events.rows.FIRST,
    1,
    lastRow - sheets.events.rows.FIRST + 1,
    sheets.events.columns.STATUS
  ).getValues();
  
  for (const row of eventRows) {
    const rowEventId = row[sheets.events.columns.EVENT_ID - 1];
    if (rowEventId === eventId) {
      return {
        courseId: row[sheets.events.columns.COURSE_ID - 1],
        courseName: row[sheets.events.columns.COURSE_NAME - 1],
        eventUrl: rowEventId
      };
    }
  }
  return null;
}
```

### コースIDから番号を取得

```javascript
// Code.gs
function getCourseNumberFromCourseList(courseId) {
  const SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
  const COURSE_LIST_SHEET_GID = 1504366156;
  
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const courseListSheet = spreadsheet.getSheetById(COURSE_LIST_SHEET_GID);
  
  const headerRow = courseListSheet.getRange(1, 1, 1, courseListSheet.getLastColumn()).getValues()[0];
  const courseIdIndex = headerRow.indexOf('コースID');
  const numberIndex = headerRow.indexOf('番号');
  
  const dataRows = courseListSheet.getRange(2, 1, lastRow - 1, courseListSheet.getLastColumn()).getValues();
  for (const row of dataRows) {
    if (row[courseIdIndex] === courseId) {
      return row[numberIndex];  // 1, 2, 3...
    }
  }
  return null;
}
```

### 参加情報シートを更新

```javascript
// Code.gs
function updateAttendeeStatus(email, eventId) {
  // ... コースIDと番号を取得 ...
  
  const attendeesSheet = spreadsheet.getSheetByName("参加情報");
  
  // メールアドレスで行を特定
  const emailValues = attendeesSheet.getRange(
    sheets.attendees.rows.FIRST,
    sheets.attendees.columns.EMAIL,
    totalRows,
    1
  ).getValues();
  
  let targetRowOffset = -1;
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      targetRowOffset = i;
      break;
    }
  }
  
  // 番号を「①」「②」形式に変換
  const numberToCircle = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];
  const courseHeader = numberToCircle[courseNumber - 1];
  
  // ヘッダー行からコース列のインデックスを取得
  const headerRow = attendeesSheet.getRange(
    1,
    sheets.attendees.columns.COURSE_START_COL,
    1,
    COURSE_HEADERS.length
  ).getValues()[0];
  
  const courseIndex = headerRow.indexOf(courseHeader);
  
  // 参加情報を更新
  const targetRow = sheets.attendees.rows.FIRST + targetRowOffset;
  const targetColumn = sheets.attendees.columns.COURSE_START_COL + courseIndex;
  attendeesSheet.getRange(targetRow, targetColumn).setValue("済み");
}
```

---

## 📌 まとめ

### 主要なIDとその役割

| ID | 所属シート | 役割 | 関連先 |
|----|-----------|------|--------|
| **予約ID** | 予約一覧 | 予約セッションの識別 | 予約一覧シート内のみ |
| **コースID** | コース一覧 | コースの識別 | 予約一覧シート、コース一覧シート |
| **イベントID** | 予約一覧 | Google Calendarとの連携 | 予約一覧シート、Google Calendar |
| **番号** | コース一覧 | コース番号（①、②、③...） | 参加情報シートの列名 |
| **メールアドレス** | 参加情報 | 参加者の識別 | 参加情報シート、Google Calendar |

### 紐付けの経路

```
フォーム送信
  ↓ (イベントID)
予約一覧シート
  ↓ (コースID)
コース一覧シート
  ↓ (番号)
参加情報シート
  ↓ (メールアドレス)
参加者情報
```

**重要なポイント**: 予約IDと参加情報は直接紐付けられておらず、**イベントID → コースID → 番号 → 参加情報シートのコース列**という間接的な経路で関連付けられています。

---

**最終更新**: 2026-01-05



**作成日**: 2026-01-05  
**スプレッドシートID**: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`

---

## 📋 概要

このドキュメントは、研修管理スプレッドシート内の各シートに存在するIDと、それらの関連性を整理したものです。特に、**予約一覧の予約IDと参加情報の紐付け方法**について詳しく説明します。

---

## 🔑 各シートのID一覧

### 1. グループ一覧シート

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | グループ名 | **グループ名** | 1期生、2期生、3期生など |

**特徴**:
- グループ名が主キーとして機能
- 他のシートから参照される

---

### 2. コース一覧シート（GID: 1504366156）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 番号 | **番号** | ①、②、③...に対応する数値（1, 2, 3...） |
| B | 開催年度 | - | FY26など |
| C | 所属グループ | **グループ名** | グループ一覧シートを参照 |
| D | コースID | **コースID** | FY26-XX-XX形式の一意識別子 |
| E | コース名 | - | コースの名称 |

**特徴**:
- **コースID**が主キーとして機能
- **番号**は参加情報シートの列名（①、②、③...）に対応
- **所属グループ**でグループ一覧シートと関連

---

### 3. 予約一覧シート（GID: 0）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 予約ID | **予約ID** | 自動採番される一意識別子 |
| B | コースID | **コースID** | コース一覧シートを参照 |
| C | 予約名 | - | コース名 |
| D | コース案内 | - | コース説明 |
| E | 日程 | - | 開催日 |
| F | 開始日時 | - | 開始時刻 |
| G | 完了日時 | - | 終了時刻 |
| H | イベントID | **イベントID** | Google CalendarイベントID |
| I | 最大参加者数 | - | 定員 |
| J | 現在の参加者数 | - | 現在の予約数 |
| K | ステータス | - | 予約ステータス |
| L | 対象グループ | **グループ名** | グループ一覧シートを参照 |

**特徴**:
- **予約ID**が主キーとして機能
- **コースID**でコース一覧シートと関連
- **イベントID**でGoogle Calendarと関連
- **対象グループ**でグループ一覧シートと関連

---

### 4. 参加情報シート

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 参加者名 | - | 参加者の名前 |
| B | メールアドレス | **メールアドレス** | 参加者のメールアドレス（主キー相当） |
| C | 所属グループ | **グループ名** | グループ一覧シートを参照 |
| D以降 | ①、②、③... | **コース番号** | 各コースの参加状況 |

**特徴**:
- **メールアドレス**が主キーとして機能
- **所属グループ**でグループ一覧シートと関連
- **コース列（①、②、③...）**はコース一覧シートの「番号」に対応

---

### 5. ダッシュボードシート（GID: 644656396）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | グループ | **グループ名** | グループ一覧シートを参照 |
| B | コース名 | - | コース名 |
| C | 対象者人数 | - | SUM関数で自動計算 |
| D | 予約済み人数 | - | 参加情報シートから自動カウント |
| E | 予約率 | - | 自動計算 |
| F | トリガー | - | リマインド用セレクトボックス |
| G | 最終リマインド | - | 最終リマインド日時 |

**特徴**:
- **グループ名**と**コース名**の組み合わせで一意性を保つ
- 参加情報シートから集計データを取得

---

## 🔗 ID間の関連性

### 予約一覧と参加情報の紐付け方法

**重要なポイント**: 予約一覧の**予約ID**と参加情報は**直接紐付けられていません**。代わりに、以下の間接的な紐付けが使用されます：

```
フォーム送信
  ↓
イベントID（eventId）
  ↓
予約一覧シートで検索
  ↓
コースID（courseId）を取得
  ↓
コース一覧シートで検索
  ↓
番号（1, 2, 3...）を取得
  ↓
参加情報シートのメールアドレスで行を特定
  ↓
対応するコース列（①、②、③...）を更新
```

### 詳細な紐付けフロー

#### 1. フォーム送信時の処理

```javascript
// form.gs / Code.gs
onFormSubmit(e) {
  const eventId = e.values[EVENT_ID_COLUMN];
  const email = e.values[EMAIL_COLUMN];
  
  // カレンダーにゲスト追加
  addGuestToCalendarEvent(email, eventId);
  
  // 参加情報を更新
  updateAttendeeStatus(email, eventId);
}
```

#### 2. 参加情報更新の処理

```javascript
// form.gs / Code.gs
updateAttendeeStatus(email, eventId) {
  // Step 1: 予約一覧シートからコースIDを取得
  const eventsSheet = spreadsheet.getSheetByName("予約一覧");
  const eventRows = eventsSheet.getDataRange().getValues();
  
  let courseId = null;
  for (const row of eventRows) {
    if (row[EVENT_ID_COLUMN - 1] === eventId) {
      courseId = row[COURSE_ID_COLUMN - 1];  // B列
      break;
    }
  }
  
  // Step 2: コース一覧シートから番号を取得
  const courseNumber = getCourseNumberFromCourseList(courseId);
  // コース一覧シートで courseId を検索し、「番号」列（A列）を取得
  
  // Step 3: 参加情報シートを更新
  const attendeesSheet = spreadsheet.getSheetByName("参加情報");
  
  // メールアドレスで行を特定
  const emailValues = attendeesSheet.getRange(2, 2, lastRow, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      targetRow = i + 2;  // ヘッダー行を考慮
      break;
    }
  }
  
  // 番号を「①」「②」「③」形式に変換
  const courseHeader = numberToCircle[courseNumber - 1];  // ①、②、③...
  
  // ヘッダー行からコース列のインデックスを取得
  const headerRow = attendeesSheet.getRange(1, 4, 1, 12).getValues()[0];
  const courseIndex = headerRow.indexOf(courseHeader);
  
  // 参加情報を更新
  attendeesSheet.getRange(targetRow, 4 + courseIndex).setValue("済み");
}
```

---

## 📊 関係図

```
┌─────────────────┐
│  グループ一覧    │
│  (グループ名)    │
└────────┬────────┘
         │
         │ 所属グループ
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│   コース一覧     │  │   参加情報    │
│  (コースID)      │  │  (メール)     │
│  (番号: 1,2,3)  │  │  (グループ)   │
└────────┬────────┘  │  (①,②,③...) │
         │           └──────────────┘
         │ コースID
         │
         ▼
┌─────────────────┐
│   予約一覧       │
│  (予約ID)       │
│  (コースID)      │
│  (イベントID)    │
└────────┬────────┘
         │ イベントID
         │
         ▼
┌─────────────────┐
│ Google Calendar  │
│  (イベントID)    │
└─────────────────┘
```

---

## 🔍 よくある質問

### Q1: 予約IDと参加情報はどう紐付いているの？

**A**: 予約IDと参加情報は**直接紐付けられていません**。以下の経路で間接的に紐付けられます：

1. **フォーム送信時**: `イベントID`が渡される
2. **予約一覧シート**: `イベントID`で検索 → `コースID`を取得
3. **コース一覧シート**: `コースID`で検索 → `番号`を取得
4. **参加情報シート**: `メールアドレス`で行を特定 → `番号`に対応する列（①、②、③...）を更新

### Q2: なぜ予約IDを直接使わないの？

**A**: システムの設計上、以下の理由があります：

1. **フォーム送信時にイベントIDが利用可能**: Google Formsから送信されるデータには`イベントID`が含まれているため、これを使用する方が自然
2. **コース単位での管理**: 参加情報シートはコース単位（①、②、③...）で管理されており、特定の予約セッションではなく、コース全体の参加状況を記録する
3. **複数セッション対応**: 同じコースに複数の予約セッション（予約ID）が存在する可能性があるため、コース単位で管理する方が適切

### Q3: 予約IDから参加者を逆引きするには？

**A**: 以下の手順で可能です：

1. **予約一覧シート**: `予約ID`で検索 → `イベントID`を取得
2. **Google Calendar**: `イベントID`で検索 → ゲスト（参加者）のメールアドレス一覧を取得
3. **参加情報シート**: メールアドレスで検索 → 参加者情報を取得

ただし、現在のシステムではこの逆引き機能は実装されていません。

---

## 📝 実装上の注意点

### 1. 予約IDの使用箇所

現在のコードでは、**予約IDは主に予約一覧シート内での識別にのみ使用**されています。他のシートとの紐付けには使用されていません。

### 2. イベントIDの重要性

**イベントID**が以下の役割を担っています：

- フォーム送信時の識別子
- Google Calendarとの連携
- 予約一覧シートとコース一覧シートの橋渡し

### 3. コースIDの役割

**コースID**が以下の役割を担っています：

- コース一覧シートの主キー
- 予約一覧シートとコース一覧シートの関連キー
- コース番号（①、②、③...）への変換の起点

### 4. メールアドレスの役割

**メールアドレス**が以下の役割を担っています：

- 参加情報シートの主キー（実質的）
- Google Calendarのゲスト識別
- フォーム送信者の識別

---

## 🛠️ コード内での参照例

### 予約一覧からコースIDを取得

```javascript
// reservation.gs
function findEventInfoByEventId(eventId, utilsInstance) {
  const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
  const eventRows = eventsSheet.getRange(
    sheets.events.rows.FIRST,
    1,
    lastRow - sheets.events.rows.FIRST + 1,
    sheets.events.columns.STATUS
  ).getValues();
  
  for (const row of eventRows) {
    const rowEventId = row[sheets.events.columns.EVENT_ID - 1];
    if (rowEventId === eventId) {
      return {
        courseId: row[sheets.events.columns.COURSE_ID - 1],
        courseName: row[sheets.events.columns.COURSE_NAME - 1],
        eventUrl: rowEventId
      };
    }
  }
  return null;
}
```

### コースIDから番号を取得

```javascript
// Code.gs
function getCourseNumberFromCourseList(courseId) {
  const SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
  const COURSE_LIST_SHEET_GID = 1504366156;
  
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const courseListSheet = spreadsheet.getSheetById(COURSE_LIST_SHEET_GID);
  
  const headerRow = courseListSheet.getRange(1, 1, 1, courseListSheet.getLastColumn()).getValues()[0];
  const courseIdIndex = headerRow.indexOf('コースID');
  const numberIndex = headerRow.indexOf('番号');
  
  const dataRows = courseListSheet.getRange(2, 1, lastRow - 1, courseListSheet.getLastColumn()).getValues();
  for (const row of dataRows) {
    if (row[courseIdIndex] === courseId) {
      return row[numberIndex];  // 1, 2, 3...
    }
  }
  return null;
}
```

### 参加情報シートを更新

```javascript
// Code.gs
function updateAttendeeStatus(email, eventId) {
  // ... コースIDと番号を取得 ...
  
  const attendeesSheet = spreadsheet.getSheetByName("参加情報");
  
  // メールアドレスで行を特定
  const emailValues = attendeesSheet.getRange(
    sheets.attendees.rows.FIRST,
    sheets.attendees.columns.EMAIL,
    totalRows,
    1
  ).getValues();
  
  let targetRowOffset = -1;
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      targetRowOffset = i;
      break;
    }
  }
  
  // 番号を「①」「②」形式に変換
  const numberToCircle = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];
  const courseHeader = numberToCircle[courseNumber - 1];
  
  // ヘッダー行からコース列のインデックスを取得
  const headerRow = attendeesSheet.getRange(
    1,
    sheets.attendees.columns.COURSE_START_COL,
    1,
    COURSE_HEADERS.length
  ).getValues()[0];
  
  const courseIndex = headerRow.indexOf(courseHeader);
  
  // 参加情報を更新
  const targetRow = sheets.attendees.rows.FIRST + targetRowOffset;
  const targetColumn = sheets.attendees.columns.COURSE_START_COL + courseIndex;
  attendeesSheet.getRange(targetRow, targetColumn).setValue("済み");
}
```

---

## 📌 まとめ

### 主要なIDとその役割

| ID | 所属シート | 役割 | 関連先 |
|----|-----------|------|--------|
| **予約ID** | 予約一覧 | 予約セッションの識別 | 予約一覧シート内のみ |
| **コースID** | コース一覧 | コースの識別 | 予約一覧シート、コース一覧シート |
| **イベントID** | 予約一覧 | Google Calendarとの連携 | 予約一覧シート、Google Calendar |
| **番号** | コース一覧 | コース番号（①、②、③...） | 参加情報シートの列名 |
| **メールアドレス** | 参加情報 | 参加者の識別 | 参加情報シート、Google Calendar |

### 紐付けの経路

```
フォーム送信
  ↓ (イベントID)
予約一覧シート
  ↓ (コースID)
コース一覧シート
  ↓ (番号)
参加情報シート
  ↓ (メールアドレス)
参加者情報
```

**重要なポイント**: 予約IDと参加情報は直接紐付けられておらず、**イベントID → コースID → 番号 → 参加情報シートのコース列**という間接的な経路で関連付けられています。

---

**最終更新**: 2026-01-05


**作成日**: 2026-01-05  
**スプレッドシートID**: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`

---

## 📋 概要

このドキュメントは、研修管理スプレッドシート内の各シートに存在するIDと、それらの関連性を整理したものです。特に、**予約一覧の予約IDと参加情報の紐付け方法**について詳しく説明します。

---

## 🔑 各シートのID一覧

### 1. グループ一覧シート

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | グループ名 | **グループ名** | 1期生、2期生、3期生など |

**特徴**:
- グループ名が主キーとして機能
- 他のシートから参照される

---

### 2. コース一覧シート（GID: 1504366156）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 番号 | **番号** | ①、②、③...に対応する数値（1, 2, 3...） |
| B | 開催年度 | - | FY26など |
| C | 所属グループ | **グループ名** | グループ一覧シートを参照 |
| D | コースID | **コースID** | FY26-XX-XX形式の一意識別子 |
| E | コース名 | - | コースの名称 |

**特徴**:
- **コースID**が主キーとして機能
- **番号**は参加情報シートの列名（①、②、③...）に対応
- **所属グループ**でグループ一覧シートと関連

---

### 3. 予約一覧シート（GID: 0）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 予約ID | **予約ID** | 自動採番される一意識別子 |
| B | コースID | **コースID** | コース一覧シートを参照 |
| C | 予約名 | - | コース名 |
| D | コース案内 | - | コース説明 |
| E | 日程 | - | 開催日 |
| F | 開始日時 | - | 開始時刻 |
| G | 完了日時 | - | 終了時刻 |
| H | イベントID | **イベントID** | Google CalendarイベントID |
| I | 最大参加者数 | - | 定員 |
| J | 現在の参加者数 | - | 現在の予約数 |
| K | ステータス | - | 予約ステータス |
| L | 対象グループ | **グループ名** | グループ一覧シートを参照 |

**特徴**:
- **予約ID**が主キーとして機能
- **コースID**でコース一覧シートと関連
- **イベントID**でGoogle Calendarと関連
- **対象グループ**でグループ一覧シートと関連

---

### 4. 参加情報シート

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 参加者名 | - | 参加者の名前 |
| B | メールアドレス | **メールアドレス** | 参加者のメールアドレス（主キー相当） |
| C | 所属グループ | **グループ名** | グループ一覧シートを参照 |
| D以降 | ①、②、③... | **コース番号** | 各コースの参加状況 |

**特徴**:
- **メールアドレス**が主キーとして機能
- **所属グループ**でグループ一覧シートと関連
- **コース列（①、②、③...）**はコース一覧シートの「番号」に対応

---

### 5. ダッシュボードシート（GID: 644656396）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | グループ | **グループ名** | グループ一覧シートを参照 |
| B | コース名 | - | コース名 |
| C | 対象者人数 | - | SUM関数で自動計算 |
| D | 予約済み人数 | - | 参加情報シートから自動カウント |
| E | 予約率 | - | 自動計算 |
| F | トリガー | - | リマインド用セレクトボックス |
| G | 最終リマインド | - | 最終リマインド日時 |

**特徴**:
- **グループ名**と**コース名**の組み合わせで一意性を保つ
- 参加情報シートから集計データを取得

---

## 🔗 ID間の関連性

### 予約一覧と参加情報の紐付け方法

**重要なポイント**: 予約一覧の**予約ID**と参加情報は**直接紐付けられていません**。代わりに、以下の間接的な紐付けが使用されます：

```
フォーム送信
  ↓
イベントID（eventId）
  ↓
予約一覧シートで検索
  ↓
コースID（courseId）を取得
  ↓
コース一覧シートで検索
  ↓
番号（1, 2, 3...）を取得
  ↓
参加情報シートのメールアドレスで行を特定
  ↓
対応するコース列（①、②、③...）を更新
```

### 詳細な紐付けフロー

#### 1. フォーム送信時の処理

```javascript
// form.gs / Code.gs
onFormSubmit(e) {
  const eventId = e.values[EVENT_ID_COLUMN];
  const email = e.values[EMAIL_COLUMN];
  
  // カレンダーにゲスト追加
  addGuestToCalendarEvent(email, eventId);
  
  // 参加情報を更新
  updateAttendeeStatus(email, eventId);
}
```

#### 2. 参加情報更新の処理

```javascript
// form.gs / Code.gs
updateAttendeeStatus(email, eventId) {
  // Step 1: 予約一覧シートからコースIDを取得
  const eventsSheet = spreadsheet.getSheetByName("予約一覧");
  const eventRows = eventsSheet.getDataRange().getValues();
  
  let courseId = null;
  for (const row of eventRows) {
    if (row[EVENT_ID_COLUMN - 1] === eventId) {
      courseId = row[COURSE_ID_COLUMN - 1];  // B列
      break;
    }
  }
  
  // Step 2: コース一覧シートから番号を取得
  const courseNumber = getCourseNumberFromCourseList(courseId);
  // コース一覧シートで courseId を検索し、「番号」列（A列）を取得
  
  // Step 3: 参加情報シートを更新
  const attendeesSheet = spreadsheet.getSheetByName("参加情報");
  
  // メールアドレスで行を特定
  const emailValues = attendeesSheet.getRange(2, 2, lastRow, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      targetRow = i + 2;  // ヘッダー行を考慮
      break;
    }
  }
  
  // 番号を「①」「②」「③」形式に変換
  const courseHeader = numberToCircle[courseNumber - 1];  // ①、②、③...
  
  // ヘッダー行からコース列のインデックスを取得
  const headerRow = attendeesSheet.getRange(1, 4, 1, 12).getValues()[0];
  const courseIndex = headerRow.indexOf(courseHeader);
  
  // 参加情報を更新
  attendeesSheet.getRange(targetRow, 4 + courseIndex).setValue("済み");
}
```

---

## 📊 関係図

```
┌─────────────────┐
│  グループ一覧    │
│  (グループ名)    │
└────────┬────────┘
         │
         │ 所属グループ
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│   コース一覧     │  │   参加情報    │
│  (コースID)      │  │  (メール)     │
│  (番号: 1,2,3)  │  │  (グループ)   │
└────────┬────────┘  │  (①,②,③...) │
         │           └──────────────┘
         │ コースID
         │
         ▼
┌─────────────────┐
│   予約一覧       │
│  (予約ID)       │
│  (コースID)      │
│  (イベントID)    │
└────────┬────────┘
         │ イベントID
         │
         ▼
┌─────────────────┐
│ Google Calendar  │
│  (イベントID)    │
└─────────────────┘
```

---

## 🔍 よくある質問

### Q1: 予約IDと参加情報はどう紐付いているの？

**A**: 予約IDと参加情報は**直接紐付けられていません**。以下の経路で間接的に紐付けられます：

1. **フォーム送信時**: `イベントID`が渡される
2. **予約一覧シート**: `イベントID`で検索 → `コースID`を取得
3. **コース一覧シート**: `コースID`で検索 → `番号`を取得
4. **参加情報シート**: `メールアドレス`で行を特定 → `番号`に対応する列（①、②、③...）を更新

### Q2: なぜ予約IDを直接使わないの？

**A**: システムの設計上、以下の理由があります：

1. **フォーム送信時にイベントIDが利用可能**: Google Formsから送信されるデータには`イベントID`が含まれているため、これを使用する方が自然
2. **コース単位での管理**: 参加情報シートはコース単位（①、②、③...）で管理されており、特定の予約セッションではなく、コース全体の参加状況を記録する
3. **複数セッション対応**: 同じコースに複数の予約セッション（予約ID）が存在する可能性があるため、コース単位で管理する方が適切

### Q3: 予約IDから参加者を逆引きするには？

**A**: 以下の手順で可能です：

1. **予約一覧シート**: `予約ID`で検索 → `イベントID`を取得
2. **Google Calendar**: `イベントID`で検索 → ゲスト（参加者）のメールアドレス一覧を取得
3. **参加情報シート**: メールアドレスで検索 → 参加者情報を取得

ただし、現在のシステムではこの逆引き機能は実装されていません。

---

## 📝 実装上の注意点

### 1. 予約IDの使用箇所

現在のコードでは、**予約IDは主に予約一覧シート内での識別にのみ使用**されています。他のシートとの紐付けには使用されていません。

### 2. イベントIDの重要性

**イベントID**が以下の役割を担っています：

- フォーム送信時の識別子
- Google Calendarとの連携
- 予約一覧シートとコース一覧シートの橋渡し

### 3. コースIDの役割

**コースID**が以下の役割を担っています：

- コース一覧シートの主キー
- 予約一覧シートとコース一覧シートの関連キー
- コース番号（①、②、③...）への変換の起点

### 4. メールアドレスの役割

**メールアドレス**が以下の役割を担っています：

- 参加情報シートの主キー（実質的）
- Google Calendarのゲスト識別
- フォーム送信者の識別

---

## 🛠️ コード内での参照例

### 予約一覧からコースIDを取得

```javascript
// reservation.gs
function findEventInfoByEventId(eventId, utilsInstance) {
  const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
  const eventRows = eventsSheet.getRange(
    sheets.events.rows.FIRST,
    1,
    lastRow - sheets.events.rows.FIRST + 1,
    sheets.events.columns.STATUS
  ).getValues();
  
  for (const row of eventRows) {
    const rowEventId = row[sheets.events.columns.EVENT_ID - 1];
    if (rowEventId === eventId) {
      return {
        courseId: row[sheets.events.columns.COURSE_ID - 1],
        courseName: row[sheets.events.columns.COURSE_NAME - 1],
        eventUrl: rowEventId
      };
    }
  }
  return null;
}
```

### コースIDから番号を取得

```javascript
// Code.gs
function getCourseNumberFromCourseList(courseId) {
  const SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
  const COURSE_LIST_SHEET_GID = 1504366156;
  
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const courseListSheet = spreadsheet.getSheetById(COURSE_LIST_SHEET_GID);
  
  const headerRow = courseListSheet.getRange(1, 1, 1, courseListSheet.getLastColumn()).getValues()[0];
  const courseIdIndex = headerRow.indexOf('コースID');
  const numberIndex = headerRow.indexOf('番号');
  
  const dataRows = courseListSheet.getRange(2, 1, lastRow - 1, courseListSheet.getLastColumn()).getValues();
  for (const row of dataRows) {
    if (row[courseIdIndex] === courseId) {
      return row[numberIndex];  // 1, 2, 3...
    }
  }
  return null;
}
```

### 参加情報シートを更新

```javascript
// Code.gs
function updateAttendeeStatus(email, eventId) {
  // ... コースIDと番号を取得 ...
  
  const attendeesSheet = spreadsheet.getSheetByName("参加情報");
  
  // メールアドレスで行を特定
  const emailValues = attendeesSheet.getRange(
    sheets.attendees.rows.FIRST,
    sheets.attendees.columns.EMAIL,
    totalRows,
    1
  ).getValues();
  
  let targetRowOffset = -1;
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      targetRowOffset = i;
      break;
    }
  }
  
  // 番号を「①」「②」形式に変換
  const numberToCircle = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];
  const courseHeader = numberToCircle[courseNumber - 1];
  
  // ヘッダー行からコース列のインデックスを取得
  const headerRow = attendeesSheet.getRange(
    1,
    sheets.attendees.columns.COURSE_START_COL,
    1,
    COURSE_HEADERS.length
  ).getValues()[0];
  
  const courseIndex = headerRow.indexOf(courseHeader);
  
  // 参加情報を更新
  const targetRow = sheets.attendees.rows.FIRST + targetRowOffset;
  const targetColumn = sheets.attendees.columns.COURSE_START_COL + courseIndex;
  attendeesSheet.getRange(targetRow, targetColumn).setValue("済み");
}
```

---

## 📌 まとめ

### 主要なIDとその役割

| ID | 所属シート | 役割 | 関連先 |
|----|-----------|------|--------|
| **予約ID** | 予約一覧 | 予約セッションの識別 | 予約一覧シート内のみ |
| **コースID** | コース一覧 | コースの識別 | 予約一覧シート、コース一覧シート |
| **イベントID** | 予約一覧 | Google Calendarとの連携 | 予約一覧シート、Google Calendar |
| **番号** | コース一覧 | コース番号（①、②、③...） | 参加情報シートの列名 |
| **メールアドレス** | 参加情報 | 参加者の識別 | 参加情報シート、Google Calendar |

### 紐付けの経路

```
フォーム送信
  ↓ (イベントID)
予約一覧シート
  ↓ (コースID)
コース一覧シート
  ↓ (番号)
参加情報シート
  ↓ (メールアドレス)
参加者情報
```

**重要なポイント**: 予約IDと参加情報は直接紐付けられておらず、**イベントID → コースID → 番号 → 参加情報シートのコース列**という間接的な経路で関連付けられています。

---

**最終更新**: 2026-01-05



**作成日**: 2026-01-05  
**スプレッドシートID**: `1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE`

---

## 📋 概要

このドキュメントは、研修管理スプレッドシート内の各シートに存在するIDと、それらの関連性を整理したものです。特に、**予約一覧の予約IDと参加情報の紐付け方法**について詳しく説明します。

---

## 🔑 各シートのID一覧

### 1. グループ一覧シート

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | グループ名 | **グループ名** | 1期生、2期生、3期生など |

**特徴**:
- グループ名が主キーとして機能
- 他のシートから参照される

---

### 2. コース一覧シート（GID: 1504366156）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 番号 | **番号** | ①、②、③...に対応する数値（1, 2, 3...） |
| B | 開催年度 | - | FY26など |
| C | 所属グループ | **グループ名** | グループ一覧シートを参照 |
| D | コースID | **コースID** | FY26-XX-XX形式の一意識別子 |
| E | コース名 | - | コースの名称 |

**特徴**:
- **コースID**が主キーとして機能
- **番号**は参加情報シートの列名（①、②、③...）に対応
- **所属グループ**でグループ一覧シートと関連

---

### 3. 予約一覧シート（GID: 0）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 予約ID | **予約ID** | 自動採番される一意識別子 |
| B | コースID | **コースID** | コース一覧シートを参照 |
| C | 予約名 | - | コース名 |
| D | コース案内 | - | コース説明 |
| E | 日程 | - | 開催日 |
| F | 開始日時 | - | 開始時刻 |
| G | 完了日時 | - | 終了時刻 |
| H | イベントID | **イベントID** | Google CalendarイベントID |
| I | 最大参加者数 | - | 定員 |
| J | 現在の参加者数 | - | 現在の予約数 |
| K | ステータス | - | 予約ステータス |
| L | 対象グループ | **グループ名** | グループ一覧シートを参照 |

**特徴**:
- **予約ID**が主キーとして機能
- **コースID**でコース一覧シートと関連
- **イベントID**でGoogle Calendarと関連
- **対象グループ**でグループ一覧シートと関連

---

### 4. 参加情報シート

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | 参加者名 | - | 参加者の名前 |
| B | メールアドレス | **メールアドレス** | 参加者のメールアドレス（主キー相当） |
| C | 所属グループ | **グループ名** | グループ一覧シートを参照 |
| D以降 | ①、②、③... | **コース番号** | 各コースの参加状況 |

**特徴**:
- **メールアドレス**が主キーとして機能
- **所属グループ**でグループ一覧シートと関連
- **コース列（①、②、③...）**はコース一覧シートの「番号」に対応

---

### 5. ダッシュボードシート（GID: 644656396）

| 列 | ヘッダー名 | ID/キー | 説明 |
|----|-----------|---------|------|
| A | グループ | **グループ名** | グループ一覧シートを参照 |
| B | コース名 | - | コース名 |
| C | 対象者人数 | - | SUM関数で自動計算 |
| D | 予約済み人数 | - | 参加情報シートから自動カウント |
| E | 予約率 | - | 自動計算 |
| F | トリガー | - | リマインド用セレクトボックス |
| G | 最終リマインド | - | 最終リマインド日時 |

**特徴**:
- **グループ名**と**コース名**の組み合わせで一意性を保つ
- 参加情報シートから集計データを取得

---

## 🔗 ID間の関連性

### 予約一覧と参加情報の紐付け方法

**重要なポイント**: 予約一覧の**予約ID**と参加情報は**直接紐付けられていません**。代わりに、以下の間接的な紐付けが使用されます：

```
フォーム送信
  ↓
イベントID（eventId）
  ↓
予約一覧シートで検索
  ↓
コースID（courseId）を取得
  ↓
コース一覧シートで検索
  ↓
番号（1, 2, 3...）を取得
  ↓
参加情報シートのメールアドレスで行を特定
  ↓
対応するコース列（①、②、③...）を更新
```

### 詳細な紐付けフロー

#### 1. フォーム送信時の処理

```javascript
// form.gs / Code.gs
onFormSubmit(e) {
  const eventId = e.values[EVENT_ID_COLUMN];
  const email = e.values[EMAIL_COLUMN];
  
  // カレンダーにゲスト追加
  addGuestToCalendarEvent(email, eventId);
  
  // 参加情報を更新
  updateAttendeeStatus(email, eventId);
}
```

#### 2. 参加情報更新の処理

```javascript
// form.gs / Code.gs
updateAttendeeStatus(email, eventId) {
  // Step 1: 予約一覧シートからコースIDを取得
  const eventsSheet = spreadsheet.getSheetByName("予約一覧");
  const eventRows = eventsSheet.getDataRange().getValues();
  
  let courseId = null;
  for (const row of eventRows) {
    if (row[EVENT_ID_COLUMN - 1] === eventId) {
      courseId = row[COURSE_ID_COLUMN - 1];  // B列
      break;
    }
  }
  
  // Step 2: コース一覧シートから番号を取得
  const courseNumber = getCourseNumberFromCourseList(courseId);
  // コース一覧シートで courseId を検索し、「番号」列（A列）を取得
  
  // Step 3: 参加情報シートを更新
  const attendeesSheet = spreadsheet.getSheetByName("参加情報");
  
  // メールアドレスで行を特定
  const emailValues = attendeesSheet.getRange(2, 2, lastRow, 1).getValues();
  let targetRow = -1;
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      targetRow = i + 2;  // ヘッダー行を考慮
      break;
    }
  }
  
  // 番号を「①」「②」「③」形式に変換
  const courseHeader = numberToCircle[courseNumber - 1];  // ①、②、③...
  
  // ヘッダー行からコース列のインデックスを取得
  const headerRow = attendeesSheet.getRange(1, 4, 1, 12).getValues()[0];
  const courseIndex = headerRow.indexOf(courseHeader);
  
  // 参加情報を更新
  attendeesSheet.getRange(targetRow, 4 + courseIndex).setValue("済み");
}
```

---

## 📊 関係図

```
┌─────────────────┐
│  グループ一覧    │
│  (グループ名)    │
└────────┬────────┘
         │
         │ 所属グループ
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│   コース一覧     │  │   参加情報    │
│  (コースID)      │  │  (メール)     │
│  (番号: 1,2,3)  │  │  (グループ)   │
└────────┬────────┘  │  (①,②,③...) │
         │           └──────────────┘
         │ コースID
         │
         ▼
┌─────────────────┐
│   予約一覧       │
│  (予約ID)       │
│  (コースID)      │
│  (イベントID)    │
└────────┬────────┘
         │ イベントID
         │
         ▼
┌─────────────────┐
│ Google Calendar  │
│  (イベントID)    │
└─────────────────┘
```

---

## 🔍 よくある質問

### Q1: 予約IDと参加情報はどう紐付いているの？

**A**: 予約IDと参加情報は**直接紐付けられていません**。以下の経路で間接的に紐付けられます：

1. **フォーム送信時**: `イベントID`が渡される
2. **予約一覧シート**: `イベントID`で検索 → `コースID`を取得
3. **コース一覧シート**: `コースID`で検索 → `番号`を取得
4. **参加情報シート**: `メールアドレス`で行を特定 → `番号`に対応する列（①、②、③...）を更新

### Q2: なぜ予約IDを直接使わないの？

**A**: システムの設計上、以下の理由があります：

1. **フォーム送信時にイベントIDが利用可能**: Google Formsから送信されるデータには`イベントID`が含まれているため、これを使用する方が自然
2. **コース単位での管理**: 参加情報シートはコース単位（①、②、③...）で管理されており、特定の予約セッションではなく、コース全体の参加状況を記録する
3. **複数セッション対応**: 同じコースに複数の予約セッション（予約ID）が存在する可能性があるため、コース単位で管理する方が適切

### Q3: 予約IDから参加者を逆引きするには？

**A**: 以下の手順で可能です：

1. **予約一覧シート**: `予約ID`で検索 → `イベントID`を取得
2. **Google Calendar**: `イベントID`で検索 → ゲスト（参加者）のメールアドレス一覧を取得
3. **参加情報シート**: メールアドレスで検索 → 参加者情報を取得

ただし、現在のシステムではこの逆引き機能は実装されていません。

---

## 📝 実装上の注意点

### 1. 予約IDの使用箇所

現在のコードでは、**予約IDは主に予約一覧シート内での識別にのみ使用**されています。他のシートとの紐付けには使用されていません。

### 2. イベントIDの重要性

**イベントID**が以下の役割を担っています：

- フォーム送信時の識別子
- Google Calendarとの連携
- 予約一覧シートとコース一覧シートの橋渡し

### 3. コースIDの役割

**コースID**が以下の役割を担っています：

- コース一覧シートの主キー
- 予約一覧シートとコース一覧シートの関連キー
- コース番号（①、②、③...）への変換の起点

### 4. メールアドレスの役割

**メールアドレス**が以下の役割を担っています：

- 参加情報シートの主キー（実質的）
- Google Calendarのゲスト識別
- フォーム送信者の識別

---

## 🛠️ コード内での参照例

### 予約一覧からコースIDを取得

```javascript
// reservation.gs
function findEventInfoByEventId(eventId, utilsInstance) {
  const eventsSheet = CustomUtils.getSheetByName(sheets.events.name);
  const eventRows = eventsSheet.getRange(
    sheets.events.rows.FIRST,
    1,
    lastRow - sheets.events.rows.FIRST + 1,
    sheets.events.columns.STATUS
  ).getValues();
  
  for (const row of eventRows) {
    const rowEventId = row[sheets.events.columns.EVENT_ID - 1];
    if (rowEventId === eventId) {
      return {
        courseId: row[sheets.events.columns.COURSE_ID - 1],
        courseName: row[sheets.events.columns.COURSE_NAME - 1],
        eventUrl: rowEventId
      };
    }
  }
  return null;
}
```

### コースIDから番号を取得

```javascript
// Code.gs
function getCourseNumberFromCourseList(courseId) {
  const SPREADSHEET_ID = '1ln9GGhT7wbhhsWPIeATGkAnfAkXFvH8CfUeuZqmgqpE';
  const COURSE_LIST_SHEET_GID = 1504366156;
  
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const courseListSheet = spreadsheet.getSheetById(COURSE_LIST_SHEET_GID);
  
  const headerRow = courseListSheet.getRange(1, 1, 1, courseListSheet.getLastColumn()).getValues()[0];
  const courseIdIndex = headerRow.indexOf('コースID');
  const numberIndex = headerRow.indexOf('番号');
  
  const dataRows = courseListSheet.getRange(2, 1, lastRow - 1, courseListSheet.getLastColumn()).getValues();
  for (const row of dataRows) {
    if (row[courseIdIndex] === courseId) {
      return row[numberIndex];  // 1, 2, 3...
    }
  }
  return null;
}
```

### 参加情報シートを更新

```javascript
// Code.gs
function updateAttendeeStatus(email, eventId) {
  // ... コースIDと番号を取得 ...
  
  const attendeesSheet = spreadsheet.getSheetByName("参加情報");
  
  // メールアドレスで行を特定
  const emailValues = attendeesSheet.getRange(
    sheets.attendees.rows.FIRST,
    sheets.attendees.columns.EMAIL,
    totalRows,
    1
  ).getValues();
  
  let targetRowOffset = -1;
  for (let i = 0; i < emailValues.length; i++) {
    if (emailValues[i][0] === email) {
      targetRowOffset = i;
      break;
    }
  }
  
  // 番号を「①」「②」形式に変換
  const numberToCircle = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];
  const courseHeader = numberToCircle[courseNumber - 1];
  
  // ヘッダー行からコース列のインデックスを取得
  const headerRow = attendeesSheet.getRange(
    1,
    sheets.attendees.columns.COURSE_START_COL,
    1,
    COURSE_HEADERS.length
  ).getValues()[0];
  
  const courseIndex = headerRow.indexOf(courseHeader);
  
  // 参加情報を更新
  const targetRow = sheets.attendees.rows.FIRST + targetRowOffset;
  const targetColumn = sheets.attendees.columns.COURSE_START_COL + courseIndex;
  attendeesSheet.getRange(targetRow, targetColumn).setValue("済み");
}
```

---

## 📌 まとめ

### 主要なIDとその役割

| ID | 所属シート | 役割 | 関連先 |
|----|-----------|------|--------|
| **予約ID** | 予約一覧 | 予約セッションの識別 | 予約一覧シート内のみ |
| **コースID** | コース一覧 | コースの識別 | 予約一覧シート、コース一覧シート |
| **イベントID** | 予約一覧 | Google Calendarとの連携 | 予約一覧シート、Google Calendar |
| **番号** | コース一覧 | コース番号（①、②、③...） | 参加情報シートの列名 |
| **メールアドレス** | 参加情報 | 参加者の識別 | 参加情報シート、Google Calendar |

### 紐付けの経路

```
フォーム送信
  ↓ (イベントID)
予約一覧シート
  ↓ (コースID)
コース一覧シート
  ↓ (番号)
参加情報シート
  ↓ (メールアドレス)
参加者情報
```

**重要なポイント**: 予約IDと参加情報は直接紐付けられておらず、**イベントID → コースID → 番号 → 参加情報シートのコース列**という間接的な経路で関連付けられています。

---

**最終更新**: 2026-01-05

