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

### Changed

- Corrected the project name from "LableAll" to "LabelAll".

[Unreleased]: https://github.com/heshengtao/labelall/commits/main
