/**
 * understory orders - List and get orders, line-items, transactions, refunds.
 * API: GET /v1/orders, GET /v1/orders/{id}, etc.
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { writeOutput, type OutputOptions } from "../output.js";

export function registerOrdersCommand(
  program: Command,
  getOutputOptions: () => OutputOptions
) {
  const ord = program
    .command("orders")
    .description("List and get orders (line-items, transactions, refunds)")
    .summary("Orders API - GET /v1/orders");

  ord
    .command("list")
    .description("List all orders")
    .option("-f, --from <datetime>", "Filter orders after timestamp")
    .option("-t, --to <datetime>", "Filter orders before timestamp")
    .option("-c, --cursor <cursor>", "Pagination cursor")
    .option("-l, --limit <n>", "Max items per page (default 100)", "100")
    .option(
      "-s, --sort <field>",
      "Sort: +created_at, -created_at, +updated_at, -updated_at"
    )
    .action(async (opts) => {
      const data = await apiGet<{ next?: string; items: unknown[] }>(
        "/v1/orders",
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

  ord
    .command("get <id>")
    .description("Get an order by ID")
    .argument("<id>", "Order ID")
    .action(async (id: string) => {
      const data = await apiGet<Record<string, unknown>>(
        `/v1/orders/${encodeURIComponent(id)}`
      );
      writeOutput(data, getOutputOptions());
    });

  ord
    .command("line-items <id>")
    .description("Get line items for an order")
    .argument("<id>", "Order ID")
    .action(async (id: string) => {
      const data = await apiGet<{ items: unknown[] }>(
        `/v1/orders/${encodeURIComponent(id)}/line-items`
      );
      writeOutput(data, getOutputOptions());
    });

  ord
    .command("transactions <id>")
    .description("Get transactions for an order")
    .argument("<id>", "Order ID")
    .action(async (id: string) => {
      const data = await apiGet<{ items: unknown[] }>(
        `/v1/orders/${encodeURIComponent(id)}/transactions`
      );
      writeOutput(data, getOutputOptions());
    });

  ord
    .command("refunds <id>")
    .description("Get refunds for an order")
    .argument("<id>", "Order ID")
    .action(async (id: string) => {
      const data = await apiGet<{ items: unknown[] }>(
        `/v1/orders/${encodeURIComponent(id)}/refunds`
      );
      writeOutput(data, getOutputOptions());
    });
}
