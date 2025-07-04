import { writable, derived, get } from "svelte/store";
import { commands } from "$lib/bindings";
import type { UserSettings } from "$lib/bindings";
import { refresh as refreshHomeView } from "$lib/viewmodels/homeview.store";

// Helper function to trigger document reload after settings change
async function triggerDocumentReload(): Promise<void> {
  try {
    const result = await commands.reloadDocumentsWithSettings();
    if (result.status === "ok") {
      console.log("Documents reloaded with updated custom properties");
      // Refresh the frontend to show updated headlines
      await refreshHomeView();
      console.log("Frontend refreshed to show updated headlines");
    } else {
      console.error("Failed to reload documents:", result.error);
    }
  } catch (error) {
    console.error("Error reloading documents:", error);
  }
}

/**
 * CustomProperties ViewModel Store
 *
 * Manages the state and business logic for custom headline properties configuration.
 * Following MVVM pattern - this is the ViewModel layer that separates
 * UI state management from the View components.
 */

// State interface
interface CustomPropertiesState {
  properties: string[];
  editingIndex: number | null;
  dirty: boolean;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: CustomPropertiesState = {
  properties: [],
  editingIndex: null,
  dirty: false,
  loading: false,
  error: null,
};

// Main store
const customPropertiesStore = writable<CustomPropertiesState>(initialState);

// Derived stores for convenient access
export const properties = derived(
  customPropertiesStore,
  ($store) => $store.properties,
);
export const isLoading = derived(
  customPropertiesStore,
  ($store) => $store.loading,
);
export const isDirty = derived(customPropertiesStore, ($store) => $store.dirty);
export const error = derived(customPropertiesStore, ($store) => $store.error);
export const editingIndex = derived(
  customPropertiesStore,
  ($store) => $store.editingIndex,
);

// Helper function to update store
function updateStore(
  updater: (state: CustomPropertiesState) => CustomPropertiesState,
) {
  customPropertiesStore.update(updater);
}

// Helper function to set loading state
function setLoading(loading: boolean) {
  updateStore((state) => ({ ...state, loading }));
}

// Helper function to set error
function setError(error: string | null) {
  updateStore((state) => ({ ...state, error }));
}

// Helper function to mark as dirty
function markDirty() {
  updateStore((state) => ({ ...state, dirty: true }));
}

// Helper function to mark as clean
function markClean() {
  updateStore((state) => ({ ...state, dirty: false }));
}

// Action: Load custom properties from settings
export async function loadCustomProperties(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.getCustomProperties();

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        properties: [...result.data],
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to load custom properties",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Add custom property
export async function addCustomProperty(property: string): Promise<void> {
  if (property.length === 0) {
    setError("Property name cannot be empty");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const result = await commands.addCustomProperty(property);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        properties: [...result.data],
        loading: false,
        dirty: false,
        error: null,
      }));
      // Trigger document reload to apply new settings
      await triggerDocumentReload();
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to add custom property",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Remove custom property
export async function removeCustomProperty(index: number): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.removeCustomProperty(index);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        properties: [...result.data],
        loading: false,
        dirty: false,
        error: null,
      }));
      // Trigger document reload to apply new settings
      await triggerDocumentReload();
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to remove custom property",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Edit custom property
export async function editCustomProperty(
  index: number,
  newProperty: string,
): Promise<void> {
  if (newProperty.length === 0) {
    setError("Property name cannot be empty");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const result = await commands.editCustomProperty(index, newProperty);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        properties: [...result.data],
        editingIndex: null,
        loading: false,
        dirty: false,
        error: null,
      }));
      // Trigger document reload to apply new settings
      await triggerDocumentReload();
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to edit custom property",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Move custom property
export async function moveCustomProperty(
  index: number,
  direction: -1 | 1,
): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.moveCustomProperty(index, direction);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        properties: [...result.data],
        loading: false,
        dirty: false,
        error: null,
      }));
      // Trigger document reload to apply new settings
      await triggerDocumentReload();
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to move custom property",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Set editing index
export function setEditingIndex(index: number | null): void {
  updateStore((state) => ({
    ...state,
    editingIndex: index,
  }));
}

// Action: Reset to defaults
export async function resetToDefaults(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.resetCustomPropertiesToDefaults();

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        properties: [...result.data],
        editingIndex: null,
        loading: false,
        dirty: false,
        error: null,
      }));
      // Trigger document reload to apply new settings
      await triggerDocumentReload();
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to reset to defaults",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Clear error
export function clearError(): void {
  setError(null);
}

// Export store object for backwards compatibility and easier testing
const customProperties = {
  // State subscriptions
  subscribe: customPropertiesStore.subscribe,
  properties: { subscribe: properties.subscribe },
  isLoading: { subscribe: isLoading.subscribe },
  isDirty: { subscribe: isDirty.subscribe },
  error: { subscribe: error.subscribe },
  editingIndex: { subscribe: editingIndex.subscribe },

  // Actions
  loadCustomProperties,
  addCustomProperty,
  removeCustomProperty,
  editCustomProperty,
  moveCustomProperty,
  setEditingIndex,
  resetToDefaults,
  clearError,
};

export default customProperties;
