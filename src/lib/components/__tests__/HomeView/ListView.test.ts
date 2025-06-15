import { render, screen, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomeView from "../../HomeView.svelte";
import { commands } from "$lib/bindings";
import type { OrgDocument, OrgHeadline, UserSettings } from "$lib/bindings";

// Mock the Tauri commands
vi.mock("$lib/bindings", () => {
  return {
    commands: {
      getSampleOrg: vi.fn(),
      loadUserSettings: vi.fn(),
      getAllDocuments: vi.fn(),
      startFileMonitoring: vi.fn(),
      stopFileMonitoring: vi.fn(),
      getOrgDocumentById: vi.fn(),
      getOrgDocumentDisplayTitleById: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "Test Document Title" }),
      getOrgDocumentPathById: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "/test/path/document.org" }),
      saveUserSettings: vi.fn(),
      addMonitoredPath: vi.fn(),
      removeMonitoredPath: vi.fn(),
      updateMonitoredPath: vi.fn(),
      setPathParseEnabled: vi.fn(),
      clearUserSettings: vi.fn(),
      checkPathMonitoringStatus: vi.fn(),
      getTodoKeywords: vi.fn(),
    },
  };
});

describe("HomeView Component", () => {
  let mockDocument: OrgDocument;
  let monitoredSettings: UserSettings;
  let emptySettings: UserSettings;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Create a mock document
    mockDocument = {
      id: "doc-1",
      title: "Test Document",
      content: "Test content",
      headlines: [],
      filetags: ["test", "doc"],
      file_path: "/path/to/test.org",
      properties: { AUTHOR: "Test User", CREATED: "2023-01-01" },
      category: "Test",
      etag: "test-etag",
      todo_config: null,
    };

    // Mock headlines
    const headline1: OrgHeadline = {
      id: "h1",
      document_id: "doc-1",
      title: {
        raw: "* TODO Test Headline",
        level: 1,
        priority: null,
        tags: ["task"],
        todo_keyword: "TODO",
        properties: {},
        planning: null,
      },
      content: "Test content",
      children: [],
      etag: "test-etag",
    };

    mockDocument.headlines = [headline1];

    monitoredSettings = {
      monitored_paths: [
        {
          path: "/path/to/test.org",
          path_type: "File",
          parse_enabled: true,
        },
      ],
    };

    emptySettings = {
      monitored_paths: [],
    };

    // Default: monitored paths exist, docs load successfully
    vi.mocked(commands.loadUserSettings).mockResolvedValue({
      status: "ok",
      data: monitoredSettings,
    });
    vi.mocked(commands.startFileMonitoring).mockResolvedValue({
      status: "ok",
      data: "started",
    });
    vi.mocked(commands.getAllDocuments).mockResolvedValue({
      status: "ok",
      data: [mockDocument],
    });
  });

  it("shows loading state initially", () => {
    render(HomeView);

    // Should show loading spinner
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("displays document data after loading", async () => {
    render(HomeView);

    // Wait for the document to load
    await waitFor(() => {
      expect(screen.getAllByText("Test Document").length).toBeGreaterThan(0);
    });

    // Document metadata should be visible
    expect(screen.getAllByText("Test Document").length).toBeGreaterThan(0);
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("doc")).toBeInTheDocument();
    expect(screen.getByText(/file[s]? loaded/)).toBeInTheDocument();

    // Task list section should be visible
    expect(screen.getByText("Task List")).toBeInTheDocument();
    expect(screen.getByText("Keyboard shortcuts:")).toBeInTheDocument();
  });

  it("handles errors correctly", async () => {
    // Setup mock to throw an error on getAllDocuments
    vi.mocked(commands.getAllDocuments).mockRejectedValue(
      new Error("Test error"),
    );

    render(HomeView);

    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText("Error: Test error")).toBeInTheDocument();
    });
  });

  it("shows empty state when no monitored paths are set", async () => {
    // Setup mock to return empty monitored paths
    vi.mocked(commands.loadUserSettings).mockResolvedValue({
      status: "ok",
      data: emptySettings,
    });

    render(HomeView);

    // Wait for the empty state to be displayed
    await waitFor(() => {
      expect(
        screen.getAllByText("No monitored paths configured.").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText(/Please add a file or directory/),
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when monitored paths exist but no documents are loaded", async () => {
    // Setup mock: monitored paths exist, but no documents
    vi.mocked(commands.getAllDocuments).mockResolvedValue({
      status: "ok",
      data: [],
    });

    render(HomeView);

    // Wait for the empty state to be displayed
    await waitFor(() => {
      expect(
        screen.getByText(
          "No documents loaded. Make sure you have added some documents.",
        ),
      ).toBeInTheDocument();
    });
  });
});
