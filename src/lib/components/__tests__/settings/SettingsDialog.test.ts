import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import "@testing-library/jest-dom";
import SettingsDialog from "../../settings/SettingsDialog.svelte";
import { settingsDialogOpen } from "../../../viewmodels/settings.store";

describe("SettingsDialog", () => {
  beforeEach(() => {
    // Reset store state
    settingsDialogOpen.set(false);
  });

  describe("Rendering with Dialog Open", () => {
    beforeEach(() => {
      // Set dialog to open for tests that need it
      settingsDialogOpen.set(true);
    });

    it("should render without crashing", () => {
      expect(() => render(SettingsDialog)).not.toThrow();
    });

    it("should display the correct title and description", () => {
      render(SettingsDialog);

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Configure Org-X preferences and customize your workflow.",
        ),
      ).toBeInTheDocument();
    });

    it("should display all settings sections", () => {
      render(SettingsDialog);

      // Check that all setting sections are present
      expect(screen.getByText("TODO Keywords")).toBeInTheDocument();
      expect(screen.getByText("Custom Properties")).toBeInTheDocument();
      expect(screen.getByText("Date Format")).toBeInTheDocument();
      expect(screen.getByText("External Editor Command")).toBeInTheDocument();
      expect(screen.getByText("Table Columns")).toBeInTheDocument();
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
      expect(screen.getByText("Appearance")).toBeInTheDocument();
    });

    it('should display "Coming Soon" badges for all sections', () => {
      render(SettingsDialog);

      const comingSoonBadges = screen.getAllByText("Coming Soon");
      expect(comingSoonBadges).toHaveLength(7); // All 7 sections should have "Coming Soon"
    });

    it("should display section descriptions", () => {
      render(SettingsDialog);

      expect(
        screen.getByText("Configure custom TODO states and keywords"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Define custom org-mode properties for filtering and display",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Customize date display format throughout the application",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Set the command to open files in your preferred editor",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Configure which columns to display in task lists"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Customize keybindings and shortcuts"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Theme and visual preferences"),
      ).toBeInTheDocument();
    });

    it("should display help text", () => {
      render(SettingsDialog);

      expect(
        screen.getByText(
          /Settings functionality is being developed incrementally/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Each section will be implemented in upcoming releases/,
        ),
      ).toBeInTheDocument();
    });

    it("should display version information", () => {
      render(SettingsDialog);

      expect(
        screen.getByText("Version 0.1.0 • More settings coming soon"),
      ).toBeInTheDocument();
    });

    it("should display close buttons", () => {
      render(SettingsDialog);

      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      expect(closeButtons.length).toBeGreaterThan(0); // Dialog has multiple close buttons for accessibility
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      settingsDialogOpen.set(true);
    });

    it("should have proper dialog role", () => {
      render(SettingsDialog);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have proper heading structure", () => {
      render(SettingsDialog);

      // Main dialog title should be a heading
      const mainHeading = screen.getByRole("heading", { name: /settings/i });
      expect(mainHeading).toBeInTheDocument();
    });

    it("should have accessible section headings", () => {
      render(SettingsDialog);

      // All section titles should be present
      const sectionTitles = [
        "TODO Keywords",
        "Custom Properties",
        "Date Format",
        "External Editor Command",
        "Table Columns",
        "Keyboard Shortcuts",
        "Appearance",
      ];

      sectionTitles.forEach((title) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });
  });

  describe("Visual State", () => {
    beforeEach(() => {
      settingsDialogOpen.set(true);
    });

    it("should apply correct opacity to coming soon sections", () => {
      render(SettingsDialog);

      // Check that sections have the opacity class applied
      const todoSection = screen.getByText("TODO Keywords").closest("div");
      // Find the parent container that has the opacity class
      const sectionContainer = todoSection?.closest(".opacity-60");
      expect(sectionContainer).toBeInTheDocument();
    });

    it("should display icons for each section", () => {
      render(SettingsDialog);

      // Check that SVG icons are rendered (Lucide icons render as SVG)
      const icons = document.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Content Structure", () => {
    beforeEach(() => {
      settingsDialogOpen.set(true);
    });

    it("should have proper scrollable content area", () => {
      render(SettingsDialog);

      // Check for scrollable content container
      const scrollContainer = document.querySelector(".overflow-y-auto");
      expect(scrollContainer).toBeInTheDocument();
    });

    it("should separate sections with separators", () => {
      render(SettingsDialog);

      // Check for separator elements between sections
      const separators = document.querySelectorAll(
        '[data-orientation="horizontal"]',
      );
      expect(separators.length).toBeGreaterThan(0);
    });
  });
});
