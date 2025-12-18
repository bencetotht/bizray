use bizray_tui::{App, AppMessage, Result, Screen, Settings};
use crossterm::{
    event::{self, Event, KeyCode, KeyEvent, KeyModifiers},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{backend::CrosstermBackend, Frame, Terminal};
use std::{io, time::Duration};
use tokio::sync::mpsc;

use bizray_tui::ui::{screens, Theme};

#[tokio::main]
async fn main() -> Result<()> {
    // Load configuration
    let settings = Settings::new()?;

    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Create app
    let mut app = App::new(settings)?;

    // Create message channel for async operations
    let (tx, mut rx) = mpsc::unbounded_channel();

    // Create theme
    let theme = Theme::from_name(&app.config.ui.theme);

    // Main event loop
    loop {
        // Render UI
        terminal.draw(|f| render_ui(f, &app, &theme))?;

        // Handle async messages
        while let Ok(msg) = rx.try_recv() {
            app.handle_message(msg)?;
        }

        // Handle keyboard events
        if event::poll(Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                if handle_input(&mut app, key, tx.clone()).await? {
                    break; // Quit requested
                }
            }
        }

        if app.should_quit {
            break;
        }
    }

    // Cleanup
    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;

    Ok(())
}

/// Handle keyboard input based on current screen
async fn handle_input(
    app: &mut App,
    key: KeyEvent,
    tx: mpsc::UnboundedSender<AppMessage>,
) -> Result<bool> {
    // Global keybindings
    match key.code {
        KeyCode::Char('q') if !matches!(app.navigation.current(), Screen::Login) => {
            app.quit();
            return Ok(true);
        }
        KeyCode::Char('c') if key.modifiers == KeyModifiers::CONTROL => {
            app.quit();
            return Ok(true);
        }
        KeyCode::Esc => {
            if app.navigation.can_go_back() {
                app.navigation.pop();
                app.clear_message();
            }
            return Ok(false);
        }
        _ => {}
    }

    // Screen-specific handling
    match app.navigation.current() {
        Screen::Login => handle_login_input(app, key, tx).await?,
        Screen::Search => handle_search_input(app, key, tx).await?,
        Screen::Results => handle_results_input(app, key, tx).await?,
        _ => {}
    }

    Ok(false)
}

/// Handle login screen input
async fn handle_login_input(
    app: &mut App,
    key: KeyEvent,
    tx: mpsc::UnboundedSender<AppMessage>,
) -> Result<()> {
    if app.loading {
        return Ok(());
    }

    match key.code {
        KeyCode::Tab => {
            app.login_state.focused_field = (app.login_state.focused_field + 1) % 2;
        }
        KeyCode::BackTab => {
            app.login_state.focused_field =
                if app.login_state.focused_field == 0 { 1 } else { 0 };
        }
        KeyCode::Enter => {
            // Perform login
            let email = app.login_state.email.value.clone();
            let password = app.login_state.password.value.clone();

            if email.is_empty() || password.is_empty() {
                app.set_error_message("Email and password are required");
                return Ok(());
            }

            app.loading = true;
            app.clear_message();

            // Spawn async login task
            let api_client = app.api_client.clone();
            tokio::spawn(async move {
                match api_client.login(&email, &password).await {
                    Ok(auth_response) => {
                        let _ = tx.send(AppMessage::AuthSuccess {
                            token: auth_response.token,
                            user: auth_response.user,
                        });
                    }
                    Err(e) => {
                        let _ = tx.send(AppMessage::Error(e.user_message()));
                        let _ = tx.send(AppMessage::Loading(false));
                    }
                }
            });
        }
        KeyCode::Char(c) => {
            if app.login_state.focused_field == 0 {
                app.login_state.email.insert_char(c);
            } else {
                app.login_state.password.insert_char(c);
            }
        }
        KeyCode::Backspace => {
            if app.login_state.focused_field == 0 {
                app.login_state.email.delete_char();
            } else {
                app.login_state.password.delete_char();
            }
        }
        _ => {}
    }

    Ok(())
}

/// Handle search screen input
async fn handle_search_input(
    app: &mut App,
    key: KeyEvent,
    tx: mpsc::UnboundedSender<AppMessage>,
) -> Result<()> {
    if app.loading {
        return Ok(());
    }

    if app.search_state.in_filter_mode {
        // Handle city filter mode
        match key.code {
            KeyCode::Esc => {
                app.search_state.in_filter_mode = false;
            }
            _ => {}
        }
    } else {
        // Handle normal search mode
        match key.code {
            KeyCode::Char('/') => {
                // Already in search mode, just for consistency
            }
            KeyCode::Char('f') if key.modifiers == KeyModifiers::CONTROL => {
                app.search_state.in_filter_mode = true;
            }
            KeyCode::Enter => {
                // Execute search
                let query = app.search_state.query.value.clone();

                if query.len() < 3 {
                    app.set_error_message("Search query must be at least 3 characters");
                    return Ok(());
                }

                app.loading = true;
                app.clear_message();

                // Spawn async search task
                let api_client = app.api_client.clone();
                let cities = app.search_state.selected_cities.clone();
                let page_size = app.config.ui.page_size;

                tokio::spawn(async move {
                    match api_client.search_companies(&query, 1, page_size, &cities).await {
                        Ok(response) => {
                            let _ = tx.send(AppMessage::SearchResults(response));
                        }
                        Err(e) => {
                            let _ = tx.send(AppMessage::Error(e.user_message()));
                            let _ = tx.send(AppMessage::Loading(false));
                        }
                    }
                });
            }
            KeyCode::Char(c) => {
                app.search_state.query.insert_char(c);
            }
            KeyCode::Backspace => {
                app.search_state.query.delete_char();
            }
            _ => {}
        }
    }

    Ok(())
}

/// Handle results screen input
async fn handle_results_input(
    app: &mut App,
    key: KeyEvent,
    tx: mpsc::UnboundedSender<AppMessage>,
) -> Result<()> {
    if app.loading {
        return Ok(());
    }

    match key.code {
        KeyCode::Char('j') | KeyCode::Down => {
            if app.results_state.selected_index < app.results_state.companies.len().saturating_sub(1) {
                app.results_state.selected_index += 1;
            }
        }
        KeyCode::Char('k') | KeyCode::Up => {
            if app.results_state.selected_index > 0 {
                app.results_state.selected_index -= 1;
            }
        }
        KeyCode::Char('g') => {
            // First g in gg
            app.results_state.selected_index = 0;
        }
        KeyCode::Char('G') => {
            app.results_state.selected_index = app.results_state.companies.len().saturating_sub(1);
        }
        KeyCode::Char('n') => {
            // Next page
            if app.results_state.can_go_next() {
                load_page(app, app.results_state.current_page + 1, tx).await;
            }
        }
        KeyCode::Char('p') => {
            // Previous page
            if app.results_state.can_go_previous() {
                load_page(app, app.results_state.current_page - 1, tx).await;
            }
        }
        KeyCode::Char('/') => {
            // New search
            app.navigation.pop();
        }
        _ => {}
    }

    Ok(())
}

/// Load a specific page of results
async fn load_page(app: &mut App, page: usize, tx: mpsc::UnboundedSender<AppMessage>) {
    app.loading = true;
    app.results_state.current_page = page;

    let api_client = app.api_client.clone();
    let query = app.search_state.query.value.clone();
    let cities = app.search_state.selected_cities.clone();
    let page_size = app.config.ui.page_size;

    tokio::spawn(async move {
        match api_client.search_companies(&query, page, page_size, &cities).await {
            Ok(response) => {
                let _ = tx.send(AppMessage::SearchResults(response));
            }
            Err(e) => {
                let _ = tx.send(AppMessage::Error(e.user_message()));
                let _ = tx.send(AppMessage::Loading(false));
            }
        }
    });
}

/// Render the UI based on current screen
fn render_ui(f: &mut Frame, app: &App, theme: &Theme) {
    match app.navigation.current() {
        Screen::Login => screens::login::render(f, app, theme),
        Screen::Search => screens::search::render(f, app, theme),
        Screen::Results => screens::results::render(f, app, theme),
        _ => {
            // Fallback for unimplemented screens
            use ratatui::{
                layout::Alignment,
                text::Line,
                widgets::{Block, Borders, Paragraph},
            };

            let text = vec![
                Line::from("Screen not yet implemented"),
                Line::from(""),
                Line::from("Press ESC to go back"),
            ];

            let para = Paragraph::new(text)
                .block(Block::default().borders(Borders::ALL).title("TODO"))
                .alignment(Alignment::Center);

            f.render_widget(para, f.size());
        }
    }
}
