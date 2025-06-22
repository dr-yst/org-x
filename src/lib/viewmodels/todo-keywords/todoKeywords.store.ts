import { writable, derived, get } from "svelte/store";
import { commands } from "$lib/bindings";
import type { TodoKeywords, UserSettings } from "$lib/bindings";

/**
 * TodoKeywords ViewModel Store
 *
 * Manages the state and business logic for TODO keywords configuration.
 * Following MVVM pattern - this is the ViewModel layer that separates
 * UI state management from the View components.
 */

// State interface
interface TodoKeywordsState {
  active: string[];
  closed: string[];
  editingIndex: {
    active: number | null;
    closed: number | null;
  };
  dirty: boolean;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TodoKeywordsState = {
  active: [],
  closed: [],
  editingIndex: {
    active: null,
    closed: null,
  },
  dirty: false,
  loading: false,
  error: null,
};

// Main store
const todoKeywordsStore = writable<TodoKeywordsState>(initialState);

// Derived stores for convenient access
export const activeKeywords = derived(
  todoKeywordsStore,
  ($store) => $store.active,
);
export const closedKeywords = derived(
  todoKeywordsStore,
  ($store) => $store.closed,
);
export const isLoading = derived(todoKeywordsStore, ($store) => $store.loading);
export const isDirty = derived(todoKeywordsStore, ($store) => $store.dirty);
export const error = derived(todoKeywordsStore, ($store) => $store.error);
export const editingIndex = derived(
  todoKeywordsStore,
  ($store) => $store.editingIndex,
);

// Helper function to update store
function updateStore(updater: (state: TodoKeywordsState) => TodoKeywordsState) {
  todoKeywordsStore.update(updater);
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

// Action: Load TODO keywords from settings
export async function loadTodoKeywords(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.getUserTodoKeywords();

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.active],
        closed: [...result.data.closed],
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to load TODO keywords",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Save TODO keywords to settings
export async function saveTodoKeywords(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const currentState = get(todoKeywordsStore);

    const todoKeywords: TodoKeywords = {
      active: currentState.active,
      closed: currentState.closed,
    };

    const result = await commands.updateTodoKeywords(todoKeywords);

    if (result.status === "ok") {
      markClean();
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to save TODO keywords",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Add active keyword
export async function addActiveKeyword(keyword: string): Promise<void> {
  if (!keyword.trim()) {
    setError("Keyword cannot be empty");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const result = await commands.addActiveTodoKeyword(keyword.trim());

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to add active keyword",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Add closed keyword
export async function addClosedKeyword(keyword: string): Promise<void> {
  if (!keyword.trim()) {
    setError("Keyword cannot be empty");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const result = await commands.addClosedTodoKeyword(keyword.trim());

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to add closed keyword",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Remove active keyword
export async function removeActiveKeyword(index: number): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.removeActiveTodoKeyword(index);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to remove active keyword",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Remove closed keyword
export async function removeClosedKeyword(index: number): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.removeClosedTodoKeyword(index);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to remove closed keyword",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Edit active keyword
export async function editActiveKeyword(
  index: number,
  newKeyword: string,
): Promise<void> {
  if (!newKeyword.trim()) {
    setError("Keyword cannot be empty");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const result = await commands.editActiveTodoKeyword(
      index,
      newKeyword.trim(),
    );

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        editingIndex: { ...state.editingIndex, active: null },
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to edit active keyword",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Edit closed keyword
export async function editClosedKeyword(
  index: number,
  newKeyword: string,
): Promise<void> {
  if (!newKeyword.trim()) {
    setError("Keyword cannot be empty");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const result = await commands.editClosedTodoKeyword(
      index,
      newKeyword.trim(),
    );

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        editingIndex: { ...state.editingIndex, closed: null },
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to edit closed keyword",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Move active keyword
export async function moveActiveKeyword(
  index: number,
  direction: -1 | 1,
): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.moveActiveTodoKeyword(index, direction);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to move active keyword",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Move closed keyword
export async function moveClosedKeyword(
  index: number,
  direction: -1 | 1,
): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.moveClosedTodoKeyword(index, direction);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        loading: false,
        dirty: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to move closed keyword",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Set editing index
export function setEditingActiveIndex(index: number | null): void {
  updateStore((state) => ({
    ...state,
    editingIndex: { ...state.editingIndex, active: index },
  }));
}

export function setEditingClosedIndex(index: number | null): void {
  updateStore((state) => ({
    ...state,
    editingIndex: { ...state.editingIndex, closed: index },
  }));
}

// Action: Reset to defaults
export async function resetToDefaults(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.resetTodoKeywordsToDefaults();

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        active: [...result.data.todo_keywords.active],
        closed: [...result.data.todo_keywords.closed],
        editingIndex: { active: null, closed: null },
        loading: false,
        dirty: false,
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

// Action: Clear error
export function clearError(): void {
  setError(null);
}

// Export store object for backwards compatibility and easier testing
const todoKeywords = {
  // State subscriptions
  subscribe: todoKeywordsStore.subscribe,
  activeKeywords: { subscribe: activeKeywords.subscribe },
  closedKeywords: { subscribe: closedKeywords.subscribe },
  isLoading: { subscribe: isLoading.subscribe },
  isDirty: { subscribe: isDirty.subscribe },
  error: { subscribe: error.subscribe },
  editingIndex: { subscribe: editingIndex.subscribe },

  // Actions
  loadTodoKeywords,
  saveTodoKeywords,
  addActiveKeyword,
  addClosedKeyword,
  removeActiveKeyword,
  removeClosedKeyword,
  editActiveKeyword,
  editClosedKeyword,
  moveActiveKeyword,
  moveClosedKeyword,
  setEditingActiveIndex,
  setEditingClosedIndex,
  resetToDefaults,
  clearError,
};

export default todoKeywords;
