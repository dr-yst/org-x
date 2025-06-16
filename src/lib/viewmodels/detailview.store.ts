import { writable, derived } from "svelte/store";
import type { OrgHeadline, OrgTimestamp } from "$lib/bindings";

// Core state stores
export const currentHeadline = writable<OrgHeadline | null>(null);
export const parentChain = writable<OrgHeadline[]>([]);
export const selectedChild = writable<OrgHeadline | null>(null);
export const showDetailView = writable(false);
export const onBreadcrumbClick = writable<((index: number) => void) | null>(
  null,
);

// Derived state for formatted content
export const formattedPlanning = derived(currentHeadline, ($headline) => {
  if (!$headline?.title?.planning) return null;

  const planning = $headline.title.planning;
  const result: { [key: string]: string } = {};

  if (planning.scheduled) {
    result.scheduled = formatTimestamp(planning.scheduled);
  }
  if (planning.deadline) {
    result.deadline = formatTimestamp(planning.deadline);
  }
  if (planning.closed) {
    result.closed = formatTimestamp(planning.closed);
  }

  return Object.keys(result).length > 0 ? result : null;
});

export const formattedContent = derived(currentHeadline, ($headline) => {
  if (!$headline?.content) return "";
  return formatContent($headline.content);
});

export const cleanedTitle = derived(currentHeadline, ($headline) => {
  if (!$headline?.title?.raw) return "";
  return cleanTitle($headline.title.raw);
});

export const priorityColorClass = derived(currentHeadline, ($headline) => {
  return getPriorityColorClass($headline?.title?.priority || null);
});

export const todoBadgeClass = derived(currentHeadline, ($headline) => {
  return getTodoBadgeClass($headline?.title?.todo_keyword || null);
});

export const hasChildren = derived(currentHeadline, ($headline) => {
  return Boolean($headline?.children && $headline.children.length > 0);
});

export const hasProperties = derived(currentHeadline, ($headline) => {
  return Boolean(
    $headline?.title?.properties &&
      Object.keys($headline.title.properties).length > 0,
  );
});

export const hasContent = derived(currentHeadline, ($headline) => {
  return Boolean($headline?.content && $headline.content.trim().length > 0);
});

// Helper functions for formatting (moved from component)
function formatTimestamp(timestamp: OrgTimestamp | null): string {
  if (!timestamp) return "";

  let dateStr = "";

  if ("Active" in timestamp) {
    dateStr = formatDateFromOrgDatetime(timestamp.Active.start);
    return `<${dateStr}${timestamp.Active.repeater ? " " + timestamp.Active.repeater : ""}${timestamp.Active.delay ? " " + timestamp.Active.delay : ""}>`;
  } else if ("Inactive" in timestamp) {
    dateStr = formatDateFromOrgDatetime(timestamp.Inactive.start);
    return `[${dateStr}${timestamp.Inactive.repeater ? " " + timestamp.Inactive.repeater : ""}${timestamp.Inactive.delay ? " " + timestamp.Inactive.delay : ""}]`;
  } else if ("ActiveRange" in timestamp) {
    const startStr = formatDateFromOrgDatetime(timestamp.ActiveRange.start);
    const endStr = formatDateFromOrgDatetime(timestamp.ActiveRange.end);
    return `<${startStr}--${endStr}${timestamp.ActiveRange.repeater ? " " + timestamp.ActiveRange.repeater : ""}${timestamp.ActiveRange.delay ? " " + timestamp.ActiveRange.delay : ""}>`;
  } else if ("InactiveRange" in timestamp) {
    const startStr = formatDateFromOrgDatetime(timestamp.InactiveRange.start);
    const endStr = formatDateFromOrgDatetime(timestamp.InactiveRange.end);
    return `[${startStr}--${endStr}${timestamp.InactiveRange.repeater ? " " + timestamp.InactiveRange.repeater : ""}${timestamp.InactiveRange.delay ? " " + timestamp.InactiveRange.delay : ""}]`;
  } else if ("Diary" in timestamp) {
    return `<%${timestamp.Diary.value}>`;
  }

  return "";
}

function formatDateFromOrgDatetime(datetime: any): string {
  if (!datetime) return "";
  const { year, month, day, hour, minute } = datetime;

  let dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  if (hour !== null && minute !== null) {
    dateStr += ` ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }

  return dateStr;
}

function formatContent(content: string): string {
  if (!content) return "";
  // Replace newlines with <br> for HTML display
  return content.replace(/\n/g, "<br>");
}

function getPriorityColorClass(priority: string | null): string {
  if (!priority) return "";

  switch (priority) {
    case "A":
      return "bg-red-100 text-red-700";
    case "B":
      return "bg-orange-100 text-orange-700";
    case "C":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getTodoBadgeClass(todoKeyword: string | null): string {
  if (!todoKeyword) return "";

  const todoBadgeClasses = {
    todo: "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border-blue-200",
    done: "bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 border-green-200",
    waiting:
      "bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700 border-orange-200",
    cancelled:
      "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600 border-gray-200",
    "in-progress":
      "bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700 border-purple-200",
  };

  const normalized = todoKeyword.toLowerCase().replace("_", "-");
  return (
    todoBadgeClasses[normalized as keyof typeof todoBadgeClasses] ||
    todoBadgeClasses.todo
  );
}

function cleanTitle(title: string): string {
  // Remove org-mode formatting: stars, TODO keywords, priorities, and tags
  let cleaned = title;

  // First remove leading stars and whitespace
  cleaned = cleaned.replace(/^\*+\s+/, "");

  // Remove TODO keywords (if present)
  cleaned = cleaned.replace(
    /^(?:TODO|DONE|WAITING|CANCELLED|IN_PROGRESS|NEXT|SOMEDAY)\s+/,
    "",
  );

  // Remove priority (if present)
  cleaned = cleaned.replace(/^\[\#[ABC]\]\s+/, "");

  // Remove trailing tags (if present)
  cleaned = cleaned.replace(/\s+:.+:$/, "");

  return cleaned.trim();
}

// Action functions
export function openDetailView(
  headline: OrgHeadline,
  parentChainValue: OrgHeadline[] = [],
  breadcrumbCallback: ((index: number) => void) | null = null,
): void {
  currentHeadline.set(headline);
  parentChain.set(parentChainValue);
  selectedChild.set(null);
  onBreadcrumbClick.set(breadcrumbCallback);
  showDetailView.set(true);
}

export function closeDetailView(): void {
  showDetailView.set(false);
  currentHeadline.set(null);
  parentChain.set([]);
  selectedChild.set(null);
  onBreadcrumbClick.set(null);
}

export function selectChild(child: OrgHeadline): void {
  selectedChild.set(child);
}

export function handleBreadcrumbClick(index: number): void {
  selectedChild.set(null);

  let callback: ((index: number) => void) | null = null;
  const unsubscribe = onBreadcrumbClick.subscribe((value) => {
    callback = value;
  });
  unsubscribe();

  if (callback) {
    callback(index);
  }
}

export function handleHomeClick(): void {
  selectedChild.set(null);
  closeDetailView();
}

export function handleBackFromChild(): void {
  selectedChild.set(null);
}

export function handleChildBreadcrumbClick(index: number): void {
  let currentParentChain: OrgHeadline[] = [];
  const unsubscribeParentChain = parentChain.subscribe((value) => {
    currentParentChain = value;
  });
  unsubscribeParentChain();

  if (index === currentParentChain.length) {
    // Clicked on current headline, go back to main view
    handleBackFromChild();
  } else {
    // Clicked on parent breadcrumb, propagate up
    handleBreadcrumbClick(index);
  }
}

// Export store object for consistency with homeview.store pattern
const detailViewStore = {
  currentHeadline: { subscribe: currentHeadline.subscribe },
  parentChain: { subscribe: parentChain.subscribe },
  selectedChild: { subscribe: selectedChild.subscribe },
  showDetailView: { subscribe: showDetailView.subscribe },
  onBreadcrumbClick: { subscribe: onBreadcrumbClick.subscribe },
  formattedPlanning: { subscribe: formattedPlanning.subscribe },
  formattedContent: { subscribe: formattedContent.subscribe },
  cleanedTitle: { subscribe: cleanedTitle.subscribe },
  priorityColorClass: { subscribe: priorityColorClass.subscribe },
  todoBadgeClass: { subscribe: todoBadgeClass.subscribe },
  hasChildren: { subscribe: hasChildren.subscribe },
  hasProperties: { subscribe: hasProperties.subscribe },
  hasContent: { subscribe: hasContent.subscribe },
  openDetailView,
  closeDetailView,
  selectChild,
  handleBreadcrumbClick,
  handleHomeClick,
  handleBackFromChild,
  handleChildBreadcrumbClick,
};

export default detailViewStore;
