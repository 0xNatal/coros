import { describe, expect, it } from "vitest";
import { MemoryTokenStore } from "./token-store.js";

const FUTURE = Date.now() + 60_000;
const PAST = Date.now() - 60_000;

describe("MemoryTokenStore", () => {
	it("returns null before any token is set", async () => {
		const store = new MemoryTokenStore();
		expect(await store.get()).toBeNull();
	});

	it("isValid returns false when empty", async () => {
		const store = new MemoryTokenStore();
		expect(await store.isValid()).toBe(false);
	});

	it("stores and retrieves token data", async () => {
		const store = new MemoryTokenStore();
		const data = { accessToken: "abc123", userId: "u1", expiresAt: FUTURE };
		await store.set(data);
		expect(await store.get()).toEqual(data);
	});

	it("isValid returns true for a non-expired token", async () => {
		const store = new MemoryTokenStore();
		await store.set({ accessToken: "t", userId: "u", expiresAt: FUTURE });
		expect(await store.isValid()).toBe(true);
	});

	it("isValid returns false for an expired token", async () => {
		const store = new MemoryTokenStore();
		await store.set({ accessToken: "t", userId: "u", expiresAt: PAST });
		expect(await store.isValid()).toBe(false);
	});

	it("clear removes the token", async () => {
		const store = new MemoryTokenStore();
		await store.set({ accessToken: "t", userId: "u", expiresAt: FUTURE });
		await store.clear();
		expect(await store.get()).toBeNull();
		expect(await store.isValid()).toBe(false);
	});
});
