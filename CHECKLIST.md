# git-notes-gh-sync 動作チェックリスト

## 環境準備
- [ ] Deno がインストールされている
- [ ] gh CLI がインストールされ、認証済み
- [ ] git リポジトリが GitHub にホストされている

## 基本的な git notes コマンドの動作確認

### 1. git notes の基本操作
- [ ] `git notes add -m "test note" HEAD` でノートを追加できる
- [ ] `git notes show HEAD` でノートを表示できる
- [ ] `git notes list` でノート一覧を表示できる
- [ ] `git notes remove HEAD` でノートを削除できる

### 2. 複数の namespace での動作
- [ ] `git notes --ref=test add -m "test" HEAD` で別 namespace にノートを追加できる
- [ ] `git notes --ref=test show HEAD` で別 namespace のノートを表示できる

## git-notes-gh-sync の動作確認

### 3. 初期セットアップ
- [ ] `deno task sync` でエラーなく実行できる
- [ ] リポジトリの owner/repo を自動検出できる

### 4. Issue 同期機能
- [ ] GitHub で新しい Issue を作成
- [ ] Issue 番号を含むコミットメッセージでコミット作成
- [ ] `deno task sync sync-recent` で Issue が同期される
- [ ] `git notes --ref=github/issues show <commit>` で Issue 情報が表示される
- [ ] JSON 形式で正しく保存されている

### 5. PR 同期機能
- [ ] GitHub で新しい PR を作成
- [ ] `deno task sync sync-pr <number>` で PR が同期される
- [ ] PR のすべてのコミットに notes が追加される
- [ ] `git notes --ref=github/pulls show <commit>` で PR 情報が表示される

### 6. 自動 Issue 参照検出
- [ ] `fixes #N` 形式の参照を検出できる
- [ ] `closes #N` 形式の参照を検出できる
- [ ] `resolves #N` 形式の参照を検出できる
- [ ] 単純な `#N` 形式の参照を検出できる

### 7. ドライラン機能
- [ ] `--dry-run` オプションで実際の書き込みを行わない
- [ ] 実行予定の内容が表示される

### 8. エラーハンドリング
- [ ] 存在しない Issue 番号で同期を試みた場合のエラー
- [ ] 存在しない PR 番号で同期を試みた場合のエラー
- [ ] GitHub API の認証エラー
- [ ] 不正なコミット SHA を指定した場合のエラー

### 9. 全体同期
- [ ] `deno task sync` ですべての PR が同期される
- [ ] 大量の PR があっても正常に動作する

### 10. パフォーマンス
- [ ] 100以上のコミットがある PR でも適切に動作する
- [ ] API レート制限を考慮している