<script lang="ts">
    import type { OrgHeadline } from "$lib/bindings";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Breadcrumb,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbList,
        BreadcrumbPage,
        BreadcrumbSeparator,
    } from "$lib/components/ui/breadcrumb";
    import HeadlinesList from "$lib/components/HeadlinesList.svelte";
    import Home from "@lucide/svelte/icons/home";

    // Pure, stateless props interface for recursive navigation support
    const {
        headline = null,
        parentChain = [],
        selectedChild = null,
        onHeadlineSelected = null,
        onBreadcrumbClick = null,
        onHomeClick = null,
    } = $props<{
        headline: OrgHeadline | null;
        parentChain?: OrgHeadline[];
        selectedChild?: OrgHeadline | null;
        onHeadlineSelected?: ((headline: OrgHeadline) => void) | null;
        onBreadcrumbClick?: ((index: number) => void) | null;
        onHomeClick?: (() => void) | null;
    }>();

    // Pure formatting functions - no side effects
    function formatTimestamp(timestamp: any): string {
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
        return title
            .replace(
                /^\*+\s+(?:\w+\s+)?(?:\[\#.\]\s+)?(.+?)(?:\s+:.+:)?$/,
                "$1",
            )
            .trim();
    }

    function formatPlanningForDisplay(planning: any) {
        if (!planning) return null;

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
    }

    // Derived values - computed from props
    const formattedPlanning = $derived(
        headline?.title?.planning
            ? formatPlanningForDisplay(headline.title.planning)
            : null,
    );
    const formattedContent = $derived(
        headline?.content ? formatContent(headline.content) : "",
    );
    const cleanedTitle = $derived(
        headline?.title?.raw ? cleanTitle(headline.title.raw) : "",
    );
    const priorityColorClass = $derived(
        getPriorityColorClass(headline?.title?.priority || null),
    );
    const todoBadgeClass = $derived(
        getTodoBadgeClass(headline?.title?.todo_keyword || null),
    );
    const hasChildren = $derived(
        Boolean(headline?.children && headline.children.length > 0),
    );
    const hasProperties = $derived(
        Boolean(
            headline?.title?.properties &&
                Object.keys(headline.title.properties).length > 0,
        ),
    );
    const hasContent = $derived(
        Boolean(headline?.content && headline.content.trim().length > 0),
    );

    // Event handlers - pure functions that call parent callbacks
    function handleChildSelected(event: CustomEvent<OrgHeadline>) {
        if (onHeadlineSelected) {
            onHeadlineSelected(event.detail);
        }
    }

    function handleBreadcrumbNavigation(index: number) {
        if (onBreadcrumbClick) {
            onBreadcrumbClick(index);
        }
    }

    function handleHomeNavigation() {
        if (onHomeClick) {
            onHomeClick();
        }
    }
</script>

<div class="w-full h-full">
    {#if !headline}
        <!-- Empty state when no headline is provided -->
        <div
            class="w-full h-64 flex flex-col items-center justify-center text-gray-500"
        >
            <svg
                class="w-16 h-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
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
            {onHeadlineSelected}
            {onBreadcrumbClick}
            {onHomeClick}
        />
    {:else}
        <!-- Main detail view -->
        <div class="space-y-4">
            <!-- Breadcrumb Navigation -->
            <Breadcrumb class="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            href="#"
                            onclick={(e) => {
                                e.preventDefault();
                                handleHomeNavigation();
                            }}
                            class="hover:text-blue-600 flex items-center gap-1"
                        >
                            <Home class="h-4 w-4" />
                            Home
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {#if parentChain.length > 0}
                        <BreadcrumbSeparator />
                        {#each parentChain as parent, i}
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href="#"
                                    onclick={(e) => {
                                        e.preventDefault();
                                        handleBreadcrumbNavigation(i);
                                    }}
                                    class="hover:text-blue-600"
                                >
                                    {cleanTitle(parent.title.raw)}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                        {/each}
                    {/if}
                    <BreadcrumbItem>
                        <BreadcrumbPage class="font-medium">
                            {cleanedTitle}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <!-- Headline Title, Status, Priority, Tags -->
            <div class="flex items-center gap-2 mb-2">
                {#if headline.title.todo_keyword}
                    <Badge
                        class="{todoBadgeClass} {headline.title.todo_keyword ===
                        'CANCELLED'
                            ? 'line-through'
                            : ''} text-xs font-medium"
                        variant="secondary"
                    >
                        {headline.title.todo_keyword}
                    </Badge>
                {/if}

                {#if headline.title.priority}
                    <span
                        class="px-1.5 py-0.5 font-mono rounded text-xs {priorityColorClass}"
                    >
                        [#{headline.title.priority}]
                    </span>
                {/if}

                <span class="font-semibold text-lg">
                    {cleanedTitle}
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
            {#if hasProperties}
                <div class="mb-2 grid grid-cols-3 gap-2">
                    {#each Object.entries(headline.title.properties) as [key, value]}
                        <div class="text-gray-500 font-medium">{key}:</div>
                        <div class="text-gray-800 col-span-2">{value}</div>
                    {/each}
                </div>
            {/if}

            <!-- Planning Information -->
            {#if formattedPlanning}
                <div class="p-3 bg-gray-50 rounded mb-4 text-sm">
                    <h3 class="font-medium text-gray-700 mb-2">Planning</h3>
                    <div class="grid grid-cols-3 gap-2">
                        {#each Object.entries(formattedPlanning) as [key, value]}
                            <div class="text-gray-500 font-medium uppercase">
                                {key}:
                            </div>
                            <div class="text-gray-800 col-span-2">
                                {value}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Content (displayed above child headlines table as per requirements) -->
            {#if hasContent}
                <div
                    class="mb-4 prose prose-sm max-w-none p-3 bg-gray-50 rounded overflow-x-auto"
                >
                    {@html formattedContent}
                </div>
            {/if}

            <!-- Table of Child Headlines (if any) -->
            {#if hasChildren}
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
