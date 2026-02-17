/**
 * HTTP client for the Understory API with automatic authentication.
 */

import { getAccessToken } from "./auth.js";

const BASE_URL = "https://api.understory.io";

export interface ApiError {
  status: number;
  message: string;
  body?: unknown;
}

export class UnderstoryApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "UnderstoryApiError";
  }
}

export interface ApiGetOptions {
  params?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
}

function normalizeOptions(
  options?: ApiGetOptions | Record<string, string | number | undefined>
): ApiGetOptions {
  if (!options) return {};
  if ("params" in options || "headers" in options) {
    return options as ApiGetOptions;
  }
  return { params: options as Record<string, string | number | undefined> };
}

export async function apiGet<T>(
  path: string,
  options?: ApiGetOptions | Record<string, string | number | undefined>
): Promise<T> {
  const token = await getAccessToken();
  const opts = normalizeOptions(options);

  const url = new URL(path, BASE_URL);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v !== undefined && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "understory-cli/1.0",
    Accept: "application/json",
    ...opts.headers,
  };

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    throw new UnderstoryApiError(
      `API error ${response.status}: ${response.statusText}`,
      response.status,
      body
    );
  }

  return response.json() as Promise<T>;
}
