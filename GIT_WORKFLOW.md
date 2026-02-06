# Gitワークフロー説明

## 📍 現在の設定

### メインリポジトリ
- **パス**: `/Users/t_sato2/product_planning_ai_pdm/`
- **リモート**: `origin` → `git@github.com:ga-tech/product_planning_ai_pdm.git`
- **用途**: 共有プロジェクト、リモートにプッシュ可能

### Privateリポジトリ
- **パス**: `/Users/t_sato2/product_planning_ai_pdm/private/`
- **リモート**: `private-origin` → **利用者の個人GitHubリポジトリに自動設定**
  - リモートURL: `git@github.com:<利用者のユーザー名>/product_planning_ai_pdm-private.git`
  - ユーザー名は自動検出（メインリポジトリのorigin、git config、emailから推測）
- **用途**: プライベート・社内限定プロジェクト、機密情報を含むプロジェクト

---

## 🔄 「コミットプッシュして」と言った場合の動作

### ケース1: メインリポジトリで作業している場合

```bash
cd /Users/t_sato2/product_planning_ai_pdm
git add .
git commit -m "変更内容"
git push
```

**結果**: `git@github.com:ga-tech/product_planning_ai_pdm.git` にプッシュされます ✅

### ケース2: Privateディレクトリで作業している場合

```bash
cd /Users/t_sato2/product_planning_ai_pdm/private
git add .
git commit -m "変更内容"
git push private-origin main
```

**結果**: 利用者の個人GitHubリポジトリ（`git@github.com:<利用者のユーザー名>/product_planning_ai_pdm-private.git`）にプッシュされます ✅

---

## 💡 推奨ワークフロー

### メインリポジトリの変更をプッシュする場合

```bash
# メインリポジトリに移動
cd /Users/t_sato2/product_planning_ai_pdm

# 変更をコミット・プッシュ
git add .
git commit -m "変更内容"
git push origin main
```

### Privateリポジトリの変更をプッシュする場合

```bash
# Privateディレクトリに移動
cd /Users/t_sato2/product_planning_ai_pdm/private

# 変更をコミット・プッシュ
git add .
git commit -m "変更内容"
git push private-origin main
```

---

## 🎯 明確に指定する方法

### メインリポジトリをプッシュしたい場合

```bash
cd /Users/t_sato2/product_planning_ai_pdm && git push origin main
```

### Privateリポジトリをプッシュしたい場合

```bash
cd /Users/t_sato2/product_planning_ai_pdm/private && git push private-origin main
```

**注意**: 
- Privateリポジトリは `private-origin` という名前でリモートが設定されます
- **初回実行時**: スクリプトが自動的に利用者の個人GitHubリポジトリを設定します
- **リモートが既に存在する場合**: 既存のリモート設定が使用されます

---

## 📝 まとめ

- **メインリポジトリ**: `origin` → 共有リポジトリ（例: `git@github.com:ga-tech/product_planning_ai_pdm.git`）
- **Privateリポジトリ**: `private-origin` → **利用者の個人GitHubリポジトリ**（自動設定）
  - リモートURL: `git@github.com:<利用者のユーザー名>/product_planning_ai_pdm-private.git`
  - 初回実行時に自動的にリモートが設定されます

## 🎯 使い分けのルール

### メインリポジトリにプッシュすべきファイル
- `docs/` - 公開ドキュメント
- `scripts/` - 共有スクリプト
- `development/` - 公開可能な開発プロジェクト
- `stock/` - 確定版ドキュメント（公開可能なもの）
- `.agent/` - AIエージェント設定
- `README.md`、`CHANGELOG.md` など

### Privateリポジトリにプッシュすべきファイル
- `private/projects/` - ビジネスプロジェクト（PMBOK準拠）
- `private/1on1_feedback/` - 1on1フィードバック記録
- `private/personal_notes/` - 個人メモ
- `private/confidential/` - 機密情報

### 自動判定方法
現在の作業ディレクトリを確認：
- ワークスペースルート配下 → メインリポジトリ
- `private/` 配下 → Privateリポジトリ

「コミットプッシュして」と言った場合、**現在の作業ディレクトリ**によって動作が変わります。

### 初回セットアップ（プライベートリポジトリ）

プライベートリポジトリを初めて使用する場合：

1. **GitHubでプライベートリポジトリを作成**
   ```bash
   # GitHubで以下の名前のプライベートリポジトリを作成
   # <your-username>/product_planning_ai_pdm-private
   ```

2. **スクリプトを実行**
   ```bash
   bash scripts/git_push_helper.sh
   ```
   - スクリプトが自動的にユーザー名を検出してリモートを設定します
   - ユーザー名の検出方法:
     - メインリポジトリのorigin URLから抽出
     - git config user.emailから推測（@の前の部分）
     - git config user.nameを使用

3. **手動でリモートを設定する場合（オプション）**
   ```bash
   cd private
   git remote add private-origin git@github.com:<your-username>/product_planning_ai_pdm-private.git
   ```

---

## 🛠️ ヘルパースクリプトの使用（汎用版）

自動的にリポジトリを判定してプッシュするヘルパースクリプトを使用できます：

```bash
# どこからでも実行可能（自動判定・汎用版）
bash scripts/git_push_helper.sh
```

**動作**:
1. 現在のディレクトリからgitリポジトリのルートを自動検出
2. `private/`ディレクトリが独立したgitリポジトリかチェック
3. 現在のディレクトリが`private/`内かどうかで判定
4. **プライベートリポジトリの場合、利用者の個人GitHubリポジトリを自動設定**
   - メインリポジトリのoriginからユーザー名を取得
   - 取得できない場合は、git config user.emailから推測
   - それでも取得できない場合は、git config user.nameを使用
5. リモート名とブランチ名を自動検出
6. 変更内容を表示
7. コミットメッセージを入力
8. 自動的に適切なリモートにプッシュ

**特徴**:
- ✅ **汎用性**: どのワークスペースでも使用可能（パスをハードコードしていない）
- ✅ **自動判定**: 現在のディレクトリから自動的にリポジトリタイプを判定
- ✅ **柔軟性**: リモート名やブランチ名を自動検出（カスタマイズ可能）

**例**:
```bash
# メインリポジトリのファイルを編集した場合
cd /path/to/workspace/docs
bash ../scripts/git_push_helper.sh
# → メインリポジトリにプッシュ

# プライベートリポジトリのファイルを編集した場合
cd /path/to/workspace/private/projects/...
bash ../../scripts/git_push_helper.sh
# → プライベートリポジトリにプッシュ

# サブディレクトリからでも実行可能
cd /path/to/workspace/private/projects/火災保険/.../documents/2_planning
bash ../../../../../../scripts/git_push_helper.sh
# → プライベートリポジトリにプッシュ
```

---

## ⚠️ 注意事項

### 誤ってプッシュしてしまった場合

**メインリポジトリにプライベートファイルをプッシュしてしまった場合**:
```bash
# コミットを取り消す
git revert <commit-hash>
git push origin main
```

**プライベートリポジトリに公開ファイルをプッシュしてしまった場合**:
```bash
cd private
git revert <commit-hash>
git push private-origin main
```

### ファイルの配置を間違えた場合

`.gitignore`で`private/**`が除外されているため、通常はメインリポジトリにプライベートファイルが含まれることはありません。ただし、`git add -f`で強制追加した場合は注意が必要です。
