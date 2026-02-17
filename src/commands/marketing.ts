/**
 * understory marketing - List marketing consents (Understory Grow).
 * API: GET /v1/marketing-consents
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { writeOutput, type OutputOptions } from "../output.js";

export function registerMarketingCommand(
  program: Command,
  getOutputOptions: () => OutputOptions
) {
  const mkt = program
    .command("marketing")
    .description("Marketing consents (Understory Grow)")
    .summary("Grow API - GET /v1/marketing-consents");

  mkt
    .command("list")
    .description("List all marketing consents collected through Understory checkouts")
    .option("-c, --cursor <cursor>", "Pagination cursor")
    .option("-l, --limit <n>", "Max items per page (default 100)", "100")
    .action(async (opts) => {
      const data = await apiGet<{ next?: string; items: unknown[] }>(
        "/v1/marketing-consents",
        { params: { cursor: opts.cursor, limit: opts.limit } }
      );
      writeOutput(data, getOutputOptions());
    });
}
