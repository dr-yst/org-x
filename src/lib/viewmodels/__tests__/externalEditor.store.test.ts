import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import externalEditor, {
  command,
  isLoading,
  error,
  loadExternalEditorCommand,
  setExternalEditorCommand,
  resetExternalEditorCommand,
  clearError,
  editorPresets,
} from "../externalEditor.store";

// Mock the commands module
vi.mock("$lib/bindings", () => ({
  commands: {
    getExternalEditorCommand: vi.fn(),
    setExternalEditorCommand: vi.fn(),
    resetExternalEditorCommand: vi.fn(),
  },
}));

import { commands } from "$lib/bindings";

describe("External Editor Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    clearError();
  });

  describe("Store State", () => {
    it("should have initial state", () => {
      expect(get(command)).toBe("");
      expect(get(isLoading)).toBe(false);
      expect(get(error)).toBe(null);
    });
  });

  describe("Load External Editor Command", () => {
    it("should load command successfully", async () => {
      const mockCommand = "vim +{line} {file}";
      vi.mocked(commands.getExternalEditorCommand).mockResolvedValue({
        status: "ok",
        data: mockCommand,
      });

      await loadExternalEditorCommand();

      expect(get(command)).toBe(mockCommand);
      expect(get(isLoading)).toBe(false);
      expect(get(error)).toBe(null);
    });

    it("should handle load error", async () => {
      const errorMessage = "Failed to load command";
      vi.mocked(commands.getExternalEditorCommand).mockResolvedValue({
        status: "error",
        error: errorMessage,
      });

      await loadExternalEditorCommand();

      expect(get(isLoading)).toBe(false);
      expect(get(error)).toBe(errorMessage);
    });

    it("should handle load exception", async () => {
      const exception = new Error("Network error");
      vi.mocked(commands.getExternalEditorCommand).mockRejectedValue(exception);

      await loadExternalEditorCommand();

      expect(get(isLoading)).toBe(false);
      expect(get(error)).toBe("Network error");
    });
  });

  describe("Set External Editor Command", () => {
    it("should set command successfully", async () => {
      const newCommand = "code --goto {file}:{line}:{column}";
      vi.mocked(commands.setExternalEditorCommand).mockResolvedValue({
        status: "ok",
        data: null,
      });

      await setExternalEditorCommand(newCommand);

      expect(get(command)).toBe(newCommand);
      expect(get(isLoading)).toBe(false);
      expect(get(error)).toBe(null);
    });

    it("should validate command before setting", async () => {
      const invalidCommand = "code --goto"; // Missing {file} placeholder

      await setExternalEditorCommand(invalidCommand);

      expect(get(error)).toBe("Command must include {file} placeholder");
      expect(commands.setExternalEditorCommand).not.toHaveBeenCalled();
    });

    it("should reject empty command", async () => {
      await setExternalEditorCommand("");

      expect(get(error)).toBe("Command cannot be empty");
      expect(commands.setExternalEditorCommand).not.toHaveBeenCalled();
    });

    it("should reject whitespace-only command", async () => {
      await setExternalEditorCommand("   ");

      expect(get(error)).toBe("Command cannot be empty");
      expect(commands.setExternalEditorCommand).not.toHaveBeenCalled();
    });

    it("should handle set error", async () => {
      const newCommand = "vim +{line} {file}";
      const errorMessage = "Failed to save command";
      vi.mocked(commands.setExternalEditorCommand).mockResolvedValue({
        status: "error",
        error: errorMessage,
      });

      await setExternalEditorCommand(newCommand);

      expect(get(error)).toBe(errorMessage);
    });

    it("should handle set exception", async () => {
      const newCommand = "vim +{line} {file}";
      const exception = new Error("Network error");
      vi.mocked(commands.setExternalEditorCommand).mockRejectedValue(exception);

      await setExternalEditorCommand(newCommand);

      expect(get(error)).toBe("Network error");
    });
  });

  describe("Reset External Editor Command", () => {
    it("should reset command successfully", async () => {
      const defaultCommand = "emacsclient --no-wait +{line}:{column} {file}";

      vi.mocked(commands.resetExternalEditorCommand).mockResolvedValue({
        status: "ok",
        data: null,
      });

      vi.mocked(commands.getExternalEditorCommand).mockResolvedValue({
        status: "ok",
        data: defaultCommand,
      });

      await resetExternalEditorCommand();

      expect(get(command)).toBe(defaultCommand);
      expect(get(isLoading)).toBe(false);
      expect(get(error)).toBe(null);
    });

    it("should handle reset error", async () => {
      const errorMessage = "Failed to reset command";
      vi.mocked(commands.resetExternalEditorCommand).mockResolvedValue({
        status: "error",
        error: errorMessage,
      });

      await resetExternalEditorCommand();

      expect(get(error)).toBe(errorMessage);
    });

    it("should handle reset exception", async () => {
      const exception = new Error("Network error");
      vi.mocked(commands.resetExternalEditorCommand).mockRejectedValue(
        exception,
      );

      await resetExternalEditorCommand();

      expect(get(error)).toBe("Network error");
    });
  });

  describe("Clear Error", () => {
    it("should clear error", () => {
      // Set an error first
      setExternalEditorCommand("");
      expect(get(error)).toBeTruthy();

      clearError();
      expect(get(error)).toBe(null);
    });
  });

  describe("Validation", () => {
    it("should validate commands correctly", async () => {
      // Test validation through the setExternalEditorCommand function since validateCommand is internal
      // Valid commands should not set an error
      vi.mocked(commands.setExternalEditorCommand).mockResolvedValue({
        status: "ok",
        data: null,
      });

      clearError();
      await setExternalEditorCommand("vim +{line} {file}");
      expect(get(error)).toBe(null);

      clearError();
      await setExternalEditorCommand("code --goto {file}:{line}:{column}");
      expect(get(error)).toBe(null);
    });

    it("should reject commands without {file} placeholder", async () => {
      await setExternalEditorCommand("vim +{line}");
      expect(get(error)).toBe("Command must include {file} placeholder");

      clearError();
      await setExternalEditorCommand("code --goto {line}:{column}");
      expect(get(error)).toBe("Command must include {file} placeholder");
    });

    it("should reject empty commands", async () => {
      await setExternalEditorCommand("");
      expect(get(error)).toBe("Command cannot be empty");

      clearError();
      await setExternalEditorCommand("   ");
      expect(get(error)).toBe("Command cannot be empty");
    });
  });

  describe("Editor Presets", () => {
    it("should have predefined editor presets", () => {
      expect(editorPresets).toBeDefined();
      expect(typeof editorPresets).toBe("object");
    });

    it("should have common editors in presets", () => {
      expect(editorPresets.emacs).toBeDefined();
      expect(editorPresets.vim).toBeDefined();
      expect(editorPresets.vscode).toBeDefined();
      expect(editorPresets.atom).toBeDefined();
      expect(editorPresets.sublime).toBeDefined();
      expect(editorPresets.nano).toBeDefined();
    });

    it("should have valid commands in all presets", async () => {
      // Test that all presets are valid by trying to set them
      for (const preset of Object.values(editorPresets)) {
        clearError();
        vi.mocked(commands.setExternalEditorCommand).mockResolvedValue({
          status: "ok",
          data: null,
        });
        await setExternalEditorCommand(preset);
        expect(get(error)).toBe(null);
      }
    });

    it("should include {file} placeholder in all presets", () => {
      Object.values(editorPresets).forEach((preset) => {
        expect(preset).toContain("{file}");
      });
    });
  });

  describe("Loading State", () => {
    it("should set loading state during operations", async () => {
      let loadingStates: boolean[] = [];

      const unsubscribe = isLoading.subscribe((value) => {
        loadingStates.push(value);
      });

      vi.mocked(commands.getExternalEditorCommand).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ status: "ok", data: "test" }), 100),
          ),
      );

      const promise = loadExternalEditorCommand();

      // Should be loading
      expect(get(isLoading)).toBe(true);

      await promise;

      // Should not be loading after completion
      expect(get(isLoading)).toBe(false);

      unsubscribe();
    });
  });
});
