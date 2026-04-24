import type { ShortcutConfig } from "./shortcutManager";
import {
    registerShortcut,
    unregisterShortcut,
    activateContext,
    deactivateContext,
} from "./shortcutManager";

export interface UseShortcutsOptions {
    scope?: string;
}

/**
 * Creates a Svelte action that manages keyboard shortcuts for a DOM node.
 * The action automatically registers shortcuts on mount and unregisters on unmount.
 * It also handles reactive updates when the shortcuts array changes.
 *
 * @param options - Configuration options
 * @param options.scope - The scope for these shortcuts (e.g., 'global', 'modal'). Defaults to 'global'.
 * @returns A Svelte action function that takes a node and a getter function returning shortcuts
 *
 * @example
 * ```svelte
 * <script>
 *   import { useShortcuts } from '$lib/shortcuts';
 *
 *   function shortcutsGetter() {
 *     return [
 *       { key: 'j', handler: handleMoveDown, description: 'Move down' },
 *       { key: 'k', handler: handleMoveUp, description: 'Move up' }
 *     ];
 *   }
 * </script>
 *
 * <div use:useShortcuts={shortcutsGetter}></div>
 * ```
 */
export function useShortcuts(options: UseShortcutsOptions = {}) {
    const scope = options.scope || "global";

    return function (
        node: HTMLElement,
        shortcutsGetter: () => ShortcutConfig[]
    ) {
        const registeredIds: string[] = [];
        let previousShortcuts: ShortcutConfig[] = [];

        if (scope !== "global") {
            activateContext(scope);
        }

        const currentShortcuts = shortcutsGetter();
        for (const shortcut of currentShortcuts) {
            const id = registerShortcut({
                ...shortcut,
                scope: shortcut.scope || scope,
            });
            registeredIds.push(id);
        }
        previousShortcuts = currentShortcuts;

        function update() {
            const currentShortcuts = shortcutsGetter();
            const currentKeys = new Set(
                currentShortcuts.map((s) => `${s.key}-${s.scope || scope}`)
            );
            const previousKeys = new Set(
                previousShortcuts.map((s) => `${s.key}-${s.scope || scope}`)
            );

            const toRemove = previousShortcuts.filter(
                (s) => !currentKeys.has(`${s.key}-${s.scope || scope}`)
            );
            const toAdd = currentShortcuts.filter(
                (s) => !previousKeys.has(`${s.key}-${s.scope || scope}`)
            );

            for (const shortcut of toRemove) {
                const key = `${shortcut.key}-${shortcut.scope || scope}`;
                const idx = registeredIds.findIndex((id, i) => {
                    return (
                        i < previousShortcuts.length &&
                        `${previousShortcuts[i].key}-${previousShortcuts[i].scope || scope}` ===
                            key
                    );
                });
                if (idx !== -1) {
                    unregisterShortcut(registeredIds[idx]);
                    registeredIds.splice(idx, 1);
                }
            }

            for (const shortcut of toAdd) {
                const id = registerShortcut({
                    ...shortcut,
                    scope: shortcut.scope || scope,
                });
                registeredIds.push(id);
            }

            previousShortcuts = currentShortcuts;
        }

        function destroy() {
            for (const id of registeredIds) {
                unregisterShortcut(id);
            }
            registeredIds.length = 0;
            if (scope !== "global") {
                deactivateContext(scope);
            }
        }

        return {
            update,
            destroy,
        };
    };
}
