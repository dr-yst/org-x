<script lang="ts">
    import type { OrgHeadline } from "$lib/bindings";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Breadcrumb,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbList,
        BreadcrumbPage,
        BreadcrumbSeparator,
    } from "$lib/components/ui/breadcrumb";
    import { cn } from "$lib/utils";
    import HeadlinesList from "$lib/components/HeadlinesList.svelte";
    import {
        currentHeadline,
        parentChain,
        selectedChild,
        formattedPlanning,
        formattedContent,
        cleanedTitle,
        priorityColorClass,
        todoBadgeClass,
        hasChildren,
        hasProperties,
        hasContent,
        selectChild,
        handleBreadcrumbClick,
        handleHomeClick,
        handleChildBreadcrumbClick,
    } from "$lib/viewmodels/detailview.store";
    import Home from "@lucide/svelte/icons/home";

    // Enhanced props definition using Svelte 5 runes - supports recursive navigation
    const {
        headline = null,
        parentChain: propsParentChain = [],
        onBreadcrumbClick = null,
    } = $props<{
        headline: OrgHeadline | null;
        parentChain?: OrgHeadline[]; // For breadcrumb navigation
        onBreadcrumbClick?: ((index: number) => void) | null; // Callback for breadcrumb navigation
    }>();

    // Update store when props change
    $effect(() => {
        if (headline) {
            currentHeadline.set(headline);
            parentChain.set(propsParentChain);
        }
    });

    // Handle child headline selection for recursive navigation
    function handleChildSelected(event: CustomEvent<OrgHeadline>) {
        selectChild(event.detail);
    }

    // Handle breadcrumb navigation with props callback
    function handleBreadcrumbNavigation(index: number) {
        if (onBreadcrumbClick) {
            onBreadcrumbClick(index);
        } else {
            handleBreadcrumbClick(index);
        }
    }
</script>

<div class="w-full h-full">
    {#if !$currentHeadline}
        <div
            class="flex flex-col items-center justify-center py-12 text-gray-500"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
            <p class="text-gray-400 text-center">
                Select a task/headline to view details
            </p>
        </div>
    {:else if $selectedChild}
        <!-- Recursive DetailView for selected child -->
        <svelte:self
            headline={$selectedChild}
            parentChain={[...$parentChain, $currentHeadline]}
            onBreadcrumbClick={handleChildBreadcrumbClick}
        />
    {:else}
        <!-- Main detail view -->
        <div class="space-y-4">
            <!-- Breadcrumb Navigation -->
            <Breadcrumb class="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            href="#"
                            onclick={(e) => {
                                e.preventDefault();
                                handleHomeClick();
                            }}
                            class="hover:text-blue-600 flex items-center gap-1"
                        >
                            <Home class="h-4 w-4" />
                            Home
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {#if $parentChain.length > 0}
                        <BreadcrumbSeparator />
                        {#each $parentChain as parent, i}
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    href="#"
                                    onclick={(e) => {
                                        e.preventDefault();
                                        handleBreadcrumbNavigation(i);
                                    }}
                                    class="hover:text-blue-600"
                                >
                                    {parent.title.raw.replace(
                                        /^\*+\s+(?:\w+\s+)?(?:\[\#.\]\s+)?/,
                                        "",
                                    )}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                        {/each}
                    {/if}
                    <BreadcrumbItem>
                        <BreadcrumbPage class="font-medium">
                            {$cleanedTitle}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <!-- Headline Title, Status, Priority, Tags -->
            <div class="flex items-center gap-2 mb-2">
                {#if $currentHeadline.title.todo_keyword}
                    <Badge
                        class={cn(
                            $todoBadgeClass,
                            $currentHeadline.title.todo_keyword ===
                                "CANCELLED" && "line-through",
                            "text-xs font-medium",
                        )}
                        variant="secondary"
                    >
                        {$currentHeadline.title.todo_keyword}
                    </Badge>
                {/if}

                {#if $currentHeadline.title.priority}
                    <span
                        class="px-1.5 py-0.5 font-mono rounded text-xs {$priorityColorClass}"
                    >
                        [#{$currentHeadline.title.priority}]
                    </span>
                {/if}

                <span class="font-semibold text-lg">
                    {$cleanedTitle}
                </span>

                {#if $currentHeadline.title.tags && $currentHeadline.title.tags.length > 0}
                    <span class="flex gap-1">
                        {#each $currentHeadline.title.tags as tag}
                            <Badge variant="default" class="text-xs">
                                {tag}
                            </Badge>
                        {/each}
                    </span>
                {/if}
            </div>

            <!-- Properties -->
            {#if $hasProperties}
                <div class="mb-2 grid grid-cols-3 gap-2">
                    {#each Object.entries($currentHeadline.title.properties) as [key, value]}
                        <div class="text-gray-500 font-medium">{key}:</div>
                        <div class="text-gray-800 col-span-2">{value}</div>
                    {/each}
                </div>
            {/if}

            <!-- Planning Information -->
            {#if $formattedPlanning}
                <div class="p-3 bg-gray-50 rounded mb-4 text-sm">
                    <h3 class="font-medium text-gray-700 mb-2">Planning</h3>
                    <div class="grid grid-cols-3 gap-2">
                        {#each Object.entries($formattedPlanning) as [key, value]}
                            <div class="text-gray-500 font-medium uppercase">
                                {key}:
                            </div>
                            <div class="text-gray-800 col-span-2">
                                {value}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Content (displayed above child headlines table as per requirements) -->
            {#if $hasContent}
                <div
                    class="mb-4 prose prose-sm max-w-none p-3 bg-gray-50 rounded overflow-x-auto"
                >
                    {@html $formattedContent}
                </div>
            {/if}

            <!-- Table of Child Headlines (if any) -->
            {#if $hasChildren}
                <div class="mt-6">
                    <h3 class="mb-2 font-medium text-gray-700">
                        Subtasks / Child Headlines ({$currentHeadline.children
                            .length})
                    </h3>
                    <HeadlinesList
                        headlines={$currentHeadline.children}
                        focusedIndex={-1}
                        activeFilter="all"
                        on:headlineSelected={handleChildSelected}
                    />
                </div>
            {/if}
        </div>
    {/if}
</div>
