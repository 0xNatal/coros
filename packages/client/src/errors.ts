export class CorosError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "CorosError";
	}
}

/** Thrown when the API returns an authentication failure (e.g. result 1030). */
export class CorosAuthError extends CorosError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "CorosAuthError";
	}
}

/** Thrown when the API returns result != "0000". Carries the raw result code and message. */
export class CorosApiError extends CorosError {
	readonly result: string;

	constructor(result: string, message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "CorosApiError";
		this.result = result;
	}
}

/** Thrown when a zod schema rejects an API response. */
export class CorosValidationError extends CorosError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "CorosValidationError";
	}
}
