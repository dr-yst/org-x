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

describe("ListView Manual Test - Back Button", () => {
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

  it("should show DetailView and allow back navigation", async () => {
    // Step 1: Set up DetailView state manually
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    // Step 2: Render ListView
    render(ListView);

    // Step 3: Verify DetailView is showing
    expect(screen.getByText("Back to Task List")).toBeInTheDocument();
    expect(screen.getByText("Test Task")).toBeInTheDocument();

    // Step 4: Verify initial store state
    expect(get(showDetailView)).toBe(true);
    expect(get(selectedHeadline)).toBe(mockHeadline);

    // Step 5: Click the back button
    const backButton = screen.getByText("Back to Task List");
    await fireEvent.click(backButton);

    // Step 6: Check if store state changed
    expect(get(showDetailView)).toBe(false);
    expect(get(selectedHeadline)).toBe(null);
  });

  it("should handle headline list mode back button", async () => {
    // Set up headline list mode
    displayMode.set("headline-list");
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    render(ListView);

    // Should show correct back button text
    expect(screen.getByText("Back to Headline List")).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByText("Back to Headline List");
    await fireEvent.click(backButton);

    // Verify state changed
    expect(get(showDetailView)).toBe(false);
    expect(get(selectedHeadline)).toBe(null);
  });

  it("should show DetailView content correctly", async () => {
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    render(ListView);

    // Should show headline details
    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("TODO")).toBeInTheDocument();
    expect(screen.getByText("[#A]")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.getByText("project:")).toBeInTheDocument();
    expect(screen.getByText("TestProject")).toBeInTheDocument();
    expect(screen.getByText("This is a test task content")).toBeInTheDocument();
  });

  it("should not show DetailView when showDetailView is false", async () => {
    showDetailView.set(false);
    selectedHeadline.set(null);

    render(ListView);

    // Should not show DetailView elements
    expect(screen.queryByText("Back to Task List")).not.toBeInTheDocument();
    expect(screen.queryByText("Back to Headline List")).not.toBeInTheDocument();
  });

  it("should handle state transitions correctly", async () => {
    // Start with DetailView off
    showDetailView.set(false);

    const { rerender } = render(ListView);

    // Should not show back button
    expect(screen.queryByText("Back to Task List")).not.toBeInTheDocument();

    // Turn on DetailView
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);
    await rerender({});

    // Should now show back button
    expect(screen.getByText("Back to Task List")).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByText("Back to Task List");
    await fireEvent.click(backButton);

    // Verify state changed
    expect(get(showDetailView)).toBe(false);

    // Re-render and verify UI updated
    await rerender({});
    expect(screen.queryByText("Back to Task List")).not.toBeInTheDocument();
  });
});
