use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::Widget,
};

pub struct StatusBar<'a> {
    pub message: &'a str,
    pub hints: Vec<(&'a str, &'a str)>, // (key, description) pairs
    pub show_hints: bool,
}

impl<'a> StatusBar<'a> {
    pub fn new(message: &'a str) -> Self {
        Self {
            message,
            hints: Vec::new(),
            show_hints: true,
        }
    }

    pub fn hints(mut self, hints: Vec<(&'a str, &'a str)>) -> Self {
        self.hints = hints;
        self
    }

    pub fn show_hints(mut self, show: bool) -> Self {
        self.show_hints = show;
        self
    }
}

impl<'a> Widget for StatusBar<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        if area.height == 0 {
            return;
        }

        // First line: status message
        let status_style = Style::default().add_modifier(Modifier::BOLD);
        let status_line = Line::from(vec![Span::styled(self.message, status_style)]);

        buf.set_line(area.x, area.y, &status_line, area.width);

        // Second line: keyboard hints (if space available and enabled)
        if area.height > 1 && self.show_hints && !self.hints.is_empty() {
            let hint_y = area.y + 1;

            let key_style = Style::default()
                .fg(ratatui::style::Color::Yellow)
                .add_modifier(Modifier::BOLD);
            let desc_style = Style::default();

            let mut spans = Vec::new();

            for (i, (key, desc)) in self.hints.iter().enumerate() {
                if i > 0 {
                    spans.push(Span::raw("  "));
                }
                spans.push(Span::styled(*key, key_style));
                spans.push(Span::raw(": "));
                spans.push(Span::styled(*desc, desc_style));
            }

            let hints_line = Line::from(spans);
            buf.set_line(area.x, hint_y, &hints_line, area.width);
        }
    }
}

/// Helper to create common statusbar hints for different screens
pub mod hints {
    pub const GLOBAL: &[(&str, &str)] = &[("q", "Quit"), ("?", "Help"), ("ESC", "Back")];

    pub const LOGIN: &[(&str, &str)] = &[
        ("TAB", "Next"),
        ("Enter", "Submit"),
        ("Ctrl+R", "Register"),
        ("q", "Quit"),
    ];

    pub const SEARCH: &[(&str, &str)] = &[
        ("/", "Search"),
        ("Ctrl+F", "Filter"),
        ("a", "Account"),
        ("?", "Help"),
        ("q", "Quit"),
    ];

    pub const RESULTS: &[(&str, &str)] = &[
        ("j/k", "Navigate"),
        ("Enter", "Details"),
        ("n/p", "Page"),
        ("/", "Search"),
        ("ESC", "Back"),
    ];

    pub const DETAILS: &[(&str, &str)] = &[
        ("j/k", "Scroll"),
        ("Tab", "Sections"),
        ("e", "Expand"),
        ("h", "Back"),
        ("ESC", "Back"),
    ];

    pub const ACCOUNT: &[(&str, &str)] = &[
        ("p", "Password"),
        ("u", "Username"),
        ("l", "Logout"),
        ("d", "Delete"),
        ("ESC", "Back"),
    ];
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_statusbar_new() {
        let statusbar = StatusBar::new("Ready");
        assert_eq!(statusbar.message, "Ready");
        assert!(statusbar.hints.is_empty());
        assert!(statusbar.show_hints);
    }

    #[test]
    fn test_statusbar_with_hints() {
        let hints = vec![("q", "Quit"), ("?", "Help")];
        let statusbar = StatusBar::new("Ready").hints(hints);
        assert_eq!(statusbar.hints.len(), 2);
    }

    #[test]
    fn test_hint_constants() {
        assert!(!hints::GLOBAL.is_empty());
        assert!(!hints::LOGIN.is_empty());
        assert!(!hints::SEARCH.is_empty());
        assert!(!hints::RESULTS.is_empty());
        assert!(!hints::DETAILS.is_empty());
        assert!(!hints::ACCOUNT.is_empty());
    }
}
