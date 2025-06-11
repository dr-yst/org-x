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
    import { commands } from "$lib/bindings";

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
        focusedIndex = -1,
        activeFilter = "all",
    } = $props<{
        headlines: OrgHeadline[];
        focusedIndex?: number;
        activeFilter?: string;
    }>();

    // Event dispatcher
    const dispatch = createEventDispatcher<{
        focusChanged: number;
        filterChanged: number;
        headlineSelected: OrgHeadline;
    }>();

    // Frontend cache for document information
    let documentTitleCache = $state<Record<string, string>>({});
    let documentPathCache = $state<Record<string, string>>({});

    // Async helper functions using Tauri commands
    async function fetchDocumentTitle(documentId: string): Promise<string> {
        if (documentTitleCache[documentId]) {
            return documentTitleCache[documentId];
        }
        
        try {
            const result = await commands.getOrgDocumentDisplayTitleById(documentId);
            if (result.status === "ok") {
                documentTitleCache[documentId] = result.data;
                return result.data;
            } else {
                console.error("Error fetching document title:", result.error);
                documentTitleCache[documentId] = "Unknown Document";
                return "Unknown Document";
            }
        } catch (e) {
            console.error("Exception fetching document title:", e);
            documentTitleCache[documentId] = "Unknown Document";
            return "Unknown Document";
        }
    }

    async function fetchDocumentPath(documentId: string): Promise<string> {
        if (documentPathCache[documentId]) {
            return documentPathCache[documentId];
        }
        
        try {
            const result = await commands.getOrgDocumentPathById(documentId);
            if (result.status === "ok") {
                documentPathCache[documentId] = result.data;
                return result.data;
            } else {
                console.error("Error fetching document path:", result.error);
                documentPathCache[documentId] = "";
                return "";
            }
        } catch (e) {
            console.error("Exception fetching document path:", e);
            documentPathCache[documentId] = "";
            return "";
        }
    }

    // Filter options
    const filterOptions = ["all", "today", "week", "overdue"];

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

    // Get document color class for visual distinction
    async function getDocumentColorClass(headline: OrgHeadline): Promise<string> {
        const documentPath = await fetchDocumentPath(headline.document_id);
        // Extract filename from path for consistent color assignment
        const filename = documentPath.split("/").pop() || "";

        // Simple hash function to assign consistent colors
        let hash = 0;
        for (let i = 0; i < filename.length; i++) {
            hash = filename.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Use hash to select from predefined color classes
        const colors = [
            "border-blue-300 text-blue-700 bg-blue-50",
            "border-green-300 text-green-700 bg-green-50",
            "border-purple-300 text-purple-700 bg-purple-50",
            "border-orange-300 text-orange-700 bg-orange-50",
            "border-pink-300 text-pink-700 bg-pink-50",
            "border-indigo-300 text-indigo-700 bg-indigo-50",
        ];

        const colorIndex = Math.abs(hash) % colors.length;
        return colors[colorIndex];
    }
</script>

<div class="w-full min-w-0">
    <div class="text-xs text-gray-500 mb-2">
        {headlines.length} items displayed • {focusedIndex >= 0
            ? `Item ${focusedIndex + 1} selected`
            : "No selection"}
    </div>

    <!-- Filter buttons -->
    <div class="flex gap-2 mb-4">
        {#each filterOptions as filter, index}
            <Button
                variant={activeFilter === filter ? "default" : "secondary"}
                class={activeFilter === "today" && filter === "today"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : activeFilter === "overdue" && filter === "overdue"
                    ? "bg-red-500 hover:bg-red-600"
                    : ""}
                size="sm"
                onclick={() => dispatch("filterChanged", index)}
            >
                {filter === "all" ? "All" : 
                 filter === "today" ? "Today" :
                 filter === "week" ? "This Week" :
                 filter === "overdue" ? "Overdue" : filter}
            </Button>
        {/each}
    </div>

    {#if headlines.length === 0}
        <div
            class="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200"
        >
            No headlines found.
        </div>
    {:else}
        <div class="overflow-x-auto overflow-y-auto max-w-full max-h-[80vh] min-w-0">
            <Table>
                <TableCaption>Task List View</TableCaption>

                <TableHeader>
                    <TableRow>
                        <TableHead class="w-[100px]">Status</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead class="w-[120px]">Document</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead class="w-[180px]">Date</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {#each headlines as headline, index}
                        <TableRow
                            class={`hover:bg-gray-50 cursor-pointer ${index === focusedIndex ? "bg-blue-50 ring-2 ring-blue-200" : ""}`}
                            onclick={() => {
                                dispatch("focusChanged", index);
                                dispatch("headlineSelected", headline);
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
                                {#await Promise.all([fetchDocumentTitle(headline.document_id), getDocumentColorClass(headline)]) then [title, colorClass]}
                                    <Badge
                                        variant="outline"
                                        class={`text-xs ${colorClass}`}
                                    >
                                        {title}
                                    </Badge>
                                {:catch}
                                    <Badge
                                        variant="outline"
                                        class="text-xs text-gray-600 border-gray-200 bg-gray-50"
                                    >
                                        Unknown Document
                                    </Badge>
                                {/await}
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
        </div>
    {/if}
</div>
