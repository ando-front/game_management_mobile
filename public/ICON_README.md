# アイコン画像の生成手順

## 現在の状態

`icon.svg` にプレースホルダーアイコンを作成済みです。
以下のサイズのPNG画像が必要です：

- `icon-180.png` - 180×180px (Apple Touch Icon - iPhone)
- `icon-167.png` - 167×167px (Apple Touch Icon - iPad)
- `icon-192.png` - 192×192px (PWA Icon)
- `icon-512.png` - 512×512px (PWA Icon)

## 生成方法

### オプション1: オンラインツール

1. https://realfavicongenerator.net/ にアクセス
2. `icon.svg` をアップロード
3. iOS/iPad、PWA用のアイコンを生成
4. ダウンロードして `public/` に配置

### オプション2: Figma/Sketch等のデザインツール

1. `icon.svg` をインポート
2. 各サイズにリサイズしてPNGでエクスポート
3. `public/` に配置

### オプション3: ImageMagick（コマンドライン）

```bash
# インストール（macOS）
brew install imagemagick

# SVGからPNG生成
convert -background none icon.svg -resize 180x180 icon-180.png
convert -background none icon.svg -resize 167x167 icon-167.png
convert -background none icon.svg -resize 192x192 icon-192.png
convert -background none icon.svg -resize 512x512 icon-512.png
```

## デザインガイドライン

現在のアイコンは：
- ゲームコントローラー（遊び）
- 時計（時間管理）
- インディゴ/パープルのグラデーション（アプリのテーマカラー）

を組み合わせたデザインです。

カスタマイズする場合は、`icon.svg` を編集してください。
