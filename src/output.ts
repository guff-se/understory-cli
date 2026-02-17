/**
 * Output formatting for agent consumption.
 * Default: JSON (pretty-printed) for reliable parsing.
 * Option: table for human-readable lists.
 */

export type OutputFormat = "json" | "table";

export interface OutputOptions {
  format: OutputFormat;
  color: boolean;
}

const RED = "\u001b[31m";
const GREEN = "\u001b[32m";
const DIM = "\u001b[2m";
const RESET = "\u001b[0m";

export function writeOutput(
  data: unknown,
  options: OutputOptions
): void {
  if (options.format === "json") {
    const json = JSON.stringify(data, null, 2);
    process.stdout.write(json + "\n");
    return;
  }

  if (Array.isArray(data)) {
    writeTable(data, options);
    return;
  }

  if (typeof data === "object" && data !== null && "items" in data) {
    const obj = data as { items: unknown[]; next?: string };
    writeTable(obj.items, options);
    if (obj.next && options.color) {
      process.stdout.write(
        `\n${DIM}Next page cursor: ${obj.next}${RESET}\n`
      );
    }
    return;
  }

  // Fallback to JSON for single objects
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function writeTable(items: unknown[], options: OutputOptions): void {
  if (items.length === 0) {
    process.stdout.write("(no items)\n");
    return;
  }

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first);
  const colWidths = keys.map((k) => Math.max(k.length, 12));

  for (const item of items) {
    const obj = item as Record<string, unknown>;
    keys.forEach((k, i) => {
      const val = formatCell(obj[k]);
      colWidths[i] = Math.max(colWidths[i], val.length);
    });
  }

  const header = keys
    .map((k, i) => k.padEnd(colWidths[i]))
    .join("  ");
  const sep = keys.map((_, i) => "-".repeat(colWidths[i])).join("  ");

  if (options.color) {
    process.stdout.write(`${DIM}${header}${RESET}\n`);
    process.stdout.write(`${DIM}${sep}${RESET}\n`);
  } else {
    process.stdout.write(header + "\n");
    process.stdout.write(sep + "\n");
  }

  for (const item of items) {
    const obj = item as Record<string, unknown>;
    const row = keys
      .map((k, i) => formatCell(obj[k]).padEnd(colWidths[i]))
      .join("  ");
    process.stdout.write(row + "\n");
  }
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val).slice(0, 40);
  return String(val).slice(0, 60);
}

export function writeError(message: string, options: OutputOptions): void {
  if (options.format === "json") {
    process.stderr.write(JSON.stringify({ error: message }) + "\n");
  } else if (options.color) {
    process.stderr.write(`${RED}Error: ${message}${RESET}\n`);
  } else {
    process.stderr.write(`Error: ${message}\n`);
  }
}

export function writeSuccess(message: string, options: OutputOptions): void {
  if (options.format === "json") {
    process.stdout.write(JSON.stringify({ message }) + "\n");
  } else if (options.color) {
    process.stdout.write(`${GREEN}${message}${RESET}\n`);
  } else {
    process.stdout.write(message + "\n");
  }
}
