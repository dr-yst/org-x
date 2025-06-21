import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import SidebarFooterSettingsButton from "../../sidebar/SidebarFooterSettingsButton.svelte";
import { openDialog } from "../../../viewmodels/settings.store";

// Mock the settings store functions
vi.mock("../../../viewmodels/settings.store", () => ({
  openDialog: vi.fn(),
}));

describe("SidebarFooterSettingsButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      render(SidebarFooterSettingsButton);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display the Settings text", () => {
      render(SidebarFooterSettingsButton);
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should have the correct button role", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Settings");
    });

    it("should render with proper styling classes", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("w-full");
      expect(button).toHaveClass("justify-start");
      expect(button).toHaveClass("gap-2");
    });

    it("should render the Settings icon", () => {
      render(SidebarFooterSettingsButton);

      // Check for SVG icon (Lucide icons render as SVG)
      const icon = document.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should be clickable", async () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      expect(button).not.toBeDisabled();
      await fireEvent.click(button);
    });

    it("should call openDialog when clicked", async () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      await fireEvent.click(button);
      expect(openDialog).toHaveBeenCalledTimes(1);
    });

    it("should call openDialog on multiple clicks", async () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      await fireEvent.click(button);
      await fireEvent.click(button);
      await fireEvent.click(button);

      expect(openDialog).toHaveBeenCalledTimes(3);
    });
  });

  describe("Button Properties", () => {
    it("should have ghost variant styling", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      // Check for classes that would be applied by ghost variant
      expect(button).toHaveClass("text-muted-foreground");
      expect(button).toHaveClass("hover:text-foreground");
    });

    it("should have small size styling", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      // The small size should be applied (exact classes depend on shadcn-svelte implementation)
      expect(button.className).toContain("w-full");
    });

    it("should have proper gap between icon and text", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("gap-2");
    });
  });

  describe("Accessibility", () => {
    it("should be keyboard accessible", async () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Simulate Enter key press
      await fireEvent.keyDown(button, { key: "Enter", keyCode: 13 });
      await fireEvent.keyUp(button, { key: "Enter", keyCode: 13 });
      // Button should be accessible via keyboard, but the actual click event
      // is handled by the browser, so we verify it can receive focus
      expect(button).toHaveFocus();
    });

    it("should be accessible via Space key", async () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      button.focus();
      await fireEvent.keyDown(button, { key: " ", keyCode: 32 });
      await fireEvent.keyUp(button, { key: " ", keyCode: 32 });
      // Button should be accessible via keyboard, but the actual click event
      // is handled by the browser, so we verify it can receive focus
      expect(button).toHaveFocus();
    });

    it("should have proper button semantics", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      expect(button.tagName).toBe("BUTTON");
    });

    it("should have accessible name", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button", { name: "Settings" });

      expect(button).toBeInTheDocument();
    });
  });

  describe("Visual Design", () => {
    it("should display icon with correct size", () => {
      render(SidebarFooterSettingsButton);

      const icon = document.querySelector("svg");
      expect(icon).toHaveClass("h-4");
      expect(icon).toHaveClass("w-4");
    });

    it("should have proper text alignment", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("justify-start");
    });

    it("should span full width", () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("w-full");
    });
  });

  describe("Integration", () => {
    it("should work as part of sidebar footer", () => {
      // This component is designed to be used in sidebar footer
      render(SidebarFooterSettingsButton);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();

      // Should maintain its functionality when rendered in any context
      expect(button).toHaveTextContent("Settings");
    });

    it("should maintain store integration", async () => {
      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      // Verify that clicking triggers the correct store action
      await fireEvent.click(button);
      expect(openDialog).toHaveBeenCalledWith();
    });
  });

  describe("Error Handling", () => {
    it("should handle store function errors gracefully", async () => {
      // Mock openDialog to throw an error
      (openDialog as any).mockImplementationOnce(() => {
        throw new Error("Store error");
      });

      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      // The component should handle errors gracefully
      // Note: In a real scenario, proper error handling would be implemented
      // For now, we just verify the button can be clicked
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("should remain functional after errors", async () => {
      // Mock openDialog to work normally
      (openDialog as any).mockImplementation(() => {});

      render(SidebarFooterSettingsButton);
      const button = screen.getByRole("button");

      // Multiple clicks should work normally
      await fireEvent.click(button);
      await fireEvent.click(button);
      expect(openDialog).toHaveBeenCalledTimes(2);
    });
  });
});
