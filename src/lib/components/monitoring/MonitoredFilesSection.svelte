<script lang="ts">
    import { commands } from "$lib/bindings";
    import type { UserSettings, MonitoredPath, PathType } from "$lib/bindings";
    import * as Button from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";

    import * as Switch from "$lib/components/ui/switch";
    import * as Input from "$lib/components/ui/input";
    import * as Label from "$lib/components/ui/label";
    import { Badge } from "$lib/components/ui/badge";
    import { Trash2, FolderPlus, FilePlus, Folder, File } from "@lucide/svelte";
    import { open } from "@tauri-apps/plugin-dialog";

    interface Props {
        settings: UserSettings;
        onSettingsUpdate: (settings: UserSettings) => void;
    }

    let { settings, onSettingsUpdate }: Props = $props();

    let addDialogOpen = $state(false);
    let newPathInput = $state("");
    let newPathType: PathType = $state("Directory");
    let adding = $state(false);
    let error: string | null = $state(null);

    // Compute monitored files from paths
    let monitoredFiles = $derived.by(() => {
        // Show the paths directly from settings
        return settings.monitored_paths.map((monitoredPath) => ({
            path: monitoredPath.path,
            path_type: monitoredPath.path_type,
            parse_enabled: monitoredPath.parse_enabled,
        }));
    });

    async function openPathPicker() {
        try {
            const selected = await open({
                directory: newPathType === "Directory",
                multiple: false,
                title: `Select ${newPathType.toLowerCase()} to monitor`,
            });

            if (selected && typeof selected === "string") {
                newPathInput = selected;
            }
        } catch (err) {
            console.error("Failed to open path picker:", err);
        }
    }

    async function addMonitoredPath() {
        if (!newPathInput.trim()) return;

        try {
            adding = true;
            error = null;

            const newPath: MonitoredPath = {
                path: newPathInput.trim(),
                path_type: newPathType,
                parse_enabled: true,
            };

            const result = await commands.addMonitoredPath(newPath);
            if (result.status === "ok") {
                onSettingsUpdate(result.data);
                addDialogOpen = false;
                newPathInput = "";
                newPathType = "Directory";
            } else {
                error = result.error;
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "Unknown error";
        } finally {
            adding = false;
        }
    }

    async function removeMonitoredPath(path: string) {
        try {
            const result = await commands.removeMonitoredPath(path);
            if (result.status === "ok") {
                onSettingsUpdate(result.data);
            }
        } catch (err) {
            console.error("Failed to remove path:", err);
        }
    }

    async function togglePathParseEnabled(path: string, parseEnabled: boolean) {
        try {
            const result = await commands.setPathParseEnabled(path, parseEnabled);
            if (result.status === "ok") {
                onSettingsUpdate(result.data);
            }
        } catch (err) {
            console.error("Failed to toggle path parse:", err);
        }
    }
</script>

<div class="space-y-2">
    <!-- Add Path Button -->
    <Dialog.Root bind:open={addDialogOpen}>
        <Dialog.Trigger>
            <Button.Root variant="outline" size="sm" class="w-full">
                <FolderPlus class="h-4 w-4 mr-2" />
                Add Path
            </Button.Root>
        </Dialog.Trigger>
        <Dialog.Content class="sm:max-w-md">
            <Dialog.Header>
                <Dialog.Title>Add Monitored Path</Dialog.Title>
                <Dialog.Description>
                    Add a file or directory to monitor for org-mode files.
                </Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 py-4">
                <div class="space-y-2">
                    <Label.Root>Type</Label.Root>
                    <div class="flex gap-2">
                        <Button.Root
                            variant={newPathType === "File"
                                ? "default"
                                : "outline"}
                            size="sm"
                            onclick={() => (newPathType = "File")}
                        >
                            <FilePlus class="h-4 w-4 mr-1" />
                            File
                        </Button.Root>
                        <Button.Root
                            variant={newPathType === "Directory"
                                ? "default"
                                : "outline"}
                            size="sm"
                            onclick={() => (newPathType = "Directory")}
                        >
                            <FolderPlus class="h-4 w-4 mr-1" />
                            Directory
                        </Button.Root>
                    </div>
                </div>
                <div class="space-y-2">
                    <Label.Root for="path-input">Path</Label.Root>
                    <div class="flex gap-2">
                        <Input.Root
                            id="path-input"
                            bind:value={newPathInput}
                            placeholder="Enter path or click browse..."
                        />
                        <Button.Root
                            variant="outline"
                            size="sm"
                            onclick={openPathPicker}
                        >
                            Browse
                        </Button.Root>
                    </div>
                </div>
                {#if newPathType === "Directory"}
                    <div class="text-xs text-muted-foreground">
                        Directories are always monitored recursively
                    </div>
                {/if}
                {#if error}
                    <div class="text-sm text-destructive">{error}</div>
                {/if}
            </div>
            <Dialog.Footer>
                <Button.Root
                    variant="outline"
                    onclick={() => (addDialogOpen = false)}
                >
                    Cancel
                </Button.Root>
                <Button.Root
                    onclick={addMonitoredPath}
                    disabled={adding || !newPathInput.trim()}
                >
                    {adding ? "Adding..." : "Add Path"}
                </Button.Root>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Monitored Paths Table -->
    {#if settings.monitored_paths.length > 0}
        <div class="space-y-2">
            <h4 class="text-xs font-medium text-muted-foreground">
                Monitored Paths
            </h4>
            <div class="space-y-1">
                {#each settings.monitored_paths as path}
                    <div class="border border-border rounded-md p-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 flex-1 min-w-0">
                                {#if path.path_type === "Directory"}
                                    <Folder
                                        class="h-4 w-4 text-muted-foreground flex-shrink-0"
                                    />
                                {:else}
                                    <File
                                        class="h-4 w-4 text-muted-foreground flex-shrink-0"
                                    />
                                {/if}
                                <div class="min-w-0 flex-1">
                                    <div
                                        class="text-sm font-medium truncate"
                                        title={path.path}
                                    >
                                        {path.path.split('/').pop() || path.path.split('\\').pop() || path.path}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        {path.path_type}
                                        {#if path.path_type === "Directory"}
                                            · Recursive
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <Switch.Root
                                    checked={path.parse_enabled}
                                    onCheckedChange={(checked) =>
                                        togglePathParseEnabled(path.path, checked)}
                                />
                                <Button.Root
                                    variant="ghost"
                                    size="sm"
                                    onclick={() =>
                                        removeMonitoredPath(path.path)}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button.Root>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {:else}
        <div class="text-center py-4 text-muted-foreground">
            <Folder class="h-6 w-6 mx-auto mb-2 opacity-50" />
            <div class="text-xs">No monitored paths configured</div>
            <div class="text-xs opacity-70">Add a path to get started</div>
        </div>
    {/if}
</div>
