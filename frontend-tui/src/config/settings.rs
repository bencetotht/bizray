use config::{Config, ConfigError, File};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Settings {
    pub api: ApiConfig,
    pub auth: AuthConfig,
    pub ui: UiConfig,
    #[serde(default)]
    pub cache: CacheConfig,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ApiConfig {
    #[serde(default = "default_api_endpoint")]
    pub endpoint: String,
    #[serde(default = "default_timeout")]
    pub timeout_seconds: u64,
}

#[derive(Debug, Deserialize, Serialize, Clone, Default)]
pub struct AuthConfig {
    #[serde(default)]
    pub token: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct UiConfig {
    #[serde(default = "default_page_size")]
    pub page_size: usize,
    #[serde(default = "default_show_hints")]
    pub show_hints: bool,
    #[serde(default = "default_theme")]
    pub theme: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CacheConfig {
    #[serde(default = "default_enable_cache")]
    pub enable_cache: bool,
    #[serde(default = "default_ttl")]
    pub ttl_seconds: u64,
}

// Default values
fn default_api_endpoint() -> String {
    "https://apibizray.bnbdevelopment.hu".to_string()
}

fn default_timeout() -> u64 {
    30
}

fn default_page_size() -> usize {
    12
}

fn default_show_hints() -> bool {
    true
}

fn default_theme() -> String {
    "default".to_string()
}

fn default_enable_cache() -> bool {
    true
}

fn default_ttl() -> u64 {
    300
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            api: ApiConfig {
                endpoint: default_api_endpoint(),
                timeout_seconds: default_timeout(),
            },
            auth: AuthConfig::default(),
            ui: UiConfig {
                page_size: default_page_size(),
                show_hints: default_show_hints(),
                theme: default_theme(),
            },
            cache: CacheConfig {
                enable_cache: default_enable_cache(),
                ttl_seconds: default_ttl(),
            },
        }
    }
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            enable_cache: default_enable_cache(),
            ttl_seconds: default_ttl(),
        }
    }
}

impl Settings {
    /// Load settings from config file or create default
    pub fn new() -> Result<Self, ConfigError> {
        let config_path = Self::config_path()?;

        // If config doesn't exist, create it with defaults
        if !config_path.exists() {
            let default_settings = Self::default();
            if let Err(e) = default_settings.save() {
                eprintln!("Warning: Could not save default config: {}", e);
            }
            return Ok(default_settings);
        }

        // Load from file
        let config = Config::builder()
            .add_source(File::from(config_path))
            .add_source(config::Environment::with_prefix("BIZRAY"))
            .build()?;

        config.try_deserialize()
    }

    /// Get the path to the config file
    pub fn config_path() -> Result<PathBuf, ConfigError> {
        let proj_dirs = ProjectDirs::from("com", "bizray", "bizray-tui").ok_or_else(|| {
            ConfigError::Message("Could not determine config directory".to_string())
        })?;

        let config_dir = proj_dirs.config_dir();
        std::fs::create_dir_all(config_dir).map_err(|e| {
            ConfigError::Message(format!("Could not create config directory: {}", e))
        })?;

        Ok(config_dir.join("config.toml"))
    }

    /// Save settings to config file
    pub fn save(&self) -> Result<(), ConfigError> {
        let path = Self::config_path()?;
        let toml = toml::to_string_pretty(self)
            .map_err(|e| ConfigError::Message(format!("Could not serialize config: {}", e)))?;

        std::fs::write(&path, toml).map_err(|e| {
            ConfigError::Message(format!("Could not write config file: {}", e))
        })?;

        // Set restrictive permissions on Unix systems
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(&path)
                .map_err(|e| ConfigError::Message(format!("Could not read file metadata: {}", e)))?
                .permissions();
            perms.set_mode(0o600); // rw------- (owner read/write only)
            std::fs::set_permissions(&path, perms).map_err(|e| {
                ConfigError::Message(format!("Could not set file permissions: {}", e))
            })?;
        }

        Ok(())
    }

    /// Update the auth token and save
    pub fn set_token(&mut self, token: String) -> Result<(), ConfigError> {
        self.auth.token = token;
        self.save()
    }

    /// Clear the auth token and save
    pub fn clear_token(&mut self) -> Result<(), ConfigError> {
        self.auth.token.clear();
        self.save()
    }

    /// Check if user is authenticated
    pub fn is_authenticated(&self) -> bool {
        !self.auth.token.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = Settings::default();
        assert_eq!(
            settings.api.endpoint,
            "https://apibizray.bnbdevelopment.hu"
        );
        assert_eq!(settings.api.timeout_seconds, 30);
        assert_eq!(settings.ui.page_size, 12);
        assert!(settings.ui.show_hints);
        assert_eq!(settings.ui.theme, "default");
        assert!(settings.cache.enable_cache);
        assert_eq!(settings.cache.ttl_seconds, 300);
    }

    #[test]
    fn test_is_authenticated() {
        let mut settings = Settings::default();
        assert!(!settings.is_authenticated());

        settings.auth.token = "some-token".to_string();
        assert!(settings.is_authenticated());
    }
}
