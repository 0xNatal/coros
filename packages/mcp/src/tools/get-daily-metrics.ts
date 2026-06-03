import { getDailyMetrics } from "@coros/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAuth } from "../auth-bootstrap.js";

export function registerGetDailyMetrics(server: McpServer): void {
	server.registerTool(
		"get_daily_metrics",
		{
			description:
				"Returns daily training and recovery metrics for a date range. " +
				"Includes: HRV (RMSSD ms), resting HR (bpm), VO2max (mL/kg/min), " +
				"stamina score (0-100), LTHR (bpm), LTSP (s/km), training load, " +
				"acute/chronic load (ATI/CTI). " +
				"Fitness fields are sparse — only populated on days with qualifying activities " +
				"or sleep measurements. Returns an array of daily records ordered by date.",
			inputSchema: {
				from: z
					.string()
					.describe("Start date, YYYYMMDD format (e.g. 20260101)."),
				to: z.string().describe("End date, YYYYMMDD format (e.g. 20260630)."),
			},
		},
		async ({ from, to }) => {
			try {
				const records = await withAuth((token, region) =>
					getDailyMetrics({ from, to }, token, region),
				);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(records, null, 2),
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
