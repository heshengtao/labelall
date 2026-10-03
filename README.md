<div align="center">

# LabelAll

**加载 · 查看 · 标注 常见图片数据集**
**Load, view and annotate common image datasets**

跨平台桌面应用 · 同一套前端同时提供 Web 版

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust-stable-000000.svg)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6.svg)](https://www.typescriptlang.org/)

[中文](#中文) · [English](#english) · [架构](#架构-architecture) · [开发](#本地开发-development)

</div>

---

## 中文

### 这是什么

LabelAll 是一个开源的图片数据集工具，用来**加载、查看和标注**市面上常见的图片数据集。

- **跨平台桌面端**：macOS / Windows / Linux，基于 Tauri 2（Rust + 系统 WebView），安装包体积小
- **Web 端**：同一套前端代码可直接构建为静态站点，浏览器中打开即用
- **多格式**：自动识别数据集格式，无需手工配置
- **四类标注**：矩形框、多边形分割、关键点、分类标签

### 支持的数据集格式

| 格式 | 检测特征 | 读取 | 写入 | 说明 |
| --- | :---: | :---: | :---: | --- |
| **COCO** (json) | `*.json` 含 `images`/`annotations`/`categories` | ✅ | 🚧 | 含多边形与 RLE 分割、关键点、`iscrowd` |
| **YOLO** (txt + yaml) | 同级 `images/` + `labels/`，`*.yaml` 含 `names:` | 🚧 | 🚧 | 检测 / 分割 / 姿态三种任务 |
| **Pascal VOC** (xml) | `Annotations/*.xml` + `JPEGImages/` | 🚧 | 🚧 | 1 基闭区间坐标，可配置换算策略 |
| **分类文件夹 / ImageNet** | 类名子目录，无标注文件 | ✅ | 🚧 | 目录名字典序即类别顺序 |
| **labelme** (json) | `*.json` 含 `shapes`/`imagePath` | ✅ | — | 便于与 labelme 互通 |

图例：✅ 已完成 · 🚧 开发中 · — 不计划支持

> 同时支持常见开源数据集，如 MS COCO、ImageNet / ILSVRC、Pascal VOC 2007/2012、Open Images、VisDrone、CrowdHuman 等（按其原生格式加载）。

### 技术栈

| 层 | 选型 |
| --- | --- |
| 桌面外壳 | Tauri 2（Rust） |
| 前端 | React 19 + TypeScript + Vite 8 |
| UI | MUI v9 + Material Design 3 配色（Google 官方 HCT 调色引擎） |
| 标注画布 | Konva / react-konva |
| 状态 | zustand + immer |
| 国际化 | i18next（简体中文 / English） |
| 测试 | Vitest + Testing Library |

### 架构

核心原则：**格式解析逻辑只用 TypeScript 写一份**，Web 端与桌面端共用，避免两套实现发散。

```
┌──────────────────────────────────────────────┐
│  React UI（viewer / annotator / panels）      │
├──────────────────────────────────────────────┤
│  src/core/      统一数据模型 + 各格式读写       │  ← 纯 TS，两端共用
├──────────────────────────────────────────────┤
│  src/platform/  DatasetSource 抽象            │  ← 环境差异收敛在此
│    ├── tauri.ts   → invoke + convertFileSrc   │
│    └── web.ts     → File System Access API    │
├──────────────────────────────────────────────┤
│  Rust（src-tauri/）                           │  ← 只做通用文件系统能力
│    目录遍历 · 文件读写 · 图片尺寸 · asset 授权   │
└──────────────────────────────────────────────┘
```

- Rust **不实现任何格式解析器**，只暴露与格式无关的命令（遍历 / 读 / 写 / 图片头）。
- 图片经 Tauri asset 协议按需流式加载，不做 base64 编码；且只对用户实际打开的数据集目录动态授权。
- 解析运行在 Web Worker 中，避免大文件阻塞界面。

### 本地开发

前置要求：Node.js ≥ 20、pnpm ≥ 9、Rust stable（仅桌面端需要）。

```bash
pnpm install

# Web 形态（浏览器打开 http://localhost:1420）
pnpm dev

# 桌面形态
pnpm tauri dev
```

常用脚本：

```bash
pnpm typecheck    # tsc -b
pnpm lint         # oxlint
pnpm format       # prettier --write
pnpm test         # vitest run
pnpm build        # 产出静态 Web 版到 dist/
pnpm tauri build  # 打包桌面安装包
```

### 路线图

- [x] **M0** 工程脚手架、MD3 主题、Tauri 集成、CI
- [x] **M1** 统一数据模型、格式探测、COCO / ImageFolder 读取
- [x] **M2** 平台抽象、打开数据集、图片列表
- [x] **M3** 查看器（缩放平移、四类标注叠加）
- [ ] **M4** 标注编辑与类别管理、撤销重做
- [ ] **M5** YOLO / VOC 读写、保存与导出、往返测试
- [ ] **M6** 打磨、Web 部署、文档与示例数据
- [ ] **M7** 发布 v0.1.0（三平台安装包）

### 已知限制

- 首版目标规模为 ≤ 5 万张图片、COCO JSON ≤ 100 MB；更大的数据集暂不保证流畅。
- Web 端在 Chrome / Edge 可读写（File System Access API），Firefox / Safari 目前仅支持只读浏览。

---

## English

### What is this

LabelAll is an open-source tool for **loading, viewing and annotating** common image datasets.

- **Cross-platform desktop app** for macOS / Windows / Linux, built on Tauri 2 (Rust + system webview) for small installers
- **Web build** from the very same frontend source — deploy it as a static site and use it in a browser
- **Many formats**, auto-detected with no manual configuration
- **Four annotation types**: bounding boxes, polygons, keypoints and classification tags

### Supported dataset formats

| Format | Detection signal | Read | Write | Notes |
| --- | :---: | :---: | :---: | --- |
| **COCO** (json) | `*.json` with `images`/`annotations`/`categories` | ✅ | 🚧 | Polygon and RLE segmentation, keypoints, `iscrowd` |
| **YOLO** (txt + yaml) | sibling `images/` + `labels/`, `*.yaml` with `names:` | 🚧 | 🚧 | Detect / segment / pose tasks |
| **Pascal VOC** (xml) | `Annotations/*.xml` + `JPEGImages/` | 🚧 | 🚧 | 1-based inclusive boxes, conversion policy configurable |
| **Classification / ImageNet** | class-named subdirectories, no annotation files | ✅ | 🚧 | Lexicographic directory order defines class ids |
| **labelme** (json) | `*.json` with `shapes`/`imagePath` | ✅ | — | Interop with labelme |

Legend: ✅ done · 🚧 in progress · — not planned

### Tech stack

| Layer | Choice |
| --- | --- |
| Desktop shell | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript + Vite 8 |
| UI | MUI v9 with Material Design 3 colour (Google's official HCT engine) |
| Annotation canvas | Konva / react-konva |
| State | zustand + immer |
| i18n | i18next (Simplified Chinese / English) |
| Tests | Vitest + Testing Library |

### Architecture

The core rule: **dataset parsing is written once, in TypeScript**, and shared by both the web and desktop builds — no divergent second implementation.

- Rust implements **no format parsers**. It exposes only format-agnostic commands (walk / read / write / image header).
- Images stream from disk through the Tauri asset protocol rather than being base64-encoded, and access is granted dynamically only for the folder the user actually opened.
- Parsing runs in a Web Worker so large files never block the UI.

See [中文 → 架构](#架构-architecture) for the diagram.

### Development

Requirements: Node.js ≥ 20, pnpm ≥ 9, Rust stable (desktop only).

```bash
pnpm install
pnpm dev          # web, http://localhost:1420
pnpm tauri dev    # desktop
pnpm test         # vitest
pnpm build        # static web build into dist/
pnpm tauri build  # desktop installers
```

### Roadmap

- [x] **M0** Scaffolding, MD3 theme, Tauri integration, CI
- [x] **M1** Unified data model, format detection, COCO / ImageFolder readers
- [x] **M2** Platform abstraction, dataset opening, image list
- [x] **M3** Viewer (zoom/pan, overlays for all four annotation types)
- [ ] **M4** Annotation editing, category management, undo/redo
- [ ] **M5** YOLO / VOC readers and writers, save & export, round-trip tests
- [ ] **M6** Polish, web deployment, docs and sample data
- [ ] **M7** Release v0.1.0 (installers for three platforms)

### Known limitations

- The current target is up to ~50k images and COCO JSON up to ~100 MB; larger datasets are not guaranteed to be smooth yet.
- The web build is read/write in Chrome / Edge (File System Access API) and read-only in Firefox / Safari.

---

## 贡献 Contributing

欢迎提交 Issue 与 Pull Request。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。
Issues and pull requests are welcome — please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## 许可证 License

[Apache-2.0](./LICENSE) © 2026 heshengtao
