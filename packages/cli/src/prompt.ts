import { createInterface } from "node:readline";
import type { ReadStream } from "node:tty";

const ENTER_CR = "\r";
const ENTER_LF = "\n";
const CTRL_D = "\x04"; // EOF
const CTRL_C = "\x03";
const DEL = "\x7f"; // backspace on most terminals
const BS = "\x08"; // backspace on some terminals

/** Prompts for visible input (email, region, etc.). */
export async function prompt(question: string): Promise<string> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

/** Prompts for a secret — no echo on TTY, plain readline fallback otherwise. */
export async function promptSecret(question: string): Promise<string> {
	if (!process.stdin.isTTY) {
		return prompt(question);
	}
	// Safe: isTTY guarantees process.stdin is a tty.ReadStream at runtime.
	const ttyIn = process.stdin as unknown as ReadStream;
	return new Promise((resolve) => {
		process.stdout.write(question);
		ttyIn.setRawMode(true);
		ttyIn.resume();
		let value = "";
		const handler = (buf: Buffer) => {
			const char = buf.toString("utf8");
			if (char === ENTER_CR || char === ENTER_LF || char === CTRL_D) {
				ttyIn.setRawMode(false);
				ttyIn.pause();
				ttyIn.removeListener("data", handler);
				process.stdout.write("\n");
				resolve(value);
			} else if (char === CTRL_C) {
				process.exit(1);
			} else if (char === DEL || char === BS) {
				value = value.slice(0, -1);
			} else {
				value += char;
			}
		};
		ttyIn.on("data", handler);
	});
}
