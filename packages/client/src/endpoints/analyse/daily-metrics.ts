import type { DailyRecord } from "../../schemas/daily-record.js";
import type { TokenData } from "../../token-store.js";
import type { Region } from "../../types.js";
import { getDayDetail } from "./day-detail.js";

export interface GetDailyMetricsOptions {
	/** Start date, YYYYMMDD (e.g. "20260101"). */
	from: string;
	/** End date, YYYYMMDD (e.g. "20261231"). */
	to: string;
}

/**
 * Returns daily training metrics for a date range.
 *
 * Each entry covers one calendar day. Fitness fields (vo2max, staminaLevel,
 * lthr, ltsp, rhr) are sparse — present only on days with a qualifying
 * activity or sleep measurement, not every day.
 *
 * @param options.from  Start date, YYYYMMDD (e.g. "20260101")
 * @param options.to    End date, YYYYMMDD (e.g. "20261231")
 * @returns Array of daily records ordered as returned by the API.
 */
export async function getDailyMetrics(
	options: GetDailyMetricsOptions,
	token: TokenData,
	region: Region,
): Promise<DailyRecord[]> {
	return getDayDetail(options, token, region);
}
