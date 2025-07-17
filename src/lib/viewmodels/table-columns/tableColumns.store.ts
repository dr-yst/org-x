import { writable, derived, get } from "svelte/store";
import { commands } from "$lib/bindings";
import type { UserSettings } from "$lib/bindings";
import { refresh as refreshHomeView } from "$lib/viewmodels/homeview.store";

// Temporary type definition until bindings are regenerated
export interface TableColumnConfig {
  id: string;
  visible: boolean;
  order: number;
}

// Helper function to trigger document reload after settings change
async function triggerDocumentReload(): Promise<void> {
  try {
    const result = await commands.reloadDocumentsWithSettings();
    if (result.status === "ok") {
      console.log("Documents reloaded with updated table columns");
      // Refresh the frontend to show updated table
      await refreshHomeView();
      console.log("Frontend refreshed to show updated table");
    } else {
      console.error("Failed to reload documents:", result.error);
    }
  } catch (error) {
    console.error("Error reloading documents:", error);
  }
}

/**
 * TableColumns ViewModel Store
 *
 * Manages the state and business logic for table columns configuration.
 * Following MVVM pattern - this is the ViewModel layer that separates
 * UI state management from the View components.
 */

// State interface
interface TableColumnsState {
  columns: TableColumnConfig[];
  availableColumns: string[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TableColumnsState = {
  columns: [],
  availableColumns: [],
  loading: false,
  error: null,
};

// Main store
const tableColumnsStore = writable<TableColumnsState>(initialState);

// Derived stores for convenient access
export const columns = derived(tableColumnsStore, ($store) => $store.columns);
export const availableColumns = derived(
  tableColumnsStore,
  ($store) => $store.availableColumns,
);
export const visibleColumns = derived(tableColumnsStore, ($store) =>
  $store.columns.filter((col) => col.visible).sort((a, b) => a.order - b.order),
);
export const isLoading = derived(tableColumnsStore, ($store) => $store.loading);
export const error = derived(tableColumnsStore, ($store) => $store.error);

// Helper function to update store
function updateStore(updater: (state: TableColumnsState) => TableColumnsState) {
  tableColumnsStore.update(updater);
}

// Helper function to set loading state
function setLoading(loading: boolean) {
  updateStore((state) => ({ ...state, loading }));
}

// Helper function to set error
function setError(error: string | null) {
  updateStore((state) => ({ ...state, error }));
}

// Action: Load table columns configuration
export async function loadTableColumns(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const [columnsResult, availableResult] = await Promise.all([
      commands.getTableColumns(),
      commands.getAvailableTableColumns(),
    ]);

    if (columnsResult.status === "ok" && availableResult.status === "ok") {
      updateStore((state) => ({
        ...state,
        columns: columnsResult.data,
        availableColumns: availableResult.data,
        loading: false,
        error: null,
      }));
    } else {
      const error =
        columnsResult.status === "error"
          ? columnsResult.error
          : availableResult.error;
      setError(error || "Failed to load table columns");
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to load table columns",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Add column
export async function addColumn(columnId: string): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const currentState = get(tableColumnsStore);
    const maxOrder = Math.max(...currentState.columns.map((c) => c.order), -1);

    const newColumn: TableColumnConfig = {
      id: columnId,
      visible: true,
      order: maxOrder + 1,
    };

    const result = await commands.addTableColumn(newColumn);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        columns: result.data.table_columns,
        loading: false,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to add column");
  } finally {
    setLoading(false);
  }
}

// Action: Remove column
export async function removeColumn(index: number): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const currentState = get(tableColumnsStore);

    if (index < 0 || index >= currentState.columns.length) {
      setError("Invalid column index");
      return;
    }

    const result = await commands.removeTableColumn(index);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        columns: result.data.table_columns,
        loading: false,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to remove column");
  } finally {
    setLoading(false);
  }
}

// Action: Toggle column visibility
export async function toggleColumnVisibility(columnId: string): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const currentState = get(tableColumnsStore);
    const column = currentState.columns.find((col) => col.id === columnId);

    if (!column) {
      setError("Column not found");
      return;
    }

    const result = await commands.setColumnVisibility(
      columnId,
      !column.visible,
    );

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        columns: result.data.table_columns,
        loading: false,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to toggle column visibility",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Reorder columns
export async function reorderColumns(
  newColumns: TableColumnConfig[],
): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.updateTableColumns(newColumns);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        columns: result.data.table_columns,
        loading: false,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to reorder columns");
  } finally {
    setLoading(false);
  }
}

// Action: Move column
export async function moveColumn(
  index: number,
  direction: -1 | 1,
): Promise<void> {
  const currentState = get(tableColumnsStore);
  const newIndex = index + direction;

  if (newIndex < 0 || newIndex >= currentState.columns.length) {
    return; // Can't move outside bounds
  }

  const newColumns = [...currentState.columns];
  [newColumns[index], newColumns[newIndex]] = [
    newColumns[newIndex],
    newColumns[index],
  ];

  // Update order values
  newColumns.forEach((col, i) => {
    col.order = i;
  });

  await reorderColumns(newColumns);
}

// Action: Reset to defaults
export async function resetToDefaults(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.resetTableColumnsToDefaults();

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        columns: result.data.table_columns,
        loading: false,
        error: null,
      }));
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

// Action: Get available columns that are not currently visible
export function getAvailableColumnsToAdd(): string[] {
  const currentState = get(tableColumnsStore);
  const visibleColumnIds = new Set(currentState.columns.map((col) => col.id));
  return currentState.availableColumns.filter(
    (id) => !visibleColumnIds.has(id),
  );
}

// Action: Get built-in vs custom property columns
export function getColumnsByType(): {
  builtIn: string[];
  customProperties: string[];
} {
  const currentState = get(tableColumnsStore);
  const builtIn: string[] = [];
  const customProperties: string[] = [];

  currentState.availableColumns.forEach((columnId) => {
    if (columnId.startsWith("property:")) {
      customProperties.push(columnId);
    } else {
      builtIn.push(columnId);
    }
  });

  return { builtIn, customProperties };
}

// Action: Clear error
export function clearError(): void {
  setError(null);
}

// Export store object for backwards compatibility and easier testing
const tableColumns = {
  // State subscriptions
  subscribe: tableColumnsStore.subscribe,
  columns: { subscribe: columns.subscribe },
  availableColumns: { subscribe: availableColumns.subscribe },
  visibleColumns: { subscribe: visibleColumns.subscribe },
  isLoading: { subscribe: isLoading.subscribe },
  error: { subscribe: error.subscribe },

  // Actions
  loadTableColumns,
  addColumn,
  removeColumn,
  toggleColumnVisibility,
  reorderColumns,
  moveColumn,
  resetToDefaults,
  getAvailableColumnsToAdd,
  getColumnsByType,
  clearError,
};

export default tableColumns;
