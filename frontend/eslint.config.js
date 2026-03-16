import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactPlugin from 'eslint-plugin-react'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
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
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/jsx-no-literals': ['warn', { noStrings: true, ignoreProps: true }],
      
      // --- Code Smell Rules (Cảnh báo các đoạn code chưa tối ưu) ---
      'complexity': ['warn', 15],             // Giới hạn độ phức tạp của logic (Cyclomatic Complexity)
      'max-depth': ['warn', 4],               // Giới hạn độ sâu lồng nhau (if-else, loop)
      'max-params': ['warn', 4],              // Giới hạn số lượng tham số truyền vào function
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Cảnh báo khi dùng console.log (trừ warn/error)
      'no-debugger': 'warn',                  // Cảnh báo debugger còn sót lại
      'eqeqeq': ['warn', 'always'],           // Bắt buộc dùng === thay vì ==
      'curly': 'warn',                        // Bắt buộc dùng ngoặc nhọn cho block code
      'no-duplicate-imports': 'warn',         // Cảnh báo import trùng lặp
    },
  },
])