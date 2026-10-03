# Contributing to LabelAll

Thanks for taking the time to contribute. This document covers the essentials —
setup, conventions, and how to get a change merged.

## Getting started

Requirements:

- Node.js ≥ 20
- pnpm ≥ 9 (`corepack enable` is the easiest way to get it)
- Rust stable, only if you are touching the desktop shell

```bash
pnpm install
pnpm dev        # web build at http://localhost:1420
pnpm tauri dev  # desktop window
```

## Before you open a pull request

Run the same checks CI runs, and make sure they pass:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build

# Only if you changed anything under src-tauri/
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

If `format:check` fails, run `pnpm format`.

## Project layout

| Path | What belongs here |
| --- | --- |
| `src/core/` | Platform-agnostic logic: the unified data model and every format reader/writer. Pure TypeScript, no DOM and no Tauri imports. |
| `src/platform/` | The `DatasetSource` abstraction plus its Tauri and web implementations. All environment differences live here. |
| `src/features/` | UI features (viewer, annotator, image list, export …). |
| `src/components/` | Small shared presentational components. |
| `src/theme/` | Material Design 3 colour generation and the MUI theme. |
| `src-tauri/` | The Rust shell. Generic filesystem commands only. |

## Architecture rules

These are load-bearing; please do not break them without discussing it first.

1. **Parsing is written once, in TypeScript.** Do not add COCO/YOLO/VOC parsing to
   Rust. Two implementations would drift apart and double the maintenance cost.
2. **Rust stays format-agnostic.** `src-tauri/src/commands.rs` should only ever
   contain generic operations (walk a tree, read/write a file, read image
   dimensions). If a command name mentions a dataset format, it is in the wrong place.
3. **`src/core/` must not import from `src/platform/` or from `@tauri-apps/*`.**
   It has to stay runnable in a plain browser and in Node during tests.
4. **The UI talks to `DatasetSource`, never to Tauri directly.** That is what keeps
   the single frontend usable in both the desktop app and the web build.
5. **`category`/coordinate quirks belong in the readers/writers.** The internal
   model uses one convention: absolute pixels, 0-based, top-left origin.

## Coding conventions

- TypeScript in strict mode; avoid `any` (lint warns on it).
- Formatting is owned by Prettier (`.prettierrc`) — no style debates, just run it.
- Linting is oxlint (`.oxlintrc.json`).
- Prefer named exports for modules with several exports; keep default exports for
  React page/shell components.
- Comments should explain *why*, not restate *what*. Do not add comments to code
  you did not otherwise change.

## Tests

- Put unit tests next to the code as `*.test.ts` / `*.test.tsx`.
- Format readers and writers must have round-trip tests, and any known lossy
  conversion has to be asserted (and mirrored in `src/core/formats/losses.ts`).
- Fixtures live under `test/fixtures/`; keep them tiny and hand-written.

## Commits and pull requests

- Keep commits focused; a single logical change per commit.
- Write commit messages in the imperative mood ("add COCO RLE decoding", not "added").
- Describe the motivation in the PR body, and note any behaviour that changed.
- New features should come with tests and, where user-visible, a README update.

## Reporting bugs

Please include: what you did, what you expected, what happened, your OS, and the
dataset format involved. If you can share a minimal dataset that reproduces it,
that is enormously helpful.

## License

By contributing you agree that your contributions are licensed under the
[Apache License 2.0](./LICENSE).
