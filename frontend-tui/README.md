# BizRay TUI

A Terminal User Interface for the BizRay backend, built with Rust and Ratatui.

## Current Status (MVP)

✅ **Implemented**:
- Authentication (Login screen)
- Company Search with real-time API integration
- Paginated Results with vim-style navigation
- Async operations with tokio
- Theme system with color-coded risk indicators

🚧 **In Progress**:
- Company Details screen
- Account Management
- Help screen

## Features

- **Authentication**: Login with email/password
- **Company Search**: Search Austrian companies with async API calls
- **Paginated Results**: Browse companies with j/k navigation, n/p for pages
- **Risk Indicators**: Color-coded risk levels (🟢 Low, 🟡 Medium, 🔴 High)
- **Vim-style Navigation**: Intuitive keybindings for power users

## Installation

### Prerequisites

- Rust 1.70 or higher
- Access to BizRay API endpoint

### Build from Source

```bash
cd frontend-tui
cargo build --release
```

The binary will be available at `target/release/bizray-tui`

## Configuration

On first run, the application will create a config file at `~/.config/bizray-tui/config.toml`

You can customize:
- API endpoint URL
- Page size for search results
- UI preferences

See `config-example.toml` for all available options.

## Usage

```bash
# Run the TUI
cargo run --release

# Or run the built binary
./target/release/bizray-tui
```

### Quick Start

1. **Login**: Enter your BizRay credentials on the login screen
2. **Search**: Type at least 3 characters and press Enter
3. **Browse**: Use j/k to navigate results, n/p for pages
4. **Quit**: Press q or Ctrl+C

### Keybindings (Currently Implemented)

#### Global
- `q` - Quit application (from any screen except login)
- `Ctrl+C` - Quit immediately
- `ESC` - Go back to previous screen

#### Login Screen ✅
- `TAB` / `Shift+TAB` - Navigate between email/password fields
- `Enter` - Submit login
- Type normally to enter text
- `Backspace` - Delete character

#### Search Screen ✅
- Type directly to enter search query
- `Enter` - Execute search (minimum 3 characters)
- `Ctrl+F` - Toggle city filter (not yet functional)

#### Results Screen ✅
- `j` or `↓` - Move down the list
- `k` or `↑` - Move up the list
- `g` - Jump to first result
- `G` - Jump to last result
- `n` - Next page
- `p` - Previous page
- `/` - Go back to search
- `ESC` - Go back to search

### Features Not Yet Implemented
- Company Details view (pressing Enter on a result)
- City filtering
- Account management
- Help screen
- Registration

## Development

### Project Structure

```
frontend-tui/
├── src/
│   ├── main.rs              # Entry point, event loop
│   ├── app.rs               # Application state
│   ├── config/              # Configuration management
│   ├── api/                 # API client and endpoints
│   ├── ui/                  # UI screens and components
│   ├── events.rs            # Event handling
│   ├── navigation.rs        # Screen navigation
│   └── error.rs             # Error types
└── Cargo.toml
```

### Running Tests

```bash
cargo test
```

### Code Style

```bash
cargo fmt
cargo clippy
```

## Security

**Important**: The JWT token is stored in the configuration file. Ensure proper file permissions:

```bash
chmod 600 ~/.config/bizray-tui/config.toml
```

Never commit your `config.toml` with actual credentials to version control.

## License

Copyright © 2025 BizRay

## Contributing

This is a private project. For issues or feature requests, contact the development team.
