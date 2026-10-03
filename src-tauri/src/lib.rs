mod commands;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::scan_dataset,
            commands::read_text_file,
            commands::write_text_file,
            commands::write_text_files,
            commands::ensure_dir,
            commands::image_dimensions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running LabelAll");
}
