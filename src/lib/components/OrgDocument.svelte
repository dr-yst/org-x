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

<div class="org-document">
  {#if loading}
    <p class="loading">Loading document...</p>
  {:else if error}
    <div class="error">
      <p>Error: {error}</p>
    </div>
  {:else if document}
    <h1 class="document-title">{document.title}</h1>
    
    <div class="headlines">
      {#each document.headlines as headline}
        <OrgHeadline {headline} level={1} />
      {/each}
    </div>
  {:else}
    <p class="no-document">No document loaded</p>
  {/if}
</div>

<style>
  .org-document {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    width: 100%;
  }

  .document-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #ddd;
  }

  .headlines {
    margin-top: 1rem;
  }

  .loading {
    color: #666;
    font-style: italic;
  }

  .error {
    color: #e63946;
    border: 1px solid #e63946;
    padding: 1rem;
    border-radius: 4px;
    background-color: #ffdfd6;
  }

  .no-document {
    color: #666;
    font-style: italic;
  }
</style>