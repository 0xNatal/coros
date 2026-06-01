import { ZodError, z } from "zod";
import { CorosApiError, CorosError, CorosValidationError } from "./errors.js";
import { SUCCESS_RESULT } from "./schemas/common.js";
import type { TokenData } from "./token-store.js";
import { REGION_COOKIE_CODES, type Region } from "./types.js";

// Error responses omit apiCode and data, adding tlogId instead (live-verified 2026-06-01).
// Both fields are therefore optional; data is only present on result == "0000".
const envelopeBaseSchema = z.object({
	apiCode: z.unknown().optional(),
	message: z.string(),
	result: z.string(),
	data: z.unknown().optional(),
});

const DEFAULT_TIMEOUT_MS = 30_000;

export interface HttpOptions {
	method?: "GET" | "POST";
	/** JSON-serialisable body for POST. Omit for GET or for empty-body POSTs. */
	body?: unknown;
	/** URL query parameters appended to the URL. */
	query?: Record<string, string | number | boolean>;
	token?: TokenData;
	region?: Region;
	/** Send yfheader (required by training/* endpoints). */
	yfheader?: boolean;
	/** Override Content-Type. Default: application/json. */
	contentType?: string;
	timeoutMs?: number;
}

/**
 * Internal HTTP helper. Takes a full URL, a zod schema for the data field, and
 * options. Injects auth headers, validates the response envelope, and returns
 * the typed data. Never returns on API error — always throws a typed CorosError.
 */
export async function request<T extends z.ZodTypeAny>(
	url: string,
	schema: T,
	options: HttpOptions = {},
): Promise<z.infer<T>> {
	const {
		method = "GET",
		body,
		query,
		token,
		region,
		yfheader = false,
		contentType = "application/json",
		timeoutMs = DEFAULT_TIMEOUT_MS,
	} = options;

	const fullUrl = new URL(url);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			fullUrl.searchParams.set(key, String(value));
		}
	}

	const headers: Record<string, string> = {
		"Content-Type": contentType,
	};

	if (token) {
		const regionCode =
			region !== undefined
				? REGION_COOKIE_CODES[region]
				: REGION_COOKIE_CODES.eu;
		headers.accessToken = token.accessToken;
		headers.Cookie = `CPL-coros-token=${token.accessToken}; CPL-coros-region=${regionCode}`;
	}

	if (yfheader && token) {
		headers.yfheader = JSON.stringify({ userId: token.userId });
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	let response: Response;
	try {
		response = await fetch(fullUrl.toString(), {
			method,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined,
			signal: controller.signal,
		});
	} catch (err) {
		throw new CorosError("Network request failed", { cause: err });
	} finally {
		clearTimeout(timer);
	}

	let raw: unknown;
	try {
		raw = await response.json();
	} catch (err) {
		throw new CorosValidationError("Response is not valid JSON", {
			cause: err,
		});
	}

	let envelope: z.infer<typeof envelopeBaseSchema>;
	try {
		envelope = envelopeBaseSchema.parse(raw);
	} catch (err) {
		if (err instanceof ZodError) {
			throw new CorosValidationError(
				`Response envelope validation failed: ${err.message}`,
				{ cause: err },
			);
		}
		throw err;
	}

	if (envelope.result !== SUCCESS_RESULT) {
		throw new CorosApiError(envelope.result, envelope.message);
	}

	try {
		return schema.parse(envelope.data) as z.infer<T>;
	} catch (err) {
		if (err instanceof ZodError) {
			throw new CorosValidationError(
				`Response data validation failed: ${err.message}`,
				{ cause: err },
			);
		}
		throw err;
	}
}
