import { request } from "../../http.js";
import {
	type ActivityDetail,
	type ActivityDetailSummary,
	activityDetailSchema,
	activityDetailSummarySchema,
} from "../../schemas/activity.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

export type { ActivityDetail, ActivityDetailSummary };
export { activityDetailSummarySchema };

/**
 * Fetch full activity details from POST /activity/detail/query.
 *
 * Unit conversions applied on parse:
 *   - summary.distance: cm → m
 *   - summary.totalTime / workoutTime: centiseconds → s
 *   - summary.calories: raw value → kcal (÷ 1000)
 *
 * Large time-series fields (frequencyList, graphList, lapGraphList) are stripped
 * from the response — they are not needed in MCP context.
 *
 * @param labelId   - string activity ID from ActivitySummary.labelId
 * @param sportType - Lang-Schema sportType (e.g. 100 = Running)
 * @param token     - valid token from the TokenStore
 * @param region    - must match the region used at login
 */
export async function getActivityDetail(
	labelId: string,
	sportType: number,
	token: TokenData,
	region: Region,
): Promise<ActivityDetail> {
	const url = `${REGION_BASE_URLS[region]}/activity/detail/query`;
	return request(url, activityDetailSchema, {
		method: "POST",
		// COROS quirk: params go in query string, body must be empty.
		query: { labelId, sportType },
		contentType: "application/x-www-form-urlencoded",
		token,
		region,
	});
}
