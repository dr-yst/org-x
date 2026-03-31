# Domain Pitfalls: Org-Mode Desktop Applications with Tauri

**Domain:** Desktop org-mode viewer with Tauri + Svelte  
**Researched:** 2025-03-31  
**Confidence:** HIGH

## Critical Pitfalls

Mistakes that cause rewrites, performance collapse, or user abandonment.

### Pitfall 1: IPC Serialization Bottleneck with Large Datasets

**What goes wrong:**  
Sending thousands of parsed org headlines through Tauri's IPC bridge causes severe UI freezes. JSON serialization of large arrays (10,000+ items) blocks the main thread and can take seconds.

**Why it happens:**
- Every Tauri command serializes return values to JSON
- Org-mode files can contain 5,000-10,000+ headlines across multiple files
- Frontend filtering requires all data in memory
- Blocking serialization during initial load or file refresh

**Consequences:**
- App becomes unresponsive during file parsing
- Memory spikes to 500MB+ with large datasets
- Initial load times of 5-30 seconds
- User perceives app as "broken"

**Prevention:**
```rust
// DON'T: Return massive datasets in one call
#[tauri::command]
async fn get_all_headlines() -> Result<Vec<Headline>, String> {
    // This blocks with 10K+ items
    Ok(load_all_headlines().await)
}

// DO: Use pagination or keep data in Rust
#[tauri::command]
async fn get_headlines_page(
    offset: usize,
    limit: usize,
    filters: FilterOptions
) -> Result<PaginatedResults, String> {
    // Process only visible chunk, filter in Rust
    let filtered = apply_filters_in_rust(filters).await;
    Ok(PaginatedResults {
        items: filtered.into_iter().skip(offset).take(limit).collect(),
        total: filtered.len(),
        has_more: filtered.len() > offset + limit,
    })
}

// DO: Use channels for streaming large datasets
#[tauri::command]
async fn stream_headlines(channel: Channel<HeadlineBatch>) {
    let batches = load_in_batches(1000);
    for batch in batches {
        channel.send(batch).unwrap();
        tokio::task::yield_now().await;
    }
}
```

**Detection (warning signs):**
- [ ] Initial app load > 3 seconds with moderate file sets
- [ ] Memory usage > 100MB at idle
- [ ] UI freezing during "Loading..." states
- [ ] DevTools showing massive JSON payloads in Network tab

**Phase to address:** MVP (Phase 1) - Core infrastructure

---

### Pitfall 2: Full Re-parse on Every File Change

**What goes wrong:**  
When any file changes, the entire directory is re-parsed. For users with 50+ org files, a single character edit triggers 5-10 seconds of re-parsing.

**Why it happens:**
- Simple implementation watches directories and reloads everything
- No incremental parsing strategy
- No distinction between "metadata change" and "content change"

**Consequences:**
- Rapid file edits (autosave in external editor) overwhelm the app
- Battery drain from constant re-parsing
- UI constantly refreshing, losing scroll position
- Potential for parse conflicts during active editing

**Prevention:**
```rust
// Implement incremental updates
struct OrgCache {
    documents: HashMap<PathBuf, CachedDocument>,
    headlines_index: Vec<HeadlineRef>, // pointers, not copies
}

impl OrgCache {
    async fn handle_file_change(&mut self, path: PathBuf, change_type: ChangeType) {
        match change_type {
            ChangeType::Modified => {
                // Parse only changed file
                let doc = self.parse_file(&path).await;
                // Update index incrementally
                self.update_headlines_for_document(&path, &doc);
                self.documents.insert(path, doc);
            }
            ChangeType::Created => { /* Add new */ }
            ChangeType::Deleted => { /* Remove from index */ }
        }
    }
    
    fn update_headlines_for_document(&mut self, path: &Path, doc: &Document) {
        // Remove old headlines for this file
        self.headlines_index.retain(|h| h.source_path != path);
        // Add new headlines
        for headline in &doc.headlines {
            self.headlines_index.push(HeadlineRef::new(headline, path));
        }
    }
}
```

**Detection (warning signs):**
- [ ] File change triggers full UI refresh
- [ ] Scroll position resets after external edit
- [ ] App uses 100% CPU during active editing in external editor
- [ ] Debouncing doesn't help because work is still O(n) with file count

**Phase to address:** Post-MVP (Phase 2) - Performance optimization

---

### Pitfall 3: File Watcher Event Loss at Scale

**What goes wrong:**  
The `notify` crate drops events when watching many directories or files. With 1,500+ watched paths, 15-20% of file changes are silently missed.

**Why it happens:**
- OS-level file descriptor limits
- notify's internal event queue overflow
- Platform-specific behavior differences (macOS fsevents vs Linux inotify)
- No retry mechanism for missed events

**Consequences:**
- User edits file but app doesn't update
- Sync conflicts between external editor and app state
- Data appears "stale" or out of date
- User loses trust in the "auto-reload" feature

**Prevention:**
```rust
// Use debouncer with proper configuration
use notify_debouncer_full::{new_debouncer, DebouncedEvent};
use std::time::Duration;

fn setup_watcher(paths: Vec<PathBuf>) -> Result<impl Watcher> {
    let (tx, rx) = std::sync::mpsc::channel();
    
    // 500ms debounce - adjust based on user feedback
    let mut debouncer = new_debouncer(
        Duration::from_millis(500),
        None,
        move |result: Result<Vec<DebouncedEvent>, _>| {
            if let Ok(events) = result {
                for event in events {
                    let _ = tx.send(event);
                }
            }
        },
    )?;
    
    // Watch parent directories instead of individual files
    // Reduces watcher count from thousands to dozens
    let parent_dirs = extract_parent_directories(&paths);
    for dir in parent_dirs {
        debouncer.watcher().watch(&dir, RecursiveMode::NonRecursive)?;
    }
    
    Ok(debouncer)
}

// Implement periodic full-scan as safety net
async fn periodic_sync(watched_paths: Vec<PathBuf>, interval: Duration) {
    let mut interval = tokio::time::interval(interval);
    loop {
        interval.tick().await;
        // Compare mtime of all files against cache
        // Re-parse any files that changed but weren't caught by watcher
    }
}
```

**Detection (warning signs):**
- [ ] File changes sometimes don't appear in app
- [ ] User reports "I have to restart to see updates"
- [ ] Intermittent missing updates that can't be reproduced consistently
- [ ] Issue appears only with large directory trees

**Phase to address:** MVP (Phase 1) - File monitoring infrastructure

---

### Pitfall 4: Frontend Filtering on Large Datasets

**What goes wrong:**  
Filtering, sorting, and searching thousands of headlines in the frontend causes UI jank. Every keystroke in search triggers full array re-filtering.

**Why it happens:**
- Svelte's reactivity re-runs filters on every dependency change
- No virtualization means all items are in DOM even when not visible
- Complex filter logic (regex, multi-field, date ranges) is expensive
- No debouncing on search input

**Consequences:**
- Typing in search field has visible lag
- "Typeahead" feels broken or unresponsive
- Memory usage grows with dataset, not viewport
- Battery drain on laptops

**Prevention:**
```typescript
// DON'T: Filter in derived store with large datasets
export const filteredHeadlines = derived(
  [headlines, filters],
  ([$headlines, $filters]) => {
    // This re-runs on EVERY filter change - O(n) each time
    return $headlines.filter(h => matchesFilters(h, $filters));
  }
);

// DO: Server-side filtering with debouncing
class HeadlineStore {
  private searchDebounce = debounce(150);
  private abortController: AbortController | null = null;
  
  async updateSearch(query: string) {
    // Cancel in-flight requests
    this.abortController?.abort();
    this.abortController = new AbortController();
    
    await this.searchDebounce(async () => {
      const results = await commands.searchHeadlines(
        query, 
        this.filters,
        this.abortController!.signal
      );
      this.headlines.set(results);
    });
  }
}

// DO: Virtualize the list
import { createVirtualizer } from '@tanstack/svelte-virtual';

const virtualizer = createVirtualizer({
  count: headlines.length,
  getScrollElement: () => scrollElement,
  estimateSize: () => 48, // row height
  overscan: 5, // render 5 items above/below viewport
});
```

**Detection (warning signs):**
- [ ] Search input feels laggy (>100ms between keystroke and response)
- [ ] Chrome DevTools shows long scripting times during filtering
- [ ] Frame rate drops below 30fps when scrolling
- [ ] Memory usage increases linearly with headline count

**Phase to address:** MVP (Phase 1) - Task list view

---

### Pitfall 5: Keyboard Navigation Focus Traps

**What goes wrong:**  
Complex keyboard shortcuts conflict with each other or trap focus in unrecoverable states. Users can't navigate out of modals or lose focus entirely.

**Why it happens:**
- Multiple components registering global shortcuts
- No centralized shortcut registry
- Focus management not considered for virtualized lists
- Conflicts between app shortcuts and OS shortcuts

**Consequences:**
- Users "stuck" in modals or views with no escape
- Shortcuts don't work consistently across contexts
- Accessibility violations (WCAG failures)
- Power users frustrated by unreliable keyboard workflow

**Prevention:**
```typescript
// Centralized keyboard shortcut registry
class KeyboardRegistry {
  private shortcuts = new Map<string, ShortcutHandler>();
  private contextStack: string[] = ['global'];
  
  register(shortcut: string, handler: ShortcutHandler, context: string = 'global') {
    this.shortcuts.set(`${context}:${shortcut}`, handler);
  }
  
  pushContext(context: string) {
    this.contextStack.push(context);
  }
  
  popContext() {
    if (this.contextStack.length > 1) {
      this.contextStack.pop();
    }
  }
  
  handleKey(event: KeyboardEvent) {
    // Check contexts in reverse order (most specific first)
    for (const context of [...this.contextStack].reverse()) {
      const key = formatKey(event);
      const handler = this.shortcuts.get(`${context}:${key}`);
      if (handler) {
        event.preventDefault();
        handler();
        return;
      }
    }
  }
}

// Virtualized list keyboard handling
function handleListKeydown(event: KeyboardEvent, virtualizer: Virtualizer) {
  const { selectedIndex, setSelectedIndex } = getSelectionState();
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      const nextIndex = Math.min(selectedIndex + 1, virtualizer.getTotalSize() - 1);
      setSelectedIndex(nextIndex);
      virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
      break;
    case 'ArrowUp':
      // Similar for up
      break;
    case 'Enter':
      // Open selected item
      break;
    case 'Escape':
      // Always provide escape hatch
      clearSelection();
      break;
  }
}
```

**Detection (warning signs):**
- [ ] Tab navigation gets "stuck" in certain components
- [ ] Escape key doesn't close modals consistently
- [ ] Shortcuts work in some views but not others
- [ ] Screen reader users report navigation issues

**Phase to address:** MVP (Phase 1) - Keyboard navigation

---

## Moderate Pitfalls

### Pitfall 6: Memory Leak in Event Listeners

**What goes wrong:**  
Tauri event listeners and Svelte stores accumulate over time, causing memory to grow with app usage duration.

**Why it happens:**
- Event listeners not cleaned up when components unmount
- Stores subscribing to events but never unsubscribing
- File watcher events creating closures that capture large objects

**Prevention:**
```typescript
// Always clean up listeners
onMount(() => {
  const unlisten = listen('file-change', handleFileChange);
  
  return () => {
    unlisten.then(f => f()); // Tauri returns Promise<UnlistenFn>
  };
});

// Use takeUntilDestroyed for Svelte 5
import { takeUntilDestroyed } from '$lib/utils';

class DocumentStore {
  constructor() {
    listen('file-change', (e) => this.handleChange(e))
      .then(unlisten => {
        takeUntilDestroyed(this, unlisten);
      });
  }
}
```

**Phase to address:** Post-MVP (Phase 2) - Stability

---

### Pitfall 7: Platform-Specific Path Handling

**What goes wrong:**  
Windows paths with backslashes, spaces, or special characters cause file operations to fail.

**Why it happens:**
- Assumption that all platforms use forward slashes
- Not using Rust's `Path`/`PathBuf` types consistently
- External editor commands not properly escaped

**Prevention:**
```rust
// Use PathBuf for all path operations
pub async fn open_in_editor(path: PathBuf, line: Option<usize>) -> Result<()> {
    let editor = settings.get_editor_command();
    
    // Platform-aware command building
    let mut cmd = if cfg!(windows) {
        let mut c = Command::new("cmd");
        c.arg("/C").arg(&editor);
        c
    } else {
        Command::new(&editor)
    };
    
    // Pass path as argument (properly escaped by Rust)
    if let Some(line_num) = line {
        cmd.arg(format!("+{}", line_num));
    }
    cmd.arg(path); // PathBuf handles escaping
    
    cmd.spawn()?;
    Ok(())
}
```

**Phase to address:** MVP (Phase 1) - Cross-platform support

---

### Pitfall 8: Settings Schema Without Versioning

**What goes wrong:**  
App crashes on startup after updates when settings format changes. No migration path for existing users.

**Why it happens:**
- Settings serialized/deserialized without version field
- New required fields added without defaults
- No migration logic for old settings formats

**Prevention:**
```rust
#[derive(Serialize, Deserialize)]
struct Settings {
    version: u32, // Always include version
    monitored_paths: Vec<PathBuf>,
    todo_keywords: Vec<String>,
    // ... other fields
}

impl Settings {
    const CURRENT_VERSION: u32 = 2;
    
    pub fn load() -> Result<Self> {
        let data = fs::read_to_string(settings_path())?;
        let mut settings: serde_json::Value = serde_json::from_str(&data)?;
        
        let version = settings.get("version")
            .and_then(|v| v.as_u64())
            .unwrap_or(1) as u32;
        
        // Migrate from v1 to v2
        if version == 1 {
            settings = migrate_v1_to_v2(settings);
        }
        
        serde_json::from_value(settings)
            .map_err(|e| e.into())
    }
}
```

**Phase to address:** MVP (Phase 1) - Settings system

---

## Minor Pitfalls

### Pitfall 9: Org-Mode Parsing Edge Cases

**What goes wrong:**  
Parser fails on valid but uncommon org-mode syntax (drawers with special characters, timestamps in specific formats, property drawers).

**Prevention:**
- Use battle-tested parser (Orgize) rather than custom regex
- Create comprehensive test corpus with edge cases
- Graceful degradation - show raw text if parsing fails

**Phase to address:** Ongoing - Parser improvements

---

### Pitfall 10: Over-eager Auto-Reload

**What goes wrong:**  
Rapid file saves (e.g., from autosave) trigger multiple reloads, causing flicker and performance issues.

**Prevention:**
- Implement 500ms debounce on all file changes
- Show "refreshing..." indicator to set user expectations
- Batch multiple rapid changes into single update

**Phase to address:** MVP (Phase 1) - File monitoring

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|----------------|------------|
| **MVP** | Task list table | Rendering all headlines without virtualization | Use TanStack Virtual or svelte-virtuallists from day one |
| **MVP** | Search/filter | Frontend filtering causing lag | Implement server-side filtering in Rust |
| **MVP** | File watching | Missing events in large directories | Debounce + periodic full-scan fallback |
| **MVP** | Keyboard nav | Focus traps, conflicting shortcuts | Centralized shortcut registry |
| **MVP** | Settings | No schema versioning | Include version field, write migration logic |
| **Post-MVP** | Incremental parsing | Full re-parse on every change | Cache parsed documents, update incrementally |
| **Post-MVP** | Memory | Event listener leaks | Audit all listen() calls for cleanup |
| **Future** | Large files (>10MB) | UI freeze on open | Stream parsing, show progress indicator |
| **Future** | Sync | Conflict resolution | Last-write-wins + manual merge UI |

---

## Confidence Assessment

| Pitfall | Confidence | Evidence |
|---------|------------|----------|
| IPC Serialization Bottleneck | HIGH | Tauri docs, production case studies, GitHub issues |
| Full Re-parse Performance | HIGH | CONCERNS.md already documents this, org-ro issue #52 |
| File Watcher Event Loss | HIGH | notify-rs issue #412, documented limitation |
| Frontend Filtering Lag | HIGH | Svelte store performance guides, TanStack Virtual recommendations |
| Keyboard Navigation Traps | MEDIUM | Accessibility best practices, common in complex apps |
| Memory Leaks | MEDIUM | Tauri issue #12724, general web app pattern |
| Path Handling | HIGH | Common cross-platform issue with known solutions |
| Settings Versioning | HIGH | App development best practice |

---

## Sources

### Official Documentation
- [Tauri Performance Guide](https://tauri.app/v2/guides/performance/) - IPC optimization, array buffer usage
- [Tauri State Management](https://v2.tauri.app/develop/state-management/) - Managing large state in Rust

### GitHub Issues
- [notify-rs/notify #412](https://github.com/notify-rs/notify/issues/412) - Large scale watching drops events
- [tauri-apps/tauri #12724](https://github.com/tauri-apps/tauri/issues/12724) - Memory leak when emitting events
- [tauri-apps/tauri #10327](https://github.com/tauri-apps/tauri/issues/10327) - IPC issues with complex values
- [amake/orgro #52](https://github.com/amake/orgro/issues/52) - Bad performance on large org files
- [huntabyte/shadcn-svelte #2484](https://github.com/huntabyte/shadcn-svelte/issues/2484) - Table performance issues

### Case Studies
- [Tauri + Rust = Speed, But Here's Where It Breaks Under Pressure](https://medium.com/@srish5945/tauri-rust-speed-but-heres-where-it-breaks-under-pressure-fef3e8e2dcb3) - Production lessons
- [When 120,000 Files Meet Tauri](https://www.reddit.com/r/rust/comments/1qqx78l/when_120000_files_meet_tauri_what_i_learned_about/) - IPC serialization lessons

### Libraries
- [TanStack Virtual](https://tanstack.com/virtual/latest) - Virtualization for large lists
- [svelte-virtuallists](https://github.com/orefalo/svelte-virtuallists) - Svelte-specific virtualization

---

## Research Gaps

- **Orgize parser limitations** - Need to test with pathological org files (10K+ headlines)
- **macOS fsevents vs inotify behavior** - Platform-specific stress testing needed
- **WebView memory limits** - Unknown threshold for dataset size
- **Real-world file change patterns** - How often do users' org files actually change?

These gaps should be addressed with phase-specific research before committing to architecture decisions.
