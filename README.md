<div align="center">

# LabelAll

**Load, view and annotate common image datasets**

Opening and labelling an image dataset should be as easy as picking a folder.

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

## What is LabelAll

LabelAll is a **free, open-source** tool for opening, browsing, annotating and exporting common
image datasets.

No code, no format conversion first, no hunting for the annotation files — pick a folder and it
takes care of the rest. It is for computer-vision engineers, annotation and QA teams, students and
researchers, and anyone who needs to look at or edit a batch of image labels quickly.

## What it does

**Open and go**

- Pick a folder: the format is detected automatically, no setup.
- Forgiving reading: broken, missing or non-standard files are skipped and summarised in a dialog,
  so one bad file never blocks the whole dataset.
- A thumbnail list that stays smooth with tens of thousands of images.
- Filter by split (train / val / test) or class, and search by file name; double-click a thumbnail
  to open it in the viewer.

**See clearly**

- Zoom and pan freely, fit to window or inspect at 1:1.
- Boxes, polygons, keypoints and classification tags overlay cleanly, labelled with
  category-coloured chips and coloured by class.
- Toggle any layer on or off; step through images with the arrow keys or the filmstrip.

**Annotate and edit**

- Draw boxes, polygons and keypoints, or add an image-level class label.
- Drag to move, resize with eight handles, duplicate, delete, nudge pixel by pixel, and use the
  right-click menu for quick actions.
- Add, rename, recolour or remove classes at any time; undo and redo whenever you need.

**Export and interop**

- Export to COCO, YOLO, Pascal VOC or classification folders in one step.
- Before exporting, LabelAll **tells you exactly what the target format cannot keep**, and writes
  into a separate folder — your original files are never modified.

**A pleasure to use**

- Light and dark themes with a customisable accent colour and palette.
- Ten interface languages (including right-to-left Arabic); the desktop app updates itself, and
  the web build feels the same.

## Supported datasets

| Format | Open | Export | Notes |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | Polygon and RLE segmentation, keypoints |
| **YOLO** | ✅ | ✅ | Detect, segment and pose tasks |
| **Pascal VOC** | ✅ | ✅ | 1-based boxes, XML next to images or in `Annotations/` |
| **Classification / ImageNet** | ✅ | Partial | The folder name is the class |
| **labelme** | ✅ | — | Interop with labelme |

> MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 and other public datasets can be opened in their
> native format.

## Quick start

1. Open LabelAll and click “Open dataset”, then choose the dataset folder.
2. Confirm the detected format and start browsing.
3. Add or edit annotations, then export to the format you want.

| Action | Shortcut |
| --- | --- |
| Previous / next image | `←` / `→` |
| Select / move · Draw a box · Polygon · Keypoints | `V` · `B` · `P` · `K` |
| Nudge the selected annotation | `Arrows` (hold `Shift` for 10px) |
| Delete / duplicate selection | `Delete` / `Ctrl`·`Cmd` + `D` |
| Undo / redo | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| Zoom in / out / fit | `+` / `-` / `0` |
| Pan the canvas | Drag the empty canvas, or `Space` + drag |

> Want to try it first? [`examples/voc-mini`](./examples/voc-mini) is a three-image Pascal VOC
> dataset — open it directly.

## Download

Grab the installer for your system from the [Releases](../../releases) page (macOS / Windows /
Linux), or run the web build with `docker compose up -d --build` (see [DEPLOY.md](./DEPLOY.md)).

> **First launch on macOS**: the build is not notarized. If macOS says the app is “damaged” or cannot
> verify the developer, run `xattr -cr /Applications/LabelAll.app` in Terminal, then open it — or
> right-click the app and choose “Open”.

## Known limitations

- Aimed at datasets of up to ~50k images with annotation files under 100 MB; larger ones are not
  guaranteed to stay smooth yet.
- The web build is read/write in Chrome / Edge and read-only in Firefox / Safari.
- Export writes annotation files only; images are not copied.

## Contributing and license

Issues and pull requests are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md), and
[RELEASING.md](./RELEASING.md) for release builds. [Apache-2.0](./LICENSE) © 2026 heshengtao.
