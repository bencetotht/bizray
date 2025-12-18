use crate::{
    api::{ApiClient, Company, CompanySummary, SearchResponse, User},
    config::Settings,
    error::Result,
    navigation::{Navigation, Screen},
    ui::components::InputState,
};
use std::collections::HashMap;

/// Message types for async operations
#[derive(Debug)]
pub enum AppMessage {
    /// Authentication successful
    AuthSuccess { token: String, user: User },
    /// Search results received
    SearchResults(SearchResponse),
    /// Company details received
    CompanyDetails(Company),
    /// User info updated
    UserUpdated(User),
    /// Operation completed successfully
    Success(String),
    /// Error occurred
    Error(String),
    /// Loading state changed
    Loading(bool),
}

/// Main application state
pub struct App {
    /// Configuration
    pub config: Settings,
    /// API client
    pub api_client: ApiClient,
    /// Navigation state
    pub navigation: Navigation,
    /// Current user (if authenticated)
    pub user: Option<User>,
    /// Whether to quit the application
    pub should_quit: bool,
    /// Loading state
    pub loading: bool,
    /// Status message to display
    pub status_message: Option<(String, MessageType)>,
    /// Screen states
    pub login_state: LoginState,
    pub register_state: RegisterState,
    pub search_state: SearchState,
    pub results_state: ResultsState,
    pub details_state: DetailsState,
    pub account_state: AccountState,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MessageType {
    Info,
    Success,
    Warning,
    Error,
}

/// Login screen state
#[derive(Default)]
pub struct LoginState {
    pub email: InputState,
    pub password: InputState,
    pub focused_field: usize, // 0 = email, 1 = password
}

/// Register screen state
#[derive(Default)]
pub struct RegisterState {
    pub username: InputState,
    pub email: InputState,
    pub password: InputState,
    pub focused_field: usize, // 0 = username, 1 = email, 2 = password
}

/// Search screen state
#[derive(Default)]
pub struct SearchState {
    pub query: InputState,
    pub selected_cities: Vec<String>,
    pub available_cities: Vec<String>,
    pub in_filter_mode: bool,
}

/// Search results state
pub struct ResultsState {
    pub companies: Vec<CompanySummary>,
    pub total: i32,
    pub current_page: usize,
    pub page_size: usize,
    pub selected_index: usize,
    pub scroll_offset: usize,
}

impl Default for ResultsState {
    fn default() -> Self {
        Self {
            companies: Vec::new(),
            total: 0,
            current_page: 1,
            page_size: 12,
            selected_index: 0,
            scroll_offset: 0,
        }
    }
}

impl ResultsState {
    pub fn total_pages(&self) -> usize {
        if self.total == 0 {
            0
        } else {
            ((self.total as usize - 1) / self.page_size) + 1
        }
    }

    pub fn can_go_next(&self) -> bool {
        self.current_page < self.total_pages()
    }

    pub fn can_go_previous(&self) -> bool {
        self.current_page > 1
    }
}

/// Company details screen state
#[derive(Default)]
pub struct DetailsState {
    pub company: Option<Company>,
    pub scroll_offset: usize,
    pub expanded_sections: HashMap<String, bool>, // section_name -> expanded
}

/// Account management screen state
#[derive(Default)]
pub struct AccountState {
    pub current_password: InputState,
    pub new_password: InputState,
    pub confirm_password: InputState,
    pub new_username: InputState,
    pub delete_confirmation: InputState,
    pub mode: AccountMode,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AccountMode {
    View,
    ChangePassword,
    ChangeUsername,
    DeleteAccount,
}

impl Default for AccountMode {
    fn default() -> Self {
        Self::View
    }
}

impl App {
    pub fn new(config: Settings) -> Result<Self> {
        let api_client = ApiClient::new(
            config.api.endpoint.clone(),
            config.api.timeout_seconds,
        )?;

        // Set token if present
        let mut api_client = api_client;
        if !config.auth.token.is_empty() {
            api_client.set_token(config.auth.token.clone());
        }

        // Determine initial screen based on authentication
        let initial_screen = if config.is_authenticated() {
            Screen::Search
        } else {
            Screen::Login
        };

        Ok(Self {
            config,
            api_client,
            navigation: Navigation::new(initial_screen),
            user: None,
            should_quit: false,
            loading: false,
            status_message: None,
            login_state: LoginState::default(),
            register_state: RegisterState::default(),
            search_state: SearchState::default(),
            results_state: ResultsState::default(),
            details_state: DetailsState::default(),
            account_state: AccountState::default(),
        })
    }

    /// Handle messages from async operations
    pub fn handle_message(&mut self, message: AppMessage) -> Result<()> {
        match message {
            AppMessage::AuthSuccess { token, user } => {
                self.api_client.set_token(token.clone());
                self.config.set_token(token)?;
                self.user = Some(user);
                self.navigation.reset(Screen::Search);
                self.set_success_message("Login successful!");
            }
            AppMessage::SearchResults(response) => {
                self.results_state.companies = response.companies;
                self.results_state.total = response.total;
                self.results_state.selected_index = 0;
                self.results_state.scroll_offset = 0;
                self.navigation.push(Screen::Results);
                self.loading = false;
            }
            AppMessage::CompanyDetails(company) => {
                self.details_state.company = Some(company);
                self.loading = false;
            }
            AppMessage::UserUpdated(user) => {
                self.user = Some(user);
                self.set_success_message("Account updated successfully!");
            }
            AppMessage::Success(msg) => {
                self.set_success_message(&msg);
            }
            AppMessage::Error(msg) => {
                self.set_error_message(&msg);
            }
            AppMessage::Loading(loading) => {
                self.loading = loading;
            }
        }
        Ok(())
    }

    /// Set a status message
    pub fn set_message(&mut self, message: String, msg_type: MessageType) {
        self.status_message = Some((message, msg_type));
    }

    pub fn set_success_message(&mut self, message: &str) {
        self.set_message(message.to_string(), MessageType::Success);
    }

    pub fn set_error_message(&mut self, message: &str) {
        self.set_message(message.to_string(), MessageType::Error);
    }

    pub fn set_info_message(&mut self, message: &str) {
        self.set_message(message.to_string(), MessageType::Info);
    }

    pub fn clear_message(&mut self) {
        self.status_message = None;
    }

    /// Logout current user
    pub fn logout(&mut self) -> Result<()> {
        self.user = None;
        self.api_client.clear_token();
        self.config.clear_token()?;
        self.navigation.reset(Screen::Login);
        self.set_info_message("Logged out successfully");
        Ok(())
    }

    /// Request quit
    pub fn quit(&mut self) {
        self.should_quit = true;
    }

    /// Check if user is authenticated
    pub fn is_authenticated(&self) -> bool {
        self.user.is_some() && self.api_client.has_token()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_results_state_pagination() {
        let mut state = ResultsState::default();
        state.total = 100;
        state.page_size = 12;
        state.current_page = 1;

        assert_eq!(state.total_pages(), 9); // 100 / 12 = 8.33 -> 9 pages
        assert!(state.can_go_next());
        assert!(!state.can_go_previous());

        state.current_page = 5;
        assert!(state.can_go_next());
        assert!(state.can_go_previous());

        state.current_page = 9;
        assert!(!state.can_go_next());
        assert!(state.can_go_previous());
    }

    #[test]
    fn test_results_state_empty() {
        let state = ResultsState::default();
        assert_eq!(state.total_pages(), 0);
        assert!(!state.can_go_next());
        assert!(!state.can_go_previous());
    }
}
