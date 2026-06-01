import { z } from "zod";
import { request } from "../../http.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

// Exported so detail.ts and the future schemas/activity.ts consolidation can reuse it.
export const activitySummarySchema = z
	.object({
		/** Activity ID — always a string in activity/query (live-verified).
		 *  Note: dashboard/query returns labelId as an integer — use labelIdStr there. */
		labelId: z.string(),
		name: z.string(),
		device: z.string().optional(),
		deviceId: z.string().optional(),
		imageUrl: z.string().optional(),
		/** Lang-Schema sportType (e.g. 100 = Running, 200 = Road Bike). */
		sportType: z.number().int(),
		mode: z.number().int().optional(),
		subMode: z.number().int().optional(),
		/** UTC Unix seconds (10-digit int). */
		startTime: z.number().int(),
		/** UTC Unix seconds. */
		endTime: z.number().int(),
		/** 15-min units from UTC, e.g. 8 = UTC+2. */
		startTimezone: z.number().int().optional(),
		endTimezone: z.number().int().optional(),
		/** Meters. */
		distance: z.number().optional(),
		/** Seconds. */
		totalTime: z.number().int().optional(),
		/** Seconds. */
		workoutTime: z.number().int().optional(),
		/** s/km (running pace). */
		avgSpeed: z.number().optional(),
		adjustedPace: z.number().optional(),
		avgHr: z.number().int().optional(),
		maxHr: z.number().int().optional(),
		avgPower: z.number().optional(),
		np: z.number().optional(),
		avgCadence: z.number().optional(),
		cadence: z.number().optional(),
		step: z.number().int().optional(),
		/** Raw calorie value — divide by 1000 for kcal. */
		calorie: z.number().int().optional(),
		trainingLoad: z.number().optional(),
		ascent: z.number().optional(),
		descent: z.number().optional(),
		totalDescent: z.number().optional(),
		unitType: z.number().int().optional(),
	})
	.passthrough();

export type ActivitySummary = z.infer<typeof activitySummarySchema>;

// When count == 0 the API omits pageNumber/totalPage/dataList entirely (live-verified).
const activityPageSchema = z.object({
	count: z.number().int(),
	pageNumber: z.number().int().optional(),
	totalPage: z.number().int().optional(),
	dataList: z.array(activitySummarySchema).optional(),
});

export interface ListActivitiesOptions {
	/** Only include activities with startTime >= from (Unix seconds, inclusive). */
	from?: number;
	/** Only include activities with startTime <= to (Unix seconds, inclusive). */
	to?: number;
	/** Items per API page (default: 20). */
	size?: number;
	/** Lang-Schema sportType IDs to filter. Omit or empty = all sports. */
	sportTypes?: number[];
}

/**
 * Fetch all activities from GET /activity/query, paginating through all pages
 * automatically.
 *
 * Assumes the API returns activities in reverse-chronological order. When `from`
 * is set, fetching stops as soon as a page contains an activity older than the
 * boundary — avoiding a full scan on large accounts.
 *
 * @param options - optional date range and sport-type filters
 * @param token   - valid token from the TokenStore
 * @param region  - must match the region used at login
 * @returns flat array of ActivitySummary, newest first
 */
export async function listActivities(
	options: ListActivitiesOptions,
	token: TokenData,
	region: Region,
): Promise<ActivitySummary[]> {
	const { from, to, size = 20, sportTypes = [] } = options;
	const baseUrl = `${REGION_BASE_URLS[region]}/activity/query`;
	const modeList = sportTypes.length > 0 ? sportTypes.join(",") : undefined;

	const results: ActivitySummary[] = [];
	let page = 1;
	let totalPages = 1;

	do {
		const query: Record<string, string | number | boolean> = {
			pageNumber: page,
			size,
		};
		if (modeList !== undefined) {
			query.modeList = modeList;
		}

		const pageData = await request(baseUrl, activityPageSchema, {
			query,
			token,
			region,
		});

		totalPages = pageData.totalPage ?? 1;

		let stoppedEarly = false;
		for (const activity of pageData.dataList ?? []) {
			if (to !== undefined && activity.startTime > to) {
				continue;
			}
			if (from !== undefined && activity.startTime < from) {
				// Assumes reverse-chronological order — remaining items on this and
				// subsequent pages are all older, so we can skip them entirely.
				stoppedEarly = true;
				break;
			}
			results.push(activity);
		}

		if (stoppedEarly) break;
		page++;
	} while (page <= totalPages);

	return results;
}
