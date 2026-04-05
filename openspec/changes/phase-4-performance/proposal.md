## Why

Performance is not a feature — it's a requirement for usability. Power users have thousands of headlines across dozens of files. The app must remain responsive under realistic workloads and stable during extended usage. This phase ensures Org-X meets its performance guarantees.

## What Changes

- **Large dataset optimization** — handle 1,000+ headlines without jank
- **Filtering performance** — <100ms response for typical datasets
- **Initial load optimization** — <3 seconds for 50 files
- **Memory stability** — no leaks during 8+ hour sessions
- **Battery efficiency** — no polling or excessive re-parsing

## Capabilities

### New Capabilities
- `performance`: Large dataset handling, memory management, battery efficiency

### Modified Capabilities
- None (this phase optimizes existing capabilities)

## Impact

- **Frontend**: Virtual scrolling tuning, render optimization
- **Backend**: Query optimization, caching strategies
- **System**: Memory profiling, leak detection
