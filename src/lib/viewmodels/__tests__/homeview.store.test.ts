import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  documents,
  loading,
  error,
  hasMonitoredPaths,
  focusedIndex,
  activeFilterIndex,
  showQuickActions,
  showQuickLook,
  quickLookHeadline,
  filteredHeadlines,
  displayModeFilteredHeadlines,
  documentCount,
  headlineCount,
  filterOptions,
  displayMode,
  setDisplayMode,
  refresh,
  setFilter,
  setFocus,
  cycleFilter,
  moveFocusDown,
  moveFocusUp,
  toggleQuickActions,
  hideQuickActions,
  toggleQuickLook,
  closeQuickLook,
  handleQuickAction,
  exposeGlobalRefresh,
  triggerRefresh,
  refreshTrigger,
} from "../homeview.store";
import type { OrgDocument, OrgHeadline } from "$lib/bindings";

// Mock the commands module
vi.mock("$lib/bindings", () => ({
  commands: {
    loadUserSettings: vi.fn().mockResolvedValue({
      status: "ok",
      data: { monitored_paths: [] },
    }),
    startFileMonitoring: vi.fn().mockResolvedValue({
      status: "ok",
      data: "started",
    }),
    getAllDocuments: vi.fn().mockResolvedValue({
      status: "ok",
      data: [],
    }),
  },
}));

// Mock data
const mockDocument: OrgDocument = {
  id: "doc-1",
  title: "Test Document",
  content: "Test content",
  headlines: [
    {
      id: "headline-1",
      document_id: "doc-1",
      title: {
        raw: "Test Headline",
        level: 1,
        priority: null,
        tags: [],
        todo_keyword: "TODO",
        properties: {},
        planning: null,
      },
      content: "Test headline content",
      children: [],
      etag: "test-etag",
    },
    {
      id: "headline-2",
      document_id: "doc-1",
      title: {
        raw: "Level 2 Headline",
        level: 2,
        priority: null,
        tags: [],
        todo_keyword: null,
        properties: {},
        planning: null,
      },
      content: "Level 2 content",
      children: [],
      etag: "test-etag-2",
    },
    {
      id: "headline-3",
      document_id: "doc-1",
      title: {
        raw: "Another Task",
        level: 1,
        priority: null,
        tags: [],
        todo_keyword: "DONE",
        properties: {},
        planning: null,
      },
      content: "Completed task content",
      children: [],
      etag: "test-etag-3",
    },
  ],
  filetags: [],
  file_path: "/test/path.org",
  properties: {},
  category: "test",
  etag: "doc-etag",
  todo_config: null,
};

describe("ListView Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    documents.set([]);
    loading.set(true);
    error.set(null);
    hasMonitoredPaths.set(true);
    focusedIndex.set(-1);
    activeFilterIndex.set(0);
    showQuickActions.set(false);
    showQuickLook.set(false);
    quickLookHeadline.set(null);
  });

  describe("Store State", () => {
    it("should have initial state", () => {
      expect(get(documents)).toEqual([]);
      expect(get(loading)).toBe(true);
      expect(get(error)).toBe(null);
      expect(get(hasMonitoredPaths)).toBe(true);
      expect(get(focusedIndex)).toBe(-1);
      expect(get(activeFilterIndex)).toBe(0);
      expect(get(showQuickActions)).toBe(false);
      expect(get(showQuickLook)).toBe(false);
      expect(get(quickLookHeadline)).toBe(null);
    });

    it("should skip loading when all parsing is disabled", async () => {
      // Use the module-level mocked commands directly
      const { commands } = await import("$lib/bindings");

      // Mock settings with monitored paths but all parsing disabled
      vi.mocked(commands.loadUserSettings).mockResolvedValue({
        status: "ok",
        data: {
          monitored_paths: [
            {
              path: "/test/path1.org",
              path_type: "File",
              parse_enabled: false,
            },
            {
              path: "/test/path2",
              path_type: "Directory",
              parse_enabled: false,
            },
          ],
        },
      });

      await refresh();

      // Should not be loading and should have no documents
      expect(get(loading)).toBe(false);
      expect(get(documents)).toEqual([]);
      expect(get(hasMonitoredPaths)).toBe(false);

      // Should not have called document loading commands
      expect(commands.startFileMonitoring).not.toHaveBeenCalled();
      expect(commands.getAllDocuments).not.toHaveBeenCalled();
    });

    it("should update documents and derived state", () => {
      documents.set([mockDocument]);

      expect(get(documents)).toEqual([mockDocument]);
      expect(get(documentCount)).toBe(1);
      expect(get(headlineCount)).toBe(2); // Should count filtered headlines
    });

    it("should filter headlines correctly", () => {
      documents.set([mockDocument]);

      // Test "all" filter with default task-list mode (should show only headlines with TODO keywords)
      activeFilterIndex.set(0);
      expect(get(filteredHeadlines)).toHaveLength(2); // Both TODO and DONE headlines
      expect(get(filteredHeadlines)[0].title.todo_keyword).toBe("TODO");
      expect(get(filteredHeadlines)[1].title.todo_keyword).toBe("DONE");

      // Test other filters (they should filter out our mock headline since it doesn't have proper dates)
      activeFilterIndex.set(1); // today
      expect(get(filteredHeadlines)).toEqual([]);
    });
  });

  describe("Display Mode", () => {
    beforeEach(() => {
      documents.set([mockDocument]);
    });

    it("should have default display mode as task-list", () => {
      expect(get(displayMode)).toBe("task-list");
    });

    it("should set display mode correctly", () => {
      setDisplayMode("headline-list");
      expect(get(displayMode)).toBe("headline-list");
      expect(get(focusedIndex)).toBe(-1); // Should reset focus
      expect(get(showQuickActions)).toBe(false);
    });

    it("should filter headlines by display mode - task-list", () => {
      // Task list mode should show only headlines with TODO keywords
      setDisplayMode("task-list");
      const filtered = get(displayModeFilteredHeadlines);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((h) => h.title.todo_keyword !== null)).toBe(true);
      expect(filtered[0].title.todo_keyword).toBe("TODO");
      expect(filtered[1].title.todo_keyword).toBe("DONE");
    });

    it("should filter headlines by display mode - headline-list", () => {
      // Headline list mode should show only level 1 headlines
      setDisplayMode("headline-list");
      const filtered = get(displayModeFilteredHeadlines);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((h) => h.title.level === 1)).toBe(true);
      expect(filtered[0].title.raw).toBe("Test Headline");
      expect(filtered[1].title.raw).toBe("Another Task");
    });

    it("should apply both display mode and date filtering", () => {
      // Set to headline-list mode
      setDisplayMode("headline-list");

      // Set to "today" filter (should filter out our mock headlines since they don't have proper dates)
      activeFilterIndex.set(1);
      const filtered = get(filteredHeadlines);
      expect(filtered).toHaveLength(0);
    });

    it("should update headline count based on filtered results", () => {
      // Task list mode
      setDisplayMode("task-list");
      expect(get(headlineCount)).toBe(2); // Only headlines with TODO keywords

      // Headline list mode
      setDisplayMode("headline-list");
      expect(get(headlineCount)).toBe(2); // Only level 1 headlines
    });
  });

  describe("Filter Actions", () => {
    it("should set filter correctly", () => {
      setFilter(2);
      expect(get(activeFilterIndex)).toBe(2);
      expect(get(focusedIndex)).toBe(-1); // Should reset focus
    });

    it("should cycle filter correctly", () => {
      activeFilterIndex.set(0);
      cycleFilter();
      expect(get(activeFilterIndex)).toBe(1);

      activeFilterIndex.set(3);
      cycleFilter();
      expect(get(activeFilterIndex)).toBe(0); // Should wrap around
    });

    it("should not set invalid filter index", () => {
      setFilter(-1);
      expect(get(activeFilterIndex)).toBe(0); // Should remain unchanged

      setFilter(10);
      expect(get(activeFilterIndex)).toBe(0); // Should remain unchanged
    });
  });

  describe("Focus Actions", () => {
    beforeEach(() => {
      documents.set([mockDocument]);
    });

    it("should set focus correctly", () => {
      setFocus(0);
      expect(get(focusedIndex)).toBe(0);
      expect(get(showQuickActions)).toBe(false);
    });

    it("should move focus down", () => {
      focusedIndex.set(-1);
      moveFocusDown();
      expect(get(focusedIndex)).toBe(0);
      expect(get(showQuickActions)).toBe(false);
    });

    it("should move focus up", () => {
      focusedIndex.set(0);
      moveFocusUp();
      expect(get(focusedIndex)).toBe(-1);
      expect(get(showQuickActions)).toBe(false);
    });
  });

  describe("Quick Actions", () => {
    it("should toggle quick actions", () => {
      toggleQuickActions();
      expect(get(showQuickActions)).toBe(true);

      toggleQuickActions();
      expect(get(showQuickActions)).toBe(false);
    });

    it("should hide quick actions", () => {
      showQuickActions.set(true);
      hideQuickActions();
      expect(get(showQuickActions)).toBe(false);
    });
  });

  describe("Quick Look Actions", () => {
    it("should toggle quick look for headline", () => {
      const headline = mockDocument.headlines[0];
      toggleQuickLook(headline);

      expect(get(quickLookHeadline)).toBe(headline);
      expect(get(showQuickLook)).toBe(true);
      expect(get(showQuickActions)).toBe(false);
    });

    it("should close quick look", () => {
      const headline = mockDocument.headlines[0];
      toggleQuickLook(headline);
      expect(get(showQuickLook)).toBe(true);

      closeQuickLook();

      expect(get(quickLookHeadline)).toBeNull();
      expect(get(showQuickLook)).toBe(false);
    });
  });

  describe("Quick Look Actions", () => {
    it("should toggle quick look", () => {
      const headline = mockDocument.headlines[0];
      toggleQuickLook(headline);

      expect(get(quickLookHeadline)).toBe(headline);
      expect(get(showQuickLook)).toBe(true);
      expect(get(showQuickActions)).toBe(false);
    });

    it("should close quick look", () => {
      const headline = mockDocument.headlines[0];
      toggleQuickLook(headline);
      expect(get(showQuickLook)).toBe(true);

      closeQuickLook();

      expect(get(quickLookHeadline)).toBeNull();
      expect(get(showQuickLook)).toBe(false);
    });
  });

  describe("Constants", () => {
    it("should have correct filter options", () => {
      expect(filterOptions).toEqual(["all", "today", "week", "overdue"]);
    });
  });

  describe("Global Functions", () => {
    it("should expose global refresh function", () => {
      const mockWindow = { refreshListView: undefined };
      global.window = mockWindow as any;

      exposeGlobalRefresh();

      expect(mockWindow.refreshListView).toBe(refresh);
    });

    it("should trigger refresh", () => {
      const initialValue = get(refreshTrigger);
      triggerRefresh();
      expect(get(refreshTrigger)).toBe(initialValue + 1);
    });
  });

  describe("Handle Quick Action", () => {
    beforeEach(() => {
      documents.set([mockDocument]);
      // Set focused index to test focused headline functionality
      focusedIndex.set(0);
    });

    it("should handle view action with focused headline", async () => {
      // Since view action now delegates to DetailView store,
      // we just verify the action completes without error
      await expect(handleQuickAction("view")).resolves.not.toThrow();
    });

    it("should handle mark-done action", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await handleQuickAction("mark-done");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Mark as done:",
        mockDocument.headlines[0].id,
      );
    });

    it("should handle priority actions", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await handleQuickAction("priority-up");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Increase priority:",
        mockDocument.headlines[0].id,
      );

      await handleQuickAction("priority-down");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Decrease priority:",
        mockDocument.headlines[0].id,
      );
    });

    it("should handle open-editor action", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await handleQuickAction("open-editor");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Opening file in external editor:",
        mockDocument.file_path,
      );
    });
  });
});
