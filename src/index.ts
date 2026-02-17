#!/usr/bin/env node
/**
 * Understory CLI - Optimized for AI agent use.
 * Structured JSON output, explicit subcommands, comprehensive help.
 */

import "dotenv/config";
import { Command } from "commander";
import { UnderstoryApiError } from "./client.js";
import {
  writeError,
  type OutputOptions,
  type OutputFormat,
} from "./output.js";
import { registerMeCommand } from "./commands/me.js";
import { registerExperiencesCommand } from "./commands/experiences.js";
import { registerEventsCommand } from "./commands/events.js";
import { registerAvailabilityCommand } from "./commands/availability.js";
import { registerBookingsCommand } from "./commands/bookings.js";
import { registerOrdersCommand } from "./commands/orders.js";
import { registerMarketingCommand } from "./commands/marketing.js";

const program = new Command();

function getOutputOptions(): OutputOptions {
  const opts = program.opts() as { format?: string; color?: boolean };
  const format = (opts?.format ?? "json") as OutputFormat;
  return {
    format: format === "table" ? "table" : "json",
    color: opts?.color !== false && process.stdout.isTTY,
  };
}

program
  .name("understory")
  .description(
    "CLI for the Understory ticket service. Optimized for AI agents: JSON output, explicit commands, full help."
  )
  .version("1.0.0")
  .option("-f, --format <format>", "Output format: json (default) or table", "json")
  .option("--no-color", "Disable colored output");

registerMeCommand(program, getOutputOptions);
registerExperiencesCommand(program, getOutputOptions);
registerEventsCommand(program, getOutputOptions);
registerAvailabilityCommand(program, getOutputOptions);
registerBookingsCommand(program, getOutputOptions);
registerOrdersCommand(program, getOutputOptions);
registerMarketingCommand(program, getOutputOptions);

async function main(): Promise<number> {
  try {
    await program.parseAsync(process.argv);
    return 0;
  } catch (err) {
    const opts = getOutputOptions();
    if (err instanceof UnderstoryApiError) {
      writeError(
        `API error ${err.status}: ${err.message}` +
          (err.body ? `\n${JSON.stringify(err.body, null, 2)}` : ""),
        opts
      );
      return err.status >= 500 ? 2 : 1;
    }
    if (err instanceof Error) {
      writeError(err.message, opts);
      return 1;
    }
    writeError(String(err), opts);
    return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(2);
  });
