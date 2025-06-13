import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import { get } from "svelte/store";
import ListView from "../../ListView.svelte";
import {
  displayMode,
  documents,
  loading,
  error,
  hasMonitoredPaths,
  showDetailView,
  selectedHeadline,
  closeDetailView,
} from "$lib/viewmodels/listview.store";

// Mock the commands module
vi.mock("$lib/bindings", () => ({
  commands: {
    loadUserSettings: vi.fn().mockResolvedValue({
      status: "ok",
      data: { monitored_paths: [] },
    }),
    startFileMonitoring: vi.fn().mockResolvedValue({
      status: "ok",
      data: "Monitoring started",
    }),
    getAllDocuments: vi.fn().mockResolvedValue({
      status: "ok",
      data: [],
    }),
    getOrgDocumentDisplayTitleById: vi.fn().mockResolvedValue({
      status: "ok",
      data: "Test Document",
    }),
    getOrgDocumentPathById: vi.fn().mockResolvedValue({
      status: "ok",
      data: "/test/path.org",
    }),
  },
}));

// Mock test headline
const mockHeadline = {
  id: "headline-1",
  document_id: "doc-1",
  title: {
    raw: "Test Task",
    level: 1,
    priority: "A",
    tags: ["urgent"],
    todo_keyword: "TODO",
    properties: { project: "TestProject" },
    planning: null,
  },
  content: "This is a test task content",
  children: [],
  etag: "test-etag",
};

const mockDocument = {
  id: "doc-1",
  title: "Test Document",
  content: "Test content",
  headlines: [mockHeadline],
  filetags: [],
  file_path: "/test/path.org",
  properties: {},
  category: "test",
  etag: "doc-etag",
  todo_config: null,
};

describe("ListView Back Button Functionality", () => {
  beforeEach(() => {
    // Reset store state
    documents.set([]);
    loading.set(false);
    error.set(null);
    hasMonitoredPaths.set(true);
    displayMode.set("task-list");
    showDetailView.set(false);
    selectedHeadline.set(null);
  });

  it("should render back button when in DetailView mode", async () => {
    // Set up DetailView state
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    render(ListView);

    // Should show the back button
    const backButton = screen.getByText("Back to Task List");
    expect(backButton).toBeInTheDocument();
  });

  it("should show correct back button text for different display modes", async () => {
    // Test Task List mode
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);
    displayMode.set("task-list");

    const { rerender } = render(ListView);

    expect(screen.getByText("Back to Task List")).toBeInTheDocument();

    // Test Headline List mode
    displayMode.set("headline-list");
    await rerender({});

    expect(screen.getByText("Back to Headline List")).toBeInTheDocument();
  });

  it("should call closeDetailView when back button is clicked", async () => {
    // Set up DetailView state
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    // Spy on the closeDetailView function
    const closeDetailViewSpy = vi.fn();
    vi.doMock("$lib/viewmodels/listview.store", async () => {
      const actual = await vi.importActual("$lib/viewmodels/listview.store");
      return {
        ...actual,
        closeDetailView: closeDetailViewSpy,
      };
    });

    render(ListView);

    const backButton = screen.getByText("Back to Task List");

    // Click the back button
    await fireEvent.click(backButton);

    // Check if closeDetailView was called
    expect(closeDetailViewSpy).toHaveBeenCalledTimes(1);
  });

  it("should update store state when closeDetailView is called directly", () => {
    // Set up DetailView state
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    // Verify initial state
    expect(get(showDetailView)).toBe(true);
    expect(get(selectedHeadline)).toBe(mockHeadline);

    // Call closeDetailView directly
    closeDetailView();

    // Verify state was updated
    expect(get(showDetailView)).toBe(false);
    expect(get(selectedHeadline)).toBe(null);
  });

  it("should not show back button when not in DetailView mode", async () => {
    documents.set([mockDocument]);
    showDetailView.set(false);
    selectedHeadline.set(null);

    render(ListView);

    // Should not show the back button
    expect(screen.queryByText("Back to Task List")).not.toBeInTheDocument();
    expect(screen.queryByText("Back to Headline List")).not.toBeInTheDocument();
  });

  it("should switch from DetailView to list view when showDetailView changes", async () => {
    // Start in DetailView mode
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    const { rerender } = render(ListView);

    // Should show DetailView
    expect(screen.getByText("Back to Task List")).toBeInTheDocument();

    // Change to list view
    showDetailView.set(false);
    await rerender({});

    // Should not show DetailView anymore
    expect(screen.queryByText("Back to Task List")).not.toBeInTheDocument();
  });

  it("should handle keyboard escape to close DetailView", async () => {
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    render(ListView);

    // Verify we're in DetailView
    expect(screen.getByText("Back to Task List")).toBeInTheDocument();

    // Simulate escape key press
    await fireEvent.keyDown(document, { key: "Escape" });

    // Check if the store state was updated
    expect(get(showDetailView)).toBe(false);
    expect(get(selectedHeadline)).toBe(null);
  });

  it("should handle button reactivity properly", async () => {
    documents.set([mockDocument]);
    showDetailView.set(false);
    selectedHeadline.set(null);

    const { rerender } = render(ListView);

    // Initially should not show back button
    expect(screen.queryByText("Back to Task List")).not.toBeInTheDocument();

    // Switch to DetailView
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);
    await rerender({});

    // Now should show back button
    expect(screen.getByText("Back to Task List")).toBeInTheDocument();

    // Switch back to list view
    showDetailView.set(false);
    selectedHeadline.set(null);
    await rerender({});

    // Should not show back button again
    expect(screen.queryByText("Back to Task List")).not.toBeInTheDocument();
  });
});
