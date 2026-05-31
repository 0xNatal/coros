#!/usr/bin/env node
import { VERSION } from "@coros/client";
import { Command } from "commander";

const program = new Command();

program
	.name("coros")
	.description("Coros CLI — auth, sync, debug")
	.version(VERSION);

program.parse();
