import { existsSync } from "node:fs";

// Load .env into process.env so integration tests can read credentials.
// process.loadEnvFile is available in Node >= 20.12.
if (existsSync(".env")) {
	process.loadEnvFile(".env");
}
