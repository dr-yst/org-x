<script lang="ts">
  import { onMount } from 'svelte';
  import { commands } from '../bindings';
  import type { OrgDocument } from '../bindings';
  import HeadlinesList from './HeadlinesList.svelte';
  
  let document: OrgDocument | null = null;
  let loading = true;
  let error: string | null = null;
  
  onMount(async () => {
    try {
      // Load sample document
      document = await commands.getSampleOrg();
      loading = false;
    } catch (err) {
      error = String(err);
      loading = false;
    }
  });
</script>

<div class="w-full">
  <h2 class="text-xl font-semibold mb-4 text-gray-700">Headlines List View</h2>
  
  {#if error}
    <div class="p-4 border border-red-500 bg-red-50 text-red-700 rounded mb-4">
      {error}
    </div>
  {/if}
  
  <HeadlinesList {document} {loading} />
</div>