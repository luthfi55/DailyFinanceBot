import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  bundle: true,
  // Bundle @finance/db (local workspace package) inline
  noExternal: ["@finance/db"],
  outDir: "dist",
  clean: true,
});
