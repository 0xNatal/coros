import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { CorosApiError, CorosError, CorosValidationError } from "./errors.js";
import { request } from "./http.js";
import { envelope } from "./test-helpers.js";

const token = {
	accessToken: "tok32",
	userId: "u1",
	expiresAt: Date.now() + 60_000,
};

function mockFetch(body: unknown, status = 200) {
	return vi.fn().mockResolvedValue({
		ok: status < 400,
		status,
		json: () => Promise.resolve(body),
	} as Response);
}

describe("request", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", mockFetch(envelope("hello")));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns typed data on success", async () => {
		const result = await request("https://example.com/api", z.string(), {
			token,
			region: "eu",
		});
		expect(result).toBe("hello");
	});

	it("injects accessToken and Cookie headers", async () => {
		const spy = mockFetch(envelope("x"));
		vi.stubGlobal("fetch", spy);

		await request("https://example.com/api", z.string(), {
			token,
			region: "eu",
		});

		const [, init] = spy.mock.calls[0] as [string, RequestInit];
		const headers = init.headers as Record<string, string>;
		expect(headers.accessToken).toBe("tok32");
		expect(headers.Cookie).toContain("CPL-coros-token=tok32");
		expect(headers.Cookie).toContain("CPL-coros-region=3");
	});

	it("adds yfheader when requested", async () => {
		const spy = mockFetch(envelope("x"));
		vi.stubGlobal("fetch", spy);

		await request("https://example.com/api", z.string(), {
			token,
			region: "eu",
			yfheader: true,
		});

		const [, init] = spy.mock.calls[0] as [string, RequestInit];
		const headers = init.headers as Record<string, string>;
		expect(headers.yfheader).toBe(JSON.stringify({ userId: "u1" }));
	});

	it("appends query params to the URL", async () => {
		const spy = mockFetch(envelope("x"));
		vi.stubGlobal("fetch", spy);

		await request("https://example.com/api", z.string(), {
			token,
			region: "eu",
			query: { from: "20260101", page: 1 },
		});

		const [url] = spy.mock.calls[0] as [string];
		expect(url).toContain("from=20260101");
		expect(url).toContain("page=1");
	});

	it("throws CorosApiError when result != 0000", async () => {
		vi.stubGlobal("fetch", mockFetch(envelope(null, "1030")));
		await expect(
			request("https://example.com/api", z.string().nullable(), {
				token,
				region: "eu",
			}),
		).rejects.toBeInstanceOf(CorosApiError);
	});

	it("throws CorosValidationError when data does not match schema", async () => {
		vi.stubGlobal("fetch", mockFetch(envelope(42)));
		await expect(
			request("https://example.com/api", z.string(), { token, region: "eu" }),
		).rejects.toBeInstanceOf(CorosValidationError);
	});

	it("throws CorosValidationError on invalid JSON", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.reject(new SyntaxError("bad json")),
			} as unknown as Response),
		);
		await expect(
			request("https://example.com/api", z.string(), { token, region: "eu" }),
		).rejects.toBeInstanceOf(CorosValidationError);
	});

	it("throws CorosError when token is set but region is omitted", async () => {
		await expect(
			request("https://example.com/api", z.string(), { token }),
		).rejects.toBeInstanceOf(CorosError);
	});
});
