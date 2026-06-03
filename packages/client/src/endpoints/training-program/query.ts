import { z } from "zod";
import { request } from "../../http.js";
import type { TokenData } from "../../token-store.js";
import { REGION_BASE_URLS, type Region } from "../../types.js";

const workoutTemplateSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		sportType: z.number(),
		access: z.number().optional(),
		totalSets: z.number().optional(),
		exerciseNum: z.number().optional(),
		/** Estimated duration, seconds. */
		estimatedTime: z.number().optional(),
		/** Estimated distance, cm. */
		estimatedDistance: z.number().optional(),
		estimatedType: z.number().optional(),
		/** Estimated training load. */
		estimatedValue: z.number().optional(),
	})
	.passthrough();

// data[] can be null when the account has no templates.
const templatesSchema = z
	.array(workoutTemplateSchema)
	.nullable()
	.transform((v) => v ?? []);

export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;

export interface ListWorkoutTemplatesOptions {
	/** Sport type filter (0 = all sports). */
	sportType?: number;
	/** Name substring filter. */
	name?: string;
	/** Items per page (default 20). */
	limitSize?: number;
}

/**
 * Returns all saved workout templates from POST /training/program/query,
 * fetching all pages automatically.
 *
 * estimatedTime: seconds. estimatedDistance: cm.
 * Sends yfheader as required by training/* endpoints.
 */
export async function listWorkoutTemplates(
	options: ListWorkoutTemplatesOptions,
	token: TokenData,
	region: Region,
): Promise<WorkoutTemplate[]> {
	const { sportType = 0, name = "", limitSize = 20 } = options;
	const url = `${REGION_BASE_URLS[region]}/training/program/query`;
	const results: WorkoutTemplate[] = [];
	let startNo = 0;

	for (;;) {
		const page = await request(url, templatesSchema, {
			method: "POST",
			body: { name, supportRestExercise: 1, startNo, limitSize, sportType },
			token,
			region,
			yfheader: true,
		});
		results.push(...page);
		if (page.length < limitSize) break;
		startNo += limitSize;
	}

	return results;
}
