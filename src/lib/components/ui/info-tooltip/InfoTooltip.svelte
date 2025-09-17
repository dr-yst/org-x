<script lang="ts">
    import { Info } from "@lucide/svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";

    let { description }: { description: string } = $props();
</script>

<Tooltip.Root>
    <Tooltip.Trigger
        tabindex={0}
        aria-label="Show info"
        class="focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-full"
    >
        <Info
            class="h-4 w-4 text-muted-foreground cursor-pointer transition-colors hover:text-foreground"
        />
    </Tooltip.Trigger>
    <Tooltip.Content side="top" align="center" class="max-w-xs text-center">
        <p>{description}</p>
    </Tooltip.Content>
</Tooltip.Root>
