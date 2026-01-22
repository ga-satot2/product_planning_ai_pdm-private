# 法務研修LMSシステム ポンチ絵（全体フロー図）

## 1. システム全体構成図

```mermaid
graph TB
    subgraph "受講者（500名）"
        A1[グループ1<br/>167名]
        A2[グループ2<br/>167名]
        A3[グループ3<br/>166名]
    end
    
    subgraph "Googleワークスペース"
        B1[Google Identity<br/>認証]
        B2[Google Calendar<br/>スケジュール管理]
        B3[Google Sheets<br/>データ管理]
        B4[Gmail<br/>通知]
        B5[Google Meet<br/>研修実施]
        B6[Google Forms<br/>テスト]
    end
    
    subgraph "LMS管理システム"
        C1[予約システム]
        C2[出席管理]
        C3[採点システム]
        C4[補講管理]
        C5[レポート生成]
    end
    
    subgraph "管理者"
        D1[研修管理者]
        D2[システム管理者]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> C1
    C1 --> B2
    C1 --> B3
    C1 --> B4
    
    C2 --> B5
    C2 --> B6
    C3 --> B4
    C4 --> B2
    C5 --> D1
    
    D1 --> C1
    D1 --> C4
    D2 --> C5
```

## 2. 研修フロー全体図

```mermaid
flowchart TD
    Start([研修開始]) --> Setup[初期設定]
    
    Setup --> |1. 会議室予約| Calendar[Google Calendar]
    Setup --> |2. 受講者登録| Sheets[Google Sheets]
    Setup --> |3. コース設定| System[LMS管理システム]
    
    System --> Notify1[告知メール送信]
    Notify1 --> Reserve[受講者予約]
    
    Reserve --> |予約完了| Confirm[予約確認メール]
    Reserve --> |予約変更| Change[予約変更処理]
    Reserve --> |キャンセル| Cancel[キャンセル処理]
    
    Confirm --> Remind[リマインド送信]
    Change --> Confirm
    Cancel --> Notify1
    
    Remind --> Training[研修実施]
    Training --> |Google Meet| Attend[出席管理]
    
    Attend --> Test[テスト実施]
    Test --> |Google Forms| Score[採点処理]
    
    Score --> |合格| Pass[合格通知]
    Score --> |不合格| Fail[不合格通知]
    
    Pass --> Complete([研修完了])
    Fail --> Retake[補講設定]
    
    Retake --> |会議室予約| Calendar
    Retake --> |通知送信| Notify2[補講案内]
    Notify2 --> Training
    
    Complete --> Report[レポート生成]
    Report --> End([終了])
```

## 3. 予約変更フロー詳細図

```mermaid
flowchart TD
    User[受講者] --> |予約変更申請| Check{変更条件チェック}
    
    Check --> |3日前まで| Check2{変更回数チェック}
    Check --> |3日前以降| Reject1[変更拒否<br/>「締切オーバー」]
    
    Check2 --> |1回未満| Check3{定員チェック}
    Check2 --> |1回以上| Reject2[変更拒否<br/>「変更回数上限」]
    
    Check3 --> |空きあり| Process[変更処理実行]
    Check3 --> |満員| Wait[待機リスト登録]
    
    Process --> |元予約キャンセル| Cancel[元予約削除]
    Process --> |新予約作成| Create[新予約作成]
    Process --> |カレンダー更新| Update[カレンダー更新]
    Process --> |通知送信| Notify[変更完了通知]
    
    Wait --> |空き発生| Promote[待機者昇格]
    Promote --> Process
    
    Reject1 --> User
    Reject2 --> User
    Notify --> User
```

## 4. 500名・3グループ並行運営図

```mermaid
gantt
    title 法務研修LMS 3グループ並行運営スケジュール
    dateFormat  YYYY-MM-DD
    section グループ1
    研修実施1    :active, group1-1, 2024-11-01, 2d
    研修実施2    :group1-2, after group1-1, 2d
    研修実施3    :group1-3, after group1-2, 2d
    section グループ2
    研修実施1    :group2-1, 2024-11-02, 2d
    研修実施2    :group2-2, after group2-1, 2d
    研修実施3    :group2-3, after group2-2, 2d
    section グループ3
    研修実施1    :group3-1, 2024-11-03, 2d
    研修実施2    :group3-2, after group3-1, 2d
    研修実施3    :group3-3, after group3-2, 2d
    section 補講
    補講実施     :retake, after group3-3, 3d
```

## 5. データフロー図

```mermaid
graph LR
    subgraph "データ入力"
        A1[受講者情報]
        A2[研修コース情報]
        A3[予約情報]
    end
    
    subgraph "データ処理"
        B1[Google Sheets]
        B2[Google Apps Script]
        B3[Cloud SQL]
    end
    
    subgraph "データ出力"
        C1[予約確認メール]
        C2[リマインド通知]
        C3[テスト結果]
        C4[レポート]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> B2
    B2 --> B3
    
    B2 --> C1
    B2 --> C2
    B2 --> C3
    B2 --> C4
```

## 6. システムアーキテクチャ図

```mermaid
graph TB
    subgraph "フロントエンド"
        A1[受講者画面]
        A2[管理者画面]
        A3[モバイル対応]
    end
    
    subgraph "Googleワークスペース"
        B1[Google Identity]
        B2[Google Calendar]
        B3[Google Sheets]
        B4[Gmail]
        B5[Google Meet]
        B6[Google Forms]
    end
    
    subgraph "バックエンド"
        C1[Google Apps Script]
        C2[Cloud Functions]
        C3[Cloud SQL]
    end
    
    subgraph "外部連携"
        D1[Slack通知]
        D2[会議室予約システム]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> C1
    C1 --> B2
    C1 --> B3
    C1 --> B4
    C1 --> B5
    C1 --> B6
    
    C1 --> C2
    C1 --> C3
    
    C1 --> D1
    C1 --> D2
```

## 7. ユーザージャーニーマップ

```mermaid
journey
    title 受講者の研修体験フロー
    section 予約段階
      ログイン: 5: 受講者
      研修選択: 4: 受講者
      予約完了: 5: 受講者
      確認メール: 4: 受講者
    section 研修前
      リマインド受信: 3: 受講者
      準備: 4: 受講者
    section 研修中
      参加: 5: 受講者
      学習: 4: 受講者
      質問: 3: 受講者
    section 研修後
      テスト受験: 4: 受講者
      結果確認: 5: 受講者
      合格通知: 5: 受講者
    section 補講
      不合格通知: 2: 受講者
      補講予約: 3: 受講者
      再受講: 4: 受講者
```

## 8. エラーハンドリングフロー

```mermaid
flowchart TD
    Error[エラー発生] --> Type{エラータイプ}
    
    Type --> |システムエラー| System[システムエラー処理]
    Type --> |ビジネスエラー| Business[ビジネスエラー処理]
    Type --> |ネットワークエラー| Network[ネットワークエラー処理]
    
    System --> |データベースエラー| DB[トランザクションロールバック]
    System --> |カレンダーエラー| Cal[リトライ + 管理者通知]
    System --> |通知エラー| Notify[キューに保存して再送]
    
    Business --> |定員オーバー| Full[待機リスト登録]
    Business --> |時間重複| Time[代替時間提案]
    Business --> |権限不足| Auth[管理者承認フロー]
    
    Network --> |接続タイムアウト| Retry[自動リトライ]
    Network --> |API制限| Limit[レート制限対応]
    
    DB --> Log[エラーログ記録]
    Cal --> Log
    Notify --> Log
    Full --> Log
    Time --> Log
    Auth --> Log
    Retry --> Log
    Limit --> Log
    
    Log --> Alert[管理者アラート]
    Alert --> End([処理完了])
```

## 9. コスト構造図

```mermaid
pie title 月額コスト構成（$65-130）
    "Google Workspace（既存）" : 0
    "Google Cloud SQL" : 75
    "Google Cloud Functions" : 15
    "Google Cloud Storage" : 7
    "その他" : 3
```

## 10. 実装フェーズ図

```mermaid
timeline
    title 実装ロードマップ
    
    section Phase 1（2週間）
        基盤構築 : Google Apps Script作成
                  : Google Sheets設計
                  : 基本認証実装
                  : 予約機能実装
    
    section Phase 2（3週間）
        核心機能 : 予約変更機能
                  : Google Calendar連携
                  : 通知システム
                  : テスト機能
    
    section Phase 3（2週間）
        高度機能 : 管理ダッシュボード
                  : レポート機能
                  : 監視・ログ
                  : パフォーマンス最適化
    
    section Phase 4（1週間）
        運用開始 : テスト・デバッグ
                  : ユーザートレーニング
                  : 本番デプロイ
                  : 運用開始
```

---

**作成日**: 2024年10月17日  
**バージョン**: 1.0  
**対象**: 法務研修LMSシステム全体フロー  
**用途**: プレゼンテーション、設計レビュー、開発チーム共有
