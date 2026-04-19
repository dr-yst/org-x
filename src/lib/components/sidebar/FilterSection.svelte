<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import * as Checkbox from "$lib/components/ui/checkbox";
    import * as Input from "$lib/components/ui/input";
    import * as Label from "$lib/components/ui/label";
    import * as Button from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Search, X, Calendar, Tag, CheckSquare } from "@lucide/svelte";
    import type {
        TodoFilterValue,
        DateFilterValue,
    } from "$lib/viewmodels/homeview.store";
    import { dateFilterOptions } from "$lib/viewmodels/homeview.store";

    // Props - controlled by parent via store
    const {
        todoFilter = [],
        dateFilter = "all",
        searchQuery = "",
        selectedTags = [],
        selectedCategories = [],
        availableTags = [],
        availableCategories = [],
        todoKeywords = { active: [], closed: [] },
    } = $props<{
        todoFilter: TodoFilterValue;
        dateFilter: DateFilterValue;
        searchQuery: string;
        selectedTags: string[];
        selectedCategories: string[];
        availableTags?: string[];
        availableCategories?: string[];
        todoKeywords?: { active: string[]; closed: string[] };
    }>();

    // Event dispatcher
    const dispatch = createEventDispatcher<{
        todoFilterChange: TodoFilterValue;
        dateFilterChange: DateFilterValue;
        searchQueryChange: string;
        tagsChange: string[];
        categoriesChange: string[];
        clearAll: void;
    }>();

    // Event handlers
    function handleTodoFilterChange(value: TodoFilterValue) {
        dispatch("todoFilterChange", value);
    }

    function handleDateFilterChange(value: DateFilterValue) {
        dispatch("dateFilterChange", value);
    }

    function handleSearchQueryChange(value: string) {
        dispatch("searchQueryChange", value);
    }

    function toggleTodoKeyword(keyword: string) {
        const newFilter = todoFilter.includes(keyword)
            ? todoFilter.filter((k: string) => k !== keyword)
            : [...todoFilter, keyword];
        handleTodoFilterChange(newFilter);
    }

    function removeTodoKeyword(keyword: string) {
        handleTodoFilterChange(todoFilter.filter((k: string) => k !== keyword));
    }

    function toggleTag(tag: string) {
        const newTags = selectedTags.includes(tag)
            ? selectedTags.filter((t: string) => t !== tag)
            : [...selectedTags, tag];
        dispatch("tagsChange", newTags);
    }

    function toggleCategory(category: string) {
        const newCategories = selectedCategories.includes(category)
            ? selectedCategories.filter((c: string) => c !== category)
            : [...selectedCategories, category];
        dispatch("categoriesChange", newCategories);
    }

    function clearAllFilters() {
        dispatch("clearAll");
    }

    function removeTag(tag: string) {
        dispatch("tagsChange", selectedTags.filter((t: string) => t !== tag));
    }

    function removeCategory(category: string) {
        dispatch(
            "categoriesChange",
            selectedCategories.filter((c: string) => c !== category),
        );
    }

    // Combine active and closed keywords for display
    let allTodoKeywords = $derived([
        ...todoKeywords.active,
        ...todoKeywords.closed,
    ]);

    // Reactive filter summary
    let hasActiveFilters = $derived(
        todoFilter.length > 0 ||
            dateFilter !== "all" ||
            searchQuery.length > 0 ||
            selectedTags.length > 0 ||
            selectedCategories.length > 0,
    );
</script>

<div class="space-y-4">
    <!-- Search -->
    <div class="space-y-1">
        <Label.Root
            for="search"
            class="text-xs font-medium text-muted-foreground">Search</Label.Root
        >
        <div class="relative">
            <Search
                class="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground"
            />
            <Input.Root
                id="search"
                value={searchQuery}
                oninput={(e) =>
                    handleSearchQueryChange((e.target as HTMLInputElement).value)}
                placeholder="Search headlines..."
                class="pl-7 h-8 text-sm"
            />
            {#if searchQuery}
                <button
                    onclick={() => handleSearchQueryChange("")}
                    class="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                    <X
                        class="h-3 w-3 text-muted-foreground hover:text-foreground"
                    />
                </button>
            {/if}
        </div>
    </div>

    <!-- TODO Status Filter -->
    {#if allTodoKeywords.length > 0}
        <div class="space-y-1">
            <Label.Root class="text-xs font-medium text-muted-foreground"
                >TODO Status</Label.Root
            >
            <div class="space-y-1">
                {#each allTodoKeywords as keyword}
                    <div class="flex items-center space-x-2">
                        <Checkbox.Root
                            id="todo-{keyword}"
                            checked={todoFilter.includes(keyword)}
                            onCheckedChange={() => toggleTodoKeyword(keyword)}
                        />
                        <Label.Root
                            for="todo-{keyword}"
                            class="text-xs font-normal cursor-pointer flex items-center gap-1"
                        >
                            <CheckSquare class="h-3 w-3" />
                            {keyword}
                        </Label.Root>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Date Filter -->
    <div class="space-y-1">
        <Label.Root class="text-xs font-medium text-muted-foreground"
            >Date Range</Label.Root
        >
        <div class="flex flex-wrap gap-1">
            {#each dateFilterOptions as option}
                <Button.Root
                    variant={dateFilter === option.value
                        ? "default"
                        : "outline"}
                    size="sm"
                    onclick={() => handleDateFilterChange(option.value)}
                    class="text-xs h-7 px-2"
                >
                    <Calendar class="h-3 w-3 mr-1" />
                    {option.label}
                </Button.Root>
            {/each}
        </div>
    </div>

    <!-- Tags Filter -->
    {#if availableTags.length > 0}
        <div class="space-y-1">
            <Label.Root class="text-xs font-medium text-muted-foreground"
                >Tags</Label.Root
            >
            <div class="space-y-1">
                {#each availableTags as tag}
                    <div class="flex items-center space-x-2">
                        <Checkbox.Root
                            id="tag-{tag}"
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => toggleTag(tag)}
                        />
                        <Label.Root
                            for="tag-{tag}"
                            class="text-xs font-normal cursor-pointer flex items-center gap-1"
                        >
                            <Tag class="h-3 w-3" />
                            {tag}
                        </Label.Root>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Categories Filter -->
    {#if availableCategories.length > 0}
        <div class="space-y-1">
            <Label.Root class="text-xs font-medium text-muted-foreground"
                >Categories</Label.Root
            >
            <div class="space-y-1">
                {#each availableCategories as category}
                    <div class="flex items-center space-x-2">
                        <Checkbox.Root
                            id="category-{category}"
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                        />
                        <Label.Root
                            for="category-{category}"
                            class="text-xs font-normal cursor-pointer"
                        >
                            {category}
                        </Label.Root>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Active Filters Summary -->
    {#if hasActiveFilters}
        <div class="space-y-2 pt-2 border-t border-border">
            <div class="flex items-center justify-between">
                <Label.Root class="text-xs font-medium text-muted-foreground"
                    >Active Filters</Label.Root
                >
                <Button.Root
                    variant="ghost"
                    size="sm"
                    onclick={clearAllFilters}
                    class="h-6 px-2 text-xs"
                >
                    Clear All
                </Button.Root>
            </div>
            <div class="flex flex-wrap gap-1">
                {#each todoFilter as keyword}
                    <Badge variant="secondary" class="text-xs h-5">
                        <CheckSquare class="h-3 w-3 mr-1" />
                        {keyword}
                        <button
                            onclick={() => removeTodoKeyword(keyword)}
                            class="ml-1"
                        >
                            <X class="h-3 w-3" />
                        </button>
                    </Badge>
                {/each}
                {#if dateFilter !== "all"}
                    <Badge variant="secondary" class="text-xs h-5">
                        Date: {dateFilterOptions.find((o) => o.value === dateFilter)
                            ?.label}
                    </Badge>
                {/if}
                {#if searchQuery}
                    <Badge variant="secondary" class="text-xs h-5">
                        Search: "{searchQuery}"
                    </Badge>
                {/if}
                {#each selectedTags as tag}
                    <Badge variant="outline" class="text-xs h-5">
                        <Tag class="h-3 w-3 mr-1" />
                        {tag}
                        <button onclick={() => removeTag(tag)} class="ml-1">
                            <X class="h-3 w-3" />
                        </button>
                    </Badge>
                {/each}
                {#each selectedCategories as category}
                    <Badge variant="outline" class="text-xs h-5">
                        {category}
                        <button
                            onclick={() => removeCategory(category)}
                            class="ml-1"
                        >
                            <X class="h-3 w-3" />
                        </button>
                    </Badge>
                {/each}
            </div>
        </div>
    {/if}
</div>
