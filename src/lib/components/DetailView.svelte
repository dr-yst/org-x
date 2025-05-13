<script lang="ts">
  import type { OrgHeadline, OrgTimestamp } from "$lib/bindings";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  
  // Props definition using Svelte 5 runes
  const { headline = null } = $props<{ headline: OrgHeadline | null }>();
  
  // Helper function to format OrgTimestamp
  function formatTimestamp(timestamp: OrgTimestamp | null): string {
    if (!timestamp) return '';
    
    let dateStr = '';
    
    if ("Active" in timestamp) {
      dateStr = formatDateFromOrgDatetime(timestamp.Active.start);
      return `<${dateStr}${timestamp.Active.repeater ? ' ' + timestamp.Active.repeater : ''}${timestamp.Active.delay ? ' ' + timestamp.Active.delay : ''}>`;
    } else if ("Inactive" in timestamp) {
      dateStr = formatDateFromOrgDatetime(timestamp.Inactive.start);
      return `[${dateStr}${timestamp.Inactive.repeater ? ' ' + timestamp.Inactive.repeater : ''}${timestamp.Inactive.delay ? ' ' + timestamp.Inactive.delay : ''}]`;
    } else if ("ActiveRange" in timestamp) {
      const startStr = formatDateFromOrgDatetime(timestamp.ActiveRange.start);
      const endStr = formatDateFromOrgDatetime(timestamp.ActiveRange.end);
      return `<${startStr}--${endStr}${timestamp.ActiveRange.repeater ? ' ' + timestamp.ActiveRange.repeater : ''}${timestamp.ActiveRange.delay ? ' ' + timestamp.ActiveRange.delay : ''}>`;
    } else if ("InactiveRange" in timestamp) {
      const startStr = formatDateFromOrgDatetime(timestamp.InactiveRange.start);
      const endStr = formatDateFromOrgDatetime(timestamp.InactiveRange.end);
      return `[${startStr}--${endStr}${timestamp.InactiveRange.repeater ? ' ' + timestamp.InactiveRange.repeater : ''}${timestamp.InactiveRange.delay ? ' ' + timestamp.InactiveRange.delay : ''}]`;
    } else if ("Diary" in timestamp) {
      return `<%${timestamp.Diary.value}>`;
    }
    
    return '';
  }
  
  // Helper to format a date from OrgDatetime
  function formatDateFromOrgDatetime(datetime: any): string {
    if (!datetime) return "";
    const { year, month, day, hour, minute } = datetime;
    
    let dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    
    if (hour !== null && minute !== null) {
      dateStr += ` ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    }
    
    return dateStr;
  }
  
  // Format the content for display
  function formatContent(content: string): string {
    if (!content) return '';
    
    // Replace newlines with <br> for HTML display
    return content.replace(/\n/g, '<br>');
  }
  
  // Get priority display
  function getPriority(priority: string | null): string {
    if (!priority) return 'None';
    return priority;
  }
  
  // Get priority color class
  function getPriorityColorClass(priority: string | null): string {
    if (!priority) return '';
    
    switch (priority) {
      case 'A': return 'text-red-600';
      case 'B': return 'text-orange-500';
      case 'C': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  }
  
  // Get TODO status color
  function getTodoColorClass(todoKeyword: string | null): string {
    if (!todoKeyword) return '';
    
    switch (todoKeyword) {
      case 'TODO': return 'text-blue-600';
      case 'DONE': return 'text-green-600';
      case 'WAITING': return 'text-orange-500';
      case 'CANCELLED': return 'text-gray-500';
      default: return 'text-blue-600';
    }
  }
</script>

<div class="w-full h-full bg-white rounded-lg shadow-md p-4">
  {#if headline}
    <div class="mb-4">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        {#if headline.title.todo_keyword}
          <span class="px-2 py-1 rounded text-xs font-medium {getTodoColorClass(headline.title.todo_keyword)}">
            {headline.title.todo_keyword}
          </span>
        {/if}
        
        {#if headline.title.priority}
          <span class="px-1.5 py-0.5 font-mono rounded {getPriorityColorClass(headline.title.priority)}">
            [#{headline.title.priority}]
          </span>
        {/if}
        
        <span>
          {headline.title.raw.replace(/^\*+\s+(?:\w+\s+)?(?:\[\#.\]\s+)?/, '')}
        </span>
      </h2>
      
      {#if headline.title.tags && headline.title.tags.length > 0}
          <div class="flex flex-wrap gap-1 mb-3">
            {#each headline.title.tags as tag}
              <Badge variant="secondary" class="text-xs">
                {tag}
              </Badge>
            {/each}
          </div>
        {/if}
    </div>
    
    {#if headline.title.planning}
      <div class="p-3 bg-gray-50 rounded mb-4 text-sm">
        <h3 class="font-medium text-gray-700 mb-2">Planning</h3>
        <div class="grid grid-cols-3 gap-2">
          {#if headline.title.planning.scheduled}
            <div class="text-gray-500 font-medium">SCHEDULED:</div>
            <div class="text-gray-800 col-span-2">{formatTimestamp(headline.title.planning.scheduled)}</div>
          {/if}
          
          {#if headline.title.planning.deadline}
            <div class="text-gray-500 font-medium">DEADLINE:</div>
            <div class="text-gray-800 col-span-2">{formatTimestamp(headline.title.planning.deadline)}</div>
          {/if}
          
          {#if headline.title.planning.closed}
            <div class="text-gray-500 font-medium">CLOSED:</div>
            <div class="text-gray-800 col-span-2">{formatTimestamp(headline.title.planning.closed)}</div>
          {/if}
        </div>
      </div>
    {/if}
    
    {#if Object.keys(headline.title.properties).length > 0}
      <div class="p-3 bg-gray-50 rounded mb-4 text-sm">
        <h3 class="font-medium text-gray-700 mb-2">Properties</h3>
        <div class="grid grid-cols-3 gap-2">
          {#each Object.entries(headline.title.properties) as [key, value]}
            <div class="text-gray-500 font-medium">{key}:</div>
            <div class="text-gray-800 col-span-2">{value}</div>
          {/each}
        </div>
      </div>
    {/if}
    
    {#if headline.content && headline.content.trim()}
      <div class="mb-4">
        <h3 class="text-md font-medium mb-2 text-gray-700">Content</h3>
        <div class="prose prose-sm max-w-none p-3 bg-gray-50 rounded">
          {@html formatContent(headline.content)}
        </div>
      </div>
    {/if}
    
    {#if headline.children && headline.children.length > 0}
      <div>
        <h3 class="text-md font-medium mb-2 text-gray-700">Subtasks ({headline.children.length})</h3>
        <ul class="list-disc pl-5 space-y-2">
          {#each headline.children as child}
            <li class="text-sm">
              {#if child.title.todo_keyword}
                <Button variant="ghost" size="sm" class="px-2 py-0.5 h-auto {getTodoColorClass(child.title.todo_keyword)} font-medium">
                  {child.title.todo_keyword}
                </Button>
              {/if}
              {child.title.raw.replace(/^\*+\s+(?:\w+\s+)?(?:\[\#.\]\s+)?/, '')}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {:else}
    <div class="flex flex-col items-center justify-center h-64 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p>Select a task to view details</p>
    </div>
  {/if}
</div>