<script>
    import "../app.css";
    import MonitoringSidebar from "$lib/components/sidebar/MonitoringSidebar.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar";

    // let sidebarOpen = $state(true);

    let { children } = $props();
</script>

<Sidebar.Provider>
    <MonitoringSidebar />
    <main>
        {@render children()}
    </main>
</Sidebar.Provider>
