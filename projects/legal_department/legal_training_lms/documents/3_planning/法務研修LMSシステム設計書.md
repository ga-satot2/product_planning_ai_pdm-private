# 法務研修LMSシステム設計書

## 1. システム概要

### 1.1 目的
法務研修の参加状態を効率的に管理し、500名規模の受講者を3グループに分けて並行運営するシステム

### 1.2 対象期間
- 告知開始: 2024年10月17日
- 研修開始: 2024年11月1日
- 対象者: 500名（3グループに分割）

### 1.3 主要機能
1. 研修コース管理
2. 受講者管理
3. 予約・スケジュール管理
4. 出席管理（テスト回答ベース）
5. 採点・評価管理
6. 補講管理
7. 通知・リマインド機能

## 2. システム構成

### 2.1 主要コンポーネント
- **管理システム**: 研修管理者用のWebアプリケーション
- **受講者ポータル**: 受講者用のWebアプリケーション
- **Googleカレンダー連携**: 会議室予約とスケジュール管理
- **通知システム**: メール・Slack通知
- **テストシステム**: オンラインテスト機能
- **レポートシステム**: 出席・成績レポート

### 2.2 技術スタック
- **フロントエンド**: React.js + TypeScript
- **バックエンド**: Node.js + Express
- **データベース**: PostgreSQL
- **認証**: Google OAuth 2.0
- **カレンダー連携**: Google Calendar API
- **通知**: SendGrid + Slack API
- **テスト**: 独自テストエンジン

## 3. データモデル

### 3.1 主要エンティティ

#### 研修コース (Course)
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  group_id INTEGER NOT NULL, -- 1, 2, 3
  max_participants INTEGER,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50), -- 'draft', 'active', 'completed'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 受講者 (Participant)
```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  group_id INTEGER, -- 1, 2, 3
  status VARCHAR(50), -- 'active', 'inactive'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 研修セッション (Session)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  session_name VARCHAR(255),
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  meeting_room_id VARCHAR(100),
  google_calendar_event_id VARCHAR(255),
  status VARCHAR(50), -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 予約 (Reservation)
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY,
  participant_id UUID REFERENCES participants(id),
  session_id UUID REFERENCES sessions(id),
  status VARCHAR(50), -- 'pending', 'confirmed', 'cancelled', 'changed'
  original_session_id UUID, -- 変更前のセッションID
  change_reason TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 出席記録 (Attendance)
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  participant_id UUID REFERENCES participants(id),
  session_id UUID REFERENCES sessions(id),
  test_score INTEGER,
  test_completed_at TIMESTAMP,
  attendance_status VARCHAR(50), -- 'present', 'absent', 'late'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 4. 主要機能仕様

### 4.1 研修コース管理
- コースの作成・編集・削除
- 3グループへの自動振り分け
- 受講者リストの一括インポート
- スケジュール設定

### 4.2 予約管理
- 受講者の参加希望日予約
- 予約変更機能（制限付き）
- キャンセル機能
- 待機リスト管理

### 4.3 出席管理
- テスト回答による出席確認
- 自動採点機能
- 手動採点機能
- 出席率レポート

### 4.4 補講管理
- 未受講者・不合格者の特定
- 補講スケジュール調整
- 再テスト機能

### 4.5 通知機能
- 予約確認メール
- リマインド通知
- 結果通知
- 補講案内

## 5. 予約変更機能の詳細設計

### 5.1 変更可能条件
- 研修開始の3日前まで
- 変更回数は1回まで
- 同じグループ内での変更のみ
- 定員に空きがある場合のみ

### 5.2 変更プロセス
1. 受講者が変更申請
2. システムが条件チェック
3. 管理者承認（必要に応じて）
4. 元の予約をキャンセル
5. 新しい予約を作成
6. 関係者に通知

### 5.3 変更時の考慮事項
- 元のセッションの定員管理
- 新しいセッションの定員確認
- 待機リストの更新
- カレンダーイベントの更新

## 6. 3グループ並行運営の管理

### 6.1 グループ分け戦略
- 部門別分割
- 地域別分割
- 役職別分割
- ランダム分割

### 6.2 スケジュール調整
- グループ間の時間差設定
- 会議室の重複回避
- 講師のスケジュール管理
- リソースの最適配分

### 6.3 進捗管理
- グループ別進捗ダッシュボード
- 全体進捗の可視化
- 遅延アラート機能
- 調整提案機能

## 7. 500名規模対応

### 7.1 パフォーマンス対策
- データベースインデックス最適化
- ページネーション実装
- キャッシュ戦略
- 非同期処理

### 7.2 スケーラビリティ
- マイクロサービス化
- ロードバランサー
- CDN活用
- データベースシャーディング

### 7.3 運用面の考慮
- バックアップ戦略
- 監視・ログ機能
- 障害対応手順
- セキュリティ対策

## 8. セキュリティ要件

### 8.1 認証・認可
- Google OAuth 2.0認証
- ロールベースアクセス制御
- セッション管理
- 多要素認証（管理者）

### 8.2 データ保護
- 個人情報の暗号化
- 通信の暗号化（HTTPS）
- アクセスログ記録
- データ保持ポリシー

## 9. 運用要件

### 9.1 監視・ログ
- システム監視
- エラーログ記録
- アクセスログ記録
- パフォーマンス監視

### 9.2 バックアップ・復旧
- 日次バックアップ
- 災害復旧計画
- データ復旧手順
- テスト環境での検証

## 10. 今後の拡張性

### 10.1 機能拡張
- 他研修への対応
- 動画配信機能
- モバイルアプリ
- AI活用機能

### 10.2 統合可能性
- 既存HRシステムとの連携
- 外部LMSとの連携
- 社内システムとの統合
- API提供

---

**作成日**: 2024年10月17日  
**バージョン**: 1.0  
**作成者**: プロダクト企画チーム
