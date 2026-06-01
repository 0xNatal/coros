import { readConfig } from "../config.js";
import { createDefaultStore } from "../store.js";

export async function authStatusCommand(): Promise<void> {
	const store = createDefaultStore();
	const token = await store.get();

	if (!token) {
		console.log("Not authenticated. Run: coros auth");
		return;
	}

	const { region } = await readConfig();
	console.log(`Authenticated`);
	console.log(`  region: ${region}`);
	console.log(`  userId: ${token.userId}`);
}
