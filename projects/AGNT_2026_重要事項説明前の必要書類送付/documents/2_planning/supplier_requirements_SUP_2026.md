# SUP 2026 サブクラ 2026年やること

**出典**: [Confluence - SUP 2026 サブクラ 2026年やること](https://ga-tech.atlassian.net/wiki/spaces/SUPPLIER/pages/5218926729/SUP+2026+2026)

**ページID**: 5218926729  
**作成日**: 2025-12-10  
**最終更新**: 2025-12-10

---

## やることの詳細

### 1. 重説1ページの説明に対する署名の欄を削除

赤枠の内容を削除する

![](blob:https://media.staging.atl-paas.net/?type=file&localId=a5de42cc-0cb4-4fb8-ab04-b1fdaace88ab&id=0f5c25a2-afe2-49f5-bf53-7c1c935b81a6&&collection=contentId-5218926729&height=638&occurrenceKey=null&width=452&__contextId=null&__displayType=null&__external=false&__fileMimeType=null&__fileName=null&__fileSize=null&__mediaTraceId=null&url=null)
‌

### 2. 書類作成画面にサブリース賃契の要点項目の追加

#### 2.1 契約書作成ページの"重説17ページ目"に "サブリース契約書の事前交付の要否"を追加

![](blob:https://media.staging.atl-paas.net/?type=file&localId=7250547a-8471-471d-84ac-23e795965a89&id=ec326171-0893-4d0c-9753-6a34b66cf6eb&&collection=contentId-5218926729&height=897&occurrenceKey=null&width=917&__contextId=null&__displayType=null&__external=false&__fileMimeType=null&__fileName=null&__fileSize=null&__mediaTraceId=null&url=null)

* 賃料の額
    * 参照できるか確認中
    
* サブリース会社の名称
    * 現況が"サブリース中"のときに表示される "サブリース会社"を入れる
    

#### 2.2 PDFへの反映方法

* 現況がサブリース中のとき
    * ページ3の備考に `「VII その他の説明事項」を参照。` を追加
        * ![](blob:https://media.staging.atl-paas.net/?type=file&localId=71a91bc3-2c5b-4e55-8790-ec61976f9dfe&id=2c364985-6def-497e-8816-08e9d8a1b070&&collection=contentId-5218926729&height=147&occurrenceKey=null&width=694&__contextId=null&__displayType=null&__external=false&__fileMimeType=null&__fileName=null&__fileSize=null&__mediaTraceId=null&url=null)
        
    * ページ17,18,19が追加される
        * 16ページ目：VI その他
        * 17ページ目：新規1
        * 18ページ目：新規2
        * 19ページ目：新規3
        * 20ページ目：白紙
        
    
* 現況がサブリース中以外のとき
    * 変化なし（本PJ対応前と同じ重説が出力される）
        * 16ページ目：VI その他
        * 17ページ目：白紙
        

#### 重説への追加する内容

![](blob:https://media.staging.atl-paas.net/?type=file&localId=c8bf7f36-97ca-4cf6-a051-eff4b42a5f93&id=300e5a32-3ce6-41c1-bebf-371b723fc45e&&collection=contentId-5218926729&height=null&occurrenceKey=null&width=null&__contextId=null&__displayType=null&__external=false&__fileMimeType=null&__fileName=null&__fileSize=null&__mediaTraceId=null&url=null)

※ PDFの先頭のタイトルの番号が適切ではありません。正しくは`VII その他の説明事項`　6じゃなくて7です。

‌

### 3. 契約書作成進捗編集画面に"サブリース9項目対応"の追加

![](blob:https://media.staging.atl-paas.net/?type=file&localId=75af7511-869d-4a6b-805d-64974cad1629&id=26c7e5c1-fb86-4d66-b909-ac0554d370b1&&collection=contentId-5218926729&height=497&occurrenceKey=null&width=1108&__contextId=null&__displayType=null&__external=false&__fileMimeType=null&__fileName=null&__fileSize=null&__mediaTraceId=null&url=null)

* 現況が"サブリース中"の場合
    * デフォルトが"未対応"
    * 選択肢
        * 未対応
        * 対応済
        
* 現況が"サブリース中"以外の場合
    * 「対応不要」としてdisableにしてグレーアウト
    
* バリデーション
    * "対応済"で保存した際に、重説の9項目全てが埋まっていなかったらエラーとする
    
重説のサブリース9項目を全て埋めてください。

‌

### 4. 発表管理画面の検索結果一覧に項目追加

![](blob:https://media.staging.atl-paas.net/?type=file&localId=838dc029-2f0a-4fb4-a16c-c1c18da57b93&id=bf47b182-d998-4e8c-8f46-aa6ae193a72f&&collection=contentId-5218926729&height=572&occurrenceKey=null&width=1414&__contextId=null&__displayType=null&__external=false&__fileMimeType=null&__fileName=null&__fileSize=null&__mediaTraceId=null&url=null)

* サブリース9項目対応
    * 現況が"サブリース中"の場合は、契約書作成進捗ページのサブリース9項目の値を表示
    * 現況が"サブリース中"以外の場合は、"対応不要"を表示
    
* 不備書類に"事前交付用サブリース契約書" を追加
    * 現況が"サブリース中"の場合に、"事前交付用サブリース契約書" が空なら、"事前交付用サブリース契約書" を不備書類とする
    * 現況が"サブリース中"ではない場合、"事前交付用サブリース契約書" が格納されていれば、"事前交付用サブリース契約書" を不備書類とする
    

### 5. 書類連携時のバリデーション追加

![](blob:https://media.staging.atl-paas.net/?type=file&localId=1b300d1b-ebb0-47c7-8b21-86fa750a56f4&id=fce350ae-6d4e-46c5-9cde-cef45fcb766b&&collection=contentId-5218926729&height=110&occurrenceKey=null&width=481&__contextId=null&__displayType=null&__external=false&__fileMimeType=null&__fileName=null&__fileSize=null&__mediaTraceId=null&url=null)

"契約準備完了" にして保存（AGNT書類連携）時にバリデーション追加

#### 5.1 サブリースの場合は、対応が完了していることを確認する

* if `現況が"サブリース中"` && `契約書作成進捗画面のサリース9項目対応が"対応済"` &&  `"事前交付用サブリース契約書" に書類が格納されている`
    * OK：通常通り保存処理
    

* `重説の9項目が埋まっていること`は契約書作成進捗画面で"対応済"するときに確認すれば、このタイミングで確認しなくても良いかなと思って入れなかった。（入れてもいいけど）

* else
    * NG：内容保存はされるがステータスは変更されない（AGNT連携をさせない）
    * エラーメッセージ
    
サブリース対応が完了していないため、契約準備完了にできません。  
以下を確認してください。

* 契約書作成進捗画面の9項目対応が"対応済"になっていること
* ファイルチェック画面の"事前交付用サブリース契約書" に書類が格納されていること

#### 5.2 サブリースではない場合は、書類が格納されていないことを確認する

* if `現況が"サブリース中"ではない` && `"事前交付用サブリース契約書" に書類が格納されていない`
    * OK：通常通り保存処理
    
* else
    * NG：内容保存はされるがステータスは変更されない（AGNT連携をさせない）
    * エラーメッセージ
    
非サブリース物件ですが、ファイルチェック画面に"事前交付用サブリース契約書" に書類が格納されています。"事前交付用サブリース契約書" を空にしてください。

‌

### 6.物件公開ステータスを"公開可能"にする際のバリデーション追加

* if `現況が"サブリース中"` 
    * if `契約書作成進捗画面のサリース9項目対応が"対応済"` &&  `"事前交付用サブリース契約書" に書類が格納されている`
        * OK
        
    * else
        * NG：保存失敗
        
    

サブリース対応が完了していないため、物件公開ステータスを"公開可能"にできません。  
以下を確認してください。

* 契約書作成進捗画面の9項目対応が"対応済"になっていること
* ファイルチェック画面の"事前交付用サブリース契約書" に書類が格納されていること

‌

### 6. API開発

#### 6.1 "事前交付用サブリース契約書" をAGNTが取得できるようにする

#### 6.2 重説の9項目の情報をAGNTが取得できるようにする

※ AGNTは現況を確認し、"サブリース中"の場合にのみ参照するイメージ

‌

‌


