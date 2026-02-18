/**
 * Integration tests - require UNDERSTORY_CLIENT_ID and UNDERSTORY_SECRET_KEY in .env
 * Skip when credentials are not available.
 */

import "dotenv/config";
import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import { join } from "path";

const hasCredentials =
  !!process.env.UNDERSTORY_CLIENT_ID && !!process.env.UNDERSTORY_SECRET_KEY;

describe.runIf(hasCredentials)("integration", () => {

  it("understory me returns company info", () => {
    const cwd = process.cwd();
    const scriptPath = join(cwd, "dist", "index.js");
    const result = execFileSync("node", [scriptPath, "me"], {
      encoding: "utf-8",
      env: process.env,
      cwd,
    });
    const data = JSON.parse(result);
    expect(data).toHaveProperty("company_id");
    expect(data).toHaveProperty("user_id");
  });

  it("understory experiences list returns paginated data", () => {
    const cwd = process.cwd();
    const scriptPath = join(cwd, "dist", "index.js");
    const result = execFileSync(
      "node",
      [scriptPath, "experiences", "list", "--limit", "2"],
      { encoding: "utf-8", env: process.env, cwd }
    );
    const data = JSON.parse(result);
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
  });

  it("understory stats guests returns guest_count and event_count", () => {
    const cwd = process.cwd();
    const scriptPath = join(cwd, "dist", "index.js");
    const result = execFileSync(
      "node",
      [scriptPath, "stats", "guests", "--period", "tomorrow"],
      { encoding: "utf-8", env: process.env, cwd }
    );
    const data = JSON.parse(result);
    expect(data).toHaveProperty("guest_count");
    expect(data).toHaveProperty("event_count");
    expect(data).toHaveProperty("from");
    expect(data).toHaveProperty("to");
    expect(typeof data.guest_count).toBe("number");
    expect(typeof data.event_count).toBe("number");
  });

  it("understory stats guests --month returns data for specific month", () => {
    const cwd = process.cwd();
    const scriptPath = join(cwd, "dist", "index.js");
    const result = execFileSync(
      "node",
      [scriptPath, "stats", "guests", "--month", "2026-01"],
      { encoding: "utf-8", env: process.env, cwd }
    );
    const data = JSON.parse(result);
    expect(data).toHaveProperty("guest_count");
    expect(data).toHaveProperty("event_count");
    expect(data).toHaveProperty("from");
    expect(data).toHaveProperty("to");
    expect(typeof data.guest_count).toBe("number");
  });

  it("understory stats busiest returns busiest slot", () => {
    const cwd = process.cwd();
    const scriptPath = join(cwd, "dist", "index.js");
    const result = execFileSync(
      "node",
      [scriptPath, "stats", "busiest", "--period", "today"],
      { encoding: "utf-8", env: process.env, cwd }
    );
    const data = JSON.parse(result);
    expect(data).toHaveProperty("busiest");
    expect(data).toHaveProperty("from");
    expect(data).toHaveProperty("to");
  });

  it("understory events next returns upcoming events", () => {
    const cwd = process.cwd();
    const scriptPath = join(cwd, "dist", "index.js");
    const result = execFileSync(
      "node",
      [scriptPath, "events", "next", "--limit", "2"],
      { encoding: "utf-8", env: process.env, cwd }
    );
    const data = JSON.parse(result);
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data).toHaveProperty("from");
  });

  it("understory availability day returns slots with capacity", () => {
    const cwd = process.cwd();
    const scriptPath = join(cwd, "dist", "index.js");
    const result = execFileSync(
      "node",
      [scriptPath, "availability", "day"],
      { encoding: "utf-8", env: process.env, cwd }
    );
    const data = JSON.parse(result);
    expect(data).toHaveProperty("date");
    expect(data).toHaveProperty("slots");
    expect(Array.isArray(data.slots)).toBe(true);
  });
});
