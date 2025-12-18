use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Modifier, Style},
    text::Line,
    widgets::{Block, Borders, Paragraph, StatefulWidget, Widget},
};
use unicode_width::UnicodeWidthStr;

#[derive(Default, Clone)]
pub struct InputState {
    /// The current text content
    pub value: String,
    /// Cursor position (in characters, not bytes)
    pub cursor_position: usize,
}

impl InputState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_value(value: String) -> Self {
        let cursor_position = value.chars().count();
        Self {
            value,
            cursor_position,
        }
    }

    pub fn is_empty(&self) -> bool {
        self.value.is_empty()
    }

    pub fn clear(&mut self) {
        self.value.clear();
        self.cursor_position = 0;
    }

    /// Insert a character at the cursor position
    pub fn insert_char(&mut self, c: char) {
        let char_index = self.char_index_from_position(self.cursor_position);
        self.value.insert(char_index, c);
        self.cursor_position += 1;
    }

    /// Delete the character before the cursor (backspace)
    pub fn delete_char(&mut self) {
        if self.cursor_position > 0 {
            let char_index = self.char_index_from_position(self.cursor_position - 1);
            self.value.remove(char_index);
            self.cursor_position -= 1;
        }
    }

    /// Delete the character at the cursor (delete key)
    pub fn delete_char_forward(&mut self) {
        if self.cursor_position < self.value.chars().count() {
            let char_index = self.char_index_from_position(self.cursor_position);
            self.value.remove(char_index);
        }
    }

    /// Move cursor left
    pub fn move_cursor_left(&mut self) {
        if self.cursor_position > 0 {
            self.cursor_position -= 1;
        }
    }

    /// Move cursor right
    pub fn move_cursor_right(&mut self) {
        let char_count = self.value.chars().count();
        if self.cursor_position < char_count {
            self.cursor_position += 1;
        }
    }

    /// Move cursor to start
    pub fn move_cursor_to_start(&mut self) {
        self.cursor_position = 0;
    }

    /// Move cursor to end
    pub fn move_cursor_to_end(&mut self) {
        self.cursor_position = self.value.chars().count();
    }

    /// Convert character position to byte index
    fn char_index_from_position(&self, position: usize) -> usize {
        self.value
            .char_indices()
            .nth(position)
            .map(|(i, _)| i)
            .unwrap_or(self.value.len())
    }
}

pub struct Input {
    /// Input label/title
    pub label: String,
    /// Placeholder text when empty
    pub placeholder: String,
    /// Whether to mask the input (for passwords)
    pub is_password: bool,
    /// Whether the input is focused
    pub focused: bool,
    /// Block style
    pub block: Option<Block<'static>>,
}

impl Input {
    pub fn new() -> Self {
        Self {
            label: String::new(),
            placeholder: String::new(),
            is_password: false,
            focused: false,
            block: None,
        }
    }

    pub fn label(mut self, label: impl Into<String>) -> Self {
        self.label = label.into();
        self
    }

    pub fn placeholder(mut self, placeholder: impl Into<String>) -> Self {
        self.placeholder = placeholder.into();
        self
    }

    pub fn password(mut self, is_password: bool) -> Self {
        self.is_password = is_password;
        self
    }

    pub fn focused(mut self, focused: bool) -> Self {
        self.focused = focused;
        self
    }

    pub fn block(mut self, block: Block<'static>) -> Self {
        self.block = Some(block);
        self
    }
}

impl Default for Input {
    fn default() -> Self {
        Self::new()
    }
}

impl StatefulWidget for Input {
    type State = InputState;

    fn render(self, area: Rect, buf: &mut Buffer, state: &mut Self::State) {
        // Get the display text
        let display_text = if self.is_password {
            "•".repeat(state.value.chars().count())
        } else {
            state.value.clone()
        };

        // If empty and not focused, show placeholder
        let text_to_show = if display_text.is_empty() && !self.focused {
            self.placeholder.clone()
        } else {
            display_text
        };

        // Create the style
        let style = if self.focused {
            Style::default().add_modifier(Modifier::BOLD)
        } else {
            Style::default()
        };

        let placeholder_style = Style::default().add_modifier(Modifier::DIM);

        // Determine which style to use
        let text_style = if state.value.is_empty() && !self.focused {
            placeholder_style
        } else {
            style
        };

        // Create block with label
        let block = self.block.unwrap_or_else(|| {
            let mut b = Block::default().borders(Borders::ALL);
            if !self.label.is_empty() {
                b = b.title(self.label.clone());
            }
            if self.focused {
                b = b.border_style(Style::default().fg(ratatui::style::Color::Yellow));
            }
            b
        });

        // Create paragraph
        let paragraph = Paragraph::new(Line::from(text_to_show))
            .style(text_style)
            .block(block);

        paragraph.render(area, buf);

        // Set cursor position if focused
        if self.focused {
            // Calculate the visible cursor position
            let text_before_cursor: String = if self.is_password {
                "•".repeat(state.cursor_position)
            } else {
                state
                    .value
                    .chars()
                    .take(state.cursor_position)
                    .collect()
            };

            let cursor_x = area.x + 1 + text_before_cursor.width() as u16;
            let cursor_y = area.y + 1;

            // Only set cursor if it's within bounds
            if cursor_x < area.x + area.width.saturating_sub(1) {
                buf.set_string(cursor_x, cursor_y, " ", style);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_input_state_new() {
        let state = InputState::new();
        assert!(state.is_empty());
        assert_eq!(state.cursor_position, 0);
    }

    #[test]
    fn test_input_state_insert_char() {
        let mut state = InputState::new();
        state.insert_char('h');
        state.insert_char('i');
        assert_eq!(state.value, "hi");
        assert_eq!(state.cursor_position, 2);
    }

    #[test]
    fn test_input_state_delete_char() {
        let mut state = InputState::with_value("hello".to_string());
        state.delete_char();
        assert_eq!(state.value, "hell");
        assert_eq!(state.cursor_position, 4);
    }

    #[test]
    fn test_input_state_cursor_movement() {
        let mut state = InputState::with_value("hello".to_string());
        assert_eq!(state.cursor_position, 5);

        state.move_cursor_left();
        assert_eq!(state.cursor_position, 4);

        state.move_cursor_to_start();
        assert_eq!(state.cursor_position, 0);

        state.move_cursor_right();
        assert_eq!(state.cursor_position, 1);

        state.move_cursor_to_end();
        assert_eq!(state.cursor_position, 5);
    }

    #[test]
    fn test_input_state_clear() {
        let mut state = InputState::with_value("hello".to_string());
        state.clear();
        assert!(state.is_empty());
        assert_eq!(state.cursor_position, 0);
    }
}
