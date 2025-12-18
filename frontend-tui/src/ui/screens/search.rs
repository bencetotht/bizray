use crate::{
    app::{App, SearchState},
    ui::{
        components::{statusbar, Input, StatusBar},
        theme::Theme,
    },
};
use ratatui::{
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph},
    Frame,
};

pub fn render(f: &mut Frame, app: &App, theme: &Theme) {
    let size = f.size();

    // Main layout
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),  // Header
            Constraint::Length(3),  // Search input
            Constraint::Min(0),     // Content
            Constraint::Length(2),  // Status bar
        ])
        .split(size);

    // Header
    let header = Block::default()
        .title("BizRay TUI - Company Search")
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .style(theme.title());

    f.render_widget(header, chunks[0]);

    // Search input
    render_search_input(f, chunks[1], &app.search_state, theme);

    // Content area
    if app.search_state.in_filter_mode {
        render_city_filters(f, chunks[2], &app.search_state, theme);
    } else {
        render_search_help(f, chunks[2], theme);
    }

    // Status bar
    let hints = if app.search_state.in_filter_mode {
        vec![
            ("j/k", "Navigate"),
            ("Space", "Toggle"),
            ("ESC", "Close"),
        ]
    } else {
        statusbar::hints::SEARCH.to_vec()
    };

    let status_message = if let Some((msg, _)) = &app.status_message {
        msg.as_str()
    } else {
        "Ready"
    };

    let statusbar = StatusBar::new(status_message).hints(hints);
    f.render_widget(statusbar, chunks[3]);
}

fn render_search_input(f: &mut Frame, area: Rect, state: &SearchState, theme: &Theme) {
    let mut input_state = state.query.clone();

    let input = Input::new()
        .label("Search Companies")
        .placeholder("Enter company name, address, or person (min 3 chars)")
        .focused(true)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(theme.focused_border())
        );

    f.render_stateful_widget(input, area, &mut input_state);
}

fn render_city_filters(f: &mut Frame, area: Rect, state: &SearchState, theme: &Theme) {
    let block = Block::default()
        .title("City Filters (Space to toggle)")
        .borders(Borders::ALL)
        .border_style(theme.focused_border());

    let inner = block.inner(area);
    f.render_widget(block, area);

    if state.available_cities.is_empty() {
        let msg = Paragraph::new("Loading cities...")
            .style(theme.disabled_style())
            .alignment(Alignment::Center);
        f.render_widget(msg, inner);
        return;
    }

    let items: Vec<ListItem> = state
        .available_cities
        .iter()
        .map(|city| {
            let is_selected = state.selected_cities.contains(city);
            let checkbox = if is_selected { "☑" } else { "☐" };

            let style = if is_selected {
                theme.selected()
            } else {
                theme.normal()
            };

            ListItem::new(format!("{} {}", checkbox, city)).style(style)
        })
        .collect();

    let list = List::new(items);
    f.render_widget(list, inner);
}

fn render_search_help(f: &mut Frame, area: Rect, theme: &Theme) {
    let block = Block::default()
        .title("Quick Start")
        .borders(Borders::ALL);

    let inner = block.inner(area);
    f.render_widget(block, area);

    let help_text = vec![
        Line::from(""),
        Line::from(vec![
            Span::styled("/", theme.warning_style()),
            Span::raw(" - Start searching"),
        ]),
        Line::from(""),
        Line::from(vec![
            Span::styled("Ctrl+F", theme.warning_style()),
            Span::raw(" - Filter by city"),
        ]),
        Line::from(""),
        Line::from(vec![
            Span::styled("Enter", theme.warning_style()),
            Span::raw(" - Execute search"),
        ]),
        Line::from(""),
        Line::from(""),
        Line::from(Span::styled(
            "Start typing to search Austrian companies...",
            theme.info_style(),
        )),
    ];

    let help = Paragraph::new(help_text).alignment(Alignment::Center);
    f.render_widget(help, inner);
}
