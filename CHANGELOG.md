# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2026-10-06

### Added

- **The export dialog remembers your configuration.** It reopens with the
  format, split ratios, random seed, folder layout and the copy-images /
  keep-unmatched switches from your last export, so a repeated export does not
  have to be reconfigured. A **Restore defaults** button clears the memory and
  falls back to the built-in defaults (and the default format from Settings).

## [0.4.0] - 2026-10-05

### Added

- **Split a dataset on export.** Deal the images into train / val / test at any
  ratio, with a reproducible random seed; a 0% split is simply left out, so you
  can export with no validation or test set. COCO, YOLO, MindYOLO and VOC also
  offer the standard content-first layout (`images/<split>/`, `labels/<split>/`,
  one root `data.yaml`) alongside the default split-first one (`<split>/images/…`).
- **MindYOLO import and export**: a `data.yaml` with per-split image-list `.txt`
  files, YOLO labels, and the eval `annotations/instances_<split>2017.json` that
  MindYOLO's `test.py` expects. A missing split list loads normally.
- **CSV import and export**: one row per annotation
  (`image,width,height,label,type,xmin,ymin,xmax,ymax,polygon,keypoints`).
- **labelme export** (boxes and polygons), matching the existing labelme reader.
- Multi-split import: a dataset spread across `instances_train/val/test.json` (or
  MindYOLO list files) merges into one dataset on open, and every reader now tags
  images with their split. Missing splits load without error.
- Exports land in a timestamped folder — `LabelAll_export/<format>/<timestamp>/` —
  so running an export twice never overwrites the first.

### Changed

- The default split ratio is now 70 / 20 / 10.
- YOLO / MindYOLO label paths for images that are not under `images/` are derived
  the way Ultralytics and MindYOLO do (a sibling `.txt`), so exported labels are
  found by those tools as well as by LabelAll.
- The bundled `examples/voc-mini` example grew from 3 to 10 images.

## [0.3.0] - 2026-10-04

### Added

- A per-class legend under the dataset header shows each class's colour and how
  many annotations it holds.
- The viewer remembers where you were in each dataset: reopening a dataset
  returns to the same image, and the image counter is now an input you can type a
  number into to jump straight to an image.
- Recent-dataset chips on the home screen each have an X to drop that entry from
  history.

### Changed

- Tool shortcuts are now `V` / `B` / `N` / `M`; nudging the selected annotation
  uses `W` / `A` / `S` / `D` (`Shift` for 10px); the arrow keys step between
  images (`←`/`→`) and cycle the active class (`↑`/`↓`).
- Drawing, moving, resizing and nudging a box, polygon or keypoint is clamped to
  the image, snapping to the edge instead of spilling outside it.
- The class-manager and keyboard-shortcuts buttons in the annotation toolbar now
  carry text labels, and the recently-opened list moved off the Settings dialog.

## [0.2.0] - 2026-10-04

### Added

- **Save back to the original dataset.** The new Save button and `Ctrl/Cmd+S`
  write your edits straight into the files the dataset was read from — COCO's
  JSON, YOLO's `labels/*.txt` plus its `data.yaml`, Pascal VOC's XMLs (each back
  to the path it came from, so XMLs sitting beside their images are not
  reorganised) and labelme's per-image JSONs (a labelme writer is new). A cleared
  YOLO label is written back as an empty file instead of being left stale.
- Unsaved-changes tracking: a dot on the Save button, and a save / discard /
  cancel prompt when the window is closed, the dataset is closed, or another
  dataset is opened.
- When a target format cannot represent something (VOC polygons, keypoints in
  VOC or labelme, ImageFolder's folder layout, …), saving lists the losses and
  asks for confirmation before it overwrites the originals.
- The web build can request write access for a folder it opened read-only — the
  “view files” option in Chrome's folder prompt returns a read-only handle — so
  Save and Export can be enabled with one click instead of failing silently.

### Changed

- Save and Export are disabled when the folder is genuinely read-only (a browser
  without the File System Access API) rather than failing after the fact.

### Fixed

- Web: clicking Save on a folder opened read-only used to fail with an error and
  no way to recover; the actual write permission is now queried and offered for
  escalation.

## [0.1.8] - 2026-10-04

### Changed

- Opening a large dataset no longer freezes the window: every filesystem command
  now runs off the UI thread, so scanning, parsing and the per-image lookups of
  VOC / YOLO / labelme imports stay responsive.
- Thumbnails in the grid and filmstrip are now decoded natively on the desktop
  build and only the small JPEG crosses into the webview, so a 2,500-image
  dataset no longer blanks its tiles or exhausts memory on low-RAM machines.
- Exporting with the images bundled in is much less laggy: progress is reported
  in ~1% steps instead of once per image, the dialog no longer recomputes its
  preview on every update, and copying uses a narrower window so the disk is not
  thrashed.

### Fixed

- Thumbnails could fall back to displaying full-resolution originals, which made
  the grid and filmstrip unusable on machines with little memory.

## [0.1.7] - 2026-10-04

### Added

- Export can bundle the images into the export folder (on by default), so the
  result is a self-contained dataset you can use directly. The switch can be
  turned off to write only the annotation files.
- The export dialog shows a progress bar while it writes the annotation files
  and copies the images.

## [0.1.6] - 2026-10-04

### Added

- Pick which classes to export: the export dialog now has a searchable
  multi-select, and the exported dataset contains only the selected classes and
  their annotations. Images without any selected class can optionally be kept as
  negative samples.
- Exports land in a `LabelAll_export/<format>/` folder **next to** the dataset
  instead of inside it, and the completion toast shows the full path with a
  one-click copy button.

### Changed

- Opening large VOC / YOLO / labelme datasets is much faster: annotation files
  are read with bounded concurrency instead of one at a time, and YOLO no longer
  looks up image sizes for images that carry no labels.
- The parse progress bar now advances while a multi-file dataset is read, instead
  of jumping from 0 to 100.
- The image grid and filmstrip load downscaled, cached thumbnails with bounded
  concurrency, keeping decode cost and memory low on large datasets.

## [0.1.5] - 2026-10-04

### Added

- A second Windows installer that bundles the full WebView2 runtime
  (`…-setup-offline.exe` / `…-offline.msi`), for intranet or air-gapped machines that cannot
  download it during setup. The regular Windows installer still fetches WebView2 on install and
  stays the auto-update target; the offline build is not published to `latest.json`.

## [0.1.4] - 2026-10-04

### Added

- The app version is now shown in Settings, so you can tell which build you are running.

### Changed

- Rebuilt the nine translated READMEs to match the redesigned English one: project hero and
  screenshots, live-demo / desktop-download / Docker links, and a "Run it" section covering the
  browser build, the installers and the multi-arch image.

## [0.1.3] - 2026-10-03

### Added

- Ten interface languages — Simplified and Traditional Chinese, English, Japanese, Korean,
  Spanish, French, German, Russian and Arabic — selectable from the header or Settings. Arabic
  switches the whole interface to a mirrored right-to-left layout.
- Translated READMEs for all ten languages, with a language switcher at the top of each.
- An MD3 right-click menu in the viewer (duplicate or delete an annotation; fit or deselect on the
  canvas) replacing the webview's own context menu.
- A Dockerfile and docker-compose for self-hosting the web build, and a workflow that publishes a
  multi-arch image (amd64 + arm64) to Docker Hub on a version tag; see DEPLOY.md.

### Changed

- The accent-colour picker now shows only the presets, while the category colour picker offers 24
  defaults (two rows of twelve) followed by the generated palette.
- Added a GitHub button to the header, and gave the export dialog's format select room for its
  label.
- The web build now uses the desktop app's icon (favicon, Apple touch icon and theme colour).

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

[Unreleased]: https://github.com/heshengtao/labelall/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/heshengtao/labelall/releases/tag/v0.4.1
[0.4.0]: https://github.com/heshengtao/labelall/releases/tag/v0.4.0
[0.3.0]: https://github.com/heshengtao/labelall/releases/tag/v0.3.0
[0.2.0]: https://github.com/heshengtao/labelall/releases/tag/v0.2.0
[0.1.8]: https://github.com/heshengtao/labelall/releases/tag/v0.1.8
[0.1.7]: https://github.com/heshengtao/labelall/releases/tag/v0.1.7
[0.1.6]: https://github.com/heshengtao/labelall/releases/tag/v0.1.6
[0.1.5]: https://github.com/heshengtao/labelall/releases/tag/v0.1.5
[0.1.4]: https://github.com/heshengtao/labelall/releases/tag/v0.1.4
[0.1.3]: https://github.com/heshengtao/labelall/releases/tag/v0.1.3
[0.1.2]: https://github.com/heshengtao/labelall/releases/tag/v0.1.2
[0.1.1]: https://github.com/heshengtao/labelall/releases/tag/v0.1.1
[0.1.0]: https://github.com/heshengtao/labelall/releases/tag/v0.1.0
