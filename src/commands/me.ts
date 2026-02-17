/**
 * understory me - Verify auth and show company info.
 * API: GET /v1/me
 */

import { Command } from "commander";
import { apiGet } from "../client.js";
import { writeOutput, type OutputOptions } from "../output.js";

export function registerMeCommand(program: Command, getOutputOptions: () => OutputOptions) {
  program
    .command("me")
    .description(
      "Verify authentication and show current user/company info. Use this to confirm API connectivity."
    )
    .summary("Verify auth, show company info (GET /v1/me)")
    .action(async () => {
      const data = await apiGet<Record<string, unknown>>("/v1/me");
      writeOutput(data, getOutputOptions());
    });
}
