<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Input from "$lib/components/ui/input";
    import { Badge } from "$lib/components/ui/badge";
    import { Alert, AlertDescription } from "$lib/components/ui/alert";
    import * as Select from "$lib/components/ui/select";
    import { Label } from "$lib/components/ui/label";
    import {
        ExternalLink,
        RotateCcw,
        X,
        AlertCircle,
        Info,
        Copy,
    } from "@lucide/svelte";
    import externalEditor, {
        command,
        isLoading,
        error,
        loadExternalEditorCommand,
        setExternalEditorCommand,
        resetExternalEditorCommand,
        clearError,
        editorPresets,
    } from "$lib/viewmodels/externalEditor.store";

    // Local state
    let editingCommand = $state("");
    let showPresets = $state(false);
    let commandInput = $state<HTMLInputElement>();

    // Load external editor command when component mounts
    onMount(() => {
        loadExternalEditorCommand();
    });

    // Reactive statements for accessing store values
    const currentCommand = $derived($command);
    const loading = $derived($isLoading);
    const errorMessage = $derived($error);

    // Initialize editing command when current command changes
    $effect(() => {
        if (currentCommand) {
            editingCommand = currentCommand;
        }
    });

    // Handle saving command (auto-save)
    async function handleSaveCommand() {
        if (editingCommand.trim() !== currentCommand) {
            await setExternalEditorCommand(editingCommand.trim());
        }
    }

    // Handle preset selection
    function handlePresetSelect(preset: string) {
        editingCommand = editorPresets[preset as keyof typeof editorPresets];
        showPresets = false;
        // Auto-save when preset is selected
        setTimeout(() => handleSaveCommand(), 100);
    }

    // Auto-save when command changes (debounced)
    let saveTimeout: number;
    $effect(() => {
        if (
            editingCommand.trim() !== currentCommand &&
            editingCommand.trim().length > 0
        ) {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                handleSaveCommand();
            }, 1000); // 1 second debounce
        }
    });

    // Handle reset to defaults
    let showResetConfirmDialog = $state(false);

    function handleResetToDefault() {
        showResetConfirmDialog = true;
    }

    async function confirmReset() {
        showResetConfirmDialog = false;
        await resetExternalEditorCommand();
    }

    function cancelReset() {
        showResetConfirmDialog = false;
    }

    // Handle keyboard events
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSaveCommand();
        } else if (event.key === "Escape") {
            event.preventDefault();
            editingCommand = currentCommand;
        }
    }

    // Check if command has changed
    const hasChanges = $derived(editingCommand.trim() !== currentCommand);

    // Check if command is being saved
    const isSaving = $derived(loading && hasChanges);

    // Placeholder information
    const placeholders = [
        { name: "{file}", description: "Full path to the file" },
        { name: "{line}", description: "Line number (defaults to 1)" },
        { name: "{column}", description: "Column number (defaults to 1)" },
    ];

    // Copy command to clipboard
    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
        }
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2">
        <h3 class="text-lg font-semibold flex items-center gap-2">
            <ExternalLink class="h-5 w-5" />
            External Editor Command
        </h3>
        <p class="text-sm text-muted-foreground">
            Configure the shell command used to open files in your preferred
            external editor. Use placeholders to specify file location and
            cursor position.
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

    <!-- Command Input Section -->
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <Label for="editor-command" class="font-medium text-sm">
                Editor Command
            </Label>
            <Badge variant="secondary" class="text-xs">
                {isSaving ? "Saving..." : hasChanges ? "Modified" : "Saved"}
            </Badge>
        </div>

        <div class="space-y-2">
            <div class="flex gap-2">
                <Input.Root
                    id="editor-command"
                    bind:this={commandInput}
                    bind:value={editingCommand}
                    placeholder="Enter your editor command..."
                    class="flex-1 font-mono text-sm"
                    onkeydown={handleKeydown}
                    disabled={loading}
                />
                <Button
                    variant="outline"
                    size="sm"
                    onclick={() => (showPresets = !showPresets)}
                    disabled={loading}
                    class="whitespace-nowrap"
                >
                    Presets
                </Button>
            </div>

            <!-- Preset Selection -->
            {#if showPresets}
                <div class="border rounded-lg p-3 bg-muted/20">
                    <h4 class="font-medium text-sm mb-2">Editor Presets</h4>
                    <div class="space-y-2">
                        {#each Object.entries(editorPresets) as [name, preset]}
                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={() => handlePresetSelect(name)}
                                class="w-full justify-start font-mono text-xs h-auto py-3 px-3 min-h-0"
                                disabled={loading}
                            >
                                <div class="text-left w-full min-w-0">
                                    <div class="font-semibold capitalize mb-1">
                                        {name}
                                    </div>
                                    <div
                                        class="text-muted-foreground text-wrap break-all leading-relaxed"
                                    >
                                        {preset}
                                    </div>
                                </div>
                            </Button>
                        {/each}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => (showPresets = false)}
                        class="w-full mt-2"
                    >
                        Close Presets
                    </Button>
                </div>
            {/if}
        </div>
    </div>

    <!-- Placeholder Information -->
    <div class="space-y-3">
        <h4 class="font-medium text-sm flex items-center gap-2">
            <Info class="h-4 w-4" />
            Available Placeholders
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            {#each placeholders as placeholder}
                <div class="border rounded-lg p-3 bg-muted/10">
                    <div class="flex items-center justify-between mb-1">
                        <code
                            class="text-sm font-mono bg-muted px-2 py-1 rounded"
                        >
                            {placeholder.name}
                        </code>
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => copyToClipboard(placeholder.name)}
                            class="h-6 w-6 p-0"
                            title="Copy placeholder"
                        >
                            <Copy class="h-3 w-3" />
                        </Button>
                    </div>
                    <p class="text-xs text-muted-foreground">
                        {placeholder.description}
                    </p>
                </div>
            {/each}
        </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-between items-center pt-4">
        <Button
            variant="outline"
            size="sm"
            onclick={handleResetToDefault}
            disabled={loading}
            class="text-muted-foreground hover:text-foreground"
        >
            <RotateCcw class="h-4 w-4 mr-2" />
            Reset to Default
        </Button>

        <!-- Reset Confirmation Dialog -->
        {#if showResetConfirmDialog}
            <div
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
                <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold mb-2">
                        Reset External Editor Command
                    </h3>
                    <p class="text-sm text-muted-foreground mb-4">
                        Are you sure you want to reset the external editor
                        command to the default? This will change it back to:
                    </p>
                    <code
                        class="text-xs bg-muted p-2 rounded block mb-4 font-mono"
                    >
                        emacsclient --no-wait +{"{line}"}:{"{column}"}
                        {"{file}"}
                    </code>
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
                            Reset to Default
                        </Button>
                    </div>
                </div>
            </div>
        {/if}

        <div class="text-xs text-muted-foreground">
            Changes are saved automatically
        </div>
    </div>

    <!-- Help Text -->
    <div class="mt-6 p-4 bg-muted/20 rounded-lg">
        <p class="text-sm text-muted-foreground">
            <strong>How it works:</strong> When you click "Open in Editor" on
            any file, Org-X will execute this command with the placeholders
            replaced by actual values. The
            <code class="bg-muted px-1 rounded">{"{file}"}</code>
            placeholder is required, while
            <code class="bg-muted px-1 rounded">{"{line}"}</code>
            and
            <code class="bg-muted px-1 rounded">{"{column}"}</code> are optional
            but recommended for precise cursor positioning.
        </p>
    </div>
</div>
