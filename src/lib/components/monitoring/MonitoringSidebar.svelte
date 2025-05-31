<script lang="ts">
    import { onMount } from "svelte";
    import { commands } from "$lib/bindings";
    import type { UserSettings, MonitoredPath } from "$lib/bindings";
    import * as Sidebar from "$lib/components/ui/sidebar";
    import * as ScrollArea from "$lib/components/ui/scroll-area";
    import MonitoredFilesSection from "./MonitoredFilesSection.svelte";
    import FilterSection from "./FilterSection.svelte";
    import { Settings, Filter, FolderOpen } from "@lucide/svelte";

    let settings: UserSettings | null = $state(null);
    let loading = $state(false);
    let error: string | null = $state(null);

    onMount(async () => {
        await loadSettings();
    });

    async function loadSettings() {
        try {
            loading = true;
            error = null;
            const result = await commands.loadUserSettings();
            if (result.status === "ok") {
                settings = result.data;
            } else {
                error = result.error;
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "Unknown error";
        } finally {
            loading = false;
        }
    }

    async function handleSettingsUpdate(updatedSettings: UserSettings) {
        settings = updatedSettings;
    }
</script>

<Sidebar.Root side="left" variant="sidebar" collapsible="icon">
    <Sidebar.Header>
        <div class="flex items-center gap-2 px-4 py-2">
            <Settings class="h-4 w-4" />
            <span class="font-semibold">Monitoring & Filters</span>
        </div>
    </Sidebar.Header>

    <Sidebar.Content>
        {#if loading}
            <Sidebar.Group>
                <div class="flex items-center justify-center p-4">
                    <div class="text-sm text-muted-foreground">
                        Loading settings...
                    </div>
                </div>
            </Sidebar.Group>
        {:else if error}
            <Sidebar.Group>
                <div class="p-4">
                    <div class="text-sm text-destructive">Error: {error}</div>
                    <button
                        onclick={loadSettings}
                        class="mt-2 text-xs text-primary hover:underline"
                    >
                        Retry
                    </button>
                </div>
            </Sidebar.Group>
        {:else if settings}
            <!-- Monitored Files Section -->
            <Sidebar.Group>
                <Sidebar.GroupLabel class="flex items-center gap-2">
                    <FolderOpen class="h-4 w-4" />
                    Monitored Files
                </Sidebar.GroupLabel>
                <Sidebar.GroupContent>
                    <ScrollArea.Root style="max-height: 320px;">
                        <MonitoredFilesSection
                            {settings}
                            onSettingsUpdate={handleSettingsUpdate}
                        />
                    </ScrollArea.Root>
                </Sidebar.GroupContent>
            </Sidebar.Group>

            <Sidebar.Separator />

            <!-- Filters Section -->
            <Sidebar.Group>
                <Sidebar.GroupLabel class="flex items-center gap-2">
                    <Filter class="h-4 w-4" />
                    Filters
                </Sidebar.GroupLabel>
                <Sidebar.GroupContent>
                    <FilterSection />
                </Sidebar.GroupContent>
            </Sidebar.Group>
        {/if}
    </Sidebar.Content>
</Sidebar.Root>
