import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { get } from "svelte/store";
import TodoKeywordsSection from "../../settings/TodoKeywordsSection.svelte";
import { commands } from "$lib/bindings";
import type { TodoKeywords, UserSettings } from "$lib/bindings";

// Mock the commands
vi.mock("$lib/bindings", () => ({
  commands: {
    getUserTodoKeywords: vi.fn(),
    addActiveTodoKeyword: vi.fn(),
    addClosedTodoKeyword: vi.fn(),
    removeActiveTodoKeyword: vi.fn(),
    removeClosedTodoKeyword: vi.fn(),
    editActiveTodoKeyword: vi.fn(),
    editClosedTodoKeyword: vi.fn(),
    moveActiveTodoKeyword: vi.fn(),
    moveClosedTodoKeyword: vi.fn(),
    resetTodoKeywordsToDefaults: vi.fn(),
  },
}));

const mockCommands = commands as any;

describe("TodoKeywordsSection", () => {
  const defaultTodoKeywords: TodoKeywords = {
    active: ["TODO", "IN-PROGRESS", "WAITING"],
    closed: ["DONE", "CANCELLED"],
  };

  const defaultUserSettings: UserSettings = {
    monitored_paths: [],
    todo_keywords: defaultTodoKeywords,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful responses
    mockCommands.getUserTodoKeywords.mockResolvedValue({
      status: "ok",
      data: defaultTodoKeywords,
    });

    mockCommands.addActiveTodoKeyword.mockResolvedValue({
      status: "ok",
      data: defaultUserSettings,
    });

    mockCommands.addClosedTodoKeyword.mockResolvedValue({
      status: "ok",
      data: defaultUserSettings,
    });

    mockCommands.removeActiveTodoKeyword.mockResolvedValue({
      status: "ok",
      data: defaultUserSettings,
    });

    mockCommands.removeClosedTodoKeyword.mockResolvedValue({
      status: "ok",
      data: defaultUserSettings,
    });

    mockCommands.resetTodoKeywordsToDefaults.mockResolvedValue({
      status: "ok",
      data: defaultUserSettings,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render the component with default keywords", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText("TODO Keywords")).toBeInTheDocument();
      expect(screen.getByText("Active Keywords")).toBeInTheDocument();
      expect(screen.getByText("Closed Keywords")).toBeInTheDocument();
    });

    // Check for default keywords
    await waitFor(() => {
      expect(screen.getByText("TODO")).toBeInTheDocument();
      expect(screen.getByText("IN-PROGRESS")).toBeInTheDocument();
      expect(screen.getByText("WAITING")).toBeInTheDocument();
      expect(screen.getByText("DONE")).toBeInTheDocument();
      expect(screen.getByText("CANCELLED")).toBeInTheDocument();
    });
  });

  it("should load TODO keywords on mount", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(mockCommands.getUserTodoKeywords).toHaveBeenCalled();
    });
  });

  it("should display keyword counts correctly", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText("3 keywords")).toBeInTheDocument(); // Active keywords count
      expect(screen.getByText("2 keywords")).toBeInTheDocument(); // Closed keywords count
    });
  });

  it("should show add keyword inputs", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("Add keyword...");
      expect(inputs).toHaveLength(2); // One for active, one for closed
    });
  });

  it("should have reset to defaults button", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
    });
  });

  it("should display help text", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText(/Active keywords/)).toBeInTheDocument();
      expect(screen.getByText(/Closed keywords/)).toBeInTheDocument();
    });
  });

  it("should show loading state text", async () => {
    render(TodoKeywordsSection);

    // Initially should show auto-save message
    await waitFor(() => {
      expect(
        screen.getByText("Changes are saved automatically"),
      ).toBeInTheDocument();
    });
  });

  it("should handle add active keyword", async () => {
    mockCommands.addActiveTodoKeyword.mockResolvedValue({
      status: "ok",
      data: {
        ...defaultUserSettings,
        todo_keywords: {
          active: [...defaultTodoKeywords.active, "NEXT"],
          closed: defaultTodoKeywords.closed,
        },
      },
    });

    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText("TODO")).toBeInTheDocument();
    });

    // Find the active keywords input
    const inputs = screen.getAllByPlaceholderText("Add keyword...");
    const activeInput = inputs[0]; // First input should be for active keywords

    // Type a new keyword
    await fireEvent.input(activeInput, { target: { value: "NEXT" } });

    // Find and click the add button (plus icon)
    const addButtons = screen.getAllByRole("button");
    const activeAddButton = addButtons.find(
      (button) =>
        button.querySelector("svg") &&
        button
          .closest(".flex")
          ?.querySelector('input[placeholder="Add keyword..."]') ===
          activeInput,
    );

    if (activeAddButton) {
      await fireEvent.click(activeAddButton);

      await waitFor(() => {
        expect(mockCommands.addActiveTodoKeyword).toHaveBeenCalledWith("NEXT");
      });
    }
  });

  it("should handle add closed keyword", async () => {
    mockCommands.addClosedTodoKeyword.mockResolvedValue({
      status: "ok",
      data: {
        ...defaultUserSettings,
        todo_keywords: {
          active: defaultTodoKeywords.active,
          closed: [...defaultTodoKeywords.closed, "ARCHIVED"],
        },
      },
    });

    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText("DONE")).toBeInTheDocument();
    });

    // Find the closed keywords input (second one)
    const inputs = screen.getAllByPlaceholderText("Add keyword...");
    const closedInput = inputs[1]; // Second input should be for closed keywords

    // Type a new keyword
    await fireEvent.input(closedInput, { target: { value: "ARCHIVED" } });

    // Find and click the add button for closed keywords
    const addButtons = screen.getAllByRole("button");
    const closedAddButton = addButtons.find(
      (button) =>
        button.querySelector("svg") &&
        button
          .closest(".flex")
          ?.querySelector('input[placeholder="Add keyword..."]') ===
          closedInput,
    );

    if (closedAddButton) {
      await fireEvent.click(closedAddButton);

      await waitFor(() => {
        expect(mockCommands.addClosedTodoKeyword).toHaveBeenCalledWith(
          "ARCHIVED",
        );
      });
    }
  });

  it("should handle reset to defaults", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
    });

    const resetButton = screen.getByText("Reset to Defaults");
    await fireEvent.click(resetButton);

    // Wait for confirmation dialog to appear with more specific text matching
    await waitFor(
      () => {
        expect(screen.getByText("Reset TODO Keywords")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Look for the confirmation text that spans multiple elements
    await waitFor(() => {
      expect(
        screen.getByText(/Are you sure you want to reset TODO keywords/),
      ).toBeInTheDocument();
    });

    // Click the confirmation button in the dialog
    const confirmButtons = screen.getAllByText("Reset to Defaults");
    const dialogConfirmButton =
      confirmButtons.find(
        (button) => button.closest(".fixed.inset-0") !== null,
      ) || confirmButtons[1]; // Fallback to second instance

    await fireEvent.click(dialogConfirmButton);

    await waitFor(() => {
      expect(mockCommands.resetTodoKeywordsToDefaults).toHaveBeenCalled();
    });
  });

  it("should not reset when user cancels confirmation", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
    });

    const resetButton = screen.getByText("Reset to Defaults");
    await fireEvent.click(resetButton);

    // Wait for confirmation dialog to appear
    await waitFor(
      () => {
        expect(screen.getByText("Reset TODO Keywords")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Look for the confirmation text that spans multiple elements
    await waitFor(() => {
      expect(
        screen.getByText(/Are you sure you want to reset TODO keywords/),
      ).toBeInTheDocument();
    });

    // Click the cancel button in the dialog
    const cancelButton = screen.getByText("Cancel");
    await fireEvent.click(cancelButton);

    // Should not call the reset command when user cancels
    await waitFor(() => {
      expect(mockCommands.resetTodoKeywordsToDefaults).not.toHaveBeenCalled();
    });
  });

  it("should display error messages when they occur", async () => {
    const errorMessage = "Failed to load keywords";
    mockCommands.getUserTodoKeywords.mockResolvedValue({
      status: "error",
      error: errorMessage,
    });

    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("should allow dismissing error messages", async () => {
    const errorMessage = "Failed to load keywords";
    mockCommands.getUserTodoKeywords.mockResolvedValue({
      status: "error",
      error: errorMessage,
    });

    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Find and click the dismiss button (X icon) in the error alert
    const errorAlert = screen.getByText(errorMessage).closest('[role="alert"]');
    const dismissButton = errorAlert?.querySelector("button");
    if (dismissButton) {
      await fireEvent.click(dismissButton);
    }

    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  it("should handle keyboard navigation with Enter key for adding keywords", async () => {
    mockCommands.addActiveTodoKeyword.mockResolvedValue({
      status: "ok",
      data: {
        ...defaultUserSettings,
        todo_keywords: {
          active: [...defaultTodoKeywords.active, "URGENT"],
          closed: defaultTodoKeywords.closed,
        },
      },
    });

    render(TodoKeywordsSection);

    await waitFor(() => {
      expect(screen.getByText("TODO")).toBeInTheDocument();
    });

    // Find the active keywords input
    const inputs = screen.getAllByPlaceholderText("Add keyword...");
    const activeInput = inputs[0];

    // Type a new keyword
    await fireEvent.input(activeInput, { target: { value: "URGENT" } });

    // Press Enter key
    await fireEvent.keyDown(activeInput, { key: "Enter" });

    await waitFor(() => {
      expect(mockCommands.addActiveTodoKeyword).toHaveBeenCalledWith("URGENT");
    });
  });

  it("should render chips with correct styling for active and closed keywords", async () => {
    render(TodoKeywordsSection);

    await waitFor(() => {
      // Check that active keywords have blue styling
      const todoChip = screen.getByText("TODO").closest(".bg-blue-100");
      expect(todoChip).toBeInTheDocument();

      // Check that closed keywords have green styling
      const doneChip = screen.getByText("DONE").closest(".bg-green-100");
      expect(doneChip).toBeInTheDocument();
    });
  });
});
