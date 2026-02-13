# 始期日変更のマイページ承認機能 実装プラン

**作成日**: 2024年12月18日  
**目的**: 始期日変更時にマイページで承諾をもらう機能の実装プランと工数見積もり

---

## 1. 概要

### **目的**
始期日変更時に、メールや電話での意思確認ではなく、マイページで顧客が承認できるようにする。

### **現状の課題**
- メールや電話での意思確認が必須（5分/件）
- FY25実績: 1,764件（147.0時間）
- GA/パートナーズ間の情報連携や契約者との個別調整に工数がかかる

### **期待効果**
- 顧客の利便性向上（24時間いつでも承認可能）
- 業務効率化（メール・電話対応の削減）
- 承認履歴の自動記録

### **重要な前提条件**
- **始期日変更データの流し込みはFinatext社（INSPIRE API）を経由しない**
- **顧客の返答を待って、手動オペレーションでTnetに流し込む想定**
- マイページでの承認機能は、手動オペレーションの効率化を支援するためのもの

---

## 2. システム構成

### **2.1 現状のシステム構成**

#### **Backend (Verdandi)**
- `FireInsuranceRequest` モデル: 火災保険申込記録
  - `contract_id`: 契約ID
  - `inspire_id`: INSPIRE上でのID
  - `status`: 申し込み状況（draft, already_requested）

#### **Frontend (renosy_asset)**
- マイページ画面（Rails + ERB）
- 火災保険関連の画面・コンポーネント

#### **決済手続き関連**
- `SettlementProcedure` モデル: 決済手続き情報
  - `date_buyer_settlement`: 買主決済日
  - `is_date_buyer_settlement_confirmed`: 買主決済日確定フラグ

---

## 3. 実装プラン

### **3.1 データベース設計**

#### **A. FireInsuranceRequestテーブルへの追加カラム**

```ruby
# Migration: Add start date change fields to fire_insurance_requests
class AddStartDateChangeFieldsToFireInsuranceRequests < ActiveRecord::Migration[7.2]
  def change
    add_column :fire_insurance_requests, :original_start_date, :date, comment: '元の始期日'
    add_column :fire_insurance_requests, :new_start_date, :date, comment: '新しい始期日'
    add_column :fire_insurance_requests, :start_date_change_status, :integer, default: 0, null: false, comment: '始期日変更承認状況'
    add_column :fire_insurance_requests, :start_date_change_requested_at, :datetime, comment: '始期日変更依頼日時'
    add_column :fire_insurance_requests, :start_date_change_approved_at, :datetime, comment: '始期日変更承認日時'
    add_column :fire_insurance_requests, :start_date_change_rejected_at, :datetime, comment: '始期日変更拒否日時'
    
    add_index :fire_insurance_requests, :start_date_change_status
  end
end
```

**Enum定義**:
```ruby
# app/models/fire_insurance_request.rb
enumerize :start_date_change_status, in: {
  no_change: 0,           # 変更なし
  pending_approval: 1,    # 承認待ち
  approved: 2,            # 承認済み
  rejected: 3             # 拒否
}, predicates: true
```

#### **B. 始期日変更履歴テーブル（オプション）**

```ruby
# Migration: Create fire_insurance_start_date_change_histories
class CreateFireInsuranceStartDateChangeHistories < ActiveRecord::Migration[7.2]
  def change
    create_table :fire_insurance_start_date_change_histories, comment: '始期日変更履歴' do |t|
      t.references :fire_insurance_request, null: false, foreign_key: true, index: true
      t.date :original_start_date, null: false, comment: '変更前の始期日'
      t.date :new_start_date, null: false, comment: '変更後の始期日'
      t.integer :status, null: false, comment: '承認状況'
      t.datetime :requested_at, null: false, comment: '依頼日時'
      t.datetime :approved_at, comment: '承認日時'
      t.datetime :rejected_at, comment: '拒否日時'
      t.text :rejection_reason, comment: '拒否理由'
      
      t.timestamps
    end
    
    add_index :fire_insurance_start_date_change_histories, :status
  end
end
```

### **3.2 Backend実装**

#### **A. FireInsuranceRequestモデルの拡張**

```ruby
# app/models/fire_insurance_request.rb
class FireInsuranceRequest < ApplicationRecord
  extend Enumerize

  belongs_to :contract, required: true

  validates :inspire_id, presence: true, uniqueness: true
  validates :status, presence: true
  validates :new_start_date, presence: true, if: :start_date_change_pending_approval?

  enumerize :status, in: { draft: 0, already_requested: 1 }, predicates: true
  enumerize :start_date_change_status, in: {
    no_change: 0,
    pending_approval: 1,
    approved: 2,
    rejected: 3
  }, predicates: true

  # 始期日変更を依頼する
  def request_start_date_change(new_start_date)
    update!(
      original_start_date: self.new_start_date || contract.settlement_procedure&.date_buyer_settlement,
      new_start_date: new_start_date,
      start_date_change_status: :pending_approval,
      start_date_change_requested_at: Time.current
    )
  end

  # 始期日変更を承認する
  def approve_start_date_change!
    # 承認状態を更新
    # 注意: INSPIRE API連携は行わない。手動オペレーションでTnetに流し込む想定
    update!(
      start_date_change_status: :approved,
      start_date_change_approved_at: Time.current
    )
    
    # 承認ログを記録
    Rails.logger.info("始期日変更承認: Contract #{contract_id}, 元の始期日: #{original_start_date}, 新しい始期日: #{new_start_date}")
    
    # 手動オペレーション用の通知（Slack、メール等）
    # パートナーズ担当者に通知を送信
    StartDateChangeNotificationJob.perform_later(self.id)
  end

  # 始期日変更を拒否する
  def reject_start_date_change!(reason = nil)
    update!(
      start_date_change_status: :rejected,
      start_date_change_rejected_at: Time.current
    )
    # 拒否理由の記録（履歴テーブルがある場合）
  end
end
```

#### **B. APIコントローラーの拡張**

```ruby
# app/controllers/api/contracts/fire_insurance_requests_controller.rb
module Api
  module Contracts
    class FireInsuranceRequestsController < Api::BaseController
      # 既存のcreate, updateメソッド...

      # 始期日変更を依頼する
      def request_start_date_change
        contract = Contract.find(params[:contract_id])
        fire_insurance_request = contract.fire_insurance_request
        
        fire_insurance_request.request_start_date_change(
          params[:new_start_date]
        )
        
        render json: { 
          message: '始期日変更の依頼を受け付けました',
          fire_insurance_request: fire_insurance_request
        }
      rescue ActiveRecord::RecordInvalid => e
        render json: { message: e.message }, status: :unprocessable_entity
      end

      # 始期日変更を承認する
      def approve_start_date_change
        contract = Contract.find(params[:contract_id])
        fire_insurance_request = contract.fire_insurance_request
        
        # 非同期処理でINSPIRE API連携を実行
        FireInsuranceStartDateChangeJob.perform_later(fire_insurance_request.id)
        
        # 承認状態を更新（API連携は非同期）
        fire_insurance_request.update!(
          start_date_change_status: :approved,
          start_date_change_approved_at: Time.current
        )
        
        render json: { 
          message: '始期日変更を承認しました。INSPIRE APIへの連携を実行中です。',
          fire_insurance_request: fire_insurance_request
        }
      rescue ActiveRecord::RecordInvalid => e
        render json: { message: e.message }, status: :unprocessable_entity
      rescue => e
        Rails.logger.error("始期日変更承認エラー: #{e.message}")
        render json: { message: 'エラーが発生しました。しばらくしてから再度お試しください。' }, 
               status: :internal_server_error
      end

      # 始期日変更を拒否する
      def reject_start_date_change
        contract = Contract.find(params[:contract_id])
        fire_insurance_request = contract.fire_insurance_request
        
        fire_insurance_request.reject_start_date_change!(
          params[:rejection_reason]
        )
        
        render json: { 
          message: '始期日変更を拒否しました',
          fire_insurance_request: fire_insurance_request
        }
      rescue ActiveRecord::RecordInvalid => e
        render json: { message: e.message }, status: :unprocessable_entity
      end

      # 始期日変更の状態を取得
      def start_date_change_status
        contract = Contract.find(params[:contract_id])
        fire_insurance_request = contract.fire_insurance_request
        
        render json: {
          start_date_change_status: fire_insurance_request.start_date_change_status,
          original_start_date: fire_insurance_request.original_start_date,
          new_start_date: fire_insurance_request.new_start_date,
          requested_at: fire_insurance_request.start_date_change_requested_at,
          approved_at: fire_insurance_request.start_date_change_approved_at,
          rejected_at: fire_insurance_request.start_date_change_rejected_at
        }
      end
    end
  end
end
```

#### **C. ルーティング追加**

```ruby
# config/routes.rb
namespace :api do
  namespace :contracts do
    resources :fire_insurance_requests, only: [:create, :update] do
      member do
        post :request_start_date_change
        post :approve_start_date_change
        post :reject_start_date_change
        get :start_date_change_status
      end
    end
  end
end
```

#### **D. 手動オペレーション支援機能（INSPIRE API連携なし）**

**重要**: 始期日変更データの流し込みはFinatext社（INSPIRE API）を経由せず、顧客の返答を待って、手動オペレーションでTnetに流し込む想定です。

**実装方針**:
- マイページでの承認機能は、手動オペレーションの効率化を支援
- 承認済みデータをTnet用フォーマットでエクスポート可能にする
- パートナーズ担当者への通知機能を実装
- 管理画面で承認済みデータの一覧表示・エクスポート機能を提供

#### **E. 手動オペレーション支援機能**

```ruby
# app/jobs/start_date_change_notification_job.rb
class StartDateChangeNotificationJob < ApplicationJob
  queue_as :default

  def perform(fire_insurance_request_id)
    fire_insurance_request = FireInsuranceRequest.find(fire_insurance_request_id)
    contract = fire_insurance_request.contract
    
    # パートナーズ担当者への通知（Slack、メール等）
    # Tnetへの手動オペレーションが必要なことを通知
    
    # Slack通知
    SlackNotifier.notify_start_date_change_approved(
      contract_id: contract.id,
      customer_name: contract.customer.name,
      original_start_date: fire_insurance_request.original_start_date,
      new_start_date: fire_insurance_request.new_start_date,
      inspire_id: fire_insurance_request.inspire_id
    )
    
    # メール通知（パートナーズ担当者向け）
    FireInsuranceMailer.start_date_change_approved_to_partners(
      fire_insurance_request
    ).deliver_now
    
    # 顧客への承認完了メール
    FireInsuranceMailer.start_date_change_approved_to_customer(
      fire_insurance_request.contract
    ).deliver_now
  end
end
```

#### **F. Tnet手動オペレーション用データエクスポート機能**

```ruby
# app/services/tnet_export_service.rb
class TnetExportService
  # 承認済みの始期日変更データをTnet用フォーマットでエクスポート
  def self.export_approved_start_date_changes
    approved_changes = FireInsuranceRequest.where(
      start_date_change_status: :approved
    ).where.not(start_date_change_approved_at: nil)
    
    # Tnet用のCSV形式でエクスポート
    CSV.generate(headers: true) do |csv|
      csv << ['契約ID', 'INSPIRE ID', '顧客名', '元の始期日', '新しい始期日', '承認日時']
      
      approved_changes.each do |request|
        csv << [
          request.contract_id,
          request.inspire_id,
          request.contract.customer.name,
          request.original_start_date.strftime('%Y-%m-%d'),
          request.new_start_date.strftime('%Y-%m-%d'),
          request.start_date_change_approved_at.strftime('%Y-%m-%d %H:%M:%S')
        ]
      end
    end
  end
  
  # 承認済みの始期日変更データをJSON形式でエクスポート
  def self.export_approved_start_date_changes_json
    approved_changes = FireInsuranceRequest.where(
      start_date_change_status: :approved
    ).where.not(start_date_change_approved_at: nil)
    
    approved_changes.map do |request|
      {
        contract_id: request.contract_id,
        inspire_id: request.inspire_id,
        customer_name: request.contract.customer.name,
        customer_email: request.contract.customer.email,
        original_start_date: request.original_start_date.strftime('%Y-%m-%d'),
        new_start_date: request.new_start_date.strftime('%Y-%m-%d'),
        approved_at: request.start_date_change_approved_at.iso8601
      }
    end
  end
end
```

#### **G. 管理画面での承認済みデータ一覧表示**

```ruby
# app/controllers/admin/fire_insurance_start_date_changes_controller.rb
class Admin::FireInsuranceStartDateChangesController < Admin::BaseController
  def index
    @approved_changes = FireInsuranceRequest
      .where(start_date_change_status: :approved)
      .where.not(start_date_change_approved_at: nil)
      .order(start_date_change_approved_at: :desc)
      .page(params[:page])
  end
  
  def export_csv
    csv_data = TnetExportService.export_approved_start_date_changes
    send_data csv_data, filename: "start_date_changes_#{Date.today.strftime('%Y%m%d')}.csv"
  end
  
  def export_json
    json_data = TnetExportService.export_approved_start_date_changes_json
    send_data json_data.to_json, filename: "start_date_changes_#{Date.today.strftime('%Y%m%d')}.json"
  end
  
  def mark_as_processed
    fire_insurance_request = FireInsuranceRequest.find(params[:id])
    fire_insurance_request.update!(
      start_date_change_processed_at: Time.current
    )
    redirect_to admin_fire_insurance_start_date_changes_path, notice: '処理済みにマークしました'
  end
end
```

#### **F. 決済日変更時の自動検知（オプション）**

```ruby
# app/models/concerns/fire_insurance_start_date_change_notifier.rb
module FireInsuranceStartDateChangeNotifier
  extend ActiveSupport::Concern

  included do
    after_update :notify_start_date_change_if_needed
  end

  private

  def notify_start_date_change_if_needed
    return unless saved_change_to_date_buyer_settlement?
    
    contract = self.contract
    fire_insurance_request = contract.fire_insurance_request
    
    return unless fire_insurance_request&.already_requested?
    
    # 決済日が変更された場合、始期日変更を依頼
    fire_insurance_request.request_start_date_change(
      date_buyer_settlement
    )
  end
end

# app/models/settlement_procedure.rb
class SettlementProcedure < ApplicationRecord
  include FireInsuranceStartDateChangeNotifier
  # ...
end
```

### **3.3 Frontend実装（renosy_asset）**

#### **A. マイページ画面への追加**

```erb
<!-- app/views/mypage/fire_insurance/_start_date_change_notification.html.erb -->
<% if fire_insurance_request.start_date_change_pending_approval? %>
  <div class="alert alert-warning">
    <h3>始期日変更のご確認をお願いします</h3>
    <p>
      決済日の変更に伴い、火災保険の始期日を変更する必要があります。<br>
      変更前: <%= fire_insurance_request.original_start_date.strftime('%Y年%m月%d日') %><br>
      変更後: <%= fire_insurance_request.new_start_date.strftime('%Y年%m月%d日') %>
    </p>
    <div class="actions">
      <%= button_to '承認する', 
          approve_start_date_change_api_contract_fire_insurance_request_path(
            contract_id: contract.id
          ),
          method: :post,
          class: 'btn btn-primary',
          data: { confirm: '始期日変更を承認しますか？' } %>
      <%= button_to '拒否する', 
          reject_start_date_change_api_contract_fire_insurance_request_path(
            contract_id: contract.id
          ),
          method: :post,
          class: 'btn btn-secondary',
          data: { confirm: '始期日変更を拒否しますか？' } %>
    </div>
  </div>
<% end %>
```

#### **B. JavaScript/Ajax処理**

```javascript
// app/assets/javascripts/mypage/fire_insurance_start_date_change.js
document.addEventListener('DOMContentLoaded', function() {
  const approveButton = document.querySelector('.approve-start-date-change');
  const rejectButton = document.querySelector('.reject-start-date-change');
  
  if (approveButton) {
    approveButton.addEventListener('click', function(e) {
      e.preventDefault();
      const url = this.dataset.url;
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        location.reload();
      })
      .catch(error => {
        alert('エラーが発生しました');
        console.error(error);
      });
    });
  }
  
  // 拒否ボタンの処理も同様
});
```

#### **C. 通知バッジの表示**

```erb
<!-- app/views/mypage/shared/_header.html.erb -->
<% if current_user.has_pending_fire_insurance_start_date_changes? %>
  <span class="badge badge-warning">
    始期日変更確認待ち
  </span>
<% end %>
```

### **3.4 通知機能**

#### **A. メール通知（承認依頼時）**

```ruby
# app/mailers/fire_insurance_mailer.rb
class FireInsuranceMailer < ApplicationMailer
  def start_date_change_request(contract)
    @contract = contract
    @fire_insurance_request = contract.fire_insurance_request
    @customer = contract.customer
    
    mail(
      to: @customer.email,
      subject: '【RENOSY】火災保険の始期日変更について'
    )
  end
end
```

```erb
<!-- app/views/fire_insurance_mailer/start_date_change_request.html.erb -->
<p><%= @customer.name %> 様</p>
<p>決済日の変更に伴い、火災保険の始期日を変更する必要があります。</p>
<p>
  変更前: <%= @fire_insurance_request.original_start_date.strftime('%Y年%m月%d日') %><br>
  変更後: <%= @fire_insurance_request.new_start_date.strftime('%Y年%m月%d日') %>
</p>
<p>マイページより承認をお願いいたします。</p>
<%= link_to 'マイページへ', mypage_url %>
```

---

## 4. 工数見積もり

### **4.1 Backend実装**

| 作業項目 | 工数 | 詳細 |
|---------|------|------|
| **データベース設計・マイグレーション** | 0.5日 | テーブル設計、マイグレーションファイル作成 |
| **FireInsuranceRequestモデル拡張** | 1.5日 | メソッド追加、バリデーション、トランザクション処理、テスト |
| **APIコントローラー実装** | 2.0日 | 4つのエンドポイント実装、エラーハンドリング、ロールバック処理、テスト |
| **ルーティング追加** | 0.2日 | routes.rbの更新 |
| **決済日変更検知機能** | 1.5日 | コールバック実装、エッジケース対応、テスト |
| **メール通知機能** | 1.0日 | メーラー実装、テンプレート作成、テスト |
| **手動オペレーション支援機能** | 2.0日 | Tnetエクスポート機能、通知機能、管理画面実装 |
| **Tnet連携仕様確認** | 0.5日 | パートナーズとのTnet連携仕様確認、データフォーマット確認 |
| **非同期処理実装** | 1.0日 | バックグラウンドジョブ実装（通知送信）、エラーハンドリング |
| **ログ・監視機能** | 1.0日 | ログ出力、エラー監視、アラート設定 |
| **テスト作成** | 3.0日 | モデルテスト、コントローラーテスト、API連携テスト、統合テスト、エッジケーステスト |
| **コードレビュー対応** | 1.0日 | レビュー指摘対応、リファクタリング |
| **小計** | **17.7日** | |

### **4.2 Frontend実装**

| 作業項目 | 工数 | 詳細 |
|---------|------|------|
| **画面設計・UIデザイン** | 1.5日 | 画面レイアウト設計、デザイン、UX検討 |
| **ERBテンプレート作成** | 1.5日 | 通知表示、承認/拒否ボタン、エラー表示、ローディング表示 |
| **JavaScript実装** | 2.0日 | Ajax処理、エラーハンドリング、リトライ処理、ユーザーフィードバック |
| **スタイリング** | 1.0日 | CSS/SCSS実装、レスポンシブ対応 |
| **アクセシビリティ対応** | 0.5日 | キーボード操作、スクリーンリーダー対応 |
| **テスト** | 2.0日 | 画面テスト、JavaScriptテスト、E2Eテスト、ブラウザ互換性テスト |
| **コードレビュー対応** | 1.0日 | レビュー指摘対応、リファクタリング |
| **小計** | **9.5日** | |

### **4.3 統合・QA**

| 作業項目 | 工数 | 詳細 |
|---------|------|------|
| **統合テスト** | 2.0日 | Backend-Frontend統合テスト、INSPIRE API連携テスト、エッジケーステスト |
| **QAテスト** | 3.0日 | 機能テスト、回帰テスト、パフォーマンステスト、セキュリティテスト |
| **バグ修正** | 2.0日 | 発見されたバグの修正、再テスト |
| **ステージング環境での検証** | 1.0日 | ステージング環境での動作確認、INSPIRE API連携確認 |
| **小計** | **8.0日** | |

### **4.4 その他（ドキュメント・運用準備）**

| 作業項目 | 工数 | 詳細 |
|---------|------|------|
| **技術ドキュメント作成** | 1.0日 | API仕様書、アーキテクチャドキュメント、データベース設計書 |
| **運用マニュアル作成** | 1.0日 | 運用手順書、トラブルシューティングガイド |
| **デプロイ準備** | 0.5日 | デプロイ手順書、ロールバック手順書 |
| **関係者への説明・教育** | 1.0日 | パートナーズ、東京海上への説明、運用チームへの教育 |
| **小計** | **3.5日** | |

### **4.5 総工数**

| カテゴリ | 工数 |
|---------|------|
| Backend実装 | 13.2日 |
| Frontend実装 | 9.5日 |
| 統合・QA | 8.0日 |
| その他（ドキュメント・運用準備） | 3.5日 |
| **合計** | **34.2日** |

**人月換算**: 約6.8人月（1人月=5営業日として）

**注意**: INSPIRE API連携を削除したため、工数が削減されました。

**注意**: この工数見積もりは、INSPIRE API連携を含む完全な実装を想定しています。

---

## 5. 実装スケジュール

### **Phase 0: 準備・仕様確認（1週間）**
- Day 1-2: Tnet連携仕様確認（パートナーズとの打ち合わせ）
  - **重要**: Tnetへのデータ流し込み方法の確認
  - データフォーマットの確認（CSV、JSON等）
  - 手動オペレーションのフロー確認
- Day 3-4: データベース設計、アーキテクチャ設計
- Day 5: 技術レビュー、実装方針確定

### **Phase 1: Backend実装（2.5週間）**
- Week 1: データベース設計・マイグレーション、モデル拡張、APIコントローラー実装
- Week 2: 手動オペレーション支援機能（Tnetエクスポート、通知機能）、管理画面実装、非同期処理実装
- Week 2.5: 決済日変更検知機能、メール通知機能、ログ・監視機能、テスト作成、コードレビュー

### **Phase 2: Frontend実装（2週間）**
- Week 1: 画面設計・UIデザイン、ERBテンプレート作成、JavaScript実装
- Week 2: スタイリング、アクセシビリティ対応、テスト、コードレビュー

### **Phase 3: 統合・QA（2週間）**
- Week 1: 統合テスト、ステージング環境での検証
- Week 2: QAテスト、バグ修正、再テスト

### **Phase 4: ドキュメント・運用準備（1週間）**
- Day 1-2: 技術ドキュメント作成、運用マニュアル作成
- Day 3: デプロイ準備
- Day 4-5: 関係者への説明・教育

**総期間**: 約7週間（34.2営業日、約1.5ヶ月）

**注意**: Tnet連携仕様確認に時間がかかる場合は、さらに期間が延びる可能性があります。

---

## 6. リスクと対策

### **6.1 技術的リスク**

| リスク | 影響度 | 対策 |
|--------|--------|------|
| **Tnet手動オペレーション** | **高** | **承認後のデータをTnetに手動で流し込む必要がある。エクスポート機能、管理画面の実装が必要** |
| **Tnet連携仕様確認** | **中** | **パートナーズとのTnet連携仕様確認、データフォーマット確認が必要** |
| **手動オペレーションの漏れ** | **中** | **承認済みデータの処理漏れを防ぐため、通知機能、管理画面での確認機能が必要** |
| 決済日変更の検知タイミング | 中 | SettlementProcedureの更新タイミングを確認 |
| 既存データへの影響 | 低 | デフォルト値の設定、既存データのマイグレーション |
| API連携のエラーハンドリング | 高 | リトライ処理、ロールバック処理の実装 |
| 非同期処理の実装 | 中 | バックグラウンドジョブの実装が必要 |
| **手動オペレーションの負荷** | **中** | **承認件数が多い場合、手動オペレーションの負荷が高くなる可能性。エクスポート機能、バッチ処理機能の実装が必要** |

### **6.2 運用リスク**

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 顧客が承認しない場合 | 中 | メール通知、リマインド機能の実装 |
| 承認漏れ | 中 | ダッシュボードでの確認機能、通知機能 |
| 既存フローとの整合性 | 中 | 既存のメール・電話対応フローとの併用期間を設ける |

---

## 7. 次のステップ

1. **技術レビュー**: 実装プランの技術的妥当性の確認
2. **デザインレビュー**: UI/UXの確認
3. **スケジュール調整**: 開発リソースの確保
4. **実装開始**: Phase 1から順次実装

---

## 8. 参考情報

- **現状の課題**: FY25で1,764件（147.0時間）の始期日変更案内
- **期待効果**: メール・電話対応の削減、顧客満足度向上
- **関連ドキュメント**: 
  - `meeting_minutes_start_date_change_issue.md`
  - `RENOSY火災保険 業務資料`

