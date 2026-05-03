import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
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
    type ShortcutConfig,
} from "./shortcutManager";

describe("shortcutManager", () => {
    beforeEach(() => {
        resetRegistry();
    });

    afterEach(() => {
        resetRegistry();
    });

    describe("registerShortcut", () => {
        it("should register a shortcut and return an id", () => {
            const handler = vi.fn();
            const id = registerShortcut({ key: "j", handler });
            expect(id).toBe("shortcut-1");
        });

        it("should register multiple shortcuts with unique ids", () => {
            const handler = vi.fn();
            const id1 = registerShortcut({ key: "j", handler });
            const id2 = registerShortcut({ key: "k", handler });
            expect(id1).not.toBe(id2);
            expect(getRegistrySize()).toBe(2);
        });

        it("should store the shortcut in the registry", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", handler });
            expect(getRegistrySize()).toBe(1);
        });
    });

    describe("unregisterShortcut", () => {
        it("should remove a shortcut by id", () => {
            const handler = vi.fn();
            const id = registerShortcut({ key: "j", handler });
            expect(getRegistrySize()).toBe(1);
            
            const removed = unregisterShortcut(id);
            expect(removed).toBe(true);
            expect(getRegistrySize()).toBe(0);
        });

        it("should return false if shortcut not found", () => {
            const removed = unregisterShortcut("non-existent-id");
            expect(removed).toBe(false);
        });
    });

    describe("unregisterShortcutsByScope", () => {
        it("should remove all shortcuts with a given scope", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", scope: "global", handler });
            registerShortcut({ key: "k", scope: "modal", handler });
            registerShortcut({ key: "l", scope: "modal", handler });
            
            const count = unregisterShortcutsByScope("modal");
            expect(count).toBe(2);
            expect(getRegistrySize()).toBe(1);
        });
    });

    describe("context management", () => {
        it("should activate a context", () => {
            activateContext("modal");
            expect(isContextActive("modal")).toBe(true);
        });

        it("should deactivate a context", () => {
            activateContext("modal");
            deactivateContext("modal");
            expect(isContextActive("modal")).toBe(false);
        });

        it("should have global context active by default", () => {
            expect(isContextActive("global")).toBe(true);
        });

        it("should return all active contexts", () => {
            activateContext("modal");
            activateContext("detail-view");
            const contexts = getActiveContexts();
            expect(contexts).toContain("global");
            expect(contexts).toContain("modal");
            expect(contexts).toContain("detail-view");
        });
    });

    describe("getAllShortcuts", () => {
        it("should return all registered shortcuts", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", handler, description: "Move down" });
            registerShortcut({ key: "k", handler, description: "Move up" });
            
            const shortcuts = getAllShortcuts();
            expect(shortcuts).toHaveLength(2);
            expect(shortcuts[0].key).toBe("j");
            expect(shortcuts[1].key).toBe("k");
        });

        it("should include description in returned shortcuts", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", handler, description: "Move down" });
            
            const shortcuts = getAllShortcuts();
            expect(shortcuts[0].description).toBe("Move down");
        });
    });

    describe("getShortcutsByScope", () => {
        it("should return shortcuts filtered by scope", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", scope: "global", handler });
            registerShortcut({ key: "k", scope: "modal", handler });
            
            const modalShortcuts = getShortcutsByScope("modal");
            expect(modalShortcuts).toHaveLength(1);
            expect(modalShortcuts[0].key).toBe("k");
        });
    });

    describe("getRegistrySize", () => {
        it("should return the number of registered shortcuts", () => {
            const handler = vi.fn();
            expect(getRegistrySize()).toBe(0);
            
            registerShortcut({ key: "j", handler });
            expect(getRegistrySize()).toBe(1);
            
            registerShortcut({ key: "k", handler });
            expect(getRegistrySize()).toBe(2);
        });
    });

    describe("resetRegistry", () => {
        it("should clear all shortcuts and reset state", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", handler });
            activateContext("modal");
            
            resetRegistry();
            
            expect(getRegistrySize()).toBe(0);
            expect(getActiveContexts()).toEqual(["global"]);
        });
    });

    describe("key matching with modifiers", () => {
        it("should register and match simple key", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", handler });
            
            const shortcuts = getAllShortcuts();
            expect(shortcuts[0].key).toBe("j");
        });

        it("should register key with ctrl modifier", () => {
            const handler = vi.fn();
            registerShortcut({ key: "1", modifiers: { ctrl: true }, handler });
            
            const shortcuts = getAllShortcuts();
            expect(shortcuts[0].modifiers?.ctrl).toBe(true);
        });

        it("should register key with meta modifier", () => {
            const handler = vi.fn();
            registerShortcut({ key: "1", modifiers: { meta: true }, handler });
            
            const shortcuts = getAllShortcuts();
            expect(shortcuts[0].modifiers?.meta).toBe(true);
        });
    });

    describe("scope priority", () => {
        it("should assign default scope to 'global'", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", handler });
            
            const shortcuts = getAllShortcuts();
            expect(shortcuts[0].scope).toBe("global");
        });

        it("should preserve custom scope", () => {
            const handler = vi.fn();
            registerShortcut({ key: "j", scope: "modal", handler });
            
            const shortcuts = getAllShortcuts();
            expect(shortcuts[0].scope).toBe("modal");
        });
    });
});