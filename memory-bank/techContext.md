# Org-X Technical Context

## Technology Stack

### Frontend
- **Framework**: Svelte 5
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Build Tool**: Vite
- **Package Manager**: pnpm

### Backend
- **Language**: Rust
- **Framework**: Tauri 2.0
- **org-mode Parser**: Orgize
- **Type Definition Sync**: tauri-specta

### Testing
- **Frontend Testing**: Vitest, Testing Library
- **Backend Testing**: Rust standard testing framework

## Development Environment

### Required Tools
- Node.js (v18 or higher)
- Rust (1.75.0 or higher)
- pnpm
- cargo-tauri CLI

### Development Environment Setup
```bash
# Clone repository
git clone https://github.com/username/org-x.git
cd org-x

# Install frontend dependencies
pnpm install

# Start development server
pnpm tauri dev
```

### Build Process
```bash
# Production build
pnpm tauri build
```

## Technical Requirements and Constraints

### Performance Requirements
- Ability to quickly parse large org-mode files (several MB)
- Fast response to keyboard operations (within 100ms)
- Smooth display of multiple files simultaneously

### Cross-Platform Support
- Provide equivalent operability on Windows, macOS, and Linux
- Abstract platform-specific features

### Accessibility
- Screen reader support
- Full keyboard navigation support
- High contrast mode

## Technical Decisions

### Reasons for Adopting Tauri
- Lighter and faster than Electron
- Utilizes system native web view
- Secure backend implementation with Rust
- Easy implementation of native features like file system access

### Reasons for Adopting Svelte 5
- Fast rendering without virtual DOM
- Reduced code volume and improved readability
- Enhanced reactive functionality with Runes
- Lightweight bundle size

### Reasons for Adopting TailwindCSS
- Rapid development with utility-first approach
- Building a consistent design system
- High customizability
- Optimized by eliminating unused CSS

### Reasons for Adopting Orgize
- Fast org-mode parser implemented in Rust
- Support for complete org-mode syntax
- Active maintenance
- Customizable event-based API

## Dependency Management

### Frontend Dependencies
Key dependencies:
- svelte
- @sveltejs/kit
- tailwindcss
- @tauri-apps/api
- date-fns (for date processing)
- marked (for markdown processing, for markdown blocks in org-mode)

### Backend Dependencies
Key dependencies:
- tauri
- orgize
- serde (for serialization)
- tokio (for asynchronous processing)
- notify (for file change monitoring)
- specta (for type definitions)

## Deployment and Release

### Release Workflow
1. Cross-platform build using GitHub Actions
2. Automated test execution
3. Application packaging
4. Automatic upload to GitHub Releases

### Versioning Strategy
- Adoption of semantic versioning
- Major version: Breaking changes
- Minor version: Backward-compatible feature additions
- Patch version: Bug fixes and small improvements

## Technical Debt and Challenges

### Current Challenges
- Optimization of Orgize library wrapping
- Building a keyboard shortcut system
- Efficient data transfer between frontend and backend
- Efficient display of large org-mode files

### Future Technical Challenges
- Implementation of offline editing functionality
- Building a custom theme system
- Adding plugin functionality
- Implementation of synchronization functionality