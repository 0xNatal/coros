import { afterEach, describe, expect, it, vi } from "vitest";
import { CorosClient } from "../../client.js";
import type { TokenData } from "../../token-store.js";
import { MemoryTokenStore } from "../../token-store.js";
import type { Region } from "../../types.js";
import type { ActivitySummary } from "./list.js";
import { listActivities } from "./list.js";

const TOKEN: TokenData = {
	accessToken: "test-tok",
	userId: "test-user",
	expiresAt: Number.MAX_SAFE_INTEGER,
};

const REGION: Region = "eu";

function envelope(data: unknown) {
	return { apiCode: 200, message: "ok", result: "0000", data };
}

function makeActivity(
	overrides: Partial<ActivitySummary> = {},
): ActivitySummary {
	return {
		labelId: "1",
		name: "Test Run",
		sportType: 100,
		startTime: 1_780_000_000,
		endTime: 1_780_003_600,
		...overrides,
	};
}

function makePage(params: {
	activities: ActivitySummary[];
	page?: number;
	totalPage?: number;
	count?: number;
}) {
	const { activities, page = 1, totalPage = 1, count } = params;
	return {
		count: count ?? activities.length,
		pageNumber: page,
		totalPage,
		dataList: activities,
	};
}

afterEach(() => vi.unstubAllGlobals());

describe("listActivities", () => {
	it("returns activities from a single page", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve(
						envelope(
							makePage({
								activities: [
									makeActivity({ labelId: "1" }),
									makeActivity({ labelId: "2" }),
								],
							}),
						),
					),
			} as Response),
		);

		const result = await listActivities({}, TOKEN, REGION);
		expect(result).toHaveLength(2);
		expect(result[0]?.labelId).toBe("1");
		expect(result[1]?.labelId).toBe("2");
	});

	it("fetches all pages and combines results", async () => {
		const spy = vi
			.fn()
			.mockResolvedValueOnce({
				json: () =>
					Promise.resolve(
						envelope(
							makePage({
								activities: [makeActivity({ labelId: "a", startTime: 2000 })],
								page: 1,
								totalPage: 2,
								count: 2,
							}),
						),
					),
			})
			.mockResolvedValueOnce({
				json: () =>
					Promise.resolve(
						envelope(
							makePage({
								activities: [makeActivity({ labelId: "b", startTime: 1000 })],
								page: 2,
								totalPage: 2,
								count: 2,
							}),
						),
					),
			});
		vi.stubGlobal("fetch", spy);

		const result = await listActivities({}, TOKEN, REGION);
		expect(result).toHaveLength(2);
		expect(result[0]?.labelId).toBe("a");
		expect(result[1]?.labelId).toBe("b");
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it("stops early when from boundary is reached", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () =>
				Promise.resolve(
					envelope(
						makePage({
							activities: [
								makeActivity({ startTime: 3000 }),
								makeActivity({ startTime: 2000 }),
								makeActivity({ startTime: 500 }), // older than from=1000 → stops here
							],
							totalPage: 5, // more pages exist but must not be fetched
						}),
					),
				),
		} as Response);
		vi.stubGlobal("fetch", spy);

		const result = await listActivities({ from: 1000 }, TOKEN, REGION);
		expect(result).toHaveLength(2); // startTime 3000 and 2000 pass; 500 triggers early stop
		expect(spy).toHaveBeenCalledTimes(1); // no subsequent pages fetched
	});

	it("skips activities newer than to", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve(
						envelope(
							makePage({
								activities: [
									makeActivity({ startTime: 5000 }),
									makeActivity({ startTime: 3000 }),
									makeActivity({ startTime: 1000 }),
								],
							}),
						),
					),
			} as Response),
		);

		const result = await listActivities({ to: 4000 }, TOKEN, REGION);
		// 5000 > 4000 is skipped; 3000 and 1000 pass
		expect(result).toHaveLength(2);
	});

	it("returns empty array when dataList is present but empty", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve(envelope(makePage({ activities: [], totalPage: 1 }))),
			} as Response),
		);

		const result = await listActivities({}, TOKEN, REGION);
		expect(result).toHaveLength(0);
	});

	it("returns empty array when API omits pagination fields (account with no activities)", async () => {
		// Real API response when count == 0: only { count: 0 }, no pageNumber/totalPage/dataList.
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope({ count: 0 })),
			} as Response),
		);

		const result = await listActivities({}, TOKEN, REGION);
		expect(result).toHaveLength(0);
	});

	it("includes modeList param when sportTypes is provided", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () =>
				Promise.resolve(envelope(makePage({ activities: [], totalPage: 1 }))),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await listActivities({ sportTypes: [100, 200] }, TOKEN, REGION);

		const [capturedUrl] = spy.mock.calls[0] as [string];
		// URLSearchParams encodes commas as %2C
		expect(capturedUrl).toMatch(/modeList=100/);
		expect(capturedUrl).toMatch(/200/);
	});

	it("omits modeList when sportTypes is empty", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () =>
				Promise.resolve(envelope(makePage({ activities: [], totalPage: 1 }))),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await listActivities({ sportTypes: [] }, TOKEN, REGION);

		const [capturedUrl] = spy.mock.calls[0] as [string];
		expect(capturedUrl).not.toContain("modeList");
	});
});

// Integration test — requires COROS_EMAIL + COROS_PASSWORD env vars.
const email = process.env.COROS_EMAIL;
const password = process.env.COROS_PASSWORD;

describe.skipIf(!email || !password)("listActivities integration", () => {
	it("returns a zod-valid activity list from the real API", async () => {
		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login(String(email), String(password));

		const token = await store.get();
		if (!token) throw new Error("Login failed — no token in store");

		// size=5 forces multi-page fetching on accounts with more than 5 activities
		const result = await listActivities({ size: 5 }, token, client.region);

		expect(Array.isArray(result)).toBe(true);
		console.log(
			`[integration] listActivities returned ${result.length} activities`,
		);

		if (result.length > 0) {
			const first = result[0];
			if (!first) throw new Error("result[0] unexpectedly undefined");
			expect(typeof first.labelId).toBe("string");
			expect(typeof first.sportType).toBe("number");
			expect(typeof first.startTime).toBe("number");
			expect(typeof first.endTime).toBe("number");
			console.log(
				"[integration] first activity:",
				JSON.stringify(first, null, 2),
			);
		}
	});
});
