<script>
    import SimpleViewer from "$lib/components/SimpleViewer.svelte";
    import * as OrgDocument from "$lib/components/OrgDocument.svelte";
    import ListView from "$lib/components/ListView.svelte";
</script>

<main class="p-6 font-sans min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 class="text-center text-3xl font-bold mb-8 text-gray-800">Org-X</h1>
        <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4 text-gray-700">Sample Org Document</h2>
            <div class="border border-gray-200 rounded-lg p-4">
                <svelte:component this={OrgDocument.default} />
            </div>
        </div>
        
        <div class="mb-8">
            <div class="border border-gray-200 rounded-lg p-4">
                <ListView />
            </div>
        </div>
        <SimpleViewer />
    </div>
</main>
