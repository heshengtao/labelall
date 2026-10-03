# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Ten interface languages — Simplified and Traditional Chinese, English, Japanese, Korean,
  Spanish, French, German, Russian and Arabic — selectable from the header or Settings. Arabic
  switches the whole interface to a mirrored right-to-left layout.
- Translated READMEs for all ten languages, with a language switcher at the top of each.
- An MD3 right-click menu in the viewer (duplicate or delete an annotation; fit or deselect on the
  canvas) replacing the webview's own context menu.
- A Dockerfile and docker-compose for self-hosting the web build, plus a Cloudflare Pages deploy
  workflow; see DEPLOY.md.

### Changed

- The accent-colour picker now shows only the presets, while the category colour picker offers 24
  defaults (two rows of twelve) followed by the generated palette.
- Added a GitHub button to the header, and gave the export dialog's format select room for its
  label.

## [0.1.2] - 2026-10-03

### Added

- A tiny bundled example dataset (`examples/voc-mini`, three real images in the
  canonical VOC layout) for trying the app, kept valid by a test.
- The colour picker gained a generated palette (twelve hues × four tones), and
  the accent presets are now 26 swatches filling two rows; the category palette
  grew to 21 default colours.
- Auto-update: the desktop app checks the latest GitHub release shortly after
  launch (and on demand from Settings), then downloads, installs and restarts in
  place. The release workflow signs the update bundles and publishes
  `latest.json`.

### Fixed

- Dragging an annotation now follows the pointer live, commits a single undoable
  move (or resize) on release, and no longer drags the whole canvas along with
  it — Konva's nested drag events were bubbling into the pan handler.
- Image-level class labels are toggled: the button shows whether the class is
  already on the image and removes it, instead of stacking duplicates.
- Deleting an annotation selects its neighbour, so the delete button no longer
  goes grey after a single use. The class panel's Add button no longer wraps,
  and the keypoint tool is disabled for classes without a keypoint schema.
- In the select tool, dragging the empty canvas now pans the view directly, and
  the pointer cursor reflects the current gesture (move, per-edge resize, pan).
- Annotation names are drawn as filled category-coloured chips with white text,
  the way annotation tools usually label them.
- Double-clicking a thumbnail in the grid opens that image in the viewer.
- The language menu ticks the active language instead of showing an empty icon
  slot.
- Drawing a box with no class selected silently did nothing; the first class is
  now chosen automatically.

## [0.1.1] - 2026-10-03

### Added

- Lenient import for every format: readers load what they can and report what
  they skipped instead of refusing to open the dataset, and the import problems
  (missing or unreadable files included) are shown in an MD3 dialog.
- Tolerant VOC detection: XML annotations that sit next to their images (often
  grouped in class folders) are now recognised, and offered alongside the
  classification-folder reading of the same dataset.
- YOLO detection also accepts label `.txt` files sitting next to their images,
  and COCO no longer requires a `categories` array.
- MD3 colour picker (preset palette + hex field), replacing the native colour
  input in settings and the class panel.

### Fixed

- The VOC reader now resolves each annotation's image to the file that actually
  exists in the dataset, instead of assuming a `JPEGImages/` directory.

## [0.1.0] - 2026-10-03

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

[Unreleased]: https://github.com/heshengtao/labelall/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/heshengtao/labelall/releases/tag/v0.1.2
[0.1.1]: https://github.com/heshengtao/labelall/releases/tag/v0.1.1
[0.1.0]: https://github.com/heshengtao/labelall/releases/tag/v0.1.0
