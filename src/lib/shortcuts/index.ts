export {
    registerShortcut,
    unregisterShortcut,
    unregisterShortcutsByScope,
    activateContext,
    deactivateContext,
    isContextActive,
    getActiveContexts,
    getAllShortcuts,
    getShortcutsByScope,
    getRegistrySize,
    resetRegistry,
    type ShortcutHandler,
    type ShortcutConfig,
} from "./shortcutManager";

export { useShortcuts, type UseShortcutsOptions } from "./useShortcuts";
