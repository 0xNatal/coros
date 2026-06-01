import { z } from "zod";

export const SUCCESS_RESULT = "0000";

// apiCode absent on error responses (live-verified 2026-06-01).
const baseEnvelopeSchema = z.object({
	apiCode: z.unknown().optional(),
	message: z.string(),
	result: z.string(),
});

/**
 * Wraps a per-endpoint data schema in the standard COROS response envelope.
 * result == "0000" signals success; anything else is an error (message has details).
 */
export function makeEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
	return baseEnvelopeSchema.extend({ data: dataSchema });
}

export type Envelope<T> = {
	apiCode: unknown;
	message: string;
	result: string;
	data: T;
};
