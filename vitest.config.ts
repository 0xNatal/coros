import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: ["./vitest.setup.ts"],
		include: ["packages/*/src/**/*.test.ts"],
		// Prevent concurrent logins to the same COROS test account from invalidating each other.
		fileParallelism: false,
	},
});
