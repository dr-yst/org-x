## Why

Filtering is the primary interaction mode for org-mode viewers. Users need to quickly narrow down thousands of headlines to find what matters — tasks due today, high-priority items, or specific projects. Without robust filtering, the table becomes overwhelming at scale.

## What Changes

- **Multi-condition filtering** by TODO state, tags, priority, and date ranges
- **Free-text search** across title and content with 300ms debounce
- **Server-side filtering** for datasets >5K rows to maintain performance
- **Configurable TODO keywords** beyond standard TODO/DONE
- **Custom properties** for column display
- **External editor command** configuration with placeholders

## Capabilities

### New Capabilities
- `filters`: Multi-condition filtering UI and server-side query engine
- `search`: Free-text search with debouncing
- `settings-customization`: TODO keywords, custom properties, and editor configuration

### Modified Capabilities
- None

## Impact

- **Frontend**: Filter UI components, search input with debounce
- **Backend**: Query engine with filtering logic, pagination support
- **Settings**: Extended configuration for keywords, properties, editor
