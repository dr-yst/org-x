<script lang="ts">
  import type { OrgHeadline } from '../bindings';
  
  export let headline: OrgHeadline;
  export let level: number = 1;
  
  let isExpanded = true;
  
  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  // Get appropriate border color based on level
  $: borderColor = 
    level === 1 ? 'border-blue-600' : 
    level === 2 ? 'border-indigo-700' : 
    level === 3 ? 'border-purple-600' : 
    level === 4 ? 'border-pink-500' : 
    'border-cyan-500';
</script>

<div class={`mb-2 border-l-2 ${borderColor} pl-2`}>
  <div class="flex items-center cursor-pointer">
    {#if headline.children.length > 0}
      <button 
        class="w-5 h-5 mr-2 border border-gray-300 rounded flex items-center justify-center text-xs hover:bg-gray-100" 
        on:click={toggleExpand} 
        aria-label="Toggle expand"
      >
        {isExpanded ? '−' : '+'}
      </button>
    {/if}
    
    <div class="flex items-center gap-2">
      {#if headline.todo_keyword}
        <span class="font-bold text-xs text-red-600 px-1 py-0.5 rounded">
          {headline.todo_keyword}
        </span>
      {/if}
      
      <span class="title">{headline.title}</span>
      
      {#if headline.tags.length > 0}
        <div class="flex gap-1">
          {#each headline.tags as tag}
            <span class="text-xs text-white bg-blue-600 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  
  {#if isExpanded}
    {#if headline.content}
      <div class="whitespace-pre-wrap my-2 pl-6 text-sm text-gray-700">
        {headline.content}
      </div>
    {/if}
    
    {#if headline.children.length > 0}
      <div class="ml-6">
        {#each headline.children as child}
          <svelte:self headline={child} level={level + 1} />
        {/each}
      </div>
    {/if}
  {/if}
</div>