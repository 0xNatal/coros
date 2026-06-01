import { z } from "zod";
import { request } from "../../http.js";
import {
	type ActivitySummary,
	activitySummarySchema,
} from "../../schemas/activity.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

export type { ActivitySummary };

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
