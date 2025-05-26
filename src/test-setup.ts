import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri API for tests
globalThis.__TAURI__ = {
  invoke: vi.fn(),
  event: {
    listen: vi.fn(),
    emit: vi.fn(),
  },
};

// Mock commands
vi.mock('$lib/bindings', () => ({
  commands: {
    startFileMonitoring: vi.fn(),
    getAllDocuments: vi.fn(),
    getSampleOrg: vi.fn(),
    parseOrgContent: vi.fn(),
    runDatetimeTest: vi.fn(),
    stopFileMonitoring: vi.fn(),
  }
}));