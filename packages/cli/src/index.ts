#!/usr/bin/env node
import { VERSION } from "@coros/client";
import { Command } from "commander";
import { authCommand } from "./commands/auth.js";
import { authClearCommand } from "./commands/auth-clear.js";
import { authStatusCommand } from "./commands/auth-status.js";
import { registerDebugCommand } from "./commands/debug.js";

// Commands and the API endpoints they call:
//
//   coros auth [--email EMAIL] [--region eu|us|asia]          POST /account/login
//   coros auth-status                                         (local, no API call)
//   coros auth-clear                                          GET  /account/logout (best-effort)
//
//   coros debug daily-metrics   [--weeks N|--from YYYYMMDD --to YYYYMMDD]
//     GET /analyse/dayDetail/query
//   coros debug activities      [--weeks N|--from YYYYMMDD --to YYYYMMDD]
//     GET /activity/query
//   coros debug activity-detail --label-id ID --sport-type N
//     POST /activity/detail/query
//   coros debug training-schedule [--weeks N|--from YYYYMMDD --to YYYYMMDD]
//     GET /training/schedule/query
//   coros debug training-summary
//     GET /analyse/query

const program = new Command();

program.name("coros").description("Coros CLI — auth, debug").version(VERSION);

program
	.command("auth")
	.description("Log in and save credentials")
	.option("--email <email>", "Email address")
	.option("--region <region>", "API region: eu | us | asia")
	.action((opts: { email?: string; region?: string }) => authCommand(opts));

program
	.command("auth-status")
	.description("Show current authentication status")
	.action(() => authStatusCommand());

program
	.command("auth-clear")
	.description("Log out and remove stored credentials")
	.action(() => authClearCommand());

registerDebugCommand(program);

program.parse();
