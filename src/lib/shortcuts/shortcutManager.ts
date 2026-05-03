export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutConfig {
    key: string;
    modifiers?: {
        ctrl?: boolean;
        alt?: boolean;
        meta?: boolean;
        shift?: boolean;
    };
    scope?: string;
    handler: ShortcutHandler;
    description?: string;
}

interface RegisteredShortcut extends ShortcutConfig {
    id: string;
    ctrl?: boolean;
    alt?: boolean;
    meta?: boolean;
    shift?: boolean;
}

const SCOPE_PRIORITY: Record<string, number> = {
    global: 0,
    modal: 100,
    "detail-view": 50,
};

let registry = new Map<string, RegisteredShortcut>();
let activeContexts: Set<string> = new Set(["global"]);
let globalListenerAttached = false;
let nextId = 1;

function generateId(): string {
    return `shortcut-${nextId++}`;
}

function matchesShortcut(event: KeyboardEvent, shortcut: RegisteredShortcut): boolean {
    const eventKey = event.key.toLowerCase();
    const shortcutKey = shortcut.key.toLowerCase();

    if (eventKey !== shortcutKey) return false;

    const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
    const altMatch = shortcut.alt ? event.altKey : !event.altKey;
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const metaMatch = shortcut.meta !== undefined ? event.metaKey === shortcut.meta : true;

    return ctrlMatch && altMatch && shiftMatch && metaMatch;
}

function getShortcutScopePriority(scope: string | undefined): number {
    if (!scope) return SCOPE_PRIORITY.global;
    return SCOPE_PRIORITY[scope] ?? SCOPE_PRIORITY.global;
}

function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        (target && target.isContentEditable);

    if (isEditable) return;

    const activeScopes = Array.from(activeContexts).sort(
        (a, b) => getShortcutScopePriority(b) - getShortcutScopePriority(a)
    );

    for (const [, shortcut] of registry) {
        const scope = shortcut.scope || "global";
        if (!activeScopes.includes(scope)) continue;

        if (matchesShortcut(event, shortcut)) {
            const result = shortcut.handler(event);
            if (result === true || event.defaultPrevented) {
                event.preventDefault();
            }
            return;
        }
    }
}

function attachGlobalListener() {
    if (!globalListenerAttached) {
        window.addEventListener("keydown", handleKeyDown);
        globalListenerAttached = true;
    }
}

/**
 * Registers a keyboard shortcut in the central registry.
 * @param config - The shortcut configuration including key, optional modifiers, scope, handler, and description
 * @returns A unique identifier for the registered shortcut that can be used to unregister it
 */
export function registerShortcut(config: ShortcutConfig): string {
    const id = generateId();
    const shortcut: RegisteredShortcut = {
        ...config,
        id,
        ctrl: config.modifiers?.ctrl,
        alt: config.modifiers?.alt,
        meta: config.modifiers?.meta,
        shift: config.modifiers?.shift,
        scope: config.scope || "global",
    };
    registry.set(id, shortcut);
    attachGlobalListener();
    return id;
}

/**
 * Unregisters a keyboard shortcut from the central registry.
 * @param id - The unique identifier returned when the shortcut was registered
 * @returns True if the shortcut was found and removed, false otherwise
 */
export function unregisterShortcut(id: string): boolean {
    return registry.delete(id);
}

/**
 * Unregisters all shortcuts that match a given scope.
 * @param scope - The scope string to match when removing shortcuts
 * @returns The number of shortcuts that were removed
 */
export function unregisterShortcutsByScope(scope: string): number {
    let count = 0;
    for (const [id, shortcut] of registry) {
        if (shortcut.scope === scope) {
            registry.delete(id);
            count++;
        }
    }
    return count;
}

/**
 * Activates a shortcut context, making all shortcuts with that scope active.
 * @param scope - The scope string to activate (e.g., 'modal', 'detail-view')
 */
export function activateContext(scope: string): void {
    activeContexts.add(scope);
}

/**
 * Deactivates a shortcut context, making all shortcuts with that scope inactive.
 * @param scope - The scope string to deactivate
 */
export function deactivateContext(scope: string): void {
    activeContexts.delete(scope);
}

/**
 * Checks whether a particular context is currently active.
 * @param scope - The scope string to check
 * @returns True if the context is active, false otherwise
 */
export function isContextActive(scope: string): boolean {
    return activeContexts.has(scope);
}

/**
 * Returns a list of all currently active contexts.
 * @returns An array of scope strings that are currently active
 */
export function getActiveContexts(): string[] {
    return Array.from(activeContexts);
}

/**
 * Returns all registered shortcuts in the central registry.
 * @returns An array of shortcut configurations with their unique IDs
 */
export function getAllShortcuts(): Array<ShortcutConfig & { id: string }> {
    return Array.from(registry.values()).map((s) => ({
        id: s.id,
        key: s.key,
        modifiers: {
            ctrl: s.ctrl,
            alt: s.alt,
            meta: s.meta,
            shift: s.shift,
        },
        scope: s.scope,
        handler: s.handler,
        description: s.description,
    }));
}

/**
 * Returns all registered shortcuts filtered by a specific scope.
 * @param scope - The scope string to filter by
 * @returns An array of shortcut configurations for the specified scope
 */
export function getShortcutsByScope(scope: string): Array<ShortcutConfig & { id: string }> {
    return Array.from(registry.values())
        .filter((s) => s.scope === scope)
        .map((s) => ({
            id: s.id,
            key: s.key,
            modifiers: {
                ctrl: s.ctrl,
                alt: s.alt,
                meta: s.meta,
                shift: s.shift,
            },
            scope: s.scope,
            handler: s.handler,
            description: s.description,
        }));
}

/**
 * Returns the current number of shortcuts in the registry.
 * @returns The number of registered shortcuts
 */
export function getRegistrySize(): number {
    return registry.size;
}

/**
 * Clears the registry and resets all state. Primarily for testing purposes.
 */
export function resetRegistry(): void {
    registry.clear();
    activeContexts.clear();
    activeContexts.add("global");
    nextId = 1;
}
