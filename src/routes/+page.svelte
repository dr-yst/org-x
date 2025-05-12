<script lang="ts">
  import ListView from "$lib/components/ListView.svelte";
</script>

<div class="container mx-auto py-8 px-4">
  <div class="mb-6">
    <h1 class="text-3xl font-bold mb-2">Org-X</h1>
    <p class="text-gray-600">A modern viewer for your org-mode files</p>
  </div>

  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <ListView />
  </div>
</div>