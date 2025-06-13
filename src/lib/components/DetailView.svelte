<script lang="ts">
    import type { OrgHeadline, OrgTimestamp } from "$lib/bindings";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Breadcrumb,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbList,
        BreadcrumbPage,
        BreadcrumbSeparator,
    } from "$lib/components/ui/breadcrumb";
    import { cn } from "$lib/utils";
    import HeadlinesList from "$lib/components/HeadlinesList.svelte";

    // Enhanced props definition using Svelte 5 runes - supports recursive navigation
    const {
        headline = null,
        parentChain = [],
        onBreadcrumbClick = null,
    } = $props<{
        headline: OrgHeadline | null;
        parentChain?: OrgHeadline[]; // For breadcrumb navigation
        onBreadcrumbClick?: ((index: number) => void) | null; // Callback for breadcrumb navigation
    }>();

    // State for recursive navigation
    let selectedChild: OrgHeadline | null = $state(null);

    // Helper function to format OrgTimestamp
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
            const startStr = formatDateFromOrgDatetime(
                timestamp.ActiveRange.start,
            );
            const endStr = formatDateFromOrgDatetime(timestamp.ActiveRange.end);
            return `<${startStr}--${endStr}${timestamp.ActiveRange.repeater ? " " + timestamp.ActiveRange.repeater : ""}${timestamp.ActiveRange.delay ? " " + timestamp.ActiveRange.delay : ""}>`;
        } else if ("InactiveRange" in timestamp) {
            const startStr = formatDateFromOrgDatetime(
                timestamp.InactiveRange.start,
            );
            const endStr = formatDateFromOrgDatetime(
                timestamp.InactiveRange.end,
            );
            return `[${startStr}--${endStr}${timestamp.InactiveRange.repeater ? " " + timestamp.InactiveRange.repeater : ""}${timestamp.InactiveRange.delay ? " " + timestamp.InactiveRange.delay : ""}]`;
        } else if ("Diary" in timestamp) {
            return `<%${timestamp.Diary.value}>`;
        }

        return "";
    }

    // Helper to format a date from OrgDatetime
    function formatDateFromOrgDatetime(datetime: any): string {
        if (!datetime) return "";
        const { year, month, day, hour, minute } = datetime;

        let dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

        if (hour !== null && minute !== null) {
            dateStr += ` ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        }

        return dateStr;
    }

    // Format the content for display
    function formatContent(content: string): string {
        if (!content) return "";
        // Replace newlines with <br> for HTML display
        return content.replace(/\n/g, "<br>");
    }

    // Get priority color class (still needed for detail view header)
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

    // Define custom badge classes for TODO status (still needed for detail view header)
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

    // Get badge class for TODO status (still needed for detail view header)
    function getTodoBadgeClass(todoKeyword: string | null): string {
        if (!todoKeyword) return "";

        const normalized = todoKeyword.toLowerCase().replace("_", "-");
        return (
            todoBadgeClasses[normalized as keyof typeof todoBadgeClasses] ||
            todoBadgeClasses.todo
        );
    }

    // Clean title text by removing org-mode formatting
    function cleanTitle(title: string): string {
        return title.replace(/^\*+\s+(?:\w+\s+)?(?:\[\#.\]\s+)?/, "");
    }

    // Handle breadcrumb navigation
    function handleBreadcrumbClick(index: number) {
        selectedChild = null;
        if (onBreadcrumbClick) {
            onBreadcrumbClick(index);
        }
    }

    // Handle child headline selection for recursive navigation
    function handleChildSelected(event: CustomEvent<OrgHeadline>) {
        selectedChild = event.detail;
    }

    // Handle back navigation from recursive view
    function handleBackFromChild() {
        selectedChild = null;
    }
</script>

<div class="w-full h-full">
    {#if !headline}
        <div
            class="flex flex-col items-center justify-center py-12 text-gray-500"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
            <p class="text-gray-400 text-center">
                Select a task/headline to view details
            </p>
        </div>
    {:else if selectedChild}
        <!-- Recursive DetailView for selected child -->
        <svelte:self
            headline={selectedChild}
            parentChain={[...parentChain, headline]}
            onBreadcrumbClick={(index: number) => {
                if (index === parentChain.length) {
                    // Clicked on current headline, go back to main view
                    handleBackFromChild();
                } else {
                    // Clicked on parent breadcrumb, propagate up
                    handleBreadcrumbClick(index);
                }
            }}
        />
    {:else}
        <!-- Main detail view -->
        <div class="space-y-4">
            <!-- Breadcrumb Navigation -->
            {#if parentChain.length > 0}
                <Breadcrumb class="mb-4">
                    <BreadcrumbList>
                        {#each parentChain as parent, i}
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href="#"
                                    onclick={(e) => {
                                        e.preventDefault();
                                        handleBreadcrumbClick(i);
                                    }}
                                    class="hover:text-blue-600"
                                >
                                    {cleanTitle(parent.title.raw)}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                        {/each}
                        <BreadcrumbItem>
                            <BreadcrumbPage class="font-medium">
                                {cleanTitle(headline.title.raw)}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            {/if}

            <!-- Headline Title, Status, Priority, Tags -->
            <div class="flex items-center gap-2 mb-2">
                {#if headline.title.todo_keyword}
                    <Badge
                        class={cn(
                            getTodoBadgeClass(headline.title.todo_keyword),
                            headline.title.todo_keyword === "CANCELLED" &&
                                "line-through",
                            "text-xs font-medium",
                        )}
                        variant="secondary"
                    >
                        {headline.title.todo_keyword}
                    </Badge>
                {/if}

                {#if headline.title.priority}
                    <span
                        class="px-1.5 py-0.5 font-mono rounded text-xs {getPriorityColorClass(
                            headline.title.priority,
                        )}"
                    >
                        [#{headline.title.priority}]
                    </span>
                {/if}

                <span class="font-semibold text-lg">
                    {headline.title.raw.replace(
                        /^\*+\s+(?:\w+\s+)?(?:\[\#.\]\s+)?/,
                        "",
                    )}
                </span>

                {#if headline.title.tags && headline.title.tags.length > 0}
                    <span class="flex gap-1">
                        {#each headline.title.tags as tag}
                            <Badge variant="default" class="text-xs">
                                {tag}
                            </Badge>
                        {/each}
                    </span>
                {/if}
            </div>

            <!-- Properties -->
            {#if Object.keys(headline.title.properties).length > 0}
                <div class="mb-2 grid grid-cols-3 gap-2">
                    {#each Object.entries(headline.title.properties) as [key, value]}
                        <div class="text-gray-500 font-medium">{key}:</div>
                        <div class="text-gray-800 col-span-2">{value}</div>
                    {/each}
                </div>
            {/if}

            <!-- Planning Information -->
            {#if headline.title.planning}
                <div class="p-3 bg-gray-50 rounded mb-4 text-sm">
                    <h3 class="font-medium text-gray-700 mb-2">Planning</h3>
                    <div class="grid grid-cols-3 gap-2">
                        {#if headline.title.planning.scheduled}
                            <div class="text-gray-500 font-medium">
                                SCHEDULED:
                            </div>
                            <div class="text-gray-800 col-span-2">
                                {formatTimestamp(
                                    headline.title.planning.scheduled,
                                )}
                            </div>
                        {/if}

                        {#if headline.title.planning.deadline}
                            <div class="text-gray-500 font-medium">
                                DEADLINE:
                            </div>
                            <div class="text-gray-800 col-span-2">
                                {formatTimestamp(
                                    headline.title.planning.deadline,
                                )}
                            </div>
                        {/if}

                        {#if headline.title.planning.closed}
                            <div class="text-gray-500 font-medium">CLOSED:</div>
                            <div class="text-gray-800 col-span-2">
                                {formatTimestamp(
                                    headline.title.planning.closed,
                                )}
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Content (displayed above child headlines table as per requirements) -->
            {#if headline.content && headline.content.trim()}
                <div
                    class="mb-4 prose prose-sm max-w-none p-3 bg-gray-50 rounded overflow-x-auto"
                >
                    {@html formatContent(headline.content)}
                </div>
            {/if}

            <!-- Table of Child Headlines (if any) -->
            {#if headline.children && headline.children.length > 0}
                <div class="mt-6">
                    <h3 class="mb-2 font-medium text-gray-700">
                        Subtasks / Child Headlines ({headline.children.length})
                    </h3>
                    <HeadlinesList
                        headlines={headline.children}
                        focusedIndex={-1}
                        activeFilter="all"
                        on:headlineSelected={handleChildSelected}
                    />
                </div>
            {/if}
        </div>
    {/if}
</div>
