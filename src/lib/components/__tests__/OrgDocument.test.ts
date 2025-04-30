import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import OrgDocument from '../OrgDocument.svelte';
import type { OrgDocument as OrgDocumentType } from '../../bindings';

// Mock the Tauri commands
vi.mock('../../bindings', () => ({
  commands: {
    getSampleOrg: vi.fn().mockResolvedValue({
      id: 'test-doc-1',
      title: 'Test Document',
      content: 'Test content',
      headlines: [],
      filetags: [],
      file_path: '/path/to/test.org',
      properties: {},
      category: 'Test',
      etag: '123',
      todo_config: null
    })
  }
}));

// Mock the OrgHeadline component to avoid rendering actual component
vi.mock('../OrgHeadline.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$render: () => '<div data-testid="mocked-headline"></div>'
  }))
}));

describe('OrgDocument Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('displays document title when loaded', async () => {
    const mockDocument: OrgDocumentType = {
      id: 'test-doc-2',
      title: 'My Test Document',
      content: 'Test content',
      headlines: [],
      filetags: [],
      file_path: '/path/to/test.org',
      properties: {},
      category: '',
      etag: '123',
      todo_config: null
    };

    const { container } = render(OrgDocument, {
      props: { document: mockDocument, loading: false }
    });

    expect(container.textContent).toContain('My Test Document');
  });

  it('displays error message when there is an error', () => {
    const { container } = render(OrgDocument, {
      props: { error: 'Failed to load document', loading: false }
    });

    expect(container.textContent).toContain('Error: Failed to load document');
  });
});