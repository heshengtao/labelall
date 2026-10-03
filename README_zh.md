<div align="center">

# LabelAll

**加载 · 查看 · 标注 常见图片数据集**

打开和标注一个图片数据集，应该简单到只需要选一个文件夹。

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

## LabelAll 是什么

LabelAll 是一款**免费开源**的图片数据集工具，用来打开、浏览、标注和导出市面上常见的图片数据集。

不用写代码，不用先做格式转换，也不用记住标注文件放在哪——选一个文件夹，剩下的交给它。它适合
算法与视觉工程师、数据标注与审核团队、学生和研究者，以及任何需要快速查看或修改一批图片标注的人。

## 它能做什么

**打开即用**

- 选一个文件夹即可，自动识别格式，无需任何配置。
- 宽容读取：损坏、缺失或不规范的文件会被跳过并汇总到对话框里，单个坏文件不会让整个数据集打不开。
- 数万张图片的缩略图列表依旧流畅。
- 可按划分（train / val / test）或类别筛选、按文件名搜索；双击缩略图直接在查看器中打开。

**看得清楚**

- 自由缩放、平移，一键适应窗口或按 1:1 查看。
- 矩形框、多边形、关键点、分类标签清晰叠加，用类别色的标签块标注名称。
- 每一层可单独显示或隐藏；方向键或底部胶片条快速切图。

**标注与修改**

- 画矩形框、多边形、关键点，或给整张图加分类标签。
- 拖动移动、八点缩放、复制、删除、像素级微调，右键菜单可快速操作。
- 类别随时增删改和换色；撤销 / 重做随时回退。

**导出与互通**

- 一键导出为 COCO、YOLO、Pascal VOC 或分类文件夹格式。
- 导出前会**明确告诉你目标格式无法保留什么**，并写到单独目录——原始文件绝不改动。

**用起来顺手**

- 深色 / 浅色主题，主题色与调色板可自定义。
- 十种界面语言（含从右到左的阿拉伯语）；桌面端支持自动更新，网页版体验一致。

## 支持的数据集

| 格式 | 打开 | 导出 | 说明 |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | 含多边形与 RLE 分割、关键点 |
| **YOLO** | ✅ | ✅ | 检测 / 分割 / 姿态三种任务 |
| **Pascal VOC** | ✅ | ✅ | 1 基坐标；XML 与图片同级或在 `Annotations/` 中 |
| **分类文件夹 / ImageNet** | ✅ | 部分 | 目录名即类别名 |
| **labelme** | ✅ | — | 便于与 labelme 互通 |

> 也可直接打开 MS COCO、ImageNet / ILSVRC、Pascal VOC 2007/2012 等公开数据集的原始格式。

## 快速上手

1. 打开 LabelAll，点击「打开数据集」，选择数据集文件夹。
2. 确认识别出的格式，开始浏览。
3. 按需新增或修改标注，再导出为需要的格式。

| 操作 | 快捷键 |
| --- | --- |
| 上一张 / 下一张 | `←` / `→` |
| 选择/移动 · 画框 · 多边形 · 关键点 | `V` · `B` · `P` · `K` |
| 微调选中标注 | `方向键`（按住 `Shift` 每次 10px） |
| 删除 / 复制 | `Delete` / `Ctrl`·`Cmd` + `D` |
| 撤销 / 重做 | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| 放大 / 缩小 / 适应窗口 | `+` / `-` / `0` |
| 平移画布 | 拖动空白处，或 `空格` + 拖拽 |

> 想先试试？[`examples/voc-mini`](./examples/voc-mini) 是一个 3 张图的小型 Pascal VOC 数据集，直接打开即可。

## 下载

前往 [Releases](../../releases) 下载对应系统的安装包（macOS / Windows / Linux），或用
`docker compose up -d --build` 自建网页版（见 [DEPLOY.md](./DEPLOY.md)）。

> **macOS 首次打开**：安装包未做 Apple 公证。若提示「已损坏」或「无法验证开发者」，请在终端执行
> `xattr -cr /Applications/LabelAll.app` 后再打开，或右键点击 App 选择「打开」。

## 已知限制

- 面向约 5 万张图片、标注文件不超过 100 MB 的数据集；更大规模暂不保证流畅。
- 网页版在 Chrome / Edge 可读写，Firefox / Safari 仅支持只读。
- 导出只写标注文件，不复制图片。

## 参与贡献与许可

欢迎提交 Issue 与 Pull Request，详见 [CONTRIBUTING.md](./CONTRIBUTING.md)；打包发布见
[RELEASING.md](./RELEASING.md)。[Apache-2.0](./LICENSE) © 2026 heshengtao。
