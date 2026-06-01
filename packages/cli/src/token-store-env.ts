import type { TokenData, TokenStore } from "@coros/client";

const ENV_ACCESS_TOKEN = "COROS_ACCESS_TOKEN";
const ENV_USER_ID = "COROS_USER_ID";
const ENV_EXPIRES_AT = "COROS_TOKEN_EXPIRES_AT";

/**
 * Read-only TokenStore backed by environment variables.
 * Useful for CI / short-lived processes and as the MCP auth-bootstrap source.
 *
 * COROS_ACCESS_TOKEN — access token string
 * COROS_USER_ID      — user ID string
 * COROS_TOKEN_EXPIRES_AT — Unix timestamp in ms (optional; defaults to MAX_SAFE_INTEGER)
 */
export class EnvTokenStore implements TokenStore {
	async get(): Promise<TokenData | null> {
		const accessToken = process.env[ENV_ACCESS_TOKEN];
		const userId = process.env[ENV_USER_ID];
		if (!accessToken || !userId) return null;
		const raw = process.env[ENV_EXPIRES_AT];
		return {
			accessToken,
			userId,
			expiresAt:
				raw !== undefined && Number.isFinite(Number(raw))
					? Number(raw)
					: Number.MAX_SAFE_INTEGER,
		};
	}

	async set(_data: TokenData): Promise<void> {
		throw new Error(
			"EnvTokenStore is read-only — set env vars directly or use JsonFileTokenStore",
		);
	}

	async clear(): Promise<void> {
		// Env vars are process-scoped; nothing to clear from here.
	}

	async isValid(): Promise<boolean> {
		const token = await this.get();
		return token !== null && Date.now() < token.expiresAt;
	}
}
