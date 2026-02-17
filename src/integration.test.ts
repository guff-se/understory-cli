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
});
