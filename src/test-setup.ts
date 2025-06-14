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
  },
}));
