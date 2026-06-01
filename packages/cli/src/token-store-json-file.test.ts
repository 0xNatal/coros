import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TokenData } from "@coros/client";
import { describe, expect, it } from "vitest";
import { JsonFileTokenStore } from "./token-store-json-file.js";

function tmpPath(): string {
	return join(tmpdir(), `coros-test-${randomBytes(8).toString("hex")}.json`);
}

const TOKEN: TokenData = {
	accessToken: "test-access-token",
	userId: "user-42",
	expiresAt: Date.now() + 86_400_000,
};

describe("JsonFileTokenStore", () => {
	it("returns null when file does not exist", async () => {
		const store = new JsonFileTokenStore(tmpPath());
		expect(await store.get()).toBeNull();
	});

	it("round-trips a token through write/read", async () => {
		const store = new JsonFileTokenStore(tmpPath());
		await store.set(TOKEN);
		expect(await store.get()).toEqual(TOKEN);
	});

	it("isValid returns true for a future expiresAt", async () => {
		const store = new JsonFileTokenStore(tmpPath());
		await store.set(TOKEN);
		expect(await store.isValid()).toBe(true);
	});

	it("isValid returns false for a past expiresAt", async () => {
		const store = new JsonFileTokenStore(tmpPath());
		await store.set({ ...TOKEN, expiresAt: Date.now() - 1 });
		expect(await store.isValid()).toBe(false);
	});

	it("clear() removes the file so get() returns null", async () => {
		const store = new JsonFileTokenStore(tmpPath());
		await store.set(TOKEN);
		await store.clear();
		expect(await store.get()).toBeNull();
	});

	it("clear() is a no-op when file is absent", async () => {
		const store = new JsonFileTokenStore(tmpPath());
		await expect(store.clear()).resolves.toBeUndefined();
	});

	it("get() returns null for invalid JSON", async () => {
		const path = tmpPath();
		await writeFile(path, "not-json", "utf8");
		const store = new JsonFileTokenStore(path);
		expect(await store.get()).toBeNull();
	});

	it("get() returns null for JSON missing required fields", async () => {
		const path = tmpPath();
		await writeFile(path, JSON.stringify({ accessToken: "tok" }), "utf8");
		const store = new JsonFileTokenStore(path);
		expect(await store.get()).toBeNull();
	});
});
