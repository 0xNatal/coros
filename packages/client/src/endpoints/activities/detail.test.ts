import { afterEach, describe, expect, it, vi } from "vitest";
import { CorosClient } from "../../client.js";
import type { TokenData } from "../../token-store.js";
import { MemoryTokenStore } from "../../token-store.js";
import type { Region } from "../../types.js";
import { activityDetailSummarySchema, getActivityDetail } from "./detail.js";
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

function makeDetail(overrides: Record<string, unknown> = {}) {
	return {
		summary: {
			distance: 799908,
			totalTime: 353261,
			workoutTime: 353261,
			calories: 522145,
			avgHr: 152,
			maxHr: 164,
		},
		lapList: [
			{
				type: 2,
				lapItemList: [{ exerciseNameKey: "S100" }],
			},
		],
		zoneList: [
			{
				type: 126,
				zoneItemList: [
					{
						leftScope: 0,
						rightScope: 128,
						percent: 5.2,
						second: 180,
						zoneIndex: 0,
					},
				],
			},
		],
		weather: { temperature: 192, humidity: 570 },
		frequencyList: [{ timestamp: 178020965100 }],
		graphList: [{ type: 126 }],
		lapGraphList: [{ type: 126 }],
		...overrides,
	};
}

afterEach(() => vi.unstubAllGlobals());

// ──────────────────────────────────────────────────────────────────────────────
// Pure unit conversion tests — no network
// ──────────────────────────────────────────────────────────────────────────────

describe("activityDetailSummarySchema unit conversions", () => {
	it("converts distance cm → m", () => {
		const result = activityDetailSummarySchema.parse({ distance: 799908 });
		expect(result.distance).toBeCloseTo(7999.08);
	});

	it("converts totalTime centiseconds → seconds", () => {
		const result = activityDetailSummarySchema.parse({ totalTime: 353261 });
		expect(result.totalTime).toBeCloseTo(3532.61);
	});

	it("converts workoutTime centiseconds → seconds", () => {
		const result = activityDetailSummarySchema.parse({ workoutTime: 353261 });
		expect(result.workoutTime).toBeCloseTo(3532.61);
	});

	it("converts calories raw → kcal (÷ 1000)", () => {
		const result = activityDetailSummarySchema.parse({ calories: 522145 });
		expect(result.calories).toBeCloseTo(522.145);
	});

	it("passes through undefined unit fields unchanged", () => {
		const result = activityDetailSummarySchema.parse({});
		expect(result.distance).toBeUndefined();
		expect(result.totalTime).toBeUndefined();
		expect(result.calories).toBeUndefined();
	});

	it("preserves non-converted fields", () => {
		const result = activityDetailSummarySchema.parse({
			avgHr: 152,
			maxHr: 164,
		});
		expect(result.avgHr).toBe(152);
		expect(result.maxHr).toBe(164);
	});
});

// ──────────────────────────────────────────────────────────────────────────────
// Behaviour tests — mocked fetch
// ──────────────────────────────────────────────────────────────────────────────

describe("getActivityDetail", () => {
	it("strips frequencyList, graphList, lapGraphList from returned object", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope(makeDetail())),
			} as Response),
		);

		const result = await getActivityDetail("123", 100, TOKEN, REGION);

		const raw = result as unknown as Record<string, unknown>;
		expect(raw.frequencyList).toBeUndefined();
		expect(raw.graphList).toBeUndefined();
		expect(raw.lapGraphList).toBeUndefined();
	});

	it("preserves lapList and zoneList", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope(makeDetail())),
			} as Response),
		);

		const result = await getActivityDetail("123", 100, TOKEN, REGION);

		expect(Array.isArray(result.lapList)).toBe(true);
		expect(result.lapList?.length).toBe(1);
		expect(result.lapList?.[0]?.type).toBe(2);

		expect(Array.isArray(result.zoneList)).toBe(true);
		expect(result.zoneList?.length).toBe(1);
		expect(result.zoneList?.[0]?.type).toBe(126);
	});

	it("applies unit conversions to the summary", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope(makeDetail())),
			} as Response),
		);

		const result = await getActivityDetail("123", 100, TOKEN, REGION);

		expect(result.summary.distance).toBeCloseTo(7999.08); // cm→m
		expect(result.summary.totalTime).toBeCloseTo(3532.61); // cs→s
		expect(result.summary.calories).toBeCloseTo(522.145); // raw→kcal
	});

	it("sends a POST with labelId and sportType as query params", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(envelope(makeDetail())),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await getActivityDetail("477872651163959602", 100, TOKEN, REGION);

		const [capturedUrl, capturedInit] = spy.mock.calls[0] as [
			string,
			RequestInit,
		];
		expect(capturedUrl).toContain("labelId=477872651163959602");
		expect(capturedUrl).toContain("sportType=100");
		expect(capturedInit.method).toBe("POST");
		const headers = capturedInit.headers as Record<string, string>;
		expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
	});
});

// ──────────────────────────────────────────────────────────────────────────────
// Integration test — requires COROS_EMAIL + COROS_PASSWORD env vars
// ──────────────────────────────────────────────────────────────────────────────

const email = process.env.COROS_EMAIL;
const password = process.env.COROS_PASSWORD;

describe.skipIf(!email || !password)("getActivityDetail integration", () => {
	it("returns laps and zones, no time-series fields", async () => {
		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login(String(email), String(password));

		const token = await store.get();
		if (!token) throw new Error("Login failed — no token in store");

		// size: 20 → at most ceil(total/20) requests instead of one per activity.
		// from: 30 days back so the early-stop triggers after the first page.
		const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
		const activities = await listActivities(
			{ size: 20, from: thirtyDaysAgo },
			token,
			client.region,
		);
		if (activities.length === 0) {
			console.log("[integration] no activities — skipping detail test");
			return;
		}

		const first = activities[0];
		if (!first) throw new Error("activities[0] unexpectedly undefined");

		const detail = await getActivityDetail(
			first.labelId,
			first.sportType,
			token,
			client.region,
		);

		console.log(
			"[integration] detail summary:",
			JSON.stringify(detail.summary, null, 2),
		);
		console.log(
			`[integration] lapList: ${detail.lapList?.length ?? 0} groups, zoneList: ${detail.zoneList?.length ?? 0} entries`,
		);

		expect(detail.summary).toBeDefined();
		expect(Array.isArray(detail.lapList)).toBe(true);
		expect(Array.isArray(detail.zoneList)).toBe(true);

		// Time-series fields must be stripped
		const raw = detail as unknown as Record<string, unknown>;
		expect(raw.frequencyList).toBeUndefined();
		expect(raw.graphList).toBeUndefined();
		expect(raw.lapGraphList).toBeUndefined();

		// Units are converted (sanity check: distance should be < 1 000 000 m)
		if (detail.summary.distance !== undefined) {
			expect(detail.summary.distance).toBeLessThan(1_000_000);
		}
		// 30s: login + list (1-2 requests) + detail (large GPS response)
	}, 30_000);
});
