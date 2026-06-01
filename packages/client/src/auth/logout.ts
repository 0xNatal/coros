import { z } from "zod";
import { request } from "../http.js";
import type { TokenData } from "../token-store.js";
import { REGION_BASE_URLS, type Region } from "../types.js";

/**
 * Invalidates the session server-side. 📖 — not live-verified; call best-effort
 * before clearing the local token.
 */
export async function logout(token: TokenData, region: Region): Promise<void> {
	const url = `${REGION_BASE_URLS[region]}/account/logout`;
	await request(url, z.unknown(), { token, region });
}
