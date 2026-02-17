import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  writeOutput,
  writeError,
  type OutputOptions,
} from "./output.js";

describe("output", () => {
  const jsonOpts: OutputOptions = { format: "json", color: false };
  const tableOpts: OutputOptions = { format: "table", color: false };

  beforeEach(() => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("writeOutput", () => {
    it("outputs pretty JSON for objects", () => {
      writeOutput({ foo: "bar", n: 1 }, jsonOpts);
      expect(process.stdout.write).toHaveBeenCalledWith(
        JSON.stringify({ foo: "bar", n: 1 }, null, 2) + "\n"
      );
    });

    it("outputs pretty JSON for arrays", () => {
      writeOutput([{ id: "a" }, { id: "b" }], jsonOpts);
      const call = (process.stdout.write as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(call).toContain('"id": "a"');
      expect(call).toContain('"id": "b"');
    });

    it("outputs items array with next for paginated responses", () => {
      writeOutput(
        { items: [{ x: 1 }], next: "cursor123" },
        jsonOpts
      );
      const call = (process.stdout.write as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(call).toContain("cursor123");
    });

    it("renders table for array in table format", () => {
      writeOutput([{ id: "a", name: "Alice" }], tableOpts);
      const allCalls = (process.stdout.write as ReturnType<typeof vi.fn>).mock
        .calls;
      const fullOutput = allCalls.map((c) => c[0]).join("");
      expect(fullOutput).toContain("id");
      expect(fullOutput).toContain("name");
      expect(fullOutput).toContain("a");
      expect(fullOutput).toContain("Alice");
    });

    it("renders (no items) for empty array in table format", () => {
      writeOutput([], tableOpts);
      expect(process.stdout.write).toHaveBeenCalledWith("(no items)\n");
    });
  });

  describe("writeError", () => {
    it("outputs JSON error in json format", () => {
      writeError("Something failed", jsonOpts);
      expect(process.stderr.write).toHaveBeenCalledWith(
        JSON.stringify({ error: "Something failed" }) + "\n"
      );
    });

    it("outputs plain text in table format", () => {
      writeError("Something failed", tableOpts);
      expect(process.stderr.write).toHaveBeenCalledWith(
        "Error: Something failed\n"
      );
    });
  });
});
