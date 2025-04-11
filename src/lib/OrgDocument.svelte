<script lang="ts">
  import { onMount } from 'svelte';
  import { commands } from './bindings';
  import type { OrgDocument, OrgHeadline } from './bindings';

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

  function renderHeadline(headline: OrgHeadline, level: number): string {
    // Function to render a headline with its content and children
    const headingTag = `h${Math.min(level, 6)}`;
    return `
      <div class="headline level-${level}">
        <${headingTag}>
          ${headline.todo_keyword ? `<span class="todo-keyword">${headline.todo_keyword}</span>` : ''}
          <span class="title">${headline.title}</span>
          ${headline.tags.length > 0 ? `<span class="tags">${headline.tags.join(', ')}</span>` : ''}
        </${headingTag}>
        ${headline.content ? `<div class="content">${headline.content}</div>` : ''}
        ${headline.children.length > 0 ? 
          `<div class="children">
            ${headline.children.map(child => renderHeadline(child, level + 1)).join('')}
          </div>` : 
          ''
        }
      </div>
    `;
  }
</script>

<div class="org-document">
  {#if loading}
    <p>Loading document...</p>
  {:else if error}
    <p class="error">Error: {error}</p>
  {:else if document}
    <h1>{document.title}</h1>
    
    {#each document.headlines as headline}
      {@html renderHeadline(headline, 1)}
    {/each}
  {:else}
    <p>No document loaded</p>
  {/if}
</div>

<style>
  .org-document {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .headline {
    margin-bottom: 1rem;
  }

  .todo-keyword {
    font-weight: bold;
    color: #e63946;
    margin-right: 0.5rem;
  }

  .tags {
    font-size: 0.8em;
    color: #457b9d;
    margin-left: 0.5rem;
  }

  .content {
    white-space: pre-wrap;
    margin: 0.5rem 0;
    padding-left: 1rem;
    border-left: 2px solid #eee;
  }

  .children {
    margin-left: 1.5rem;
  }

  .level-1 > h1 {
    border-bottom: 1px solid #ddd;
    font-size: 1.8rem;
  }

  .level-2 > h2 {
    font-size: 1.6rem;
  }

  .level-3 > h3 {
    font-size: 1.4rem;
  }

  .error {
    color: #e63946;
    border: 1px solid #e63946;
    padding: 1rem;
    border-radius: 4px;
    background-color: #ffdfd6;
  }
</style>