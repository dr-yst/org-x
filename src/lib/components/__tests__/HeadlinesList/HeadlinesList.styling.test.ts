import { render } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import HeadlinesList from "../../HeadlinesList.svelte";

describe("HeadlinesList Styling Tests", () => {
  const mockHeadlines = [
    {
      id: "test-1",
      document_id: "doc-1",
      title: {
        raw: "* TODO Test Task",
        todo_keyword: "TODO",
        priority: "A",
        tags: ["urgent"],
        level: 1,
        properties: {},
        planning: null,
      },
      content: "Test content",
      level: 1,
      scheduled: null,
      deadline: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      children: [],
      etag: "test-etag",
    },
  ];

  it("should apply proper overflow constraints to table container", () => {
    const { container } = render(HeadlinesList, {
      props: {
        headlines: mockHeadlines,
        focusedIndex: -1,
      },
    });

    // Check for the overflow container wrapper
    const overflowContainer = container.querySelector(
      ".overflow-x-auto.overflow-y-auto.max-w-full.max-h-\\[80vh\\].min-w-0",
    );
    expect(overflowContainer).toBeTruthy();
  });

  it("should have proper width constraints on main container", () => {
    const { container } = render(HeadlinesList, {
      props: {
        headlines: mockHeadlines,
        focusedIndex: -1,
      },
    });

    // Check main container has proper classes
    const mainContainer = container.querySelector(".w-full.min-w-0");
    expect(mainContainer).toBeTruthy();
  });

  it("should render table within overflow container", () => {
    const { container } = render(HeadlinesList, {
      props: {
        headlines: mockHeadlines,
        focusedIndex: -1,
      },
    });

    // Check that table is inside the overflow container
    const overflowContainer = container.querySelector(
      ".overflow-x-auto.overflow-y-auto",
    );
    const table = overflowContainer?.querySelector("table");
    expect(table).toBeTruthy();
  });

  it("should maintain table structure with proper column headers", () => {
    const { container } = render(HeadlinesList, {
      props: {
        headlines: mockHeadlines,
        focusedIndex: -1,
      },
    });

    const tableHeaders = container.querySelectorAll("th");
    expect(tableHeaders).toHaveLength(5); // Status, Task, Document, Tags, Date
  });
});
