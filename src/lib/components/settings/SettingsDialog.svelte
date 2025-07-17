<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import {
        settingsDialogOpen,
        closeDialog,
    } from "$lib/viewmodels/settings.store";
    import TodoKeywordsSection from "./TodoKeywordsSection.svelte";
    import CustomPropertiesSection from "./CustomPropertiesSection.svelte";
    import ExternalEditorSection from "./ExternalEditorSection.svelte";
    import TableColumnsSection from "./TableColumnsSection.svelte";
    import {
        Settings,
        Keyboard,
        FileText,
        Calendar,
        ExternalLink,
        Table,
        Palette,
    } from "@lucide/svelte";

    // Reactive binding to the settings dialog open state
    let dialogOpen = $state(false);

    // Subscribe to store changes
    $effect(() => {
        const unsubscribe = settingsDialogOpen.subscribe((value) => {
            dialogOpen = value;
        });
        return unsubscribe;
    });

    // Handle dialog open/close changes
    $effect(() => {
        settingsDialogOpen.set(dialogOpen);
    });

    function handleOpenChange(open: boolean) {
        if (!open) {
            closeDialog();
        }
    }

    // Placeholder sections for future settings implementation
    const settingSections = [
        {
            title: "Date Format",
            description:
                "Customize date display format throughout the application",
            icon: Calendar,
            comingSoon: true,
        },

        {
            title: "Keyboard Shortcuts",
            description: "Customize keybindings and shortcuts",
            icon: Keyboard,
            comingSoon: true,
        },
        {
            title: "Appearance",
            description: "Theme and visual preferences",
            icon: Palette,
            comingSoon: true,
        },
    ];
</script>

<Dialog.Root bind:open={dialogOpen} onOpenChange={handleOpenChange}>
    <Dialog.Content class="max-w-2xl">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Settings class="h-5 w-5" />
                Settings
            </Dialog.Title>
            <Dialog.Description>
                Configure Org-X preferences and customize your workflow.
            </Dialog.Description>
        </Dialog.Header>

        <div class="py-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <!-- Custom Properties Section -->
            <div class="space-y-3">
                <CustomPropertiesSection />
            </div>
            <!-- TODO Keywords Section -->
            <div class="space-y-3">
                <TodoKeywordsSection />
            </div>
            <!-- External Editor Section -->
            <div class="space-y-3">
                <ExternalEditorSection />
            </div>
            <!-- Table Columns Section -->
            <div class="space-y-3">
                <TableColumnsSection />
            </div>

            <Separator class="my-4" />

            {#each settingSections as section, index (section.title)}
                <div class="space-y-3">
                    <div
                        class="flex items-start gap-3 p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/10"
                        class:opacity-60={section.comingSoon}
                    >
                        <div class="flex-shrink-0 mt-1">
                            <section.icon
                                class="h-5 w-5 text-muted-foreground"
                            />
                        </div>
                        <div class="flex-1 space-y-1">
                            <h3
                                class="font-medium text-sm flex items-center gap-2"
                            >
                                {section.title}
                                {#if section.comingSoon}
                                    <span
                                        class="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                                    >
                                        Coming Soon
                                    </span>
                                {/if}
                            </h3>
                            <p class="text-sm text-muted-foreground">
                                {section.description}
                            </p>
                        </div>
                    </div>
                    {#if index < settingSections.length - 1}
                        <Separator class="my-4" />
                    {/if}
                </div>
            {/each}

            <!-- Help text -->
            <div class="mt-6 p-4 bg-muted/20 rounded-lg">
                <p class="text-sm text-muted-foreground text-center">
                    Settings functionality is being developed incrementally.
                    Each section will be implemented in upcoming releases.
                </p>
            </div>
        </div>

        <Dialog.Footer class="flex justify-between items-center">
            <div class="text-sm text-muted-foreground">
                Version 0.1.0 • More settings coming soon
            </div>
            <Dialog.Close>
                <Button variant="outline">Close</Button>
            </Dialog.Close>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
