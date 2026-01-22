# 法務研修LMSシステム シーケンス図

## 1. 基本研修フロー（予約変更機能含む）

```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant System as LMS管理システム
    participant Calendar as Googleカレンダー
    participant Participant as 受講者
    participant Notification as 通知システム
    participant Test as テストシステム

    Note over Admin, Test: 1. 初期設定フェーズ
    Admin->>System: 1.1 会議室とGoogleカレンダー作成
    System->>Calendar: 1.2 カレンダーイベント作成
    Calendar-->>System: 1.3 イベントID返却
    Admin->>System: 1.4 予定URL登録
    Admin->>System: 1.5 受講コース対象者リスト登録
    System->>System: 1.6 3グループに自動振り分け

    Note over Admin, Test: 2. 予約フェーズ
    Participant->>System: 2.1 参加希望日予約
    System->>System: 2.2 定員・スケジュール確認
    System->>Calendar: 2.3 カレンダー予約確認
    System->>Participant: 2.4 予約確認通知

    Note over Admin, Test: 3. 予約変更フェーズ（新機能）
    Participant->>System: 3.1 予約変更申請
    System->>System: 3.2 変更条件チェック<br/>（3日前まで、1回まで、同グループ内）
    alt 変更可能
        System->>Calendar: 3.3 元予約キャンセル
        System->>Calendar: 3.4 新予約作成
        System->>Participant: 3.5 変更完了通知
        System->>Admin: 3.6 変更報告
    else 変更不可
        System->>Participant: 3.7 変更拒否理由通知
    end

    Note over Admin, Test: 4. リマインドフェーズ
    System->>System: 4.1 未登録者チェック
    System->>Notification: 4.2 リマインド送信
    Notification->>Participant: 4.3 リマインド通知

    Note over Admin, Test: 5. 研修実施フェーズ
    System->>System: 5.1 研修開始
    System->>Participant: 5.2 研修URL提供
    Participant->>System: 5.3 研修参加
    System->>System: 5.4 出席記録

    Note over Admin, Test: 6. テスト・評価フェーズ
    System->>Test: 6.1 テスト開始
    Participant->>Test: 6.2 テスト回答
    Test->>System: 6.3 回答データ送信
    System->>System: 6.4 自動採点
    Admin->>System: 6.5 手動採点（必要時）
    System->>Participant: 6.6 採点結果通知

    Note over Admin, Test: 7. 補講フェーズ
    System->>System: 7.1 未受講者・不合格者特定
    Admin->>System: 7.2 補講スケジュール設定
    System->>Calendar: 7.3 補講会議室予約
    System->>Notification: 7.4 補講案内送信
    Notification->>Participant: 7.5 補講通知
    System->>System: 7.6 補講実施
    System->>Test: 7.7 再テスト実施
```

## 2. 3グループ並行運営管理フロー

```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant System as LMS管理システム
    participant Group1 as グループ1
    participant Group2 as グループ2
    participant Group3 as グループ3
    participant Calendar as Googleカレンダー
    participant Dashboard as 管理ダッシュボード

    Note over Admin, Dashboard: グループ並行運営管理
    Admin->>System: 1. 3グループ設定
    System->>System: 2. グループ別スケジュール生成
    System->>Calendar: 3. グループ別会議室予約
    
    par グループ1運営
        System->>Group1: 4.1 グループ1研修実施
        Group1->>System: 4.2 進捗報告
    and グループ2運営
        System->>Group2: 4.3 グループ2研修実施
        Group2->>System: 4.4 進捗報告
    and グループ3運営
        System->>Group3: 4.5 グループ3研修実施
        Group3->>System: 4.6 進捗報告
    end

    System->>Dashboard: 5. 全体進捗集約
    Dashboard->>Admin: 6. 進捗レポート表示
    
    alt 遅延発生
        System->>Admin: 7.1 遅延アラート
        Admin->>System: 7.2 スケジュール調整
        System->>Calendar: 7.3 調整後スケジュール更新
    end
```

## 3. 500名規模スケーラビリティ対応フロー

```mermaid
sequenceDiagram
    participant LoadBalancer as ロードバランサー
    participant App1 as アプリサーバー1
    participant App2 as アプリサーバー2
    participant App3 as アプリサーバー3
    participant DB as データベース
    participant Cache as キャッシュ
    participant CDN as CDN

    Note over LoadBalancer, CDN: 500名同時アクセス対応
    participant User1 as ユーザー1-167
    participant User2 as ユーザー2-167
    participant User3 as ユーザー3-166

    par ユーザーグループ1
        User1->>LoadBalancer: 1.1 アクセス
        LoadBalancer->>App1: 1.2 リクエスト分散
        App1->>Cache: 1.3 キャッシュ確認
        alt キャッシュヒット
            Cache-->>App1: 1.4 データ返却
        else キャッシュミス
            App1->>DB: 1.5 DB問い合わせ
            DB-->>App1: 1.6 データ返却
            App1->>Cache: 1.7 キャッシュ保存
        end
        App1-->>User1: 1.8 レスポンス
    and ユーザーグループ2
        User2->>LoadBalancer: 2.1 アクセス
        LoadBalancer->>App2: 2.2 リクエスト分散
        App2->>Cache: 2.3 キャッシュ確認
        App2-->>User2: 2.4 レスポンス
    and ユーザーグループ3
        User3->>LoadBalancer: 3.1 アクセス
        LoadBalancer->>App3: 3.2 リクエスト分散
        App3->>Cache: 3.3 キャッシュ確認
        App3-->>User3: 3.4 レスポンス
    end

    Note over LoadBalancer, CDN: 静的コンテンツ配信
    User1->>CDN: 4.1 静的ファイル要求
    CDN-->>User1: 4.2 高速配信
```

## 4. エラーハンドリング・復旧フロー

```mermaid
sequenceDiagram
    participant System as LMS管理システム
    participant Monitor as 監視システム
    participant Admin as 管理者
    participant Backup as バックアップシステム
    participant Alert as アラートシステム

    Note over System, Alert: 障害発生時の対応フロー
    System->>Monitor: 1. エラー発生
    Monitor->>Alert: 2. アラート送信
    Alert->>Admin: 3. 管理者通知
    
    alt 軽微なエラー
        Admin->>System: 4.1 手動復旧
        System-->>Admin: 4.2 復旧完了
    else 重大なエラー
        Admin->>Backup: 5.1 バックアップ確認
        Backup-->>Admin: 5.2 バックアップデータ提供
        Admin->>System: 5.3 システム復旧
        System->>System: 5.4 データ復元
        System-->>Admin: 5.5 復旧完了通知
    end

    System->>Monitor: 6. 復旧確認
    Monitor->>Alert: 7. 復旧完了通知
    Alert->>Admin: 8. 最終確認
```

## 5. セキュリティ・認証フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as フロントエンド
    participant Auth as 認証サービス
    participant Google as Google OAuth
    participant Backend as バックエンド
    participant DB as データベース

    Note over User, DB: 認証・認可フロー
    User->>Frontend: 1. ログイン要求
    Frontend->>Auth: 2. 認証リクエスト
    Auth->>Google: 3. OAuth認証
    Google-->>Auth: 4. 認証トークン
    Auth->>Backend: 5. トークン検証
    Backend->>DB: 6. ユーザー情報取得
    DB-->>Backend: 7. ユーザーデータ
    Backend->>Backend: 8. 権限チェック
    Backend-->>Auth: 9. 認証結果
    Auth-->>Frontend: 10. セッション作成
    Frontend-->>User: 11. ログイン完了

    Note over User, DB: 継続的な認証チェック
    User->>Frontend: 12. 操作要求
    Frontend->>Backend: 13. リクエスト（トークン付き）
    Backend->>Backend: 14. トークン検証
    alt 有効なトークン
        Backend->>DB: 15. データ処理
        DB-->>Backend: 16. 結果返却
        Backend-->>Frontend: 17. レスポンス
    else 無効なトークン
        Backend-->>Frontend: 18. 認証エラー
        Frontend->>Auth: 19. 再認証要求
    end
```

## 6. 通知・リマインドシステムフロー

```mermaid
sequenceDiagram
    participant System as LMS管理システム
    participant Scheduler as スケジューラー
    participant Email as メールサービス
    participant Slack as Slack通知
    participant Participant as 受講者
    participant Admin as 管理者

    Note over System, Admin: 通知・リマインドシステム
    System->>Scheduler: 1. 通知スケジュール設定
    
    Note over System, Admin: 予約確認通知
    Scheduler->>System: 2.1 予約確認タイマー
    System->>Email: 2.2 予約確認メール送信
    Email->>Participant: 2.3 予約確認通知

    Note over System, Admin: リマインド通知
    Scheduler->>System: 3.1 リマインドタイマー
    System->>System: 3.2 未登録者チェック
    System->>Email: 3.3 リマインドメール送信
    System->>Slack: 3.4 管理者向けSlack通知
    Email->>Participant: 3.5 リマインド通知
    Slack->>Admin: 3.6 管理者通知

    Note over System, Admin: 結果通知
    System->>System: 4.1 採点完了
    System->>Email: 4.2 結果通知メール送信
    Email->>Participant: 4.3 結果通知

    Note over System, Admin: 補講案内
    System->>System: 5.1 補講対象者特定
    System->>Email: 5.2 補講案内メール送信
    System->>Slack: 5.3 補講スケジュール通知
    Email->>Participant: 5.4 補講案内
    Slack->>Admin: 5.5 補講管理通知
```

---

**作成日**: 2024年10月17日  
**バージョン**: 1.0  
**対象システム**: 法務研修LMS管理システム
