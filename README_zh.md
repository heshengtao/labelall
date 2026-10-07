<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="LabelAll — 直接从文件夹打开、查看并标注 COCO、YOLO、VOC 与 ImageFolder 图片数据集">
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="许可证：Apache-2.0"></a>
  <a href="../../releases"><img src="https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square" alt="最新版本"></a>
  <a href="https://hub.docker.com/r/ailm32442/labelall"><img src="https://img.shields.io/badge/docker-ailm32442%2Flabelall-2496ED.svg?logo=docker&logoColor=white" alt="Docker 镜像"></a>
</p>

<p align="center">
  <b><a href="https://labelall.superagentparty.com/">在线演示</a></b> ·
  <b><a href="../../releases">下载桌面版</a></b> ·
  <b><a href="#3-用-docker-运行">用 Docker 运行</a></b> ·
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
  <img src="./assets/readme/showcase.png" width="100%" alt="LabelAll 正在展示一个 Pascal VOC 数据集：图片列表、带类别与图层控件的标注工具栏，以及当前图片上绘制的两个矩形框。">
</p>

LabelAll 是一款**免费开源**的工具，用来打开、浏览、标注和导出市面上常见的图片数据集。无需格式转换，也没有工程文件要配置——选一个文件夹，直接读取其中已有的内容。

它适合计算机视觉工程师、数据标注与审核团队、学生和研究者，以及任何需要快速查看或修改一批图片标注的人。

## 它能做什么

**打开即用**

- 选一个文件夹即可，自动识别数据集格式。
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

- 一键导出为 COCO、YOLO、MindYOLO、Pascal VOC、分类文件夹、labelme 或 CSV 格式。
- 可按任意比例把数据集划分为训练 / 验证 / 测试集（随机种子可复现），每个子集写入独立子目录；比例为 0% 的子集直接省略，因此导出空验证集或空测试集也没问题。
- COCO / YOLO / MindYOLO / VOC 还可选择标准的「先图片标签」结构（`images/<split>/` + `labels/<split>/`，根目录单个 `data.yaml`）；两种结构都能被重新打开。
- 导出前会**明确告诉你目标格式无法保留什么**，并写到带时间戳的单独目录——原始文件绝不改动。

**用起来顺手**

- 深色 / 浅色主题，主题色与调色板可自定义。
- 十种界面语言（含从右到左的阿拉伯语）；桌面端支持自动更新，网页版体验一致。

<p align="center">
  <img src="./assets/readme/showcase-more.png" width="100%" alt="左：LabelAll 以 100% 置信度识别出一个 Pascal VOC 数据集。右：同一张标注图片的深色主题。">
</p>

## 支持的数据集

| 格式 | 打开 | 导出 | 说明 |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | 含多边形与 RLE 分割、关键点；打开时自动合并 `instances_train/val/test.json` 划分文件 |
| **YOLO** | ✅ | ✅ | 检测 / 分割 / 姿态三种任务 |
| **MindYOLO** | ✅ | ✅ | `data.yaml`、按子集的图片清单 `.txt`、YOLO 标签，以及评估用的 `annotations/instances_<split>2017.json`；图片与标签会重命名为纯数字文件名（MindYOLO 评估所必需）；缺少某个子集也能正常加载 |
| **Pascal VOC** | ✅ | ✅ | 1 基坐标；XML 与图片同级或在 `Annotations/` 中 |
| **分类文件夹 / ImageNet** | ✅ | 部分 | 目录名即类别名 |
| **labelme** | ✅ | ✅ | 矩形框与多边形 |
| **CSV** | ✅ | ✅ | 每行一个标注：`image,width,height,label,type,xmin,ymin,xmax,ymax,polygon,keypoints` |

> 也可直接打开 MS COCO、ImageNet / ILSVRC、Pascal VOC 2007/2012 等公开数据集的原始格式。

## 运行方式

LabelAll 有三种使用方式，全部都在你自己的机器上运行——应用**没有后端**，打开的图片和标注不会上传到任何地方。

### 1. 在浏览器中试用

打开 **<https://labelall.superagentparty.com/>**，选择一个数据集文件夹即可，无需安装。

> 网页版依赖浏览器的文件系统访问 API，因此必须通过 **HTTPS**（或 `localhost`）访问。**Chrome / Edge** 可读可写；**Firefox / Safari** 只能以只读方式打开数据集。

### 2. 安装桌面应用

在 [Releases](../../releases) 页面下载对应系统的安装包——**macOS、Windows 和 Linux**。推荐用桌面版做标注，因为它始终能写回磁盘。

> **macOS 首次打开**：安装包未做 Apple 公证。若提示「已损坏」或「无法验证开发者」，请在终端执行 `xattr -cr /Applications/LabelAll.app` 后再打开，或右键点击 App 选择「打开」。

### 3. 用 Docker 运行

网页版本质上是一份静态构建产物，所以镜像就是 `nginx` 加上编译好的应用。已发布的镜像支持多架构（`linux/amd64` 和 `linux/arm64`）：

```bash
docker run --rm -p 8080:80 ailm32442/labelall:latest
```

然后打开 <http://localhost:8080>。

也可以从源码自行构建：

```bash
docker build -t labelall .
docker run --rm -p 8080:80 labelall

# 或
docker compose up -d --build
```

> 推送版本标签（`git tag v0.1.3 && git push origin v0.1.3`）时，标签会自动构建并推送到 Docker Hub，生成语义化版本标签以及 `latest`。Docker Hub 配置与其他托管方式（Cloudflare Pages、Netlify、Vercel 等）见 [DEPLOY.md](./DEPLOY.md)。

## 快速上手

1. 打开 LabelAll，点击「打开数据集」，选择数据集文件夹。
2. 确认识别出的格式，开始浏览。
3. 新增或修改标注，再导出为需要的格式。

> 想先试试？[`examples/voc-mini`](./examples/voc-mini) 是一个 10 张图的小型 Pascal VOC 数据集，直接打开即可。

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 上一张 / 下一张 | `←` / `→` |
| 切换当前类别 | `↑` / `↓` |
| 选择/移动 · 画框 · 多边形 · 关键点 | `V` · `B` · `N` · `M` |
| 微调选中标注 | `W A S D`（按住 `Shift` 每次 10px） |
| 删除 / 复制 | `Delete` / `Ctrl`·`Cmd` + `D` |
| 撤销 / 重做 | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| 放大 / 缩小 / 适应窗口 | `+` / `-` / `0` |
| 平移画布 | 拖动空白处，或 `空格` + 拖拽 |

## 已知限制

- 面向约 5 万张图片、标注文件不超过 100 MB 的数据集；更大规模暂不保证流畅。
- 网页版在 Chrome / Edge 可读写，Firefox / Safari 仅支持只读。
- 导出会写出标注文件；勾选“复制图片”时会一并复制图片。

## 参与贡献与许可

欢迎提交 Issue 与 Pull Request，详见 [CONTRIBUTING.md](./CONTRIBUTING.md)；打包发布见 [RELEASING.md](./RELEASING.md)。[Apache-2.0](./LICENSE) © 2026 heshengtao。
