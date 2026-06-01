export const VERSION = "0.0.0";

export type { AccountProfile } from "./client.js";
export { CorosClient } from "./client.js";
export { getActivityDetail } from "./endpoints/activities/detail.js";
export type { ListActivitiesOptions } from "./endpoints/activities/list.js";
export { listActivities } from "./endpoints/activities/list.js";
export type { GetTrainingScheduleOptions } from "./endpoints/training-schedule/query.js";
export { getTrainingSchedule } from "./endpoints/training-schedule/query.js";
export {
	CorosApiError,
	CorosAuthError,
	CorosError,
	CorosValidationError,
} from "./errors.js";
export type {
	ActivityDetail,
	ActivityDetailSummary,
	ActivitySummary,
} from "./schemas/activity.js";
export {
	activityDetailSummarySchema,
	activitySummarySchema,
} from "./schemas/activity.js";
export type { TrainingSchedule } from "./schemas/training-schedule.js";
export { trainingScheduleSchema } from "./schemas/training-schedule.js";
export type { TokenData, TokenStore } from "./token-store.js";
export { MemoryTokenStore } from "./token-store.js";
export type { Region } from "./types.js";
export { REGION_BASE_URLS, REGION_COOKIE_CODES } from "./types.js";
