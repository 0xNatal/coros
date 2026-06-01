import { z } from "zod";
import { dailyRecordSchema } from "./daily-record.js";

const sportStatisticSchema = z
	.object({
		sportType: z.number().int().optional(),
		count: z.number().int().optional(),
		/** meters */
		distance: z.number().optional(),
		/** seconds */
		duration: z.number().optional(),
		/** bpm */
		avgHr: z.number().int().optional(),
		/** s/km */
		avgPace: z.number().optional(),
		trainingLoad: z.number().optional(),
	})
	.passthrough();

export type SportStatistic = z.infer<typeof sportStatisticSchema>;

/**
 * Aggregate training summary from GET /analyse/query.
 *
 * dayList/t7dayList share the same shape as DailyRecord.
 * summaryInfo, record, and tlIntensity are complex nested objects whose
 * full shape is not fully documented — use z.unknown() and cast at call site.
 */
export const trainingSummarySchema = z
	.object({
		dayList: z.array(dailyRecordSchema).optional(),
		t7dayList: z.array(dailyRecordSchema).optional(),
		sportStatistic: z.array(sportStatisticSchema).optional(),
		/** Distribution summaries: hrTimeAreaList, tlAreaList, disAreaList, ati, cti, … */
		summaryInfo: z.unknown().optional(),
		/** Weekly distance/duration/TL records. */
		record: z.unknown().optional(),
		/** Training load intensity breakdown. */
		tlIntensity: z.unknown().optional(),
		weekList: z.array(z.unknown()).optional(),
		trainingWeekStageList: z.array(z.unknown()).optional(),
		sportDataSummary: z.unknown().optional(),
	})
	.passthrough();

export type TrainingSummary = z.infer<typeof trainingSummarySchema>;
