/**
 * understory availability - Query event availability.
 * API: GET /v1/event-availabilities/{eventId}, GET /v1/event-availabilities
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { normalizeDatetimeForApi } from "../datetime.js";
import { writeOutput, type OutputOptions } from "../output.js";

interface EventWithCapacity {
  id: string;
  capacity?: { total?: number; reserved?: number };
  sessions?: Array<{ start_time?: string; end_time?: string }>;
}

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
    .command("day")
    .description(
      "Events for a day (or week) with available capacity. Use for 'do we have space for walk-ins?' or 'which slots available next week?'"
    )
    .option(
      "-d, --date <YYYY-MM-DD>",
      "Date (default: today)"
    )
    .option(
      "-p, --period <period>",
      "tomorrow | next-week (overrides --date)"
    )
    .option(
      "--available-only",
      "Only show events with available capacity"
    )
    .action(async (opts) => {
      const now = new Date();
      let from: string;
      let to: string;
      let label: string;

      if (opts.period === "next-week") {
        const day = now.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() + mondayOffset + 7);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + 7);
        from = fromDate.toISOString().slice(0, 19) + "Z";
        to = toDate.toISOString().slice(0, 19) + "Z";
        label = "next-week";
      } else if (opts.period === "tomorrow") {
        const fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() + 1);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + 1);
        from = fromDate.toISOString().slice(0, 19) + "Z";
        to = toDate.toISOString().slice(0, 19) + "Z";
        label = fromDate.toISOString().slice(0, 10);
      } else {
        let dateStr = opts.date;
        if (!dateStr) {
          dateStr =
            now.getFullYear() +
            "-" +
            String(now.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(now.getDate()).padStart(2, "0");
        }
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
        if (!match) {
          throw new Error("Invalid date. Use YYYY-MM-DD");
        }
        from = `${dateStr}T00:00:00Z`;
        const toDate = new Date(
          parseInt(match[1], 10),
          parseInt(match[2], 10) - 1,
          parseInt(match[3], 10) + 1
        );
        to = toDate.toISOString().slice(0, 19) + "Z";
        label = dateStr;
      }

      const slots: Array<{
        event_id: string;
        start_time: string | null;
        available: number;
        reserved: number;
        total: number;
      }> = [];
      let cursor: string | undefined;

      do {
        const data = await apiGet<{ next?: string; items: EventWithCapacity[] }>(
          "/v1/events",
          { params: { from, to, limit: 100, cursor } }
        );
        for (const e of data.items ?? []) {
          const total = e.capacity?.total ?? 0;
          const reserved = e.capacity?.reserved ?? 0;
          const available = Math.max(0, total - reserved);
          if (!opts.availableOnly || available > 0) {
            slots.push({
              event_id: e.id,
              start_time: e.sessions?.[0]?.start_time ?? null,
              available,
              reserved,
              total,
            });
          }
        }
        cursor = data.next;
      } while (cursor);

      writeOutput(
        { date: label, slots },
        getOutputOptions()
      );
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
      const params: Record<string, string | number | undefined> = {
        experienceId: opts.experienceId,
        cursor: opts.cursor,
        limit: opts.limit,
      };
      if (opts.from) params.from = normalizeDatetimeForApi(opts.from);
      if (opts.to) params.to = normalizeDatetimeForApi(opts.to);

      const data = await apiGet<{ next?: string; items?: unknown[] }>(
        "/v1/event-availabilities",
        { params }
      );
      writeOutput(data, getOutputOptions());
    });
}
