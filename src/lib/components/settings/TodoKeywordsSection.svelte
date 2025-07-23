<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Input from "$lib/components/ui/input";
    import { Badge } from "$lib/components/ui/badge";
    import { Alert, AlertDescription } from "$lib/components/ui/alert";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Edit3,
        Trash2,
        ChevronLeft,
        ChevronRight,
        Plus,
        RotateCcw,
        Check,
        X,
        AlertCircle,
    } from "@lucide/svelte";
    import todoKeywords, {
        activeKeywords,
        closedKeywords,
        isLoading,
        error,
        editingIndex,
        addActiveKeyword,
        addClosedKeyword,
        removeActiveKeyword,
        removeClosedKeyword,
        editActiveKeyword,
        editClosedKeyword,
        moveActiveKeyword,
        moveClosedKeyword,
        setEditingActiveIndex,
        setEditingClosedIndex,
        resetToDefaults,
        clearError,
        loadTodoKeywords,
    } from "$lib/viewmodels/todo-keywords/todoKeywords.store";

    // Local state for adding new keywords
    let newActiveKeyword = $state("");
    let newClosedKeyword = $state("");
    let editingActiveValue = $state("");
    let editingClosedValue = $state("");

    // Input references for focus management
    let newActiveInput = $state<HTMLInputElement>();
    let newClosedInput = $state<HTMLInputElement>();
    let editActiveInput = $state<HTMLInputElement>();
    let editClosedInput = $state<HTMLInputElement>();

    // Load TODO keywords when component mounts
    onMount(() => {
        loadTodoKeywords();
    });

    // Handle adding new active keyword
    async function handleAddActiveKeyword() {
        if (newActiveKeyword.length > 0) {
            await addActiveKeyword(newActiveKeyword);
            newActiveKeyword = "";
        }
    }

    // Handle adding new closed keyword
    async function handleAddClosedKeyword() {
        if (newClosedKeyword.length > 0) {
            await addClosedKeyword(newClosedKeyword);
            newClosedKeyword = "";
        }
    }

    // Handle starting edit mode for active keyword
    function startEditingActive(index: number, currentValue: string) {
        editingActiveValue = currentValue;
        setEditingActiveIndex(index);
        // Focus the input after it's rendered
        setTimeout(() => {
            if (editActiveInput) {
                editActiveInput.focus();
                editActiveInput.select();
            }
        }, 0);
    }

    // Handle starting edit mode for closed keyword
    function startEditingClosed(index: number, currentValue: string) {
        editingClosedValue = currentValue;
        setEditingClosedIndex(index);
        // Focus the input after it's rendered
        setTimeout(() => {
            if (editClosedInput) {
                editClosedInput.focus();
                editClosedInput.select();
            }
        }, 0);
    }

    // Handle saving edited active keyword
    async function saveEditedActive(index: number) {
        if (editingActiveValue.length > 0) {
            await editActiveKeyword(index, editingActiveValue);
        } else {
            setEditingActiveIndex(null);
        }
        editingActiveValue = "";
    }

    // Handle saving edited closed keyword
    async function saveEditedClosed(index: number) {
        if (editingClosedValue.length > 0) {
            await editClosedKeyword(index, editingClosedValue);
        } else {
            setEditingClosedIndex(null);
        }
        editingClosedValue = "";
    }

    // Handle canceling edit mode
    function cancelEditing() {
        setEditingActiveIndex(null);
        setEditingClosedIndex(null);
        editingActiveValue = "";
        editingClosedValue = "";
    }

    // Handle keyboard events for inputs
    function handleKeydown(event: KeyboardEvent, action: () => void) {
        if (event.key === "Enter") {
            event.preventDefault();
            action();
        } else if (event.key === "Escape") {
            event.preventDefault();
            cancelEditing();
        }
    }

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

    // Reactive statements for accessing store values
    const activeList = $derived($activeKeywords);
    const closedList = $derived($closedKeywords);
    const loading = $derived($isLoading);
    const errorMessage = $derived($error);
    const editingIdx = $derived($editingIndex);
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2">
        <h3 class="text-lg font-semibold">TODO Keywords</h3>
        <p class="text-sm text-muted-foreground">
            Configure custom TODO states and keywords for your org-mode files.
            These keywords will be used to recognize headlines as TODO items,
            and be used to filter them from the sidebar.
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

    <!-- Active Keywords Section -->
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <h4 class="font-medium text-sm">Active Keywords</h4>
            <Badge variant="secondary" class="text-xs">
                {activeList.length} keywords
            </Badge>
        </div>

        <div
            class="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/20"
        >
            {#each activeList as keyword, index (keyword)}
                <div
                    class="flex items-center gap-1 bg-blue-100 text-blue-800 rounded-md px-3 py-1.5 text-sm"
                >
                    {#if editingIdx.active === index}
                        <!-- Edit mode -->
                        <Input.Root
                            bind:this={editActiveInput}
                            bind:value={editingActiveValue}
                            class="h-6 px-1 py-0 text-sm bg-white border-blue-300 min-w-[80px] max-w-[120px]"
                            onkeydown="{(e) =>
                                handleKeydown(e, () =>
                                    saveEditedActive(index),
                                )},"
                            type="text"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-blue-200"
                            onclick={() => saveEditedActive(index)}
                            disabled={loading}
                        >
                            <Check class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-blue-200"
                            onclick={cancelEditing}
                        >
                            <X class="h-3 w-3" />
                        </Button>
                    {:else}
                        <!-- Display mode -->
                        <span class="font-medium">{keyword}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-blue-200"
                            onclick={() => startEditingActive(index, keyword)}
                            disabled={loading}
                            title="Edit keyword"
                        >
                            <Edit3 class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-red-200 hover:text-red-700"
                            onclick={() => removeActiveKeyword(index)}
                            disabled={loading}
                            title="Remove keyword"
                        >
                            <Trash2 class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-blue-200"
                            onclick={() => moveActiveKeyword(index, -1)}
                            disabled={loading || index === 0}
                            title="Move left"
                        >
                            <ChevronLeft class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-blue-200"
                            onclick={() => moveActiveKeyword(index, 1)}
                            disabled={loading ||
                                index === activeList.length - 1}
                            title="Move right"
                        >
                            <ChevronRight class="h-3 w-3" />
                        </Button>
                    {/if}
                </div>
            {/each}

            <!-- Add new active keyword input -->
            <div class="flex items-center gap-1">
                <Input.Root
                    bind:this={newActiveInput}
                    bind:value={newActiveKeyword}
                    placeholder="Add keyword..."
                    class="h-8 px-2 text-sm min-w-[100px] max-w-[150px]"
                    onkeydown={(e) => handleKeydown(e, handleAddActiveKeyword)}
                    disabled={loading}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 px-2"
                    onclick={handleAddActiveKeyword}
                    disabled={loading || newActiveKeyword.length === 0}
                >
                    <Plus class="h-3 w-3" />
                </Button>
            </div>
        </div>
    </div>

    <!-- Separator -->
    <Separator />

    <!-- Closed Keywords Section -->
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <h4 class="font-medium text-sm">Closed Keywords</h4>
            <Badge variant="secondary" class="text-xs">
                {closedList.length} keywords
            </Badge>
        </div>

        <div
            class="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/20"
        >
            {#each closedList as keyword, index (keyword)}
                <div
                    class="flex items-center gap-1 bg-green-100 text-green-800 rounded-md px-3 py-1.5 text-sm"
                >
                    {#if editingIdx.closed === index}
                        <!-- Edit mode -->
                        <Input.Root
                            bind:this={editClosedInput}
                            bind:value={editingClosedValue}
                            class="h-6 px-1 py-0 text-sm bg-white border-green-300 min-w-[80px] max-w-[120px]"
                            onkeydown={(e) =>
                                handleKeydown(e, () => saveEditedClosed(index))}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-green-200"
                            onclick={() => saveEditedClosed(index)}
                            disabled={loading}
                        >
                            <Check class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-green-200"
                            onclick={cancelEditing}
                        >
                            <X class="h-3 w-3" />
                        </Button>
                    {:else}
                        <!-- Display mode -->
                        <span class="font-medium">{keyword}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-green-200"
                            onclick={() => startEditingClosed(index, keyword)}
                            disabled={loading}
                            title="Edit keyword"
                        >
                            <Edit3 class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-red-200 hover:text-red-700"
                            onclick={() => removeClosedKeyword(index)}
                            disabled={loading}
                            title="Remove keyword"
                        >
                            <Trash2 class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-green-200"
                            onclick={() => moveClosedKeyword(index, -1)}
                            disabled={loading || index === 0}
                            title="Move left"
                        >
                            <ChevronLeft class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-green-200"
                            onclick={() => moveClosedKeyword(index, 1)}
                            disabled={loading ||
                                index === closedList.length - 1}
                            title="Move right"
                        >
                            <ChevronRight class="h-3 w-3" />
                        </Button>
                    {/if}
                </div>
            {/each}

            <!-- Add new closed keyword input -->
            <div class="flex items-center gap-1">
                <Input.Root
                    bind:this={newClosedInput}
                    bind:value={newClosedKeyword}
                    placeholder="Add keyword..."
                    class="h-8 px-2 text-sm min-w-[100px] max-w-[150px]"
                    onkeydown={(e) => handleKeydown(e, handleAddClosedKeyword)}
                    disabled={loading}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 px-2"
                    onclick={handleAddClosedKeyword}
                    disabled={loading || newClosedKeyword.length === 0}
                >
                    <Plus class="h-3 w-3" />
                </Button>
            </div>
        </div>
    </div>

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
                        Reset TODO Keywords
                    </h3>
                    <p class="text-sm text-muted-foreground mb-4">
                        Are you sure you want to reset TODO keywords to
                        defaults? This will remove any custom keywords you have
                        added.
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
            <strong>Active keywords</strong> represent open tasks (like TODO,
            IN-PROGRESS, WAITING).
            <strong>Closed keywords</strong> represent completed tasks (like DONE,
            CANCELLED). Use the buttons to edit, remove, or reorder keywords. New
            keywords are added at the end of each list.
        </p>
    </div>
</div>
