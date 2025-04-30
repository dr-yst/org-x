import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/svelte';
import HeadlinesList from '../HeadlinesList.svelte';
import type { OrgDocument, OrgHeadline } from '../../bindings';

// Create mock component module
vi.mock('../../bindings', () => {
  return {
    commands: {
      list_headlines: vi.fn(),
      load_org_file: vi.fn(),
    },
  };
});

describe('HeadlinesList Component', () => {
  const mockDocument: OrgDocument = {
    id: 'test-doc',
    title: 'Test Document',
    content: '',
    headlines: [
      {
        id: 'headline-1',
        document_id: 'test-doc',
        level: 1,
        title: {
          raw: 'First Headline',
          priority: null,
          tags: ['tag1', 'tag2'],
          todo_keyword: 'TODO',
          properties: {}
        },
        tags: ['tag1', 'tag2'],
        todo_keyword: 'TODO',
        priority: 'A',
        content: 'Some content',
        children: [],
        properties: {
          SCHEDULED: '2023-07-15',
          DEADLINE: null
        },
        etag: '123'
      },
      {
        id: 'headline-2',
        document_id: 'test-doc',
        level: 1,
        title: {
          raw: 'Second Headline',
          priority: null,
          tags: ['tag3'],
          todo_keyword: 'DONE',
          properties: {}
        },
        tags: ['tag3'],
        todo_keyword: 'DONE',
        priority: 'B',
        content: '',
        children: [],
        properties: {
          SCHEDULED: null,
          DEADLINE: '2023-07-30'
        },
        etag: '123'
      }
    ],
    filetags: [],
    file_path: '/path/to/test.org',
    properties: {},
    category: '',
    etag: '123',
    todo_config: null
  };

  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('displays headlines when document is provided', async () => {
    const { container } = render(HeadlinesList, {
      document: mockDocument,
      loading: false
    });

    // Check that titles are displayed
    expect(screen.getByText('First Headline')).toBeTruthy();
    expect(screen.getByText('Second Headline')).toBeTruthy();

    // Use a more specific selector to get status cells
    const rows = container.querySelectorAll('.grid.grid-cols-12.border-b');
    expect(rows.length).toBe(2); // Two headlines
    
    // Check first row (First Headline with TODO status)
    const firstRow = rows[0];
    const firstRowStatusCell = firstRow.querySelectorAll('.col-span-2.p-2')[0]; // Status cell
    expect(firstRowStatusCell.textContent).toContain('TODO');
    
    // Check second row (Second Headline with DONE status)
    const secondRow = rows[1];
    const secondRowStatusCell = secondRow.querySelectorAll('.col-span-2.p-2')[0]; // Status cell
    expect(secondRowStatusCell.textContent).toContain('DONE');

    // Check that tags are displayed
    expect(screen.getByText('tag1')).toBeTruthy();
    expect(screen.getByText('tag2')).toBeTruthy();
    expect(screen.getByText('tag3')).toBeTruthy();
  });

  it('displays loading state', async () => {
    render(HeadlinesList, {
      loading: true
    });

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('displays empty message when no document is provided', async () => {
    render(HeadlinesList, {
      document: null,
      loading: false
    });

    expect(screen.getByText('No headlines found')).toBeTruthy();
  });
});