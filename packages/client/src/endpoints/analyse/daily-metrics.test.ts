import { afterEach, describe, expect, it, vi } from "vitest";
import { CorosClient } from "../../client.js";
import { envelope } from "../../test-helpers.js";
import type { TokenData } from "../../token-store.js";
import { MemoryTokenStore } from "../../token-store.js";
import type { Region } from "../../types.js";
import { getDailyMetrics } from "./daily-metrics.js";

const TOKEN: TokenData = {
	accessToken: "test-tok",
	userId: "test-user",
	expiresAt: Number.MAX_SAFE_INTEGER,
};

const REGION: Region = "eu";

afterEach(() => vi.unstubAllGlobals());

describe("getDailyMetrics", () => {
	it("returns DailyRecord array for the requested range", async () => {
		const dayList = [
			{ happenDay: 20260601, timestamp: 1780185600, trainingLoad: 80 },
			{ happenDay: 20260602, timestamp: 1780272000, trainingLoad: 0 },
		];
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope({ dayList })),
			} as Response),
		);

		const result = await getDailyMetrics(
			{ from: "20260601", to: "20260602" },
			TOKEN,
			REGION,
		);

		expect(result).toHaveLength(2);
		expect(result[0]?.happenDay).toBe(20260601);
		expect(result[1]?.happenDay).toBe(20260602);
	});

	it("returns empty array when the range has no data", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope({ weekList: [] })),
			} as Response),
		);

		const result = await getDailyMetrics(
			{ from: "20260601", to: "20260601" },
			TOKEN,
			REGION,
		);

		expect(result).toEqual([]);
	});
});

// Integration test — requires COROS_EMAIL + COROS_PASSWORD env vars.
const email = process.env.COROS_EMAIL;
const password = process.env.COROS_PASSWORD;

describe.skipIf(!email || !password)("getDailyMetrics integration", () => {
	it("returns zod-valid records for a 2-month range", async () => {
		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login(String(email), String(password));

		const token = await store.get();
		if (!token) throw new Error("Login failed — no token in store");

		const result = await getDailyMetrics(
			{ from: "20260101", to: "20260301" },
			token,
			client.region,
		);

		expect(Array.isArray(result)).toBe(true);
		console.log(
			`[integration] getDailyMetrics: ${result.length} days (20260101–20260301)`,
		);

		const withFitness = result.filter((r) => r.vo2max !== undefined);
		console.log(`[integration] days with fitness data: ${withFitness.length}`);

		for (const record of result) {
			expect(typeof record.happenDay).toBe("number");
			expect(typeof record.timestamp).toBe("number");
		}
	}, 20_000);
});
