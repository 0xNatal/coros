import { z } from "zod";

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
