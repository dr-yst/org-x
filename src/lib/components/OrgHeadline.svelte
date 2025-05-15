<script lang="ts">
    import type { OrgHeadline } from "../bindings";
    import { Badge } from "$lib/components/ui/badge";
    import { cn } from "$lib/utils";

    // runesスタイルのprops定義
    const { headline, level = 1 } = $props<{
        headline: OrgHeadline;
        level?: number;
    }>();

    let isExpanded = $state(true);

    function toggleExpand() {
        isExpanded = !isExpanded;
    }

    // Define custom badge classes for TODO status
    const todoBadgeClasses = {
        todo: "bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 border-blue-200",
        done: "bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 border-green-200",
        waiting:
            "bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700 border-orange-200",
        cancelled:
            "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600 border-gray-200",
    };

    // Get badge class for TODO status
    function getTodoBadgeClass(todoKeyword: string | null): string {
        if (!todoKeyword) return "";

        switch (todoKeyword.toUpperCase()) {
            case "TODO":
                return todoBadgeClasses.todo;
            case "DONE":
                return todoBadgeClasses.done;
            case "WAITING":
                return todoBadgeClasses.waiting;
            case "CANCELLED":
                return todoBadgeClasses.cancelled;
            default:
                return todoBadgeClasses.todo;
        }
    }

    // レベルに応じたボーダーカラーを取得する関数
    function getBorderColor(level: number): string {
        switch (level) {
            case 1:
                return "border-blue-600"; // #4361ee
            case 2:
                return "border-indigo-800"; // #3a0ca3
            case 3:
                return "border-purple-700"; // #7209b7
            case 4:
                return "border-pink-600"; // #f72585
            default:
                return "border-blue-400"; // #4cc9f0
        }
    }
</script>

<div class={`mb-2 border-l-2 pl-2 ${getBorderColor(level)}`}>
    <div class="flex items-center cursor-pointer">
        {#if headline.children.length > 0}
            <button
                class="w-5 h-5 flex items-center justify-center mr-2 border border-gray-300 rounded text-base leading-none hover:bg-gray-100"
                onclick={toggleExpand}
                aria-label="Toggle expand"
            >
                {isExpanded ? "−" : "+"}
            </button>
        {/if}

        <div class="flex items-center gap-2">
            {#if headline.title.todo_keyword}
                <Badge
                    class={cn(
                        getTodoBadgeClass(headline.title.todo_keyword),
                        headline.title.todo_keyword === "CANCELLED" &&
                            "line-through",
                        "text-sm font-medium",
                    )}
                    variant="secondary"
                >
                    {headline.title.todo_keyword}
                </Badge>
            {/if}

            <span>{headline.title.raw}</span>

            {#if headline.title.tags.length > 0}
                <span class="flex gap-1">
                    {#each headline.title.tags as tag}
                        <Badge variant="default" class="text-xs">
                            {tag}
                        </Badge>
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
