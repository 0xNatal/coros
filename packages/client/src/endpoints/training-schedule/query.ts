import { z } from "zod";
import { request } from "../../http.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

// Exported for use by schemas/training-schedule.ts consolidation.
export const trainingScheduleSchema = z
	.object({
		id: z.string().optional(),
		/** String despite being numeric (live-verified). Parse to int before use.
		 *  Read before scheduling: use parseInt(maxIdInPlan) + 1 as idInPlan. */
		maxIdInPlan: z.string().optional(),
		maxPlanProgramId: z.string().optional(),
		programs: z.array(z.unknown()).optional(),
		weekStages: z.array(z.unknown()).optional(),
		sportDatasInPlan: z.array(z.unknown()).optional(),
		sportDatasNotInPlan: z.array(z.unknown()).optional(),
		executeStatus: z.unknown().optional(),
		/** YYYYMMDD as integer (live-verified), e.g. 20260601. */
		startDay: z.number().int().optional(),
		/** YYYYMMDD as integer. */
		endDay: z.number().int().optional(),
		totalDay: z.number().int().optional(),
		pbVersion: z.number().int().optional(),
		/** Only present when the account has an active plan with executed activities. */
		entities: z.array(z.unknown()).optional(),
		score: z.unknown().optional(),
	})
	.passthrough();

export type TrainingSchedule = z.infer<typeof trainingScheduleSchema>;

export interface GetTrainingScheduleOptions {
	/** Start of the range, YYYYMMDD format (e.g. "20260601"). */
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
