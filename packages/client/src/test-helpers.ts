/**
 * Shared test helpers — imported only by *.test.ts files, never by src.
 */

/** Wraps data in a COROS response envelope for mock responses. Defaults to success result "0000". */
export function envelope(data: unknown, result = "0000") {
	return { apiCode: 200, message: "ok", result, data };
}
