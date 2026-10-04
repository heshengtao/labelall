<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="LabelAll — フォルダから直接、COCO・YOLO・VOC・ImageFolder の画像データセットを開いて閲覧・アノテーション">
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="ライセンス：Apache-2.0"></a>
  <a href="../../releases"><img src="https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square" alt="最新リリース"></a>
  <a href="https://hub.docker.com/r/ailm32442/labelall"><img src="https://img.shields.io/badge/docker-ailm32442%2Flabelall-2496ED.svg?logo=docker&logoColor=white" alt="Docker イメージ"></a>
</p>

<p align="center">
  <b><a href="https://labelall.superagentparty.com/">ライブデモ</a></b> ·
  <b><a href="../../releases">デスクトップ版をダウンロード</a></b> ·
  <b><a href="#3-docker-で実行する">Docker で実行</a></b> ·
  <b><a href="./DEPLOY.md">セルフホスト</a></b>
</p>

<p align="center">
  <a href="README_zh.md">简体中文</a> ·
  <a href="README_zh_TW.md">繁體中文</a> ·
  <a href="README.md">English</a> ·
  <a href="README_ja.md">日本語</a> ·
  <a href="README_ko.md">한국어</a> ·
  <a href="README_es.md">Español</a> ·
  <a href="README_fr.md">Français</a> ·
  <a href="README_de.md">Deutsch</a> ·
  <a href="README_ru.md">Русский</a> ·
  <a href="README_ar.md">العربية</a>
</p>

---

<p align="center">
  <img src="./assets/readme/showcase.png" width="100%" alt="LabelAll が Pascal VOC データセットを表示している様子：画像リスト、クラスとレイヤーのコントロールを備えたアノテーションツールバー、現在の画像に描かれた 2 つの矩形。">
</p>

LabelAll は、一般的な画像データセットを開いて閲覧・アノテーション・書き出しするための**無料のオープンソース**ツールです。形式変換の手順も、用意すべきプロジェクトファイルもありません——フォルダを選べば、そこにあるものをそのまま読み取ります。

コンピュータビジョンのエンジニア、アノテーション／QA チーム、学生や研究者など、画像ラベルを手早く確認・編集したいすべての方に向いています。

## できること

**開いてすぐ**

- フォルダを選ぶだけ。データセットの形式は自動判別され、設定は不要です。
- 寛容な読み込み：壊れた・欠けた・規格外のファイルはスキップしてダイアログにまとめるので、1 つの不良ファイルでデータセット全体が開けなくなることはありません。
- 数万枚の画像でも軽快なサムネイル一覧。
- 分割（train / val / test）やクラスで絞り込み、ファイル名で検索。サムネイルをダブルクリックするとビューアで開きます。

**見やすさ**

- 自由にズーム・パン、ウィンドウに合わせる／1:1 で確認。
- 矩形・ポリゴン・キーポイント・分類タグをきれいに重ね、クラス色のラベルチップで名前を表示。
- レイヤーごとに表示・非表示を切り替え、矢印キーやフィルムストリップで画像を移動。

**アノテーションと編集**

- 矩形・ポリゴン・キーポイントを描画、または画像全体の分類ラベルを追加。
- ドラッグで移動、8 点でリサイズ、複製、削除、1px 単位の微調整。右クリックメニューで素早く操作。
- クラスはいつでも追加・名前変更・色変更・削除でき、元に戻す／やり直しも自由。

**書き出しと相互運用**

- COCO・YOLO・Pascal VOC・分類フォルダへワンクリックで書き出し。
- 書き出す前に、**変換先の形式で表現できない内容を明示**し、別フォルダへ出力します——元のファイルは決して変更しません。

**使い心地**

- ライト／ダークテーマ、アクセントカラーとパレットをカスタマイズ可能。
- 10 言語のインターフェース（右から左に書くアラビア語を含む）。デスクトップ版は自動更新に対応し、Web 版も同じ操作感です。

<p align="center">
  <img src="./assets/readme/showcase-more.png" width="100%" alt="左：Pascal VOC データセットを 100% の確信度で判別する LabelAll。右：同じアノテーション画像をダークテーマで表示したもの。">
</p>

## 対応データセット

| 形式 | 開く | 書き出し | 備考 |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | ポリゴン／RLE セグメンテーション、キーポイント |
| **YOLO** | ✅ | ✅ | 検出・セグメンテーション・ポーズ |
| **Pascal VOC** | ✅ | ✅ | 1 始まりの座標。XML は画像と同じ場所でも `Annotations/` でも可 |
| **分類フォルダ / ImageNet** | ✅ | 一部 | フォルダ名がクラス名 |
| **labelme** | ✅ | — | labelme との相互運用 |

> MS COCO、ImageNet / ILSVRC、Pascal VOC 2007/2012 などの公開データセットも元の形式のまま開けます。

## 実行方法

LabelAll の使い方は 3 通りあり、いずれもお使いのマシン上だけで動作します——アプリに**バックエンドはなく**、開いた画像やアノテーションがどこかへ送信されることはありません。

### 1. ブラウザで試す

**<https://labelall.superagentparty.com/>** を開き、データセットのフォルダを選ぶだけ。インストールは不要です。

> Web 版はブラウザの File System Access API を必要とするため、**HTTPS**（または `localhost`）で配信する必要があります。**Chrome / Edge** は読み書き可能、**Firefox / Safari** は読み取り専用で開きます。

### 2. デスクトップアプリをインストール

[Releases](../../releases) ページからお使いの OS 用インストーラーを入手してください——**macOS・Windows・Linux**。ディスクへ確実に書き戻せるため、アノテーションにはデスクトップ版を推奨します。

> **macOS での初回起動**：Apple の公証を受けていません。「壊れているため開けません」等と表示されたら、ターミナルで `xattr -cr /Applications/LabelAll.app` を実行してから開くか、アプリを右クリックして「開く」を選んでください。

### 3. Docker で実行する

Web 版はそのままの静的バンドルなので、イメージは `nginx` とコンパイル済みアプリだけです。公開イメージはマルチアーキテクチャ（`linux/amd64` と `linux/arm64`）です：

```bash
docker run --rm -p 8080:80 ailm32442/labelall:latest
```

その後 <http://localhost:8080> を開きます。

チェックアウトから自分でビルドすることもできます：

```bash
docker build -t labelall .
docker run --rm -p 8080:80 labelall

# または
docker compose up -d --build
```

> バージョンタグを push すると（`git tag v0.1.3 && git push origin v0.1.3`）、タグが自動でビルドされ Docker Hub に push され、セマンティックバージョンのタグと `latest` が生成されます。Docker Hub の設定やその他のホスティング方法（Cloudflare Pages、Netlify、Vercel など）は [DEPLOY.md](./DEPLOY.md) を参照してください。

## クイックスタート

1. LabelAll を開き「データセットを開く」からフォルダを選びます。
2. 判別された形式を確認して閲覧を開始します。
3. アノテーションを追加・編集し、必要な形式で書き出します。

> まず試したい方へ：[`examples/voc-mini`](./examples/voc-mini) は 3 枚だけの小さな Pascal VOC データセットです。そのまま開けます。

## キーボードショートカット

| 操作 | ショートカット |
| --- | --- |
| 前 / 次の画像 | `←` / `→` |
| 選択/移動 · 矩形 · ポリゴン · キーポイント | `V` · `B` · `P` · `K` |
| 選択中のアノテーションを微調整 | `矢印キー`（`Shift` で 10px） |
| 削除 / 複製 | `Delete` / `Ctrl`·`Cmd` + `D` |
| 元に戻す / やり直す | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| 拡大 / 縮小 / ウィンドウに合わせる | `+` / `-` / `0` |
| キャンバスをパン | 空白部分をドラッグ、または `Space` + ドラッグ |

## 既知の制限

- 画像 5 万枚程度、アノテーションファイル 100 MB 程度までを想定しています。それ以上は快適さを保証できません。
- Web 版は Chrome / Edge では読み書き可能、Firefox / Safari は読み取り専用です。
- 書き出しはアノテーションファイルのみで、画像はコピーしません。

## コントリビュートとライセンス

Issue と Pull Request を歓迎します（[CONTRIBUTING.md](./CONTRIBUTING.md)）。リリース手順は [RELEASING.md](./RELEASING.md)。[Apache-2.0](./LICENSE) © 2026 heshengtao。
