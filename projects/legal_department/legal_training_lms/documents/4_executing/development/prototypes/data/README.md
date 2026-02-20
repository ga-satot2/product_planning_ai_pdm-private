# 予約データ（取り込み済み）

研修管理スプレッドシートの「予約一覧」シートをワークスペースに取り込んだCSVを格納するフォルダです。

## ファイル

- `reservation_list_YYYY-MM-DD.csv` … 取り込み日付ごとのスナップショット（UTF-8 BOM付きCSV）

## 再取り込み方法

ワークスペースルートで以下を実行すると、当日日付のCSVがこのフォルダに上書き保存されます。

```bash
python scripts/tools/export_lms_reservation_data.py
```

任意のパスに保存する場合:

```bash
python scripts/tools/export_lms_reservation_data.py -o /path/to/output.csv
```

取得のみ確認（保存しない）:

```bash
python scripts/tools/export_lms_reservation_data.py --dry-run
```

## 前提

- Google Sheets API の認証が済んでいること（`scripts/calendar_app` または `scripts/google_workspace_data` の認証モジュールを使用）
