import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import { get } from "svelte/store";
import HomeView from "../../HomeView.svelte";
import {
  displayMode,
  documents,
  loading,
  error,
  hasMonitoredPaths,
} from "$lib/viewmodels/homeview.store";
import {
  showDetailView,
  currentHeadline,
  openDetailView,
  closeDetailView,
} from "$lib/viewmodels/detailview.store";

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

describe("HomeView Manual Test - Home Breadcrumb", () => {
  beforeEach(() => {
    // Reset store state
    documents.set([]);
    loading.set(false);
    error.set(null);
    hasMonitoredPaths.set(true);
    displayMode.set("task-list");
    showDetailView.set(false);
    currentHeadline.set(null);
  });

  it.skip("should show DetailView and allow home navigation", async () => {
    // Step 1: Set up DetailView state manually
    openDetailView(mockHeadline);

    // Step 2: Render HomeView
    render(HomeView);

    // Step 3: Verify DetailView is showing
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getAllByText("Test Task").length).toBeGreaterThanOrEqual(1);

    // Step 4: Verify initial store state
    expect(get(showDetailView)).toBe(true);
    expect(get(currentHeadline)).toBe(mockHeadline);

    // Step 4: Click Home breadcrumb
    const homeLink = screen.getByText("Home");
    await fireEvent.click(homeLink);

    // Step 6: Check if store state changed
    expect(get(showDetailView)).toBe(false);
    expect(get(currentHeadline)).toBeNull();
  });

  it.skip("should handle headline list mode home breadcrumb", async () => {
    // Set up headline list mode
    displayMode.set("headline-list");
    openDetailView(mockHeadline);

    render(HomeView);

    // Should show Home breadcrumb regardless of mode
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Click Home breadcrumb
    const homeLink = screen.getByText("Home");
    await fireEvent.click(homeLink);

    // Verify state changed
    expect(get(showDetailView)).toBe(false);
    expect(get(currentHeadline)).toBeNull();
  });

  it.skip("should show DetailView content correctly", async () => {
    openDetailView(mockHeadline);

    render(HomeView);

    // Should show headline details
    expect(screen.getAllByText("Test Task").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("TODO")).toBeInTheDocument();
    expect(screen.getByText("[#A]")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.getByText("project:")).toBeInTheDocument();
    expect(screen.getByText("TestProject")).toBeInTheDocument();
    expect(screen.getByText("This is a test task content")).toBeInTheDocument();
  });

  it("should not show DetailView when showDetailView is false", async () => {
    closeDetailView();

    render(HomeView);

    // Should not show DetailView elements
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it.skip("should handle state transitions correctly", async () => {
    // Start with DetailView off
    closeDetailView();

    const { rerender } = render(HomeView);

    // Should not show Home breadcrumb
    expect(screen.queryByText("Home")).not.toBeInTheDocument();

    // Turn on DetailView
    openDetailView(mockHeadline);
    await rerender({});

    // Should now show Home breadcrumb
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Click Home breadcrumb
    const homeLink = screen.getByText("Home");
    await fireEvent.click(homeLink);

    // Should close DetailView
    expect(get(showDetailView)).toBe(false);
    expect(get(currentHeadline)).toBeNull();

    // Re-render and verify UI updated
    await rerender({});
    expect(screen.queryByText("Back to Task List")).not.toBeInTheDocument();
  });
});
