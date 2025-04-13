<script lang="ts">
  import { onMount } from 'svelte';
  import { commands } from '../bindings';
  import type { OrgDocument as OrgDocumentType } from '../bindings';
  import OrgHeadline from './OrgHeadline.svelte';

  export let document: OrgDocumentType | null = null;
  export let loading = true;
  export let error: string | null = null;

  onMount(async () => {
    if (!document) {
      try {
        // Load sample document
        document = await commands.getSampleOrg();
        loading = false;
      } catch (err) {
        error = String(err);
        loading = false;
      }
    }
  });
</script>

<div class="w-full font-sans leading-normal">
  {#if loading}
    <p class="text-gray-500 italic">Loading document...</p>
  {:else if error}
    <div class="text-red-600 border border-red-500 p-4 rounded bg-red-50">
      <p>Error: {error}</p>
    </div>
  {:else if document}
    <h1 class="text-2xl mb-6 pb-2 border-b border-gray-200">{document.title}</h1>
    
    <div class="mt-4">
      {#each document.headlines as headline}
        <OrgHeadline {headline} level={1} />
      {/each}
    </div>
  {:else}
    <p class="text-gray-500 italic">No document loaded</p>
  {/if}
</div>