<div align="center">

# LabelAll

**加载 · 查看 · 标注 常见图片数据集**
**Load, view and annotate common image datasets**

让打开和标注一个图片数据集，简单到只需要选一个文件夹。

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

[中文](#中文) · [English](#english)

</div>

---

## 中文

### LabelAll 是什么

LabelAll 是一款**免费开源**的图片数据集工具，帮你打开、浏览、标注和导出市面上常见的图片数据集。

不用写代码，不用先做格式转换，也不用记住标注文件放在哪——选一个文件夹，剩下的交给它。

它适合：算法与视觉工程师、数据标注与审核团队、学生和研究者，以及任何需要快速查看或修改一批图片标注的人。

### 它能做什么

**打开即用**

- 放进文件夹就能用：自动识别数据集格式，不需要手工选择或配置。
- 宽容读取：个别损坏、缺图或格式不规范的文件会被跳过并汇总提示，不会让整个数据集打不开。
- 成千上万张图片的缩略图列表，滚动即时加载，查找和筛选都很快。
- 可按划分（train / val / test）、类别筛选，也能按文件名搜索。

**看得清楚**

- 图片可自由缩放、平移，一键「适应窗口」或按 1:1 查看。
- 矩形框、多边形、关键点、分类标签四类标注清晰叠加，按类别自动配色。
- 每一层都可单独显示或隐藏，快速聚焦想看的内容。
- 底部胶片条可前后快速翻看，方向键即可切换图片。

**标注与修改**

- 直接画矩形框、多边形、关键点，或给整张图打分类标签。
- 拖动移动、八个控制点缩放、复制、删除，方向键微调到像素级。
- 类别随时增删改和换色，管理起来一目了然。
- 误操作没关系：撤销 / 重做随时回退。

**导出与互通**

- 一键导出为 COCO、YOLO、Pascal VOC、分类文件夹等常用格式。
- 导出前会**明确告诉你哪些信息无法保留**，避免悄无声息地丢数据。
- 原始文件不会被改动，导出结果单独存放，安全可回溯。

**用起来顺手**

- 深色 / 浅色主题，主题色可自由更换。
- 简体中文 / English 界面，随时切换。
- 桌面端与网页版体验一致；最近打开的数据集可一键回到上次的位置。

### 支持的数据集

| 格式 | 打开 | 导出 | 说明 |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | 含多边形与 RLE 分割、关键点 |
| **YOLO** | ✅ | ✅ | 检测 / 分割 / 姿态三种任务均可 |
| **Pascal VOC** | ✅ | ✅ | 常见的 1 基闭区间坐标标注 |
| **分类文件夹 / ImageNet** | ✅ | 部分 | 目录名即类别名 |
| **labelme** | ✅ | — | 便于与 labelme 互通 |

> 也可直接打开 MS COCO、ImageNet / ILSVRC、Pascal VOC 2007/2012 等公开数据集的原始格式。

### 快速上手

1. 打开 LabelAll，点击「打开数据集」，选择数据集所在文件夹。
2. 软件会自动识别格式，确认后即可开始浏览。
3. 选中图片，按需新增或修改标注。
4. 完成后导出为你需要的格式。

常用快捷键：

| 操作 | 快捷键 |
| --- | --- |
| 上一张 / 下一张图片 | `←` / `→` |
| 选择 / 移动 | `V` |
| 画矩形框 | `B` |
| 画多边形（双击闭合） | `P` |
| 打关键点 | `K` |
| 微调选中标注 | `方向键`（按住 `Shift` 每次 10px） |
| 删除 / 复制选中标注 | `Delete` / `Ctrl`·`Cmd` + `D` |
| 撤销 / 重做 | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| 放大 / 缩小 / 适应窗口 | `+` / `-` / `0` |
| 平移画布 | `空格` + 拖拽 |

### 下载

前往 [Releases](../../releases) 下载对应系统的安装包（macOS / Windows / Linux）。

> **macOS 首次打开提示**：安装包未做 Apple 公证。首次打开若提示「已损坏」或「无法验证开发者」，
> 请在终端执行 `xattr -cr /Applications/LabelAll.app` 后再打开；也可以右键点击 App，选择「打开」。

### 已知限制

- 面向约 5 万张图片、标注文件不超过 100 MB 的数据集；更大规模暂不保证流畅。
- 网页版在 Chrome / Edge 可读写，Firefox / Safari 目前仅支持只读浏览。

---

## English

### What is LabelAll

LabelAll is a **free, open-source** tool for opening, browsing, annotating and exporting common
image datasets.

No code, no format conversion first, no hunting for the annotation files — pick a folder and it
takes care of the rest.

It is for computer-vision engineers, annotation and QA teams, students and researchers, and anyone
who needs to look at or edit a batch of image labels quickly.

### What it does

**Open and go**

- Drop in a folder: the dataset format is detected automatically — no manual setup.
- Forgiving reading: broken, missing or non-standard files are skipped and summarised in a
  dialog, so one bad file never blocks the whole dataset.
- A thumbnail list that stays smooth with tens of thousands of images, with quick search.
- Filter by split (train / val / test) or by class, and search by file name.

**See clearly**

- Zoom and pan freely, fit to window or inspect at 1:1.
- Boxes, polygons, keypoints and classification tags overlay cleanly, coloured by class.
- Toggle any layer on or off to focus on what matters.
- A bottom filmstrip for quick browsing; arrow keys step through images.

**Annotate and edit**

- Draw boxes, polygons and keypoints, or add an image-level class label.
- Drag to move, resize with eight handles, duplicate, delete, and nudge pixel by pixel.
- Add, rename, recolour or remove classes at any time.
- Mistakes are fine: undo and redo whenever you need.

**Export and interop**

- Export to COCO, YOLO, Pascal VOC or classification folders in one step.
- Before exporting, LabelAll **tells you exactly what the target format cannot keep**, so nothing is
  lost silently.
- Your original files are never modified — exports go to a separate folder.

**A pleasure to use**

- Light and dark themes, with a customisable accent colour.
- Simplified Chinese and English, switchable at any time.
- The desktop app and the web build feel the same; recent datasets are one click away.

### Supported datasets

| Format | Open | Export | Notes |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | Polygon and RLE segmentation, keypoints |
| **YOLO** | ✅ | ✅ | Detect, segment and pose tasks |
| **Pascal VOC** | ✅ | ✅ | The usual 1-based inclusive boxes |
| **Classification / ImageNet** | ✅ | Partial | The folder name is the class |
| **labelme** | ✅ | — | Interop with labelme |

> MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 and other public datasets can be opened in their
> native format.

### Quick start

1. Open LabelAll and click “Open dataset”, then choose the dataset folder.
2. The format is detected automatically — confirm and start browsing.
3. Select an image and add or edit annotations as needed.
4. Export to the format you want.

Common shortcuts:

| Action | Shortcut |
| --- | --- |
| Previous / next image | `←` / `→` |
| Select / move | `V` |
| Draw a box | `B` |
| Draw a polygon (double-click to finish) | `P` |
| Place keypoints | `K` |
| Nudge the selected annotation | `Arrows` (hold `Shift` for 10px) |
| Delete / duplicate selection | `Delete` / `Ctrl`·`Cmd` + `D` |
| Undo / redo | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| Zoom in / out / fit | `+` / `-` / `0` |
| Pan the canvas | `Space` + drag |

### Download

Grab the installer for your system from the [Releases](../../releases) page (macOS / Windows / Linux).

> **First launch on macOS**: the build is not notarized. If macOS says the app is “damaged” or cannot
> verify the developer, run `xattr -cr /Applications/LabelAll.app` in Terminal, then open it — or
> right-click the app and choose “Open”.

### Known limitations

- Aimed at datasets of up to ~50k images with annotation files under 100 MB; larger ones are not
  guaranteed to stay smooth yet.
- The web build is read/write in Chrome / Edge and read-only in Firefox / Safari.

---

## 贡献 Contributing

欢迎提交 Issue 与 Pull Request。开发、构建与打包说明见 [CONTRIBUTING.md](./CONTRIBUTING.md)。
Issues and pull requests are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for development and
build instructions.

## 许可证 License

[Apache-2.0](./LICENSE) © 2026 heshengtao
