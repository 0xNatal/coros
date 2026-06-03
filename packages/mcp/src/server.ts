import { VERSION } from "@coros/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { bootstrap } from "./auth-bootstrap.js";
import { registerCheckAuth } from "./tools/check-auth.js";
import { registerGetActivityDetail } from "./tools/get-activity-detail.js";
import { registerGetDailyMetrics } from "./tools/get-daily-metrics.js";
import { registerGetDashboard } from "./tools/get-dashboard.js";
import { registerGetHelp } from "./tools/get-help.js";
import { registerListActivities } from "./tools/list-activities.js";
import { registerListPlannedActivities } from "./tools/list-planned-activities.js";
import { registerListWorkoutTemplates } from "./tools/list-workout-templates.js";

function registerTools(server: McpServer): void {
	registerCheckAuth(server);
	registerGetHelp(server);
	registerGetDailyMetrics(server);
	registerListActivities(server);
	registerGetActivityDetail(server);
	registerGetDashboard(server);
	registerListPlannedActivities(server);
	registerListWorkoutTemplates(server);
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
