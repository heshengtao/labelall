mod commands;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // The main window is built here instead of from the config so its
            // chrome can follow the host platform: on macOS an overlay title bar
            // lets the app's own top bar run to the window edge behind the
            // traffic lights, and on Windows/Linux the frame is dropped entirely
            // in favour of the in-app window controls.
            let config = &app.config().app.windows[0];
            let mut builder = tauri::WebviewWindowBuilder::from_config(app.handle(), config)?;

            #[cfg(target_os = "macos")]
            {
                builder = builder
                    .title_bar_style(tauri::TitleBarStyle::Overlay)
                    .hidden_title(true);
            }

            #[cfg(any(target_os = "windows", target_os = "linux"))]
            {
                builder = builder.decorations(false);
            }

            let window = builder.build()?;
            window.show()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::scan_dataset,
            commands::read_text_file,
            commands::write_text_file,
            commands::write_text_files,
            commands::copy_file,
            commands::ensure_dir,
            commands::image_dimensions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running LabelAll");
}
