<script lang="ts">
    import { onMount } from "svelte";
    import {
        documents,
        loading,
        error,
        hasMonitoredPaths,
        focusedIndex,
        activeFilterIndex,
        showQuickActions,
        selectedHeadline,
        showDetailView,
        showQuickLook,
        filteredHeadlines,
        documentCount,
        headlineCount,
        filterOptions,
        displayMode,
        refresh,
        setFilter,
        setFocus,
        cycleFilter,
        moveFocusDown,
        moveFocusUp,
        toggleQuickActions,
        hideQuickActions,
        openDetailView,
        closeDetailView,
        toggleQuickLook,
        closeQuickLook,
        handleQuickAction,
        exposeGlobalRefresh,
    } from "$lib/viewmodels/listview.store";
    import type { OrgHeadline } from "../bindings";
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
    import {
        Drawer,
        DrawerContent,
        DrawerHeader,
        DrawerTitle,
        DrawerClose,
    } from "$lib/components/ui/drawer";

    import File from "@lucide/svelte/icons/file";
    import Tag from "@lucide/svelte/icons/tag";
    import Eye from "@lucide/svelte/icons/eye";
    import FileEdit from "@lucide/svelte/icons/file-edit";
    import Check from "@lucide/svelte/icons/check";
    import ChevronUp from "@lucide/svelte/icons/chevron-up";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import X from "@lucide/svelte/icons/x";

    // Handle keyboard navigation
    function handleKeyDown(event: KeyboardEvent) {
        // Only handle keyboard events when documents are loaded
        if ($documentCount === 0 || $loading) return;

        if (event.key === "j" || event.key === "ArrowDown") {
            // Move focus down
            event.preventDefault();
            moveFocusDown();
        } else if (event.key === "k" || event.key === "ArrowUp") {
            // Move focus up
            event.preventDefault();
            moveFocusUp();
        } else if (event.key === "f") {
            // Cycle through filter options
            event.preventDefault();
            cycleFilter();
        } else if (event.key === ".") {
            // Show quick actions menu
            event.preventDefault();
            if ($focusedIndex >= 0) {
                toggleQuickActions();
            }
        } else if (event.key === "Escape") {
            // Close quick actions menu or detail view
            event.preventDefault();
            if ($showQuickActions) {
                hideQuickActions();
            } else if ($showDetailView) {
                closeDetailView();
            } else if ($showQuickLook) {
                closeQuickLook();
            }
        } else if (event.key === "Enter" || event.key === "o") {
            // Open detail view for the selected headline
            event.preventDefault();
            if (
                $focusedIndex >= 0 &&
                $focusedIndex < $filteredHeadlines.length
            ) {
                const headline = $filteredHeadlines[$focusedIndex];
                openDetailView(headline);
            }
        } else if (event.key == " ") {
            // Toggle quick look view with spacebar
            event.preventDefault();
            if (
                $focusedIndex >= 0 &&
                $focusedIndex < $filteredHeadlines.length
            ) {
                const headline = $filteredHeadlines[$focusedIndex];
                toggleQuickLook(headline);
            }
        } else if (event.key === "e" && $showQuickActions) {
            // Open in external editor
            event.preventDefault();
            handleQuickAction("open-editor");
        } else if (event.key === "d" && $showQuickActions) {
            // Mark as done
            event.preventDefault();
            handleQuickAction("mark-done");
        } else if (event.key === "+" && $showQuickActions) {
            // Increase priority
            event.preventDefault();
            handleQuickAction("priority-up");
        } else if (event.key === "-" && $showQuickActions) {
            // Decrease priority
            event.preventDefault();
            handleQuickAction("priority-down");
        }
    }

    onMount(() => {
        console.log("🚀 ListView onMount called");
        refresh();
        exposeGlobalRefresh();

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    });
</script>

<div class="w-full h-full">
    {#if $showDetailView}
        <!-- Main DetailView when showDetailView is true -->
        <div class="space-y-4 p-4">
            <!-- Back button -->
            <div class="flex items-center gap-2 mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => closeDetailView()}
                    class="flex items-center gap-2"
                >
                    <ChevronLeft class="h-4 w-4" />
                    Back to {$displayMode === "task-list"
                        ? "Task List"
                        : "Headline List"}
                </Button>
            </div>

            <!-- DetailView component -->
            <DetailView
                headline={$selectedHeadline}
                parentChain={[]}
                onBreadcrumbClick={null}
            />
        </div>
    {:else if $error}
        <div class="w-full h-64 flex items-center justify-center">
            <div class="text-center text-red-600">Error: {$error}</div>
        </div>
    {:else if $loading && $hasMonitoredPaths}
        <div class="w-full h-64 flex items-center justify-center">
            <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
            ></div>
        </div>
    {:else if !$hasMonitoredPaths}
        <div class="w-full h-64 flex items-center justify-center text-center">
            <div>
                <p class="text-gray-600">No monitored paths configured.</p>
                <br />
                <p class="text-sm text-gray-500">
                    Please add a file or directory in the sidebar to get
                    started.
                </p>
            </div>
        </div>
    {:else if $documentCount > 0}
        <div class="mb-6">
            <h2 class="text-2xl font-semibold mb-2">
                {$displayMode === "task-list" ? "Task List" : "Headline List"} ({$headlineCount}
                items)
            </h2>

            <div class="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <div class="flex items-center gap-1">
                    <File class="h-4 w-4" />
                    <span>
                        {$documentCount} document{$documentCount === 1
                            ? ""
                            : "s"}
                    </span>
                </div>
                <div class="flex items-center gap-1">
                    <Tag class="h-4 w-4" />
                    <span>{$headlineCount} headlines</span>
                </div>
            </div>

            {#if $documentCount > 1}
                <div class="mb-4">
                    <h3 class="text-sm font-medium text-gray-700 mb-2">
                        Documents:
                    </h3>
                    <div class="flex flex-wrap gap-2">
                        {#each $documents as doc}
                            <Badge variant="outline" class="text-xs">
                                {doc.title}
                            </Badge>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>

        <div class="w-full min-w-0 flex-1">
            <div class="mb-4 flex flex-col gap-2">
                <h3 class="text-xl font-semibold text-gray-800">
                    Keyboard Shortcuts
                </h3>
                <p class="text-sm text-gray-600">
                    <kbd class="px-2 py-1 bg-gray-200 rounded text-xs">j/↓</kbd>
                    Move down •
                    <kbd class="px-2 py-1 bg-gray-200 rounded text-xs">k/↑</kbd>
                    Move up •
                    <kbd class="px-2 py-1 bg-gray-200 rounded text-xs">f</kbd>
                    Filter •
                    <kbd class="px-2 py-1 bg-gray-200 rounded text-xs">.</kbd>
                    Actions •
                    <kbd class="px-2 py-1 bg-gray-200 rounded text-xs"
                        >Enter/o</kbd
                    >
                    Open •
                    <kbd class="px-2 py-1 bg-gray-200 rounded text-xs"
                        >Space</kbd
                    >
                    Quick Look •
                    <kbd class="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd>
                    Close
                </p>
            </div>

            <div class="relative">
                <HeadlinesList
                    headlines={$filteredHeadlines}
                    focusedIndex={$focusedIndex}
                    activeFilter={filterOptions[$activeFilterIndex]}
                    on:focusChanged={(e) => setFocus(e.detail)}
                    on:filterChanged={(e) => setFilter(e.detail)}
                    on:headlineSelected={(e) => openDetailView(e.detail)}
                />

                {#if $focusedIndex >= 0 && $focusedIndex < $filteredHeadlines.length}
                    <DropdownMenu open={$showQuickActions}>
                        <DropdownMenuTrigger class="hidden">
                            <Button variant="ghost">Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent class="w-56" align="end">
                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                on:click={() => handleQuickAction("view")}
                            >
                                <Eye class="h-4 w-4 mr-2" />
                                View Details
                                <DropdownMenuShortcut
                                    >Enter</DropdownMenuShortcut
                                >
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                on:click={() =>
                                    handleQuickAction("open-editor")}
                            >
                                <FileEdit class="h-4 w-4 mr-2" />
                                Open in Editor
                                <DropdownMenuShortcut>e</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                on:click={() => handleQuickAction("mark-done")}
                            >
                                <Check class="h-4 w-4 mr-2" />
                                Mark as Done
                                <DropdownMenuShortcut>d</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                on:click={() =>
                                    handleQuickAction("priority-up")}
                            >
                                <ChevronUp class="h-4 w-4 mr-2" />
                                Increase Priority
                                <DropdownMenuShortcut>+</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                on:click={() =>
                                    handleQuickAction("priority-down")}
                            >
                                <ChevronDown class="h-4 w-4 mr-2" />
                                Decrease Priority
                                <DropdownMenuShortcut>-</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                {/if}
            </div>
        </div>

        <Drawer open={$showQuickLook}>
            <DrawerContent class="max-h-[80vh] overflow-y-auto">
                <DrawerHeader>
                    <DrawerTitle>
                        {$selectedHeadline
                            ? $selectedHeadline.title.raw
                            : "Quick Look"}
                    </DrawerTitle>
                    <DrawerClose>
                        <Button
                            variant="ghost"
                            size="sm"
                            on:click={closeQuickLook}
                        >
                            <X class="h-4 w-4" />
                        </Button>
                    </DrawerClose>
                </DrawerHeader>
                <div class="p-4">
                    <DetailView headline={$selectedHeadline} />
                </div>
            </DrawerContent>
        </Drawer>
    {:else}
        <div class="w-full h-64 flex items-center justify-center">
            <div class="text-center text-gray-600">No documents found</div>
        </div>
    {/if}
</div>
