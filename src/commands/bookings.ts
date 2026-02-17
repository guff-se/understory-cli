/**
 * understory bookings - List and get bookings.
 * API: GET /v1/bookings, GET /v1/bookings/{id}, GET /v1/bookings/{id}/tickets
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { writeOutput, type OutputOptions } from "../output.js";

export function registerBookingsCommand(
  program: Command,
  getOutputOptions: () => OutputOptions
) {
  const book = program
    .command("bookings")
    .description("List and get bookings")
    .summary("Bookings API - GET /v1/bookings");

  book
    .command("list")
    .description("List all bookings")
    .option(
      "-f, --from <datetime>",
      "Filter bookings made after this timestamp (ISO 8601)"
    )
    .option("-t, --to <datetime>", "Filter bookings made before this timestamp")
    .option("-c, --cursor <cursor>", "Pagination cursor")
    .option("-l, --limit <n>", "Max items per page (default 100)", "100")
    .option(
      "-s, --sort <field>",
      "Sort order: +created_at, -created_at, +updated_at, -updated_at (default -created_at)"
    )
    .action(async (opts) => {
      const data = await apiGet<{ next?: string; items: unknown[] }>(
        "/v1/bookings",
        {
          params: {
            from: opts.from,
            to: opts.to,
            cursor: opts.cursor,
            limit: opts.limit,
            sort: opts.sort,
          },
        }
      );
      writeOutput(data, getOutputOptions());
    });

  book
    .command("get <id>")
    .description("Get a booking by ID")
    .argument("<id>", "Booking ID")
    .action(async (id: string) => {
      const data = await apiGet<Record<string, unknown>>(
        `/v1/bookings/${encodeURIComponent(id)}`
      );
      writeOutput(data, getOutputOptions());
    });

  book
    .command("tickets <id>")
    .description("Get all tickets for a booking")
    .argument("<id>", "Booking ID")
    .action(async (id: string) => {
      const data = await apiGet<{ items: unknown[] }>(
        `/v1/bookings/${encodeURIComponent(id)}/tickets`
      );
      writeOutput(data, getOutputOptions());
    });
}
