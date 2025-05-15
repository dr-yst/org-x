<script lang="ts">
    import { onMount } from "svelte";
    import { commands } from "../bindings";
    import type { OrgDocument, OrgHeadline } from "../bindings";
    import HeadlinesList from "./HeadlinesList.svelte";
    import DetailView from "./DetailView.svelte";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuShortcut,
        DropdownMenuTrigger,
    } from "$lib/components/ui/dropdown-menu";

    import File from "@lucide/svelte/icons/file";
    import Tag from "@lucide/svelte/icons/tag";
    import Eye from "@lucide/svelte/icons/eye";
    import FileEdit from "@lucide/svelte/icons/file-edit";
    import Check from "@lucide/svelte/icons/check";
    import ChevronUp from "@lucide/svelte/icons/chevron-up";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import X from "@lucide/svelte/icons/x";

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
        } else if (event.key === "e" && showQuickActions) {
            // Open in external editor
            event.preventDefault();
            handleQuickAction("open-editor");
        } else if (event.key === "d" && showQuickActions) {
            // Mark as done
            event.preventDefault();
            handleQuickAction("mark-done");
        } else if (event.key === "+" && showQuickActions) {
            // Increase priority
            event.preventDefault();
            handleQuickAction("priority-up");
        } else if (event.key === "-" && showQuickActions) {
            // Decrease priority
            event.preventDefault();
            handleQuickAction("priority-down");
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
            case "open-editor":
                // Open the file in external editor
                const document_path = document?.file_path;
                if (document_path) {
                    console.log(
                        "Opening file in external editor:",
                        document_path,
                    );
                    // In a real implementation, we would use the tauri-plugin-opener
                    // For this demo, we'll just log the intention
                } else {
                    console.error("No file path available");
                }
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
                            <File class="h-4 w-4" />
                            <span>{document.file_path}</span>
                        </div>
                    {/if}

                    {#if document.category}
                        <div class="flex items-center gap-1">
                            <Tag class="h-4 w-4" />
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
                        >
                        View details,
                        <kbd
                            class="px-1.5 py-0.5 bg-gray-100 border rounded text-xs"
                            >e</kbd
                        > Open in editor
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

                    {#if focusedIndex >= 0 && focusedIndex < filteredHeadlines.length}
                        <DropdownMenu
                            open={showQuickActions}
                            onOpenChange={(open) => (showQuickActions = open)}
                        >
                            <DropdownMenuTrigger class="hidden">
                                <Button variant="ghost">Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent class="w-56" align="end">
                                <DropdownMenuLabel
                                    >Quick Actions</DropdownMenuLabel
                                >
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onclick={() => handleQuickAction("view")}
                                >
                                    <Eye class="h-4 w-4 mr-2" />
                                    View Details
                                    <DropdownMenuShortcut
                                        >Enter</DropdownMenuShortcut
                                    >
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onclick={() =>
                                        handleQuickAction("open-editor")}
                                >
                                    <FileEdit class="h-4 w-4 mr-2" />
                                    Open in External Editor
                                    <DropdownMenuShortcut
                                        >E</DropdownMenuShortcut
                                    >
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onclick={() =>
                                        handleQuickAction("mark-done")}
                                >
                                    <Check class="h-4 w-4 mr-2" />
                                    Mark as Done
                                    <DropdownMenuShortcut
                                        >D</DropdownMenuShortcut
                                    >
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onclick={() =>
                                        handleQuickAction("priority-up")}
                                >
                                    <ChevronUp class="h-4 w-4 mr-2" />
                                    Increase Priority
                                    <DropdownMenuShortcut
                                        >+</DropdownMenuShortcut
                                    >
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onclick={() =>
                                        handleQuickAction("priority-down")}
                                >
                                    <ChevronDown class="h-4 w-4 mr-2" />
                                    Decrease Priority
                                    <DropdownMenuShortcut
                                        >-</DropdownMenuShortcut
                                    >
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                            <X class="h-4 w-4" />
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
