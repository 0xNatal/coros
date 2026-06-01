import type { TokenData } from "@coros/client";
import { MemoryTokenStore } from "@coros/client";
import { describe, expect, it } from "vitest";
import { ChainTokenStore } from "./token-store-chain.js";

const TOKEN_A: TokenData = {
	accessToken: "token-a",
	userId: "user-a",
	expiresAt: Date.now() + 3_600_000,
};

const TOKEN_B: TokenData = {
	accessToken: "token-b",
	userId: "user-b",
	expiresAt: Date.now() + 3_600_000,
};

describe("ChainTokenStore", () => {
	it("get() returns the first non-null token", async () => {
		const a = new MemoryTokenStore();
		const b = new MemoryTokenStore();
		await b.set(TOKEN_B);
		const chain = new ChainTokenStore([a, b]);
		expect(await chain.get()).toEqual(TOKEN_B);
	});

	it("get() returns the first store's token when both have tokens", async () => {
		const a = new MemoryTokenStore();
		const b = new MemoryTokenStore();
		await a.set(TOKEN_A);
		await b.set(TOKEN_B);
		const chain = new ChainTokenStore([a, b]);
		expect(await chain.get()).toEqual(TOKEN_A);
	});

	it("get() returns null when all stores are empty", async () => {
		const chain = new ChainTokenStore([
			new MemoryTokenStore(),
			new MemoryTokenStore(),
		]);
		expect(await chain.get()).toBeNull();
	});

	it("set() writes to the last store only", async () => {
		const a = new MemoryTokenStore();
		const b = new MemoryTokenStore();
		const chain = new ChainTokenStore([a, b]);
		await chain.set(TOKEN_A);
		expect(await a.get()).toBeNull();
		expect(await b.get()).toEqual(TOKEN_A);
	});

	it("clear() clears all stores", async () => {
		const a = new MemoryTokenStore();
		const b = new MemoryTokenStore();
		await a.set(TOKEN_A);
		await b.set(TOKEN_B);
		const chain = new ChainTokenStore([a, b]);
		await chain.clear();
		expect(await a.get()).toBeNull();
		expect(await b.get()).toBeNull();
	});

	it("isValid() returns true when first matching store has a valid token", async () => {
		const a = new MemoryTokenStore();
		await a.set(TOKEN_A);
		const chain = new ChainTokenStore([a, new MemoryTokenStore()]);
		expect(await chain.isValid()).toBe(true);
	});

	it("isValid() returns false when no store has a token", async () => {
		const chain = new ChainTokenStore([new MemoryTokenStore()]);
		expect(await chain.isValid()).toBe(false);
	});

	it("isValid() uses get() semantics — expired first store hides valid second store", async () => {
		// get() returns the first non-null token; if it's expired, isValid() is false.
		// This is intentional: env var takes precedence even if expired.
		const a = new MemoryTokenStore();
		const b = new MemoryTokenStore();
		await a.set({ ...TOKEN_A, expiresAt: Date.now() - 1 });
		await b.set(TOKEN_B);
		const chain = new ChainTokenStore([a, b]);
		expect(await chain.isValid()).toBe(false);
	});

	it("set() on a single-store chain writes to that store", async () => {
		const only = new MemoryTokenStore();
		const chain = new ChainTokenStore([only]);
		await chain.set(TOKEN_A);
		expect(await only.get()).toEqual(TOKEN_A);
	});
});
