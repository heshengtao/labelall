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

[Unreleased]: https://github.com/heshengtao/lableall/commits/main
