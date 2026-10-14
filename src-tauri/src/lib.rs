pub mod commands;
pub mod hardware;
pub mod kiosk;
pub mod services;

use commands::{get_hardware_status, get_machine_information, get_system_time, print_ticket_native};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    kiosk::init();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_machine_information,
            get_hardware_status,
            print_ticket_native,
            get_system_time
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
