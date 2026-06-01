import { describe, expect, it } from "vitest";
import { z } from "zod";
import { makeEnvelopeSchema, SUCCESS_RESULT } from "./common.js";

const stringDataSchema = makeEnvelopeSchema(z.string());

describe("makeEnvelopeSchema", () => {
	it("parses a valid success envelope", () => {
		const raw = { apiCode: 200, message: "ok", result: "0000", data: "hello" };
		const parsed = stringDataSchema.parse(raw);
		expect(parsed.result).toBe("0000");
		expect(parsed.data).toBe("hello");
		expect(parsed.message).toBe("ok");
	});

	it("validates the data field with the provided schema", () => {
		const raw = { apiCode: 0, message: "", result: "0000", data: 42 };
		expect(() => stringDataSchema.parse(raw)).toThrow();
	});

	it("accepts any result code (error detection is caller responsibility)", () => {
		const raw = { apiCode: 0, message: "not found", result: "1001", data: "" };
		const parsed = stringDataSchema.parse(raw);
		expect(parsed.result).toBe("1001");
	});
});

describe("SUCCESS_RESULT", () => {
	it('is "0000"', () => {
		expect(SUCCESS_RESULT).toBe("0000");
	});
});
