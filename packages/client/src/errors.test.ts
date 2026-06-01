import { describe, expect, it } from "vitest";
import {
	CorosApiError,
	CorosAuthError,
	CorosError,
	CorosValidationError,
} from "./errors.js";

describe("CorosError", () => {
	it("is an instance of Error", () => {
		const err = new CorosError("base");
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("CorosError");
		expect(err.message).toBe("base");
	});
});

describe("CorosAuthError", () => {
	it("is a CorosError with the correct name", () => {
		const err = new CorosAuthError("bad credentials");
		expect(err).toBeInstanceOf(CorosError);
		expect(err.name).toBe("CorosAuthError");
	});

	it("chains cause", () => {
		const cause = new Error("root");
		const err = new CorosAuthError("auth failed", { cause });
		expect(err.cause).toBe(cause);
	});
});

describe("CorosApiError", () => {
	it("exposes the result code", () => {
		const err = new CorosApiError("1030", "invalid password");
		expect(err).toBeInstanceOf(CorosError);
		expect(err.name).toBe("CorosApiError");
		expect(err.result).toBe("1030");
		expect(err.message).toBe("invalid password");
	});
});

describe("CorosValidationError", () => {
	it("is a CorosError with the correct name", () => {
		const err = new CorosValidationError("unexpected shape");
		expect(err).toBeInstanceOf(CorosError);
		expect(err.name).toBe("CorosValidationError");
	});
});
