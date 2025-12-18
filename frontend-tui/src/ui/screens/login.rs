use crate::{
    app::{App, LoginState},
    ui::{
        components::{statusbar, Input, StatusBar},
        theme::Theme,
    },
};
use ratatui::{
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph},
    Frame,
};

pub fn render(f: &mut Frame, app: &App, theme: &Theme) {
    let size = f.size();

    // Center the login form
    let vertical_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage(25),
            Constraint::Length(15),
            Constraint::Percentage(25),
            Constraint::Length(2), // Status bar
        ])
        .split(size);

    let horizontal_chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage(25),
            Constraint::Percentage(50),
            Constraint::Percentage(25),
        ])
        .split(vertical_chunks[1]);

    let form_area = horizontal_chunks[1];

    // Render login form
    render_login_form(f, form_area, &app.login_state, app.loading, theme);

    // Status bar
    let status_message = if let Some((msg, _)) = &app.status_message {
        msg.as_str()
    } else if app.loading {
        "Logging in..."
    } else {
        "Ready"
    };

    let statusbar = StatusBar::new(status_message).hints(statusbar::hints::LOGIN.to_vec());
    f.render_widget(statusbar, vertical_chunks[3]);
}

fn render_login_form(f: &mut Frame, area: Rect, state: &LoginState, loading: bool, theme: &Theme) {
    // Form layout
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),  // Title
            Constraint::Length(3),  // Email input
            Constraint::Length(3),  // Password input
            Constraint::Length(2),  // Spacer
            Constraint::Length(3),  // Instructions
        ])
        .split(area);

    // Title
    let title_text = vec![
        Line::from(Span::styled(
            "🔐 Login to BizRay",
            theme.title(),
        )),
    ];
    let title = Paragraph::new(title_text)
        .alignment(Alignment::Center)
        .block(Block::default().borders(Borders::ALL));
    f.render_widget(title, chunks[0]);

    // Email input
    let mut email_state = state.email.clone();
    let email_input = Input::new()
        .label("Email")
        .placeholder("user@example.com")
        .focused(state.focused_field == 0 && !loading)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(if state.focused_field == 0 {
                    theme.focused_border()
                } else {
                    theme.normal_border()
                })
        );
    f.render_stateful_widget(email_input, chunks[1], &mut email_state);

    // Password input
    let mut password_state = state.password.clone();
    let password_input = Input::new()
        .label("Password")
        .placeholder("••••••••")
        .password(true)
        .focused(state.focused_field == 1 && !loading)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(if state.focused_field == 1 {
                    theme.focused_border()
                } else {
                    theme.normal_border()
                })
        );
    f.render_stateful_widget(password_input, chunks[2], &mut password_state);

    // Instructions
    let instructions = vec![
        Line::from(""),
        Line::from(vec![
            Span::styled("TAB", theme.warning_style()),
            Span::raw(" to switch fields  |  "),
            Span::styled("Enter", theme.warning_style()),
            Span::raw(" to login  |  "),
            Span::styled("Ctrl+R", theme.warning_style()),
            Span::raw(" to register"),
        ]),
    ];
    let instructions_paragraph = Paragraph::new(instructions)
        .alignment(Alignment::Center);
    f.render_widget(instructions_paragraph, chunks[4]);
}
