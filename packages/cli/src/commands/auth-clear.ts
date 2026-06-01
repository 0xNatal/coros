import { logout } from "@coros/client";
import { clearConfig, readConfig } from "../config.js";
import { createDefaultStore } from "../store.js";

export async function authClearCommand(): Promise<void> {
	const store = createDefaultStore();
	const token = await store.get();
	const { region } = await readConfig();

	if (token) {
		try {
			await logout(token, region);
		} catch {
			// best-effort (endpoint is not live-verified); always clear local token regardless.
		}
	}

	await store.clear();
	await clearConfig();
	console.log("Logged out.");
}
