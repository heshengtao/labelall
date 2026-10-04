//! Generic, format-agnostic filesystem commands.
//!
//! The Rust side deliberately knows nothing about COCO / YOLO / VOC / ImageFolder.
//! All dataset parsing lives in TypeScript (`src/core/formats`) so that the web
//! build and the desktop build share a single implementation. What Rust provides
//! is the part a browser cannot do well: fast directory walking, direct file IO,
//! and cheap image header reads.

use std::path::{Path, PathBuf};

use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use walkdir::WalkDir;

#[derive(Debug, thiserror::Error)]
pub enum CommandError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("image error: {0}")]
    Image(#[from] image::ImageError),
    #[error("path does not exist: {0}")]
    NotFound(String),
    #[error("{0}")]
    Other(String),
}

// Tauri commands must return a serializable error; a plain string keeps the
// frontend contract simple.
impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    /// Path relative to the dataset root, always using `/` separators.
    pub rel_path: String,
    pub is_dir: bool,
    pub size: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DatasetScan {
    pub root: String,
    pub entries: Vec<FileEntry>,
    pub total_files: usize,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextFile {
    pub path: String,
    pub contents: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageDims {
    pub width: u32,
    pub height: u32,
}

/// Normalise a path to forward slashes so it can be compared with the paths the
/// TypeScript parsers derive from dataset manifests.
fn to_forward_slashes(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

/// Walk a dataset directory and return every entry, sorted for determinism.
///
/// As a side effect the directory is added to the asset-protocol scope so that
/// `convertFileSrc` may serve images from it. Granting access here — rather than
/// with a blanket `"**"` scope in the config — means only folders the user
/// explicitly opened become readable.
#[tauri::command]
pub fn scan_dataset(app: AppHandle, root: String) -> Result<DatasetScan, CommandError> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(CommandError::NotFound(root));
    }

    if let Err(err) = app.asset_protocol_scope().allow_directory(&root_path, true) {
        return Err(CommandError::Other(format!(
            "failed to grant asset access to {root}: {err}"
        )));
    }

    let mut entries: Vec<FileEntry> = WalkDir::new(&root_path)
        .follow_links(false)
        .into_iter()
        .par_bridge()
        .filter_map(Result::ok)
        .filter(|entry| entry.path() != root_path)
        .filter_map(|entry| {
            let rel = entry.path().strip_prefix(&root_path).ok()?;
            let metadata = entry.metadata().ok();
            Some(FileEntry {
                rel_path: to_forward_slashes(rel),
                is_dir: entry.file_type().is_dir(),
                size: metadata.map(|m| m.len()).unwrap_or(0),
            })
        })
        .collect();

    entries.sort_by(|a, b| a.rel_path.cmp(&b.rel_path));
    let total_files = entries.iter().filter(|entry| !entry.is_dir).count();

    Ok(DatasetScan {
        root,
        entries,
        total_files,
    })
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, CommandError> {
    Ok(std::fs::read_to_string(path)?)
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), CommandError> {
    if let Some(parent) = Path::new(&path).parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, contents)?;
    Ok(())
}

/// Write many files at once — used when exporting YOLO/VOC datasets, where one
/// file is produced per image.
#[tauri::command]
pub fn write_text_files(files: Vec<TextFile>) -> Result<(), CommandError> {
    files
        .par_iter()
        .try_for_each(|file| -> Result<(), CommandError> {
            if let Some(parent) = Path::new(&file.path).parent() {
                std::fs::create_dir_all(parent)?;
            }
            std::fs::write(&file.path, &file.contents)?;
            Ok(())
        })?;
    Ok(())
}

/// Copy one file, creating the destination's parent directories. Used to bundle
/// the images into an exported dataset without pulling their bytes into the UI.
#[tauri::command]
pub fn copy_file(from: String, to: String) -> Result<(), CommandError> {
    if let Some(parent) = Path::new(&to).parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::copy(from, to)?;
    Ok(())
}

#[tauri::command]
pub fn ensure_dir(path: String) -> Result<(), CommandError> {
    std::fs::create_dir_all(path)?;
    Ok(())
}

/// Read just the header of an image to get its dimensions. Cheap enough to call
/// for datasets that provide no width/height metadata (e.g. ImageFolder).
#[tauri::command]
pub fn image_dimensions(path: String) -> Result<ImageDims, CommandError> {
    let (width, height) = image::image_dimensions(&path)?;
    Ok(ImageDims { width, height })
}
