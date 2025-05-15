# Org-X Technical Context

## Technology Stack

### Frontend
- **Framework**: Svelte 5
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn-svelte

### Backend
- **Language**: Rust
- **Framework**: Tauri 2.0
- **org-mode Parser**: Orgize
- **Type Definition Sync**: tauri-specta

### Development Tools
- **Package Manager**: pnpm
- **Build Tool**: Vite
- **Testing**: Vitest, Rust standard testing framework

## Development Environment

### Required Tools
- Node.js (v18+)
- Rust (1.75.0+)
- pnpm
- cargo-tauri CLI

### Setup
```bash
# Clone repository
git clone https://github.com/dr-yst/org-x.git
cd org-x

# Install dependencies
pnpm install

# Development
pnpm tauri dev

# Production build
pnpm tauri build
```

## Key Technical Decisions

### Tauri
- Lighter than Electron with native web view
- Secure Rust backend
- Easy file system access and native features

### Svelte 5
- Fast rendering without virtual DOM
- Enhanced reactivity with Runes
- Lightweight bundle size

### shadcn-svelte
- Accessible, customizable UI components
- Built with Svelte and Tailwind CSS
- Copy-and-paste approach for full component control
- Dark mode support

### Orgize
- Fast org-mode parser in Rust
- Support for complete org-mode syntax
- Event-based API

### tauri-specta
- Automatic type synchronization between Rust and TypeScript
- Generates TypeScript from Rust structs
- Simplifies cross-language API development

### Server-Side Filtering
- Implemented in Rust for performance
- Reduces data transfer and browser memory usage
- Enables handling large org-mode files efficiently

## State Management

- Frontend: Svelte 5 runes (signals, computed, effects)
- Backend: Rust state management for documents and metadata
- Type-safe state updates between Rust and Svelte

## Technical Challenges

- Performance with large org-mode files
- Cross-platform editor integration
- Svelte 5 compatibility with testing frameworks
- Efficient data transfer between frontend and backend
- Keyboard navigation system implementation

## Release Strategy

- Cross-platform builds via GitHub Actions
- Semantic versioning (major.minor.patch)
- Automated tests before release