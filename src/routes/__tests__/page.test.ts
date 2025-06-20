import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import Page from "../+page.svelte";
import {
  displayMode,
  documents,
  loading,
  error,
  hasMonitoredPaths,
} from "$lib/viewmodels/homeview.store";

// Mock the commands module
vi.mock("$lib/bindings", () => ({
  commands: {
    loadUserSettings: vi.fn(),
    startFileMonitoring: vi.fn(),
    getAllDocuments: vi.fn(),
    getOrgDocumentDisplayTitleById: vi.fn(),
    getOrgDocumentPathById: vi.fn(),
  },
}));

// Mock store values
const mockHeadlines = [
  {
    id: "headline-1",
    document_id: "doc-1",
    title: {
      raw: "Task with TODO",
      level: 1,
      priority: null,
      tags: [],
      todo_keyword: "TODO",
      properties: {},
      planning: null,
    },
    content: "Task content",
    children: [],
    etag: "test-etag-1",
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
      raw: "Another Level 1 Headline",
      level: 1,
      priority: null,
      tags: [],
      todo_keyword: null,
      properties: {},
      planning: null,
    },
    content: "Another level 1 content",
    children: [],
    etag: "test-etag-3",
  },
];

describe("Page Component", () => {
  beforeEach(() => {
    // Reset store state
    documents.set([]);
    loading.set(false);
    error.set(null);
    hasMonitoredPaths.set(true);
    displayMode.set("task-list");
  });

  it("should render HomeView component directly", async () => {
    render(Page);

    // The page should render the HomeView component directly without tabs
    // We can check for the presence of the HomeView container
    const homeViewContainer = screen.getByTestId
      ? screen.queryByTestId("homeview-container") ||
        document.querySelector(".w-full.h-full")
      : document.querySelector(".w-full.h-full");

    expect(homeViewContainer).toBeTruthy();
  });

  it("should render HomeView component with proper layout structure", async () => {
    // Set up some test data
    hasMonitoredPaths.set(true);
    documents.set([
      {
        id: "doc-1",
        title: "Test Document",
        content: "Test content",
        headlines: mockHeadlines,
        filetags: [],
        file_path: "/test/path.org",
        properties: {},
        category: "test",
        etag: "doc-etag",
        todo_config: null,
      },
    ]);

    render(Page);

    // The HomeView component should be rendered
    // Check that the main container exists
    const mainContainer = document.querySelector(
      ".flex-1.min-w-0.overflow-hidden.p-4",
    );
    expect(mainContainer).toBeTruthy();
  });

  it("should show empty state when no monitored paths are configured", async () => {
    hasMonitoredPaths.set(false);

    render(Page);

    // Should show the empty state message
    expect(
      screen.getAllByText("No monitored paths configured.").length,
    ).toBeGreaterThan(0);
  });

  it("should not render tabs since display mode is now controlled by sidebar", async () => {
    render(Page);

    // Check that no tab elements exist
    const tabs = screen.queryByRole("tablist");
    expect(tabs).toBeNull();

    const taskTab = screen.queryByRole("tab", { name: "Task List" });
    expect(taskTab).toBeNull();

    const headlineTab = screen.queryByRole("tab", { name: "Headline List" });
    expect(headlineTab).toBeNull();
  });

  it("should render HomeView regardless of display mode", async () => {
    // Test with different display modes
    displayMode.set("headline-list");
    render(Page);

    // HomeView should still be rendered
    const homeViewContainer = document.querySelector(".w-full.h-full");
    expect(homeViewContainer).toBeTruthy();
  });

  it("should maintain proper page layout structure", async () => {
    render(Page);

    // Check that the main page container exists with correct classes
    const pageContainer = document.querySelector(
      ".flex-1.min-w-0.overflow-hidden.p-4",
    );
    expect(pageContainer).toBeTruthy();

    // HomeView should be a direct child
    const homeView = pageContainer?.querySelector(".w-full.h-full");
    expect(homeView).toBeTruthy();
  });
});
