import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get } from "svelte/store";
import { commands } from "$lib/bindings";
import type { TodoKeywords, UserSettings } from "$lib/bindings";
import todoKeywords, {
  activeKeywords,
  closedKeywords,
  isLoading,
  isDirty,
  error,
  editingIndex,
  loadTodoKeywords,
  saveTodoKeywords,
  addActiveKeyword,
  addClosedKeyword,
  removeActiveKeyword,
  removeClosedKeyword,
  editActiveKeyword,
  editClosedKeyword,
  moveActiveKeyword,
  moveClosedKeyword,
  setEditingActiveIndex,
  setEditingClosedIndex,
  resetToDefaults,
  clearError,
} from "../todoKeywords.store";

// Mock the homeview store
vi.mock("$lib/viewmodels/homeview.store", () => ({
  refresh: vi.fn().mockResolvedValue(undefined),
}));

// Mock the commands
vi.mock("$lib/bindings", () => ({
  commands: {
    getUserTodoKeywords: vi.fn(),
    updateTodoKeywords: vi.fn(),
    addActiveTodoKeyword: vi.fn(),
    addClosedTodoKeyword: vi.fn(),
    removeActiveTodoKeyword: vi.fn(),
    removeClosedTodoKeyword: vi.fn(),
    editActiveTodoKeyword: vi.fn(),
    editClosedTodoKeyword: vi.fn(),
    moveActiveTodoKeyword: vi.fn(),
    moveClosedTodoKeyword: vi.fn(),
    resetTodoKeywordsToDefaults: vi.fn(),
    reloadDocumentsWithSettings: vi.fn(),
  },
}));

const mockCommands = commands as any;

describe("TodoKeywords Store", () => {
  const defaultTodoKeywords: TodoKeywords = {
    active: ["TODO", "IN-PROGRESS", "WAITING"],
    closed: ["DONE", "CANCELLED"],
  };

  const defaultUserSettings: UserSettings = {
    monitored_paths: [],
    todo_keywords: defaultTodoKeywords,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock for reloadDocumentsWithSettings
    mockCommands.reloadDocumentsWithSettings = vi.fn().mockResolvedValue({
      status: "ok",
      data: "Documents reloaded with updated settings",
    });

    // Reset store state by calling clearError and setting clean state
    clearError();
    setEditingActiveIndex(null);
    setEditingClosedIndex(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      // Note: The actual initial state may be from previous tests
      // These tests verify the store works correctly regardless
      expect(get(isLoading)).toBe(false);
      expect(get(error)).toBe(null);
      expect(get(editingIndex)).toEqual({ active: null, closed: null });
    });
  });

  describe("loadTodoKeywords", () => {
    it("should load TODO keywords successfully", async () => {
      mockCommands.getUserTodoKeywords.mockResolvedValue({
        status: "ok",
        data: defaultTodoKeywords,
      });

      await loadTodoKeywords();

      expect(mockCommands.getUserTodoKeywords).toHaveBeenCalled();
      expect(get(activeKeywords)).toEqual(["TODO", "IN-PROGRESS", "WAITING"]);
      expect(get(closedKeywords)).toEqual(["DONE", "CANCELLED"]);
      expect(get(isLoading)).toBe(false);
      expect(get(error)).toBe(null);
      expect(get(isDirty)).toBe(false);
    });

    it("should handle loading error", async () => {
      const errorMessage = "Failed to load keywords";
      mockCommands.getUserTodoKeywords.mockResolvedValue({
        status: "error",
        error: errorMessage,
      });

      await loadTodoKeywords();

      expect(mockCommands.getUserTodoKeywords).toHaveBeenCalled();
      expect(get(error)).toBe(errorMessage);
      expect(get(isLoading)).toBe(false);
    });

    it("should handle loading exception", async () => {
      const errorMessage = "Network error";
      mockCommands.getUserTodoKeywords.mockRejectedValue(
        new Error(errorMessage),
      );

      await loadTodoKeywords();

      expect(get(error)).toBe(errorMessage);
      expect(get(isLoading)).toBe(false);
    });
  });

  describe("saveTodoKeywords", () => {
    it("should save TODO keywords successfully", async () => {
      // First load some keywords
      mockCommands.getUserTodoKeywords.mockResolvedValue({
        status: "ok",
        data: defaultTodoKeywords,
      });
      await loadTodoKeywords();

      mockCommands.updateTodoKeywords.mockResolvedValue({
        status: "ok",
        data: defaultUserSettings,
      });

      await saveTodoKeywords();

      expect(mockCommands.updateTodoKeywords).toHaveBeenCalledWith({
        active: ["TODO", "IN-PROGRESS", "WAITING"],
        closed: ["DONE", "CANCELLED"],
      });
      expect(get(isDirty)).toBe(false);
      expect(get(error)).toBe(null);
    });

    it("should handle save error", async () => {
      const errorMessage = "Failed to save keywords";
      mockCommands.updateTodoKeywords.mockResolvedValue({
        status: "error",
        error: errorMessage,
      });

      await saveTodoKeywords();

      expect(get(error)).toBe(errorMessage);
    });
  });

  describe("addActiveKeyword", () => {
    it("should add active keyword successfully", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["TODO", "IN-PROGRESS", "WAITING", "NEXT"],
          closed: ["DONE", "CANCELLED"],
        },
      };

      mockCommands.addActiveTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await addActiveKeyword("NEXT");

      expect(mockCommands.addActiveTodoKeyword).toHaveBeenCalledWith("NEXT");
      expect(get(activeKeywords)).toEqual([
        "TODO",
        "IN-PROGRESS",
        "WAITING",
        "NEXT",
      ]);
      expect(get(isDirty)).toBe(false);
      expect(get(error)).toBe(null);
    });

    it("should handle empty keyword", async () => {
      await addActiveKeyword("");

      expect(mockCommands.addActiveTodoKeyword).not.toHaveBeenCalled();
      expect(get(error)).toBe("Keyword cannot be empty");
    });

    it("should preserve whitespace in keyword", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["TODO", "IN-PROGRESS", "WAITING", "  NEXT  "],
          closed: ["DONE", "CANCELLED"],
        },
      };

      mockCommands.addActiveTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await addActiveKeyword("  NEXT  ");

      expect(mockCommands.addActiveTodoKeyword).toHaveBeenCalledWith(
        "  NEXT  ",
      );
    });

    it("should handle add error", async () => {
      const errorMessage = "Duplicate keyword";
      mockCommands.addActiveTodoKeyword.mockResolvedValue({
        status: "error",
        error: errorMessage,
      });

      await addActiveKeyword("TODO");

      expect(get(error)).toBe(errorMessage);
    });
  });

  describe("addClosedKeyword", () => {
    it("should add closed keyword successfully", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["TODO", "IN-PROGRESS", "WAITING"],
          closed: ["DONE", "CANCELLED", "ARCHIVED"],
        },
      };

      mockCommands.addClosedTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await addClosedKeyword("ARCHIVED");

      expect(mockCommands.addClosedTodoKeyword).toHaveBeenCalledWith(
        "ARCHIVED",
      );
      expect(get(closedKeywords)).toEqual(["DONE", "CANCELLED", "ARCHIVED"]);
    });

    it("should handle empty keyword", async () => {
      await addClosedKeyword("");

      expect(mockCommands.addClosedTodoKeyword).not.toHaveBeenCalled();
      expect(get(error)).toBe("Keyword cannot be empty");
    });
  });

  describe("removeActiveKeyword", () => {
    it("should remove active keyword successfully", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["IN-PROGRESS", "WAITING"],
          closed: ["DONE", "CANCELLED"],
        },
      };

      mockCommands.removeActiveTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await removeActiveKeyword(0);

      expect(mockCommands.removeActiveTodoKeyword).toHaveBeenCalledWith(0);
      expect(get(activeKeywords)).toEqual(["IN-PROGRESS", "WAITING"]);
    });

    it("should handle remove error", async () => {
      const errorMessage = "Invalid index";
      mockCommands.removeActiveTodoKeyword.mockResolvedValue({
        status: "error",
        error: errorMessage,
      });

      await removeActiveKeyword(999);

      expect(get(error)).toBe(errorMessage);
    });
  });

  describe("removeClosedKeyword", () => {
    it("should remove closed keyword successfully", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["TODO", "IN-PROGRESS", "WAITING"],
          closed: ["CANCELLED"],
        },
      };

      mockCommands.removeClosedTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await removeClosedKeyword(0);

      expect(mockCommands.removeClosedTodoKeyword).toHaveBeenCalledWith(0);
      expect(get(closedKeywords)).toEqual(["CANCELLED"]);
    });
  });

  describe("editActiveKeyword", () => {
    it("should edit active keyword successfully", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["TASK", "IN-PROGRESS", "WAITING"],
          closed: ["DONE", "CANCELLED"],
        },
      };

      mockCommands.editActiveTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await editActiveKeyword(0, "TASK");

      expect(mockCommands.editActiveTodoKeyword).toHaveBeenCalledWith(
        0,
        "TASK",
      );
      expect(get(activeKeywords)).toEqual(["TASK", "IN-PROGRESS", "WAITING"]);
      expect(get(editingIndex).active).toBe(null);
    });

    it("should handle empty keyword", async () => {
      await editActiveKeyword(0, "");

      expect(mockCommands.editActiveTodoKeyword).not.toHaveBeenCalled();
      expect(get(error)).toBe("Keyword cannot be empty");
    });

    it("should preserve whitespace in keyword", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["  TASK  ", "IN-PROGRESS", "WAITING"],
          closed: ["DONE", "CANCELLED"],
        },
      };

      mockCommands.editActiveTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await editActiveKeyword(0, "  TASK  ");

      expect(mockCommands.editActiveTodoKeyword).toHaveBeenCalledWith(
        0,
        "  TASK  ",
      );
    });
  });

  describe("editClosedKeyword", () => {
    it("should edit closed keyword successfully", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["TODO", "IN-PROGRESS", "WAITING"],
          closed: ["FINISHED", "CANCELLED"],
        },
      };

      mockCommands.editClosedTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await editClosedKeyword(0, "FINISHED");

      expect(mockCommands.editClosedTodoKeyword).toHaveBeenCalledWith(
        0,
        "FINISHED",
      );
      expect(get(closedKeywords)).toEqual(["FINISHED", "CANCELLED"]);
      expect(get(editingIndex).closed).toBe(null);
    });
  });

  describe("moveActiveKeyword", () => {
    it("should move active keyword up", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["IN-PROGRESS", "TODO", "WAITING"],
          closed: ["DONE", "CANCELLED"],
        },
      };

      mockCommands.moveActiveTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await moveActiveKeyword(1, -1);

      expect(mockCommands.moveActiveTodoKeyword).toHaveBeenCalledWith(1, -1);
      expect(get(activeKeywords)).toEqual(["IN-PROGRESS", "TODO", "WAITING"]);
    });

    it("should move active keyword down", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["IN-PROGRESS", "TODO", "WAITING"],
          closed: ["DONE", "CANCELLED"],
        },
      };

      mockCommands.moveActiveTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await moveActiveKeyword(0, 1);

      expect(mockCommands.moveActiveTodoKeyword).toHaveBeenCalledWith(0, 1);
    });
  });

  describe("moveClosedKeyword", () => {
    it("should move closed keyword successfully", async () => {
      const newUserSettings: UserSettings = {
        ...defaultUserSettings,
        todo_keywords: {
          active: ["TODO", "IN-PROGRESS", "WAITING"],
          closed: ["CANCELLED", "DONE"],
        },
      };

      mockCommands.moveClosedTodoKeyword.mockResolvedValue({
        status: "ok",
        data: newUserSettings,
      });

      await moveClosedKeyword(1, -1);

      expect(mockCommands.moveClosedTodoKeyword).toHaveBeenCalledWith(1, -1);
      expect(get(closedKeywords)).toEqual(["CANCELLED", "DONE"]);
    });
  });

  describe("resetToDefaults", () => {
    it("should reset to default keywords successfully", async () => {
      mockCommands.resetTodoKeywordsToDefaults.mockResolvedValue({
        status: "ok",
        data: defaultUserSettings,
      });

      await resetToDefaults();

      expect(mockCommands.resetTodoKeywordsToDefaults).toHaveBeenCalled();
      expect(get(activeKeywords)).toEqual(["TODO", "IN-PROGRESS", "WAITING"]);
      expect(get(closedKeywords)).toEqual(["DONE", "CANCELLED"]);
      expect(get(editingIndex)).toEqual({ active: null, closed: null });
      expect(get(isDirty)).toBe(false);
    });

    it("should handle reset error", async () => {
      const errorMessage = "Failed to reset";
      mockCommands.resetTodoKeywordsToDefaults.mockResolvedValue({
        status: "error",
        error: errorMessage,
      });

      await resetToDefaults();

      expect(get(error)).toBe(errorMessage);
    });
  });

  describe("Editing Index Management", () => {
    it("should set active editing index", () => {
      setEditingActiveIndex(2);
      expect(get(editingIndex).active).toBe(2);
      expect(get(editingIndex).closed).toBe(null);
    });

    it("should set closed editing index", () => {
      setEditingClosedIndex(1);
      expect(get(editingIndex).closed).toBe(1);
      expect(get(editingIndex).active).toBe(null);
    });

    it("should clear editing indices", () => {
      setEditingActiveIndex(1);
      setEditingClosedIndex(0);

      setEditingActiveIndex(null);
      setEditingClosedIndex(null);

      expect(get(editingIndex)).toEqual({ active: null, closed: null });
    });
  });

  describe("Error Management", () => {
    it("should clear error", () => {
      // First set an error by triggering a failed operation
      mockCommands.addActiveTodoKeyword.mockResolvedValue({
        status: "error",
        error: "Test error",
      });

      addActiveKeyword("TEST").then(() => {
        expect(get(error)).toBe("Test error");

        clearError();
        expect(get(error)).toBe(null);
      });
    });
  });

  describe("Store Subscriptions", () => {
    it("should provide reactive subscriptions", () => {
      // Test that the derived stores are working
      expect(typeof get(activeKeywords)).toBe("object");
      expect(typeof get(closedKeywords)).toBe("object");
      expect(typeof get(isLoading)).toBe("boolean");
      expect(typeof get(isDirty)).toBe("boolean");
      expect(get(error) === null || typeof get(error) === "string").toBe(true);
      expect(typeof get(editingIndex)).toBe("object");
    });
  });

  describe("Default Export", () => {
    it("should export store object with all required methods", () => {
      expect(todoKeywords).toBeDefined();
      expect(typeof todoKeywords.subscribe).toBe("function");
      expect(typeof todoKeywords.loadTodoKeywords).toBe("function");
      expect(typeof todoKeywords.saveTodoKeywords).toBe("function");
      expect(typeof todoKeywords.addActiveKeyword).toBe("function");
      expect(typeof todoKeywords.addClosedKeyword).toBe("function");
      expect(typeof todoKeywords.removeActiveKeyword).toBe("function");
      expect(typeof todoKeywords.removeClosedKeyword).toBe("function");
      expect(typeof todoKeywords.editActiveKeyword).toBe("function");
      expect(typeof todoKeywords.editClosedKeyword).toBe("function");
      expect(typeof todoKeywords.moveActiveKeyword).toBe("function");
      expect(typeof todoKeywords.moveClosedKeyword).toBe("function");
      expect(typeof todoKeywords.setEditingActiveIndex).toBe("function");
      expect(typeof todoKeywords.setEditingClosedIndex).toBe("function");
      expect(typeof todoKeywords.resetToDefaults).toBe("function");
      expect(typeof todoKeywords.clearError).toBe("function");
    });
  });
});
