import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
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

describe("HomeView Breadcrumb Home Navigation", () => {
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

  it.skip("should render Home breadcrumb when in DetailView mode", async () => {
    // Set up DetailView state
    documents.set([mockDocument]);
    openDetailView(mockHeadline);

    render(HomeView);

    // Should show the Home breadcrumb link
    const homeLink = screen.getByText("Home");
    expect(homeLink).toBeInTheDocument();
  });

  it.skip("should show Home breadcrumb regardless of display mode", async () => {
    // Test Task List mode
    documents.set([mockDocument]);
    openDetailView(mockHeadline);
    displayMode.set("task-list");

    const { rerender } = render(HomeView);

    expect(screen.getByText("Home")).toBeInTheDocument();

    // Test Headline List mode
    displayMode.set("headline-list");
    await rerender({});

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it.skip("should call closeDetailView when Home breadcrumb is clicked", async () => {
    documents.set([mockDocument]);
    openDetailView(mockHeadline);

    render(HomeView);

    const homeLink = screen.getByText("Home");
    expect(homeLink).toBeInTheDocument();

    // Click the Home breadcrumb
    await fireEvent.click(homeLink);

    // Should close the detail view
    expect(get(showDetailView)).toBe(false);
    expect(get(currentHeadline)).toBeNull();
  });

  it("should update store state when closeDetailView is called directly", () => {
    // Set up DetailView state
    openDetailView(mockHeadline);

    // Verify initial state
    expect(get(showDetailView)).toBe(true);
    expect(get(currentHeadline)).toBe(mockHeadline);

    // Call closeDetailView directly
    closeDetailView();

    // Verify state was updated
    expect(get(showDetailView)).toBe(false);
    expect(get(currentHeadline)).toBeNull();
  });

  it("should not show Home breadcrumb when not in DetailView mode", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(false);
    currentHeadline.set(null);

    render(HomeView);

    // Should not show the DetailView Home breadcrumb when not in detail view
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it.skip("should switch from DetailView to list view when showDetailView changes", async () => {
    // Start in DetailView mode
    documents.set([mockDocument]);
    openDetailView(mockHeadline);

    const { rerender } = render(HomeView);

    // Should show DetailView with Home breadcrumb
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Change to list view
    closeDetailView();
    await rerender({});

    // Should not show DetailView anymore
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it.skip("should handle keyboard escape to close DetailView", async () => {
    documents.set([mockDocument]);
    openDetailView(mockHeadline);

    render(HomeView);

    // Verify we're in DetailView
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Ensure loading is false so keyboard handler will process events
    loading.set(false);

    // Simulate escape key press on window
    fireEvent.keyDown(window, { key: "Escape" });

    // Use waitFor to check the store state after the event
    await waitFor(() => {
      expect(get(showDetailView)).toBe(false);
      expect(get(currentHeadline)).toBeNull();
    });
  });

  it.skip("should handle breadcrumb reactivity properly", async () => {
    documents.set([mockDocument]);

    const { rerender } = render(HomeView);

    // Initially should not show Home breadcrumb
    expect(screen.queryByText("Home")).not.toBeInTheDocument();

    // Set DetailView state
    openDetailView(mockHeadline);
    await rerender({});

    // Now should show Home breadcrumb
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Clear DetailView state
    closeDetailView();
    await rerender({});

    // Should not show Home breadcrumb again
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });
});
