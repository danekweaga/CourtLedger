const SECRET_QUERY_PARAM_NAMES = ["cron_secret", "secret", "x-cron-secret", "token"] as const;

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function hasSecretInQueryString(requestUrl: string): boolean {
  try {
    const url = new URL(requestUrl, "http://localhost");
    return SECRET_QUERY_PARAM_NAMES.some((name) => url.searchParams.has(name));
  } catch {
    return false;
  }
}

export type CronAuthFailure = {
  ok: false;
  status: 503 | 401 | 400;
  message: string;
};

export type CronAuthSuccess = { ok: true; secret: string };

export type CronAuthResult = CronAuthSuccess | CronAuthFailure;

export function verifyCronSecretRequest(
  configuredSecret: string | undefined | null,
  headerValue: string | null | undefined,
  requestUrl?: string,
): CronAuthResult {
  const secret = configuredSecret?.trim();
  if (!secret) {
    return { ok: false, status: 503, message: "CRON_SECRET is not configured" };
  }

  if (requestUrl && hasSecretInQueryString(requestUrl)) {
    return { ok: false, status: 400, message: "Secrets must not be sent in query strings" };
  }

  const provided = headerValue?.trim();
  if (!provided || !timingSafeEqual(provided, secret)) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  return { ok: true, secret };
}

export function readCronSecretHeader(headers: Headers): string | null {
  return headers.get("x-cron-secret");
}
