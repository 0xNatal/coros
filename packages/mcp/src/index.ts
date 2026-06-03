import { startServer } from "./server.js";

startServer().catch((err: unknown) => {
	process.stderr.write(
		`Fatal: ${err instanceof Error ? err.message : String(err)}\n`,
	);
	process.exit(1);
});
