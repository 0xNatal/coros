import { describe, expect, it } from "vitest";
import {
	CorosClient,
	getActivityDetail,
	getTrainingSchedule,
	listActivities,
	VERSION,
} from "./index.js";

describe("index exports", () => {
	it("exposes a version", () => {
		expect(VERSION).toBe("0.0.0");
	});

	it("exports CorosClient", () => {
		expect(typeof CorosClient).toBe("function");
	});

	it("exports endpoint functions", () => {
		expect(typeof listActivities).toBe("function");
		expect(typeof getActivityDetail).toBe("function");
		expect(typeof getTrainingSchedule).toBe("function");
	});
});
