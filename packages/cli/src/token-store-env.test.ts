import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EnvTokenStore } from "./token-store-env.js";

const store = new EnvTokenStore();

function setEnv(accessToken: string, userId: string, expiresAt?: number): void {
	process.env.COROS_ACCESS_TOKEN = accessToken;
	process.env.COROS_USER_ID = userId;
	if (expiresAt !== undefined) {
		process.env.COROS_TOKEN_EXPIRES_AT = String(expiresAt);
	}
}

function clearEnv(): void {
	delete process.env.COROS_ACCESS_TOKEN;
	delete process.env.COROS_USER_ID;
	delete process.env.COROS_TOKEN_EXPIRES_AT;
}

beforeEach(clearEnv);
afterEach(clearEnv);

describe("EnvTokenStore", () => {
	it("returns null when env vars are absent", async () => {
		expect(await store.get()).toBeNull();
	});

	it("reads token from env vars", async () => {
		const future = Date.now() + 3_600_000;
		setEnv("tok", "usr", future);
		const token = await store.get();
		expect(token).toEqual({
			accessToken: "tok",
			userId: "usr",
			expiresAt: future,
		});
	});

	it("defaults expiresAt to MAX_SAFE_INTEGER when not set", async () => {
		setEnv("tok", "usr");
		const token = await store.get();
		expect(token?.expiresAt).toBe(Number.MAX_SAFE_INTEGER);
	});

	it("defaults expiresAt to MAX_SAFE_INTEGER when env var is not a valid number", async () => {
		setEnv("tok", "usr");
		process.env.COROS_TOKEN_EXPIRES_AT = "not-a-number";
		const token = await store.get();
		expect(token?.expiresAt).toBe(Number.MAX_SAFE_INTEGER);
	});

	it("isValid returns true for a non-expired token", async () => {
		setEnv("tok", "usr", Date.now() + 3_600_000);
		expect(await store.isValid()).toBe(true);
	});

	it("isValid returns false for an expired token", async () => {
		setEnv("tok", "usr", Date.now() - 1);
		expect(await store.isValid()).toBe(false);
	});

	it("isValid returns false when no token is set", async () => {
		expect(await store.isValid()).toBe(false);
	});

	it("set() throws — read-only store", async () => {
		await expect(
			store.set({ accessToken: "x", userId: "y", expiresAt: 0 }),
		).rejects.toThrow("read-only");
	});

	it("clear() is a no-op", async () => {
		setEnv("tok", "usr");
		await store.clear();
		// Env var unchanged — clear does nothing.
		expect(process.env.COROS_ACCESS_TOKEN).toBe("tok");
	});
});
