import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  documents,
  loading,
  error,
  hasMonitoredPaths,
  focusedIndex,
  activeFilterIndex,
  showQuickActions,
  selectedHeadline,
  showDetailView,
  showQuickLook,
  filteredHeadlines,
  documentCount,
  headlineCount,
  filterOptions,
  refresh,
  setFilter,
  cycleFilter,
  setFocus,
  moveFocusDown,
  moveFocusUp,
  toggleQuickActions,
  hideQuickActions,
  openDetailView,
  closeDetailView,
  toggleQuickLook,
  closeQuickLook,
  handleQuickAction,
  exposeGlobalRefresh,
  triggerRefresh,
  refreshTrigger
} from '../listview.store';
import type { OrgDocument, OrgHeadline } from '$lib/bindings';

// Mock the commands module
vi.mock('$lib/bindings', () => ({
  commands: {
    loadUserSettings: vi.fn(),
    startFileMonitoring: vi.fn(),
    getAllDocuments: vi.fn()
  }
}));

// Mock data
const mockDocument: OrgDocument = {
  id: 'doc-1',
  title: 'Test Document',
  content: 'Test content',
  headlines: [
    {
      id: 'headline-1',
      document_id: 'doc-1',
      title: {
        raw: 'Test Headline',
        level: 1,
        priority: null,
        tags: [],
        todo_keyword: 'TODO',
        properties: {},
        planning: null
      },
      content: 'Test headline content',
      children: [],
      etag: 'test-etag'
    }
  ],
  filetags: [],
  file_path: '/test/path.org',
  properties: {},
  category: 'test',
  etag: 'doc-etag',
  todo_config: null
};

describe('ListView Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    documents.set([]);
    loading.set(true);
    error.set(null);
    hasMonitoredPaths.set(true);
    focusedIndex.set(-1);
    activeFilterIndex.set(0);
    showQuickActions.set(false);
    selectedHeadline.set(null);
    showDetailView.set(false);
    showQuickLook.set(false);
  });

  describe('Store State', () => {
    it('should have initial state', () => {
      expect(get(documents)).toEqual([]);
      expect(get(loading)).toBe(true);
      expect(get(error)).toBe(null);
      expect(get(hasMonitoredPaths)).toBe(true);
      expect(get(focusedIndex)).toBe(-1);
      expect(get(activeFilterIndex)).toBe(0);
      expect(get(showQuickActions)).toBe(false);
      expect(get(selectedHeadline)).toBe(null);
      expect(get(showDetailView)).toBe(false);
      expect(get(showQuickLook)).toBe(false);
    });

    it('should update documents and derived state', () => {
      documents.set([mockDocument]);
      
      expect(get(documents)).toEqual([mockDocument]);
      expect(get(documentCount)).toBe(1);
      expect(get(headlineCount)).toBe(1);
    });

    it('should filter headlines correctly', () => {
      documents.set([mockDocument]);
      
      // Test "all" filter
      activeFilterIndex.set(0);
      expect(get(filteredHeadlines)).toEqual(mockDocument.headlines);
      
      // Test other filters (they should filter out our mock headline since it doesn't have proper dates)
      activeFilterIndex.set(1); // today
      expect(get(filteredHeadlines)).toEqual([]);
    });
  });

  describe('Filter Actions', () => {
    it('should set filter correctly', () => {
      setFilter(2);
      expect(get(activeFilterIndex)).toBe(2);
      expect(get(focusedIndex)).toBe(-1); // Should reset focus
    });

    it('should cycle filter correctly', () => {
      activeFilterIndex.set(0);
      cycleFilter();
      expect(get(activeFilterIndex)).toBe(1);
      
      activeFilterIndex.set(3);
      cycleFilter();
      expect(get(activeFilterIndex)).toBe(0); // Should wrap around
    });

    it('should not set invalid filter index', () => {
      setFilter(-1);
      expect(get(activeFilterIndex)).toBe(0); // Should remain unchanged
      
      setFilter(10);
      expect(get(activeFilterIndex)).toBe(0); // Should remain unchanged
    });
  });

  describe('Focus Actions', () => {
    beforeEach(() => {
      documents.set([mockDocument]);
    });

    it('should set focus correctly', () => {
      setFocus(0);
      expect(get(focusedIndex)).toBe(0);
      expect(get(showQuickActions)).toBe(false);
    });

    it('should move focus down', () => {
      focusedIndex.set(-1);
      moveFocusDown();
      expect(get(focusedIndex)).toBe(0);
      expect(get(showQuickActions)).toBe(false);
    });

    it('should move focus up', () => {
      focusedIndex.set(0);
      moveFocusUp();
      expect(get(focusedIndex)).toBe(-1);
      expect(get(showQuickActions)).toBe(false);
    });
  });

  describe('Quick Actions', () => {
    it('should toggle quick actions', () => {
      toggleQuickActions();
      expect(get(showQuickActions)).toBe(true);
      
      toggleQuickActions();
      expect(get(showQuickActions)).toBe(false);
    });

    it('should hide quick actions', () => {
      showQuickActions.set(true);
      hideQuickActions();
      expect(get(showQuickActions)).toBe(false);
    });
  });

  describe('Detail View Actions', () => {
    it('should open detail view', () => {
      const headline = mockDocument.headlines[0];
      openDetailView(headline);
      
      expect(get(selectedHeadline)).toBe(headline);
      expect(get(showDetailView)).toBe(true);
      expect(get(showQuickActions)).toBe(false);
    });

    it('should close detail view', () => {
      selectedHeadline.set(mockDocument.headlines[0]);
      showDetailView.set(true);
      
      closeDetailView();
      
      expect(get(selectedHeadline)).toBe(null);
      expect(get(showDetailView)).toBe(false);
    });
  });

  describe('Quick Look Actions', () => {
    it('should toggle quick look', () => {
      const headline = mockDocument.headlines[0];
      toggleQuickLook(headline);
      
      expect(get(selectedHeadline)).toBe(headline);
      expect(get(showQuickLook)).toBe(true);
      expect(get(showDetailView)).toBe(false);
      expect(get(showQuickActions)).toBe(false);
    });

    it('should close quick look', () => {
      selectedHeadline.set(mockDocument.headlines[0]);
      showQuickLook.set(true);
      
      closeQuickLook();
      
      expect(get(selectedHeadline)).toBe(null);
      expect(get(showQuickLook)).toBe(false);
    });
  });

  describe('Constants', () => {
    it('should have correct filter options', () => {
      expect(filterOptions).toEqual(['all', 'today', 'week', 'overdue']);
    });
  });

  describe('Global Functions', () => {
    it('should expose global refresh function', () => {
      const mockWindow = { refreshListView: undefined };
      global.window = mockWindow as any;
      
      exposeGlobalRefresh();
      
      expect(mockWindow.refreshListView).toBe(refresh);
    });

    it('should trigger refresh', () => {
      const initialValue = get(refreshTrigger);
      triggerRefresh();
      expect(get(refreshTrigger)).toBe(initialValue + 1);
    });
  });

  describe('Handle Quick Action', () => {
    beforeEach(() => {
      documents.set([mockDocument]);
      selectedHeadline.set(mockDocument.headlines[0]);
    });

    it('should handle view action', async () => {
      await handleQuickAction('view');
      
      expect(get(showDetailView)).toBe(true);
      expect(get(showQuickActions)).toBe(false);
    });

    it('should handle mark-done action', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await handleQuickAction('mark-done');
      
      expect(consoleSpy).toHaveBeenCalledWith('Mark as done:', 'headline-1');
      expect(get(showQuickActions)).toBe(false);
    });

    it('should handle priority actions', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await handleQuickAction('priority-up');
      expect(consoleSpy).toHaveBeenCalledWith('Increase priority:', 'headline-1');
      
      await handleQuickAction('priority-down');
      expect(consoleSpy).toHaveBeenCalledWith('Decrease priority:', 'headline-1');
      
      expect(get(showQuickActions)).toBe(false);
    });

    it('should handle open-editor action', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await handleQuickAction('open-editor');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Opening file in external editor:',
        '/test/path.org'
      );
      expect(get(showQuickActions)).toBe(false);
    });
  });
});