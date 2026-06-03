import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const HELP_TEXT = `
Coros MCP Server — read-only v1

Available tools:

check_auth
  Verify authentication and return basic account info (email, userId, region, HR markers).

get_daily_metrics [from, to]
  Daily training records for a date range (YYYYMMDD).
  Fields: HRV (RMSSD ms), resting HR, VO2max (mL/kg/min), stamina score (0-100),
  LTHR (bpm), LTSP (s/km), training load, ATI/CTI (acute/chronic load).
  Fitness fields are sparse — only present on days with qualifying activities or sleep data.

list_activities [from, to, page, size, sportTypes]
  Paginated list of completed activities with summary data.
  from/to: Unix timestamps (seconds). sportTypes: array of sport type integers.

get_activity_detail [labelId, sportType]
  Full detail for a single activity: laps, heart rate zones, pace zones, power zones.
  labelId: string ID from list_activities. sportType: integer.

get_dashboard
  Today's fitness snapshot: recovery percentage, recovery state (1-4),
  fitness scores (aerobic endurance, anaerobic capacity, stamina level),
  HRV baseline and recent trend (RMSSD ms), LTHR, LTSP, RHR.

list_planned_activities [from, to]
  Planned workouts from the training calendar for a date range (YYYYMMDD).

list_workout_templates [sportType, page, size]
  Saved workout templates. sportType 0 = all sports.

Notes:
- All write operations (creating workouts, scheduling) are deferred to a later milestone.
- Date ranges: from/to are YYYYMMDD strings for most tools, Unix seconds for list_activities.
- Units: distance in cm (activity detail) or m (dashboard), duration in seconds,
  calories divided by 1000, timestamps in Unix seconds or centiseconds.
`.trim();

export function registerGetHelp(server: McpServer): void {
	server.registerTool(
		"get_help",
		{
			description:
				"Returns a description of all available Coros MCP tools, their parameters, " +
				"and the units used in responses. Call this to discover what data is accessible.",
		},
		async () => ({
			content: [{ type: "text" as const, text: HELP_TEXT }],
		}),
	);
}
