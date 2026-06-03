import type { Region, TokenData } from "@coros/client";
import {
	CorosAuthError,
	CorosClient,
	MemoryTokenStore,
	REGION_BASE_URLS,
} from "@coros/client";

const store = new MemoryTokenStore();
let region: Region = "eu";

function isRegion(v: unknown): v is Region {
	return typeof v === "string" && v in REGION_BASE_URLS;
}

async function reAuth(): Promise<void> {
	const email = process.env.COROS_EMAIL;
	const password = process.env.COROS_PASSWORD;
	if (!email || !password) {
		throw new CorosAuthError(
			"Token expired and no COROS_EMAIL + COROS_PASSWORD env vars available for re-authentication",
		);
	}
	const client = new CorosClient(store, region);
	await client.login(email, password);
}

/**
 * Bootstraps authentication from environment variables.
 * Must be called once before the server begins accepting tool requests.
 *
 * Priority:
 *   1. COROS_ACCESS_TOKEN + COROS_USER_ID  (no network call)
 *   2. COROS_EMAIL + COROS_PASSWORD        (login call)
 *
 * COROS_REGION: eu | us | asia  (default: eu)
 */
export async function bootstrap(): Promise<void> {
	const regionEnv = process.env.COROS_REGION;
	region = isRegion(regionEnv) ? regionEnv : "eu";

	const accessToken = process.env.COROS_ACCESS_TOKEN;
	const userId = process.env.COROS_USER_ID;

	if (accessToken && userId) {
		await store.set({
			accessToken,
			userId,
			expiresAt: Number.MAX_SAFE_INTEGER,
		});
		return;
	}

	await reAuth();
}

/** Returns the configured API region. */
export function getRegion(): Region {
	return region;
}

/**
 * Wraps a tool call with automatic token re-authentication on CorosAuthError.
 * On the first CorosAuthError, re-logs in with COROS_EMAIL/COROS_PASSWORD and
 * retries once. Pattern from cygnusb's _run_with_auth.
 */
export async function withAuth<T>(
	fn: (token: TokenData, region: Region) => Promise<T>,
): Promise<T> {
	const token = await store.get();
	if (!token) {
		throw new CorosAuthError(
			"Not authenticated — set COROS_ACCESS_TOKEN or COROS_EMAIL env vars",
		);
	}
	try {
		return await fn(token, region);
	} catch (err) {
		if (!(err instanceof CorosAuthError)) throw err;
		await reAuth();
		const fresh = await store.get();
		if (!fresh) throw new CorosAuthError("Re-authentication produced no token");
		return fn(fresh, region);
	}
}
