import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
      // Svelte 5のテスト環境向け設定
      compilerOptions: {
        runes: true,
      },
    }),
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    server: {
      deps: {
        inline: ["svelte"],
      },
    },
    coverage: {
      reporter: ["text", "json", "html"],
    },
    environmentOptions: {
      jsdom: {
        // Ensure svelte+testing-library works with runes
        // customExportConditions: ['svelte']
      },
    },
  },
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, "./src/lib"),
    },
    conditions: ["browser", "svelte", "import", "module", "node", "default"],
  },
});
