# coros-mcp

MCP server for the [COROS Training Hub](https://trainingHub.coros.com) web API.
Gives AI assistants read access to your COROS training data — activities, HRV, recovery, planned workouts.

> Unofficial. Not affiliated with COROS.

---

## Setup

### Claude Code (VSCode Extension)

Add to `~/.claude.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "coros": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@0xnatal/coros-mcp"],
      "env": {
        "COROS_EMAIL": "you@example.com",
        "COROS_PASSWORD": "yourpassword",
        "COROS_REGION": "eu"
      }
    }
  }
}
```

Reload the VSCode window after saving.

### Claude Desktop

Edit `~/.config/Claude/claude_desktop_config.json` (Linux) or
`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "coros": {
      "command": "npx",
      "args": ["-y", "@0xnatal/coros-mcp"],
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

Alternatively, pass a pre-existing token directly (no login call on startup):

```json
"env": {
  "COROS_ACCESS_TOKEN": "...",
  "COROS_USER_ID": "...",
  "COROS_REGION": "eu"
}
```

---

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

---

## Notes

- v1 is read-only. Creating or scheduling workouts is not yet supported.
- Token is never logged or stored beyond the running process.
