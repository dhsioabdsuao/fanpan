import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // bazi-app-sdk52/lib 与 bazi-app-sdk52/community 都是指向根目录的
    // 符号链接,排除它们避免同一测试文件跑两遍;services 层测试
    // (RN 服务封装,cloudbase 用 vi.mock 替身)允许收集
    // 注意:自定义 exclude 会覆盖默认值,必须保留 node_modules 排除
    exclude: [
      "**/node_modules/**",
      "bazi-app-sdk52/lib/**",
      "bazi-app-sdk52/community/**",
    ],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "community/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/__tests__/**", "lib/data/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
