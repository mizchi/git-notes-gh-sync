# git-notes-gh-sync (gng)

**⚠️ WIP: This is an experimental repository**

GitHub Issues/PRs を git notes として同期する CLI ツール。

## インストール

### 必要な環境

- [Deno](https://deno.land/) (v1.40以上)
- [GitHub CLI (gh)](https://cli.github.com/) (認証済み)
- Git リポジトリ

### グローバルインストール（推奨）

```bash
# リポジトリから直接インストール
git clone https://github.com/mizchi/git-notes-gh-sync.git
cd git-notes-gh-sync
deno install -Afg --name gng main.ts

# インストール後はどこからでも使用可能
gng help
```

### ローカル実行（インストールなし）

```bash
# リポジトリをクローン
git clone https://github.com/mizchi/git-notes-gh-sync.git
cd git-notes-gh-sync

# 直接実行
deno run -A main.ts help
```

## 使い方

### 基本的なコマンド

```bash
# ヘルプを表示
gng help

# すべての PR と Issue を同期
gng sync

# 特定の PR を同期
gng sync-pr --pr 123

# 特定の Issue を特定のコミットに同期
gng sync-issue --issue 456 --commit abc1234

# 最近のコミットから関連する Issue を同期
gng sync-recent --since HEAD~20

# ドライラン（実際には書き込まない）
gng sync --dry-run
```

### CLI オプション

| オプション | 説明 | 使用可能なコマンド |
|-----------|------|------------------|
| `--dry-run` | 実際の書き込みを行わずに実行内容を表示 | すべて |
| `--pr <number>` | PR 番号 | sync-pr |
| `--issue <number>` | Issue 番号 | sync-issue |
| `--commit <sha>` | コミット SHA | sync-issue |
| `--since <ref>` | 同期開始位置の Git 参照（デフォルト: HEAD~10） | sync-recent |
| `--help, -h` | ヘルプを表示 | すべて |

## git notes の確認方法

### 基本的な確認コマンド

```bash
# すべての notes をリスト（形式: <note-object> <commit>）
git notes --ref=github/issues list
git notes --ref=github/pulls list

# 特定のコミットの notes を確認
git notes --ref=github/issues show HEAD
git notes --ref=github/pulls show HEAD

# JSON を整形して表示
git notes --ref=github/issues show HEAD | jq '.'
```

### 実用的な例

```bash
# コミットログと一緒に確認
git log --oneline -5
# 出力例: bfbc3a5 Test issue references

# そのコミットの Issue 情報を確認
git notes --ref=github/issues show bfbc3a5
```

### サンプル表示スクリプト

同梱の表示スクリプトを使うと、notes を見やすく表示できます：

```bash
# 基本的な表示
deno run -A examples/example-usage.ts

# 詳細表示（最新5コミットの詳細情報）
deno run -A examples/example-usage.ts --detail
```

## 概要

このツールは、GitHub の Issues や Pull Requests の情報を git notes として保存し、コミットに紐づけて管理します。

### メリット

- コミットに GitHub のコンテキストを追加
- オフラインでも Issue/PR の情報を確認可能
- リポジトリ内で完結する情報管理

### 使用される git notes の namespace

- `refs/notes/github/issues` - Issue 情報
- `refs/notes/github/pulls` - Pull Request 情報

### 保存される情報

Issue/PR の以下の情報が JSON 形式で保存されます：

- 番号、タイトル、本文
- 状態（open/closed）
- 作成者、作成日時、更新日時
- URL
- PR の場合は追加でマージ情報

## 動作の仕組み

1. **Issue 参照の自動検出**
   - コミットメッセージから `#123` 形式の参照を検出
   - `fixes #123`, `closes #123`, `resolves #123` などのキーワードも認識

2. **PR の同期**
   - PR に含まれるすべてのコミットに PR 情報を付与
   - マージコミットにも情報を追加

3. **データの永続化**
   - git notes として保存されるため、リポジトリと一緒に管理
   - 将来的には push/fetch での共有も可能

## 開発者向け情報

### ディレクトリ構成

```
git-notes-gh-sync/
├── main.ts              # CLI エントリーポイント（parseArgs 使用）
├── lib/
│   ├── git.ts          # Git 操作のラッパー
│   ├── github.ts       # GitHub API クライアント（gh CLI 使用）
│   └── sync.ts         # 同期ロジック
├── examples/
│   └── example-usage.ts # notes 表示のサンプル（dax 使用）
├── deno.json           # Deno 設定ファイル
└── README.md           # このファイル
```

### 開発用コマンド

```bash
# タスクランナー経由での実行
deno task sync [command] [options]

# 開発モード（ファイル変更を監視）
deno task dev

# コードフォーマット
deno task fmt

# リント
deno task lint

# テスト
deno task test
```

### アーキテクチャ

1. **CLI (main.ts)**
   - `node:util` の `parseArgs` を使用したコマンドライン解析
   - コマンドベースの構造

2. **Git 操作 (lib/git.ts)**
   - git notes の CRUD 操作
   - コミット履歴の取得

3. **GitHub 連携 (lib/github.ts)**  
   - gh CLI を使用した API アクセス
   - Issue/PR データの取得

4. **同期エンジン (lib/sync.ts)**
   - Issue 参照パターンの検出
   - notes への変換と保存

## 今後の予定

- [ ] JSR (JavaScript Registry) へのリリース
- [ ] git notes の push/fetch 対応
- [ ] レビューコメントの同期
- [ ] Issue/PR のコメント同期
- [ ] 双方向同期（git notes から GitHub への反映）
- [ ] 設定ファイルのサポート

## License

MIT