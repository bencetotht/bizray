use super::client::ApiClient;
use super::models::{
    AuthResponse, LoginRequest, PasswordChangeRequest, RegisterRequest, User,
    UsernameChangeRequest,
};
use crate::error::Result;

impl ApiClient {
    /// Register a new user
    pub async fn register(
        &self,
        username: &str,
        email: &str,
        password: &str,
    ) -> Result<AuthResponse> {
        let body = RegisterRequest {
            username: username.to_string(),
            email: email.to_string(),
            password: password.to_string(),
        };

        self.post("/auth/register", &body).await
    }

    /// Login with email and password
    pub async fn login(&self, email: &str, password: &str) -> Result<AuthResponse> {
        let body = LoginRequest {
            email: email.to_string(),
            password: password.to_string(),
        };

        self.post("/auth/login", &body).await
    }

    /// Get current user information
    pub async fn get_me(&self) -> Result<User> {
        self.get("/auth/me").await
    }

    /// Change password
    pub async fn change_password(
        &self,
        current_password: &str,
        new_password: &str,
    ) -> Result<()> {
        let body = PasswordChangeRequest {
            current_password: current_password.to_string(),
            new_password: new_password.to_string(),
        };

        let _: serde_json::Value = self.put("/auth/password", &body).await?;
        Ok(())
    }

    /// Change username
    pub async fn change_username(&self, username: &str) -> Result<User> {
        let body = UsernameChangeRequest {
            username: username.to_string(),
        };

        self.put("/auth/username", &body).await
    }

    /// Delete current user account
    pub async fn delete_account(&self) -> Result<()> {
        self.delete("/auth/profile").await
    }

    /// Toggle subscription (between registered and subscriber roles)
    pub async fn toggle_subscription(&self) -> Result<User> {
        let _: serde_json::Value = self.post("/auth/subscription/toggle", &()).await?;
        // Return updated user info
        self.get_me().await
    }
}
