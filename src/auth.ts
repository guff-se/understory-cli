/**
 * OAuth2 client credentials authentication for the Understory API.
 * Tokens are cached and refreshed before expiry.
 */

const TOKEN_URL = "https://api.auth.understory.io/oauth2/token";
const AUDIENCE = "https://api.understory.io";
// Request all read scopes. Override via UNDERSTORY_SCOPES if your integration has fewer.
const DEFAULT_SCOPES =
  "openid experience.read event.read booking.read marketing.read";
const REFRESH_BUFFER_SECONDS = 300; // Refresh 5 min before expiry

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAccessToken(): Promise<string> {
  const now = Date.now() / 1000;
  if (cachedToken && tokenExpiry - REFRESH_BUFFER_SECONDS > now) {
    return cachedToken;
  }

  const clientId = process.env.UNDERSTORY_CLIENT_ID;
  const clientSecret = process.env.UNDERSTORY_SECRET_KEY;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing credentials. Set UNDERSTORY_CLIENT_ID and UNDERSTORY_SECRET_KEY in .env or environment."
    );
  }

  const scopes =
    process.env.UNDERSTORY_SCOPES ?? DEFAULT_SCOPES;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    audience: AUDIENCE,
    scope: scopes,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "understory-cli/1.0",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as TokenResponse;
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in;

  return cachedToken;
}

/**
 * Clear cached token (for testing).
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}
