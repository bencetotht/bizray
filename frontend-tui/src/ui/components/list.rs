/// A scrollable list with selection support
#[derive(Clone)]
pub struct ScrollableList<T> {
    pub items: Vec<T>,
    pub selected: usize,
    pub scroll_offset: usize,
}

impl<T> ScrollableList<T> {
    pub fn new(items: Vec<T>) -> Self {
        Self {
            items,
            selected: 0,
            scroll_offset: 0,
        }
    }

    pub fn with_items(items: Vec<T>) -> Self {
        Self::new(items)
    }

    pub fn len(&self) -> usize {
        self.items.len()
    }

    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    /// Move selection to next item
    pub fn next(&mut self, visible_rows: usize) {
        if self.items.is_empty() {
            return;
        }

        if self.selected < self.items.len().saturating_sub(1) {
            self.selected += 1;

            // Scroll down if needed
            if self.selected >= self.scroll_offset + visible_rows {
                self.scroll_offset += 1;
            }
        }
    }

    /// Move selection to previous item
    pub fn previous(&mut self) {
        if self.items.is_empty() {
            return;
        }

        if self.selected > 0 {
            self.selected -= 1;

            // Scroll up if needed
            if self.selected < self.scroll_offset {
                self.scroll_offset = self.selected;
            }
        }
    }

    /// Move to first item
    pub fn first(&mut self) {
        if !self.items.is_empty() {
            self.selected = 0;
            self.scroll_offset = 0;
        }
    }

    /// Move to last item
    pub fn last(&mut self, visible_rows: usize) {
        if !self.items.is_empty() {
            self.selected = self.items.len() - 1;
            self.scroll_offset = self
                .items
                .len()
                .saturating_sub(visible_rows);
        }
    }

    /// Page down
    pub fn page_down(&mut self, visible_rows: usize) {
        if self.items.is_empty() {
            return;
        }

        let page_size = visible_rows.min(10);
        let new_selected = (self.selected + page_size).min(self.items.len() - 1);

        self.selected = new_selected;

        // Adjust scroll offset
        if self.selected >= self.scroll_offset + visible_rows {
            self.scroll_offset = self.selected.saturating_sub(visible_rows - 1);
        }
    }

    /// Page up
    pub fn page_up(&mut self, visible_rows: usize) {
        if self.items.is_empty() {
            return;
        }

        let page_size = visible_rows.min(10);
        let new_selected = self.selected.saturating_sub(page_size);

        self.selected = new_selected;

        // Adjust scroll offset
        if self.selected < self.scroll_offset {
            self.scroll_offset = self.selected;
        }
    }

    /// Get the currently selected item
    pub fn selected_item(&self) -> Option<&T> {
        self.items.get(self.selected)
    }

    /// Get mutable reference to selected item
    pub fn selected_item_mut(&mut self) -> Option<&mut T> {
        self.items.get_mut(self.selected)
    }

    /// Get the visible slice of items based on scroll offset
    pub fn visible_items(&self, visible_rows: usize) -> &[T] {
        let start = self.scroll_offset;
        let end = (start + visible_rows).min(self.items.len());
        &self.items[start..end]
    }

    /// Replace items and reset selection
    pub fn set_items(&mut self, items: Vec<T>) {
        self.items = items;
        self.selected = 0;
        self.scroll_offset = 0;
    }

    /// Clear all items
    pub fn clear(&mut self) {
        self.items.clear();
        self.selected = 0;
        self.scroll_offset = 0;
    }

    /// Get the selected index relative to the visible window
    pub fn selected_in_view(&self) -> usize {
        self.selected.saturating_sub(self.scroll_offset)
    }

    /// Check if we can scroll up
    pub fn can_scroll_up(&self) -> bool {
        self.scroll_offset > 0
    }

    /// Check if we can scroll down
    pub fn can_scroll_down(&self, visible_rows: usize) -> bool {
        self.scroll_offset + visible_rows < self.items.len()
    }
}

impl<T> Default for ScrollableList<T> {
    fn default() -> Self {
        Self {
            items: Vec::new(),
            selected: 0,
            scroll_offset: 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scrollable_list_new() {
        let list = ScrollableList::new(vec![1, 2, 3, 4, 5]);
        assert_eq!(list.len(), 5);
        assert_eq!(list.selected, 0);
        assert_eq!(list.scroll_offset, 0);
    }

    #[test]
    fn test_scrollable_list_navigation() {
        let mut list = ScrollableList::new(vec![1, 2, 3, 4, 5]);

        list.next(3);
        assert_eq!(list.selected, 1);

        list.previous();
        assert_eq!(list.selected, 0);

        list.last(3);
        assert_eq!(list.selected, 4);

        list.first();
        assert_eq!(list.selected, 0);
    }

    #[test]
    fn test_scrollable_list_scrolling() {
        let mut list = ScrollableList::new(vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        // Move down past visible area
        for _ in 0..5 {
            list.next(3);
        }

        assert_eq!(list.selected, 5);
        assert!(list.scroll_offset > 0);

        // Move back up
        for _ in 0..3 {
            list.previous();
        }

        assert_eq!(list.selected, 2);
    }

    #[test]
    fn test_scrollable_list_selected_item() {
        let mut list = ScrollableList::new(vec!["a", "b", "c"]);

        assert_eq!(list.selected_item(), Some(&"a"));

        list.next(3);
        assert_eq!(list.selected_item(), Some(&"b"));

        list.last(3);
        assert_eq!(list.selected_item(), Some(&"c"));
    }

    #[test]
    fn test_scrollable_list_visible_items() {
        let list = ScrollableList::new(vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        let visible = list.visible_items(5);
        assert_eq!(visible, &[1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_scrollable_list_page_navigation() {
        let mut list = ScrollableList::new(vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

        list.page_down(5);
        assert!(list.selected >= 5);

        list.page_up(5);
        assert!(list.selected < 10);
    }

    #[test]
    fn test_scrollable_list_clear() {
        let mut list = ScrollableList::new(vec![1, 2, 3]);
        list.next(3);

        list.clear();
        assert!(list.is_empty());
        assert_eq!(list.selected, 0);
        assert_eq!(list.scroll_offset, 0);
    }
}
