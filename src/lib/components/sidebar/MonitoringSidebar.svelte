<script lang="ts">
    import { onMount } from "svelte";
    import { commands } from "$lib/bindings";
    import type { UserSettings, MonitoredPath } from "$lib/bindings";
    import * as Sidebar from "$lib/components/ui/sidebar";
    import * as ScrollArea from "$lib/components/ui/scroll-area";
    import * as Select from "$lib/components/ui/select";
    import MonitoredFilesSection from "./MonitoredFilesSection.svelte";
    import FilterSection from "./FilterSection.svelte";
    import SidebarFooterSettingsButton from "./SidebarFooterSettingsButton.svelte";
    import SettingsDialog from "$lib/components/settings/SettingsDialog.svelte";
    import {
        displayMode,
        displayModes,
        setDisplayMode,
        type DisplayMode,
    } from "$lib/viewmodels/homeview.store";
    import { Settings, Filter, FolderOpen, List } from "@lucide/svelte";

    const sidebar = Sidebar.useSidebar();

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

        // Trigger ListView refresh when monitoring settings change
        if (typeof window !== "undefined" && (window as any).refreshListView) {
            console.log(
                "🔄 Triggering ListView refresh due to monitoring settings change",
            );
            await (window as any).refreshListView();
        }
    }
</script>

<Sidebar.Root side="left" variant="sidebar" collapsible="icon">
    <Sidebar.Header>
        <div
            class="flex items-center gap-2 px-4 py-2"
            class:justify-between={sidebar.state === "expanded"}
            class:justify-center={sidebar.state === "collapsed"}
        >
            {#if sidebar.state === "expanded"}
                <div class="flex items-center gap-2">
                    <Settings class="h-4 w-4" />
                    <span class="font-semibold">Monitoring & Filters</span>
                </div>
            {/if}
            <Sidebar.Trigger />
        </div>
    </Sidebar.Header>

    {#if sidebar.state === "expanded"}
        <Sidebar.Content>
            <!-- Display Mode Selector -->
            <Sidebar.Group>
                <Sidebar.GroupLabel class="flex items-center gap-2">
                    <List class="h-4 w-4" />
                    Display Mode
                </Sidebar.GroupLabel>
                <Sidebar.GroupContent class="pl-6">
                    <Select.Root type="single" bind:value={$displayMode}>
                        <Select.Trigger class="w-full">
                            {displayModes.find(
                                (mode) => mode.value === $displayMode,
                            )?.label || "Select mode"}
                        </Select.Trigger>
                        <Select.Content>
                            {#each displayModes as mode}
                                <Select.Item
                                    value={mode.value}
                                    label={mode.label}
                                >
                                    <div
                                        class="flex items-center justify-between w-full"
                                    >
                                        <span>{mode.label}</span>
                                        <span
                                            class="text-xs text-muted-foreground ml-2"
                                            >{mode.shortcut}</span
                                        >
                                    </div>
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </Sidebar.GroupContent>
            </Sidebar.Group>

            <Sidebar.Separator />

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
                        <div class="text-sm text-destructive">
                            Error: {error}
                        </div>
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
                        Org Files
                    </Sidebar.GroupLabel>
                    <Sidebar.GroupContent class="pl-6">
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
                    <Sidebar.GroupContent class="pl-6">
                        <FilterSection />
                    </Sidebar.GroupContent>
                </Sidebar.Group>
            {/if}
        </Sidebar.Content>
    {/if}

    {#if sidebar.state === "expanded"}
        <Sidebar.Footer>
            <SidebarFooterSettingsButton />
        </Sidebar.Footer>
    {/if}
</Sidebar.Root>

<!-- Settings Dialog -->
<SettingsDialog />
