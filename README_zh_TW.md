<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="LabelAll — 直接從資料夾開啟、檢視並標註 COCO、YOLO、VOC 與 ImageFolder 圖片資料集">
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="授權條款：Apache-2.0"></a>
  <a href="../../releases"><img src="https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square" alt="最新版本"></a>
  <a href="https://hub.docker.com/r/ailm32442/labelall"><img src="https://img.shields.io/badge/docker-ailm32442%2Flabelall-2496ED.svg?logo=docker&logoColor=white" alt="Docker 映像"></a>
</p>

<p align="center">
  <b><a href="https://labelall.superagentparty.com/">線上示範</a></b> ·
  <b><a href="../../releases">下載桌面版</a></b> ·
  <b><a href="#3-用-docker-執行">用 Docker 執行</a></b> ·
  <b><a href="./DEPLOY.md">自行部署</a></b>
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
  <img src="./assets/readme/showcase.png" width="100%" alt="LabelAll 正在展示一個 Pascal VOC 資料集：圖片清單、帶類別與圖層控制的標註工具列，以及目前圖片上繪製的兩個矩形框。">
</p>

LabelAll 是一款**免費開源**的工具，用來開啟、瀏覽、標註與匯出市面上常見的圖片資料集。無需格式轉換，也沒有專案檔要設定——選一個資料夾，直接讀取其中已有的內容。

它適合電腦視覺工程師、標註與審核團隊、學生與研究者，以及任何需要快速查看或修改一批圖片標註的人。

## 它能做什麼

**開啟即用**

- 選一個資料夾即可，自動辨識格式，無需任何設定。
- 寬鬆讀取：損毀、缺失或格式不規範的檔案會被略過並彙整到對話框，單一壞檔不會讓整個資料集打不開。
- 數萬張圖片的縮圖清單依然流暢。
- 可依分割（train / val / test）或類別篩選、以檔名搜尋；連按兩下縮圖即可在檢視器開啟。

**看得清楚**

- 自由縮放、平移，一鍵符合視窗或 1:1 檢視。
- 矩形框、多邊形、關鍵點、分類標籤清晰疊加，並以類別色的標籤塊標示名稱。
- 每一層可單獨顯示或隱藏；方向鍵或底部底片列快速換圖。

**標註與修改**

- 繪製矩形框、多邊形、關鍵點，或為整張圖片加上分類標籤。
- 拖曳移動、八點縮放、複製、刪除、像素級微調，右鍵選單可快速操作。
- 類別隨時新增、修改、換色；復原 / 重做隨時回退。

**匯出與互通**

- 一鍵匯出為 COCO、YOLO、Pascal VOC 或分類資料夾格式。
- 匯出前會**明確告訴你目標格式無法保留什麼**，並寫入獨立目錄——原始檔案絕不更動。

**用起來順手**

- 深色 / 淺色主題，主題色與調色盤可自訂。
- 十種介面語言（含由右至左的阿拉伯語）；桌面端支援自動更新，網頁版體驗一致。

<p align="center">
  <img src="./assets/readme/showcase-more.png" width="100%" alt="左：LabelAll 以 100% 信心度辨識出一個 Pascal VOC 資料集。右：同一張標註圖片的深色主題。">
</p>

## 支援的資料集

| 格式 | 開啟 | 匯出 | 說明 |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | 含多邊形與 RLE 分割、關鍵點 |
| **YOLO** | ✅ | ✅ | 偵測 / 分割 / 姿態三種任務 |
| **Pascal VOC** | ✅ | ✅ | 1 基座標；XML 與圖片同層或位於 `Annotations/` |
| **分類資料夾 / ImageNet** | ✅ | 部分 | 目錄名稱即類別名稱 |
| **labelme** | ✅ | — | 便於與 labelme 互通 |

> 也可直接開啟 MS COCO、ImageNet / ILSVRC、Pascal VOC 2007/2012 等公開資料集的原始格式。

## 執行方式

LabelAll 有三種使用方式，全部都在你自己的機器上執行——應用程式**沒有後端**，開啟的圖片與標註不會上傳到任何地方。

### 1. 在瀏覽器中試用

開啟 **<https://labelall.superagentparty.com/>**，選擇一個資料集資料夾即可，無需安裝。

> 網頁版依賴瀏覽器的檔案系統存取 API，因此必須透過 **HTTPS**（或 `localhost`）提供服務。**Chrome / Edge** 可讀可寫；**Firefox / Safari** 僅能以唯讀方式開啟資料集。

### 2. 安裝桌面應用程式

在 [Releases](../../releases) 頁面下載對應系統的安裝包——**macOS、Windows 與 Linux**。推薦以桌面版進行標註，因為它始終能寫回磁碟。

> **macOS 首次開啟**：安裝包未做 Apple 公證。若提示「已損毀」或「無法驗證開發者」，請在終端機執行 `xattr -cr /Applications/LabelAll.app` 後再開啟，或右鍵點選 App 選擇「打開」。

### 3. 用 Docker 執行

網頁版本質上是一份靜態建置產物，所以映像檔就是 `nginx` 加上編譯好的應用程式。已發佈的映像檔支援多架構（`linux/amd64` 與 `linux/arm64`）：

```bash
docker run --rm -p 8080:80 ailm32442/labelall:latest
```

然後開啟 <http://localhost:8080>。

也可以從原始碼自行建置：

```bash
docker build -t labelall .
docker run --rm -p 8080:80 labelall

# 或
docker compose up -d --build
```

> 推送版本標籤（`git tag v0.1.3 && git push origin v0.1.3`）時，標籤會自動建置並推送到 Docker Hub，產生語意化版本標籤以及 `latest`。Docker Hub 設定與其他託管方式（Cloudflare Pages、Netlify、Vercel 等）見 [DEPLOY.md](./DEPLOY.md)。

## 快速上手

1. 開啟 LabelAll，點選「開啟資料集」，選擇資料集資料夾。
2. 確認辨識出的格式後開始瀏覽。
3. 依需求新增或修改標註，再匯出為需要的格式。

> 想先試試？[`examples/voc-mini`](./examples/voc-mini) 是一個 3 張圖的小型 Pascal VOC 資料集，直接開啟即可。

## 快速鍵

| 操作 | 快速鍵 |
| --- | --- |
| 上一張 / 下一張 | `←` / `→` |
| 選取/移動 · 畫框 · 多邊形 · 關鍵點 | `V` · `B` · `P` · `K` |
| 微調選取的標註 | `方向鍵`（按住 `Shift` 每次 10px） |
| 刪除 / 複製 | `Delete` / `Ctrl`·`Cmd` + `D` |
| 復原 / 重做 | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| 放大 / 縮小 / 符合視窗 | `+` / `-` / `0` |
| 平移畫布 | 拖曳空白處，或 `空格` + 拖曳 |

## 已知限制

- 面向約 5 萬張圖片、標註檔不超過 100 MB 的資料集；更大規模暫不保證流暢。
- 網頁版在 Chrome / Edge 可讀寫，Firefox / Safari 僅支援唯讀。
- 匯出只寫標註檔，不複製圖片。

## 參與貢獻與授權

歡迎提交 Issue 與 Pull Request，詳見 [CONTRIBUTING.md](./CONTRIBUTING.md)；打包發佈見 [RELEASING.md](./RELEASING.md)。[Apache-2.0](./LICENSE) © 2026 heshengtao。
