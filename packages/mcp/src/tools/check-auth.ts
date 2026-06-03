import { getAccount } from "@coros/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRegion, withAuth } from "../auth-bootstrap.js";

export function registerCheckAuth(server: McpServer): void {
	server.registerTool(
		"check_auth",
		{
			description:
				"Returns current authentication status and basic account information " +
				"(email, userId, configured region, max HR, resting HR). " +
				"Call this first to verify that credentials are set up correctly.",
		},
		async () => {
			try {
				const profile = await withAuth((token, region) =>
					getAccount(token, region),
				);
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify(
								{
									authenticated: true,
									userId: profile.userId,
									email: profile.email,
									region: getRegion(),
									maxHr: profile.maxHr ?? null,
									rhr: profile.rhr ?? null,
								},
								null,
								2,
							),
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
