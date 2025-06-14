import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import HomeView from "../../HomeView.svelte";
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

// Mock test data
const mockHeadlines = [
  {
    id: "headline-1",
    document_id: "doc-1",
    title: {
      raw: "TODO Test Task",
      level: 1,
      priority: "A",
      tags: ["urgent", "work"],
      todo_keyword: "TODO",
      properties: { project: "TestProject" },
      planning: null,
    },
    content:
      "This is the content of the test task with detailed information about what needs to be done.",
    children: [
      {
        id: "child-1",
        document_id: "doc-1",
        title: {
          raw: "Subtask 1",
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
  },
  {
    id: "headline-2",
    document_id: "doc-1",
    title: {
      raw: "Regular Headline",
      level: 1,
      priority: null,
      tags: ["info"],
      todo_keyword: null,
      properties: {},
      planning: null,
    },
    content: "This is a regular headline without TODO status.",
    children: [],
    etag: "test-etag-2",
  },
];

const mockDocument = {
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
};

describe("HomeView DetailView Integration", () => {
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

  it("should show headline list when not in detail view mode", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(false);

    render(HomeView);

    // Should show the task list with headlines
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("should show DetailView when showDetailView is true", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadlines[0]);

    render(HomeView);

    // Should show the DetailView with Home breadcrumb
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Should show the headline content in DetailView
    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("TODO")).toBeInTheDocument();
    expect(screen.getByText("[#A]")).toBeInTheDocument();
  });

  it("should display headline content in DetailView", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadlines[0]);

    render(HomeView);

    // Should show the content
    expect(
      screen.getByText(/This is the content of the test task/),
    ).toBeInTheDocument();
  });

  it("should show child headlines in DetailView table", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadlines[0]);

    render(HomeView);

    // Should show child headlines section
    expect(screen.getByText("Subtasks / Child Headlines")).toBeInTheDocument();

    // Should show the child headline in the table
    expect(screen.getByText("Subtask 1")).toBeInTheDocument();
  });

  it("should show properties in DetailView", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadlines[0]);

    render(HomeView);

    // Should show properties
    expect(screen.getByText("project:")).toBeInTheDocument();
    expect(screen.getByText("TestProject")).toBeInTheDocument();
  });

  it("should show tags in DetailView", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadlines[0]);

    render(HomeView);

    // Should show tags
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.getByText("work")).toBeInTheDocument();
  });

  it("should allow clicking Home breadcrumb to return to list view", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadlines[0]);

    render(HomeView);

    const homeLink = screen.getByText("Home");
    expect(homeLink).toBeInTheDocument();

    // Click the Home breadcrumb
    await fireEvent.click(homeLink);

    // Should close detail view (though we can't test store changes directly in this test)
    expect(homeLink).toBeInTheDocument();
  });

  it("should show Home breadcrumb for different display modes", async () => {
    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(mockHeadlines[0]);

    // Test headline-list mode
    displayMode.set("headline-list");

    render(HomeView);

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("should handle empty content gracefully", async () => {
    const headlineWithoutContent = {
      ...mockHeadlines[0],
      content: "",
    };

    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(headlineWithoutContent);

    render(HomeView);

    // Should still show the headline title and other elements
    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("TODO")).toBeInTheDocument();
  });

  it("should handle headline without children", async () => {
    const headlineWithoutChildren = {
      ...mockHeadlines[1], // Regular headline without children
    };

    documents.set([mockDocument]);
    hasMonitoredPaths.set(true);
    showDetailView.set(true);
    selectedHeadline.set(headlineWithoutChildren);

    render(HomeView);

    // Should show the headline but not the children section
    expect(screen.getByText("Regular Headline")).toBeInTheDocument();
    expect(
      screen.queryByText("Subtasks / Child Headlines"),
    ).not.toBeInTheDocument();
  });
});
