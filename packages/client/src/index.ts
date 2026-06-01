export const VERSION = "0.0.0";

export type { AccountProfile } from "./client.js";
export { CorosClient } from "./client.js";

export {
	CorosApiError,
	CorosAuthError,
	CorosError,
	CorosValidationError,
} from "./errors.js";

export type { TokenData, TokenStore } from "./token-store.js";
export { MemoryTokenStore } from "./token-store.js";
export type { Region } from "./types.js";
export { REGION_BASE_URLS, REGION_COOKIE_CODES } from "./types.js";
