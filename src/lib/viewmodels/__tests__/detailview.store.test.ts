import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  currentHeadline,
  parentChain,
  selectedChild,
  showDetailView,
  onBreadcrumbClick,
  formattedPlanning,
  formattedContent,
  cleanedTitle,
  priorityColorClass,
  todoBadgeClass,
  hasChildren,
  hasProperties,
  hasContent,
  openDetailView,
  closeDetailView,
  selectChild,
  handleBreadcrumbClick,
  handleHomeClick,
  handleBackFromChild,
  handleChildBreadcrumbClick,
} from "../detailview.store";
import type { OrgHeadline, OrgTimestamp } from "$lib/bindings";

// Mock test data
const mockHeadline: OrgHeadline = {
  id: "headline-1",
  document_id: "doc-1",
  title: {
    raw: "* TODO [#A] Test Task with formatting :urgent:work:",
    level: 1,
    priority: "A",
    tags: ["urgent", "work"],
    todo_keyword: "TODO",
    properties: {
      project: "TestProject",
      effort: "2h",
    },
    planning: {
      scheduled: {
        Active: {
          start: {
            year: 2025,
            month: 1,
            day: 15,
            hour: 9,
            minute: 0,
          },
          repeater: null,
          delay: null,
        },
      },
      deadline: {
        Active: {
          start: {
            year: 2025,
            month: 1,
            day: 20,
            hour: 17,
            minute: 0,
          },
          repeater: null,
          delay: null,
        },
      },
      closed: null,
    },
  },
  content:
    "This is the content of the test task.\nIt has multiple lines.\n\nAnd paragraphs.",
  children: [
    {
      id: "child-1",
      document_id: "doc-1",
      title: {
        raw: "** TODO Subtask 1",
        level: 2,
        priority: null,
        tags: [],
        todo_keyword: "TODO",
        properties: {},
        planning: null,
      },
      content: "Subtask content",
      children: [],
      etag: "child-etag-1",
    },
  ],
  etag: "test-etag-1",
};

const mockParentHeadline: OrgHeadline = {
  id: "parent-1",
  document_id: "doc-1",
  title: {
    raw: "* Parent Headline",
    level: 1,
    priority: null,
    tags: [],
    todo_keyword: null,
    properties: {},
    planning: null,
  },
  content: "Parent content",
  children: [mockHeadline],
  etag: "parent-etag-1",
};

const mockHeadlineWithoutContent: OrgHeadline = {
  id: "headline-2",
  document_id: "doc-1",
  title: {
    raw: "* Simple Headline",
    level: 1,
    priority: null,
    tags: [],
    todo_keyword: null,
    properties: {},
    planning: null,
  },
  content: "",
  children: [],
  etag: "test-etag-2",
};

describe("DetailView Store", () => {
  beforeEach(() => {
    // Reset all store state
    currentHeadline.set(null);
    parentChain.set([]);
    selectedChild.set(null);
    showDetailView.set(false);
    onBreadcrumbClick.set(null);
  });

  describe("Core State Management", () => {
    it("should initialize with empty state", () => {
      expect(get(currentHeadline)).toBeNull();
      expect(get(parentChain)).toEqual([]);
      expect(get(selectedChild)).toBeNull();
      expect(get(showDetailView)).toBe(false);
      expect(get(onBreadcrumbClick)).toBeNull();
    });

    it("should update state when opening detail view", () => {
      const testParentChain = [mockParentHeadline];
      const testCallback = vi.fn();

      openDetailView(mockHeadline, testParentChain, testCallback);

      expect(get(currentHeadline)).toEqual(mockHeadline);
      expect(get(parentChain)).toEqual(testParentChain);
      expect(get(selectedChild)).toBeNull();
      expect(get(showDetailView)).toBe(true);
      expect(get(onBreadcrumbClick)).toEqual(testCallback);
    });

    it("should open detail view with default parameters", () => {
      openDetailView(mockHeadline);

      expect(get(currentHeadline)).toEqual(mockHeadline);
      expect(get(parentChain)).toEqual([]);
      expect(get(selectedChild)).toBeNull();
      expect(get(showDetailView)).toBe(true);
      expect(get(onBreadcrumbClick)).toBeNull();
    });

    it("should reset state when closing detail view", () => {
      // First open
      openDetailView(mockHeadline, [mockParentHeadline]);
      expect(get(showDetailView)).toBe(true);
      expect(get(currentHeadline)).toEqual(mockHeadline);

      // Then close
      closeDetailView();

      expect(get(showDetailView)).toBe(false);
      expect(get(currentHeadline)).toBeNull();
      expect(get(parentChain)).toEqual([]);
      expect(get(selectedChild)).toBeNull();
      expect(get(onBreadcrumbClick)).toBeNull();
    });

    it("should select child for recursive navigation", () => {
      const childHeadline = mockHeadline.children[0];

      selectChild(childHeadline);

      expect(get(selectedChild)).toEqual(childHeadline);
    });
  });

  describe("Derived State - Formatted Planning", () => {
    it("should format planning information correctly", () => {
      currentHeadline.set(mockHeadline);

      const planning = get(formattedPlanning);

      expect(planning).toBeDefined();
      expect(planning!.scheduled).toBe("<2025-01-15 09:00>");
      expect(planning!.deadline).toBe("<2025-01-20 17:00>");
      expect(planning!.closed).toBeUndefined();
    });

    it("should return null for headline without planning", () => {
      currentHeadline.set(mockHeadlineWithoutContent);

      const planning = get(formattedPlanning);

      expect(planning).toBeNull();
    });

    it("should handle inactive timestamps", () => {
      const headlineWithInactive: OrgHeadline = {
        ...mockHeadline,
        title: {
          ...mockHeadline.title,
          planning: {
            scheduled: {
              Inactive: {
                start: {
                  year: 2025,
                  month: 1,
                  day: 15,
                  hour: null,
                  minute: null,
                },
                repeater: null,
                delay: null,
              },
            },
            deadline: null,
            closed: null,
          },
        },
      };

      currentHeadline.set(headlineWithInactive);

      const planning = get(formattedPlanning);

      expect(planning).toBeDefined();
      expect(planning!.scheduled).toBe("[2025-01-15]");
    });

    it("should handle range timestamps", () => {
      const headlineWithRange: OrgHeadline = {
        ...mockHeadline,
        title: {
          ...mockHeadline.title,
          planning: {
            scheduled: {
              ActiveRange: {
                start: {
                  year: 2025,
                  month: 1,
                  day: 15,
                  hour: 9,
                  minute: 0,
                },
                end: {
                  year: 2025,
                  month: 1,
                  day: 16,
                  hour: 17,
                  minute: 30,
                },
                repeater: null,
                delay: null,
              },
            },
            deadline: null,
            closed: null,
          },
        },
      };

      currentHeadline.set(headlineWithRange);

      const planning = get(formattedPlanning);

      expect(planning).toBeDefined();
      expect(planning!.scheduled).toBe("<2025-01-15 09:00--2025-01-16 17:30>");
    });

    it("should handle diary timestamps", () => {
      const headlineWithDiary: OrgHeadline = {
        ...mockHeadline,
        title: {
          ...mockHeadline.title,
          planning: {
            scheduled: {
              Diary: {
                value: "weekly meeting",
              },
            },
            deadline: null,
            closed: null,
          },
        },
      };

      currentHeadline.set(headlineWithDiary);

      const planning = get(formattedPlanning);

      expect(planning).toBeDefined();
      expect(planning!.scheduled).toBe("<%weekly meeting>");
    });
  });

  describe("Derived State - Content Formatting", () => {
    it("should format content with line breaks", () => {
      currentHeadline.set(mockHeadline);

      const content = get(formattedContent);

      expect(content).toBe(
        "This is the content of the test task.<br>It has multiple lines.<br><br>And paragraphs.",
      );
    });

    it("should return empty string for headline without content", () => {
      currentHeadline.set(mockHeadlineWithoutContent);

      const content = get(formattedContent);

      expect(content).toBe("");
    });
  });

  describe("Derived State - Title Cleaning", () => {
    it("should clean title by removing org-mode formatting", () => {
      currentHeadline.set(mockHeadline);

      const title = get(cleanedTitle);

      expect(title).toBe("Test Task with formatting");
    });

    it("should handle simple titles", () => {
      currentHeadline.set(mockHeadlineWithoutContent);

      const title = get(cleanedTitle);

      expect(title).toBe("Simple Headline");
    });
  });

  describe("Derived State - Priority Color Class", () => {
    it("should return correct class for priority A", () => {
      currentHeadline.set(mockHeadline);

      const colorClass = get(priorityColorClass);

      expect(colorClass).toBe("bg-red-100 text-red-700");
    });

    it("should return correct class for priority B", () => {
      const headlineB: OrgHeadline = {
        ...mockHeadline,
        title: { ...mockHeadline.title, priority: "B" },
      };
      currentHeadline.set(headlineB);

      const colorClass = get(priorityColorClass);

      expect(colorClass).toBe("bg-orange-100 text-orange-700");
    });

    it("should return correct class for priority C", () => {
      const headlineC: OrgHeadline = {
        ...mockHeadline,
        title: { ...mockHeadline.title, priority: "C" },
      };
      currentHeadline.set(headlineC);

      const colorClass = get(priorityColorClass);

      expect(colorClass).toBe("bg-yellow-100 text-yellow-700");
    });

    it("should return empty string for no priority", () => {
      currentHeadline.set(mockHeadlineWithoutContent);

      const colorClass = get(priorityColorClass);

      expect(colorClass).toBe("");
    });

    it("should return default class for unknown priority", () => {
      const headlineUnknown: OrgHeadline = {
        ...mockHeadline,
        title: { ...mockHeadline.title, priority: "X" },
      };
      currentHeadline.set(headlineUnknown);

      const colorClass = get(priorityColorClass);

      expect(colorClass).toBe("bg-gray-100 text-gray-700");
    });
  });

  describe("Derived State - TODO Badge Class", () => {
    it("should return correct class for TODO", () => {
      currentHeadline.set(mockHeadline);

      const badgeClass = get(todoBadgeClass);

      expect(badgeClass).toBe(
        "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border-blue-200",
      );
    });

    it("should return correct class for DONE", () => {
      const headlineDone: OrgHeadline = {
        ...mockHeadline,
        title: { ...mockHeadline.title, todo_keyword: "DONE" },
      };
      currentHeadline.set(headlineDone);

      const badgeClass = get(todoBadgeClass);

      expect(badgeClass).toBe(
        "bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 border-green-200",
      );
    });

    it("should return correct class for WAITING", () => {
      const headlineWaiting: OrgHeadline = {
        ...mockHeadline,
        title: { ...mockHeadline.title, todo_keyword: "WAITING" },
      };
      currentHeadline.set(headlineWaiting);

      const badgeClass = get(todoBadgeClass);

      expect(badgeClass).toBe(
        "bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700 border-orange-200",
      );
    });

    it("should return correct class for CANCELLED", () => {
      const headlineCancelled: OrgHeadline = {
        ...mockHeadline,
        title: { ...mockHeadline.title, todo_keyword: "CANCELLED" },
      };
      currentHeadline.set(headlineCancelled);

      const badgeClass = get(todoBadgeClass);

      expect(badgeClass).toBe(
        "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600 border-gray-200",
      );
    });

    it("should return empty string for no TODO keyword", () => {
      currentHeadline.set(mockHeadlineWithoutContent);

      const badgeClass = get(todoBadgeClass);

      expect(badgeClass).toBe("");
    });

    it("should handle underscore in TODO keyword", () => {
      const headlineInProgress: OrgHeadline = {
        ...mockHeadline,
        title: { ...mockHeadline.title, todo_keyword: "IN_PROGRESS" },
      };
      currentHeadline.set(headlineInProgress);

      const badgeClass = get(todoBadgeClass);

      expect(badgeClass).toBe(
        "bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700 border-purple-200",
      );
    });

    it("should return default class for unknown TODO keyword", () => {
      const headlineUnknown: OrgHeadline = {
        ...mockHeadline,
        title: { ...mockHeadline.title, todo_keyword: "UNKNOWN" },
      };
      currentHeadline.set(headlineUnknown);

      const badgeClass = get(todoBadgeClass);

      expect(badgeClass).toBe(
        "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border-blue-200",
      );
    });
  });

  describe("Derived State - Boolean Flags", () => {
    it("should correctly identify headlines with children", () => {
      currentHeadline.set(mockHeadline);

      expect(get(hasChildren)).toBe(true);
    });

    it("should correctly identify headlines without children", () => {
      currentHeadline.set(mockHeadlineWithoutContent);

      expect(get(hasChildren)).toBe(false);
    });

    it("should correctly identify headlines with properties", () => {
      currentHeadline.set(mockHeadline);

      expect(get(hasProperties)).toBe(true);
    });

    it("should correctly identify headlines without properties", () => {
      currentHeadline.set(mockHeadlineWithoutContent);

      expect(get(hasProperties)).toBe(false);
    });

    it("should correctly identify headlines with content", () => {
      currentHeadline.set(mockHeadline);

      expect(get(hasContent)).toBe(true);
    });

    it("should correctly identify headlines without content", () => {
      currentHeadline.set(mockHeadlineWithoutContent);

      expect(get(hasContent)).toBe(false);
    });

    it("should handle headlines with empty/whitespace content", () => {
      const headlineWhitespace: OrgHeadline = {
        ...mockHeadlineWithoutContent,
        content: "   \n  \t  ",
      };
      currentHeadline.set(headlineWhitespace);

      expect(get(hasContent)).toBe(false);
    });
  });

  describe("Navigation Actions", () => {
    it("should handle breadcrumb click with callback", () => {
      const mockCallback = vi.fn();
      onBreadcrumbClick.set(mockCallback);

      handleBreadcrumbClick(2);

      expect(mockCallback).toHaveBeenCalledWith(2);
      expect(get(selectedChild)).toBeNull();
    });

    it("should handle breadcrumb click without callback", () => {
      onBreadcrumbClick.set(null);

      // Should not throw error
      expect(() => handleBreadcrumbClick(1)).not.toThrow();
      expect(get(selectedChild)).toBeNull();
    });

    it("should handle home click", () => {
      openDetailView(mockHeadline);
      selectChild(mockHeadline.children[0]);

      handleHomeClick();

      expect(get(showDetailView)).toBe(false);
      expect(get(currentHeadline)).toBeNull();
      expect(get(selectedChild)).toBeNull();
    });

    it("should handle back from child", () => {
      selectChild(mockHeadline.children[0]);

      handleBackFromChild();

      expect(get(selectedChild)).toBeNull();
    });

    it("should handle child breadcrumb click - current headline", () => {
      parentChain.set([mockParentHeadline]);
      selectChild(mockHeadline.children[0]);

      handleChildBreadcrumbClick(1); // parentChain.length

      expect(get(selectedChild)).toBeNull();
    });

    it("should handle child breadcrumb click - parent breadcrumb", () => {
      const mockCallback = vi.fn();
      parentChain.set([mockParentHeadline]);
      onBreadcrumbClick.set(mockCallback);
      selectChild(mockHeadline.children[0]);

      handleChildBreadcrumbClick(0); // Less than parentChain.length

      expect(mockCallback).toHaveBeenCalledWith(0);
      expect(get(selectedChild)).toBeNull();
    });
  });

  describe("Store Object Export", () => {
    it("should export store object with all required properties", async () => {
      const detailViewStore = await import("../detailview.store");

      expect(detailViewStore.default).toBeDefined();
      expect(detailViewStore.default.currentHeadline).toBeDefined();
      expect(detailViewStore.default.parentChain).toBeDefined();
      expect(detailViewStore.default.selectedChild).toBeDefined();
      expect(detailViewStore.default.showDetailView).toBeDefined();
      expect(detailViewStore.default.onBreadcrumbClick).toBeDefined();
      expect(detailViewStore.default.formattedPlanning).toBeDefined();
      expect(detailViewStore.default.formattedContent).toBeDefined();
      expect(detailViewStore.default.cleanedTitle).toBeDefined();
      expect(detailViewStore.default.priorityColorClass).toBeDefined();
      expect(detailViewStore.default.todoBadgeClass).toBeDefined();
      expect(detailViewStore.default.hasChildren).toBeDefined();
      expect(detailViewStore.default.hasProperties).toBeDefined();
      expect(detailViewStore.default.hasContent).toBeDefined();
      expect(detailViewStore.default.openDetailView).toBeDefined();
      expect(detailViewStore.default.closeDetailView).toBeDefined();
      expect(detailViewStore.default.selectChild).toBeDefined();
      expect(detailViewStore.default.handleBreadcrumbClick).toBeDefined();
      expect(detailViewStore.default.handleHomeClick).toBeDefined();
      expect(detailViewStore.default.handleBackFromChild).toBeDefined();
      expect(detailViewStore.default.handleChildBreadcrumbClick).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null currentHeadline gracefully", () => {
      currentHeadline.set(null);

      expect(get(formattedPlanning)).toBeNull();
      expect(get(formattedContent)).toBe("");
      expect(get(cleanedTitle)).toBe("");
      expect(get(priorityColorClass)).toBe("");
      expect(get(todoBadgeClass)).toBe("");
      expect(get(hasChildren)).toBe(false);
      expect(get(hasProperties)).toBe(false);
      expect(get(hasContent)).toBe(false);
    });

    it("should handle headline with null properties", () => {
      const headlineNullProps: OrgHeadline = {
        ...mockHeadline,
        title: {
          ...mockHeadline.title,
          properties: null as any,
        },
      };
      currentHeadline.set(headlineNullProps);

      expect(get(hasProperties)).toBe(false);
    });

    it("should handle headline with null children", () => {
      const headlineNullChildren: OrgHeadline = {
        ...mockHeadline,
        children: null as any,
      };
      currentHeadline.set(headlineNullChildren);

      expect(get(hasChildren)).toBe(false);
    });
  });
});
