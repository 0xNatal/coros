export const VERSION = "0.0.0";

export { logout } from "./auth/logout.js";

export type { AccountProfile } from "./client.js";
export { CorosClient } from "./client.js";
export { getActivityDetail } from "./endpoints/activities/detail.js";
export type { ListActivitiesOptions } from "./endpoints/activities/list.js";
export { listActivities } from "./endpoints/activities/list.js";
export type { GetDailyMetricsOptions } from "./endpoints/analyse/daily-metrics.js";
export { getDailyMetrics } from "./endpoints/analyse/daily-metrics.js";
export type { GetDayDetailOptions } from "./endpoints/analyse/day-detail.js";
export { getDayDetail } from "./endpoints/analyse/day-detail.js";
export { getTrainingSummary } from "./endpoints/analyse/summary.js";
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
export type { DailyRecord } from "./schemas/daily-record.js";
export { dailyRecordSchema } from "./schemas/daily-record.js";
export type { TrainingSchedule } from "./schemas/training-schedule.js";
export { trainingScheduleSchema } from "./schemas/training-schedule.js";
export type {
	SportStatistic,
	TrainingSummary,
} from "./schemas/training-summary.js";
export { trainingSummarySchema } from "./schemas/training-summary.js";
export type { TokenData, TokenStore } from "./token-store.js";
export { MemoryTokenStore } from "./token-store.js";
export type { Region } from "./types.js";
export { REGION_BASE_URLS, REGION_COOKIE_CODES } from "./types.js";
