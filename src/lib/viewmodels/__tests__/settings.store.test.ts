import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import settingsStore, {
    settingsDialogOpen,
    openDialog,
    closeDialog,
    toggleDialog,
} from '../settings.store';

describe('Settings Store', () => {
    beforeEach(() => {
        // Reset the store to default state before each test
        settingsDialogOpen.set(false);
    });

    describe('Initial State', () => {
        it('should initialize with dialog closed', () => {
            expect(get(settingsDialogOpen)).toBe(false);
        });

        it('should provide correct initial state through store object', () => {
            expect(get(settingsStore.dialogOpen)).toBe(false);
        });
    });

    describe('openDialog', () => {
        it('should set dialog open to true', () => {
            openDialog();
            expect(get(settingsDialogOpen)).toBe(true);
        });

        it('should work when called multiple times', () => {
            openDialog();
            openDialog();
            expect(get(settingsDialogOpen)).toBe(true);
        });

        it('should work through store object', () => {
            settingsStore.openDialog();
            expect(get(settingsDialogOpen)).toBe(true);
        });
    });

    describe('closeDialog', () => {
        it('should set dialog open to false', () => {
            // First open the dialog
            settingsDialogOpen.set(true);

            closeDialog();
            expect(get(settingsDialogOpen)).toBe(false);
        });

        it('should work when dialog is already closed', () => {
            closeDialog();
            expect(get(settingsDialogOpen)).toBe(false);
        });

        it('should work through store object', () => {
            settingsDialogOpen.set(true);

            settingsStore.closeDialog();
            expect(get(settingsDialogOpen)).toBe(false);
        });
    });

    describe('toggleDialog', () => {
        it('should toggle dialog from closed to open', () => {
            expect(get(settingsDialogOpen)).toBe(false);

            toggleDialog();
            expect(get(settingsDialogOpen)).toBe(true);
        });

        it('should toggle dialog from open to closed', () => {
            settingsDialogOpen.set(true);

            toggleDialog();
            expect(get(settingsDialogOpen)).toBe(false);
        });

        it('should work through multiple toggles', () => {
            expect(get(settingsDialogOpen)).toBe(false);

            toggleDialog();
            expect(get(settingsDialogOpen)).toBe(true);

            toggleDialog();
            expect(get(settingsDialogOpen)).toBe(false);

            toggleDialog();
            expect(get(settingsDialogOpen)).toBe(true);
        });

        it('should work through store object', () => {
            expect(get(settingsDialogOpen)).toBe(false);

            settingsStore.toggleDialog();
            expect(get(settingsDialogOpen)).toBe(true);
        });
    });

    describe('Store Reactivity', () => {
        it('should notify subscribers when dialog state changes', () => {
            let currentValue = false;

            const unsubscribe = settingsDialogOpen.subscribe(value => {
                currentValue = value;
            });

            openDialog();
            expect(currentValue).toBe(true);

            closeDialog();
            expect(currentValue).toBe(false);

            unsubscribe();
        });

        it('should work with store subscription', () => {
            let currentValue = false;

            const unsubscribe = settingsStore.dialogOpen.subscribe(value => {
                currentValue = value;
            });

            settingsStore.openDialog();
            expect(currentValue).toBe(true);

            settingsStore.closeDialog();
            expect(currentValue).toBe(false);

            unsubscribe();
        });
    });

    describe('Store Object Structure', () => {
        it('should have all required properties', () => {
            expect(settingsStore).toHaveProperty('dialogOpen');
            expect(settingsStore).toHaveProperty('openDialog');
            expect(settingsStore).toHaveProperty('closeDialog');
            expect(settingsStore).toHaveProperty('toggleDialog');
        });

        it('should have subscribe method on dialogOpen', () => {
            expect(typeof settingsStore.dialogOpen.subscribe).toBe('function');
        });

        it('should have correct function types', () => {
            expect(typeof settingsStore.openDialog).toBe('function');
            expect(typeof settingsStore.closeDialog).toBe('function');
            expect(typeof settingsStore.toggleDialog).toBe('function');
        });
    });

    describe('Integration Tests', () => {
        it('should handle complex state transitions', () => {
            // Start closed
            expect(get(settingsDialogOpen)).toBe(false);

            // Open -> should be true
            openDialog();
            expect(get(settingsDialogOpen)).toBe(true);

            // Toggle -> should be false
            toggleDialog();
            expect(get(settingsDialogOpen)).toBe(false);

            // Toggle -> should be true
            toggleDialog();
            expect(get(settingsDialogOpen)).toBe(true);

            // Close -> should be false
            closeDialog();
            expect(get(settingsDialogOpen)).toBe(false);
        });

        it('should maintain state consistency across different access methods', () => {
            // Use direct function
            openDialog();
            expect(get(settingsStore.dialogOpen)).toBe(true);

            // Use store object method
            settingsStore.closeDialog();
            expect(get(settingsDialogOpen)).toBe(false);

            // Use store object toggle
            settingsStore.toggleDialog();
            expect(get(settingsDialogOpen)).toBe(true);

            // Use direct toggle
            toggleDialog();
            expect(get(settingsStore.dialogOpen)).toBe(false);
        });
    });
});
