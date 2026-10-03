<div align="center">

# LabelAll

**載入 · 檢視 · 標註 常見圖片資料集**

開啟與標註一個圖片資料集，應該簡單到只需要選一個資料夾。

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square)](../../releases)

</div>

<p align="center">
  <a href="README_zh.md"><b>简体中文</b></a> ·
  <a href="README_zh_TW.md"><b>繁體中文</b></a> ·
  <a href="README.md"><b>English</b></a> ·
  <a href="README_ja.md"><b>日本語</b></a> ·
  <a href="README_ko.md"><b>한국어</b></a> ·
  <a href="README_es.md"><b>Español</b></a> ·
  <a href="README_fr.md"><b>Français</b></a> ·
  <a href="README_de.md"><b>Deutsch</b></a> ·
  <a href="README_ru.md"><b>Русский</b></a> ·
  <a href="README_ar.md"><b>العربية</b></a>
</p>

---

## LabelAll 是什麼

LabelAll 是一款**免費開源**的圖片資料集工具，用來開啟、瀏覽、標註與匯出市面上常見的圖片資料集。

不用寫程式，不用先做格式轉換，也不用記得標註檔放在哪——選一個資料夾，其餘交給它。它適合演算法與
視覺工程師、標註與審核團隊、學生與研究者，以及任何需要快速查看或修改一批圖片標註的人。

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

## 支援的資料集

| 格式 | 開啟 | 匯出 | 說明 |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | 含多邊形與 RLE 分割、關鍵點 |
| **YOLO** | ✅ | ✅ | 偵測 / 分割 / 姿態三種任務 |
| **Pascal VOC** | ✅ | ✅ | 1 基座標；XML 與圖片同層或位於 `Annotations/` |
| **分類資料夾 / ImageNet** | ✅ | 部分 | 目錄名稱即類別名稱 |
| **labelme** | ✅ | — | 便於與 labelme 互通 |

> 也可直接開啟 MS COCO、ImageNet / ILSVRC、Pascal VOC 2007/2012 等公開資料集的原始格式。

## 快速上手

1. 開啟 LabelAll，點選「開啟資料集」，選擇資料集資料夾。
2. 確認辨識出的格式後開始瀏覽。
3. 依需求新增或修改標註，再匯出為需要的格式。

| 操作 | 快速鍵 |
| --- | --- |
| 上一張 / 下一張 | `←` / `→` |
| 選取/移動 · 畫框 · 多邊形 · 關鍵點 | `V` · `B` · `P` · `K` |
| 微調選取的標註 | `方向鍵`（按住 `Shift` 每次 10px） |
| 刪除 / 複製 | `Delete` / `Ctrl`·`Cmd` + `D` |
| 復原 / 重做 | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| 放大 / 縮小 / 符合視窗 | `+` / `-` / `0` |
| 平移畫布 | 拖曳空白處，或 `空格` + 拖曳 |

> 想先試試？[`examples/voc-mini`](./examples/voc-mini) 是一個 3 張圖的小型 Pascal VOC 資料集，直接開啟即可。

## 下載

前往 [Releases](../../releases) 下載對應系統的安裝包（macOS / Windows / Linux），或以
`docker compose up -d --build` 自架網頁版（見 [DEPLOY.md](./DEPLOY.md)）。

> **macOS 首次開啟**：安裝包未做 Apple 公證。若提示「已損毀」或「無法驗證開發者」，請在終端機執行
> `xattr -cr /Applications/LabelAll.app` 後再開啟，或右鍵點選 App 選擇「打開」。

## 已知限制

- 面向約 5 萬張圖片、標註檔不超過 100 MB 的資料集；更大規模暫不保證流暢。
- 網頁版在 Chrome / Edge 可讀寫，Firefox / Safari 僅支援唯讀。
- 匯出只寫標註檔，不複製圖片。

## 參與貢獻與授權

歡迎提交 Issue 與 Pull Request，詳見 [CONTRIBUTING.md](./CONTRIBUTING.md)；打包發佈見
[RELEASING.md](./RELEASING.md)。[Apache-2.0](./LICENSE) © 2026 heshengtao。
