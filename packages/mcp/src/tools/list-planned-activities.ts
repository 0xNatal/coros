import { getTrainingSchedule } from "@coros/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAuth } from "../auth-bootstrap.js";

export function registerListPlannedActivities(server: McpServer): void {
	server.registerTool(
		"list_planned_activities",
		{
			description:
				"Returns planned workouts from the training calendar for a date range. " +
				"Includes scheduled programs, weekly stage info, and plan progress. " +
				"Read-only — use this to view the training plan, not to modify it.",
			inputSchema: {
				from: z
					.string()
					.describe("Start date, YYYYMMDD format (e.g. 20260601)."),
				to: z.string().describe("End date, YYYYMMDD format (e.g. 20260630)."),
			},
		},
		async ({ from, to }) => {
			try {
				const schedule = await withAuth((token, region) =>
					getTrainingSchedule({ from, to }, token, region),
				);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(schedule, null, 2),
						},
					],
				};
			} catch (err) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		},
	);
}
