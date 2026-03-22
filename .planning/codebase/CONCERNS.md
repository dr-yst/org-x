# Concerns: Org-X

**Last Updated:** 2025-03-22

## Technical Debt

### High Priority

#### 1. Mixed State Management Patterns
**Issue:** Both Svelte 4 stores and Svelte 5 runes used inconsistently.
- Some components use `$state`/`$derived` (Svelte 5)
- Some use `writable`/`derived` stores (Svelte 4 style)
- Migration in progress but incomplete

**Impact:** Confusion about which pattern to use, inconsistent code
**Location:** Throughout `src/lib/components/`
**Mitigation:** Standardize on Svelte 5 runes for new code, migrate stores incrementally

#### 2. Auto-Generated Bindings File
**Issue:** `src/lib/bindings.ts` is 684 lines of auto-generated code.
- Changes on every dev build (debug mode)
- Creates noisy git diffs
- Can cause merge conflicts

**Impact:** Repository bloat, PR noise
**Location:** `src/lib/bindings.ts`
**Mitigation:** Add to `.gitignore`, generate in CI

### Medium Priority

#### 3. Test Coverage Gaps
**Issue:** Backend Rust code has minimal test coverage.
- Frontend: ~6,300 lines of tests
- Backend: Very few tests

**Impact:** Rust changes riskier, regressions possible
**Location:** `src-tauri/src/`
**Mitigation:** Add unit tests for core org-mode parsing logic

#### 4. File Structure Inconsistency
**Issue:** Components in multiple locations:
- `src/lib/components/HomeView.svelte`
- `src/lib/components/home-view/HomeView.svelte`
- Both exist with different purposes

**Impact:** Confusion about which file to import
**Location:** `src/lib/components/`
**Mitigation:** Consolidate and remove duplicates

#### 5. Legacy Stores
**Issue:** `src/lib/stores/documents.ts` exists but is being replaced by viewmodels.
- Unclear which to use
- Potential for state duplication

**Impact:** Maintenance burden, potential bugs
**Location:** `src/lib/stores/`
**Mitigation:** Complete migration, remove legacy stores

## Known Issues

### 1. Filter State Synchronization
**Issue:** Multiple filter states (legacy + new sidebar filters)
- `activeFilterIndex` (legacy date filter)
- `todoFilter`, `dateFilter`, `searchQuery` (new sidebar filters)

**Impact:** Filter logic complex, edge cases
**Location:** `src/lib/viewmodels/homeview.store.ts`

### 2. External Editor Command Execution
**Issue:** Command injection risk if user enters malicious command
- No sanitization of external editor command
- User input trusted implicitly

**Impact:** Security concern (low - requires user action)
**Location:** `src-tauri/src/api.rs` - `open_file_in_external_editor`
**Mitigation:** Validate command, whitelist allowed executables

### 3. Error Handling Inconsistency
**Issue:** Some commands return `Result<T, String>`, others panic
- Not all error cases handled gracefully
- User sees technical error messages

**Impact:** Poor UX on errors
**Location:** Various API commands

## Performance Concerns

### 1. Frontend Filtering
**Issue:** All filtering done in frontend on large datasets
- Large org files could cause UI lag
- No virtualization for long lists

**Impact:** Performance degradation with many headlines
**Location:** `src/lib/viewmodels/homeview.store.ts` - `filteredHeadlines`
**Mitigation:** Add virtualization, consider backend filtering

### 2. File Monitoring Overhead
**Issue:** Notify watches entire directory trees
- Could be expensive for large directory structures
- No debouncing on rapid file changes

**Impact:** CPU/battery usage
**Location:** `src-tauri/src/orgmode/monitor.rs`

### 3. Document Parsing
**Issue:** Full re-parse on every file change
- No incremental parsing
- All documents reloaded on any change

**Impact:** Slower updates for large files
**Location:** `src-tauri/src/orgmode/parser.rs`

## Maintenance Concerns

### 1. Dependencies
**Issue:** Many frontend dependencies
- 60+ devDependencies
- UI library (bits-ui) adds many transitive deps

**Impact:** Security surface area, update burden
**Mitigation:** Regular `pnpm audit`, dependency updates

### 2. Documentation Drift
**Issue:** README describes features that may not be complete
- "Read-Only Viewer" but editing features planned
- Roadmap may be outdated

**Impact:** User confusion
**Location:** `README.md`, `dev-docs/`

### 3. Type Definition Duplication
**Issue:** Types defined in both Rust and TypeScript
- Rust types: `src-tauri/src/orgmode/`
- TS types: `src/lib/types/` and auto-generated
- Some drift possible

**Impact:** Type mismatches between frontend/backend
**Mitigation:** Rely on tauri-specta generated types exclusively

## Fragile Areas

### 1. Org-Mode Parsing Edge Cases
**Issue:** Org-mode is complex and flexible
- Parser may not handle all valid org syntax
- Edge cases in timestamps, properties, drawers

**Impact:** Data loss or display issues
**Location:** `src-tauri/src/orgmode/parser.rs`

### 2. Keyboard Shortcuts
**Issue:** Complex keyboard handling
- Emacs-style shortcuts
- Context-dependent shortcuts
- Conflicts possible

**Impact:** Shortcuts may not work in all contexts
**Location:** Various components with keyboard handlers

### 3. Settings Migration
**Issue:** Settings schema changes over time
- No versioning/migration system
- Old settings may cause issues

**Impact:** App crash on startup with incompatible settings
**Location:** `src-tauri/src/settings.rs`

## Security Notes

- **No network access** - reduces attack surface
- **File system access** limited to user-selected paths
- **External editor** commands are user-configured (trust boundary)
- **No secrets** in codebase

## Recommended Actions

### Immediate (Next Sprint)
1. Complete Svelte 5 migration - remove legacy stores
2. Add `.gitignore` for `bindings.ts` or generate in CI
3. Add basic Rust unit tests for parser

### Short Term (Next Month)
1. Consolidate component file locations
2. Add error boundary component for graceful error handling
3. Implement settings schema versioning

### Long Term
1. Add virtualization for large lists
2. Implement incremental file parsing
3. Add end-to-end tests with real org files
