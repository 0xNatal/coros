import { VERSION } from "@coros/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { bootstrap } from "./auth-bootstrap.js";
import { registerCheckAuth } from "./tools/check-auth.js";
import { registerGetHelp } from "./tools/get-help.js";

function registerTools(server: McpServer): void {
	registerCheckAuth(server);
	registerGetHelp(server);
}

export async function startServer(): Promise<void> {
	await bootstrap();

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
