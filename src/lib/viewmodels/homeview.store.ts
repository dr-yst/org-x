import { writable, derived } from "svelte/store";
import { commands } from "$lib/bindings";
import type { OrgDocument, OrgHeadline } from "$lib/bindings";

// Core state stores
export const documents = writable<OrgDocument[]>([]);
export const loading = writable(true);
export const error = writable<string | null>(null);
export const hasMonitoredPaths = writable(true);

// UI state stores
export const focusedIndex = writable<number>(-1);
export const activeFilterIndex = writable(0);
export const showQuickActions = writable(false);
export const showQuickLook = writable(false);
export const quickLookHeadline = writable<OrgHeadline | null>(null);
export const refreshTrigger = writable(0);

// Display mode state
export type DisplayMode = "task-list" | "headline-list";
export const displayMode = writable<DisplayMode>("task-list");

// Filter options constant
export const filterOptions = ["all", "today", "week", "overdue"];

// Derived state
export const documentMap = derived(
  documents,
  ($docs) => new Map($docs.map((doc) => [doc.id, doc])),
);

export const allHeadlines = derived(documents, ($docs) =>
  $docs.flatMap((doc) => doc.headlines),
);

// Display mode filtered headlines
export const displayModeFilteredHeadlines = derived(
  [allHeadlines, displayMode],
  ([$headlines, $mode]) => {
    switch ($mode) {
      case "task-list":
        // Show all headlines with TODO keywords (tasks)
        return $headlines.filter(
          (headline) => headline.title.todo_keyword !== null,
        );

      case "headline-list":
        // Show only first-level headlines
        return $headlines.filter((headline) => headline.title.level === 1);

      default:
        return $headlines;
    }
  },
);

export const filteredHeadlines = derived(
  [displayModeFilteredHeadlines, activeFilterIndex],
  ([$headlines, $filterIndex]) => {
    const filterType = filterOptions[$filterIndex];

    switch (filterType) {
      case "today":
        return $headlines.filter((headline) => {
          const scheduled = headline.title.planning?.scheduled;
          if (!scheduled) return false;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if ("Active" in scheduled) {
            const schedDate = new Date(
              scheduled.Active.start.year,
              scheduled.Active.start.month - 1,
              scheduled.Active.start.day,
            );
            schedDate.setHours(0, 0, 0, 0);
            return schedDate.getTime() === today.getTime();
          }

          return false;
        });

      case "week":
        return $headlines.filter((headline) => {
          const scheduled = headline.title.planning?.scheduled;
          if (!scheduled) return false;

          const today = new Date();
          const weekFromNow = new Date(
            today.getTime() + 7 * 24 * 60 * 60 * 1000,
          );
          today.setHours(0, 0, 0, 0);
          weekFromNow.setHours(23, 59, 59, 999);

          if ("Active" in scheduled) {
            const schedDate = new Date(
              scheduled.Active.start.year,
              scheduled.Active.start.month - 1,
              scheduled.Active.start.day,
            );
            return schedDate >= today && schedDate <= weekFromNow;
          }

          return false;
        });

      case "overdue":
        return $headlines.filter((headline) => {
          const deadline = headline.title.planning?.deadline;
          if (!deadline) return false;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if ("Active" in deadline) {
            const deadlineDate = new Date(
              deadline.Active.start.year,
              deadline.Active.start.month - 1,
              deadline.Active.start.day,
            );
            deadlineDate.setHours(23, 59, 59, 999);
            return deadlineDate < today;
          }

          return false;
        });

      default: // "all"
        return $headlines;
    }
  },
);

// Statistics derived stores
export const documentCount = derived(documents, ($docs) => $docs.length);
export const headlineCount = derived(
  filteredHeadlines,
  ($headlines) => $headlines.length,
);

// Action functions
export async function refresh(): Promise<void> {
  loading.set(true);
  error.set(null);

  // Always check monitored paths first
  try {
    const settingsResult = await commands.loadUserSettings();
    if (
      settingsResult.status === "ok" &&
      settingsResult.data.monitored_paths.length === 0
    ) {
      hasMonitoredPaths.set(false);
      loading.set(false);
      documents.set([]);
      return;
    } else if (settingsResult.status === "ok") {
      hasMonitoredPaths.set(true);

      // Check if any monitored paths have parsing enabled
      const hasParsingEnabled = settingsResult.data.monitored_paths.some(
        (path) => path.parse_enabled,
      );

      if (!hasParsingEnabled) {
        // No parsing enabled for any paths - skip loading and show empty state immediately
        console.log(
          "📚 No parsing enabled for any monitored paths - skipping document loading",
        );
        loading.set(false);
        documents.set([]);
        return;
      }
    } else {
      hasMonitoredPaths.set(false);
      loading.set(false);
      documents.set([]);
      return;
    }
  } catch (e) {
    hasMonitoredPaths.set(false);
    loading.set(false);
    documents.set([]);
    return;
  }

  // If monitored paths exist, load documents
  try {
    loading.set(true);
    error.set(null);

    console.log("📡 Starting file monitoring...");
    const monitorResult = await commands.startFileMonitoring();

    if (monitorResult.status === "error") {
      console.warn("File monitoring failed:", monitorResult.error);
      // Continue anyway - may have some documents from previous sessions
    }

    console.log("📚 Loading documents...");
    // Retry loading documents with exponential backoff
    let retryCount = 0;
    const maxRetries = 5;
    let docs: OrgDocument[] = [];

    while (retryCount < maxRetries) {
      const docsResult = await commands.getAllDocuments();

      if (docsResult.status === "error") {
        console.warn(`Attempt ${retryCount + 1} failed:`, docsResult.error);
        retryCount++;
        if (retryCount >= maxRetries) {
          error.set(docsResult.error);
          loading.set(false);
          return;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000),
        );
        continue;
      }

      docs = docsResult.data || [];
      if (docs.length > 0) {
        break; // Successfully loaded documents
      }

      retryCount++;
      if (retryCount >= maxRetries) {
        console.log(
          "No documents found - this is normal when no monitoring paths are configured",
        );
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000),
      );
    }

    documents.set(docs);
    console.log(
      `✅ Loaded ${docs.length} documents, ${docs.flatMap((doc) => doc.headlines).length} headlines`,
    );
    loading.set(false);
  } catch (err) {
    console.error("Error:", err);
    error.set(String(err));
    loading.set(false);
  }
}

export function setFilter(filterIndex: number): void {
  if (filterIndex >= 0 && filterIndex < filterOptions.length) {
    activeFilterIndex.set(filterIndex);
    focusedIndex.set(-1); // Reset focus when filter changes
  }
}

export function cycleFilter(): void {
  activeFilterIndex.update((index) => (index + 1) % filterOptions.length);
  focusedIndex.set(-1); // Reset focus when filter changes
}

export function setDisplayMode(mode: DisplayMode): void {
  displayMode.set(mode);
  focusedIndex.set(-1); // Reset focus when display mode changes
  showQuickActions.set(false);
}

export function setFocus(index: number): void {
  focusedIndex.set(index);
  showQuickActions.set(false);
}

export function moveFocusDown(): void {
  let currentFiltered: OrgHeadline[] = [];
  const unsubscribe = filteredHeadlines.subscribe((value) => {
    currentFiltered = value;
  });
  unsubscribe();

  focusedIndex.update((current) => {
    if (currentFiltered.length > 0) {
      return Math.min(current + 1, currentFiltered.length - 1);
    }
    return current;
  });
  showQuickActions.set(false);
}

export function moveFocusUp(): void {
  focusedIndex.update((current) => Math.max(current - 1, -1));
  showQuickActions.set(false);
}

export function toggleQuickActions(): void {
  showQuickActions.update((show) => !show);
}

export function hideQuickActions(): void {
  showQuickActions.set(false);
}

export function toggleQuickLook(headline?: OrgHeadline): void {
  showQuickLook.update((show) => {
    if (!show && headline) {
      quickLookHeadline.set(headline);
      showQuickActions.set(false);
      return true;
    } else {
      quickLookHeadline.set(null);
      return false;
    }
  });
}

export function closeQuickLook(): void {
  showQuickLook.set(false);
  quickLookHeadline.set(null);
}

export async function handleQuickAction(
  action:
    | "view"
    | "mark-done"
    | "priority-up"
    | "priority-down"
    | "open-editor",
  headline?: OrgHeadline,
): Promise<void> {
  let headlineValue: OrgHeadline | null = headline || null;

  if (!headline) {
    // Get the currently focused headline
    let currentFiltered: OrgHeadline[] = [];
    const unsubscribe = filteredHeadlines.subscribe((value) => {
      currentFiltered = value;
    });
    unsubscribe();

    let currentFocusedIndex = -1;
    const unsubscribeFocus = focusedIndex.subscribe((value) => {
      currentFocusedIndex = value;
    });
    unsubscribeFocus();

    if (
      currentFocusedIndex >= 0 &&
      currentFocusedIndex < currentFiltered.length
    ) {
      headlineValue = currentFiltered[currentFocusedIndex];
    }
  }

  if (!headlineValue) return;

  let documentsValue: OrgDocument[] = [];
  const unsubscribe = documents.subscribe((value) => {
    documentsValue = value;
  });
  unsubscribe();

  switch (action) {
    case "view":
      // Import and use DetailView store's openDetailView
      const { openDetailView } = await import("./detailview.store");
      openDetailView(headlineValue);
      break;
    case "mark-done":
      console.log("Mark as done:", headlineValue.id);
      // TODO: Implement mark as done functionality
      break;
    case "priority-up":
      console.log("Increase priority:", headlineValue.id);
      // TODO: Implement priority increase functionality
      break;
    case "priority-down":
      console.log("Decrease priority:", headlineValue.id);
      // TODO: Implement priority decrease functionality
      break;
    case "open-editor":
      // Find the document that contains this headline
      const parentDocument = documentsValue.find(
        (doc) => doc.id === headlineValue!.document_id,
      );
      if (parentDocument?.file_path) {
        console.log(
          "Opening file in external editor:",
          parentDocument.file_path,
        );
        // TODO: Implement external editor opening with tauri-plugin-opener
      }
      break;
  }

  showQuickActions.set(false);
}

// Expose global refresh function for monitoring sidebar
export function exposeGlobalRefresh(): void {
  if (typeof window !== "undefined") {
    (window as any).refreshListView = refresh;
  }
}

export function triggerRefresh(): void {
  refreshTrigger.update((n) => n + 1);
}

// Export store object for backwards compatibility
const listViewStore = {
  documents: { subscribe: documents.subscribe },
  loading: { subscribe: loading.subscribe },
  error: { subscribe: error.subscribe },
  hasMonitoredPaths: { subscribe: hasMonitoredPaths.subscribe },
  focusedIndex: { subscribe: focusedIndex.subscribe },
  activeFilterIndex: { subscribe: activeFilterIndex.subscribe },
  showQuickActions: { subscribe: showQuickActions.subscribe },
  showQuickLook: { subscribe: showQuickLook.subscribe },
  quickLookHeadline: { subscribe: quickLookHeadline.subscribe },
  refreshTrigger: { subscribe: refreshTrigger.subscribe },
  documentMap: { subscribe: documentMap.subscribe },
  allHeadlines: { subscribe: allHeadlines.subscribe },
  displayModeFilteredHeadlines: {
    subscribe: displayModeFilteredHeadlines.subscribe,
  },
  filteredHeadlines: { subscribe: filteredHeadlines.subscribe },
  documentCount: { subscribe: documentCount.subscribe },
  headlineCount: { subscribe: headlineCount.subscribe },
  displayMode: { subscribe: displayMode.subscribe },
  filterOptions,
  refresh,
  setFilter,
  cycleFilter,
  setDisplayMode,
  setFocus,
  moveFocusDown,
  moveFocusUp,
  toggleQuickActions,
  hideQuickActions,
  toggleQuickLook,
  closeQuickLook,
  handleQuickAction,
  exposeGlobalRefresh,
  triggerRefresh,
};

export default listViewStore;
