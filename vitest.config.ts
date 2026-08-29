import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // bazi-app-sdk52/lib 是指向根 lib 的符号链接,避免同一测试文件跑两遍;
    // 注意:自定义 exclude 会覆盖默认值,必须保留 node_modules 排除
    exclude: ["**/node_modules/**", "bazi-app-sdk52/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/__tests__/**", "lib/data/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
