import { render, screen } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import DetailView from "../../DetailView.svelte";
import type {
  OrgHeadline,
  OrgTimestamp,
  OrgTitle,
  OrgPlanning,
  OrgDatetime,
} from "$lib/bindings";

// Helper to create test OrgDatetime
function createDatetime(
  year: number,
  month: number,
  day: number,
  hour: number | null = null,
  minute: number | null = null,
): OrgDatetime {
  return {
    year,
    month,
    day,
    dayname: "Mon", // Not important for tests
    hour,
    minute,
  };
}

// Helper to create test timestamps
function createDeadlineTimestamp(): OrgTimestamp {
  return {
    Active: {
      start: createDatetime(2023, 12, 25, 10, 0),
      repeater: null,
      delay: null,
    },
  };
}

function createScheduledTimestamp(): OrgTimestamp {
  return {
    Inactive: {
      start: createDatetime(2023, 12, 20, 9, 0),
      repeater: null,
      delay: null,
    },
  };
}

// Helper to create test headline
function createTestHeadline(): OrgHeadline {
  const planning: OrgPlanning = {
    deadline: createDeadlineTimestamp(),
    scheduled: createScheduledTimestamp(),
    closed: null,
  };

  const orgTitle: OrgTitle = {
    raw: "* TODO [#A] Test Headline",
    level: 1,
    priority: "A",
    tags: ["test", "important"],
    todo_keyword: "TODO",
    properties: {
      CATEGORY: "Test",
      CUSTOM: "Value",
    },
    planning,
  };

  return {
    id: "test-headline",
    document_id: "test-doc",
    title: orgTitle,
    content: "This is test content.\nWith multiple lines.",
    children: [
      {
        id: "child-1",
        document_id: "test-doc",
        title: {
          raw: "** WAITING Subtask",
          level: 2,
          priority: null,
          tags: ["subtask"],
          todo_keyword: "WAITING",
          properties: {},
          planning: null,
        },
        content: "",
        children: [],
        etag: "child-etag",
      },
    ],
    etag: "test-etag",
  };
}

describe("DetailView Component", () => {
  it("renders correctly with a headline", () => {
    const headline = createTestHeadline();
    render(DetailView, { headline });

    // Title should be present in both breadcrumb and main content area
    const titleElements = screen.getAllByText("Test Headline");
    expect(titleElements).toHaveLength(2); // One in breadcrumb, one in main content

    // TODO status should be present
    expect(screen.getByText("TODO")).toBeInTheDocument();

    // Priority should be present
    expect(screen.getByText("[#A]")).toBeInTheDocument();

    // Tags should be present
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("important")).toBeInTheDocument();

    // Planning information should be present
    expect(screen.getByText("SCHEDULED:")).toBeInTheDocument();
    expect(screen.getByText("DEADLINE:")).toBeInTheDocument();

    // Properties should be present
    expect(screen.getByText("CATEGORY:")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("CUSTOM:")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();

    // Content should be present (checking for actual content text, not a "Content" header)
    expect(screen.getByText(/This is test content/)).toBeInTheDocument();

    // Subtasks should be present
    expect(
      screen.getByText("Subtasks / Child Headlines (1)"),
    ).toBeInTheDocument();
    expect(screen.getByText("WAITING")).toBeInTheDocument();
    expect(screen.getByText("Subtask")).toBeInTheDocument();
  });

  it("renders empty state when no headline is provided", () => {
    render(DetailView, { headline: null });

    // Should show empty state message
    expect(
      screen.getByText("Select a task/headline to view details"),
    ).toBeInTheDocument();
  });

  it("handles headlines without planning information", () => {
    const headline = createTestHeadline();
    headline.title.planning = null;

    render(DetailView, { headline });

    // Title should still be present in both breadcrumb and main content
    const titleElements = screen.getAllByText("Test Headline");
    expect(titleElements).toHaveLength(2);

    // Planning section should not be present
    expect(screen.queryByText("SCHEDULED:")).not.toBeInTheDocument();
    expect(screen.queryByText("DEADLINE:")).not.toBeInTheDocument();
  });

  it("handles headlines without properties", () => {
    const headline = createTestHeadline();
    headline.title.properties = {};

    render(DetailView, { headline });

    // Title should still be present in both breadcrumb and main content
    const titleElements = screen.getAllByText("Test Headline");
    expect(titleElements).toHaveLength(2);

    // Properties section should not be present
    expect(screen.queryByText("CATEGORY:")).not.toBeInTheDocument();
  });

  it("handles headlines without content", () => {
    const headline = createTestHeadline();
    headline.content = "";

    render(DetailView, { headline });

    // Title should still be present in both breadcrumb and main content
    const titleElements = screen.getAllByText("Test Headline");
    expect(titleElements).toHaveLength(2);

    // Content should not be present when content is empty
    expect(screen.queryByText(/This is test content/)).not.toBeInTheDocument();
  });

  it("handles headlines without children", () => {
    const headline = createTestHeadline();
    headline.children = [];

    render(DetailView, { headline });

    // Title should still be present in both breadcrumb and main content
    const titleElements = screen.getAllByText("Test Headline");
    expect(titleElements).toHaveLength(2);

    // Subtasks section should not be present
    expect(
      screen.queryByText("Subtasks / Child Headlines"),
    ).not.toBeInTheDocument();
  });
});
