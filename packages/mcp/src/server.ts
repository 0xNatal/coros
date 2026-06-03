import { VERSION } from "@coros/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Tool registration is filled in as each deliverable is added (Phase 6).
function registerTools(_server: McpServer): void {}

export async function startServer(): Promise<void> {
	const server = new McpServer({ name: "coros-mcp", version: VERSION });

	registerTools(server);

	const transport = new StdioServerTransport();

	const shutdown = (): void => {
		server.close().catch(() => undefined);
		process.exit(0);
	};
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);

	await server.connect(transport);
}
