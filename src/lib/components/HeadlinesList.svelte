<script lang="ts">
    import { commands } from "../bindings";
    import type { OrgDocument, OrgHeadline } from "../bindings";

    // runesスタイルのprops定義
    const { document = null, loading: initialLoading = false } = $props<{
        document?: OrgDocument | null;
        loading?: boolean;
    }>();

    // State for expanded/collapsed items
    let expandedItems = $state(new Set<string>());
    let loadingState = $state(initialLoading);

    // Flattened headlines for table display
    type FlattenedItem = {
        id: string;
        title: string;
        level: number;
        path: string[];
        todoKeyword: string | null;
        tags: string[];
        priority: string | null;
        hasContent: boolean;
        hasChildren: boolean;
        indentLevel: number;
        scheduledDate: string | null;
        deadlineDate: string | null;
    };

    let flattenedItems = $state<FlattenedItem[]>([]);

    // Filter state
    let tagFilter = $state("");
    let todoFilter = $state("");
    let dateFilter = $state("");

    // Update flattened items when document changes
    $effect(() => {
        if (document) {
            flattenedItems = flattenHeadlines(document.headlines);
        }
    });

    // Flatten nested headlines into a flat array for rendering
    function flattenHeadlines(
        headlines: OrgHeadline[] = [],
        parentPath: string[] = [],
        indentLevel: number = 0,
    ): FlattenedItem[] {
        let result: FlattenedItem[] = [];

        for (const headline of headlines) {
            // Clone path array to avoid modifying parent path
            const currentPath = [...parentPath];

            // Extract date properties from the headline
            const scheduledDate = headline.properties?.SCHEDULED || null;
            const deadlineDate = headline.properties?.DEADLINE || null;

            // Create the list item
            const item: FlattenedItem = {
                id: headline.id,
                title: headline.title.raw, // Handle both string and object formats
                level: headline.level,
                path: currentPath,
                todoKeyword: headline.todo_keyword,
                tags: headline.tags,
                priority: headline.priority,
                hasContent: headline.content.length > 0,
                hasChildren: headline.children.length > 0,
                indentLevel,
                scheduledDate,
                deadlineDate,
            };

            result.push(item);

            // Add this headline to the path for its children
            const titleRaw =
                typeof headline.title === "object" && headline.title.raw
                    ? headline.title.raw
                    : String(headline.title);
            currentPath.push(titleRaw);

            // Process children recursively if expanded
            if (
                headline.children.length > 0 &&
                expandedItems.has(headline.id)
            ) {
                const children = flattenHeadlines(
                    headline.children,
                    currentPath,
                    indentLevel + 1,
                );
                result = [...result, ...children];
            }
        }

        return result;
    }

    // Format date string into more readable format
    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "";

        try {
            const date = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

            // Format for today, tomorrow, or within a week
            if (date.toDateString() === today.toDateString()) {
                return "Today";
            } else if (date.toDateString() === tomorrow.toDateString()) {
                return "Tomorrow";
            } else {
                // Format as Mmm dd or Mmm dd, yyyy
                const options: Intl.DateTimeFormatOptions = {
                    month: "short",
                    day: "numeric",
                };

                // Add year if it's not current year
                if (date.getFullYear() !== today.getFullYear()) {
                    options.year = "numeric";
                }

                return date.toLocaleDateString("en-US", options);
            }
        } catch (e) {
            return dateStr; // Fallback to raw string
        }
    }

    // Check if date is within a specific range
    function isDateInRange(dateStr: string | null, rangeType: string): boolean {
        if (!dateStr) return false;

        try {
            const date = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Calculate end of current week (Sunday)
            const endOfWeek = new Date(today);
            const dayOfWeek = today.getDay();
            const daysUntilEndOfWeek = 6 - dayOfWeek; // 0 is Sunday, 6 is Saturday
            endOfWeek.setDate(today.getDate() + daysUntilEndOfWeek);

            if (rangeType === "today") {
                return date.toDateString() === today.toDateString();
            } else if (rangeType === "week") {
                return date >= today && date <= endOfWeek;
            } else if (rangeType === "overdue") {
                return date < today;
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    // Toggle expanded state for an item
    function toggleExpand(id: string): void {
        if (expandedItems.has(id)) {
            expandedItems.delete(id);
        } else {
            expandedItems.add(id);
        }
        // Force recomputation of flattened items
        flattenedItems = flattenHeadlines(document?.headlines || []);
    }

    // Filter the flattened list
    let filteredItems = $derived(
        flattenedItems.filter((item) => {
            // Tag filter
            if (
                tagFilter &&
                !item.tags.some((tag) =>
                    tag.toLowerCase().includes(tagFilter.toLowerCase()),
                )
            ) {
                return false;
            }

            // TODO state filter
            if (todoFilter) {
                if (todoFilter === "task" && !item.todoKeyword) {
                    return false;
                }
                if (todoFilter === "note" && item.todoKeyword) {
                    return false;
                }
                if (
                    todoFilter !== "task" &&
                    todoFilter !== "note" &&
                    item.todoKeyword?.toLowerCase() !== todoFilter.toLowerCase()
                ) {
                    return false;
                }
            }

            // Date filter
            if (dateFilter) {
                if (
                    dateFilter === "today" &&
                    !isDateInRange(item.scheduledDate, "today") &&
                    !isDateInRange(item.deadlineDate, "today")
                ) {
                    return false;
                }
                if (
                    dateFilter === "week" &&
                    !isDateInRange(item.scheduledDate, "week") &&
                    !isDateInRange(item.deadlineDate, "week")
                ) {
                    return false;
                }
                if (
                    dateFilter === "overdue" &&
                    !isDateInRange(item.deadlineDate, "overdue")
                ) {
                    return false;
                }
            }

            return true;
        }),
    );
</script>

<div class="w-full">
    <div class="flex gap-4 mb-4">
        <input
            type="text"
            placeholder="Filter by tag..."
            bind:value={tagFilter}
            class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />

        <select
            bind:value={todoFilter}
            class="px-2 py-1 border border-gray-300 rounded text-sm"
        >
            <option value="">All items</option>
            <option value="task">Tasks only</option>
            <option value="note">Notes only</option>
            <option value="TODO">TODO</option>
            <option value="DONE">DONE</option>
        </select>

        <select
            bind:value={dateFilter}
            class="px-2 py-1 border border-gray-300 rounded text-sm"
        >
            <option value="">All dates</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="overdue">Overdue</option>
        </select>
    </div>

    {#if loadingState}
        <div class="py-8 text-center text-gray-500 italic">Loading...</div>
    {:else if document && flattenedItems.length > 0}
        <div class="border border-gray-200 rounded overflow-hidden">
            <!-- Table Header -->
            <div
                class="grid grid-cols-12 bg-gray-100 font-medium border-b-2 border-gray-200"
            >
                <div class="col-span-4 p-2">Title</div>
                <div class="col-span-2 p-2">Status</div>
                <div class="col-span-2 p-2">Date</div>
                <div class="col-span-3 p-2">Tags</div>
                <div class="col-span-1 p-2">Priority</div>
            </div>

            <!-- Table Rows -->
            {#each filteredItems as item (item.id)}
                <div
                    class="grid grid-cols-12 border-b border-gray-100 hover:bg-gray-50"
                >
                    <div
                        class="col-span-4 p-2 flex items-center overflow-hidden text-ellipsis whitespace-nowrap"
                        style="padding-left: {item.indentLevel * 20 + 8}px;"
                    >
                        <!-- Expand/collapse button if has children -->
                        {#if item.hasChildren}
                            <button
                                class="w-5 h-5 mr-2 border border-gray-300 rounded flex items-center justify-center cursor-pointer text-xs hover:bg-gray-100"
                                onclick={() => toggleExpand(item.id)}
                                aria-label="Toggle expand"
                            >
                                {expandedItems.has(item.id) ? "▼" : "►"}
                            </button>
                        {:else}
                            <span class="w-5 mr-2"></span>
                        {/if}

                        <!-- Title with proper indentation -->
                        <span class="truncate" title={item.title}>
                            {item.title}
                        </span>
                    </div>

                    <div class="col-span-2 p-2">
                        {#if item.todoKeyword}
                            <span
                                class="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-red-500 text-white"
                            >
                                {item.todoKeyword}
                            </span>
                        {:else}
                            <span class="text-xs text-gray-500 italic"
                                >Note</span
                            >
                        {/if}
                    </div>

                    <!-- Date column -->
                    <div class="col-span-2 p-2 flex flex-col gap-1">
                        {#if item.scheduledDate}
                            <div class="flex items-center">
                                <span
                                    class="text-xs text-blue-600 font-medium mr-1"
                                    >SC:</span
                                >
                                <span class="text-xs"
                                    >{formatDate(item.scheduledDate)}</span
                                >
                            </div>
                        {/if}

                        {#if item.deadlineDate}
                            <div class="flex items-center">
                                <span
                                    class="text-xs text-red-600 font-medium mr-1"
                                    >DL:</span
                                >
                                <span class="text-xs"
                                    >{formatDate(item.deadlineDate)}</span
                                >
                            </div>
                        {/if}
                    </div>

                    <div class="col-span-3 p-2 flex flex-wrap gap-1">
                        {#each item.tags as tag}
                            <span
                                class="inline-block px-1.5 py-0.5 rounded text-xs bg-blue-600 text-white"
                            >
                                {tag}
                            </span>
                        {/each}
                    </div>

                    <div class="col-span-1 p-2">
                        {#if item.priority}
                            <span
                                class="inline-block w-5 h-5 rounded-full text-center text-xs font-bold leading-5
                       {item.priority === 'A'
                                    ? 'bg-red-500 text-white'
                                    : item.priority === 'B'
                                      ? 'bg-yellow-500 text-black'
                                      : 'bg-green-500 text-white'}"
                            >
                                {item.priority}
                            </span>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="py-8 text-center text-gray-500 italic">
            No headlines found
        </div>
    {/if}
</div>
