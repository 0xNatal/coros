import { createHash } from "node:crypto";
import { z } from "zod";
import { CorosApiError, CorosAuthError } from "../errors.js";
import { request } from "../http.js";
import type { TokenStore } from "../token-store.js";
import { REGION_BASE_URLS, type Region } from "../types.js";

/** Slightly under 24h to avoid using an about-to-expire token. */
const TOKEN_TTL_MS = 23.5 * 60 * 60 * 1000;

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
		expiresAt: Date.now() + TOKEN_TTL_MS,
	});
}
