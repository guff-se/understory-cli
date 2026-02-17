import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAccessToken, clearTokenCache } from "./auth.js";

const mockTokenResponse = {
  access_token: "test-token-123",
  expires_in: 3600,
  token_type: "bearer",
};

describe("auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearTokenCache();
    process.env = {
      ...originalEnv,
      UNDERSTORY_CLIENT_ID: "test-client-id",
      UNDERSTORY_SECRET_KEY: "test-secret",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    clearTokenCache();
  });

  it("throws when credentials are missing", async () => {
    delete process.env.UNDERSTORY_CLIENT_ID;
    delete process.env.UNDERSTORY_SECRET_KEY;

    await expect(getAccessToken()).rejects.toThrow(
      "Missing credentials"
    );
  });

  it("fetches token and caches it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTokenResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    const token1 = await getAccessToken();
    const token2 = await getAccessToken();

    expect(token1).toBe("test-token-123");
    expect(token2).toBe("test-token-123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends correct token request body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTokenResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    await getAccessToken();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.auth.understory.io/oauth2/token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      })
    );
    const body = fetchMock.mock.calls[0][1].body;
    expect(body).toContain("grant_type=client_credentials");
    expect(body).toContain("audience=https%3A%2F%2Fapi.understory.io");
    expect(body).toContain("client_id=test-client-id");
    expect(body).toContain("client_secret=test-secret");
  });

  it("throws on auth failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Invalid credentials",
    }));

    await expect(getAccessToken()).rejects.toThrow("Auth failed");
  });
});
