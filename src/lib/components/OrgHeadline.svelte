<script lang="ts">
  import type { OrgHeadline } from '../bindings';

  export let headline: OrgHeadline;
  export let level: number = 1;

  let isExpanded = true;

  function toggleExpand() {
    isExpanded = !isExpanded;
  }

  // レベルに応じたボーダーカラーを取得する関数
  function getBorderColor(level: number): string {
    switch(level) {
      case 1: return 'border-blue-600'; // #4361ee
      case 2: return 'border-indigo-800'; // #3a0ca3
      case 3: return 'border-purple-700'; // #7209b7
      case 4: return 'border-pink-600'; // #f72585
      default: return 'border-blue-400'; // #4cc9f0
    }
  }
</script>

<div class={`mb-2 border-l-2 pl-2 ${getBorderColor(level)}`}>
  <div class="flex items-center cursor-pointer">
    {#if headline.children.length > 0}
      <button
        class="w-5 h-5 flex items-center justify-center mr-2 border border-gray-300 rounded text-base leading-none hover:bg-gray-100"
        on:click={toggleExpand}
        aria-label="Toggle expand"
      >
        {isExpanded ? '−' : '+'}
      </button>
    {/if}

    <div class="flex items-center gap-2">
      {#if headline.todo_keyword}
        <span class="font-bold text-red-600 text-sm px-1 py-0.5 rounded">
          {headline.todo_keyword}
        </span>
      {/if}

      <span>{headline.title}</span>

      {#if headline.tags.length > 0}
        <span class="flex gap-1">
          {#each headline.tags as tag}
            <span class="text-xs text-white bg-blue-600 px-1 py-0.5 rounded">
              {tag}
            </span>
          {/each}
        </span>
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
