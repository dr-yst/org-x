import { render, screen, fireEvent } from "@testing-library/svelte";
import { expect, test, describe, vi } from "vitest";
import DetailView from "../../DetailView.svelte";
import type { OrgHeadline } from "$lib/bindings";

// Mock headline data
const mockHeadline: OrgHeadline = {
  id: "test-headline-1",
  document_id: "test-doc-1",
  level: 1,
  title: {
    raw: "* TODO Test Task",
    todo_keyword: "TODO",
    priority: "A",
    tags: ["urgent", "project"],
    planning: {
      scheduled: {
        Active: {
          start: {
            year: 2025,
            month: 1,
            day: 15,
            hour: 10,
            minute: 0,
            dayname: null,
          },
          repeater: null,
          delay: null,
        },
      },
      deadline: null,
      closed: null,
    },
    properties: {
      EFFORT: "2h",
      CATEGORY: "work",
    },
  },
  content: "This is the content of the test task.\nWith multiple lines.",
  children: [
    {
      id: "child-1",
      document_id: "test-doc-1",
      level: 2,
      title: {
        raw: "** Child Task",
        todo_keyword: null,
        priority: null,
        tags: [],
        planning: null,
        properties: {},
      },
      content: "Child content",
      children: [],
    },
  ],
};

const mockParentChain: OrgHeadline[] = [
  {
    id: "parent-1",
    document_id: "test-doc-1",
    level: 0,
    title: {
      raw: "* Parent Task",
      todo_keyword: null,
      priority: null,
      tags: [],
      planning: null,
      properties: {},
    },
    content: "",
    children: [],
  },
];

describe("DetailView Stateless Architecture", () => {
  test("should render empty state when no headline provided", () => {
    render(DetailView, {
      props: {
        headline: null,
        parentChain: [],
        selectedChild: null,
        onHeadlineSelected: null,
        onBreadcrumbClick: null,
        onHomeClick: null,
      },
    });

    expect(
      screen.getByText("Select a task/headline to view details"),
    ).toBeInTheDocument();
  });

  test("should render headline details when headline provided", () => {
    render(DetailView, {
      props: {
        headline: mockHeadline,
        parentChain: [],
        selectedChild: null,
        onHeadlineSelected: null,
        onBreadcrumbClick: null,
        onHomeClick: null,
      },
    });

    // Check headline title is displayed
    expect(screen.getByText("Test Task")).toBeInTheDocument();

    // Check TODO badge is displayed
    expect(screen.getByText("TODO")).toBeInTheDocument();

    // Check priority is displayed
    expect(screen.getByText("[#A]")).toBeInTheDocument();

    // Check tags are displayed
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.getByText("project")).toBeInTheDocument();

    // Check content is displayed
    expect(
      screen.getByText(/This is the content of the test task/),
    ).toBeInTheDocument();

    // Check child headlines section is displayed
    expect(
      screen.getByText("Subtasks / Child Headlines (1)"),
    ).toBeInTheDocument();
  });

  test("should show breadcrumb navigation with parent chain", () => {
    render(DetailView, {
      props: {
        headline: mockHeadline,
        parentChain: mockParentChain,
        selectedChild: null,
        onHeadlineSelected: null,
        onBreadcrumbClick: null,
        onHomeClick: null,
      },
    });

    // Check Home breadcrumb is present
    expect(screen.getByText("Home")).toBeInTheDocument();

    // Check parent breadcrumb is present
    expect(screen.getByText("Parent Task")).toBeInTheDocument();

    // Check current headline breadcrumb is present
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  test("should call onHomeClick when Home breadcrumb is clicked", () => {
    const onHomeClick = vi.fn();

    render(DetailView, {
      props: {
        headline: mockHeadline,
        parentChain: [],
        selectedChild: null,
        onHeadlineSelected: null,
        onBreadcrumbClick: null,
        onHomeClick,
      },
    });

    const homeLink = screen.getByText("Home");
    fireEvent.click(homeLink);

    expect(onHomeClick).toHaveBeenCalledOnce();
  });

  test("should call onBreadcrumbClick when parent breadcrumb is clicked", () => {
    const onBreadcrumbClick = vi.fn();

    render(DetailView, {
      props: {
        headline: mockHeadline,
        parentChain: mockParentChain,
        selectedChild: null,
        onHeadlineSelected: null,
        onBreadcrumbClick,
        onHomeClick: null,
      },
    });

    const parentLink = screen.getByText("Parent Task");
    fireEvent.click(parentLink);

    expect(onBreadcrumbClick).toHaveBeenCalledWith(0);
  });

  test("should call onHeadlineSelected when child headline is selected", () => {
    const onHeadlineSelected = vi.fn();

    render(DetailView, {
      props: {
        headline: mockHeadline,
        parentChain: [],
        selectedChild: null,
        onHeadlineSelected,
        onBreadcrumbClick: null,
        onHomeClick: null,
      },
    });

    // Find and click on child headline
    const childHeadline = screen.getByText("Child Task");
    fireEvent.click(childHeadline);

    expect(onHeadlineSelected).toHaveBeenCalledWith(mockHeadline.children[0]);
  });

  test("should render recursive DetailView when selectedChild is provided", () => {
    const selectedChild = mockHeadline.children[0];

    render(DetailView, {
      props: {
        headline: mockHeadline,
        parentChain: mockParentChain,
        selectedChild,
        onHeadlineSelected: null,
        onBreadcrumbClick: null,
        onHomeClick: null,
      },
    });

    // Should show the child headline title
    expect(screen.getByText("Child Task")).toBeInTheDocument();

    // Should show the child content
    expect(screen.getByText("Child content")).toBeInTheDocument();

    // Should show extended breadcrumb with parent chain
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Parent Task")).toBeInTheDocument();
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  test("should display properties when present", () => {
    render(DetailView, {
      props: {
        headline: mockHeadline,
        parentChain: [],
        selectedChild: null,
        onHeadlineSelected: null,
        onBreadcrumbClick: null,
        onHomeClick: null,
      },
    });

    // Check properties are displayed
    expect(screen.getByText("EFFORT:")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
    expect(screen.getByText("CATEGORY:")).toBeInTheDocument();
    expect(screen.getByText("work")).toBeInTheDocument();
  });

  test("should display planning information when present", () => {
    render(DetailView, {
      props: {
        headline: mockHeadline,
        parentChain: [],
        selectedChild: null,
        onHeadlineSelected: null,
        onBreadcrumbClick: null,
        onHomeClick: null,
      },
    });

    // Check planning section is displayed
    expect(screen.getByText("Planning")).toBeInTheDocument();
    expect(screen.getByText("SCHEDULED:")).toBeInTheDocument();
    expect(screen.getByText("<2025-01-15 10:00>")).toBeInTheDocument();
  });
});
