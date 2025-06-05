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
    import X from "@lucide/svelte/icons/x";

    // Svelte 5 state management with runes
    let documents = $state<OrgDocument[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Track if there are any monitored paths
    let hasMonitoredPaths = $state(true);

    // Document lookup map for efficient document access
    let documentMap = $state<Map<string, OrgDocument>>(new Map());

    // Keyboard navigation state
    let focusedIndex = $state<number>(-1); // -1 means no focus
    let filteredHeadlines = $state<OrgHeadline[]>([]);
    let allHeadlines = $state<OrgHeadline[]>([]);
    const filterOptions = ["all", "today", "week", "overdue"];
    let activeFilterIndex = $state(0); // Default to 'all'

    // Refresh flag for monitoring changes
    let refreshTrigger = $state(0);

    // Expose refresh function globally for monitoring sidebar
    if (typeof window !== "undefined") {
        (window as any).refreshListView = refreshDocuments;
    }

    let showQuickActions = $state(false);
    let selectedHeadline = $state<OrgHeadline | null>(null);
    let showDetailView = $state(false);
    let showQuickLook = $state(false);

    // Unified refresh logic: always checks monitored paths and loads documents
    async function refreshDocuments() {
        loading = true;
        error = null;

        // Always check monitored paths
        try {
            const settingsResult = await commands.loadUserSettings();
            if (
                settingsResult.status === "ok" &&
                settingsResult.data.monitored_paths.length === 0
            ) {
                hasMonitoredPaths = false;
                loading = false;
                documents = [];
                allHeadlines = [];
                documentMap = new Map();
                return;
            } else if (settingsResult.status === "ok") {
                hasMonitoredPaths = true;
            } else {
                hasMonitoredPaths = false;
                loading = false;
                documents = [];
                allHeadlines = [];
                documentMap = new Map();
                return;
            }
        } catch (e) {
            hasMonitoredPaths = false;
            loading = false;
            documents = [];
            allHeadlines = [];
            documentMap = new Map();
            return;
        }

        // If monitored paths exist, load documents as before
        try {
            loading = true;
            error = null;

            console.log("📡 Starting file monitoring...");
            const monitorResult = await commands.startFileMonitoring();

            if (monitorResult.status === "error") {
                console.warn("File monitoring failed:", monitorResult.error);
                // Continue anyway - may have some documents from previous sessions
            }

            console.log("📚 Loading documents...");
            // Retry loading documents with exponential backoff
            let retryCount = 0;
            const maxRetries = 5;
            let docs: any[] = [];

            while (retryCount < maxRetries) {
                const docsResult = await commands.getAllDocuments();

                if (docsResult.status === "error") {
                    console.warn(
                        `Attempt ${retryCount + 1} failed:`,
                        docsResult.error,
                    );
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        error = docsResult.error;
                        loading = false;
                        return;
                    }
                    await new Promise((resolve) =>
                        setTimeout(resolve, Math.pow(2, retryCount) * 1000),
                    );
                    continue;
                }

                docs = docsResult.data || [];
                if (docs.length > 0) {
                    break; // Successfully loaded documents
                }

                retryCount++;
                if (retryCount >= maxRetries) {
                    console.log(
                        "No documents found - this is normal when no monitoring paths are configured",
                    );
                    break;
                }

                await new Promise((resolve) =>
                    setTimeout(resolve, Math.pow(2, retryCount) * 1000),
                );
            }

            documents = docs;
            documentMap = new Map(docs.map((doc) => [doc.id, doc]));
            allHeadlines = documents.flatMap((doc) => doc.headlines);

            console.log(
                `✅ Loaded ${documents.length} documents, ${allHeadlines.length} headlines`,
            );
            loading = false;
        } catch (err) {
            console.error("Error:", err);
            error = String(err);
            loading = false;
        }
    }

    // Set global refresh function
    if (typeof window !== "undefined") {
        (window as any).refreshListView = refreshDocuments;
    }

    onMount(() => {
        console.log("🚀 ListView onMount called");
        refreshDocuments();
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    });

    // Handle keyboard navigation
    function handleKeyDown(event: KeyboardEvent) {
        // Only handle keyboard events when documents are loaded
        if (documents.length === 0 || loading) return;

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
            } else if (showQuickLook) {
                showQuickLook = false;
            }
        } else if (event.key === "Enter" || event.key === "o") {
            // Open detail view for the selected headline
            event.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredHeadlines.length) {
                selectedHeadline = filteredHeadlines[focusedIndex];
                showDetailView = true;
                showQuickActions = false;
            }
        } else if (event.key == " ") {
            // Toggle quick look view with spacebar
            event.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredHeadlines.length) {
                if (showQuickLook) {
                    showQuickLook = false;
                    selectedHeadline = null;
                } else {
                    selectedHeadline = filteredHeadlines[focusedIndex];
                    showQuickLook = true;
                    showDetailView = false;
                    showQuickActions = false;
                }
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
                if (selectedHeadline) {
                    // Find the document that contains this headline
                    const parentDocument = documents.find(
                        (doc) => doc.id === selectedHeadline!.document_id,
                    );
                    if (parentDocument?.file_path) {
                        console.log(
                            "Opening file in external editor:",
                            parentDocument.file_path,
                        );
                        // In a real implementation, we would use the tauri-plugin-opener
                        // For this demo, we'll just log the intention
                    }
                }
                break;
        }

        showQuickActions = false;
    }
</script>

<div class="w-full h-full p-4">
    {#if error}
        <div
            class="p-4 border border-red-500 bg-red-50 text-red-700 rounded mb-4"
        >
            Error: {error}
        </div>
    {:else if loading && hasMonitoredPaths}
        <div class="w-full h-64 flex items-center justify-center">
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"
            ></div>
        </div>
    {:else if !hasMonitoredPaths}
        <div
            class="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200"
        >
            No monitored paths configured.<br />
            Please add a file or directory in the sidebar to get started.
        </div>
    {:else if documents.length > 0}
        {#if !showDetailView}
            <div class="mb-6">
                <h2 class="text-2xl font-semibold mb-2">
                    {documents.length > 1
                        ? `${documents.length} Documents`
                        : documents[0].title}
                </h2>

                <div class="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div class="flex items-center gap-1">
                        <File class="h-4 w-4" />
                        <span
                            >{documents.length} file{documents.length !== 1
                                ? "s"
                                : ""} loaded</span
                        >
                    </div>

                    <div class="flex items-center gap-1">
                        <Tag class="h-4 w-4" />
                        <span>{allHeadlines.length} headlines total</span>
                    </div>
                </div>

                {#if documents.length > 1}
                    <div class="mb-4">
                        <h3 class="text-sm font-medium text-gray-700 mb-2">
                            Loaded Documents:
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            {#each documents as doc}
                                <Badge variant="outline" class="text-xs">
                                    {doc.title || doc.id}
                                </Badge>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <div class={showDetailView ? "" : "w-full min-w-0 flex-1"}>
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
                            >Space</kbd
                        >
                        Quick look,
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
                        headlines={allHeadlines}
                        {loading}
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

            <Drawer
                open={showQuickLook}
                onOpenChange={(open) => {
                    showQuickLook = open;
                    if (!open) selectedHeadline = null;
                }}
            >
                <DrawerContent class="max-h-[80vh] overflow-y-auto">
                    <DrawerHeader
                        class="flex justify-between items-center border-b pb-4"
                    >
                        <DrawerTitle
                            class="text-xl font-semibold text-gray-800"
                        >
                            Task Details
                        </DrawerTitle>
                        <DrawerClose>
                            <Button variant="ghost" size="sm">
                                <X class="h-4 w-4" />
                                Close
                            </Button>
                        </DrawerClose>
                    </DrawerHeader>
                    <div class="p-4">
                        <DetailView headline={selectedHeadline} />
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    {:else}
        <div
            class="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200"
        >
            No documents loaded. Make sure you have added some documents.
        </div>
    {/if}
</div>
