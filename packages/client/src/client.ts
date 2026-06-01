import { z } from "zod";
import { login as loginFn } from "./auth/login.js";
import { CorosAuthError } from "./errors.js";
import { request } from "./http.js";
import type { TokenData, TokenStore } from "./token-store.js";
import { REGION_BASE_URLS, type Region } from "./types.js";

// Minimal schema for Phase 1 DoD. Full zone-aware schema comes in a later phase.
const accountProfileSchema = z
	.object({
		userId: z.string(),
		email: z.string(),
		maxHr: z.number().optional(),
		rhr: z.number().optional(),
	})
	.passthrough();

export type AccountProfile = z.infer<typeof accountProfileSchema>;

export class CorosClient {
	readonly region: Region;
	private readonly store: TokenStore;

	constructor(store: TokenStore, region: Region = "eu") {
		this.store = store;
		this.region = region;
	}

	async login(email: string, password: string): Promise<void> {
		await loginFn(email, password, this.region, this.store);
	}

	async getAccount(): Promise<AccountProfile> {
		const token = await this.requireToken();
		const url = `${REGION_BASE_URLS[this.region]}/account/query`;
		return request(url, accountProfileSchema, { token, region: this.region });
	}

	private async requireToken(): Promise<TokenData> {
		const data = await this.store.get();
		if (!data) {
			throw new CorosAuthError("Not authenticated — call login() first");
		}
		if (Date.now() >= data.expiresAt) {
			throw new CorosAuthError("Session expired — call login() again");
		}
		return data;
	}
}
