import { describe, expect, it } from "vitest";
import {
  hasSecretInQueryString,
  timingSafeEqual,
  verifyCronSecretRequest,
} from "../lib/cronAuth";

describe("verifyCronSecretRequest", () => {
  it("fails closed when CRON_SECRET is missing", () => {
    const result = verifyCronSecretRequest(undefined, "secret");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
    }
  });

  it("fails closed when CRON_SECRET is empty", () => {
    const result = verifyCronSecretRequest("   ", "secret");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
    }
  });

  it("rejects secrets in query strings", () => {
    const result = verifyCronSecretRequest(
      "expected-secret",
      "expected-secret",
      "https://example.com/api/keepalive?cron_secret=expected-secret",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("rejects incorrect header secrets", () => {
    const result = verifyCronSecretRequest("expected-secret", "wrong-secret");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });

  it("accepts a matching x-cron-secret header", () => {
    const result = verifyCronSecretRequest("expected-secret", "expected-secret");
    expect(result.ok).toBe(true);
  });
});

describe("timingSafeEqual", () => {
  it("matches equal strings", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
  });

  it("rejects different strings", () => {
    expect(timingSafeEqual("abc", "abd")).toBe(false);
  });
});

describe("hasSecretInQueryString", () => {
  it("detects blocked query parameter names", () => {
    expect(hasSecretInQueryString("https://example.com?token=1")).toBe(true);
    expect(hasSecretInQueryString("https://example.com?safe=1")).toBe(false);
  });
});
