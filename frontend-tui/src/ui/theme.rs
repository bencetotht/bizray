use ratatui::style::{Color, Modifier, Style};

/// Theme colors and styles for the TUI
pub struct Theme {
    // Base colors
    pub primary: Color,
    pub secondary: Color,
    pub background: Color,
    pub foreground: Color,
    pub border: Color,

    // Status colors
    pub success: Color,
    pub warning: Color,
    pub error: Color,
    pub info: Color,

    // Risk level colors
    pub risk_low: Color,
    pub risk_medium: Color,
    pub risk_high: Color,
    pub risk_na: Color,

    // UI element colors
    pub highlight: Color,
    pub selected: Color,
    pub focused: Color,
    pub disabled: Color,
}

impl Theme {
    /// Create default theme
    pub fn default() -> Self {
        Self {
            primary: Color::Cyan,
            secondary: Color::Blue,
            background: Color::Black,
            foreground: Color::White,
            border: Color::Gray,

            success: Color::Green,
            warning: Color::Yellow,
            error: Color::Red,
            info: Color::Cyan,

            risk_low: Color::Green,
            risk_medium: Color::Yellow,
            risk_high: Color::Red,
            risk_na: Color::Gray,

            highlight: Color::Yellow,
            selected: Color::Cyan,
            focused: Color::Yellow,
            disabled: Color::DarkGray,
        }
    }

    /// Create dark theme (same as default for now)
    pub fn dark() -> Self {
        Self::default()
    }

    /// Create light theme
    pub fn light() -> Self {
        Self {
            primary: Color::Blue,
            secondary: Color::Cyan,
            background: Color::White,
            foreground: Color::Black,
            border: Color::Gray,

            success: Color::Green,
            warning: Color::Yellow,
            error: Color::Red,
            info: Color::Blue,

            risk_low: Color::Green,
            risk_medium: Color::Yellow,
            risk_high: Color::Red,
            risk_na: Color::Gray,

            highlight: Color::Blue,
            selected: Color::Cyan,
            focused: Color::Blue,
            disabled: Color::Gray,
        }
    }

    /// Get theme by name
    pub fn from_name(name: &str) -> Self {
        match name {
            "light" => Self::light(),
            "dark" => Self::dark(),
            _ => Self::default(),
        }
    }

    // Style helpers

    pub fn normal(&self) -> Style {
        Style::default().fg(self.foreground).bg(self.background)
    }

    pub fn bold(&self) -> Style {
        self.normal().add_modifier(Modifier::BOLD)
    }

    pub fn selected(&self) -> Style {
        Style::default()
            .fg(self.selected)
            .add_modifier(Modifier::BOLD)
    }

    pub fn focused(&self) -> Style {
        Style::default()
            .fg(self.focused)
            .add_modifier(Modifier::BOLD)
    }

    pub fn focused_border(&self) -> Style {
        Style::default().fg(self.focused)
    }

    pub fn normal_border(&self) -> Style {
        Style::default().fg(self.border)
    }

    pub fn title(&self) -> Style {
        Style::default()
            .fg(self.primary)
            .add_modifier(Modifier::BOLD)
    }

    pub fn subtitle(&self) -> Style {
        Style::default().fg(self.secondary)
    }

    pub fn error_style(&self) -> Style {
        Style::default()
            .fg(self.error)
            .add_modifier(Modifier::BOLD)
    }

    pub fn success_style(&self) -> Style {
        Style::default()
            .fg(self.success)
            .add_modifier(Modifier::BOLD)
    }

    pub fn warning_style(&self) -> Style {
        Style::default()
            .fg(self.warning)
            .add_modifier(Modifier::BOLD)
    }

    pub fn info_style(&self) -> Style {
        Style::default().fg(self.info)
    }

    pub fn disabled_style(&self) -> Style {
        Style::default().fg(self.disabled)
    }

    /// Get style for risk level
    pub fn risk_style(&self, risk_score: Option<f64>) -> Style {
        let color = self.risk_color(risk_score);
        Style::default().fg(color).add_modifier(Modifier::BOLD)
    }

    /// Get color for risk level
    pub fn risk_color(&self, risk_score: Option<f64>) -> Color {
        match risk_score {
            Some(score) if score >= 0.7 => self.risk_high,
            Some(score) if score >= 0.4 => self.risk_medium,
            Some(_) => self.risk_low,
            None => self.risk_na,
        }
    }

    /// Get risk emoji
    pub fn risk_emoji(risk_score: Option<f64>) -> &'static str {
        match risk_score {
            Some(score) if score >= 0.7 => "🔴",
            Some(score) if score >= 0.4 => "🟡",
            Some(_) => "🟢",
            None => "⚪",
        }
    }

    /// Format risk score for display
    pub fn format_risk_score(risk_score: Option<f64>) -> String {
        match risk_score {
            Some(score) => format!("{} {:.2}", Self::risk_emoji(Some(score)), score),
            None => format!("{} N/A", Self::risk_emoji(None)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_theme_from_name() {
        let theme = Theme::from_name("default");
        assert_eq!(theme.primary, Color::Cyan);

        let theme = Theme::from_name("light");
        assert_eq!(theme.primary, Color::Blue);

        let theme = Theme::from_name("dark");
        assert_eq!(theme.primary, Color::Cyan);

        let theme = Theme::from_name("invalid");
        assert_eq!(theme.primary, Color::Cyan);
    }

    #[test]
    fn test_risk_color() {
        let theme = Theme::default();

        assert_eq!(theme.risk_color(Some(0.8)), theme.risk_high);
        assert_eq!(theme.risk_color(Some(0.5)), theme.risk_medium);
        assert_eq!(theme.risk_color(Some(0.2)), theme.risk_low);
        assert_eq!(theme.risk_color(None), theme.risk_na);
    }

    #[test]
    fn test_risk_emoji() {
        assert_eq!(Theme::risk_emoji(Some(0.8)), "🔴");
        assert_eq!(Theme::risk_emoji(Some(0.5)), "🟡");
        assert_eq!(Theme::risk_emoji(Some(0.2)), "🟢");
        assert_eq!(Theme::risk_emoji(None), "⚪");
    }
}
