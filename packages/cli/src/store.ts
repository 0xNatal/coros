import { ChainTokenStore } from "./token-store-chain.js";
import { EnvTokenStore } from "./token-store-env.js";
import { JsonFileTokenStore } from "./token-store-json-file.js";

/** Env vars take precedence over the persisted JSON file. */
export function createDefaultStore(): ChainTokenStore {
	return new ChainTokenStore([new EnvTokenStore(), new JsonFileTokenStore()]);
}
