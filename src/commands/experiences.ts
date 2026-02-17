/**
 * understory experiences - List and get experiences.
 * API: GET /v1/experiences, GET /v1/experiences/{id}
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { writeOutput, type OutputOptions } from "../output.js";

const ACCEPT_LANGUAGE = "en-GB; q=1.0, en-US; q=0.8";

export function registerExperiencesCommand(
  program: Command,
  getOutputOptions: () => OutputOptions
) {
  const exp = program
    .command("experiences")
    .description("List and get experiences (ticketable products)")
    .summary("Experiences API - GET /v1/experiences");

  exp
    .command("list")
    .description("List all experiences for the company")
    .option(
      "-c, --cursor <cursor>",
      "Pagination cursor for next page (empty to start)"
    )
    .option("-l, --limit <n>", "Max items per page (default 100)", "100")
    .action(async (opts) => {
      const data = await apiGet<{ next?: string; items: unknown[] }>(
        "/v1/experiences",
        {
          params: { cursor: opts.cursor, limit: opts.limit },
          headers: { "Accept-Language": ACCEPT_LANGUAGE },
        }
      );
      writeOutput(data, getOutputOptions());
    });

  exp
    .command("get <id>")
    .description("Get a single experience by ID")
    .argument("<id>", "Experience ID")
    .action(async (id: string) => {
      const data = await apiGet<Record<string, unknown>>(
        `/v1/experiences/${encodeURIComponent(id)}`,
        { headers: { "Accept-Language": ACCEPT_LANGUAGE } }
      );
      writeOutput(data, getOutputOptions());
    });
}
