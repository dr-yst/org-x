import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HeadlinesList from '../../HeadlinesList.svelte';
import type { OrgHeadline, OrgTimestamp, OrgTitle, OrgPlanning, OrgDatetime } from '$lib/bindings';

// Helper to create test OrgDatetime
function createDatetime(year: number, month: number, day: number, hour: number | null = null, minute: number | null = null): OrgDatetime {
  return {
    year,
    month,
    day,
    dayname: 'Mon', // Not important for tests
    hour,
    minute
  };
}

// Helper to create test deadline timestamp
function createDeadlineTimestamp(year: number, month: number, day: number): OrgTimestamp {
  return {
    Active: {
      start: createDatetime(year, month, day),
      repeater: null,
      delay: null
    }
  };
}

// Helper to create test headline
function createHeadline(
  id: string,
  todoKeyword: string | null,
  title: string,
  content: string = '',
  tags: string[] = [],
  priority: string | null = null,
  deadline: OrgTimestamp | null = null
): OrgHeadline {
  const planning: OrgPlanning | null = deadline ? {
    deadline,
    scheduled: null,
    closed: null
  } : null;

  const orgTitle: OrgTitle = {
    raw: `* ${todoKeyword ? todoKeyword + ' ' : ''}${priority ? '[#' + priority + '] ' : ''}${title}`,
    level: 1,
    priority,
    tags,
    todo_keyword: todoKeyword,
    properties: {},
    planning
  };

  return {
    id,
    document_id: 'test-doc',
    title: orgTitle,
    content,
    children: [],
    etag: 'test-etag'
  };
}

describe('HeadlinesList Component', () => {
  let testHeadlines: OrgHeadline[];
  
  beforeEach(() => {
    // Create test data - mixing deadlines, priorities, tags and todo states
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 6);
    
    testHeadlines = [
      createHeadline('1', 'TODO', 'Overdue task', 'This task is overdue', ['work'], 'A', 
        createDeadlineTimestamp(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate())),
      createHeadline('2', 'TODO', 'Today\'s task', 'This task is due today', ['personal'], 'B',
        createDeadlineTimestamp(today.getFullYear(), today.getMonth() + 1, today.getDate())),
      createHeadline('3', 'WAITING', 'Future task', 'This task is due next week', ['work', 'project'], null,
        createDeadlineTimestamp(nextWeek.getFullYear(), nextWeek.getMonth() + 1, nextWeek.getDate())),
      createHeadline('4', 'DONE', 'Completed task', 'This task is already done', [], 'C', null),
      createHeadline('5', null, 'Not a task', 'This is just a note, not a task', ['note'], null, null)
    ];
  });

  it('renders correctly with headlines', () => {
    render(HeadlinesList, { headlines: testHeadlines });
    
    // Should show all non-DONE headlines by default
    expect(screen.getByText('Overdue task')).toBeInTheDocument();
    expect(screen.getByText('Today\'s task')).toBeInTheDocument();
    expect(screen.getByText('Future task')).toBeInTheDocument();
    expect(screen.getByText('Not a task')).toBeInTheDocument();
    
    // Table headers should be present
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(HeadlinesList, { headlines: [], loading: true });
    
    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows empty state correctly', () => {
    render(HeadlinesList, { headlines: [] });
    
    // Should show empty message
    expect(screen.getByText('No headlines found.')).toBeInTheDocument();
  });

  it('filters by today correctly', async () => {
    render(HeadlinesList, { headlines: testHeadlines });
    
    // Click "Today" filter button
    await fireEvent.click(screen.getByText('Today'));
    
    // Should only show today's task
    expect(screen.getByText('Today\'s task')).toBeInTheDocument();
    expect(screen.queryByText('Overdue task')).not.toBeInTheDocument();
    expect(screen.queryByText('Future task')).not.toBeInTheDocument();
  });

  it('filters by overdue correctly', async () => {
    render(HeadlinesList, { headlines: testHeadlines });
    
    // Click "Overdue" filter button
    await fireEvent.click(screen.getByText('Overdue'));
    
    // Should only show overdue task
    expect(screen.getByText('Overdue task')).toBeInTheDocument();
    expect(screen.queryByText('Today\'s task')).not.toBeInTheDocument();
    expect(screen.queryByText('Future task')).not.toBeInTheDocument();
  });

  it('filters by this week correctly', async () => {
    render(HeadlinesList, { headlines: testHeadlines });
    
    // Click "This Week" filter button
    await fireEvent.click(screen.getByText('This Week'));
    
    // Should show this week's tasks (both today's and future task)
    expect(screen.queryByText('Overdue task')).not.toBeInTheDocument(); // This should be filtered out
    expect(screen.getByText('Today\'s task')).toBeInTheDocument();
    expect(screen.getByText('Future task')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(HeadlinesList, { headlines: testHeadlines });
    
    // Check tags are displayed
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('personal')).toBeInTheDocument();
    expect(screen.getByText('project')).toBeInTheDocument();
    expect(screen.getByText('note')).toBeInTheDocument();
  });

  it('displays priority indicators correctly', () => {
    render(HeadlinesList, { headlines: testHeadlines });
    
    // Check priority indicators
    expect(screen.getByText('[A]')).toBeInTheDocument();
    expect(screen.getByText('[B]')).toBeInTheDocument();
    expect(screen.getByText('[C]')).toBeInTheDocument();
  });

  it('displays deadline information correctly', () => {
    render(HeadlinesList, { headlines: testHeadlines });
    
    // Check deadline info (exact format may vary so using partial text)
    expect(screen.getByText(/DEADLINE: Today/i)).toBeInTheDocument();
    expect(document.querySelector('.text-red-600')).toBeInTheDocument(); // Overdue task has red text
    expect(document.querySelector('.text-orange-500')).toBeInTheDocument(); // Today's task has orange text
  });
});