import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Region } from "@coros/client";

const VALID_REGIONS = ["eu", "us", "asia"] as const;

export function isRegion(v: unknown): v is Region {
	return (VALID_REGIONS as readonly string[]).includes(
		typeof v === "string" ? v : "",
	);
}

function configPath(): string {
	const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
	return join(base, "coros", "config.json");
}

export interface CliConfig {
	region: Region;
}

export async function readConfig(): Promise<CliConfig> {
	try {
		const raw = await readFile(configPath(), "utf8");
		const parsed: unknown = JSON.parse(raw);
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			isRegion((parsed as Record<string, unknown>).region)
		) {
			// Cast safe: isRegion narrows the region field.
			return { region: (parsed as Record<string, unknown>).region as Region };
		}
	} catch {
		// File missing or invalid — fall through to default.
	}
	return { region: "eu" };
}

export async function writeConfig(config: CliConfig): Promise<void> {
	const path = configPath();
	await mkdir(join(path, ".."), { recursive: true });
	await writeFile(path, JSON.stringify(config, null, 2), {
		mode: 0o600,
		encoding: "utf8",
	});
}

export async function clearConfig(): Promise<void> {
	try {
		await unlink(configPath());
	} catch {
		// File not present is fine.
	}
}
