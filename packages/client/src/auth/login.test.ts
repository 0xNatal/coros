import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CorosAuthError } from "../errors.js";
import { MemoryTokenStore } from "../token-store.js";
import { login } from "./login.js";

function envelope(data: unknown, result = "0000") {
	return { apiCode: 200, message: "ok", result, data };
}

function mockFetch(body: unknown) {
	return vi.fn().mockResolvedValue({
		json: () => Promise.resolve(body),
	} as Response);
}

afterEach(() => vi.unstubAllGlobals());

describe("login", () => {
	it("sends MD5-hashed password in the request body", async () => {
		const spy = mockFetch(
			envelope({ accessToken: "tok", userId: "u1", extra: "ignored" }),
		);
		vi.stubGlobal("fetch", spy);

		const store = new MemoryTokenStore();
		await login("user@example.com", "secret", "eu", store);

		const [, init] = spy.mock.calls[0] as [string, RequestInit];
		const body = JSON.parse(init.body as string) as Record<string, unknown>;
		expect(body.account).toBe("user@example.com");
		expect(body.accountType).toBe(2);
		expect(body.pwd).toBe(createHash("md5").update("secret").digest("hex"));
	});

	it("stores the token and userId after successful login", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch(envelope({ accessToken: "mytoken", userId: "42" })),
		);

		const store = new MemoryTokenStore();
		await login("user@example.com", "pass", "eu", store);

		expect(await store.isValid()).toBe(true);
		const data = await store.get();
		expect(data?.accessToken).toBe("mytoken");
		expect(data?.userId).toBe("42");
		expect(data?.expiresAt).toBeGreaterThan(Date.now());
	});

	it("throws CorosAuthError when the API returns a non-0000 result", async () => {
		vi.stubGlobal("fetch", mockFetch(envelope(null, "1030")));

		const store = new MemoryTokenStore();
		await expect(
			login("user@example.com", "wrong", "eu", store),
		).rejects.toBeInstanceOf(CorosAuthError);
	});

	it("calls the correct regional URL", async () => {
		const spy = mockFetch(envelope({ accessToken: "t", userId: "u" }));
		vi.stubGlobal("fetch", spy);

		await login("a@b.com", "p", "eu", new MemoryTokenStore());

		const [url] = spy.mock.calls[0] as [string];
		expect(url).toContain("teameuapi.coros.com");
	});
});

// Integration test — skipped when credentials are not available.
const email = process.env.COROS_EMAIL;
const password = process.env.COROS_PASSWORD;

describe.skipIf(!email || !password)("login integration", () => {
	it("authenticates and stores a valid token", async () => {
		const store = new MemoryTokenStore();
		await login(String(email), String(password), "eu", store);
		expect(await store.isValid()).toBe(true);
	});
});
