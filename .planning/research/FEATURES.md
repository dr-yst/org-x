# Feature Landscape: Org-Mode Desktop Viewers

**Domain:** Org-mode desktop viewer applications (Agenda-style task management)
**Researched:** 2025-03-31
**Confidence:** HIGH

## Overview

This research analyzes org-mode viewer products to identify table stakes, differentiators, and anti-features for power users. Research covered:
- **Emacs org-agenda**: The reference implementation
- **Organice**: Web-based org-mode (200ok.ch)
- **Orgzly**: Android org-mode app
- **beorg**: iOS org-mode app
- **EasyOrg**: Desktop org-mode application
- **Orgro**: Mobile org-mode viewer
- **Logseq**: Outliner with org-mode support

---

## Table Stakes (Must-Have)

Features users expect from any org-mode viewer. Missing these = product feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multi-file support** | Power users maintain separate files per project/context | LOW | Org users split work across files (work.org, personal.org, projects/*.org) |
| **TODO state filtering** | Core org-mode feature; users define custom states (TODO, NEXT, DONE, etc.) | LOW | Must support custom TODO keywords defined in #+TODO |
| **Tag filtering** | Tags are primary organization mechanism in org-mode | LOW | Include tag inheritance (child items inherit parent tags) |
| **Priority filtering** | Priority ([#A], [#B], [#C]) is standard for task ranking | LOW | Support for custom priority ranges |
| **Date/scheduling filtering** | Scheduled dates and deadlines are core to org workflow | MEDIUM | s. (scheduled), d. (deadline), c. (closed) operators expected |
| **Free-text search** | Users expect to search title/content quickly | LOW | Case-insensitive substring matching minimum |
| **Sorting** | Essential for organizing large task lists | LOW | By priority, date, title, file at minimum |
| **Agenda view** | Cross-file task list is the primary use case | MEDIUM | Group by date, show deadlines, scheduled items |
| **Hierarchical display** | Org is an outliner; hierarchy matters | MEDIUM | Show indentation, allow expand/collapse |
| **External editor integration** | Users have established Emacs workflows | LOW | Open file at specific line in user's editor |
| **Keyboard navigation** | Power users are keyboard-driven | MEDIUM | Arrow keys, shortcuts for all actions |
| **Dark/light mode** | Modern UI expectation | LOW | Respect system preference |
| **File monitoring** | Files change in background (Emacs edits) | MEDIUM | Auto-reload when files change on disk |

### Table Stakes: Org-Mode Syntax Support

| Syntax Element | Priority | Notes |
|----------------|----------|-------|
| Headlines with levels | P0 | Core structure (***, ****, etc.) |
| TODO keywords | P0 | With custom state support |
| Tags (:tag1:tag2:) | P0 | Including FILETAGS |
| Properties (drawers) | P1 | :PROPERTIES: blocks |
| Priorities ([#A]) | P1 | Standard A-C, custom ranges nice |
| Scheduling/Deadlines | P1 | SCHEDULED:, DEADLINE: |
| Timestamps | P1 | Active <date> and inactive [date] |
| Links ([[url]]) | P2 | Click to open |
| Checkboxes ([ ], [X]) | P2 | For subtask tracking |
| Logbook drawers | P2 | For time tracking |

---

## Differentiators (Competitive Advantage)

Features that distinguish excellent org-mode viewers from adequate ones.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Advanced search syntax** | Power users need precise filtering beyond basic search | HIGH | Grammar-based queries (Orgzly: `s.today t.work i.todo`) |
| **Saved searches / custom views** | Users define reusable filtered views | MEDIUM | Equivalent to org-agenda-custom-commands |
| **Multiple view modes** | Different contexts need different presentations | MEDIUM | Task list, headline tree, kanban (post-MVP) |
| **Real-time file sync** | Seamless experience with external editors | MEDIUM | Watch filesystem, auto-refresh without manual sync |
| **Advanced filtering UI** | Visual builder for complex queries | MEDIUM | Multi-condition: AND/OR, tags + dates + properties |
| **Column customization** | Users choose what metadata to see | MEDIUM | Show/hide/reorder columns (tags, dates, properties) |
| **Document identification** | Visual distinction between files | LOW | Color coding, badges per file |
| **Agenda grouping** | Organize tasks by properties/tags/dates | MEDIUM | Group by category, project, priority |
| **Habits support** | Track recurring tasks with consistency graphs | MEDIUM | Org-mode habits (STYLE: habit) |
| **Checkbox subtask progress** | Visual progress indicators | LOW | Show [2/5] completion in parent |
| **Quick capture** | Fast task entry without losing flow | MEDIUM | Templates, keyboard shortcuts |
| **Breadcrumb navigation** | Navigate deep hierarchies | LOW | Show path: File > Parent > Child |
| **Export/Share** | Share filtered views | LOW | Copy as markdown, CSV, etc. |
| **Performance with large files** | Handle 10K+ headlines smoothly | HIGH | Virtual scrolling, lazy loading |

### Differentiator: Search Query Grammar

Based on Orgzly and EasyOrg, power users expect:

```
# Basic operators
s.today          # Scheduled today
d.le.7d          # Deadline within 7 days
t.work           # Tagged with :work:
tn.work          # Tagged directly (not inherited)
i.todo           # State is TODO
it.done          # State type is done
p.a              # Priority A
b.work.org       # From specific file

# Combining
s.today t.work i.todo       # AND (implicit)
s.today OR d.today          # OR operator
t.work OR t.personal        # Multiple tags
s.1d p.a i.todo            # Complex combinations

# Negation
.t.work            # NOT tagged work
.i.done            # Not done

# Sorting
o.pri o.sched      # Sort by priority, then scheduled
```

---

## Anti-Features (Deliberately NOT Building)

Features that seem appealing but conflict with org-mode workflow or scope.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Built-in editing** | Users want to make quick changes | Conflicts with "external editor" workflow; risks file corruption; massive scope increase | Seamless external editor integration with auto-reload |
| **Real-time collaboration** | Multiple users editing same files | Org files are plain text; conflict resolution is complex; niche need | Git-based collaboration (version control) |
| **Cloud sync service** | Easy file synchronization | Creates lock-in; security concerns; ongoing infrastructure cost | Support user's existing sync (Dropbox, Syncthing, etc.) |
| **WYSIWYG editing** | Rich formatting without syntax | Org syntax is the point; WYSIWYG breaks plain-text philosophy | Rendered preview mode for viewing only |
| **Mobile app** | Access on phones/tablets | Different interaction patterns; massive additional development | Responsive web view possible future option |
| **Task creation without files** | Quick capture without managing files | Org-mode is file-centric; orphan tasks break the model | Fast capture to designated inbox file |
| **Proprietary format** | Better performance or features | Loses org-mode's core benefit (plain text, portable) | Optimize parsing while keeping org format |
| **Built-in time tracking** | Clock in/out from viewer | Complex state management; viewer should be read-only | Display clock data from logbook drawers |

---

## Feature Dependencies

```
[Multi-file support]
    └──requires──> [File monitoring]
    └──requires──> [Document identification]

[Advanced filtering UI]
    └──requires──> [Basic filtering (tags, states, dates)]
    └──requires──> [Column customization]
    └──enhances──> [Saved searches]

[Saved searches]
    └──requires──> [Search syntax]
    └──requires──> [Persistent settings storage]

[Agenda grouping]
    └──requires──> [Sorting]
    └──requires──> [Property/tag metadata display]

[Habits support]
    └──requires──> [Date filtering]
    └──requires──> [Repeating task understanding]
    └──conflicts──> [Read-only design] (displays habit data only)

[Keyboard navigation]
    └──requires──> [Focus management]
    └──requires──> [Keyboard shortcut system]
    └──enhances──> [All interactive features]

[Performance with large files]
    └──requires──> [Virtual scrolling]
    └──conflicts──> [Full-text search without indexing]
```

### Dependency Notes

- **Multi-file requires file monitoring**: Without auto-reload, multi-file view becomes stale quickly as users edit in Emacs
- **Advanced filtering requires basic filtering**: Can't build complex UI without foundation of simple filters
- **Saved searches require persistent storage**: User-defined views must survive app restarts
- **Habits display requires date logic**: Must understand repeating patterns to show consistency

---

## MVP Definition

### Launch With (v1.0)

Minimum features needed to be useful to org-mode power users.

- [ ] **Multi-file task list view** — Cross-file TODO aggregation is core value
- [ ] **Basic filtering** — By TODO state, tags (with inheritance), priority
- [ ] **Date filtering** — Scheduled and deadline within time ranges
- [ ] **Free-text search** — Quick filter by title/content
- [ ] **Sorting** — By priority, date, title
- [ ] **Hierarchical display** — Show nested structure with expand/collapse
- [ ] **Keyboard navigation** — Arrow keys, shortcuts for filtering
- [ ] **External editor integration** — Open in Emacs at correct line
- [ ] **File monitoring** — Auto-reload on file changes
- [ ] **Dark/light mode** — Basic theme support

### Add After Validation (v1.x)

Features to add once core proves valuable.

- [ ] **Advanced search syntax** — Grammar-based queries (s., d., t. operators)
- [ ] **Saved searches** — Custom views users can name and recall
- [ ] **Column customization** — Show/hide/reorder columns
- [ ] **Advanced filtering UI** — Visual builder for complex queries
- [ ] **Agenda grouping** — Group by date, file, or custom properties
- [ ] **Document color coding** — Visual file identification
- [ ] **Checkbox progress display** — Show completion [2/5] for subtasks

### Future Consideration (v2+)

Features to defer until product-market fit established.

- [ ] **Kanban view** — Requires significant UI work; nice-to-have
- [ ] **Timeline/Gantt view** — Complex visualization; limited demand
- [ ] **Habits tracking display** — Specialized use case
- [ ] **Document mode** — Single-file continuous reading mode
- [ ] **Export capabilities** — PDF, HTML generation
- [ ] **Presentation mode** — Slideshow from org content

---

## Competitor Feature Analysis

| Feature | Emacs org-agenda | Orgzly | Organice | beorg | EasyOrg | Org-X Approach |
|---------|------------------|--------|----------|-------|---------|----------------|
| **Multi-file** | ✓ Native | ✓ | ✓ | ✓ | ✓ | ✓ Core feature |
| **TODO filtering** | ✓ Custom states | ✓ | ✓ | ✓ | ✓ | ✓ Custom keywords |
| **Tag filtering** | ✓ Inheritance | ✓ | ✓ | ✓ | ✓ | ✓ With inheritance |
| **Date filtering** | ✓ Powerful | ✓ | ✓ | ✓ | ✓ | ✓ Agenda-style |
| **Search syntax** | ✓ Complex | ✓ Advanced | ✗ Basic | ✓ | ✓ | ✓ Grammar-based |
| **Saved views** | ✓ Custom commands | ✗ | ✗ | ? | ✓ | ✓ MVP+ |
| **Kanban view** | ✓ (org-kanban) | ✗ | ✗ | ✗ | ✓ | Post-MVP |
| **Habits** | ✓ Native | ✗ | ✓ | ? | ✗ | Post-MVP |
| **Offline support** | N/A | ✓ | ✓ (PWA) | ✓ | ✓ | ✓ (Desktop app) |
| **Editing** | ✓ Full | ✓ | ✓ | ✓ | ✓ | ✗ Read-only |
| **Keyboard-first** | ✓ | Partial | Partial | Partial | Partial | ✓ Core value |

---

## Sources

### Official Documentation
- Org Mode Manual: https://orgmode.org/manual/
- Org Mode Compact Guide: https://orgmode.org/guide/
- Org Tools List: https://orgmode.org/tools.html

### Competitor Products
- **Organice**: https://organice.200ok.ch/documentation.html
- **Orgzly**: https://www.orgzly.com/docs
- **EasyOrg**: https://easyorgmode.com/docs/search
- **Orgro**: https://orgro.org/faq/
- **beorg**: https://beorg.app/

### Community Resources
- System Crafters - Custom Agenda Views: https://systemcrafters.net/org-mode-productivity/custom-org-agenda-views/
- Bernt Hansen's Org Mode Guide: https://doc.norang.ca/org-mode.html
- Org Mode Tutorial - Agenda Filters: https://orgmode.org/worg/org-tutorials/agenda-filters.html

### User Workflows
- "The Zen of Task Management with Org" - Bastien Guerry
- Reddit r/orgmode community discussions
- Emacs Stack Exchange - org-mode filtering patterns

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Table Stakes | HIGH | Well-documented in org-mode manual; consistent across all tools |
| Differentiators | HIGH | Clear patterns from competitor analysis; community discussions |
| Anti-Features | MEDIUM | Some subjective judgment based on scope constraints |
| Dependencies | HIGH | Logical analysis of feature relationships |
| MVP Definition | MEDIUM | Based on common usage patterns; may need user validation |

## Gaps to Address

- **User testing needed**: Actual org-mode power user interviews to validate priorities
- **Performance benchmarks**: Define "large file" thresholds (1K headlines? 10K?)
- **Platform specifics**: Some features may vary by OS (macOS vs Linux paths)
- **Integration details**: External editor launch varies by setup

---
*Feature research for: Org-X desktop org-mode viewer*
*Researched: 2025-03-31*
