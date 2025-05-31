<script lang="ts">
    import ListView from "$lib/components/ListView.svelte";
    import MonitoringSidebar from "$lib/components/monitoring/MonitoringSidebar.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar";

    let sidebarOpen = $state(true);
</script>

<Sidebar.Provider bind:open={sidebarOpen}>
    <MonitoringSidebar />

    <Sidebar.Inset>
        <div class="flex-1 overflow-hidden">
            <div class="h-full bg-white">
                <ListView />
            </div>
        </div>
    </Sidebar.Inset>
</Sidebar.Provider>
