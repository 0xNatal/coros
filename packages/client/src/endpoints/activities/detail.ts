import { z } from "zod";
import { request } from "../../http.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

// Exported for use by schemas/activity.ts consolidation.
// Unit conversions happen on parse (API values → user-friendly units).
export const activityDetailSummarySchema = z
	.object({
		/** Meters — API returns cm, divided by 100 on parse. */
		distance: z.number().optional(),
		/** Seconds — API returns centiseconds, divided by 100 on parse. */
		totalTime: z.number().optional(),
		/** Seconds — API returns centiseconds, divided by 100 on parse. */
		workoutTime: z.number().optional(),
		/** kcal — API returns raw value, divided by 1000 on parse. */
		calories: z.number().optional(),
		avgHr: z.number().int().optional(),
		maxHr: z.number().int().optional(),
		avgPower: z.number().optional(),
		maxPower: z.number().optional(),
		/** s/km (running pace). */
		avgSpeed: z.number().optional(),
		avgStepLen: z.number().optional(),
		/** Meters. */
		elevGain: z.number().optional(),
		/** Meters. */
		totalDescent: z.number().optional(),
		trainingLoad: z.number().optional(),
		currentVo2Max: z.number().optional(),
		aerobicEffect: z.number().optional(),
		aerobicEffectState: z.number().int().optional(),
		anaerobicEffect: z.number().optional(),
		anaerobicEffectState: z.number().int().optional(),
		staminaLevel7d: z.number().optional(),
		performance: z.number().optional(),
		/** 15-min units from UTC, e.g. 8 = UTC+2. */
		timezone: z.number().int().optional(),
		planId: z.string().optional(),
		programId: z.string().optional(),
		userId: z.string().optional(),
	})
	.transform((raw) => ({
		...raw,
		distance: raw.distance !== undefined ? raw.distance / 100 : undefined,
		totalTime: raw.totalTime !== undefined ? raw.totalTime / 100 : undefined,
		workoutTime:
			raw.workoutTime !== undefined ? raw.workoutTime / 100 : undefined,
		calories: raw.calories !== undefined ? raw.calories / 1000 : undefined,
	}));

export type ActivityDetailSummary = z.infer<typeof activityDetailSummarySchema>;

const lapItemSchema = z
	.object({
		exerciseNameKey: z.string().optional(),
	})
	.passthrough();

const lapGroupSchema = z
	.object({
		/** 2 = auto-laps (1 km), 11 = 5-km splits, -1 = full activity. */
		type: z.number().int(),
		lapItemList: z.array(lapItemSchema).optional(),
	})
	.passthrough();

const zoneItemSchema = z
	.object({
		/** bpm for HR metrics; ms/km for pace metrics. */
		leftScope: z.number().optional(),
		rightScope: z.number().optional(),
		percent: z.number().optional(),
		/** Time in zone, seconds. */
		second: z.number().optional(),
		zoneIndex: z.number().int().optional(),
	})
	.passthrough();

const zoneEntrySchema = z
	.object({
		/** Metric type code — see api-reference "Metrik-Typ-Codes" (126=HR, 130=speed, 173=adjustedPace). */
		type: z.number().int(),
		zoneItemList: z.array(zoneItemSchema).optional(),
	})
	.passthrough();

const weatherSchema = z
	.object({
		/** ×10, e.g. 192 = 19.2 °C. */
		temperature: z.number().int().optional(),
		/** ×10, e.g. 570 = 57 %. */
		humidity: z.number().int().optional(),
		bodyFeelTemp: z.number().optional(),
		windSpeed: z.number().optional(),
	})
	.passthrough();

// frequencyList/graphList/lapGraphList are parsed to avoid validation errors, then stripped
// because they are large time-series fields that are not useful in MCP context.
const activityDetailDataSchema = z
	.object({
		summary: activityDetailSummarySchema,
		lapList: z.array(lapGroupSchema).optional(),
		zoneList: z.array(zoneEntrySchema).optional(),
		weather: weatherSchema.optional(),
		deviceList: z.array(z.unknown()).optional(),
		usedDeviceList: z.array(z.unknown()).optional(),
		userInfo: z.unknown().optional(),
		sportFeelInfo: z.unknown().optional(),
		pauseList: z.array(z.unknown()).optional(),
		frequencyList: z.array(z.unknown()).optional(),
		graphList: z.array(z.unknown()).optional(),
		lapGraphList: z.array(z.unknown()).optional(),
	})
	.transform(
		({
			frequencyList: _frequencyList,
			graphList: _graphList,
			lapGraphList: _lapGraphList,
			...rest
		}) => rest,
	);

export type ActivityDetail = z.infer<typeof activityDetailDataSchema>;

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
	return request(url, activityDetailDataSchema, {
		method: "POST",
		// COROS quirk: params go in query string, body must be empty.
		query: { labelId, sportType },
		contentType: "application/x-www-form-urlencoded",
		token,
		region,
	});
}
