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
      // Lưu ý: Flat config của reactPlugin cần cài đặt plugin thủ công như bên dưới
    ],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // --- Cấu hình mặc định của bạn ---
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // ==========================================
      // 1. RULES TRỊ HARDCODE (TEXT & SỐ)
      // ==========================================

      // Bắt lỗi gõ trực tiếp Text vào HTML/JSX
      "react/jsx-no-literals": "off",

      // Bắt lỗi "Magic Numbers" (VD: gõ thẳng radius === 50 thay vì RADIUS_DEFAULT)
      "no-magic-numbers": "off",


      // ==========================================
      // 2. RULES TRỊ CODE SMELLS (REACT & TYPESCRIPT)
      // ==========================================

      // -- Smells của Javascript cơ bản --
      complexity: ["warn", { max: 15 }], // Giảm xuống 15: Hàm nào quá 15 nhánh if/else là phải tách hàm
      "max-depth": ["warn", 4], // Không lồng if/for quá 4 cấp
      "max-params": ["warn", 4], // Hàm truyền quá 4 tham số -> Bắt buộc phải gom thành 1 Object
      "no-console": ["warn", { allow: ["warn", "error"] }], // Cấm console.log, chỉ cho phép warn và error
      "no-debugger": "warn",
      eqeqeq: "error", // Bắt buộc dùng === thay vì ==
      curly: "error", // Cấm viết if không có ngoặc nhọn
      "no-duplicate-imports": "error",

      // -- Smells của TypeScript --
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Khai báo biến/tham số mà không xài (có gạch dưới _ thì tha)

      // -- Smells của React --
      "react/jsx-no-useless-fragment": "warn", // Bắt lỗi dùng <></> thừa thãi bọc ngoài 1 thẻ duy nhất
      "react/no-unstable-nested-components": "error", // Lỗi siêu nặng: Khai báo component con ngay bên trong component cha gây memory leak
      "react/jsx-key": "error", // Quên truyền 'key' khi dùng vòng lặp map()
    },
  },
]);