import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import reactPlugin from "eslint-plugin-react";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-refresh/only-export-components": [
        "off",
        { allowConstantExport: true },
      ],
      "react/jsx-no-literals": "warn",

      // --- Code Smell Rules (Cảnh báo các đoạn code chưa tối ưu) ---
      complexity: ["warn", { max: 20 }],
      "max-depth": ["warn", 4],
      "max-params": ["warn", 4],
      "no-console": "warn",
      "no-debugger": "warn",
      eqeqeq: "warn",
      curly: "warn",
      "no-duplicate-imports": "warn",
    },
  },
]);
