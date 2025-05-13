<script lang="ts">
    import { onMount } from "svelte";
    import { commands } from "../bindings";
    import type { OrgDocument, OrgHeadline } from "../bindings";
    import HeadlinesList from "./HeadlinesList.svelte";
    import DetailView from "./DetailView.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";

    // Svelte 5 state management with runes
    let document = $state<OrgDocument | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Keyboard navigation state
    let focusedIndex = $state<number>(-1); // -1 means no focus
    let filteredHeadlines = $state<OrgHeadline[]>([]);
    const filterOptions = ["all", "today", "week", "overdue"];
    let activeFilterIndex = $state(0); // Default to 'all'
    let showQuickActions = $state(false);
    let selectedHeadline = $state<OrgHeadline | null>(null);
    let showDetailView = $state(false);

    onMount(() => {
        const loadDocument = async () => {
            try {
                // Load sample document
                document = await commands.getSampleOrg();
                loading = false;
            } catch (err) {
                error = String(err);
                loading = false;
            }
        };

        loadDocument();

        // Add keyboard event listener
        window.addEventListener("keydown", handleKeyDown);

        // Cleanup on component unmount
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    });

    // Handle keyboard navigation
    function handleKeyDown(event: KeyboardEvent) {
        // Only handle keyboard events when document is loaded
        if (!document || loading) return;

        if (event.key === "j" || event.key === "ArrowDown") {
            // Move focus down
            event.preventDefault();
            if (filteredHeadlines.length > 0) {
                focusedIndex = Math.min(
                    focusedIndex + 1,
                    filteredHeadlines.length - 1,
                );
                showQuickActions = false;
            }
        } else if (event.key === "k" || event.key === "ArrowUp") {
            // Move focus up
            event.preventDefault();
            focusedIndex = Math.max(focusedIndex - 1, -1);
            showQuickActions = false;
        } else if (event.key === "f") {
            // Cycle through filter options
            event.preventDefault();
            activeFilterIndex = (activeFilterIndex + 1) % filterOptions.length;
        } else if (event.key === ".") {
            // Show quick actions menu
            event.preventDefault();
            if (focusedIndex >= 0) {
                showQuickActions = !showQuickActions;
            }
        } else if (event.key === "Escape") {
            // Close quick actions menu or detail view
            event.preventDefault();
            if (showQuickActions) {
                showQuickActions = false;
            } else if (showDetailView) {
                showDetailView = false;
                selectedHeadline = null;
            }
        } else if (event.key === "Enter" || event.key === "o") {
            // Open detail view for the selected headline
            event.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredHeadlines.length) {
                selectedHeadline = filteredHeadlines[focusedIndex];
                showDetailView = true;
                showQuickActions = false;
            }
        }
    }

    // Handle quick action selection
    function handleQuickAction(action: string) {
        if (focusedIndex < 0 || focusedIndex >= filteredHeadlines.length)
            return;

        const headline = filteredHeadlines[focusedIndex];

        switch (action) {
            case "view":
                selectedHeadline = headline;
                showDetailView = true;
                break;
            case "mark-done":
                console.log("Mark as done:", headline.id);
                break;
            case "priority-up":
                console.log("Increase priority:", headline.id);
                break;
            case "priority-down":
                console.log("Decrease priority:", headline.id);
                break;
        }

        showQuickActions = false;
    }
</script>

<div class="w-full h-full p-4 {showDetailView ? 'grid grid-cols-2 gap-4' : ''}">
    {#if error}
        <div
            class="p-4 border border-red-500 bg-red-50 text-red-700 rounded mb-4"
        >
            Error: {error}
        </div>
    {:else if loading}
        <div class="w-full h-64 flex items-center justify-center">
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"
            ></div>
        </div>
    {:else if document}
        {#if !showDetailView}
            <div class="mb-6">
                <h2 class="text-2xl font-semibold mb-2">{document.title}</h2>

                <div class="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    {#if document.file_path}
                        <div class="flex items-center gap-1">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                            <span>{document.file_path}</span>
                        </div>
                    {/if}

                    {#if document.category}
                        <div class="flex items-center gap-1">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                            <span
                                >Category: <span class="font-medium"
                                    >{document.category}</span
                                ></span
                            >
                        </div>
                    {/if}
                </div>

                {#if document.filetags && document.filetags.length > 0}
                    <div class="flex flex-wrap gap-2 mb-4">
                        {#each document.filetags as tag}
                            <Badge variant="secondary" class="text-xs">
                                {tag}
                            </Badge>
                        {/each}
                    </div>
                {/if}

                {#if Object.keys(document.properties || {}).length > 0}
                    <div class="p-3 bg-gray-50 rounded-md mb-4 text-sm">
                        <h3 class="font-medium text-gray-700 mb-2">
                            Properties
                        </h3>
                        <div class="grid grid-cols-2 gap-2">
                            {#each Object.entries(document.properties || {}) as [key, value]}
                                <div class="text-gray-500 font-medium">
                                    {key}
                                </div>
                                <div class="text-gray-800">{value}</div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <div class={showDetailView ? "" : "w-full"}>
            {#if !showDetailView}
                <div class="mb-4 flex flex-col gap-2">
                    <h3 class="text-xl font-semibold text-gray-800">
                        Task List
                    </h3>
                    <p class="text-sm text-gray-600">
                        Keyboard shortcuts: <kbd
                            class="px-1.5 py-0.5 bg-gray-100 border rounded text-xs"
                            >j/↓</kbd
                        >
                        Next item,
                        <kbd
                            class="px-1.5 py-0.5 bg-gray-100 border rounded text-xs"
                            >k/↑</kbd
                        >
                        Previous item,
                        <kbd
                            class="px-1.5 py-0.5 bg-gray-100 border rounded text-xs"
                            >f</kbd
                        >
                        Change filter,
                        <kbd
                            class="px-1.5 py-0.5 bg-gray-100 border rounded text-xs"
                            >.</kbd
                        >
                        Quick actions,
                        <kbd
                            class="px-1.5 py-0.5 bg-gray-100 border rounded text-xs"
                            >Enter</kbd
                        > View details
                    </p>
                </div>
            {/if}

            <div class="relative">
                {#if !showDetailView}
                    <HeadlinesList
                        headlines={document.headlines}
                        {document}
                        {focusedIndex}
                        on:rowClick={(e) => {
                            selectedHeadline = e.detail;
                            showDetailView = true;
                            showQuickActions = false;
                        }}
                        on:update={(e) => (filteredHeadlines = e.detail)}
                    />

                    {#if showQuickActions && focusedIndex >= 0 && focusedIndex < filteredHeadlines.length}
                        <div
                            class="absolute right-4 top-10 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                        >
                            <div
                                class="p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg"
                            >
                                <h4 class="font-medium text-sm">
                                    Quick Actions
                                </h4>
                            </div>
                            <div class="p-1">
                                <Button
                                    variant="ghost"
                                    class="w-full justify-start"
                                    onclick={() => handleQuickAction("view")}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4 mr-2"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M10 12a2 2 0 100-4 2 2 0 000 4z"
                                        />
                                        <path
                                            fill-rule="evenodd"
                                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                    View Details
                                </Button>
                                <Button
                                    variant="ghost"
                                    class="w-full justify-start"
                                    onclick={() =>
                                        handleQuickAction("mark-done")}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4 mr-2"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                    Mark as Done
                                </Button>
                                <Button
                                    variant="ghost"
                                    class="w-full justify-start"
                                    onclick={() =>
                                        handleQuickAction("priority-up")}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4 mr-2"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                    Increase Priority
                                </Button>
                                <Button
                                    variant="ghost"
                                    class="w-full justify-start"
                                    onclick={() =>
                                        handleQuickAction("priority-down")}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4 mr-2"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                    Decrease Priority
                                </Button>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>

            {#if showDetailView}
                <div class="w-full">
                    <div class="mb-4 flex justify-between items-center">
                        <h3 class="text-xl font-semibold text-gray-800">
                            Task Details
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => {
                                showDetailView = false;
                                selectedHeadline = null;
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                            Close
                        </Button>
                    </div>
                    <DetailView headline={selectedHeadline} />
                </div>
            {/if}
        </div>
    {:else}
        <div
            class="p-4 border border-yellow-500 bg-yellow-50 text-yellow-700 rounded"
        >
            No document loaded.
        </div>
    {/if}
</div>
