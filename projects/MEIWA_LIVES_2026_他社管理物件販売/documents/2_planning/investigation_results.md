# 論点調査結果

プロジェクト: 明和ライブス 他社管理物件販売プロジェクト  
調査日: 2026-01-09  
調査対象: 
- verdandi: 販売管理システム（AGNT）
- agnt_rda: 物件提案システム（INSIGHT）
- supplier-article: 仕入れ管理システム（SUPPLIER）
- renosy_asset: 顧客向けマイページ・APP
- tech_after: 賃貸管理システム（MANAGE）
バージョン: v3.2

## 調査概要

スプレッドシート「RAM管理外物件販売対応の整理」の論点について、以下のシステムのソースコードを調査し、現状の実装状況を確認しました。

### 調査した論点
1. 仕入れ契約: SUPPLIERシステムとの連携、`manage_type`の扱い
2. 書類完備: 書類管理の仕組み
3. 発表: 物件発表のトリガー、INSIGHT表示、SUPPLIERからAGNTへの`manage_type`同期
4. 販売: 管理プランの選択、DocuSign処理、マイページ契約
5. 販売契約: DocuSignでの契約処理、管理委託契約書の扱い、他社管理物件の場合の対応
6. 管理: MANAGEシステム連携、My Page・Appでの表示制御

### 調査対象システム
- verdandi（AGNT）: 販売管理システム
- agnt_rda（INSIGHT）: 物件提案システム
- supplier-article（SUPPLIER）: 仕入れ管理システム
- renosy_asset: 顧客向けマイページ・APP（要調査）
- tech_after（MANAGE）: 賃貸管理システム（要調査）

---

## 1. 仕入れ契約

### 調査結果
- Articleモデル: `belongs_to :supplier` (line 30)
- SUPPLIER連携: `supplier_article_id`でSUPPLIERシステムと連携
- サブリース判定: `supplier_sublease?`メソッドでサブリース物件を判定（line 342-343）

### 確認事項
- [ ] 仕入れ契約の詳細な処理フロー
- [ ] SUPPLIERからのデータ連携タイミング

---

## 2. 書類完備

### 調査結果
- Articleモデル: `SUPPLIER_FILE_TYPES`でファイルタイプを定義（line 122）
- ファイル管理: `supplier_article`経由でSUPPLIERのファイル情報を取得

### 確認事項
- [ ] 書類完備の判定ロジック
- [ ] 書類不足時の処理

---

## 3. 発表

### 論点
- 誰が販売する？
- INSIGHTにも表示させる？

### 調査結果（verdandi）

#### 物件発表の仕組み
- Articleモデル: `status`で物件の状態を管理
  - `before_sale: 0` - 販売前
  - `open: 1` - 公開中
  - `applied: 2` - 申込済み
  - `contract: 3` - 契約済み
  - `sold: 4` - 売却済み
  - `suspension: 5` - 停止中

- INSIGHT表示: `agnt_rda`で事業計画書を生成・表示
  - `app/views/pdf/business_plan.html.erb` - 事業計画書のテンプレート
  - `app/assets/stylesheets/pdf/business_plan.scss` - スタイル

#### コード確認
```ruby
# Articleモデル (line 94-98)
scope :search_building, lambda {
  select('*, articles.id as id, articles.id as article_id')
    .joins(room: :building)
    .where('articles.status IN (?)', [Article.status.before_sale.value, Article.status.open.value])
}
```

### SUPPLIERの管理形態（manage_type）の影響

#### SUPPLIERシステム（supplier-article）
- Supplier::Articleモデル: `manage_type`属性が定義されている（`repositories/backend/verdandi/app/models/supplier/article.rb`, line 70）
  - SUPPLIERから取得する物件データに`manage_type`が含まれる

#### verdandi（AGNT）での扱い

Articleモデル（verdandi）:
- `manage_type`が定義されている（`repositories/backend/verdandi/app/models/article.rb`, line 22-25）
  ```ruby
  enumerize :manage_type, in: {
    our: 'false',
    other: 'true'
  }
  ```
- Article#our_manage?メソッド: `manage_type.nil? || manage_type.our?`で判定（line 214-216）
  - `manage_type`がnilまたは`our`（'false'）の場合、自社管理と判定
  - `manage_type`が`other`（'true'）の場合、他社管理と判定

Contractモデル（verdandi）:
- `manage_type`が定義されている（`repositories/backend/verdandi/app/models/contract.rb`, line 29）
  ```ruby
  enumerize :manage_type, in: { our: 'false', other: 'true' }
  ```
- Contract#our_manage?メソッド: `!manage_type?`で判定（line 377-379）
- バリデーション: `our_manage?`がtrueの場合のみ、以下が必須（line 120-121）
  - `management_start_date`
  - `management_end_date`
  - `rental_contract`
  - つまり、他社管理（`manage_type`が`other`）の場合、これらの項目は必須ではない

注意: `Article`と`Contract`は両方ともverdandi（AGNT）のモデルです。別々のプロダクトではなく、同じプロダクト内の異なるモデルです。

#### 確認事項
- [x] SUPPLIERからverdandiへの`manage_type`同期: 
  - ✅ 確認済み: SUPPLIERで`manage_type`が「他社」に設定されている場合、`Connectors::TechConsul#release_article`でAGNTのAPIを呼び出すと、`Articles::Factory#article_attributes`で`manage_type: supplier_article.manage_type`としてAGNTの`Article`に設定される（`repositories/backend/verdandi/app/models/articles/factory.rb`, line 68）
  - ✅ 確認済み: AGNT側の`api/articles`エンドポイントで`manage_type`を受け取って`Article`に設定する処理が実装されている
  - ✅ 確認済み: 既存レコードの`manage_type`を「他社」に更新する場合、SUPPLIER側で`manage_type`を変更して保存するだけで、`ArticlesController#update`で自動的に`release!`が呼ばれてAGNT側も更新される
- [x] ArticleとContractの`manage_type`の関係: 
  - ✅ 確認済み: `Article`と`Contract`は両方ともverdandi（AGNT）のモデルで、`Contract`は`belongs_to :article`の関係
  - ⚠️ 要確認: `Article`から`Contract`を作成する際に`manage_type`が自動的に設定されるかは、コントローラーやサービスオブジェクトの実装を確認する必要がある
  - ✅ 確認済み: `Contract`の`manage_type`が`other`（他社管理）の場合、`our_manage?`は`false`を返し、`management_start_date`、`management_end_date`、`rental_contract`のバリデーションがスキップされる
- [ ] SUPPLIERでの設定方法: SUPPLIERシステムで`manage_type`を「他社」に設定する方法
- [ ] データ同期タイミング: SUPPLIERで`manage_type`を変更した場合、verdandiにいつ反映されるか

### スプレッドシート記載の内容
- 販売担当者: AD1（Asset Design 1）全アセプラが販売担当
- INSIGHT表示: YES（INSIGHTにも表示させる）

### 確認事項
- [x] INSIGHTでの表示: 事業計画書は`agnt_rda`で生成される
- [x] 販売担当者: AD1全アセプラが販売担当（スプレッドシート記載）
- [ ] 物件発表のトリガー（SUPPLIERからの連携タイミング）
- [ ] 販売担当者の設定方法（AGNTでの設定方法）

---

## 4. 販売

### 論点
- 管理プランはどうする？
- アセプラは管理プランについてどうやって説明する？

### 調査結果（verdandi）

#### 管理プラン（rental_contract）の定義
- Enumerations::RentalContract (`verdandi/app/models/enumerations/rental_contract.rb`)
  - `sublease: 0` - サブリース
  - `agency_guarantee: 1` - 代理保証
  - `agency_no_guarantee: 2` - 代理保証なし
  - `rent_guarantee: 3` - 家賃保証
  - `agency_guarantee_includes_equ: 4` - 代理保証（設備含む）
  - `renosy_wide_plan: 5` - 安心サポート＋
  - `renosy_master_plan: 6` - マスタープラン
  - `agency_guarantee_pro: 7` - 節約セルフ
  - `neo_income: 8` - NEO収入
  - `agency_guarantee_sublease: 9` - 代理保証サブリース
  - `renosy_wide_sublease: 10` - サブリースおまかせプレミア＋
  - `neo_income_agency_guarantee: 11` - NEO収入代理保証
  - `agency_guarantee_pro_sublease: 12` - 節約セルフサブリース

#### 他社管理物件の扱い（verdandi）
- Contractモデル: `enumerize :manage_type, in: { our: 'false', other: 'true' }` (line 29)
- バリデーション: 自社管理の場合のみ`rental_contract`が必須
  ```ruby
  # Contractモデル (verdandi/app/models/contract.rb, line 120-121)
  u.validates :management_start_date, :management_end_date, :rental_contract,
              presence: true, if: :our_manage?
  ```
- 判定メソッド: `our_manage?` - `!manage_type?`で判定（line 377-379）

#### DocuSignでの管理プラン処理（verdandi）
- DocumentSign::Envelope (`verdandi/lib/document_sign/envelope.rb`)
  - `rental_contract`に応じて異なる管理プランの署名欄を追加（line 286-315）
  - 各管理プランに対応するDocuSignドキュメントIDが定義されている

### 調査結果（agnt_rda）

#### INSIGHT管理画面での管理プラン設定

管理プランが「active」になる条件:
- KanriPlanSetting.active (`repositories/backend/agnt_rda/app/models/kanri_plan_setting.rb`, line 37-45)
  - 条件1: `simulation_appendix`が存在する（全項目入力必須）
  - 条件2: `kanri_plan_fees`が存在する
  - 条件3: 同じ`kanri_plan_id`と`start_date`で、関東用と関西用の2つの設定（`COUNT(DISTINCT kanri_plan_settings.id) = 2`）が存在する

#### 他社管理物件用の管理プラン設定手順（確認済み）

対象の管理プラン:
- 名前: 賃貸管理外部提携プラン
- 用途: サブリース（`for_sublease: true`）

関東用・関西用の両方で設定が必要:

1. 管理プラン設定:
   - 適用開始日（必須）: `2026年/01月/09日`（関東用・関西用で共通）
   - 空室費用請求: `false`
   - 原状回復費請求: `true`
   - 設備費用請求: `true`
   - 家賃変動の間隔(年): 未設定
   - 入居者募集広告費(月)（必須）: `0`

2. 管理プラン料金:
   - 平米数(以上)（必須）: `0`
   - 料金: `0`（料金と料率のいずれか入力必須）
   - 料率: `-`（未設定）

3. シミュレーション補足（全項目入力必須）:
   - 家賃収入変動の補足（必須）: 総務省「住宅・土地統計調査」に基づき、1971〜1980年建築の非木造民営借家における、1988年（¥4,454／畳）と2023年（¥4,426／畳）の家賃を比較して35年間の年平均変動率（−0.02％）以上の負荷で設定しています。※実際の受取金額に近いイメージができるよう、物価調整は行わず金額ベースで試算しています。
   - 空室発生の補足（必須）: 当社管理実績値以上の負荷で設定。＜当社2024年度の平均実績値＞・空室頻度：4年保有で1回・空室日数：1回あたり17.7日
   - 管理・修繕費変動の補足（必須）: 国土交通省「マンションの修繕積立金に関するガイドライン（2024年6月改定）」に記載のモデルケース（段階増額積立方式で5年ごとに見直し、最終1.8倍に到達する）以上の負荷で設定しています。
   - ローンに含まれない諸費用の補足（必須）: 登記費用・ローン手数料・司法書士報酬・収入印紙代等の購入時諸費用を合算した概算額。ローンに組み込まれないため初年度一括発生。詳細は事業計画書をご確認ください。
   - 不動産取得税の補足（必須）: 固定資産税評価額等を基にした概算額。正式な納付額は管轄自治体より送付される納税通知書に基づき確定します。
   - 空室損害費の補足（必須）: 入居するサブリース会社との契約期間中は、固定の家賃収入を受け取ることができます。
   - 原状回復費の補足（必須）: 当社管理実績の2024年度の原状回復費用の平均として120,000円（千円以下切上げ）を計上。※詳細はサブリース契約の条件によります。
   - 入居者募集広告費の補足（必須）: 入居するサブリース会社との契約期間中は、費用の発生はありません。※サブリース契約の条件にもよります。
   - 賃貸管理手数料の補足（必須）: 家賃収入にふくまれています。※サブリース契約の条件にもよります。
   - 管理・修繕費の補足（必須）: ご提案日時点における建物管理費および修繕積立金の実績または見込の月額に基づいています。
   - 固都税の補足（必須）: 固定資産評価額に基づく年間税額の概算。正式な納付額は管轄自治体から通知される課税明細書で確定します。
   - 火災保険料の補足（必須）: 一般的な区分マンション向け火災保険の5年一括契約で、平米単価200円/5年を想定した概算。契約内容や補償範囲により変動します。
   - 地震保険料の補足（必須）: 一般的な区分マンション向け地震保険の5年一括契約で、平米単価年150円/5年を想定した概算。契約内容や補償範囲により変動します。
   - 設備費用の補足（必須）: 国土交通省のガイドラインに基づき、35年間で以下の金額の発生を想定し、5年ごとに均等発生として試算しています。設備の交換・修繕は原則オーナー様負担となります。経年劣化や故障時には、実費での対応が必要です。※詳細はサブリース契約の条件によります。
    ＜35年間の想定金額＞
    ・35㎡未満：237万円
    ・35㎡以上〜50㎡未満：263万円
    ・50㎡以上：441万円



### 確認事項
- [x] 管理プランの選択肢: `rental_contract`のenumで定義済み
- [x] 他社管理の場合: `manage_type`が`other`（'true'）の場合、`rental_contract`は必須ではない
- [x] 他社管理物件用の管理プラン設定手順: INSIGHT管理画面での設定手順を確認済み
- [ ] 他社管理物件の場合の`rental_contract`の扱い（仮で選択する必要があるか）
- [ ] アセプラによる管理プラン説明の標準化方法

---

## 5. 販売契約

### 論点
- My Pageで契約？
- サブスクの契約内容の事前送付必要では？

### 調査結果（verdandi）

#### マイページ契約の仕組み
- CustomerApi::V1::GenerateDocusignUrlsController (`verdandi/app/controllers/customer_api/v1/generate_docusign_urls_controller.rb`)
  - マイページからDocuSignのURLを生成するAPI
  - 認証コードによる認証が必要

#### DocuSignでの契約処理
- DocumentSign::Envelope (`verdandi/lib/document_sign/envelope.rb`)
  - DocuSignで契約書を送信する処理
  - `rental_contract`に応じて異なる管理プランの署名欄を追加
  - 重要: 管理委託契約書がセットで送信される仕様

#### 他社管理物件の場合（verdandi）
- Contractモデル: `manage_type`が`other`（'true'）の場合
  - `rental_contract`のバリデーションが不要（line 120-121）
  - バリデーション: `validates :rental_contract, presence: true, if: :our_manage?`
    - `our_manage?`は`!manage_type?`で判定（line 377-379）
    - つまり、`manage_type`が`other`（'true'）の場合、`rental_contract`は必須ではない

#### DocuSign処理での`rental_contract`の扱い（verdandi）
- DocumentSign::Envelope (`verdandi/lib/document_sign/envelope.rb`, line 286-315)
  - `case rental_contract`で分岐して署名欄を追加
  - 問題点: `rental_contract`がnilまたは該当しない値の場合、`else`節で全ての管理プランの署名欄を追加している（line 303-314）
    ```ruby
    else
      tabs[:dateSignedTabs].push(
        wide_plan_date_signed,
        collection_agency_date_signed,
        collection_agency_pro_date_signed,
        neo_income_date_signed,
        lease_contract_renosy_neo_income_date_signed,
        collection_agency_lease_date_signed,
        wide_lease_date_signed,
        lease_contract_neo_income_agency_guarantee_date_signed,
        collection_agency_pro_sublease_date_signed
      )
    end
    ```
  - 影響: 他社管理物件で`rental_contract`がnilの場合、DocuSignで全ての管理プランの署名欄が表示されてしまう

#### DocuSignでの管理委託契約書の扱い（verdandi）
- DocumentSignFile.hashes_for_envelope (`verdandi/app/models/document_sign_file.rb`, line 69-80)
  - 以下の書類が含まれる:
    - `changed_contract_file_hash(contract)` - 変更合意書
    - `presentation_of_important_info_hash(contract)` - 重要事項説明書
    - `contract_file_hash(contract)` - 売買契約書
    - `*rental_contract_hashes(contract)` - 管理委託契約書（複数）
    - `cooling_off_hash(contract)` - クーリングオフ
    - `personal_info_handling_hash(contract)` - 個人情報取扱い
    - `fee_sharing_agreement_hash(contract)` - 手数料分配契約
    - `receipt_hash(contract)` - 領収書

- rental_contract_hashesメソッド (`verdandi/app/models/document_sign_file.rb`, line 282-330)
  - `contract.rental_contract`に基づいて管理委託契約書を選択
  - 確認結果: `manage_type`による分岐処理は見当たらない
  - `rental_contract`がnilまたは該当しない値の場合、`all_rental_contract_file_hashes(contract)`が呼ばれ、全ての管理プランの書類が含まれる（line 328）
    ```ruby
    def rental_contract_hashes(contract)
      return all_rental_contract_file_hashes(contract) if contract.document_signed

      case contract.rental_contract
      when Contract.rental_contract.renosy_wide_plan
        [rental_contarct_presentation_of_important_info_wide_hash(contract), wide_plan_hash(contract)]
      # ... 他の管理プラン
      else
        all_rental_contract_file_hashes(contract)  # 全ての管理プランの書類が含まれる
      end
    end
    ```

- 結論: 
  - ✅ 確認済み: `manage_type`による管理委託契約書のスキップ処理は実装されていない
  - ⚠️ 問題点: 他社管理物件（`manage_type`が`other`）で`rental_contract`がnilの場合、全ての管理プランの書類がDocuSignに含まれる可能性がある
  - ⚠️ 対応が必要: 他社管理物件の場合、管理委託契約書をスキップする処理を追加する必要がある

#### Contractの`manage_type`が`other`（他社管理）の場合の後続処理への影響

バリデーション:
- Contractモデル (`repositories/backend/verdandi/app/models/contract.rb`, line 120-121)
  - `our_manage?`が`false`の場合、以下のバリデーションがスキップされる:
    - `management_start_date`（必須チェック）
    - `management_end_date`（必須チェック）
    - `rental_contract`（必須チェック）
  - つまり、他社管理物件の場合、これらの項目は入力不要

変更検知処理:
- changed_detailメソッド (`repositories/backend/verdandi/app/models/contract.rb`, line 485)
  - `rental_contract`と`manage_type`は変更履歴から除外されている
  - これらの項目の変更は通知対象外

DocuSign再アップロード処理:
- after_change_important_columnsメソッド (`repositories/backend/verdandi/app/models/contract.rb`, line 450)
  - `rental_contract`は変更検知から除外されている
  - `rental_contract`の変更によるDocuSign再アップロードは発生しない

その他の影響:
- REQUIRE_AUTO_REUPLOAD_COLUMNS (`repositories/backend/verdandi/app/models/contract.rb`, line 211-220)
  - `rental_contract`は自動再アップロード対象のカラムに含まれているが、他社管理物件の場合、`rental_contract`がnilでも問題ないため、実質的な影響は限定的

#### `rental_contract`のenum定義（verdandi）
- Enumerations::RentalContract (`verdandi/app/models/enumerations/rental_contract.rb`)
  - `sublease: 0` - サブリース（最初に定義されている）
  - その他11種類の管理プラン

#### 確認事項
- [x] DocuSign処理での`rental_contract`の扱い: `rental_contract`がnilの場合、全ての管理プランの署名欄が追加される（確認済み）
- [x] DocuSignでの管理委託契約書の扱い: `manage_type`によるスキップ処理は実装されていない。他社管理物件で`rental_contract`がnilの場合、全ての管理プランの書類が含まれる（確認済み）
- [ ] `rental_contract`がnilの場合のエラー可能性: 
  - ⚠️ 開発者所見（小松さん）: コードをざっくり見た感じ、賃貸契約がない状態で進めるのは不可能な気がします
  - ⚠️ 開発者所見（佐藤さん）: 契約のタイプから契約年数を計算するコードで、契約がない場合はエラーが出るような実装に見えます。想定していないのではないか
  - ⚠️ 要確認: `rental_contract`がnilの場合、契約年数の計算などでエラーが発生する可能性があるため、動作イメージ（何を入力して何を入力しないことにしたいのか）を明確にする必要がある
  - 確認者: 小松さん、赤間さん、川井さん（週明け）
- [ ] 他社管理物件の場合、`rental_contract`をnilにするか、`sublease`を選択するか - verdandi側で確認
- [ ] マイページ契約を使用しない場合（クラウドサイン使用）、DocuSign処理は実行されないか - verdandi側で確認

### 確認事項
- [x] マイページ契約の仕組み: DocuSignを使用
- [x] 管理委託契約書がセットで送信される仕様のため、他社管理物件ではマイページ契約が使用不可
- [ ] サブリース契約（マスターリース契約）の事前送付方法 - verdandi側で確認
- [ ] クラウドサインでの契約締結フロー - verdandi側で確認

---

## 6. 管理

### 論点
- Manageに連携しても良い？
- My PageとAppは何を提供するの？

### 調査結果（verdandi）

#### MANAGEシステム連携
- Contractモデル: `manage_type`で自社管理/他社管理を区別
  - `our: 'false'` - 自社管理
  - `other: 'true'` - 他社管理
- 判定メソッド: `our_manage?` - `!manage_type?`で判定

#### マイページ・APPでの表示
- Contractモデル: `MYPAGE_CONTRACT_STATUS`でマイページで表示する契約ステータスを定義（line 176-183）
  - `contract_preparation` - 契約準備中
  - `loan_preparation` - ローン準備中
  - `paid` - 決済済み
  - `cancel_apply` - 申込キャンセル
  - `cancel_contract` - 契約キャンセル
  - `Y` - ローン不可

### スプレッドシート記載の機能詳細

#### 閲覧・利用可能な機能（My Page & App）
- 物件概要（物件名や購入価格など物件自体の情報）
- 書類（電子契約した契約書は見れる）
- RAMのCSへの問い合わせ
- 新着販売物件など、資産管理以外の主なメニュー

#### 閲覧・利用不可な機能（My Page & App）
- 運用状況、管理契約など管理関連情報
- 売却相談
- 資産価値シミュレーション
- 確定申告

### 確認事項
- [x] MANAGEシステム連携: `manage_type`で他社管理として登録可能
- [ ] MANAGEシステムへの連携タイミング
- [ ] マイページ・APPでの他社管理物件の表示制御ロジック
- [ ] 閲覧・利用可の機能の実装箇所:
  - [ ] 物件概要の表示制御（`renosy_asset`）
  - [ ] 書類（電子契約書）の閲覧機能（`renosy_asset`）
  - [ ] RAMのCSへの問い合わせ機能（`renosy_asset`）
  - [ ] 新着販売物件の表示（`renosy_asset`）
- [ ] 閲覧・利用不可の機能の実装箇所:
  - [ ] 運用状況の非表示制御（`renosy_asset`）
  - [ ] 管理契約情報の非表示制御（`renosy_asset`）
  - [ ] 売却相談機能の非表示制御（`renosy_asset`）
  - [ ] 資産価値シミュレーション機能の非表示制御（`renosy_asset`）
  - [ ] 確定申告機能の非表示制御（`renosy_asset`）

---

## 調査で確認できたこと

### ✅ 確認済み
1. 他社管理のフラグ: `Contract.manage_type`と`Article.manage_type`で管理
2. 管理プランの選択肢: `rental_contract`のenumで定義済み
3. バリデーション: 自社管理の場合のみ`rental_contract`が必須
4. DocuSign処理: `rental_contract`に応じて署名欄を追加（nilの場合は全ての管理プランの署名欄が追加される）
5. マイページ契約: DocuSignを使用、管理委託契約書がセットで送信される
6. SUPPLIERからAGNTへの`manage_type`同期: SUPPLIERで`manage_type`を変更すると、AGNTの`Article`にも自動反映される
7. Contractの`manage_type`が`other`の場合の後続処理: バリデーション、変更検知、DocuSign再アップロード処理への影響を確認
8. DocuSignでの管理委託契約書の扱い: `manage_type`によるスキップ処理は実装されていない
9. 他社管理物件用の管理プラン設定: INSIGHT管理画面での設定手順を確認

### ❓ 要確認事項

#### verdandi（ユーザーが担当）
1. 物件発表のトリガー: SUPPLIERからの連携タイミング
2. SUPPLIERの管理形態（manage_type）の影響:
   - ✅ SUPPLIERからverdandiへの同期: SUPPLIERで`manage_type`が「他社」に設定されている場合、`Articles::Factory#article_attributes`で`manage_type: supplier_article.manage_type`としてAGNTの`Article`に設定される（確認済み）
   - ✅ ArticleとContractの`manage_type`の関係（両方ともverdandi）: 
     - `Contract`の`manage_type`が`other`（他社管理）の場合、`our_manage?`は`false`を返し、`management_start_date`、`management_end_date`、`rental_contract`のバリデーションがスキップされる（確認済み）
     - ⚠️ 要確認: `Article`から`Contract`を作成する際に`manage_type`が自動的に設定されるかは、コントローラーやサービスオブジェクトの実装を確認する必要がある
   - [ ] SUPPLIERでの設定方法: SUPPLIERシステムで`manage_type`を「他社」に設定する方法
   - ✅ データ同期タイミング: SUPPLIERで`manage_type`を変更して保存するだけで、`ArticlesController#update`で自動的に`release!`が呼ばれてAGNT側も更新される（確認済み）
3. 他社管理物件のrental_contract: 
   - 現状: バリデーション上はnilでも可
   - 問題: 
     - DocuSign処理でnilの場合、全ての管理プランの署名欄が追加される
     - ⚠️ エラー可能性: 開発者所見によると、契約のタイプから契約年数を計算するコードで、契約がない場合はエラーが出るような実装に見える。賃貸契約がない状態で進めるのは不可能な可能性がある
   - 対応案: 
     - 案1: `rental_contract`を`sublease`（0）に設定（仮の値として）
     - 案2: DocuSign処理を修正して、他社管理物件の場合は署名欄を追加しない
     - 案3: エラーが発生する場合は、オペレーションを変更する
   - 要確認: 
     - マイページ契約を使用しない場合（クラウドサイン使用）、DocuSign処理は実行されないか
     - `rental_contract`がnilの場合の動作イメージ（何を入力して何を入力しないことにしたいのか）を明確にする必要がある
     - 確認者: 小松さん、赤間さん、川井さん（週明け）
4. DocuSignでの管理委託契約書の扱い: 
   - ✅ 確認済み: `DocumentSignFile.hashes_for_envelope`の実装を確認
   - ✅ 確認済み: `manage_type`による管理委託契約書のスキップ処理は実装されていない
   - ⚠️ 問題点: 他社管理物件（`manage_type`が`other`）で`rental_contract`がnilの場合、`rental_contract_hashes`メソッドの`else`節で`all_rental_contract_file_hashes(contract)`が呼ばれ、全ての管理プランの書類がDocuSignに含まれる可能性がある
   - ⚠️ 対応が必要: 他社管理物件の場合、管理委託契約書をスキップする処理を追加する必要がある
5. サブリース契約の事前送付: マスターリース契約の送付方法 - verdandi側で確認

#### agnt_rda（要実施）
1. INSIGHTでの表示: 事業計画書の生成ロジックと表示条件
2. INSIGHT管理画面での設定:
   - 他社管理物件の場合、どの管理プランを選択するか（`for_sublease`フラグの扱い）
   - 「管理会社：他社管理」の選択肢があるか
   - 事業者事務手数料を0円に設定する方法
3. 管理プランの選択ロジック: 物件情報から管理プランを決定する方法
4. 他社管理物件用の管理プラン設定: 
   - ✅ 確認済み: 管理プラン設定手順を確認（詳細は「4. 販売」セクション参照）
   - ✅ 確認済み: シミュレーション補足が全項目入力必須であることを確認
   - ✅ 確認済み: 管理プランが「active」になる条件（関東用・関西用の両方の設定、`simulation_appendix`と`kanri_plan_fees`が必要）

#### renosy_asset（要実施）
1. マイページ・APPの表示制御: 他社管理物件の場合の機能制限の実装箇所
2. 契約書の閲覧: 電子契約書の閲覧機能
3. 閲覧・利用可の機能の実装確認:
   - 物件概要の表示制御
   - 書類（電子契約書）の閲覧機能
   - RAMのCSへの問い合わせ機能
   - 新着販売物件の表示
4. 閲覧・利用不可の機能の実装確認:
   - 運用状況の非表示制御
   - 管理契約情報の非表示制御
   - 売却相談機能の非表示制御
   - 資産価値シミュレーション機能の非表示制御
   - 確定申告機能の非表示制御

#### tech_after（要実施）
1. MANAGEシステム連携: 連携タイミングと処理フロー
2. 他社管理物件の登録: 登録方法とデータ構造

---

## 次のステップ

1. verdandiの詳細調査（ユーザーが担当）
   - ✅ SUPPLIERからAGNTへの`manage_type`同期: 確認済み（`Articles::Factory#article_attributes`で自動設定）
   - ✅ Contractの`manage_type`が`other`の場合の後続処理: 確認済み（バリデーション、変更検知、DocuSign再アップロード処理への影響）
   - ✅ DocuSignでの管理委託契約書の扱い: 確認済み（`manage_type`によるスキップ処理は実装されていない）
   - ⚠️ `rental_contract`がnilの場合のエラー可能性: 開発者所見あり（契約年数の計算などでエラーが発生する可能性）
   - [ ] 物件発表のトリガー（SUPPLIERからの連携タイミング）
   - [ ] 緊急: 他社管理物件のrental_contractの扱い（仮で選択する必要があるか、nilでエラーが出るか）
   - [ ] 緊急: `rental_contract`がnilの場合の動作イメージを明確化（何を入力して何を入力しないことにしたいのか）
   - [ ] DocuSign処理での他社管理物件の対応方法（管理委託契約書のスキップ処理の追加）
   - [ ] マイページ契約APIでの他社管理物件の処理
   - [ ] `Article`から`Contract`を作成する際に`manage_type`が自動的に設定されるかの確認

2. agnt_rdaの詳細調査（要実施）
   - ✅ 他社管理物件用の管理プラン設定: 確認済み（設定手順、シミュレーション補足の全項目入力必須、管理プランが「active」になる条件）
   - [ ] INSIGHTでの事業計画書表示条件
   - [ ] 物件情報の表示ロジック
   - [ ] 他社管理物件の場合、どの管理プランを選択するか（`for_sublease`フラグの扱い）
   - [ ] 「管理会社：他社管理」の選択肢があるか
   - [ ] 事業者事務手数料を0円に設定する方法
   - [ ] 管理プランの選択ロジック（物件情報から管理プランを決定する方法）

3. renosy_assetの調査（要実施）
   - マイページ・APPでの他社管理物件の表示制御
   - 閲覧・利用可の機能の実装確認:
     - 物件概要の表示制御
     - 書類（電子契約書）の閲覧機能
     - RAMのCSへの問い合わせ機能
     - 新着販売物件の表示
   - 閲覧・利用不可の機能の実装確認:
     - 運用状況の非表示制御
     - 管理契約情報の非表示制御
     - 売却相談機能の非表示制御
     - 資産価値シミュレーション機能の非表示制御
     - 確定申告機能の非表示制御

4. tech_afterの調査（要実施）
   - ✅ MANAGEシステム連携: `manage_type`で他社管理として登録可能（確認済み）
   - [ ] MANAGEシステムへの連携処理
   - [ ] 他社管理物件の登録方法
   - [ ] 連携タイミング

---

## 参考コード

### verdandi（販売管理システム）

#### Contractモデル
- `repositories/backend/verdandi/app/models/contract.rb` - 契約モデル
- `repositories/backend/verdandi/app/models/enumerations/rental_contract.rb` - 管理プランのenum定義

#### Articleモデル
- `repositories/backend/verdandi/app/models/article.rb` - 物件モデル
- `repositories/backend/verdandi/app/models/supplier/article.rb` - SUPPLIER API連携用のArticleモデル

#### SUPPLIER連携
- `repositories/backend/verdandi/app/models/supplier/article.rb` - SUPPLIERから取得する物件データ（`manage_type`属性を含む）

#### DocuSign処理
- `repositories/backend/verdandi/lib/document_sign/envelope.rb` - DocuSignエンベロープ処理

#### マイページAPI
- `repositories/backend/verdandi/app/controllers/customer_api/v1/generate_docusign_urls_controller.rb` - DocuSign URL生成API

### agnt_rda（物件提案システム・INSIGHT）

#### 事業計画書
- `repositories/backend/agnt_rda/app/views/pdf/business_plan.html.erb` - 事業計画書テンプレート
- `repositories/backend/agnt_rda/app/assets/stylesheets/pdf/business_plan.scss` - スタイル

#### INSIGHT管理画面
- `repositories/backend/agnt_rda/app/controllers/developer/kanri_plans_controller.rb` - 管理プラン管理
- `repositories/backend/agnt_rda/app/controllers/developer/kanri_plan_settings_controller.rb` - 管理プラン設定管理
- `repositories/backend/agnt_rda/app/controllers/developer/administration_fees_controller.rb` - 事業者事務手数料管理
- `repositories/backend/agnt_rda/app/models/kanri_plan.rb` - 管理プランモデル
- `repositories/backend/agnt_rda/app/models/kanri_plan_setting.rb` - 管理プラン設定モデル
- `repositories/backend/agnt_rda/app/views/developer/dashboards/index.html.erb` - 管理画面トップ

---

## 更新履歴

| 日付 | バージョン | 更新内容 | 更新者 |
|------|-----------|---------|--------|
| 2026-01-09 | v1.0 | 初版作成 | 佐藤達也 |
| 2026-01-09 | v1.1 | 他社管理物件の`rental_contract`の扱いについて詳細調査結果を追加 | 佐藤達也 |
| 2026-01-09 | v1.2 | INSIGHT管理画面で設定可能な項目を追加（管理プラン、事業者事務手数料など） | 佐藤達也 |
| 2026-01-09 | v1.3 | スプレッドシートの論点を再確認し、My Page & Appの機能詳細（閲覧・利用可/不可）を追加 | 佐藤達也 |
| 2026-01-09 | v1.4 | SUPPLIERの管理形態（manage_type）が「他社」の場合の影響を追加調査 | 佐藤達也 |
| 2026-01-09 | v1.5 | SUPPLIERからverdandiへの`manage_type`同期処理を追加調査。自動同期処理は見つからず、手動設定の可能性が高いことを確認 | 佐藤達也 |
| 2026-01-09 | v1.6 | verdandi（AGNT）がSUPPLIERからArticleを取得するバッチ処理を調査。バッチ処理は見つからず、手動作成または別の方法で同期されている可能性が高いことを確認 | 佐藤達也 |
| 2026-01-09 | v1.7 | SUPPLIERからAGNTへの物件連携方法を追加調査。`Connectors::TechConsul#release_article`でAGNTのAPIを呼び出す方式であることを確認 | 佐藤達也 |
| 2026-01-09 | v1.8 | `Articles::Factory#article_attributes`で`manage_type`がSUPPLIERからAGNTに自動同期されることを確認 | 佐藤達也 |
| 2026-01-09 | v1.9 | 既存レコードの`manage_type`を「他社」に更新する方法を確認。SUPPLIER側で変更して保存するだけで、AGNT側も自動更新されることを確認 | 佐藤達也 |
| 2026-01-09 | v2.0 | 管理プランがシミュレーション設定に表示される条件を確認。関東用・関西用の両方の設定と、それぞれに`simulation_appendix`と`kanri_plan_fees`が必要であることを確認 | 佐藤達也 |
| 2026-01-09 | v2.1 | 他社管理物件用の管理プラン設定手順を追加。シミュレーション補足が全項目入力必須であることを確認 | 佐藤達也 |
| 2026-01-09 | v2.2 | 他社管理物件用の管理プラン設定手順に、具体的なシミュレーション補足の内容を追加 | 佐藤達也 |
| 2026-01-09 | v2.3 | Contractの`manage_type`が`other`（他社管理）の場合の後続処理への影響を調査。バリデーション、変更検知、DocuSign再アップロード処理への影響を確認 | 佐藤達也 |
| 2026-01-09 | v2.4 | DocuSignでの管理委託契約書の扱いを調査。`manage_type`によるスキップ処理は見当たらないことを確認。`DocumentSignFile.hashes_for_envelope`の実装確認が必要 | 佐藤達也 |
| 2026-01-09 | v2.5 | `DocumentSignFile.hashes_for_envelope`の実装を確認。`manage_type`による管理委託契約書のスキップ処理は実装されていないことを確認。他社管理物件で`rental_contract`がnilの場合、全ての管理プランの書類が含まれる問題を確認 | 佐藤達也 |
| 2026-01-09 | v2.6 | 「SUPPLIERの管理形態（manage_type）の影響」セクションを「仕入れ契約」から「発表」セクションに移動。確認済み事項を反映して「次のステップ」セクションを最新化 | 佐藤達也 |
| 2026-01-09 | v2.7 | 調査対象にsupplier-article、renosy_asset、tech_afterを追加 | 佐藤達也 |
| 2026-01-09 | v2.8 | 調査概要を更新。スプレッドシートの論点と整合性を取るため、調査した論点と調査対象システムを明記 | 佐藤達也 |
| 2026-01-09 | v2.9 | Slack会話内容を反映。`rental_contract`がnilの場合のエラー可能性について開発者所見を追加。緊急確認事項として明記 | 佐藤達也 |
| 2026-01-09 | v3.0 | 管理プラン設定手順を更新。2つの管理プラン（ライブズナビ用・明和住販流通センター用）を作成する必要があることを明記。原状回復費請求の設定が異なることを追加。シミュレーション補足の内容を更新 | 佐藤達也 |
| 2026-01-09 | v3.1 | 設備費用請求の設定を修正。ライブズナビは`false`、明和住販流通センターは`true`に更新 | 佐藤達也 |
| 2026-01-09 | v3.2 | 管理プラン設定を更新。2つの管理プランではなく1つの管理プランで良いことを確認。原状回復費請求・設備費用請求は両社とも`true`。シミュレーション補足の内容を更新（原状回復費・設備費用の補足を更新） | 佐藤達也 |
