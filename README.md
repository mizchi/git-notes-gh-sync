# git-notes-gh-sync

**⚠️ WIP: This is an experimental repository**

GitHub Issues/PRs を git notes として同期する実験的なツール。

## 概要

このツールは、GitHub の Issues や Pull Requests の情報を git notes として保存し、コミットに紐づけて管理することを目的としています。

git notes を使用することで：
- コミットに追加のメタデータを付与
- GitHub の情報をローカルリポジトリで参照可能に
- オフラインでも Issue/PR の情報を確認

## 使用される git notes の namespace

- `refs/notes/github/issues` - Issue 情報
- `refs/notes/github/pulls` - Pull Request 情報

## インストール

Deno がインストールされている必要があります。

```bash
git clone https://github.com/mizchi/git-notes-gh-sync.git
cd git-notes-gh-sync
```

## 使い方

```bash
# すべての PR と Issue を同期
deno task sync

# 特定の PR を同期
deno task sync sync-pr 123

# 特定の Issue を特定のコミットに同期
deno task sync sync-issue 456 abc1234

# 最近のコミットから関連する Issue を同期
deno task sync sync-recent HEAD~20

# ドライラン（実際には書き込まない）
deno task sync --dry-run
```

## git notes の確認方法

```bash
# Issue の notes を確認
git notes --ref=github/issues show <commit>

# PR の notes を確認
git notes --ref=github/pulls show <commit>

# すべての notes をリスト
git notes --ref=github/issues list
git notes --ref=github/pulls list
```

## 開発

```bash
# 開発モード（ファイル変更を監視）
deno task dev

# フォーマット
deno task fmt

# リント
deno task lint

# テスト
deno task test
```

## 今後の予定

- [ ] git notes の push/fetch 対応
- [ ] レビューコメントの同期
- [ ] Issue/PR のコメント同期
- [ ] 双方向同期（git notes から GitHub への反映）
- [ ] より詳細な設定オプション

## License

MIT