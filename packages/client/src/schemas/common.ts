import { z } from "zod";

export const SUCCESS_RESULT = "0000";

// apiCode absent on error responses (live-verified 2026-06-01).
const baseEnvelopeSchema = z.object({
	apiCode: z.unknown().optional(),
	message: z.string(),
	result: z.string(),
});

/**
 * Builds a typed schema for a specific endpoint's success data.
 * Intended for unit tests and callers that parse known-good (result == "0000")
 * responses. The HTTP transport layer (http.ts) uses its own two-stage parse
 * and does NOT call this — do not use this for raw response parsing where
 * error envelopes (no data field) are possible.
 */
export function makeEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
	return baseEnvelopeSchema.extend({ data: dataSchema });
}
