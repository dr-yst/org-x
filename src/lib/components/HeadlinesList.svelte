<script lang="ts">
  import { commands } from '../bindings';
  import type { OrgDocument, OrgHeadline } from '../bindings';
  
  export let document: OrgDocument | null = null;
  export let loading = false;
  
  // State for expanded/collapsed items
  let expandedItems = new Set<string>();
  
  // Flattened headlines for table display
  type FlattenedItem = {
    id: string;
    title: string;
    level: number;
    path: string[];
    todoKeyword: string | null;
    tags: string[];
    priority: string | null;
    hasContent: boolean;
    hasChildren: boolean;
    indentLevel: number;
  };

  let flattenedItems: FlattenedItem[] = [];
  
  // Filter state
  let tagFilter = '';
  let todoFilter = '';
  
  // Update flattened items when document changes
  $: if (document) {
    flattenedItems = flattenHeadlines(document.headlines);
  }
  
  // Process headlines into a flat structure
  function flattenHeadlines(headlines: OrgHeadline[], parentPath: string[] = [], parentLevel: number = 0): FlattenedItem[] {
    let result: FlattenedItem[] = [];
    
    for (const headline of headlines) {
      // Current path includes all parent headlines
      const currentPath = [...parentPath];
      const indentLevel = parentLevel > 0 ? parentLevel : 0;
      
      // Create the list item
      const item: FlattenedItem = {
        id: headline.id,
        title: headline.title,
        level: headline.level,
        path: currentPath,
        todoKeyword: headline.todo_keyword,
        tags: headline.tags,
        priority: headline.priority,
        hasContent: headline.content.length > 0,
        hasChildren: headline.children.length > 0,
        indentLevel
      };
      
      result.push(item);
      
      // Add this headline to the path for its children
      currentPath.push(headline.title);
      
      // Process children recursively if expanded
      if (headline.children.length > 0 && expandedItems.has(headline.id)) {
        const children = flattenHeadlines(headline.children, currentPath, indentLevel + 1);
        result = [...result, ...children];
      }
    }
    
    return result;
  }
  
  // Toggle expanded state for an item
  function toggleExpand(id: string): void {
    if (expandedItems.has(id)) {
      expandedItems.delete(id);
    } else {
      expandedItems.add(id);
    }
    // Force recomputation of flattened items
    flattenedItems = flattenHeadlines(document?.headlines || []);
  }
  
  // Filter the flattened list
  $: filteredItems = flattenedItems.filter(item => {
    // Tag filter
    if (tagFilter && !item.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))) {
      return false;
    }
    
    // TODO state filter
    if (todoFilter) {
      if (todoFilter === 'task' && !item.todoKeyword) {
        return false;
      }
      if (todoFilter === 'note' && item.todoKeyword) {
        return false;
      }
      if (todoFilter !== 'task' && todoFilter !== 'note' && 
          item.todoKeyword?.toLowerCase() !== todoFilter.toLowerCase()) {
        return false;
      }
    }
    
    return true;
  });
</script>

<div class="w-full">
  <div class="flex gap-4 mb-4">
    <input 
      type="text" 
      placeholder="Filter by tag..." 
      bind:value={tagFilter} 
      class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
    />
    
    <select 
      bind:value={todoFilter} 
      class="px-2 py-1 border border-gray-300 rounded text-sm"
    >
      <option value="">All items</option>
      <option value="task">Tasks only</option>
      <option value="note">Notes only</option>
      <option value="TODO">TODO</option>
      <option value="DONE">DONE</option>
    </select>
  </div>
  
  {#if loading}
    <div class="py-8 text-center text-gray-500 italic">Loading...</div>
  {:else if document && flattenedItems.length > 0}
    <div class="border border-gray-200 rounded overflow-hidden">
      <!-- Table Header -->
      <div class="grid grid-cols-12 bg-gray-100 font-medium border-b-2 border-gray-200">
        <div class="col-span-5 p-2">Title</div>
        <div class="col-span-2 p-2">Status</div>
        <div class="col-span-4 p-2">Tags</div>
        <div class="col-span-1 p-2">Priority</div>
      </div>
      
      <!-- Table Rows -->
      {#each filteredItems as item (item.id)}
        <div class="grid grid-cols-12 border-b border-gray-100 hover:bg-gray-50">
          <div class="col-span-5 p-2 flex items-center overflow-hidden text-ellipsis whitespace-nowrap" 
               style="padding-left: {item.indentLevel * 20 + 8}px;">
            <!-- Expand/collapse button if has children -->
            {#if item.hasChildren}
              <button 
                class="w-5 h-5 mr-2 border border-gray-300 rounded flex items-center justify-center cursor-pointer text-xs hover:bg-gray-100" 
                on:click={() => toggleExpand(item.id)} 
                aria-label="Toggle expand"
              >
                {expandedItems.has(item.id) ? '▼' : '►'}
              </button>
            {:else}
              <span class="w-5 mr-2"></span>
            {/if}
            
            <!-- Title with proper indentation -->
            <span>
              {item.title}
            </span>
          </div>
          
          <div class="col-span-2 p-2">
            {#if item.todoKeyword}
              <span class="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                {item.todoKeyword}
              </span>
            {:else}
              <span class="text-xs text-gray-500 italic">Note</span>
            {/if}
          </div>
          
          <div class="col-span-4 p-2">
            {#each item.tags as tag}
              <span class="inline-block mr-1 px-1.5 py-0.5 rounded text-xs bg-blue-600 text-white">
                {tag}
              </span>
            {/each}
          </div>
          
          <div class="col-span-1 p-2">
            {#if item.priority}
              <span class="inline-block w-5 h-5 rounded-full text-center text-xs font-bold leading-5
                       {item.priority === 'A' ? 'bg-red-500 text-white' : 
                        item.priority === 'B' ? 'bg-yellow-500 text-black' : 
                        'bg-green-500 text-white'}">
                {item.priority}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="py-8 text-center text-gray-500 italic">No headlines found</div>
  {/if}
</div>