# coros-mcp

MCP server for the [COROS Training Hub](https://trainingHub.coros.com) web API.
Gives AI assistants (Claude Desktop, Claude Code, etc.) read access to your COROS training data.

## Quick start

```json
{
  "mcpServers": {
    "coros": {
      "command": "npx",
      "args": ["-y", "coros-mcp"],
      "env": {
        "COROS_EMAIL": "you@example.com",
        "COROS_PASSWORD": "yourpassword",
        "COROS_REGION": "eu"
      }
    }
  }
}
```

`COROS_REGION`: `eu` | `us` | `asia` (default: `eu`)

Alternatively, pass a pre-existing token directly (no login call):

```json
"env": {
  "COROS_ACCESS_TOKEN": "...",
  "COROS_USER_ID": "...",
  "COROS_REGION": "eu"
}
```

## Available tools

| Tool | Description |
|---|---|
| `check_auth` | Verify credentials and show account info |
| `get_help` | List all tools with parameters and units |
| `get_daily_metrics` | HRV, RHR, VO2max, training load for a date range |
| `list_activities` | Completed activities with summary data |
| `get_activity_detail` | Laps, HR zones, pace zones for one activity |
| `get_dashboard` | Today's recovery %, fitness scores, HRV trend |
| `list_planned_activities` | Planned workouts from the training calendar |
| `list_workout_templates` | Saved workout templates (read-only) |

## Notes

- v1 is read-only. Creating or scheduling workouts is not yet supported.
- Uses the unofficial COROS Training Hub web API — no affiliation with COROS.
- Token is never logged or stored; credentials are only used to obtain a session token.
