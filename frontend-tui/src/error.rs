use thiserror::Error;

#[derive(Error, Debug)]
pub enum BizrayError {
    #[error("Authentication failed: {0}")]
    AuthError(String),

    #[error("API request failed: {0}")]
    ApiError(String),

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("Configuration error: {0}")]
    ConfigError(#[from] config::ConfigError),

    #[error("Invalid input: {0}")]
    ValidationError(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("JSON parsing error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("TOML error: {0}")]
    TomlError(#[from] toml::de::Error),

    #[error("HTTP error {status}: {message}")]
    HttpError { status: u16, message: String },

    #[error("Token expired or invalid")]
    TokenExpired,

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Rate limit exceeded. Please try again later")]
    RateLimitExceeded,

    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type Result<T> = std::result::Result<T, BizrayError>;

impl BizrayError {
    /// Convert HTTP status code and message to appropriate error
    pub fn from_http_response(status: u16, message: String) -> Self {
        match status {
            401 => Self::TokenExpired,
            403 => Self::PermissionDenied(message),
            404 => Self::NotFound(message),
            429 => Self::RateLimitExceeded,
            400..=499 => Self::ApiError(message),
            500..=599 => Self::HttpError { status, message },
            _ => Self::Unknown(format!("HTTP {}: {}", status, message)),
        }
    }

    /// Get a user-friendly error message for display in the TUI
    pub fn user_message(&self) -> String {
        match self {
            Self::AuthError(msg) => format!("Authentication failed: {}", msg),
            Self::ApiError(msg) => format!("API error: {}", msg),
            Self::NetworkError(_) => {
                "Network error. Please check your connection.".to_string()
            }
            Self::ConfigError(_) => "Configuration error. Please check your config file.".to_string(),
            Self::ValidationError(msg) => format!("Invalid input: {}", msg),
            Self::TokenExpired => "Your session has expired. Please log in again.".to_string(),
            Self::PermissionDenied(msg) => format!("Access denied: {}", msg),
            Self::NotFound(msg) => format!("Not found: {}", msg),
            Self::RateLimitExceeded => {
                "Too many requests. Please wait a moment and try again.".to_string()
            }
            Self::HttpError { status, message } => {
                format!("Server error ({}): {}", status, message)
            }
            Self::IoError(e) => format!("File error: {}", e),
            Self::JsonError(_) => "Data format error. Please try again.".to_string(),
            Self::TomlError(_) => "Config file format error.".to_string(),
            Self::Unknown(msg) => format!("Error: {}", msg),
        }
    }

    /// Check if the error is recoverable (user can retry)
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            Self::NetworkError(_)
                | Self::RateLimitExceeded
                | Self::HttpError { status: 500..=599, .. }
        )
    }

    /// Check if the error requires re-authentication
    pub fn requires_reauth(&self) -> bool {
        matches!(self, Self::TokenExpired | Self::AuthError(_))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_http_response() {
        let err = BizrayError::from_http_response(401, "Unauthorized".to_string());
        assert!(matches!(err, BizrayError::TokenExpired));

        let err = BizrayError::from_http_response(403, "Forbidden".to_string());
        assert!(matches!(err, BizrayError::PermissionDenied(_)));

        let err = BizrayError::from_http_response(404, "Not Found".to_string());
        assert!(matches!(err, BizrayError::NotFound(_)));

        let err = BizrayError::from_http_response(429, "Rate limit".to_string());
        assert!(matches!(err, BizrayError::RateLimitExceeded));

        let err = BizrayError::from_http_response(500, "Server error".to_string());
        assert!(matches!(err, BizrayError::HttpError { .. }));
    }

    #[test]
    fn test_is_recoverable() {
        let err = BizrayError::RateLimitExceeded;
        assert!(err.is_recoverable());

        let err = BizrayError::TokenExpired;
        assert!(!err.is_recoverable());
    }

    #[test]
    fn test_requires_reauth() {
        let err = BizrayError::TokenExpired;
        assert!(err.requires_reauth());

        let err = BizrayError::AuthError("Invalid credentials".to_string());
        assert!(err.requires_reauth());

        let err = BizrayError::NetworkError(
            reqwest::Error::new(reqwest::StatusCode::SERVICE_UNAVAILABLE, "test")
        );
        assert!(!err.requires_reauth());
    }
}
