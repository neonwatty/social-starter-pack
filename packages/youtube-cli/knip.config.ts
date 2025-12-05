import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/cli.ts", "src/index.ts"],
  project: ["src/**/*.ts"],
  ignore: ["**/*.test.ts"],
  ignoreDependencies: [
    // Vitest references this internally for coverage feature
    "@vitest/coverage-v8",
  ],
};

export default config;
