# coros

TypeScript client and MCP server for the unofficial [COROS Training Hub](https://trainingHub.coros.com) web API.

> Unofficial. Not affiliated with COROS.

## Packages

| Package | Description |
|---|---|
| `packages/client` | Pure TypeScript API client (`@coros/client`) |
| `packages/cli` | Auth + debug CLI (`coros`) |
| [`packages/mcp`](./packages/mcp/README.md) | MCP server — setup instructions and available tools |

## Development

```bash
pnpm install
pnpm build      # type-check all packages
pnpm test
pnpm lint

# MCP bundle (for publishing)
pnpm --filter @0xnatal/coros-mcp bundle
```
