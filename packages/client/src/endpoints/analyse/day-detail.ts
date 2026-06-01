import { z } from "zod";
import { request } from "../../http.js";
import type { DailyRecord } from "../../schemas/daily-record.js";
import { dailyRecordSchema } from "../../schemas/daily-record.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

const dayDetailResponseSchema = z
	.object({
		dayList: z.array(dailyRecordSchema).optional(),
		weekList: z.array(z.unknown()).optional(),
		trainingWeekStageList: z.array(z.unknown()).optional(),
	})
	.passthrough();

export interface GetDayDetailOptions {
	/** Start date, YYYYMMDD (e.g. "20260101"). */
	from: string;
	/** End date, YYYYMMDD (e.g. "20261231"). */
	to: string;
}

/**
 * Returns daily training metrics for a date range.
 * Calls GET /analyse/dayDetail/query.
 *
 * Fitness fields (vo2max, staminaLevel, lthr, ltsp, rhr) are sparse — present
 * only on days with a qualifying activity or sleep measurement, not every day.
 *
 * @param options.from  Start date, YYYYMMDD (e.g. "20260101")
 * @param options.to    End date, YYYYMMDD (e.g. "20261231")
 * @returns Array of daily records, ordered as returned by the API.
 */
export async function getDayDetail(
	options: GetDayDetailOptions,
	token: TokenData,
	region: Region,
): Promise<DailyRecord[]> {
	const { from, to } = options;
	const url = `${REGION_BASE_URLS[region]}/analyse/dayDetail/query`;
	const response = await request(url, dayDetailResponseSchema, {
		query: { startDay: from, endDay: to },
		token,
		region,
	});
	return response.dayList ?? [];
}
