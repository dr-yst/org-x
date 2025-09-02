import "@testing-library/jest-dom";
import { vi, beforeAll } from "vitest";

// Mock Tauri API for tests
(globalThis as any).__TAURI__ = {
  invoke: vi.fn(),
  event: {
    listen: vi.fn(),
    emit: vi.fn(),
  },
};

// Mock window.matchMedia for MediaQuery tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Global mock setup
beforeAll(() => {
  // Mock all bindings commands
  vi.doMock("$lib/bindings", () => ({
    commands: {
      startFileMonitoring: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "File monitoring started" }),
      getAllDocuments: vi.fn().mockResolvedValue({ status: "ok", data: [] }),
      getSampleOrg: vi.fn(),
      parseOrgContent: vi.fn(),
      runDatetimeTest: vi.fn(),
      stopFileMonitoring: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "File monitoring stopped" }),
      getOrgDocumentById: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      getOrgDocumentDisplayTitleById: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "Test Document Title" }),
      getOrgDocumentPathById: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "/test/path/document.org" }),
      loadUserSettings: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: { monitored_paths: [] } }),
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
      getUserTodoKeywords: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: { active: [], closed: [] } }),
      updateTodoKeywords: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      addActiveTodoKeyword: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      addClosedTodoKeyword: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      removeActiveTodoKeyword: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      removeClosedTodoKeyword: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      editActiveTodoKeyword: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      editClosedTodoKeyword: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      moveActiveTodoKeyword: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      moveClosedTodoKeyword: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      resetTodoKeywordsToDefaults: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      reloadDocumentsWithSettings: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "Documents reloaded" }),
      getCustomProperties: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: [] }),
      addCustomProperty: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      editCustomProperty: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      removeCustomProperty: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      moveCustomProperty: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      resetCustomPropertiesToDefaults: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      getExternalEditorCommand: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: "" }),
      setExternalEditorCommand: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      resetExternalEditorCommand: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      openFileInExternalEditor: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      getTableColumns: vi.fn().mockResolvedValue({
        status: "ok",
        data: [
          { id: "status", visible: true, order: 0 },
          { id: "title", visible: true, order: 1 },
          { id: "document", visible: true, order: 2 },
          { id: "tags", visible: true, order: 3 },
          { id: "date", visible: true, order: 4 },
        ],
      }),
      getAvailableTableColumns: vi.fn().mockResolvedValue({
        status: "ok",
        data: ["status", "title", "document", "tags", "date"],
      }),
      updateTableColumns: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      addTableColumn: vi.fn().mockResolvedValue({ status: "ok", data: null }),
      removeTableColumn: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      setColumnVisibility: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
      resetTableColumnsToDefaults: vi
        .fn()
        .mockResolvedValue({ status: "ok", data: null }),
    },
  }));
});

// Static mock as fallback
vi.mock("$lib/bindings", () => ({
  commands: {
    startFileMonitoring: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: "File monitoring started" }),
    getAllDocuments: vi.fn().mockResolvedValue({ status: "ok", data: [] }),
    getSampleOrg: vi.fn(),
    parseOrgContent: vi.fn(),
    runDatetimeTest: vi.fn(),
    stopFileMonitoring: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: "File monitoring stopped" }),
    getOrgDocumentById: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    getOrgDocumentDisplayTitleById: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: "Test Document Title" }),
    getOrgDocumentPathById: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: "/test/path/document.org" }),
    loadUserSettings: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: { monitored_paths: [] } }),
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
    clearUserSettings: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    checkPathMonitoringStatus: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: false }),
    getTodoKeywords: vi.fn().mockResolvedValue({ status: "ok", data: [] }),
    getUserTodoKeywords: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: { active: [], closed: [] } }),
    updateTodoKeywords: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    addActiveTodoKeyword: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    addClosedTodoKeyword: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    removeActiveTodoKeyword: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    removeClosedTodoKeyword: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    editActiveTodoKeyword: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    editClosedTodoKeyword: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    moveActiveTodoKeyword: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    moveClosedTodoKeyword: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    resetTodoKeywordsToDefaults: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    reloadDocumentsWithSettings: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: "Documents reloaded" }),
    getCustomProperties: vi.fn().mockResolvedValue({ status: "ok", data: [] }),
    addCustomProperty: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    editCustomProperty: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    removeCustomProperty: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    moveCustomProperty: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    resetCustomPropertiesToDefaults: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    getExternalEditorCommand: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: "" }),
    setExternalEditorCommand: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    resetExternalEditorCommand: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    openFileInExternalEditor: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    getTableColumns: vi.fn().mockResolvedValue({
      status: "ok",
      data: [
        { id: "status", visible: true, order: 0 },
        { id: "title", visible: true, order: 1 },
        { id: "document", visible: true, order: 2 },
        { id: "tags", visible: true, order: 3 },
        { id: "date", visible: true, order: 4 },
      ],
    }),
    getAvailableTableColumns: vi.fn().mockResolvedValue({
      status: "ok",
      data: ["status", "title", "document", "tags", "date"],
    }),
    updateTableColumns: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    addTableColumn: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    removeTableColumn: vi.fn().mockResolvedValue({ status: "ok", data: null }),
    setColumnVisibility: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
    resetTableColumnsToDefaults: vi
      .fn()
      .mockResolvedValue({ status: "ok", data: null }),
  },
}));
