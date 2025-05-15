<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        Table,
        TableBody,
        TableCaption,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { Badge, badgeVariants } from "$lib/components/ui/badge";
    import { cn } from "$lib/utils";

    // Define custom badge classes for TODO status
    const todoBadgeClasses = {
        todo: "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border-blue-200",
        done: "bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 border-green-200",
        waiting:
            "bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700 border-orange-200",
        cancelled:
            "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600 border-gray-200",
    };

    import type { OrgHeadline, OrgTimestamp, OrgDocument } from "$lib/bindings";

    // Props definition using Svelte 5 runes
    const {
        headlines = [],
        loading = false,
        focusedIndex = -1,
    } = $props<{
        headlines: OrgHeadline[];
        loading?: boolean;
        document?: OrgDocument | null;
        focusedIndex?: number;
    }>();

    let filteredHeadlines = $state<OrgHeadline[]>([]);

    // Event dispatcher
    const dispatch = createEventDispatcher<{
        rowClick: OrgHeadline;
        update: OrgHeadline[];
    }>();

    // State for filtering
    let activeFilter = $state("all"); // 'all', 'today', 'week', 'overdue'

    // Update filteredHeadlines whenever headlines or activeFilter changes
    $effect(() => {
        const filtered = getFilteredHeadlines(headlines, activeFilter);
        filteredHeadlines = filtered;
        dispatch("update", filtered);
    });

    // Filter headlines based on the active filter
    function getFilteredHeadlines(
        headlines: OrgHeadline[],
        filter: string,
    ): OrgHeadline[] {
        if (filter === "all") return headlines;

        return headlines.filter((headline) => {
            // Only include items with todo_keyword
            if (!headline.title.todo_keyword) return false;

            // If todo status is 'DONE', exclude from all active filters
            if (headline.title.todo_keyword === "DONE") return false;

            // Get deadline timestamp if it exists
            const deadline = headline.title.planning?.deadline;

            switch (filter) {
                case "today":
                    return isToday(getDateStringFromTimestamp(deadline));
                case "week":
                    return isThisWeek(getDateStringFromTimestamp(deadline));
                case "overdue":
                    return isOverdue(getDateStringFromTimestamp(deadline));
                default:
                    return true;
            }
        });
    }

    // Helper function to extract date string from OrgTimestamp
    function getDateStringFromTimestamp(
        timestamp: OrgTimestamp | null,
    ): string | null {
        if (!timestamp) return null;

        // Extract date from the appropriate variant
        if ("Active" in timestamp) {
            return formatDateFromOrgDatetime(timestamp.Active.start);
        } else if ("Inactive" in timestamp) {
            return formatDateFromOrgDatetime(timestamp.Inactive.start);
        } else if ("ActiveRange" in timestamp) {
            return formatDateFromOrgDatetime(timestamp.ActiveRange.start);
        } else if ("InactiveRange" in timestamp) {
            return formatDateFromOrgDatetime(timestamp.InactiveRange.start);
        }

        return null;
    }

    // Helper to format OrgDatetime to ISO string
    function formatDateFromOrgDatetime(datetime: any): string {
        if (!datetime) return "";
        const { year, month, day, hour, minute } = datetime;
        // Create ISO date string (YYYY-MM-DD)
        const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

        // Add time if present
        if (hour !== null && minute !== null) {
            return `${dateStr}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
        }

        return dateStr;
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

    // Function to check if date is today
    function isToday(dateStr: string | null): boolean {
        if (!dateStr) return false;

        try {
            const date = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            return date >= today && date < tomorrow;
        } catch (e) {
            return false;
        }
    }

    // Function to check if date is this week
    function isThisWeek(dateStr: string | null): boolean {
        if (!dateStr) return false;

        try {
            const date = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7); // End of current week

            return date >= startOfWeek && date < endOfWeek;
        } catch (e) {
            return false;
        }
    }

    // Function to check if date is overdue
    function isOverdue(dateStr: string | null): boolean {
        if (!dateStr) return false;

        try {
            const date = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return date < today;
        } catch (e) {
            return false;
        }
    }

    // Get badge class for TODO status
    function getTodoBadgeClass(todoKeyword: string | null): string {
        if (!todoKeyword) return "";

        switch (todoKeyword.toUpperCase()) {
            case "TODO":
                return todoBadgeClasses.todo;
            case "DONE":
                return todoBadgeClasses.done;
            case "WAITING":
                return todoBadgeClasses.waiting;
            case "CANCELLED":
                return todoBadgeClasses.cancelled;
            default:
                return todoBadgeClasses.todo;
        }
    }

    // Get color class based on todo_keyword (kept for other usages)
    function getTodoColorClass(todoKeyword: string | null): string {
        if (!todoKeyword) return "";

        switch (todoKeyword) {
            case "TODO":
                return "text-blue-600";
            case "DONE":
                return "text-green-600";
            case "WAITING":
                return "text-orange-500";
            case "CANCELLED":
                return "text-gray-500 line-through";
            default:
                return "text-blue-600";
        }
    }

    // Get priority indicator
    function getPriorityIndicator(priority: string | null): string {
        if (!priority) return "";

        switch (priority) {
            case "A":
                return "[A]";
            case "B":
                return "[B]";
            case "C":
                return "[C]";
            default:
                return `[${priority}]`;
        }
    }

    // Get priority color class
    function getPriorityColorClass(priority: string | null): string {
        if (!priority) return "";

        switch (priority) {
            case "A":
                return "text-red-600";
            case "B":
                return "text-orange-500";
            case "C":
                return "text-yellow-500";
            default:
                return "text-gray-500";
        }
    }

    // Format deadline or scheduled date
    function formatDateInfo(headline: OrgHeadline): string {
        const deadline = headline.title.planning?.deadline;
        const scheduled = headline.title.planning?.scheduled;

        if (deadline) {
            const dateStr = getDateStringFromTimestamp(deadline);
            return `DEADLINE: ${formatDate(dateStr)}`;
        } else if (scheduled) {
            const dateStr = getDateStringFromTimestamp(scheduled);
            return `SCHEDULED: ${formatDate(dateStr)}`;
        }

        return "";
    }

    // Get date color class
    function getDateColorClass(headline: OrgHeadline): string {
        const deadline = headline.title.planning?.deadline;

        if (!deadline) return "";

        const dateStr = getDateStringFromTimestamp(deadline);

        if (isOverdue(dateStr)) {
            return "text-red-600 font-medium";
        } else if (isToday(dateStr)) {
            return "text-orange-500 font-medium";
        } else if (isThisWeek(dateStr)) {
            return "text-blue-600";
        }

        return "";
    }
</script>

<div class="w-full">
    <div class="text-xs text-gray-500 mb-2">
        {filteredHeadlines.length} items displayed • {focusedIndex >= 0
            ? `Item ${focusedIndex + 1} selected`
            : "No selection"}
    </div>

    <!-- Filter buttons -->
    <div class="flex gap-2 mb-4">
        <Button
            variant={activeFilter === "all" ? "default" : "secondary"}
            size="sm"
            onclick={() => {
                activeFilter = "all";
            }}
        >
            All
        </Button>
        <Button
            variant={activeFilter === "today" ? "default" : "secondary"}
            class={activeFilter === "today"
                ? "bg-orange-500 hover:bg-orange-600"
                : ""}
            size="sm"
            onclick={() => {
                activeFilter = "today";
            }}
        >
            Today
        </Button>
        <Button
            variant={activeFilter === "week" ? "default" : "secondary"}
            size="sm"
            onclick={() => {
                activeFilter = "week";
            }}
        >
            This Week
        </Button>
        <Button
            variant={activeFilter === "overdue" ? "destructive" : "secondary"}
            size="sm"
            onclick={() => {
                activeFilter = "overdue";
            }}
        >
            Overdue
        </Button>
    </div>

    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"
            ></div>
        </div>
    {:else if headlines.length === 0}
        <div
            class="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200"
        >
            No headlines found.
        </div>
    {:else}
        <Table>
            <TableCaption>Task List View</TableCaption>

            <TableHeader>
                <TableRow>
                    <TableHead class="w-[100px]">Status</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead class="w-[180px]">Date</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {#each filteredHeadlines as headline}
                    <TableRow
                        class={`hover:bg-gray-50 cursor-pointer ${filteredHeadlines.indexOf(headline) === focusedIndex ? "bg-blue-50 ring-2 ring-blue-200" : ""}`}
                        onclick={() => {
                            const event = new CustomEvent("rowClick", {
                                detail: headline,
                            });
                            dispatch("rowClick", headline);
                        }}
                    >
                        <TableCell>
                            {#if headline.title.todo_keyword}
                                <Badge
                                    class={cn(
                                        getTodoBadgeClass(
                                            headline.title.todo_keyword,
                                        ),
                                        headline.title.todo_keyword ===
                                            "CANCELLED" && "line-through",
                                        "text-xs font-medium",
                                    )}
                                    variant="secondary"
                                >
                                    {headline.title.todo_keyword}
                                </Badge>
                            {/if}
                        </TableCell>

                        <TableCell>
                            <div class="flex items-start gap-1">
                                {#if headline.title.priority}
                                    <span
                                        class="inline-block mr-1 {getPriorityColorClass(
                                            headline.title.priority,
                                        )}"
                                    >
                                        {getPriorityIndicator(
                                            headline.title.priority,
                                        )}
                                    </span>
                                {/if}
                                <span class="font-medium">
                                    {headline.title.raw.replace(
                                        /^\*+\s+(?:\w+\s+)?(?:\[\#.\]\s+)?/,
                                        "",
                                    )}
                                </span>
                            </div>

                            {#if headline.content && headline.content.trim()}
                                <div
                                    class="mt-1 text-sm text-gray-600 max-w-prose line-clamp-1"
                                >
                                    {headline.content.trim().split("\n")[0]}
                                </div>
                            {/if}
                        </TableCell>

                        <TableCell>
                            <div class="flex flex-wrap gap-1">
                                {#each headline.title.tags as tag}
                                    <Badge variant="secondary" class="text-xs">
                                        {tag}
                                    </Badge>
                                {/each}
                            </div>
                        </TableCell>

                        <TableCell>
                            <span class={getDateColorClass(headline)}>
                                {formatDateInfo(headline)}
                            </span>
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    {/if}
</div>
