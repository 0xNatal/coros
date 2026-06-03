import { z } from "zod";
import { request } from "../../http.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

// Only the fields needed by callers today; passthrough preserves the rest.
const accountSummarySchema = z
	.object({
		userId: z.string(),
		email: z.string(),
		nickname: z.string().optional(),
		/** Max heart rate, bpm. */
		maxHr: z.number().optional(),
		/** Resting heart rate, bpm. */
		rhr: z.number().optional(),
		userProfile: z
			.object({ region: z.number().optional() })
			.passthrough()
			.optional(),
	})
	.passthrough();

export type AccountSummary = z.infer<typeof accountSummarySchema>;

/**
 * Returns basic account info and fitness markers for the authenticated user.
 * Calls GET /account/query.
 *
 * @returns userId, email, maxHr (bpm), rhr (bpm), and userProfile.region.
 */
export async function getAccount(
	token: TokenData,
	region: Region,
): Promise<AccountSummary> {
	const url = `${REGION_BASE_URLS[region]}/account/query`;
	return request(url, accountSummarySchema, { token, region });
}
