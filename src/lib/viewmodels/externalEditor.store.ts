import { writable, derived } from "svelte/store";
import { commands } from "$lib/bindings";

/**
 * External Editor ViewModel Store
 *
 * Manages the state and business logic for external editor command configuration.
 * Following MVVM pattern - this is the ViewModel layer that separates
 * UI state management from the View components.
 */

// State interface
interface ExternalEditorState {
  command: string;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ExternalEditorState = {
  command: "",
  loading: false,
  error: null,
};

// Main store
const externalEditorStore = writable<ExternalEditorState>(initialState);

// Derived stores for convenient access
export const command = derived(externalEditorStore, ($store) => $store.command);
export const isLoading = derived(
  externalEditorStore,
  ($store) => $store.loading,
);
export const error = derived(externalEditorStore, ($store) => $store.error);

// Helper function to update store
function updateStore(
  updater: (state: ExternalEditorState) => ExternalEditorState,
) {
  externalEditorStore.update(updater);
}

// Helper function to set loading state
function setLoading(loading: boolean) {
  updateStore((state) => ({ ...state, loading }));
}

// Helper function to set error
function setError(error: string | null) {
  updateStore((state) => ({ ...state, error }));
}

// Validation function to ensure command includes {file} placeholder
function validateCommand(command: string): string | null {
  if (!command.trim()) {
    return "Command cannot be empty";
  }
  if (!command.includes("{file}")) {
    return "Command must include {file} placeholder";
  }
  return null;
}

// Action: Load external editor command from settings
export async function loadExternalEditorCommand(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.getExternalEditorCommand();

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        command: result.data,
        loading: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load external editor command",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Set external editor command
export async function setExternalEditorCommand(
  newCommand: string,
): Promise<void> {
  const validationError = validateCommand(newCommand);
  if (validationError) {
    setError(validationError);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const result = await commands.setExternalEditorCommand(newCommand);

    if (result.status === "ok") {
      updateStore((state) => ({
        ...state,
        command: newCommand,
        loading: false,
        error: null,
      }));
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to save external editor command",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Reset external editor command to default
export async function resetExternalEditorCommand(): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    const result = await commands.resetExternalEditorCommand();

    if (result.status === "ok") {
      // Load the command again to get the default value
      await loadExternalEditorCommand();
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to reset external editor command",
    );
  } finally {
    setLoading(false);
  }
}

// Action: Clear error
export function clearError(): void {
  setError(null);
}

// Predefined editor commands for common editors
export const editorPresets = {
  emacs: "emacsclient --no-wait +{line}:{column} {file}",
  vim: "vim +{line} {file}",
  vscode: "code --goto {file}:{line}:{column}",
  atom: "atom {file}:{line}:{column}",
  sublime: "subl {file}:{line}:{column}",
  nano: "nano +{line},{column} {file}",
};

// Export store object for backwards compatibility and easier testing
const externalEditor = {
  // State subscriptions
  subscribe: externalEditorStore.subscribe,
  command: { subscribe: command.subscribe },
  isLoading: { subscribe: isLoading.subscribe },
  error: { subscribe: error.subscribe },

  // Actions
  loadExternalEditorCommand,
  setExternalEditorCommand,
  resetExternalEditorCommand,
  clearError,

  // Utilities
  editorPresets,
};

export default externalEditor;
