import { render, screen, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomeView from "../../HomeView.svelte";
import { commands } from "$lib/bindings";
import type { OrgDocument, OrgHeadline, UserSettings } from "$lib/bindings";

// Mock the Tauri commands
vi.mock("$lib/bindings", () => {
  return {
    commands: {
      getSampleOrg: vi.fn().mockResolvedValue({ status: "ok", data: null }),
      loadUserSettings: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: { monitored_paths: [] } }),
      getAllDocuments: vi.fn().mockResolvedValue({ status: "ok", data: [] }),
      startFileMonitoring: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "started" }),
      stopFileMonitoring: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "stopped" }),
      getOrgDocumentById: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      getOrgDocumentDisplayTitleById: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "Test Document" }),
      getOrgDocumentPathById: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "/test/path/document.org" }),
      saveUserSettings: vi.fn().mockResolvedValue({ status: "ok", data: null }),
      addMonitoredPath: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: { monitored_paths: [] } }),
      removeMonitoredPath: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: { monitored_paths: [] } }),
      updateMonitoredPath: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: { monitored_paths: [] } }),
      setPathParseEnabled: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: { monitored_paths: [] } }),
      clearUserSettings: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      checkPathMonitoringStatus: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: false }),
      getTodoKeywords: vi.fn().mockResolvedValue({ status: "ok", data: [] }),
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
    // Note: getAllDocuments will be set per test

    // Ensure these commands always return proper mock structure
    vi.mocked(commands.getOrgDocumentDisplayTitleById).mockResolvedValue({
      status: "ok",
      data: "Test Document",
    });
    vi.mocked(commands.getOrgDocumentPathById).mockResolvedValue({
      status: "ok",
      data: "/test/path/document.org",
    });
  });

  it("shows loading state initially", () => {
    // Setup default document loading for this test
    vi.mocked(commands.getAllDocuments).mockResolvedValue({
      status: "ok",
      data: [mockDocument],
    });

    render(HomeView);

    // Should show loading spinner
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("displays document data after loading", async () => {
    // Setup default document loading for this test
    vi.mocked(commands.getAllDocuments).mockResolvedValue({
      status: "ok",
      data: [mockDocument],
    });

    render(HomeView);

    // Wait for the document to load - check for actual rendered content using getAllByText for multiple matches
    await waitFor(() => {
      expect(
        screen.getAllByText(
          (content, node) => node?.textContent?.includes("Task List") ?? false,
        ).length,
      ).toBeGreaterThan(0);
    });

    // Document metadata should be visible - check for actual rendered statistics
    await waitFor(() => {
      expect(screen.getByText("1 document")).toBeInTheDocument();
      expect(screen.getByText("1 headlines")).toBeInTheDocument();
    });

    // Task list section should be visible
    await waitFor(() => {
      expect(
        screen.getAllByText(
          (content, node) => node?.textContent?.includes("Task List") ?? false,
        ).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(
          (content, node) =>
            node?.textContent?.includes("Keyboard Shortcuts") ?? false,
        ).length,
      ).toBeGreaterThan(0);
    });
  });

  it("handles errors correctly", async () => {
    // Setup mock to throw an error on getAllDocuments
    vi.mocked(commands.getAllDocuments).mockRejectedValue(
      new Error("Test error"),
    );

    render(HomeView);

    // Wait for the error to be displayed using getAllByText for multiple matches
    await waitFor(() => {
      expect(
        screen.getAllByText(
          (content, node) =>
            node?.textContent?.includes("Error: Test error") ?? false,
        ).length,
      ).toBeGreaterThan(0);
    });
  });

  it("shows empty state when no monitored paths are set", async () => {
    // Setup mock to return empty monitored paths
    vi.mocked(commands.loadUserSettings).mockResolvedValue({
      status: "ok",
      data: emptySettings,
    });
    // This test doesn't need document loading since no monitored paths
    vi.mocked(commands.getAllDocuments).mockResolvedValue({
      status: "ok",
      data: [],
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
    // Setup mock to return empty documents BEFORE render
    vi.mocked(commands.getAllDocuments).mockResolvedValue({
      status: "ok",
      data: [],
    });

    render(HomeView);

    // Wait for the empty state to be displayed - check for actual component text
    // Note: The store has retry logic with exponential backoff (1s + 2s + 4s + 8s = ~15s)
    // so we need a longer timeout to account for this
    await waitFor(
      () => {
        expect(
          screen.getByText(
            (content, node) =>
              node?.textContent?.includes("No documents found") ?? false,
          ),
        ).toBeInTheDocument();
      },
      { timeout: 20000 },
    );
  }, 25000);
});
