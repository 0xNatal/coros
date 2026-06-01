import {
	CorosAuthError,
	getActivityDetail,
	getDailyMetrics,
	getTrainingSchedule,
	getTrainingSummary,
	listActivities,
} from "@coros/client";
import type { Command } from "commander";
import { readConfig } from "../config.js";
import { createDefaultStore } from "../store.js";

function toYYYYMMDD(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}${m}${day}`;
}

function today(): string {
	return toYYYYMMDD(new Date());
}

// n > 0 = past, n < 0 = future
function daysOffset(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return toYYYYMMDD(d);
}

function yyyymmddToUnixSeconds(s: string): number {
	const y = Number(s.slice(0, 4));
	const m = Number(s.slice(4, 6)) - 1;
	const day = Number(s.slice(6, 8));
	// Local midnight — consistent with toYYYYMMDD which uses local date fields.
	return Math.floor(new Date(y, m, day).getTime() / 1000);
}

async function requireAuth() {
	const store = createDefaultStore();
	const token = await store.get();
	if (!token) {
		console.error("Not authenticated. Run: coros auth");
		process.exit(1);
	}
	const { region } = await readConfig();
	return { token, region };
}

function print(data: unknown): void {
	console.log(JSON.stringify(data, null, 2));
}

function handleError(err: unknown): never {
	if (err instanceof CorosAuthError) {
		console.error(`Auth error: ${err.message}. Run: coros auth`);
		process.exit(1);
	}
	throw err;
}

export function registerDebugCommand(parent: Command): void {
	const debug = parent
		.command("debug")
		.description("Call individual API endpoints and print raw results");

	debug
		.command("daily-metrics")
		.description("Daily records: HRV, RHR, VO2max, training load")
		.option("--weeks <n>", "Number of weeks to look back", "2")
		.option("--from <date>", "Start date YYYYMMDD (overrides --weeks)")
		.option("--to <date>", "End date YYYYMMDD (overrides --weeks)")
		.action(async (opts: { weeks: string; from?: string; to?: string }) => {
			const { token, region } = await requireAuth();
			const weeks = Math.max(1, Number(opts.weeks) || 2);
			const from = opts.from ?? daysOffset(weeks * 7);
			const to = opts.to ?? today();
			try {
				print(await getDailyMetrics({ from, to }, token, region));
			} catch (err) {
				handleError(err);
			}
		});

	debug
		.command("activities")
		.description("List activities for a date range")
		.option("--weeks <n>", "Number of weeks to look back", "4")
		.option("--from <date>", "Start date YYYYMMDD (overrides --weeks)")
		.option("--to <date>", "End date YYYYMMDD (overrides --weeks)")
		.action(async (opts: { weeks: string; from?: string; to?: string }) => {
			const { token, region } = await requireAuth();
			const weeks = Math.max(1, Number(opts.weeks) || 4);
			const fromDate = opts.from ?? daysOffset(weeks * 7);
			const toDate = opts.to ?? today();
			try {
				print(
					await listActivities(
						{
							from: yyyymmddToUnixSeconds(fromDate),
							to: yyyymmddToUnixSeconds(toDate),
						},
						token,
						region,
					),
				);
			} catch (err) {
				handleError(err);
			}
		});

	debug
		.command("activity-detail")
		.description("Full detail for a single activity")
		.requiredOption("--label-id <id>", "Activity labelIdStr")
		.requiredOption("--sport-type <type>", "Sport type (integer)")
		.action(async (opts: { labelId: string; sportType: string }) => {
			const { token, region } = await requireAuth();
			const sportType = Number(opts.sportType);
			if (!Number.isInteger(sportType)) {
				console.error("--sport-type must be an integer");
				process.exit(1);
			}
			try {
				print(await getActivityDetail(opts.labelId, sportType, token, region));
			} catch (err) {
				handleError(err);
			}
		});

	debug
		.command("training-schedule")
		.description("Planned workouts for a date range")
		.option("--weeks <n>", "Number of weeks ahead from today", "2")
		.option("--from <date>", "Start date YYYYMMDD (overrides --weeks)")
		.option("--to <date>", "End date YYYYMMDD (overrides --weeks)")
		.action(async (opts: { weeks: string; from?: string; to?: string }) => {
			const { token, region } = await requireAuth();
			const weeks = Math.max(1, Number(opts.weeks) || 2);
			const from = opts.from ?? today();
			const to = opts.to ?? daysOffset(-weeks * 7); // negative offset = future
			try {
				print(await getTrainingSchedule({ from, to }, token, region));
			} catch (err) {
				handleError(err);
			}
		});

	debug
		.command("training-summary")
		.description("Aggregate training statistics for the account")
		.action(async () => {
			const { token, region } = await requireAuth();
			try {
				print(await getTrainingSummary(token, region));
			} catch (err) {
				handleError(err);
			}
		});
}
