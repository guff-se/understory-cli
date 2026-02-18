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

  book
    .command("for-date <date>")
    .description(
      "List bookings for events on a specific date (excludes CANCELLED). Date: YYYY-MM-DD (e.g. 2026-02-18)"
    )
    .action(async (dateStr: string) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
      if (!match) {
        throw new Error("Invalid date. Use YYYY-MM-DD (e.g. 2026-02-18)");
      }
      const from = `${dateStr}T00:00:00Z`;
      const toDate = new Date(
        parseInt(match[1], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[3], 10) + 1
      );
      const to = toDate.toISOString().slice(0, 19) + "Z";

      const eventIds = new Set<string>();
      let cursor: string | undefined;

      do {
        const data = await apiGet<{ next?: string; items: Array<{ id: string }> }>(
          "/v1/events",
          { params: { from, to, limit: 100, cursor } }
        );
        for (const e of data.items ?? []) eventIds.add(e.id);
        cursor = data.next;
      } while (cursor);

      const items: unknown[] = [];
      let bookingCursor: string | undefined;

      do {
        const res = await apiGet<{ next?: string; items: unknown[] }>(
          "/v1/bookings",
          { params: { limit: 100, cursor: bookingCursor } }
        );

        for (const b of res.items ?? []) {
          const row = b as { event_id: string; status: string };
          if (eventIds.has(row.event_id) && row.status !== "CANCELLED") {
            items.push(b);
          }
        }
        bookingCursor = res.next;
      } while (bookingCursor);

      writeOutput({ items, date: dateStr }, getOutputOptions());
    });
}
