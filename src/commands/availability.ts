/**
 * understory availability - Query event availability.
 * API: GET /v1/event-availabilities/{eventId}, GET /v1/event-availabilities
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { writeOutput, type OutputOptions } from "../output.js";

export function registerAvailabilityCommand(
  program: Command,
  getOutputOptions: () => OutputOptions
) {
  const avail = program
    .command("availability")
    .description("Query event availability (seats, resources, constraints)")
    .summary("Event Availability API - GET /v1/event-availabilities");

  avail
    .command("event <eventId>")
    .description("Get availability for a single event")
    .argument("<eventId>", "Event ID")
    .action(async (eventId: string) => {
      const data = await apiGet<Record<string, unknown>>(
        `/v1/event-availabilities/${encodeURIComponent(eventId)}`
      );
      writeOutput(data, getOutputOptions());
    });

  avail
    .command("list")
    .description("List availability for events of an experience")
    .requiredOption(
      "-e, --experience-id <id>",
      "Experience ID to query events for"
    )
    .option(
      "-f, --from <datetime>",
      "Filter from local datetime (e.g. 2025-10-09T08:00:00)"
    )
    .option("-t, --to <datetime>", "Filter to local datetime (exclusive)")
    .option("-c, --cursor <cursor>", "Pagination cursor")
    .option("-l, --limit <n>", "Max items per page (default 50)", "50")
    .action(async (opts) => {
      const data = await apiGet<{ next?: string; items?: unknown[] }>(
        "/v1/event-availabilities",
        {
          params: {
            experienceId: opts.experienceId,
            from: opts.from,
            to: opts.to,
            cursor: opts.cursor,
            limit: opts.limit,
          },
        }
      );
      writeOutput(data, getOutputOptions());
    });
}
