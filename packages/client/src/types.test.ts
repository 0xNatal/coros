import { describe, expect, it } from "vitest";
import { REGION_BASE_URLS, REGION_COOKIE_CODES } from "./types.js";

describe("REGION_BASE_URLS", () => {
	it("maps eu to the correct host", () => {
		expect(REGION_BASE_URLS.eu).toBe("https://teameuapi.coros.com");
	});

	it("maps us to the correct host", () => {
		expect(REGION_BASE_URLS.us).toBe("https://teamapi.coros.com");
	});

	it("maps asia to the correct host", () => {
		expect(REGION_BASE_URLS.asia).toBe("https://teamcnapi.coros.com");
	});
});

describe("REGION_COOKIE_CODES", () => {
	it("maps eu to cookie code 3 (live-verified)", () => {
		expect(REGION_COOKIE_CODES.eu).toBe(3);
	});

	it("cookie code is distinct from userProfile.region (EU profile region = 2, cookie = 3)", () => {
		// Guard against accidentally swapping the two numbering systems.
		expect(REGION_COOKIE_CODES.eu).not.toBe(2);
	});

	it("all regions have a numeric cookie code", () => {
		for (const code of Object.values(REGION_COOKIE_CODES)) {
			expect(typeof code).toBe("number");
		}
	});
});
