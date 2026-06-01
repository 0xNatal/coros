import { afterEach, describe, expect, it, vi } from "vitest";
import { CorosClient } from "../../client.js";
import { envelope, toYYYYMMDD } from "../../test-helpers.js";
import type { TokenData } from "../../token-store.js";
import { MemoryTokenStore } from "../../token-store.js";
import type { Region } from "../../types.js";
import { getDayDetail } from "./day-detail.js";

const TOKEN: TokenData = {
	accessToken: "test-tok",
	userId: "test-user",
	expiresAt: Number.MAX_SAFE_INTEGER,
};

const REGION: Region = "eu";

function makeDayList(count = 2) {
	return Array.from({ length: count }, (_, i) => ({
		happenDay: 20260601 + i,
		timestamp: 1780185600 + i * 86400,
		distance: 8000,
		duration: 3600,
		trainingLoad: 100,
	}));
}

afterEach(() => vi.unstubAllGlobals());

describe("getDayDetail", () => {
	it("sends startDay and endDay as query params", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(envelope({ dayList: makeDayList() })),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await getDayDetail({ from: "20260601", to: "20260615" }, TOKEN, REGION);

		const [capturedUrl] = spy.mock.calls[0] as [string];
		expect(capturedUrl).toContain("startDay=20260601");
		expect(capturedUrl).toContain("endDay=20260615");
	});

	it("does not send yfheader", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(envelope({ dayList: makeDayList() })),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await getDayDetail({ from: "20260601", to: "20260615" }, TOKEN, REGION);

		const [, capturedInit] = spy.mock.calls[0] as [string, RequestInit];
		const headers = capturedInit.headers as Record<string, string>;
		expect(headers.yfheader).toBeUndefined();
	});

	it("returns dayList entries from response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope({ dayList: makeDayList(3) })),
			} as Response),
		);

		const result = await getDayDetail(
			{ from: "20260601", to: "20260603" },
			TOKEN,
			REGION,
		);

		expect(result).toHaveLength(3);
		expect(result[0]?.happenDay).toBe(20260601);
		expect(result[2]?.happenDay).toBe(20260603);
	});

	it("returns empty array when dayList is absent", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope({ weekList: [] })),
			} as Response),
		);

		const result = await getDayDetail(
			{ from: "20260601", to: "20260601" },
			TOKEN,
			REGION,
		);

		expect(result).toEqual([]);
	});

	it("returns sparse fitness fields when present", async () => {
		const dayWithFitness = {
			happenDay: 20260601,
			timestamp: 1780185600,
			vo2max: 45,
			staminaLevel: 64.1,
			lthr: 172,
			ltsp: 384,
			rhr: 63,
		};
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope({ dayList: [dayWithFitness] })),
			} as Response),
		);

		const result = await getDayDetail(
			{ from: "20260601", to: "20260601" },
			TOKEN,
			REGION,
		);
		const day = result[0];

		expect(day?.vo2max).toBe(45);
		expect(day?.staminaLevel).toBeCloseTo(64.1);
		expect(day?.lthr).toBe(172);
		expect(day?.ltsp).toBe(384);
		expect(day?.rhr).toBe(63);
	});

	it("fitness fields are undefined on a day without activity", async () => {
		const restDay = {
			happenDay: 20260601,
			timestamp: 1780185600,
			distance: 0,
			trainingLoad: 0,
		};
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope({ dayList: [restDay] })),
			} as Response),
		);

		const result = await getDayDetail(
			{ from: "20260601", to: "20260601" },
			TOKEN,
			REGION,
		);
		const day = result[0];

		expect(day?.vo2max).toBeUndefined();
		expect(day?.rhr).toBeUndefined();
	});
});

// Integration test — requires COROS_EMAIL + COROS_PASSWORD env vars.
const email = process.env.COROS_EMAIL;
const password = process.env.COROS_PASSWORD;

describe.skipIf(!email || !password)("getDayDetail integration", () => {
	it("returns zod-valid daily records with fitness fields for 2 weeks", async () => {
		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login(String(email), String(password));

		const token = await store.get();
		if (!token) throw new Error("Login failed — no token in store");

		const today = new Date();
		const twoWeeksAgo = new Date(today);
		twoWeeksAgo.setDate(today.getDate() - 14);

		const from = toYYYYMMDD(twoWeeksAgo);
		const to = toYYYYMMDD(today);

		const records = await getDayDetail({ from, to }, token, client.region);

		expect(Array.isArray(records)).toBe(true);
		console.log(
			`[integration] dayDetail: ${records.length} days (${from}–${to})`,
		);

		const withFitness = records.filter((r) => r.vo2max !== undefined);
		const withRhr = records.filter((r) => r.rhr !== undefined);
		console.log(
			`[integration] days with vo2max: ${withFitness.length}, with rhr: ${withRhr.length}`,
		);

		if (withFitness.length > 0) {
			const sample = withFitness[withFitness.length - 1];
			if (sample) {
				console.log(
					`[integration] sample fitness day ${sample.happenDay}: vo2max=${sample.vo2max}, staminaLevel=${sample.staminaLevel}, lthr=${sample.lthr}, ltsp=${sample.ltsp}, rhr=${sample.rhr}`,
				);
			}
		}

		for (const record of records) {
			expect(typeof record.happenDay).toBe("number");
			expect(typeof record.timestamp).toBe("number");
		}
	}, 20_000);
});
