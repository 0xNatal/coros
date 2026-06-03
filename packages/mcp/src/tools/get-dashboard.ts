import { getDashboard } from "@coros/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withAuth } from "../auth-bootstrap.js";

export function registerGetDashboard(server: McpServer): void {
	server.registerTool(
		"get_dashboard",
		{
			description:
				"Returns today's fitness and recovery snapshot. " +
				"summaryInfo.recoveryPct: recovery percentage (0-100). " +
				"summaryInfo.recoveryState: 1=low, 2=moderate, 3=good, 4=excellent. " +
				"summaryInfo.fullRecoveryHours: hours until full recovery. " +
				"summaryInfo.aerobicEnduranceScore / staminaLevel: fitness scores (0-100). " +
				"summaryInfo.sleepHrvData.lastSleepHrvBase: last sleep HRV (RMSSD ms). " +
				"summaryInfo.sleepHrvData.sleepHrvList: recent HRV history per night. " +
				"summaryInfo.lthr: LTHR bpm. summaryInfo.ltsp: LTSP s/km. summaryInfo.rhr: RHR bpm.",
		},
		async () => {
			try {
				const snapshot = await withAuth((token, region) =>
					getDashboard(token, region),
				);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(snapshot, null, 2),
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
