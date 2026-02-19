import { describe, it, expect } from "vitest";
import { normalizeDatetimeForApi } from "./datetime.js";

describe("normalizeDatetimeForApi", () => {
  it("converts timezone offset (+01:00) to UTC Z format", () => {
    expect(normalizeDatetimeForApi("2026-02-21T00:00:00+01:00")).toBe(
      "2026-02-20T23:00:00Z"
    );
  });

  it("keeps UTC Z format unchanged", () => {
    expect(normalizeDatetimeForApi("2026-02-21T00:00:00Z")).toBe(
      "2026-02-21T00:00:00Z"
    );
  });

  it("converts local datetime without TZ to UTC", () => {
    const result = normalizeDatetimeForApi("2026-02-21T00:00:00");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(new Date(result).toISOString().slice(0, 19) + "Z").toBe(result);
  });

  it("throws on invalid datetime", () => {
    expect(() => normalizeDatetimeForApi("not-a-date")).toThrow(
      /Invalid datetime/
    );
  });
});
