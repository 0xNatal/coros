import { listActivities } from "@coros/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAuth } from "../auth-bootstrap.js";

function yyyymmddToUnixSeconds(s: string): number {
	const y = Number(s.slice(0, 4));
	const m = Number(s.slice(4, 6)) - 1;
	const day = Number(s.slice(6, 8));
	// Local midnight — consistent with how COROS displays dates to the user.
	return Math.floor(new Date(y, m, day).getTime() / 1000);
}

export function registerListActivities(server: McpServer): void {
	server.registerTool(
		"list_activities",
		{
			description:
				"Returns a paginated list of completed activities for a date range. " +
				"Each record includes: labelId (use this for get_activity_detail), " +
				"sportType, startTime (Unix seconds), duration (seconds), " +
				"distance (cm), calories (÷1000 for kcal), avg/max HR (bpm), " +
				"training load.",
			inputSchema: {
				from: z
					.string()
					.describe("Start date, YYYYMMDD format (e.g. 20260101)."),
				to: z.string().describe("End date, YYYYMMDD format (e.g. 20260630)."),
				sportTypes: z
					.array(z.number().int())
					.optional()
					.describe(
						"Sport type IDs to filter results. Omit or pass [] for all sports.",
					),
			},
		},
		async ({ from, to, sportTypes }) => {
			try {
				const activities = await withAuth((token, region) =>
					listActivities(
						{
							from: yyyymmddToUnixSeconds(from),
							to: yyyymmddToUnixSeconds(to),
							sportTypes,
						},
						token,
						region,
					),
				);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(activities, null, 2),
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
