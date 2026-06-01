import { request } from "../../http.js";
import type { TrainingSummary } from "../../schemas/training-summary.js";
import { trainingSummarySchema } from "../../schemas/training-summary.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

/**
 * Returns the aggregate training summary for the account.
 * Calls GET /analyse/query (no date-range params — server returns its own view).
 *
 * Includes per-sport statistics (sportStatistic[]), daily records (dayList[]),
 * 7-day rolling records (t7dayList[]), and distribution summaries (summaryInfo).
 * Use getDailyMetrics() for date-range daily records instead.
 */
export async function getTrainingSummary(
	token: TokenData,
	region: Region,
): Promise<TrainingSummary> {
	const url = `${REGION_BASE_URLS[region]}/analyse/query`;
	return request(url, trainingSummarySchema, { token, region });
}
