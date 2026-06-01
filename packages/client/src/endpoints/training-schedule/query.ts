import { request } from "../../http.js";
import {
	type TrainingSchedule,
	trainingScheduleSchema,
} from "../../schemas/training-schedule.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

export type { TrainingSchedule };

export interface GetTrainingScheduleOptions {
	/**
	 * Start of the range, YYYYMMDD format (e.g. "20260601").
	 * Note: uses YYYYMMDD strings, not Unix timestamps — the COROS schedule API
	 * requires this format directly. Compare with listActivities which uses Unix seconds.
	 */
	from: string;
	/** End of the range, YYYYMMDD format (e.g. "20260630"). */
	to: string;
	/**
	 * Include rest/recovery exercises in programs.
	 * Default: 1 (include). Pass 0 to exclude.
	 */
	supportRestExercise?: 0 | 1;
}

/**
 * Fetch the training calendar for a date range from GET /training/schedule/query.
 *
 * All training/* endpoints require yfheader — it is sent automatically.
 *
 * @param options - date range (YYYYMMDD strings) and optional filter
 * @param token   - valid token from the TokenStore
 * @param region  - must match the region used at login
 */
export async function getTrainingSchedule(
	options: GetTrainingScheduleOptions,
	token: TokenData,
	region: Region,
): Promise<TrainingSchedule> {
	const { from, to, supportRestExercise = 1 } = options;
	const url = `${REGION_BASE_URLS[region]}/training/schedule/query`;
	return request(url, trainingScheduleSchema, {
		query: {
			startDate: from,
			endDate: to,
			supportRestExercise,
		},
		token,
		region,
		yfheader: true,
	});
}
