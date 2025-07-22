<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Select from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import { Alert, AlertDescription } from "$lib/components/ui/alert";
    import {
        Edit3,
        Trash2,
        ChevronLeft,
        ChevronRight,
        RotateCcw,
        X,
        AlertCircle,
        Table,
        Eye,
        EyeOff,
    } from "@lucide/svelte";
    import tableColumns, {
        columns,
        availableColumns,
        visibleColumns,
        isLoading,
        error,
        loadTableColumns,
        addColumn,
        removeColumn,
        toggleColumnVisibility,
        moveColumn,
        resetToDefaults,
        availableColumnsToAdd,
        availableBuiltInColumnsToAdd,
        availableCustomPropertiesToAdd,
        clearError,
        type TableColumnConfig,
    } from "$lib/viewmodels/table-columns/tableColumns.store";

    // Load table columns when component mounts
    onMount(async () => {
        console.log("TableColumnsSection: Loading table columns...");
        await loadTableColumns();
        console.log("TableColumnsSection: Table columns loaded");
    });

    // Selected column for adding - reactive to immediate selection
    let selectedColumnToAdd = $state<string | undefined>(undefined);

    // Handle immediate column addition when selected
    $effect(() => {
        if (selectedColumnToAdd) {
            console.log("Adding column immediately:", selectedColumnToAdd);
            addColumn(selectedColumnToAdd).then(() => {
                // Reset selection after adding
                selectedColumnToAdd = undefined;
            });
        }
    });

    // Handle reset to defaults with proper confirmation
    let showResetConfirmDialog = $state(false);

    function handleResetToDefaults() {
        showResetConfirmDialog = true;
    }

    function confirmReset() {
        showResetConfirmDialog = false;
        resetToDefaults();
    }

    function cancelReset() {
        showResetConfirmDialog = false;
    }

    // Get column display name
    function getColumnDisplayName(columnId: string): string {
        if (columnId.startsWith("property:")) {
            return columnId.replace("property:", "");
        }

        switch (columnId) {
            case "status":
                return "Status";
            case "title":
                return "Title";
            case "document":
                return "Document";
            case "tags":
                return "Tags";
            case "date":
                return "Date";
            default:
                return columnId;
        }
    }

    // Get column color class
    function getColumnColorClass(columnId: string): string {
        if (columnId.startsWith("property:")) {
            return "bg-purple-100 text-purple-800";
        }

        switch (columnId) {
            case "status":
                return "bg-blue-100 text-blue-800";
            case "title":
                return "bg-green-100 text-green-800";
            case "document":
                return "bg-orange-100 text-orange-800";
            case "tags":
                return "bg-pink-100 text-pink-800";
            case "date":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    }

    // Reactive statements for accessing store values
    const columnsList = $derived($columns);
    const visibleColumnsList = $derived($visibleColumns);
    const loading = $derived($isLoading);
    const errorMessage = $derived($error);

    // Use the new derived stores from the store for reliable reactivity
    const builtInColumnsToAdd = $derived($availableBuiltInColumnsToAdd);
    const customPropertiesToAdd = $derived($availableCustomPropertiesToAdd);
    const hasLoadedData = $derived(
        $columns.length > 0 || $availableColumns.length > 0,
    );

    // Debug logging with simplified state
    $effect(() => {
        console.log("TableColumnsSection state:", {
            timestamp: new Date().toISOString(),
            columns: $columns?.length || 0,
            availableColumns: $availableColumns?.length || 0,
            availableToAdd: $availableColumnsToAdd?.length || 0,
            builtInToAdd: builtInColumnsToAdd?.length || 0,
            customToAdd: customPropertiesToAdd?.length || 0,
            loading: $isLoading,
            error: $error,
        });
    });
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2">
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <Table class="h-5 w-5" />
            Table Columns
        </h3>
        <p class="text-sm text-muted-foreground">
            Configure which columns are displayed in the task list table. You
            can add, remove, and reorder columns to customize your view.
        </p>
    </div>

    <!-- Error Alert -->
    {#if errorMessage}
        <Alert variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription class="flex items-center justify-between">
                <span>{errorMessage}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onclick={clearError}
                    class="h-6 px-2"
                >
                    <X class="h-3 w-3" />
                </Button>
            </AlertDescription>
        </Alert>
    {/if}

    <!-- Visible Columns Section -->
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <h4 class="font-medium text-sm">Visible Columns</h4>
            <Badge variant="secondary" class="text-xs">
                {visibleColumnsList.length} visible
            </Badge>
        </div>

        <div
            class="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/20"
        >
            {#each visibleColumnsList as column, index (column.id)}
                <div
                    class="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm {getColumnColorClass(
                        column.id,
                    )}"
                >
                    <span class="font-medium"
                        >{getColumnDisplayName(column.id)}</span
                    >

                    <!-- Hide/Show button -->
                    <Button
                        variant="ghost"
                        size="sm"
                        class="h-5 w-5 p-0 hover:bg-black/10"
                        onclick={() => toggleColumnVisibility(column.id)}
                        disabled={loading}
                        title="Hide column"
                    >
                        <EyeOff class="h-3 w-3" />
                    </Button>

                    <!-- Remove button -->
                    <Button
                        variant="ghost"
                        size="sm"
                        class="h-5 w-5 p-0 hover:bg-red-200 hover:text-red-700"
                        onclick={() =>
                            removeColumn(
                                columnsList.findIndex(
                                    (c) => c.id === column.id,
                                ),
                            )}
                        disabled={loading || visibleColumnsList.length <= 1}
                        title="Remove column"
                    >
                        <Trash2 class="h-3 w-3" />
                    </Button>

                    <!-- Move left button -->
                    <Button
                        variant="ghost"
                        size="sm"
                        class="h-5 w-5 p-0 hover:bg-black/10"
                        onclick={() =>
                            moveColumn(
                                columnsList.findIndex(
                                    (c) => c.id === column.id,
                                ),
                                -1,
                            )}
                        disabled={loading || index === 0}
                        title="Move left"
                    >
                        <ChevronLeft class="h-3 w-3" />
                    </Button>

                    <!-- Move right button -->
                    <Button
                        variant="ghost"
                        size="sm"
                        class="h-5 w-5 p-0 hover:bg-black/10"
                        onclick={() =>
                            moveColumn(
                                columnsList.findIndex(
                                    (c) => c.id === column.id,
                                ),
                                1,
                            )}
                        disabled={loading ||
                            index === visibleColumnsList.length - 1}
                        title="Move right"
                    >
                        <ChevronRight class="h-3 w-3" />
                    </Button>
                </div>
            {/each}

            <!-- Add column dropdown with immediate selection -->
            {#if $availableColumnsToAdd.length > 0}
                <div class="flex items-center gap-1">
                    <Select.Root type="single" bind:value={selectedColumnToAdd}>
                        <Select.Trigger
                            class="h-8 min-w-[120px] max-w-[180px]"
                            disabled={loading}
                        >
                            {selectedColumnToAdd
                                ? getColumnDisplayName(selectedColumnToAdd)
                                : loading || !hasLoadedData
                                  ? "Loading..."
                                  : "Add column..."}
                        </Select.Trigger>
                        <Select.Content>
                            <!-- Built-in columns -->
                            {#if builtInColumnsToAdd.length > 0}
                                <Select.Group>
                                    <Select.Label>Built-in Columns</Select.Label
                                    >
                                    {#each builtInColumnsToAdd as columnId}
                                        <Select.Item value={columnId}>
                                            {getColumnDisplayName(columnId)}
                                        </Select.Item>
                                    {/each}
                                </Select.Group>
                            {/if}

                            <!-- Custom properties -->
                            {#if customPropertiesToAdd.length > 0}
                                <Select.Group>
                                    <Select.Label
                                        >Custom Properties</Select.Label
                                    >
                                    {#each customPropertiesToAdd as columnId}
                                        <Select.Item value={columnId}>
                                            {getColumnDisplayName(columnId)}
                                        </Select.Item>
                                    {/each}
                                </Select.Group>
                            {/if}
                        </Select.Content>
                    </Select.Root>
                </div>
            {:else if !loading && hasLoadedData}
                <div class="text-xs text-muted-foreground italic">
                    All columns are already visible
                </div>
            {/if}
        </div>
    </div>

    <!-- Hidden Columns Section (if any) -->
    {#if columnsList.filter((col) => !col.visible).length > 0}
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h4 class="font-medium text-sm text-muted-foreground">
                    Hidden Columns
                </h4>
                <Badge variant="outline" class="text-xs">
                    {columnsList.filter((col) => !col.visible).length} hidden
                </Badge>
            </div>

            <div
                class="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/10"
            >
                {#each columnsList.filter((col) => !col.visible) as column (column.id)}
                    <div
                        class="flex items-center gap-1 bg-gray-100 text-gray-600 rounded-md px-3 py-1.5 text-sm opacity-75"
                    >
                        <span class="font-medium"
                            >{getColumnDisplayName(column.id)}</span
                        >

                        <!-- Show button -->
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-gray-200"
                            onclick={() => toggleColumnVisibility(column.id)}
                            disabled={loading}
                            title="Show column"
                        >
                            <Eye class="h-3 w-3" />
                        </Button>

                        <!-- Remove button -->
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-red-200 hover:text-red-700"
                            onclick={() =>
                                removeColumn(
                                    columnsList.findIndex(
                                        (c) => c.id === column.id,
                                    ),
                                )}
                            disabled={loading}
                            title="Remove column"
                        >
                            <Trash2 class="h-3 w-3" />
                        </Button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Actions -->
    <div class="flex justify-between items-center pt-4">
        <Button
            variant="outline"
            size="sm"
            onclick={handleResetToDefaults}
            disabled={loading}
            class="text-muted-foreground hover:text-foreground"
        >
            <RotateCcw class="h-4 w-4 mr-2" />
            Reset to Defaults
        </Button>

        <!-- Reset Confirmation Dialog -->
        {#if showResetConfirmDialog}
            <div
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
                <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold mb-2">
                        Reset Table Columns
                    </h3>
                    <p class="text-sm text-muted-foreground mb-4">
                        Are you sure you want to reset table columns to
                        defaults? This will restore the default columns (Status,
                        Title, Document, Tags, Date) and remove any custom
                        column configurations.
                    </p>
                    <div class="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={cancelReset}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onclick={confirmReset}
                        >
                            Reset to Defaults
                        </Button>
                    </div>
                </div>
            </div>
        {/if}

        <div class="text-xs text-muted-foreground">
            {#if loading}
                Saving changes...
            {:else}
                Changes are saved automatically
            {/if}
        </div>
    </div>

    <!-- Help Text -->
    <div class="mt-6 p-4 bg-muted/20 rounded-lg">
        <p class="text-sm text-muted-foreground">
            <strong>Table columns</strong> determine what information is displayed
            in the task list. Built-in columns include Status, Title, Document, Tags,
            and Date. Custom properties defined in your org files can also be added
            as columns. Use the eye icons to show/hide columns, and the arrow buttons
            to reorder them.
        </p>
    </div>
</div>
