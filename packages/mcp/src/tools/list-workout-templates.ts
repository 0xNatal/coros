import { listWorkoutTemplates } from "@coros/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAuth } from "../auth-bootstrap.js";

export function registerListWorkoutTemplates(server: McpServer): void {
	server.registerTool(
		"list_workout_templates",
		{
			description:
				"Returns saved workout templates. Read-only — creating or modifying " +
				"templates is not available in v1. " +
				"Each template includes: id, name, sportType, totalSets, exerciseNum, " +
				"estimatedTime (seconds), estimatedDistance (cm).",
			inputSchema: {
				sportType: z
					.number()
					.int()
					.optional()
					.describe("Sport type filter (0 or omit = all sports)."),
				name: z
					.string()
					.optional()
					.describe("Name substring filter. Omit to return all templates."),
			},
		},
		async ({ sportType, name }) => {
			try {
				const templates = await withAuth((token, region) =>
					listWorkoutTemplates({ sportType, name }, token, region),
				);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(templates, null, 2),
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
