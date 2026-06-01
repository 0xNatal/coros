/**
 * Shared test helpers — imported only by *.test.ts files, never by src.
 */

/** Wraps data in a COROS response envelope for mock responses. Defaults to success result "0000". */
export function envelope(data: unknown, result = "0000") {
	return { apiCode: 200, message: "ok", result, data };
}

/** Formats a Date as YYYYMMDD string for API date params (e.g. 20260601). */
export function toYYYYMMDD(d: Date): string {
	return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
