/**
 * understory stats - Aggregate metrics for date ranges.
 * Answers common questions like "how many guests tomorrow?" without post-processing.
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { writeOutput, type OutputOptions } from "../output.js";

/** Parse YYYY-MM to date range (first to last day of month). */
function resolveMonth(monthStr: string): { from: string; to: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr);
  if (!match) {
    throw new Error(
      'Invalid --month format. Use YYYY-MM (e.g. 2026-02 for February 2026)'
    );
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  if (month < 0 || month > 11) throw new Error('Month must be 01-12');
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);
  return {
    from: from.toISOString().slice(0, 19) + "Z",
    to: to.toISOString().slice(0, 19) + "Z",
  };
}

/** Resolve period shorthand to ISO 8601 date range [from, to] (to exclusive). */
function resolvePeriod(period: string): { from: string; to: string } {
  const now = new Date();
  let from: Date;
  let to: Date;

  switch (period.toLowerCase()) {
    case "today": {
      from = new Date(now);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(to.getDate() + 1);
      break;
    }
    case "tomorrow": {
      from = new Date(now);
      from.setDate(from.getDate() + 1);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(to.getDate() + 1);
      break;
    }
    case "this-week": {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      from = new Date(now);
      from.setDate(from.getDate() + mondayOffset);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(to.getDate() + 7);
      break;
    }
    case "next-week": {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      from = new Date(now);
      from.setDate(from.getDate() + mondayOffset + 7);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(to.getDate() + 7);
      break;
    }
    case "this-month": {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    }
    case "last-month": {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    default:
      throw new Error(
        `Unknown period "${period}". Use: today, tomorrow, this-week, next-week, this-month, last-month`
      );
  }

  return {
    from: from.toISOString().slice(0, 19) + "Z",
    to: to.toISOString().slice(0, 19) + "Z",
  };
}

interface EventItem {
  id: string;
  capacity?: { total?: number; reserved?: number };
  sessions?: Array<{ start_time?: string; end_time?: string }>;
}

export function registerStatsCommand(
  program: Command,
  getOutputOptions: () => OutputOptions
) {
  const stats = program
    .command("stats")
    .description(
      "Aggregate metrics for date ranges. Use for questions like 'how many guests tomorrow?'"
    )
    .summary("Stats API - guest counts, booking counts by date range");

  stats
    .command("guests")
    .description(
      "Total guest count (reserved capacity) for events in a date range"
    )
    .option(
      "-f, --from <datetime>",
      "Start of range (ISO 8601, e.g. 2026-02-18T00:00:00)"
    )
    .option("-t, --to <datetime>", "End of range (exclusive, ISO 8601)")
    .option(
      "-p, --period <period>",
      "Shorthand: today | tomorrow | this-week | next-week | this-month | last-month"
    )
    .option(
      "-m, --month <YYYY-MM>",
      "Specific month (e.g. 2026-02). Ignores --from/--to/--period"
    )
    .action(async (opts) => {
      let from: string;
      let to: string;

      if (opts.month) {
        const resolved = resolveMonth(opts.month);
        from = resolved.from;
        to = resolved.to;
      } else if (opts.period) {
        const resolved = resolvePeriod(opts.period);
        from = resolved.from;
        to = resolved.to;
      } else if (opts.from && opts.to) {
        from = opts.from;
        to = opts.to;
      } else {
        throw new Error(
          "Provide --period, --month <YYYY-MM>, or both --from and --to"
        );
      }

      let guestCount = 0;
      let eventCount = 0;
      let cursor: string | undefined;

      do {
        const params: Record<string, string | number | undefined> = {
          from,
          to,
          limit: 100,
          cursor,
        };
        const data = await apiGet<{ next?: string; items: EventItem[] }>(
          "/v1/events",
          { params }
        );
        const items = data.items ?? [];
        for (const e of items) {
          eventCount += 1;
          guestCount += e.capacity?.reserved ?? 0;
        }
        cursor = data.next;
      } while (cursor);

      const result = {
        guest_count: guestCount,
        event_count: eventCount,
        from,
        to,
      };
      writeOutput(result, getOutputOptions());
    });

  stats
    .command("bookings")
    .description(
      "Count of booking transactions for events in a date range (excludes CANCELLED)"
    )
    .option(
      "-f, --from <datetime>",
      "Start of range (ISO 8601, e.g. 2026-02-18T00:00:00)"
    )
    .option("-t, --to <datetime>", "End of range (exclusive, ISO 8601)")
    .option(
      "-p, --period <period>",
      "Shorthand: today | tomorrow | this-week | next-week | this-month | last-month"
    )
    .option("-m, --month <YYYY-MM>", "Specific month (e.g. 2026-02)")
    .action(async (opts) => {
      let from: string;
      let to: string;

      if (opts.month) {
        const resolved = resolveMonth(opts.month);
        from = resolved.from;
        to = resolved.to;
      } else if (opts.period) {
        const resolved = resolvePeriod(opts.period);
        from = resolved.from;
        to = resolved.to;
      } else if (opts.from && opts.to) {
        from = opts.from;
        to = opts.to;
      } else {
        throw new Error(
          "Provide --period, --month <YYYY-MM>, or both --from and --to"
        );
      }

      const eventIds = new Set<string>();
      let cursor: string | undefined;

      do {
        const params: Record<string, string | number | undefined> = {
          from,
          to,
          limit: 100,
          cursor,
        };
        const data = await apiGet<{ next?: string; items: EventItem[] }>(
          "/v1/events",
          { params }
        );
        for (const e of data.items ?? []) eventIds.add(e.id);
        cursor = data.next;
      } while (cursor);

      let bookingCount = 0;
      cursor = undefined;

      do {
        const params: Record<string, string | number | undefined> = {
          limit: 100,
          cursor,
        };
        const data = await apiGet<{
          next?: string;
          items: Array<{ event_id: string; status: string }>;
        }>("/v1/bookings", { params });

        for (const b of data.items ?? []) {
          if (eventIds.has(b.event_id) && b.status !== "CANCELLED") {
            bookingCount += 1;
          }
        }
        cursor = data.next;
      } while (cursor);

      const result = {
        booking_count: bookingCount,
        event_count: eventIds.size,
        from,
        to,
      };
      writeOutput(result, getOutputOptions());
    });

  stats
    .command("busiest")
    .description("Busiest time slot in a date range (event with most guests)")
    .option(
      "-p, --period <period>",
      "today | tomorrow | this-week | next-week (default: today)"
    )
    .option("-m, --month <YYYY-MM>", "Specific month")
    .option("-f, --from <datetime>", "Start of range (with --to)")
    .option("-t, --to <datetime>", "End of range (with --from)")
    .action(async (opts) => {
      let from: string;
      let to: string;

      if (opts.month) {
        const resolved = resolveMonth(opts.month);
        from = resolved.from;
        to = resolved.to;
      } else if (opts.period || (!opts.from && !opts.to)) {
        const resolved = resolvePeriod(opts.period || "today");
        from = resolved.from;
        to = resolved.to;
      } else if (opts.from && opts.to) {
        from = opts.from;
        to = opts.to;
      } else {
        throw new Error("Provide --period, --month, or both --from and --to");
      }

      let busiest: EventItem | null = null;
      let cursor: string | undefined;

      do {
        const params: Record<string, string | number | undefined> = {
          from,
          to,
          limit: 100,
          cursor,
        };
        const data = await apiGet<{ next?: string; items: EventItem[] }>(
          "/v1/events",
          { params }
        );
        for (const e of data.items ?? []) {
          const reserved = e.capacity?.reserved ?? 0;
          const current = busiest?.capacity?.reserved ?? 0;
          if (reserved > current) busiest = e;
        }
        cursor = data.next;
      } while (cursor);

      if (!busiest) {
        const result = {
          busiest: null,
          guest_count: 0,
          from,
          to,
        };
        writeOutput(result, getOutputOptions());
        return;
      }

      const startTime =
        busiest.sessions?.[0]?.start_time ?? null;
      const result = {
        busiest: {
          event_id: busiest.id,
          start_time: startTime,
          guest_count: busiest.capacity?.reserved ?? 0,
          capacity_total: busiest.capacity?.total ?? null,
        },
        from,
        to,
      };
      writeOutput(result, getOutputOptions());
    });
}
