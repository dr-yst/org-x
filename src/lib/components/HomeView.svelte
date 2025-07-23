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
        showQuickLook,
        quickLookHeadline,
        filteredHeadlines,
        documentCount,
        headlineCount,
        filterOptions,
        displayMode,
        refresh,
        setFilter,
        setFocus,
        cycleFilter,
        setDisplayMode,
        moveFocusDown,
        moveFocusUp,
        toggleQuickActions,
        hideQuickActions,
        toggleQuickLook,
        closeQuickLook,
        handleQuickAction,
        exposeGlobalRefresh,
    } from "$lib/viewmodels/homeview.store";

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
        DrawerDescription,
        DrawerHeader,
        DrawerTitle,
        DrawerClose,
        DrawerFooter,
        DrawerTrigger,
    } from "$lib/components/ui/drawer";
    import {
        Breadcrumb,
        BreadcrumbEllipsis,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbList,
        BreadcrumbPage,
        BreadcrumbSeparator,
    } from "$lib/components/ui/breadcrumb";
    import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
    import { buttonVariants } from "$lib/components/ui/button/index.js";

    import File from "@lucide/svelte/icons/file";
    import Tag from "@lucide/svelte/icons/tag";
    import Eye from "@lucide/svelte/icons/eye";
    import FileEdit from "@lucide/svelte/icons/file-edit";
    import Check from "@lucide/svelte/icons/check";
    import ChevronUp from "@lucide/svelte/icons/chevron-up";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import Home from "@lucide/svelte/icons/home";
    import X from "@lucide/svelte/icons/x";

    // Local state for DetailView navigation
    let showDetailView = $state(false);
    let currentDetailHeadline = $state<OrgHeadline | null>(null);
    let detailParentChain = $state<OrgHeadline[]>([]);
    let detailSelectedChild = $state<OrgHeadline | null>(null);

    // Responsive breadcrumb state
    const isMobile = new IsMobile();
    const ITEMS_TO_DISPLAY = 3;
    let breadcrumbEllipsisOpen = $state(false);

    // DetailView navigation handlers
    function openDetailView(
        headline: OrgHeadline,
        parentChain: OrgHeadline[] = [],
    ) {
        currentDetailHeadline = headline;
        detailParentChain = parentChain;
        detailSelectedChild = null;
        showDetailView = true;
    }

    function closeDetailView() {
        showDetailView = false;
        currentDetailHeadline = null;
        detailParentChain = [];
        detailSelectedChild = null;
    }

    function handleDetailHeadlineSelected(headline: OrgHeadline) {
        // Add current headline to parent chain and set child as new current headline
        if (currentDetailHeadline) {
            detailParentChain = [...detailParentChain, currentDetailHeadline];
        }
        currentDetailHeadline = headline;
        detailSelectedChild = null;
    }

    function handleDetailBreadcrumbClick(index: number) {
        if (index < 0) {
            // Home clicked
            closeDetailView();
        } else if (index < detailParentChain.length) {
            // Navigate to parent at index
            const newParentChain = detailParentChain.slice(0, index);
            const newHeadline = detailParentChain[index];
            currentDetailHeadline = newHeadline;
            detailParentChain = newParentChain;
            detailSelectedChild = null;
        }
    }

    // Breadcrumb helper functions
    function cleanTitle(title: string): string {
        return title
            .replace(
                /^\*+\s+(?:\w+\s+)?(?:\[\#.\]\s+)?(.+?)(?:\s+:.+:)?$/,
                "$1",
            )
            .trim();
    }

    function buildBreadcrumbItems() {
        const items = [];

        // Add Home item
        items.push({
            label: "Home",
            onClick: () => closeDetailView(),
            isHome: true,
        });

        // Add parent chain items
        detailParentChain.forEach((parent, index) => {
            items.push({
                label: cleanTitle(parent.title.raw),
                onClick: () => handleDetailBreadcrumbClick(index),
                isHome: false,
            });
        });

        // Add current headline (no onClick - not clickable)
        if (currentDetailHeadline) {
            items.push({
                label: cleanTitle(currentDetailHeadline.title.raw),
                onClick: null,
                isHome: false,
            });
        }

        return items;
    }

    const breadcrumbItems = $derived(buildBreadcrumbItems());
    const shouldShowEllipsis = $derived(
        breadcrumbItems.length > ITEMS_TO_DISPLAY,
    );
    const visibleItems = $derived(
        shouldShowEllipsis
            ? [
                  breadcrumbItems[0], // Home
                  ...breadcrumbItems.slice(-2), // Last two items (parent and current)
              ]
            : breadcrumbItems,
    );
    const ellipsisItems = $derived(
        shouldShowEllipsis ? breadcrumbItems.slice(1, -2) : [], // Items between Home and last two
    );

    function handleDetailHomeClick() {
        closeDetailView();
    }

    // Handle keyboard navigation
    function handleKeyDown(event: KeyboardEvent) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isEditable =
            tag === "input" ||
            tag === "textarea" ||
            (target && target.isContentEditable);

        // Only trigger shortcuts if NOT typing in an input/textarea/contenteditable
        if (isEditable) return;

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
            } else if (showDetailView) {
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
            handleQuickAction("open-editor", undefined, openDetailView);
        } else if (event.key === "d" && $showQuickActions) {
            // Mark as done
            event.preventDefault();
            handleQuickAction("mark-done", undefined, openDetailView);
        } else if (event.key === "+" && $showQuickActions) {
            // Increase priority
            event.preventDefault();
            handleQuickAction("priority-up", undefined, openDetailView);
        } else if (event.key === "-" && $showQuickActions) {
            // Decrease priority
            event.preventDefault();
            handleQuickAction("priority-down", undefined, openDetailView);
        } else if (event.key === "1" && (event.metaKey || event.ctrlKey)) {
            // Switch to Task List mode (⌘+1 or Ctrl+1)
            event.preventDefault();
            setDisplayMode("task-list");
        } else if (event.key === "2" && (event.metaKey || event.ctrlKey)) {
            // Switch to Headline List mode (⌘+2 or Ctrl+2)
            event.preventDefault();
            setDisplayMode("headline-list");
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
    {#if showDetailView}
        <!-- Main DetailView when showDetailView is true -->
        <div class="space-y-4 p-4">
            <!-- Breadcrumb Navigation -->
            <Breadcrumb class="mb-4">
                <BreadcrumbList>
                    <!-- Home link -->
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            href="#"
                            onclick={(e) => {
                                e.preventDefault();
                                closeDetailView();
                            }}
                            class="hover:text-blue-600 flex items-center gap-1"
                        >
                            <Home class="h-4 w-4" />
                            Home
                        </BreadcrumbLink>
                    </BreadcrumbItem>

                    {#if breadcrumbItems.length > 1}
                        <BreadcrumbSeparator />

                        {#if shouldShowEllipsis}
                            <!-- Ellipsis for intermediate parents -->
                            <BreadcrumbItem>
                                {#if isMobile.current}
                                    <Drawer bind:open={breadcrumbEllipsisOpen}>
                                        <DrawerTrigger aria-label="Toggle Menu">
                                            <BreadcrumbEllipsis
                                                class="size-4"
                                            />
                                        </DrawerTrigger>
                                        <DrawerContent>
                                            <DrawerHeader class="text-left">
                                                <DrawerTitle
                                                    >Navigate to</DrawerTitle
                                                >
                                                <DrawerDescription>
                                                    Select a page to navigate
                                                    to.
                                                </DrawerDescription>
                                            </DrawerHeader>
                                            <div class="grid gap-1 px-4">
                                                {#each ellipsisItems as item, i (i)}
                                                    <button
                                                        onclick={() => {
                                                            if (item.onClick) {
                                                                item.onClick();
                                                            }
                                                            breadcrumbEllipsisOpen = false;
                                                        }}
                                                        class="py-1 text-sm text-left hover:bg-gray-100 rounded px-2"
                                                    >
                                                        {item.label}
                                                    </button>
                                                {/each}
                                            </div>
                                            <DrawerFooter class="pt-4">
                                                <DrawerClose
                                                    class={buttonVariants({
                                                        variant: "outline",
                                                    })}
                                                >
                                                    Close
                                                </DrawerClose>
                                            </DrawerFooter>
                                        </DrawerContent>
                                    </Drawer>
                                {:else}
                                    <DropdownMenu
                                        bind:open={breadcrumbEllipsisOpen}
                                    >
                                        <DropdownMenuTrigger
                                            aria-label="Toggle menu"
                                        >
                                            <BreadcrumbEllipsis
                                                class="size-4"
                                            />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {#each ellipsisItems as item, i (i)}
                                                <DropdownMenuItem>
                                                    <button
                                                        onclick={() => {
                                                            if (item.onClick) {
                                                                item.onClick();
                                                            }
                                                        }}
                                                        class="w-full text-left"
                                                    >
                                                        {item.label}
                                                    </button>
                                                </DropdownMenuItem>
                                            {/each}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                {/if}
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                        {/if}

                        <!-- Last two levels (or all levels if not showing ellipsis) -->
                        {#each shouldShowEllipsis ? visibleItems.slice(1) : visibleItems.slice(1) as item, i (item.label)}
                            <BreadcrumbItem>
                                {#if item.onClick}
                                    <BreadcrumbLink
                                        href="#"
                                        onclick={(e) => {
                                            e.preventDefault();
                                            if (item.onClick) {
                                                item.onClick();
                                            }
                                        }}
                                        class="hover:text-blue-600 max-w-20 truncate md:max-w-none"
                                    >
                                        {item.label}
                                    </BreadcrumbLink>
                                {:else}
                                    <BreadcrumbPage
                                        class="font-medium max-w-20 truncate md:max-w-none"
                                    >
                                        {item.label}
                                    </BreadcrumbPage>
                                {/if}
                            </BreadcrumbItem>
                            {#if item.onClick}
                                <BreadcrumbSeparator />
                            {/if}
                        {/each}
                    {/if}
                </BreadcrumbList>
            </Breadcrumb>

            <!-- DetailView component -->
            <DetailView
                headline={currentDetailHeadline}
                parentChain={detailParentChain}
                selectedChild={detailSelectedChild}
                onHeadlineSelected={handleDetailHeadlineSelected}
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
                                onclick={() =>
                                    handleQuickAction(
                                        "view",
                                        undefined,
                                        openDetailView,
                                    )}
                            >
                                <Eye class="h-4 w-4 mr-2" />
                                View Details
                                <DropdownMenuShortcut
                                    >Enter</DropdownMenuShortcut
                                >
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onclick={() =>
                                    handleQuickAction(
                                        "open-editor",
                                        undefined,
                                        openDetailView,
                                    )}
                            >
                                <FileEdit class="h-4 w-4 mr-2" />
                                Open in Editor
                                <DropdownMenuShortcut>e</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onclick={() =>
                                    handleQuickAction(
                                        "mark-done",
                                        undefined,
                                        openDetailView,
                                    )}
                            >
                                <Check class="h-4 w-4 mr-2" />
                                Mark as Done
                                <DropdownMenuShortcut>d</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onclick={() =>
                                    handleQuickAction(
                                        "priority-up",
                                        undefined,
                                        openDetailView,
                                    )}
                            >
                                <ChevronUp class="h-4 w-4 mr-2" />
                                Increase Priority
                                <DropdownMenuShortcut>+</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onclick={() =>
                                    handleQuickAction(
                                        "priority-down",
                                        undefined,
                                        openDetailView,
                                    )}
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
                        {$quickLookHeadline
                            ? $quickLookHeadline.title.raw
                            : "Quick Look"}
                    </DrawerTitle>
                    <DrawerClose>
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={closeQuickLook}
                        >
                            <X class="h-4 w-4" />
                        </Button>
                    </DrawerClose>
                </DrawerHeader>
                <div class="p-4">
                    <DetailView
                        headline={$quickLookHeadline}
                        parentChain={[]}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    {:else}
        <div class="w-full h-64 flex items-center justify-center">
            <div class="text-center text-gray-600">No documents found</div>
        </div>
    {/if}
</div>
