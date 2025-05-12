import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ListView from '../../ListView.svelte';
import { commands } from '$lib/bindings';
import type { OrgDocument, OrgHeadline } from '$lib/bindings';

// Mock the Tauri commands
vi.mock('$lib/bindings', () => {
  return {
    commands: {
      getSampleOrg: vi.fn()
    }
  };
});

describe('ListView Component', () => {
  let mockDocument: OrgDocument;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create a mock document
    mockDocument = {
      id: 'doc-1',
      title: 'Test Document',
      content: 'Test content',
      headlines: [],
      filetags: ['test', 'doc'],
      file_path: '/path/to/test.org',
      properties: { AUTHOR: 'Test User', CREATED: '2023-01-01' },
      category: 'Test',
      etag: 'test-etag',
      todo_config: null
    };
    
    // Mock headlines
    const headline1: OrgHeadline = {
      id: 'h1',
      document_id: 'doc-1',
      title: {
        raw: '* TODO Test Headline',
        level: 1,
        priority: null,
        tags: ['task'],
        todo_keyword: 'TODO',
        properties: {},
        planning: null
      },
      content: 'Test content',
      children: [],
      etag: 'test-etag'
    };
    
    mockDocument.headlines = [headline1];
    
    // Setup the mock to return our test document
    vi.mocked(commands.getSampleOrg).mockResolvedValue(mockDocument);
  });

  it('shows loading state initially', () => {
    render(ListView);
    
    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays document data after loading', async () => {
    render(ListView);
    
    // Wait for the document to load
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
    
    // Document metadata should be visible
    expect(screen.getByText('Category: Test')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('doc')).toBeInTheDocument();
    expect(screen.getByText('/path/to/test.org')).toBeInTheDocument();
    
    // Properties should be visible
    expect(screen.getByText('AUTHOR')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('CREATED')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    
    // Task list section should be visible
    expect(screen.getByText('Task List')).toBeInTheDocument();
    expect(screen.getByText('Keyboard shortcuts:')).toBeInTheDocument();
  });

  it('handles errors correctly', async () => {
    // Setup mock to throw an error
    vi.mocked(commands.getSampleOrg).mockRejectedValue(new Error('Test error'));
    
    render(ListView);
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });
  });

  it('shows empty state when no document is loaded', async () => {
    // Setup mock to return null
    vi.mocked(commands.getSampleOrg).mockResolvedValue(null as any);
    
    render(ListView);
    
    // Wait for the empty state to be displayed
    await waitFor(() => {
      expect(screen.getByText('No document loaded.')).toBeInTheDocument();
    });
  });
});