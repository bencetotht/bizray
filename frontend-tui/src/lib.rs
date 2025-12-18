// Core modules
pub mod app;
pub mod config;
pub mod error;
pub mod navigation;

// API modules
pub mod api;

// UI modules
pub mod ui;

// Re-exports
pub use app::{App, AppMessage};
pub use config::Settings;
pub use error::{BizrayError, Result};
pub use navigation::{Navigation, Screen};
