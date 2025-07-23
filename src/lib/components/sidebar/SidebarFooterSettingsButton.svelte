<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Settings } from "@lucide/svelte";
    import { openDialog } from "$lib/viewmodels/settings.store";

    /**
     * Settings Button Component for Sidebar Footer
     *
     * This component provides a button in the sidebar footer that opens
     * the Settings dialog when clicked. It uses shadcn-svelte Button
     * component for consistent styling.
     */

    function handleClick() {
        try {
            openDialog();
        } catch (error) {
            console.error("Error opening settings dialog:", error);
            // Gracefully handle the error - the UI remains functional
        }
    }
</script>

<Button
    onclick={handleClick}
    variant="ghost"
    size="sm"
    class="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
>
    <Settings class="h-4 w-4" />
    Settings
</Button>
