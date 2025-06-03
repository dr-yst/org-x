// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod orgmode;
pub mod api;
pub mod settings;
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
            api::start_file_monitoring,
            api::stop_file_monitoring,
            api::get_all_documents,
            api::get_org_document_by_id,
            api::get_org_document_display_title_by_id,
            api::get_org_document_path_by_id,
            api::load_user_settings,
            api::save_user_settings,
            api::add_monitored_path,
            api::remove_monitored_path,
            api::update_monitored_path,
            api::set_path_parse_enabled,
            api::clear_user_settings,
            api::check_path_monitoring_status,
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
    
    #[cfg(debug_assertions)]
    let builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            api::get_sample_org,
            api::parse_org_content,
            api::run_datetime_test,
            api::start_file_monitoring,
            api::stop_file_monitoring,
            api::get_all_documents,
            api::get_org_document_by_id,
            api::get_org_document_display_title_by_id,
            api::get_org_document_path_by_id,
            api::load_user_settings,
            api::save_user_settings,
            api::add_monitored_path,
            api::remove_monitored_path,
            api::update_monitored_path,
            api::set_path_parse_enabled,
            api::clear_user_settings,
            api::check_path_monitoring_status,
        ]);
    
    #[cfg(not(debug_assertions))]
    let builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            api::get_sample_org,
            api::parse_org_content,
            api::start_file_monitoring,
            api::stop_file_monitoring,
            api::get_all_documents,
            api::get_org_document_by_id,
            api::get_org_document_display_title_by_id,
            api::get_org_document_path_by_id,
            api::load_user_settings,
            api::save_user_settings,
            api::add_monitored_path,
            api::remove_monitored_path,
            api::update_monitored_path,
            api::set_path_parse_enabled,
            api::clear_user_settings,
            api::check_path_monitoring_status,
        ]);
    
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
