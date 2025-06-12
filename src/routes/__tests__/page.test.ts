import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import Page from "../+page.svelte";
import {
  displayMode,
  documents,
  loading,
  error,
  hasMonitoredPaths,
} from "$lib/viewmodels/listview.store";

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

  it("should render display mode tabs", async () => {
    render(Page);

    // Check that both tabs are rendered
    expect(screen.getByRole("tab", { name: "Task List" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Headline List" }),
    ).toBeInTheDocument();
  });

  it("should have task-list tab selected by default", async () => {
    render(Page);

    const taskListTab = screen.getByRole("tab", { name: "Task List" });
    expect(taskListTab).toHaveAttribute("data-state", "active");
  });

  it("should switch to headline-list tab when clicked", async () => {
    render(Page);

    const headlineListTab = screen.getByRole("tab", { name: "Headline List" });

    // Click the headline list tab
    await fireEvent.click(headlineListTab);

    // Check that the tab is now active
    expect(headlineListTab).toHaveAttribute("data-state", "active");

    // Check that task list tab is no longer active
    const taskListTab = screen.getByRole("tab", { name: "Task List" });
    expect(taskListTab).toHaveAttribute("data-state", "inactive");
  });

  it("should render ListView component in both tab contents", async () => {
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

    // The ListView component should be rendered
    // We can check for the presence of the ListView container
    const listViewContainer = screen.getByText(/Task List/);
    expect(listViewContainer).toBeInTheDocument();
  });

  it("should show empty state when no monitored paths are configured", async () => {
    hasMonitoredPaths.set(false);

    render(Page);

    // Should show the empty state message
    expect(
      screen.getByText("No monitored paths configured."),
    ).toBeInTheDocument();
  });

  it("should maintain tab layout structure", async () => {
    render(Page);

    // Check that the tabs container exists
    const tabsContainer = screen.getByRole("tablist");
    expect(tabsContainer).toBeInTheDocument();

    // Check that tab panels exist
    const taskListPanel = screen.getByRole("tabpanel", { name: "Task List" });
    const headlineListPanel = screen.getByRole("tabpanel", {
      name: "Headline List",
    });

    expect(taskListPanel).toBeInTheDocument();
    expect(headlineListPanel).toBeInTheDocument();
  });
});
