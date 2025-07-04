<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Input from "$lib/components/ui/input";
    import { Badge } from "$lib/components/ui/badge";
    import { Alert, AlertDescription } from "$lib/components/ui/alert";
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
    import customProperties, {
        properties,
        isLoading,
        error,
        editingIndex,
        addCustomProperty,
        removeCustomProperty,
        editCustomProperty,
        moveCustomProperty,
        setEditingIndex,
        resetToDefaults,
        clearError,
        loadCustomProperties,
    } from "$lib/viewmodels/custom-properties/customProperties.store";

    // Local state for adding new properties
    let newProperty = $state("");
    let editingValue = $state("");

    // Input references for focus management
    let newPropertyInput = $state<HTMLInputElement>();
    let editPropertyInput = $state<HTMLInputElement>();

    // Load custom properties when component mounts
    onMount(() => {
        loadCustomProperties();
    });

    // Handle adding new property
    async function handleAddProperty() {
        if (newProperty.trim().length > 0) {
            await addCustomProperty(newProperty.trim());
            newProperty = "";
        }
    }

    // Handle starting edit mode for property
    function startEditing(index: number, currentValue: string) {
        editingValue = currentValue;
        setEditingIndex(index);
        // Focus the input after it's rendered
        setTimeout(() => {
            if (editPropertyInput) {
                editPropertyInput.focus();
                editPropertyInput.select();
            }
        }, 0);
    }

    // Handle saving edited property
    async function saveEdited(index: number) {
        if (editingValue.trim().length > 0) {
            await editCustomProperty(index, editingValue.trim());
        } else {
            setEditingIndex(null);
        }
        editingValue = "";
    }

    // Handle canceling edit mode
    function cancelEditing() {
        setEditingIndex(null);
        editingValue = "";
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
    const propertiesList = $derived($properties);
    const loading = $derived($isLoading);
    const errorMessage = $derived($error);
    const editingIdx = $derived($editingIndex);
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2">
        <h3 class="text-lg font-semibold">Custom Headline Properties</h3>
        <p class="text-sm text-muted-foreground">
            Configure custom properties that can be used in org-mode headlines.
            These properties will be used to filter headlines from the sidebar.
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

    <!-- Custom Properties Section -->
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <h4 class="font-medium text-sm">Properties</h4>
            <Badge variant="secondary" class="text-xs">
                {propertiesList.length} properties
            </Badge>
        </div>

        <div
            class="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/20"
        >
            {#each propertiesList as property, index (property)}
                <div
                    class="flex items-center gap-1 bg-purple-100 text-purple-800 rounded-md px-3 py-1.5 text-sm"
                >
                    {#if editingIdx === index}
                        <!-- Edit mode -->
                        <Input.Root
                            bind:this={editPropertyInput}
                            bind:value={editingValue}
                            class="h-6 px-1 py-0 text-sm bg-white border-purple-300 min-w-[80px] max-w-[120px]"
                            onkeydown={(e) =>
                                handleKeydown(e, () => saveEdited(index))}
                            type="text"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-purple-200"
                            onclick={() => saveEdited(index)}
                            disabled={loading}
                        >
                            <Check class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-purple-200"
                            onclick={cancelEditing}
                        >
                            <X class="h-3 w-3" />
                        </Button>
                    {:else}
                        <!-- Display mode -->
                        <span class="font-medium">{property}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-purple-200"
                            onclick={() => startEditing(index, property)}
                            disabled={loading}
                            title="Edit property"
                        >
                            <Edit3 class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-red-200 hover:text-red-700"
                            onclick={() => removeCustomProperty(index)}
                            disabled={loading}
                            title="Remove property"
                        >
                            <Trash2 class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-purple-200"
                            onclick={() => moveCustomProperty(index, -1)}
                            disabled={loading || index === 0}
                            title="Move left"
                        >
                            <ChevronLeft class="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-5 w-5 p-0 hover:bg-purple-200"
                            onclick={() => moveCustomProperty(index, 1)}
                            disabled={loading ||
                                index === propertiesList.length - 1}
                            title="Move right"
                        >
                            <ChevronRight class="h-3 w-3" />
                        </Button>
                    {/if}
                </div>
            {/each}

            <!-- Add new property input -->
            <div class="flex items-center gap-1">
                <Input.Root
                    bind:this={newPropertyInput}
                    bind:value={newProperty}
                    placeholder="Add property..."
                    class="h-8 px-2 text-sm min-w-[100px] max-w-[150px]"
                    onkeydown={(e) => handleKeydown(e, handleAddProperty)}
                    disabled={loading}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 px-2"
                    onclick={handleAddProperty}
                    disabled={loading || newProperty.trim().length === 0}
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
                        Reset Custom Properties
                    </h3>
                    <p class="text-sm text-muted-foreground mb-4">
                        Are you sure you want to reset custom properties to
                        defaults? This will remove any custom properties you
                        have added.
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
            <strong>Custom properties</strong> can be used in org-mode headlines
            to add metadata like Effort, Priority, or custom tags. Use the buttons
            to edit, remove, or reorder properties. New properties are added at the
            end of the list.
        </p>
    </div>
</div>
