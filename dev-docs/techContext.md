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

## Repository Information

### GitHub Repository
- **Repository URL**: [https://github.com/dr-yst/org-x](https://github.com/dr-yst/org-x)
- **Owner**: dr-yst (Yoshito Watanabe)
- **License**: MIT (or appropriate license)

### Issue and Project Management
- GitHub Issues for bug tracking and feature requests
- GitHub Projects for milestone and roadmap planning
- Pull Requests for code review and contribution

### Branch Management
- `main` branch as the primary development branch
- Feature branches for new functionality (`feature/task-list-view`, etc.)
- Bug fix branches for addressing issues (`fix/headline-parsing`, etc.)

### Contribution Workflow
1. Create a new branch from `main`
2. Implement changes and add tests
3. Create a pull request for review
4. Address review feedback
5. Merge to `main` after approval

## Development Environment

### Required Tools
- Node.js (v18 or higher)
- Rust (1.75.0 or higher)
- pnpm
- cargo-tauri CLI

### Development Environment Setup
```bash
# Clone repository
git clone https://github.com/dr-yst/org-x.git
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

### Reasons for Adopting tauri-specta
- Provides automatic type definition synchronization between Rust and TypeScript
- Generates TypeScript interfaces from Rust structs, ensuring type safety across the stack
- Simplifies API development by maintaining consistent type definitions
- Important note: While type definitions are shared, actual data instances exist separately in both environments
  - Backend (Rust) maintains its own instances of data structures
  - Frontend (TypeScript/Svelte) receives serialized copies that are deserialized into separate instances
  - Changes in one environment require explicit synchronization to reflect in the other

### Data Processing Strategy
- Server-side filtering implemented in Rust for better performance with large datasets
- Frontend sends filter configurations to backend, which returns filtered results
- This approach reduces data transfer volume and memory usage in the browser
- Prioritizes simplicity while addressing performance concerns for large org-mode files

## State Management

### Frontend State Management
- Using Svelte 5 runes (signals, computed, effects) for reactive state
- Separate state stores for each view/tab
- Persistent state for saved views and settings
- Type-safe state updates between Rust and Svelte

### Backend State Management
- Rust-based state management for document parsing and metadata
- File monitoring and change detection
- Settings persistence

## Dependency Management

### Frontend Dependencies
Key dependencies:
- svelte
- @sveltejs/kit
- tailwindcss
- @tauri-apps/api
- shadcn-svelte (for UI components)
- date-fns (for date processing)
- marked (for markdown processing, for markdown blocks in org-mode)

### Reasons for Adopting shadcn-svelte
- High-quality, accessible UI components built with Svelte and Tailwind CSS
- Beautifully designed and customizable components
- Unstyled and accessible components that can be adapted to any design system
- Based on Radix UI primitives for robust accessibility
- Copy-and-paste approach allowing for full control over the component code
- Fully compatible with Svelte 5 and supports dark mode
- Strong community support and active maintenance

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
- Implementation of multiple view tabs with state persistence
- Design of complex filter/sort UI that remains intuitive

### Future Technical Challenges
- Implementation of offline editing functionality
- Building a custom theme system
- Adding plugin functionality
- Implementation of synchronization functionality
