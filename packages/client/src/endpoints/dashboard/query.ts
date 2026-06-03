import { z } from "zod";
import { request } from "../../http.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

const sleepHrvDataSchema = z
	.object({
		/** RMSSD in ms. */
		lastSleepHrvBase: z.number().optional(),
		lastSleepHrvSd: z.number().optional(),
		sleepHrvIntervalBase: z.number().optional(),
		sleepHrvIntervalList: z.array(z.number()).optional(),
		sleepHrvIntervalPercentList: z.array(z.number()).optional(),
		remainWearDays: z.number().optional(),
		sleepHrvFirstDay: z.number().optional(),
		sleepHrvList: z
			.array(
				z
					.object({
						happenDay: z.number(),
						sleepHrvIntervalList: z.array(z.number()).optional(),
					})
					.passthrough(),
			)
			.optional(),
	})
	.passthrough();

const summaryInfoSchema = z
	.object({
		// Fitness scores, 0-100
		aerobicEnduranceScore: z.number().optional(),
		anaerobicCapacityScore: z.number().optional(),
		anaerobicEnduranceScore: z.number().optional(),
		lactateThresholdCapacityScore: z.number().optional(),
		staminaLevel: z.number().optional(),
		staminaLevelChange: z.number().optional(),
		staminaLevelRanking: z.number().optional(),
		// Recovery
		/** Recovery percentage, 0-100. */
		recoveryPct: z.number().optional(),
		/** Recovery state: 1=low, 2=moderate, 3=good, 4=excellent. */
		recoveryState: z.number().optional(),
		/** Hours until full recovery. */
		fullRecoveryHours: z.number().optional(),
		// Thresholds
		/** Lactate threshold heart rate, bpm. */
		lthr: z.number().optional(),
		/** Lactate threshold speed, s/km. */
		ltsp: z.number().optional(),
		/** Resting heart rate, bpm. */
		rhr: z.number().optional(),
		sleepHrvData: sleepHrvDataSchema.optional(),
	})
	.passthrough();

const dashboardResponseSchema = z
	.object({ summaryInfo: summaryInfoSchema.optional() })
	.passthrough();

export type DashboardSnapshot = z.infer<typeof dashboardResponseSchema>;

/**
 * Returns today's fitness and recovery snapshot from GET /dashboard/query.
 *
 * summaryInfo.recoveryPct: 0-100 %.
 * summaryInfo.recoveryState: 1=low | 2=moderate | 3=good | 4=excellent.
 * summaryInfo.sleepHrvData.lastSleepHrvBase: RMSSD in ms.
 * summaryInfo.lthr: bpm. summaryInfo.ltsp: s/km. summaryInfo.rhr: bpm.
 */
export async function getDashboard(
	token: TokenData,
	region: Region,
): Promise<DashboardSnapshot> {
	const url = `${REGION_BASE_URLS[region]}/dashboard/query`;
	return request(url, dashboardResponseSchema, { token, region });
}
