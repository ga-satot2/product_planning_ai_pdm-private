# Gitワークフロー説明

## 📍 現在の設定

### メインリポジトリ
- **パス**: `/Users/t_sato2/product_planning_ai_pdm/`
- **リモート**: `origin` → `git@github.com:ga-tech/product_planning_ai_pdm.git`
- **用途**: 共有プロジェクト、リモートにプッシュ可能

### Privateリポジトリ
- **パス**: `/Users/t_sato2/product_planning_ai_pdm/private/`
- **リモート**: 未設定（ローカルのみ）
- **用途**: 個人プロジェクト、リモートにプッシュしない

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
git push
```

**結果**: エラーになります ❌
```
fatal: no upstream branch
fatal: The current branch main has no upstream branch.
```

**理由**: Privateリポジトリにはリモートが設定されていないため、プッシュできません。

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

### Privateリポジトリの変更を管理する場合

```bash
# Privateディレクトリに移動
cd /Users/t_sato2/product_planning_ai_pdm/private

# ローカルのみでコミット（プッシュは不要）
git add .
git commit -m "変更内容"

# プッシュはしない（リモートが設定されていないため）
```

---

## 🎯 明確に指定する方法

### メインリポジトリをプッシュしたい場合

```bash
cd /Users/t_sato2/product_planning_ai_pdm && git push origin main
```

### Privateリポジトリをプッシュしたい場合（将来的にリモートを設定した場合）

```bash
cd /Users/t_sato2/product_planning_ai_pdm/private && git push origin main
```

**注意**: Privateリポジトリにリモートを設定する場合は、プライベートリポジトリ（例: GitHub Private Repo）を使用してください。

---

## 📝 まとめ

- **メインリポジトリ**: リモートにプッシュ可能（共有用）
- **Privateリポジトリ**: ローカルのみ（個人用、リモート未設定）

「コミットプッシュして」と言った場合、**現在の作業ディレクトリ**によって動作が変わります。
メインリポジトリにいる場合は共有リポジトリにプッシュされ、Privateディレクトリにいる場合はプッシュできません。
