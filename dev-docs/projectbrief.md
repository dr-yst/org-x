# Org-X Project Overview

## Project Purpose
A cross-platform application using Tauri 2.0 and Svelte to display Org-mode files in a Notion-like interface

## Technology Stack
- **Frontend**: Svelte 5 + TypeScript
- **Backend**: Rust + Tauri 2.0
- **Styling**: TailwindCSS
- **Rich Text Display**: Tiptap (under consideration)

## Key Features
- Parsing and displaying org-mode files
- Special processing and filtering of TODO items
- Kanban, list, and timeline views
- External editor integration
- Monitoring multiple folders and automatic reloading
- Keyboard shortcuts
- Emacs-style keybindings and operability
- Keyboard-first design (minimizing mouse operations)

## Architecture
- Rust backend using the Orgize parser
- Frontend displaying tasks and notes in a Notion-like interface
- Using tauri-specta for type definitions between backend and frontend
- Completely read-only app (editing done in external editors)

## Development Approach
- Test-driven development
- Modular, incremental implementation
- Minimal implementation with small steps
- Automated synchronization of type definitions between Rust and frontend
- Always prioritizing accessibility and keyboard operability

## Current Status
- Early project stage
- Working on basic implementation of org-mode parsing on the Rust side using Orgize library

## Keyboard Operation Policy
- Design all major functions to be operable by keyboard alone
- Support for Emacs-style keybindings (C-x, C-c, M-x, etc.)
- Implementation of command palette (invoked with M-x)
- Command input via minibuffer-like UI components
- Key sequence customization functionality
- Help function displaying list of keybindings

