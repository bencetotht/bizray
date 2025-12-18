use crate::error::{BizrayError, Result};
use reqwest::{Client, Method, RequestBuilder, Response};
use serde::{de::DeserializeOwned, Serialize};
use std::time::Duration;

#[derive(Clone)]
pub struct ApiClient {
    client: Client,
    base_url: String,
    token: Option<String>,
}

impl ApiClient {
    /// Create a new API client
    pub fn new(base_url: String, timeout_seconds: u64) -> Result<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(timeout_seconds))
            .connection_verbose(false)
            .build()
            .map_err(|e| BizrayError::NetworkError(e))?;

        Ok(Self {
            client,
            base_url,
            token: None,
        })
    }

    /// Set the authentication token
    pub fn set_token(&mut self, token: String) {
        self.token = Some(token);
    }

    /// Clear the authentication token
    pub fn clear_token(&mut self) {
        self.token = None;
    }

    /// Check if client has a token
    pub fn has_token(&self) -> bool {
        self.token.is_some()
    }

    /// Build a request with common headers
    fn build_request(&self, method: Method, path: &str) -> RequestBuilder {
        let url = format!("{}/api/v1{}", self.base_url, path);
        let mut req = self.client.request(method, &url);

        // Add authorization header if token is present
        if let Some(token) = &self.token {
            req = req.bearer_auth(token);
        }

        req
    }

    /// Send a request and handle the response
    async fn send_request<T: DeserializeOwned>(&self, req: RequestBuilder) -> Result<T> {
        let response = req.send().await.map_err(BizrayError::NetworkError)?;

        self.handle_response(response).await
    }

    /// Handle HTTP response and convert to typed result
    async fn handle_response<T: DeserializeOwned>(&self, response: Response) -> Result<T> {
        let status = response.status();

        if status.is_success() {
            response
                .json::<T>()
                .await
                .map_err(|e| BizrayError::ApiError(format!("Failed to parse response: {}", e)))
        } else {
            // Try to parse error response
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            // Try to parse as JSON error response
            if let Ok(error_resp) = serde_json::from_str::<super::models::ErrorResponse>(&error_text)
            {
                Err(BizrayError::from_http_response(
                    status.as_u16(),
                    error_resp.detail,
                ))
            } else {
                Err(BizrayError::from_http_response(
                    status.as_u16(),
                    error_text,
                ))
            }
        }
    }

    /// Perform a GET request
    pub async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        let req = self.build_request(Method::GET, path);
        self.send_request(req).await
    }

    /// Perform a POST request with JSON body
    pub async fn post<T: DeserializeOwned, B: Serialize>(
        &self,
        path: &str,
        body: &B,
    ) -> Result<T> {
        let req = self.build_request(Method::POST, path).json(body);
        self.send_request(req).await
    }

    /// Perform a PUT request with JSON body
    pub async fn put<T: DeserializeOwned, B: Serialize>(
        &self,
        path: &str,
        body: &B,
    ) -> Result<T> {
        let req = self.build_request(Method::PUT, path).json(body);
        self.send_request(req).await
    }

    /// Perform a DELETE request
    pub async fn delete(&self, path: &str) -> Result<()> {
        let req = self.build_request(Method::DELETE, path);
        let response = req.send().await.map_err(BizrayError::NetworkError)?;

        let status = response.status();
        if status.is_success() {
            Ok(())
        } else {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            Err(BizrayError::from_http_response(status.as_u16(), error_text))
        }
    }

    /// Perform a GET request with query parameters
    pub async fn get_with_query<T: DeserializeOwned>(
        &self,
        path: &str,
        params: &[(&str, String)],
    ) -> Result<T> {
        let req = self.build_request(Method::GET, path).query(params);
        self.send_request(req).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_client() {
        let client = ApiClient::new("https://api.example.com".to_string(), 30);
        assert!(client.is_ok());

        let client = client.unwrap();
        assert_eq!(client.base_url, "https://api.example.com");
        assert!(!client.has_token());
    }

    #[test]
    fn test_token_management() {
        let mut client =
            ApiClient::new("https://api.example.com".to_string(), 30).unwrap();

        assert!(!client.has_token());

        client.set_token("test-token".to_string());
        assert!(client.has_token());

        client.clear_token();
        assert!(!client.has_token());
    }
}
