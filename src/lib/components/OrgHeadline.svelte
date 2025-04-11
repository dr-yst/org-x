<script lang="ts">
  import type { OrgHeadline } from '../bindings';
  
  export let headline: OrgHeadline;
  export let level: number = 1;
  
  let isExpanded = true;
  
  function toggleExpand() {
    isExpanded = !isExpanded;
  }
</script>

<div class="headline level-{level}">
  <div class="headline-header">
    {#if headline.children.length > 0}
      <button class="toggle" on:click={toggleExpand} aria-label="Toggle expand">
        {isExpanded ? '−' : '+'}
      </button>
    {/if}
    
    <div class="headline-title">
      {#if headline.todo_keyword}
        <span class="todo-keyword">{headline.todo_keyword}</span>
      {/if}
      
      <span class="title">{headline.title}</span>
      
      {#if headline.tags.length > 0}
        <span class="tags">
          {#each headline.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </span>
      {/if}
    </div>
  </div>
  
  {#if isExpanded}
    {#if headline.content}
      <div class="content">
        {headline.content}
      </div>
    {/if}
    
    {#if headline.children.length > 0}
      <div class="children">
        {#each headline.children as child}
          <svelte:self headline={child} level={level + 1} />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .headline {
    margin-bottom: 0.5rem;
    border-left: 2px solid transparent;
    padding-left: 0.5rem;
  }
  
  .headline-header {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  
  .headline-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .toggle {
    background: none;
    border: 1px solid #ddd;
    width: 20px;
    height: 20px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.5rem;
    cursor: pointer;
    padding: 0;
    font-size: 16px;
    line-height: 1;
  }
  
  .toggle:hover {
    background-color: #f5f5f5;
  }
  
  .todo-keyword {
    font-weight: bold;
    color: #e63946;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-size: 0.8em;
  }
  
  .tags {
    display: flex;
    gap: 0.3rem;
  }
  
  .tag {
    font-size: 0.7em;
    color: #fff;
    background-color: #457b9d;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }
  
  .content {
    white-space: pre-wrap;
    margin: 0.5rem 0;
    padding-left: 1.5rem;
    font-size: 0.9em;
    color: #333;
  }
  
  .children {
    margin-left: 1.5rem;
  }
  
  /* Level-specific styling */
  .level-1 {
    border-left-color: #4361ee;
  }
  
  .level-2 {
    border-left-color: #3a0ca3;
  }
  
  .level-3 {
    border-left-color: #7209b7;
  }
  
  .level-4 {
    border-left-color: #f72585;
  }
  
  .level-5, .level-6 {
    border-left-color: #4cc9f0;
  }
</style>