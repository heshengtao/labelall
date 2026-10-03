# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffolding: React 19 + TypeScript + Vite 8 frontend, Tauri 2 desktop shell.
- Material Design 3 theming for MUI v9, with light/dark colour schemes generated
  from a single seed colour using Google's official HCT colour utilities.
- Simplified Chinese and English localisation with a runtime language switcher.
- Generic, format-agnostic Rust commands: `scan_dataset`, `read_text_file`,
  `write_text_file`, `write_text_files`, `ensure_dir`, `image_dimensions`.
- Dynamic asset-protocol scoping so only folders the user opens become readable.
- Tooling: oxlint, Prettier, Vitest with Testing Library, GitHub Actions CI.
- Documentation: README (bilingual), CONTRIBUTING, LICENSE (Apache-2.0).
- Platform-agnostic core (`src/core`): unified dataset model, geometry helpers,
  category palette and automatic format detection.
- COCO, classification/ImageFolder and labelme readers, with fixtures and unit
  tests covering RLE masks, keypoints and multi-class datasets.
- `DatasetSource` platform abstraction with Tauri and File System Access API
  implementations, plus an `<input webkitdirectory>` fallback for Firefox/Safari.
- Open-dataset wizard: folder picker, format detection with confidence, and an
  explicit confirmation step before parsing.
- Parsing runs in a Web Worker, streaming file reads back to the main thread.
- Virtualised thumbnail image list with split/class filters and filename search.
- Konva viewer: wheel zoom anchored at the cursor, space/middle-drag pan, fit and
  1:1 controls, and keyboard navigation (←/→ images, +/- zoom, 0 fit).
- Overlays for boxes, polygons, keypoints (with skeletons) and crowd masks,
  coloured per category, with click/hover selection and per-layer visibility.
- Bottom filmstrip for stepping through nearby images.
- Annotation editing: draw boxes, polygons and keypoints, add image-level class
  labels, then move, resize (8 handles), duplicate, delete or nudge annotations.
- Class management panel (add / rename / recolour / delete) and a keyboard
  shortcut reference.
- Undo/redo backed by immer patches, with Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z.
- YOLO (detect / segment / pose) and Pascal VOC readers and writers, plus COCO
  and ImageFolder writers, all with round-trip tests.
- Export dialog that lists the exact data a target format cannot represent, and
  writes into `export/<format>/` without touching the originals.
- Image-dimension plumbing so normalised formats (YOLO) can be read in the
  worker, on both desktop and web.
- Settings dialog with a live MD3 accent-colour picker, a default export format
  and a recent-datasets list (desktop reopens them directly).
- Cancelling an in-flight scan or parse.
- A locale-parity test that fails if zh-CN and en-US drift apart.
- Release workflow that builds macOS / Windows / Linux installers and drafts a
  GitHub release when a version tag is pushed (see RELEASING.md).

### Changed

- Corrected the project name from "LableAll" to "LabelAll".

[Unreleased]: https://github.com/heshengtao/labelall/commits/main
