<script lang="ts">
    import * as Checkbox from "$lib/components/ui/checkbox";
    import * as Input from "$lib/components/ui/input";
    import * as Label from "$lib/components/ui/label";
    import * as Button from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Search, X, Calendar, Tag, CheckSquare } from "@lucide/svelte";

    // Filter state
    let todoFilter = $state("all");
    let dateFilter = $state("all");
    let searchQuery = $state("");
    let selectedTags = $state<string[]>([]);
    let selectedCategories = $state<string[]>([]);

    // Sample data - in real implementation, these would come from backend
    let availableTags = $state([
        "work",
        "personal",
        "urgent",
        "project",
        "meeting",
    ]);
    let availableCategories = $state(["tasks", "notes", "ideas", "goals"]);

    // Filter options
    const todoOptions = [
        { value: "all", label: "All Items" },
        { value: "todo", label: "TODO" },
        { value: "done", label: "DONE" },
        { value: "in-progress", label: "IN-PROGRESS" },
        { value: "waiting", label: "WAITING" },
    ];

    const dateOptions = [
        { value: "all", label: "All Dates" },
        { value: "today", label: "Today" },
        { value: "this-week", label: "This Week" },
        { value: "this-month", label: "This Month" },
        { value: "overdue", label: "Overdue" },
        { value: "scheduled", label: "Scheduled" },
        { value: "no-date", label: "No Date" },
    ];

    function toggleTag(tag: string) {
        if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter((t) => t !== tag);
        } else {
            selectedTags = [...selectedTags, tag];
        }
    }

    function toggleCategory(category: string) {
        if (selectedCategories.includes(category)) {
            selectedCategories = selectedCategories.filter(
                (c) => c !== category,
            );
        } else {
            selectedCategories = [...selectedCategories, category];
        }
    }

    function clearAllFilters() {
        todoFilter = "all";
        dateFilter = "all";
        searchQuery = "";
        selectedTags = [];
        selectedCategories = [];
    }

    function removeTag(tag: string) {
        selectedTags = selectedTags.filter((t) => t !== tag);
    }

    function removeCategory(category: string) {
        selectedCategories = selectedCategories.filter((c) => c !== category);
    }

    // Reactive filter summary
    let hasActiveFilters = $derived(
        todoFilter !== "all" ||
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
                bind:value={searchQuery}
                placeholder="Search headlines..."
                class="pl-7 h-8 text-sm"
            />
            {#if searchQuery}
                <button
                    onclick={() => (searchQuery = "")}
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
    <div class="space-y-1">
        <Label.Root class="text-xs font-medium text-muted-foreground"
            >TODO Status</Label.Root
        >
        <div class="flex flex-wrap gap-1">
            {#each todoOptions as option}
                <Button.Root
                    variant={todoFilter === option.value
                        ? "default"
                        : "outline"}
                    size="sm"
                    onclick={() => (todoFilter = option.value)}
                    class="text-xs h-7 px-2"
                >
                    <CheckSquare class="h-3 w-3 mr-1" />
                    {option.label}
                </Button.Root>
            {/each}
        </div>
    </div>

    <!-- Date Filter -->
    <div class="space-y-1">
        <Label.Root class="text-xs font-medium text-muted-foreground"
            >Date Range</Label.Root
        >
        <div class="flex flex-wrap gap-1">
            {#each dateOptions as option}
                <Button.Root
                    variant={dateFilter === option.value
                        ? "default"
                        : "outline"}
                    size="sm"
                    onclick={() => (dateFilter = option.value)}
                    class="text-xs h-7 px-2"
                >
                    <Calendar class="h-3 w-3 mr-1" />
                    {option.label}
                </Button.Root>
            {/each}
        </div>
    </div>

    <!-- Tags Filter -->
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

    <!-- Categories Filter -->
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
                {#if todoFilter !== "all"}
                    <Badge variant="secondary" class="text-xs h-5">
                        TODO: {todoOptions.find((o) => o.value === todoFilter)
                            ?.label}
                    </Badge>
                {/if}
                {#if dateFilter !== "all"}
                    <Badge variant="secondary" class="text-xs h-5">
                        Date: {dateOptions.find((o) => o.value === dateFilter)
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
