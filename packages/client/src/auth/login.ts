import { createHash } from "node:crypto";
import { z } from "zod";
import { CorosApiError, CorosAuthError } from "../errors.js";
import { request } from "../http.js";
import type { TokenStore } from "../token-store.js";
import { REGION_BASE_URLS, type Region } from "../types.js";

// The API does not return an expiry time — "~24h" is a community observation, not
// a server-provided value. We store MAX_SAFE_INTEGER and let a CorosAuthError
// (result != "0000") signal actual expiry so callers can re-login.

// Response body is 📖 (HAR-redacted) — validate only the fields we need,
// allow extra profile fields through.
const loginDataSchema = z
	.object({
		accessToken: z.string(),
		userId: z.string(),
	})
	.passthrough();

/**
 * Authenticates with the COROS API using the MD5 password path (live-verified
 * 2026-05-31). Stores the resulting token in `store`.
 */
export async function login(
	email: string,
	password: string,
	region: Region,
	store: TokenStore,
): Promise<void> {
	const pwd = createHash("md5").update(password).digest("hex");
	const url = `${REGION_BASE_URLS[region]}/account/login`;

	let data: z.infer<typeof loginDataSchema>;
	try {
		data = await request(url, loginDataSchema, {
			method: "POST",
			body: { account: email, accountType: 2, pwd },
			region,
		});
	} catch (err) {
		if (err instanceof CorosApiError) {
			throw new CorosAuthError(
				`Login failed (result ${err.result}): ${err.message}`,
				{ cause: err },
			);
		}
		throw err;
	}

	await store.set({
		accessToken: data.accessToken,
		userId: data.userId,
		expiresAt: Number.MAX_SAFE_INTEGER,
	});
}
