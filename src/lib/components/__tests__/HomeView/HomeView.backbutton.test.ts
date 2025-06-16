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
  showDetailView,
  selectedHeadline,
  closeDetailView,
  documentCount,
} from "$lib/viewmodels/homeview.store";

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
    selectedHeadline.set(null);
  });

  it("should render Home breadcrumb when in DetailView mode", async () => {
    // Set up DetailView state
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    render(HomeView);

    // Should show the Home breadcrumb link
    const homeLink = screen.getByText("Home");
    expect(homeLink).toBeInTheDocument();
  });

  it("should show Home breadcrumb regardless of display mode", async () => {
    // Test Task List mode
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);
    displayMode.set("task-list");

    const { rerender } = render(HomeView);

    expect(screen.getByText("Home")).toBeInTheDocument();

    // Test Headline List mode
    displayMode.set("headline-list");
    await rerender({});

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("should call closeDetailView when Home breadcrumb is clicked", async () => {
    // Set up DetailView state
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    render(HomeView);

    const homeLink = screen.getByText("Home");

    // Click the Home breadcrumb
    await fireEvent.click(homeLink);

    // Check if closeDetailView was called by verifying store state
    expect(get(showDetailView)).toBe(false);
    expect(get(selectedHeadline)).toBe(null);
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

  it("should not show Home breadcrumb when not in DetailView mode", async () => {
    documents.set([mockDocument]);
    showDetailView.set(false);
    selectedHeadline.set(null);

    render(HomeView);

    // Should not show the Home breadcrumb
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("should switch from DetailView to list view when showDetailView changes", async () => {
    // Start in DetailView mode
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

    const { rerender } = render(HomeView);

    // Should show DetailView with Home breadcrumb
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Change to list view
    showDetailView.set(false);
    await rerender({});

    // Should not show DetailView anymore
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("should handle keyboard escape to close DetailView", async () => {
    documents.set([mockDocument]);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);

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
      expect(get(selectedHeadline)).toBe(null);
    });
  });

  it("should handle breadcrumb reactivity properly", async () => {
    documents.set([mockDocument]);
    showDetailView.set(false);
    selectedHeadline.set(null);

    const { rerender } = render(HomeView);

    // Initially should not show Home breadcrumb
    expect(screen.queryByText("Home")).not.toBeInTheDocument();

    // Switch to DetailView
    showDetailView.set(true);
    selectedHeadline.set(mockHeadline);
    await rerender({});

    // Now should show Home breadcrumb
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Switch back to list view
    showDetailView.set(false);
    selectedHeadline.set(null);
    await rerender({});

    // Should not show Home breadcrumb again
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });
});
