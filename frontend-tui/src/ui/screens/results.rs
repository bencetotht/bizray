use crate::{
    api::models::CompanySummary,
    app::{App, ResultsState},
    ui::{
        components::{statusbar, StatusBar},
        theme::Theme,
    },
};
use ratatui::{
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::Modifier,
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
            Constraint::Min(0),     // Results list
            Constraint::Length(3),  // Pagination info
            Constraint::Length(2),  // Status bar
        ])
        .split(size);

    // Header
    render_header(f, chunks[0], &app.results_state, theme);

    // Results list
    if app.loading {
        render_loading(f, chunks[1], theme);
    } else if app.results_state.companies.is_empty() {
        render_empty_results(f, chunks[1], theme);
    } else {
        render_results_list(f, chunks[1], &app.results_state, theme);
    }

    // Pagination info
    render_pagination(f, chunks[2], &app.results_state, theme);

    // Status bar
    let status_message = if let Some((msg, _)) = &app.status_message {
        msg.as_str()
    } else if app.loading {
        "Loading..."
    } else {
        "Ready"
    };

    let statusbar = StatusBar::new(status_message).hints(statusbar::hints::RESULTS.to_vec());
    f.render_widget(statusbar, chunks[3]);
}

fn render_header(f: &mut Frame, area: Rect, state: &ResultsState, theme: &Theme) {
    let title = if state.total > 0 {
        format!(
            "Search Results - {} companies found",
            state.total
        )
    } else {
        "Search Results".to_string()
    };

    let header = Block::default()
        .title(title)
        .title_alignment(Alignment::Center)
        .borders(Borders::ALL)
        .style(theme.title());

    f.render_widget(header, area);
}

fn render_loading(f: &mut Frame, area: Rect, theme: &Theme) {
    let block = Block::default()
        .borders(Borders::ALL);

    let inner = block.inner(area);
    f.render_widget(block, area);

    let loading_text = vec![
        Line::from(""),
        Line::from(""),
        Line::from(Span::styled(
            "🔍 Searching...",
            theme.info_style().add_modifier(Modifier::BOLD),
        )),
    ];

    let loading = Paragraph::new(loading_text).alignment(Alignment::Center);
    f.render_widget(loading, inner);
}

fn render_empty_results(f: &mut Frame, area: Rect, theme: &Theme) {
    let block = Block::default()
        .title("No Results")
        .borders(Borders::ALL);

    let inner = block.inner(area);
    f.render_widget(block, area);

    let empty_text = vec![
        Line::from(""),
        Line::from(""),
        Line::from(Span::styled(
            "No companies found matching your search.",
            theme.disabled_style(),
        )),
        Line::from(""),
        Line::from(Span::styled(
            "Try a different search term or adjust your filters.",
            theme.info_style(),
        )),
    ];

    let empty = Paragraph::new(empty_text).alignment(Alignment::Center);
    f.render_widget(empty, inner);
}

fn render_results_list(f: &mut Frame, area: Rect, state: &ResultsState, theme: &Theme) {
    let block = Block::default()
        .title("Companies")
        .borders(Borders::ALL);

    let inner = block.inner(area);
    f.render_widget(block, area);

    let items: Vec<ListItem> = state
        .companies
        .iter()
        .enumerate()
        .map(|(i, company)| format_company_item(i, company, state.selected_index, theme))
        .collect();

    let list = List::new(items).highlight_style(theme.selected());
    f.render_widget(list, inner);
}

fn format_company_item(
    index: usize,
    company: &CompanySummary,
    selected: usize,
    theme: &Theme,
) -> ListItem<'static> {
    let is_selected = index == selected;

    // Risk indicator
    let risk_emoji = Theme::risk_emoji(company.risk_score);
    let risk_text = company.risk_level();

    // Company info
    let name = company.name.clone();
    let legal_form = company
        .legal_form
        .clone()
        .unwrap_or_else(|| "N/A".to_string());
    let seat = company.seat.clone().unwrap_or_else(|| "N/A".to_string());
    let fn_num = company.firmenbuchnummer.clone();

    let prefix = if is_selected { "▶ " } else { "  " };

    let line1 = Line::from(vec![
        Span::raw(prefix),
        Span::styled(
            name,
            if is_selected {
                theme.selected()
            } else {
                theme.bold()
            },
        ),
        Span::raw("  "),
        Span::styled(
            format!("{} {}", risk_emoji, risk_text),
            theme.risk_style(company.risk_score),
        ),
    ]);

    let line2 = Line::from(vec![
        Span::raw("   "),
        Span::styled("FN: ", theme.disabled_style()),
        Span::raw(fn_num),
        Span::raw("  |  "),
        Span::styled(legal_form, theme.info_style()),
        Span::raw("  |  "),
        Span::raw(seat),
    ]);

    let purpose_preview = company
        .business_purpose
        .as_ref()
        .map(|p| {
            let preview = if p.len() > 80 {
                format!("{}...", &p[..77])
            } else {
                p.clone()
            };
            preview
        })
        .unwrap_or_else(|| "No description".to_string());

    let line3 = Line::from(vec![
        Span::raw("   "),
        Span::styled(purpose_preview, theme.disabled_style()),
    ]);

    ListItem::new(vec![line1, line2, line3, Line::from("")])
}

fn render_pagination(f: &mut Frame, area: Rect, state: &ResultsState, theme: &Theme) {
    let total_pages = state.total_pages();

    let pagination_text = if total_pages > 0 {
        format!(
            "Page {} of {}  |  {} results  |  n: Next  p: Previous  gg: First  G: Last",
            state.current_page, total_pages, state.total
        )
    } else {
        "No results".to_string()
    };

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(theme.normal_border());

    let pagination = Paragraph::new(pagination_text)
        .block(block)
        .alignment(Alignment::Center)
        .style(theme.info_style());

    f.render_widget(pagination, area);
}
