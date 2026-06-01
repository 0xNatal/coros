import { afterEach, describe, expect, it, vi } from "vitest";
import { CorosClient } from "../../client.js";
import { envelope } from "../../test-helpers.js";
import type { TokenData } from "../../token-store.js";
import { MemoryTokenStore } from "../../token-store.js";
import type { Region } from "../../types.js";
import { getTrainingSchedule } from "./query.js";

const TOKEN: TokenData = {
	accessToken: "test-tok",
	userId: "test-user",
	expiresAt: Number.MAX_SAFE_INTEGER,
};

const REGION: Region = "eu";

function emptySchedule() {
	return {
		id: "0",
		maxIdInPlan: "0", // string (live-verified)
		maxPlanProgramId: "0", // string (live-verified)
		startDay: 20260601, // int YYYYMMDD (live-verified)
		endDay: 20261231,
		programs: [],
		weekStages: [],
		pbVersion: 2,
	};
}

afterEach(() => vi.unstubAllGlobals());

describe("getTrainingSchedule", () => {
	it("sends yfheader in the request", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(envelope(emptySchedule())),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await getTrainingSchedule(
			{ from: "20260601", to: "20260630" },
			TOKEN,
			REGION,
		);

		const [, capturedInit] = spy.mock.calls[0] as [string, RequestInit];
		const headers = capturedInit.headers as Record<string, string>;
		expect(headers.yfheader).toBe(JSON.stringify({ userId: TOKEN.userId }));
	});

	it("sends startDate, endDate, and supportRestExercise as query params", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(envelope(emptySchedule())),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await getTrainingSchedule(
			{ from: "20260601", to: "20260630" },
			TOKEN,
			REGION,
		);

		const [capturedUrl] = spy.mock.calls[0] as [string];
		expect(capturedUrl).toContain("startDate=20260601");
		expect(capturedUrl).toContain("endDate=20260630");
		expect(capturedUrl).toContain("supportRestExercise=1");
	});

	it("uses supportRestExercise=0 when explicitly passed", async () => {
		const spy = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(envelope(emptySchedule())),
		} as Response);
		vi.stubGlobal("fetch", spy);

		await getTrainingSchedule(
			{ from: "20260601", to: "20260630", supportRestExercise: 0 },
			TOKEN,
			REGION,
		);

		const [capturedUrl] = spy.mock.calls[0] as [string];
		expect(capturedUrl).toContain("supportRestExercise=0");
	});

	it("returns a valid TrainingSchedule with programs and pbVersion", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve(envelope(emptySchedule())),
			} as Response),
		);

		const result = await getTrainingSchedule(
			{ from: "20260601", to: "20260630" },
			TOKEN,
			REGION,
		);

		expect(Array.isArray(result.programs)).toBe(true);
		expect(result.pbVersion).toBe(2);
		expect(result.maxIdInPlan).toBe("0"); // string in API response
	});
});

// Integration test — requires COROS_EMAIL + COROS_PASSWORD env vars.
const email = process.env.COROS_EMAIL;
const password = process.env.COROS_PASSWORD;

describe.skipIf(!email || !password)("getTrainingSchedule integration", () => {
	it("returns a valid schedule for the current year", async () => {
		const store = new MemoryTokenStore();
		const client = new CorosClient(store);
		await client.login(String(email), String(password));

		const token = await store.get();
		if (!token) throw new Error("Login failed — no token in store");

		const year = new Date().getFullYear();
		const result = await getTrainingSchedule(
			{ from: `${year}0101`, to: `${year}1231` },
			token,
			client.region,
		);

		expect(Array.isArray(result.programs)).toBe(true);
		console.log(
			`[integration] schedule: ${result.programs?.length ?? 0} programs, pbVersion=${result.pbVersion}, maxIdInPlan=${result.maxIdInPlan}`,
		);
	});
});
