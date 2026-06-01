import { afterEach, describe, expect, it, vi } from "vitest";
import { CorosClient } from "../../client.js";
import { envelope } from "../../test-helpers.js";
import type { TokenData } from "../../token-store.js";
import { MemoryTokenStore } from "../../token-store.js";
import type { Region } from "../../types.js";
import { getTrainingSummary } from "./summary.js";

const TOKEN: TokenData = {
	accessToken: "test-tok",
	userId: "test-user",
	expiresAt: Number.MAX_SAFE_INTEGER,
};

const REGION: Region = "eu";

afterEach(() => vi.unstubAllGlobals());

describe("getTrainingSummary", () => {
	it("calls analyse/query with no query params", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () =>
				Promise.resolve(
					envelope({ sportStatistic: [], dayList: [], weekList: [] }),
				),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await getTrainingSummary(TOKEN, REGION);

		const [capturedUrl] = spy.mock.calls[0] as [string];
		expect(capturedUrl).toContain("/analyse/query");
		expect(capturedUrl).not.toContain("?");
	});

	it("returns sportStatistic array", async () => {
		const sportStatistic = [
			{ sportType: 100, count: 12, distance: 96000, duration: 43200 },
			{ sportType: 200, count: 5, distance: 200000, duration: 72000 },
		];
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope({ sportStatistic, dayList: [] })),
			} as Response),
		);

		const result = await getTrainingSummary(TOKEN, REGION);

		expect(result.sportStatistic).toHaveLength(2);
		expect(result.sportStatistic?.[0]?.sportType).toBe(100);
		expect(result.sportStatistic?.[0]?.count).toBe(12);
	});

	it("returns dayList and t7dayList when present", async () => {
		const day = {
			happenDay: 20260601,
			timestamp: 1780185600,
			trainingLoad: 80,
		};
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve(
						envelope({ dayList: [day], t7dayList: [day], sportStatistic: [] }),
					),
			} as Response),
		);

		const result = await getTrainingSummary(TOKEN, REGION);

		expect(result.dayList).toHaveLength(1);
		expect(result.t7dayList).toHaveLength(1);
	});
});

// Integration test — requires COROS_EMAIL + COROS_PASSWORD env vars.
const email = process.env.COROS_EMAIL;
const password = process.env.COROS_PASSWORD;

describe.skipIf(!email || !password)("getTrainingSummary integration", () => {
	it("returns a valid summary with sportStatistic and dayList", async () => {
		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login(String(email), String(password));

		const token = await store.get();
		if (!token) throw new Error("Login failed — no token in store");

		const result = await getTrainingSummary(token, client.region);

		expect(Array.isArray(result.sportStatistic)).toBe(true);
		expect(Array.isArray(result.dayList)).toBe(true);

		console.log(
			`[integration] sportStatistic: ${result.sportStatistic?.length ?? 0} sports`,
		);
		for (const s of result.sportStatistic ?? []) {
			console.log(
				`[integration]   sportType=${s.sportType} count=${s.count} distance=${s.distance}m`,
			);
		}
		console.log(
			`[integration] dayList: ${result.dayList?.length ?? 0} days, t7dayList: ${result.t7dayList?.length ?? 0} days`,
		);
	}, 15_000);
});
