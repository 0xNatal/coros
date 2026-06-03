import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	target: "node22",
	// All deps are devDependencies, so tsup bundles them by default.
	// Node built-ins (node:crypto, etc.) stay external automatically.
	banner: {
		// Required for the binary to be executable via `node` / `npx`.
		js: "#!/usr/bin/env node",
	},
	clean: true,
	sourcemap: false,
});
