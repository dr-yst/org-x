<script lang="ts">
    import ListView from "$lib/components/ListView.svelte";
    import * as Tabs from "$lib/components/ui/tabs";
    import {
        displayMode,
        setDisplayMode,
    } from "$lib/viewmodels/listview.store";
    import type { DisplayMode } from "$lib/viewmodels/listview.store";

    function handleTabChange(value: string) {
        setDisplayMode(value as DisplayMode);
    }
</script>

<div class="flex-1 min-w-0 overflow-hidden p-4">
    <Tabs.Root value={$displayMode} onValueChange={handleTabChange}>
        <Tabs.List class="mb-4">
            <Tabs.Trigger value="task-list">Task List</Tabs.Trigger>
            <Tabs.Trigger value="headline-list">Headline List</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="task-list">
            <ListView />
        </Tabs.Content>

        <Tabs.Content value="headline-list">
            <ListView />
        </Tabs.Content>
    </Tabs.Root>
</div>
