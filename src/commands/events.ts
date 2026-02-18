/**
 * understory events - List and get events.
 * API: GET /v1/events, GET /v1/events/{id}
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { writeOutput, type OutputOptions } from "../output.js";

export function registerEventsCommand(
  program: Command,
  getOutputOptions: () => OutputOptions
) {
  const evt = program
    .command("events")
    .description("List and get events (scheduled instances of experiences)")
    .summary("Events API - GET /v1/events");

  evt
    .command("list")
    .description("List all events for the company")
    .option(
      "-f, --from <datetime>",
      "Filter events from this local datetime (ISO 8601, e.g. 2025-01-15T09:00:00)"
    )
    .option(
      "-t, --to <datetime>",
      "Filter events up to this local datetime (exclusive)"
    )
    .option("-c, --cursor <cursor>", "Pagination cursor")
    .option("-l, --limit <n>", "Max events to return (default 100)", "100")
    .action(async (opts) => {
      const data = await apiGet<{ next?: string; items: unknown[] }>(
        "/v1/events",
        {
          params: {
            from: opts.from,
            to: opts.to,
            cursor: opts.cursor,
            limit: opts.limit,
          },
        }
      );
      writeOutput(data, getOutputOptions());
    });

  evt
    .command("next")
    .description(
      "Next upcoming events from now. Use for 'when is our next event today?'"
    )
    .option(
      "-l, --limit <n>",
      "Max events to return (default 5)",
      "5"
    )
    .option(
      "-h, --hours <n>",
      "Look ahead hours (default 24)",
      "24"
    )
    .action(async (opts) => {
      const now = new Date();
      const from = now.toISOString().slice(0, 19) + "Z";
      const end = new Date(now.getTime() + parseInt(opts.hours, 10) * 60 * 60 * 1000);
      const to = end.toISOString().slice(0, 19) + "Z";

      const data = await apiGet<{ next?: string; items: unknown[] }>(
        "/v1/events",
        {
          params: {
            from,
            to,
            limit: parseInt(opts.limit, 10),
          },
        }
      );

      writeOutput(
        { items: data.items ?? [], from, to },
        getOutputOptions()
      );
    });

  evt
    .command("get <id>")
    .description("Get a single event by ID")
    .argument("<id>", "Event ID")
    .action(async (id: string) => {
      const data = await apiGet<Record<string, unknown>>(
        `/v1/events/${encodeURIComponent(id)}`
      );
      writeOutput(data, getOutputOptions());
    });
}
