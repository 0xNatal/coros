import type { Region } from "@coros/client";
import { CorosAuthError, CorosClient } from "@coros/client";
import { isRegion, writeConfig } from "../config.js";
import { prompt, promptSecret } from "../prompt.js";
import { createDefaultStore } from "../store.js";

export async function authCommand(opts: {
	region?: string;
	email?: string;
}): Promise<void> {
	const email = opts.email ?? (await prompt("Email: "));
	const password = await promptSecret("Password: ");

	let region: Region = "eu";
	if (opts.region) {
		if (!isRegion(opts.region)) {
			console.error(`Invalid region "${opts.region}". Valid: eu, us, asia`);
			process.exit(1);
		}
		region = opts.region;
	} else {
		const input = await prompt("Region [eu/us/asia, default eu]: ");
		if (input && isRegion(input)) {
			region = input;
		}
	}

	const store = createDefaultStore();
	const client = new CorosClient(store, region);
	try {
		await client.login(email, password);
	} catch (err) {
		if (err instanceof CorosAuthError) {
			console.error(`Authentication failed: ${err.message}`);
			process.exit(1);
		}
		throw err;
	}

	await writeConfig({ region });
	console.log(`Authenticated as ${email} (region: ${region}).`);
}
