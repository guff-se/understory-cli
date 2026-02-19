/**
 * Normalize datetime strings for the Understory API.
 * The API expects UTC format (e.g. 2026-02-21T00:00:00Z) and rejects
 * timezone offsets like +01:00. This parses any valid ISO 8601 datetime
 * and converts to API-compatible format.
 */
export function normalizeDatetimeForApi(datetimeStr: string): string {
  const date = new Date(datetimeStr);
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Invalid datetime "${datetimeStr}". Use ISO 8601 (e.g. 2026-02-21T00:00:00 or 2026-02-21T00:00:00Z)`
    );
  }
  return date.toISOString().slice(0, 19) + "Z";
}
