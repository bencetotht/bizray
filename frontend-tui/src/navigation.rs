/// Represents the different screens in the application
#[derive(Debug, Clone, PartialEq)]
pub enum Screen {
    /// Login screen
    Login,
    /// Registration screen
    Register,
    /// Main search screen
    Search,
    /// Search results list
    Results,
    /// Company details view
    Details(String), // firmenbuchnummer
    /// Account management
    Account,
    /// Help/keybindings screen
    Help,
}

/// Navigation state with history stack
pub struct Navigation {
    /// Current screen
    pub current: Screen,
    /// Navigation history for back button
    history: Vec<Screen>,
    /// Maximum history size
    max_history: usize,
}

impl Navigation {
    pub fn new(initial_screen: Screen) -> Self {
        Self {
            current: initial_screen,
            history: Vec::new(),
            max_history: 10,
        }
    }

    /// Navigate to a new screen, adding current screen to history
    pub fn push(&mut self, screen: Screen) {
        // Don't add duplicate consecutive screens
        if self.current != screen {
            self.history.push(self.current.clone());

            // Limit history size
            if self.history.len() > self.max_history {
                self.history.remove(0);
            }

            self.current = screen;
        }
    }

    /// Go back to the previous screen
    pub fn pop(&mut self) -> bool {
        if let Some(previous) = self.history.pop() {
            self.current = previous;
            true
        } else {
            false
        }
    }

    /// Replace current screen without adding to history
    pub fn replace(&mut self, screen: Screen) {
        self.current = screen;
    }

    /// Clear history and go to screen
    pub fn reset(&mut self, screen: Screen) {
        self.history.clear();
        self.current = screen;
    }

    /// Check if we can go back
    pub fn can_go_back(&self) -> bool {
        !self.history.is_empty()
    }

    /// Get the current screen
    pub fn current(&self) -> &Screen {
        &self.current
    }

    /// Get history length
    pub fn history_len(&self) -> usize {
        self.history.len()
    }
}

impl Default for Navigation {
    fn default() -> Self {
        Self::new(Screen::Login)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_navigation_new() {
        let nav = Navigation::new(Screen::Login);
        assert_eq!(nav.current, Screen::Login);
        assert!(!nav.can_go_back());
    }

    #[test]
    fn test_navigation_push_pop() {
        let mut nav = Navigation::new(Screen::Login);

        nav.push(Screen::Search);
        assert_eq!(nav.current, Screen::Search);
        assert!(nav.can_go_back());

        nav.push(Screen::Results);
        assert_eq!(nav.current, Screen::Results);

        assert!(nav.pop());
        assert_eq!(nav.current, Screen::Search);

        assert!(nav.pop());
        assert_eq!(nav.current, Screen::Login);

        assert!(!nav.pop());
    }

    #[test]
    fn test_navigation_replace() {
        let mut nav = Navigation::new(Screen::Login);

        nav.replace(Screen::Register);
        assert_eq!(nav.current, Screen::Register);
        assert!(!nav.can_go_back());
    }

    #[test]
    fn test_navigation_reset() {
        let mut nav = Navigation::new(Screen::Login);

        nav.push(Screen::Search);
        nav.push(Screen::Results);
        assert!(nav.can_go_back());

        nav.reset(Screen::Login);
        assert_eq!(nav.current, Screen::Login);
        assert!(!nav.can_go_back());
    }

    #[test]
    fn test_navigation_max_history() {
        let mut nav = Navigation::new(Screen::Login);
        nav.max_history = 3;

        // Push more screens than max_history
        for i in 0..5 {
            nav.push(Screen::Details(format!("company{}", i)));
        }

        // History should be limited to max_history
        assert_eq!(nav.history_len(), 3);
    }

    #[test]
    fn test_navigation_no_duplicate_consecutive() {
        let mut nav = Navigation::new(Screen::Login);

        nav.push(Screen::Search);
        assert_eq!(nav.history_len(), 1);

        // Try to push the same screen again
        nav.push(Screen::Search);
        assert_eq!(nav.history_len(), 1); // Should not add duplicate
    }
}
