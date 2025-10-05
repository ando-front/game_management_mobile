# ゲーム時間管理アプリ（MVP）

家庭用ゲーム時間管理PWAアプリです。親が時間を付与し、子供がゲーム時間を消費します。

## 機能

- **子供用機能**
  - 残り時間の表示
  - ゲーム開始/終了（1ボタントグル、長押しで終了）
  - 経過時間の目安表示

- **親用機能**（PINロック）
  - 時間付与プリセット（+5/+10/+15分）
  - 時間リセット
  - PIN変更
  - 利用履歴表示
  - データバックアップ（JSONエクスポート/インポート）
  - PIN失敗ロック機能（5回失敗で30秒ロック）

## 技術スタック

- React 18 + TypeScript
- Zustand（状態管理）
- Dexie.js（IndexedDB）
- TailwindCSS
- Vite + PWA Plugin

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## デプロイ

推奨ホスティング: Netlify, Vercel, Cloudflare Pages

```bash
npm run build
# dist/ ディレクトリをデプロイ
```

## iPad Safari 運用

- ホーム画面に追加してPWAとして利用
- プライベートブラウズは避ける
- 定期的にバックアップを実施（月1回推奨）
- バックアップはiCloud Drive（ファイルアプリ）に保存

## 初期PIN

デフォルトPIN: `0000`

親モードで変更可能です。

## ドキュメント

全ての設計・仕様ドキュメントは `docs/` に集約しました。

### 設計書
- [docs/要件定義書.md](docs/要件定義書.md)
- [docs/概要設計書.md](docs/概要設計書.md)
- [docs/詳細設計書.md](docs/詳細設計書.md)

### 開発・テスト
- [docs/実装完了報告.md](docs/実装完了報告.md) - 実装内容の総まとめ
- [docs/動作確認レポート.md](docs/動作確認レポート.md) - ビルド結果とテスト手順
- [docs/テストチェックリスト.md](docs/テストチェックリスト.md) - 詳細なテスト項目

### 開発者向け
- [CLAUDE.md](CLAUDE.md) - Claude向けプロジェクトガイダンス

## ライセンス

MIT
