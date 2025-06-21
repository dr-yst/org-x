import { writable } from 'svelte/store';

/**
 * Settings ViewModel Store
 *
 * Manages the state and business logic for the Settings dialog.
 * Following MVVM pattern - this is the ViewModel layer that separates
 * UI state management from the View components.
 */

// Dialog state
export const settingsDialogOpen = writable(false);

// Actions for managing dialog state
export function openDialog(): void {
    settingsDialogOpen.set(true);
}

export function closeDialog(): void {
    settingsDialogOpen.set(false);
}

export function toggleDialog(): void {
    settingsDialogOpen.update(open => !open);
}

// Export store object for backwards compatibility and easier testing
const settingsStore = {
    // State subscriptions
    dialogOpen: { subscribe: settingsDialogOpen.subscribe },

    // Actions
    openDialog,
    closeDialog,
    toggleDialog,
};

export default settingsStore;
