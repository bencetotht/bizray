use crate::api::models::get_risk_indicator_name;
use crate::ui::theme::Theme;
use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Widget},
};
use std::collections::HashMap;

/// Widget to display risk score and indicators
pub struct RiskGauge<'a> {
    pub risk_score: Option<f64>,
    pub risk_indicators: &'a HashMap<String, f64>,
    pub theme: &'a Theme,
    pub block: Option<Block<'a>>,
}

impl<'a> RiskGauge<'a> {
    pub fn new(
        risk_score: Option<f64>,
        risk_indicators: &'a HashMap<String, f64>,
        theme: &'a Theme,
    ) -> Self {
        Self {
            risk_score,
            risk_indicators,
            theme,
            block: None,
        }
    }

    pub fn block(mut self, block: Block<'a>) -> Self {
        self.block = Some(block);
        self
    }
}

impl<'a> Widget for RiskGauge<'a> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        // Render block if provided
        let inner = if let Some(block) = self.block {
            let inner = block.inner(area);
            block.render(area, buf);
            inner
        } else {
            area
        };

        if inner.height == 0 {
            return;
        }

        let mut y = inner.y;

        // Render overall risk score
        let risk_text = format_risk_score(self.risk_score);
        let risk_style = self.theme.risk_style(self.risk_score);

        let risk_line = Line::from(vec![
            Span::raw("Risk Score: "),
            Span::styled(risk_text, risk_style),
        ]);

        buf.set_line(inner.x, y, &risk_line, inner.width);
        y += 2;

        // Render individual risk indicators
        if y < inner.y + inner.height && !self.risk_indicators.is_empty() {
            // Sort indicators by name for consistent display
            let mut indicators: Vec<_> = self.risk_indicators.iter().collect();
            indicators.sort_by_key(|(k, _)| *k);

            for (key, value) in indicators {
                if y >= inner.y + inner.height {
                    break;
                }

                let display_name = get_risk_indicator_name(key);
                let formatted_value = format_risk_indicator_value(*value);
                let indicator_style = risk_value_style(*value, self.theme);

                // Create spans for the indicator line
                let indicator_line = Line::from(vec![
                    Span::raw(format!("  • {}: ", display_name)),
                    Span::styled(formatted_value, indicator_style),
                ]);

                buf.set_line(inner.x, y, &indicator_line, inner.width);
                y += 1;
            }
        }

        // Show message if no risk data
        if self.risk_score.is_none() && self.risk_indicators.is_empty() && y < inner.y + inner.height
        {
            let no_data_line = Line::from(Span::styled(
                "No risk data available",
                self.theme.disabled_style(),
            ));
            buf.set_line(inner.x, inner.y, &no_data_line, inner.width);
        }
    }
}

/// Format risk score for display with emoji
pub fn format_risk_score(risk_score: Option<f64>) -> String {
    match risk_score {
        Some(score) => format!("{} {:.2} ({})", Theme::risk_emoji(Some(score)), score, risk_level_text(Some(score))),
        None => format!("{} N/A", Theme::risk_emoji(None)),
    }
}

/// Get risk level text
pub fn risk_level_text(risk_score: Option<f64>) -> &'static str {
    match risk_score {
        Some(score) if score >= 0.7 => "High",
        Some(score) if score >= 0.4 => "Medium",
        Some(_) => "Low",
        None => "N/A",
    }
}

/// Format risk indicator value
pub fn format_risk_indicator_value(value: f64) -> String {
    // Check if value is a boolean indicator (0.0 or 1.0)
    if (value - 0.0).abs() < 0.01 || (value - 1.0).abs() < 0.01 {
        if value > 0.5 {
            "✓ Yes".to_string()
        } else {
            "✗ No".to_string()
        }
    } else {
        // Numeric indicator
        format!("{:.2}", value)
    }
}

/// Get style for risk indicator value
pub fn risk_value_style(value: f64, theme: &Theme) -> Style {
    // For boolean indicators
    if (value - 0.0).abs() < 0.01 || (value - 1.0).abs() < 0.01 {
        if value > 0.5 {
            return theme.error_style(); // Yes = bad (risk present)
        } else {
            return theme.success_style(); // No = good (no risk)
        }
    }

    // For numeric indicators (treat like risk score)
    let color = if value >= 0.7 {
        theme.risk_high
    } else if value >= 0.4 {
        theme.risk_medium
    } else {
        theme.risk_low
    };

    Style::default().fg(color).add_modifier(Modifier::BOLD)
}

/// Create a simple horizontal bar gauge for risk score
pub fn create_risk_bar(risk_score: Option<f64>, width: usize) -> String {
    match risk_score {
        Some(score) => {
            let filled = (score * width as f64) as usize;
            let empty = width.saturating_sub(filled);

            let bar_char = if score >= 0.7 {
                '█'
            } else if score >= 0.4 {
                '▓'
            } else {
                '░'
            };

            let filled_str: String = std::iter::repeat(bar_char).take(filled).collect();
            let empty_str: String = std::iter::repeat('░').take(empty).collect();

            format!("[{}{}]", filled_str, empty_str)
        }
        None => {
            let empty_str: String = std::iter::repeat('░').take(width).collect();
            format!("[{}]", empty_str)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_level_text() {
        assert_eq!(risk_level_text(Some(0.8)), "High");
        assert_eq!(risk_level_text(Some(0.5)), "Medium");
        assert_eq!(risk_level_text(Some(0.2)), "Low");
        assert_eq!(risk_level_text(None), "N/A");
    }

    #[test]
    fn test_format_risk_indicator_value() {
        assert!(format_risk_indicator_value(0.0).contains("No"));
        assert!(format_risk_indicator_value(1.0).contains("Yes"));
        assert_eq!(format_risk_indicator_value(0.5), "0.50");
        assert_eq!(format_risk_indicator_value(0.75), "0.75");
    }

    #[test]
    fn test_create_risk_bar() {
        let bar = create_risk_bar(Some(0.5), 10);
        assert!(bar.starts_with('['));
        assert!(bar.ends_with(']'));
        assert_eq!(bar.len(), 12); // 10 chars + 2 brackets

        let bar_none = create_risk_bar(None, 10);
        assert!(bar_none.contains('░'));
    }
}
