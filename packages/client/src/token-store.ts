export interface TokenData {
	accessToken: string;
	userId: string;
	/** Unix timestamp (ms) after which the token should be considered expired. */
	expiresAt: number;
}

/**
 * Persistence contract for the COROS access token.
 * Concrete implementations live in cli/mcp; this interface stays in the pure client.
 */
export interface TokenStore {
	get(): Promise<TokenData | null>;
	set(data: TokenData): Promise<void>;
	clear(): Promise<void>;
	/** Returns true if a token exists and has not passed its expiresAt timestamp. */
	isValid(): Promise<boolean>;
}

/** In-memory implementation — suitable for testing and short-lived processes. */
export class MemoryTokenStore implements TokenStore {
	private data: TokenData | null = null;

	async get(): Promise<TokenData | null> {
		return this.data;
	}

	async set(data: TokenData): Promise<void> {
		this.data = data;
	}

	async clear(): Promise<void> {
		this.data = null;
	}

	async isValid(): Promise<boolean> {
		return this.data !== null && Date.now() < this.data.expiresAt;
	}
}
