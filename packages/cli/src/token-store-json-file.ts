import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { TokenData, TokenStore } from "@coros/client";

function defaultPath(): string {
	const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
	return join(base, "coros", "token.json");
}

function parseTokenData(raw: string): TokenData | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}
	if (
		typeof parsed !== "object" ||
		parsed === null ||
		typeof (parsed as Record<string, unknown>).accessToken !== "string" ||
		typeof (parsed as Record<string, unknown>).userId !== "string" ||
		typeof (parsed as Record<string, unknown>).expiresAt !== "number"
	) {
		return null;
	}
	// Cast is safe: all three required fields are validated above.
	return parsed as TokenData;
}

/**
 * Plain-JSON token file.
 * Written with mode 0o600 (owner read/write only).
 * Expiry is determined by API rejection (CorosAuthError), not a local TTL.
 */
export class JsonFileTokenStore implements TokenStore {
	constructor(readonly filePath = defaultPath()) {}

	async get(): Promise<TokenData | null> {
		let raw: string;
		try {
			raw = await readFile(this.filePath, "utf8");
		} catch {
			return null;
		}
		return parseTokenData(raw);
	}

	async set(data: TokenData): Promise<void> {
		await mkdir(join(this.filePath, ".."), { recursive: true });
		await writeFile(this.filePath, JSON.stringify(data, null, 2), {
			mode: 0o600,
			encoding: "utf8",
		});
	}

	async clear(): Promise<void> {
		try {
			await unlink(this.filePath);
		} catch {
			// File not present is fine.
		}
	}

	async isValid(): Promise<boolean> {
		const token = await this.get();
		return token !== null && Date.now() < token.expiresAt;
	}
}
