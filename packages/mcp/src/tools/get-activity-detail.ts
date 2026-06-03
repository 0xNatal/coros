import { getActivityDetail } from "@coros/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAuth } from "../auth-bootstrap.js";

export function registerGetActivityDetail(server: McpServer): void {
	server.registerTool(
		"get_activity_detail",
		{
			description:
				"Returns full detail for a single activity: lap splits, heart rate zones, " +
				"pace zones, and power zones (where available). " +
				"Get labelId from list_activities. " +
				"Large time-series fields (frequencyList, graphList, lapGraphList) " +
				"are stripped — only structured summary data is returned.",
			inputSchema: {
				labelId: z
					.string()
					.describe(
						"Activity ID string from list_activities (labelIdStr field).",
					),
				sportType: z
					.number()
					.int()
					.describe("Sport type integer from the same activity record."),
			},
		},
		async ({ labelId, sportType }) => {
			try {
				const detail = await withAuth((token, region) =>
					getActivityDetail(labelId, sportType, token, region),
				);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(detail, null, 2),
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
