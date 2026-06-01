import { afterEach, describe, expect, it, vi } from "vitest";
import { CorosClient } from "./client.js";
import { CorosAuthError } from "./errors.js";
import { MemoryTokenStore } from "./token-store.js";

function envelope(data: unknown, result = "0000") {
	return { apiCode: 200, message: "ok", result, data };
}

function mockFetch(body: unknown) {
	return vi.fn().mockResolvedValue({
		json: () => Promise.resolve(body),
	} as Response);
}

afterEach(() => vi.unstubAllGlobals());

describe("CorosClient", () => {
	it("defaults to eu region", () => {
		const client = new CorosClient(new MemoryTokenStore());
		expect(client.region).toBe("eu");
	});

	it("accepts an explicit region", () => {
		const client = new CorosClient(new MemoryTokenStore(), "us");
		expect(client.region).toBe("us");
	});

	it("login stores a valid token in the store", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch(envelope({ accessToken: "tok", userId: "u1" })),
		);
		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login("a@b.com", "pass");
		expect(await store.isValid()).toBe(true);
	});

	it("getAccount throws CorosAuthError when not logged in", async () => {
		const client = new CorosClient(new MemoryTokenStore());
		await expect(client.getAccount()).rejects.toBeInstanceOf(CorosAuthError);
	});

	it("getAccount returns a profile after login", async () => {
		const loginEnvelope = envelope({ accessToken: "tok", userId: "u1" });
		const profileEnvelope = envelope({
			userId: "u1",
			email: "a@b.com",
			maxHr: 190,
			rhr: 50,
		});
		const spy = vi
			.fn()
			.mockResolvedValueOnce({ json: () => Promise.resolve(loginEnvelope) })
			.mockResolvedValueOnce({ json: () => Promise.resolve(profileEnvelope) });
		vi.stubGlobal("fetch", spy);

		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login("a@b.com", "pass");
		const profile = await client.getAccount();

		expect(profile.userId).toBe("u1");
		expect(profile.email).toBe("a@b.com");
		expect(profile.maxHr).toBe(190);
	});
});

// Integration test — requires COROS_EMAIL + COROS_PASSWORD env vars.
const email = process.env.COROS_EMAIL;
const password = process.env.COROS_PASSWORD;

describe.skipIf(!email || !password)("CorosClient integration", () => {
	it("login then getAccount returns a zod-valid profile", async () => {
		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login(String(email), String(password));
		expect(await store.isValid()).toBe(true);
		const profile = await client.getAccount();
		expect(typeof profile.userId).toBe("string");
		expect(typeof profile.email).toBe("string");
	});
});
