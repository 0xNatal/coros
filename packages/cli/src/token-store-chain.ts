import type { TokenData, TokenStore } from "@coros/client";

/**
 * Tries each store in order for get/isValid.
 * set() and clear() target the last store only (the persistent one).
 * The first store is typically EnvTokenStore (read-only); the last is JsonFileTokenStore.
 */
export class ChainTokenStore implements TokenStore {
	constructor(
		private readonly stores: readonly [TokenStore, ...TokenStore[]],
	) {}

	async get(): Promise<TokenData | null> {
		for (const store of this.stores) {
			const token = await store.get();
			if (token !== null) return token;
		}
		return null;
	}

	async set(data: TokenData): Promise<void> {
		const last = this.stores[this.stores.length - 1];
		// Non-null assertion safe: stores is a non-empty tuple (enforced by the type).
		// biome-ignore lint/style/noNonNullAssertion: non-empty tuple, last element always exists
		await last!.set(data);
	}

	async clear(): Promise<void> {
		for (const store of this.stores) {
			await store.clear();
		}
	}

	async isValid(): Promise<boolean> {
		const token = await this.get();
		return token !== null && Date.now() < token.expiresAt;
	}
}
