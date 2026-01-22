# 火災保険見積もりページの始期日受け渡し値とAGNT稟議変更での修正可否 調査結果

**調査日**: 2026-01-13  
**調査者**: AI Assistant  
**調査対象**: Assetの火災保険見積もりページ、AGNTの稟議変更機能

---

## 1. 調査結果サマリー

### 1.1 始期日として受け渡しする値

**結論**: **決済予定日（`date_buyer_settlement`）** が始期日として使用されています。

**根拠**:
- `fire_insurance_start_date_change_mypage_implementation_plan.md`の134行目:
  ```ruby
  original_start_date: self.new_start_date || contract.settlement_procedure&.date_buyer_settlement
  ```
- `240411_火災保険料金対応MTGメモ.md`に「始期日（決済予定日）」と明記
- `SettlementProcedure`モデルの`date_buyer_settlement`（買主決済日）が始期日の基準値として使用されている

### 1.2 AGNTの稟議変更で修正できるか

**結論**: **修正できる可能性が高い**が、実装コードの直接確認はできませんでした。

**根拠**:
1. **実務データから確認**:
   - `additional_requirements_confirmation.md`によると、修正稟議の変更内容として「決済予定日変更: 53件（2.2%）」が確認されている
   - これは、決済予定日が変更されることがあることを示している

2. **業務フローから推測**:
   - FY25実績で始期日変更が1,764件発生（全処理件数の14.4%）
   - 決済日変更が頻繁に発生していることが確認されている
   - 決済日変更が発生することが前提となっているため、AGNTの稟議変更で決済予定日を修正できると推測される

3. **システム設計から推測**:
   - `fire_insurance_start_date_change_mypage_implementation_plan.md`には、`SettlementProcedure`モデルの`date_buyer_settlement`が変更されたときに自動検知する機能の実装プランが記載されている
   - これは、決済予定日が変更されることを前提とした設計であることを示している

---

## 2. 確認できた情報

### 2.1 決済予定日と始期日の関係

- **始期日 = 決済予定日（`date_buyer_settlement`）**
- Assetの火災保険見積もりページでは、`contract.settlement_procedure&.date_buyer_settlement`を始期日として使用
- 決済予定日が変更されると、始期日も変更が必要

### 2.2 決済予定日変更の実績

- **FY25実績**: 始期日変更が1,764件発生（全処理件数の14.4%）
- **工数**: 147.0時間（全工数の13.5%）
- **修正稟議での決済予定日変更**: 53件（2.2%）

### 2.3 決済予定日変更時の処理

- 決済予定日が変更されると、火災保険の始期日も変更が必要
- 現状はメールや電話での意思確認が必須（5分/件）
- 将来的にはマイページでの承認機能の実装が検討されている

---

## 3. 実装コード確認結果

### 3.1 SettlementProcedureモデルの実装

**確認したファイル**: `repositories/backend/verdandi/app/models/settlement_procedure.rb`

**重要な発見**:

1. **`date_buyer_settlement`と`contract.settlement_scheduled_date`の関係**:
   - `SettlementProcedure`モデルには`date_buyer_settlement`（買主決済日）が定義されている
   - `Contract`モデルには`settlement_scheduled_date`（決済予定日）が定義されている
   - これらは別々に管理されている

2. **差異チェック機能**（436-438行目）:
   ```ruby
   if date_buyer_settlement.present? && date_buyer_settlement != contract.settlement_scheduled_date
     differences << '決済予定日'
   end
   ```
   - `SettlementProcedure`の`date_buyer_settlement`と`Contract`の`settlement_scheduled_date`を比較
   - 差異がある場合、「決済予定日」を差異リストに追加
   - この差異は修正稟議が必要であることを示す（235-259行目の`notify_necessary_modification_of_approval_entry`メソッド）

3. **稟議変更時の反映処理**（338-353行目）:
   ```ruby
   def reflect_modification_of_approval_entry
     ActiveRecord::Base.transaction do
       update!(bank_branch_id: nil) unless contract.bank_id == bank_id
       update!(
         adaptation_rate: contract.adaptation_rate,
         bank_id: contract.bank_id,
         # ... 他の項目
       )
     end
   end
   ```
   - **注意**: `reflect_modification_of_approval_entry`メソッドでは、`date_buyer_settlement`は更新されていない
   - 稟議変更時に`Contract`の`settlement_scheduled_date`が更新されても、`SettlementProcedure`の`date_buyer_settlement`は自動的に更新されない

### 3.2 決済予定日の更新処理

**確認したファイル**: `repositories/backend/verdandi/app/models/settlement_procedures/register/settlement_date.rb`

- `date_buyer_settlement`の更新は`SettlementProcedures::Register::SettlementDate`クラスで処理される
- ただし、これは`SettlementProcedure`の更新のみで、`Contract`の`settlement_scheduled_date`との同期は確認できなかった

### 3.3 火災保険の始期日として使用される値

**確認結果**:
- Assetの火災保険見積もりページでは、`contract.settlement_procedure&.date_buyer_settlement`が始期日として使用される
- つまり、**`SettlementProcedure`の`date_buyer_settlement`**が始期日として受け渡される

---

## 4. 推奨される確認事項

### 4.1 技術的な確認

1. **AGNTの稟議変更機能の実装確認**:
   - verdandiリポジトリで、稟議変更時に決済予定日（`date_buyer_settlement`）を修正できるかどうかを確認
   - 稟議変更時に`SettlementProcedure`モデルの`date_buyer_settlement`が更新される処理があるか確認

2. **決済予定日変更の自動検知機能**:
   - `SettlementProcedure`モデルの`date_buyer_settlement`が変更されたときに、火災保険の始期日変更を自動検知する機能が実装されているか確認
   - `fire_insurance_start_date_change_mypage_implementation_plan.md`に記載されている実装プランが実装されているか確認

### 4.2 業務フローの確認

1. **稟議変更時の決済予定日修正手順**:
   - AGNTの稟議変更画面で決済予定日を修正する手順を確認
   - 修正後の決済予定日が火災保険の始期日にどのように反映されるかを確認

2. **決済予定日変更時の通知**:
   - 決済予定日が変更されたときに、火災保険の始期日変更が必要であることを通知する仕組みがあるか確認

---

## 5. 参考資料

- `fire_insurance_start_date_change_mypage_implementation_plan.md`: 始期日変更のマイページ承認機能の実装プラン
- `meeting_minutes_start_date_change_issue.md`: 始期日変更課題対応検討MTGの議事録
- `240411_火災保険料金対応MTGメモ.md`: 火災保険料金対応MTGのメモ
- `additional_requirements_confirmation.md`: AGNT 2026 重要事項説明前の必要書類送付プロジェクトの追加要件確認

---

## 6. 結論

### 6.1 始期日として受け渡しする値

**決済予定日（`date_buyer_settlement`）** が始期日として使用されています。

### 6.2 AGNTの稟議変更で修正できるか

**結論**: **直接修正はできない可能性が高い**が、**間接的に修正可能**です。

**根拠**:

1. **`SettlementProcedure`の`date_buyer_settlement`は稟議変更で自動更新されない**:
   - `reflect_modification_of_approval_entry`メソッドでは、`date_buyer_settlement`は更新されていない
   - 稟議変更時に`Contract`の`settlement_scheduled_date`が更新されても、`SettlementProcedure`の`date_buyer_settlement`は自動的に更新されない

2. **差異検知機能**:
   - `differences_with_contract`メソッドで、`date_buyer_settlement`と`contract.settlement_scheduled_date`の差異を検知
   - 差異がある場合、「修正稟議が必要」という通知が送られる（`notify_necessary_modification_of_approval_entry`）

3. **手動での修正が必要**:
   - 稟議変更で`Contract`の`settlement_scheduled_date`を更新した場合、`SettlementProcedure`の`date_buyer_settlement`も手動で更新する必要がある
   - または、決済手続き画面で`date_buyer_settlement`を直接修正する必要がある

**次のステップ**:
1. 決済手続き画面で`date_buyer_settlement`を直接修正できるかどうかを確認
2. 稟議変更時に`date_buyer_settlement`を自動更新する機能を追加するかどうかを検討

---

## 7. 決済手続き画面での編集と火災保険見積もりページへの反映

### 7.1 編集による反映の確認

**結論**: **決済手続き画面で`date_buyer_settlement`を編集すると、火災保険見積もりページの始期日表示が変わります。**

**根拠**:

1. **始期日の参照元**:
   - Assetの火災保険見積もりページでは、`contract.settlement_procedure&.date_buyer_settlement`が始期日として使用される
   - `fire_insurance_start_date_change_mypage_implementation_plan.md`の134行目で確認

2. **決済手続き画面での編集機能**:
   - `SettlementProcedure`モデルの`update_with_notice!`メソッド（464-485行目）で、`date_buyer_settlement`を含むパラメータを更新可能
   - ビューファイル（`_contract_info.html.erb`、`_result_form.html.erb`）に`date_buyer_settlement`の編集フィールドが存在

3. **データフロー**:
   ```
   決済手続き画面で編集
   ↓
   SettlementProcedure.date_buyer_settlement が更新される
   ↓
   Assetの火災保険見積もりページで contract.settlement_procedure&.date_buyer_settlement を参照
   ↓
   始期日として表示される
   ```

### 7.2 注意点

- **確定済みの場合**: `is_date_buyer_settlement_confirmed`が`true`の場合、編集フィールドが無効化される可能性がある（ビューの`disabled`属性を確認）
- **確定済みの場合は編集不可**: 確定済みの場合は編集できない可能性がある

---

**更新履歴**:
- 2026-01-13: 初版作成
- 2026-01-13: 決済手続き画面での編集と火災保険見積もりページへの反映を追加
