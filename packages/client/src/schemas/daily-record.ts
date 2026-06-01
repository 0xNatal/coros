import { z } from "zod";

/**
 * A single day entry from GET /analyse/dayDetail/query.
 *
 * Fitness fields (vo2max, staminaLevel, lthr, ltsp, rhr) are sparse —
 * present only on days with a qualifying activity or sleep measurement.
 *
 * All distance values are meters; duration values are seconds.
 * Live-verified 2026-06-01: 15-day range, EU account.
 */
export const dailyRecordSchema = z
	.object({
		/** YYYYMMDD integer (e.g. 20260531). */
		happenDay: z.number().int(),
		/** UTC Unix timestamp (seconds). */
		timestamp: z.number().int(),
		/** Total activity distance for the day (meters). */
		distance: z.number().optional(),
		distanceTarget: z.number().optional(),
		/** Total activity duration for the day (seconds). */
		duration: z.number().optional(),
		durationTarget: z.number().optional(),
		trainingLoad: z.number().optional(),
		trainingLoadTarget: z.number().optional(),
		trainingLoadRatio: z.number().optional(),
		trainingLoadRatioState: z.number().int().optional(),
		trainingLoadRatioZoneList: z.array(z.unknown()).optional(),
		ati: z.number().optional(),
		cti: z.number().optional(),
		ct7dMaxFixed: z.number().optional(),
		ct7dMin: z.number().optional(),
		tib: z.number().optional(),
		t7d: z.number().optional(),
		t28d: z.number().optional(),
		performance: z.number().optional(),
		recomendTlMax: z.number().optional(),
		recomendTlMin: z.number().optional(),
		tiredRate: z.number().optional(),
		tiredRateNew: z.number().optional(),
		tiredRateNewZoneList: z.array(z.unknown()).optional(),
		tiredRateStateNew: z.number().int().optional(),
		/** HRV interval percentages relative to personal baseline (RMSSD ms). */
		sleepHrvIntervalList: z.array(z.number()).optional(),
		/** VO2max estimate (mL/kg/min). Sparse — only after qualifying run. */
		vo2max: z.number().optional(),
		/** Stamina level score (0–100 float). Sparse. */
		staminaLevel: z.number().optional(),
		/** 7-day rolling stamina level. Sparse. */
		staminaLevel7d: z.number().optional(),
		/** Lactate threshold heart rate (bpm). Sparse. */
		lthr: z.number().int().optional(),
		/** Lactate threshold speed (s/km). Sparse. */
		ltsp: z.number().optional(),
		/** Resting heart rate (bpm). Sparse — requires sleep measurement. */
		rhr: z.number().int().optional(),
	})
	.passthrough();

export type DailyRecord = z.infer<typeof dailyRecordSchema>;
