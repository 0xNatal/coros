/** Regional API target. */
export type Region = "eu" | "us" | "asia";

/** Base URL per region. EU live-verified; US/Asia structurally confirmed. */
export const REGION_BASE_URLS: Record<Region, string> = {
	eu: "https://teameuapi.coros.com",
	us: "https://teamapi.coros.com",
	asia: "https://teamcnapi.coros.com",
};

/**
 * CPL-coros-region cookie value per region.
 * EU = 3 (live-verified). US/Asia: analogous pattern, unverified — check a
 * live HAR before relying on these values.
 * Not the same numbering as userProfile.region (EU there = 2).
 */
export const REGION_COOKIE_CODES: Record<Region, number> = {
	eu: 3,
	us: 1, // unverified — check CPL-coros-region in a live US HAR
	asia: 2, // unverified — check CPL-coros-region in a live Asia HAR
};
