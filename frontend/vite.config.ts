import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("react-router")) {
            return "vendor-router";
          }
          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }
          if (id.includes("react-hook-form") || id.includes("zod")) {
            return "vendor-forms";
          }
          if (id.includes("date-fns")) {
            return "vendor-date";
          }
          if (
            id.includes("/node_modules/react/") ||
            id.includes("\\node_modules\\react\\")
          ) {
            return "vendor-react-core";
          }
          if (
            id.includes("/node_modules/react-dom/") ||
            id.includes("\\node_modules\\react-dom\\")
          ) {
            return "vendor-react-core";
          }
          if (
            id.includes("/node_modules/scheduler/") ||
            id.includes("\\node_modules\\scheduler\\")
          ) {
            return "vendor-react-core";
          }
          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }
          if (id.includes("recharts")) {
            return "vendor-charts";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
