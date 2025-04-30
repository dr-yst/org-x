// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod orgmode;
pub mod api;
#[cfg(debug_assertions)]
pub mod test_datetime;

// Generate TypeScript bindings using the Builder pattern from tauri-specta
#[cfg(debug_assertions)]
fn generate_ts_bindings() {
    use tauri_specta::{Builder, collect_commands};
    use specta_typescript::Typescript;
    
    let builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            api::get_sample_org,
            api::parse_org_content,
            api::run_datetime_test,
        ]);
    
    builder
        .export(
            Typescript::default()
                .formatter(specta_typescript::formatter::prettier)
                .header("/* eslint-disable */"),
            "../src/lib/bindings.ts",
        )
        .expect("Failed to export TypeScript bindings");
}

// No-op in release mode
#[cfg(not(debug_assertions))]
fn generate_ts_bindings() {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Generate TypeScript bindings
    generate_ts_bindings();
    
    // Create a new Builder for the Tauri commands
    use tauri_specta::{Builder, collect_commands};
    
    let builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            api::get_sample_org,
            api::parse_org_content,
            api::run_datetime_test,
        ]);
    
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
