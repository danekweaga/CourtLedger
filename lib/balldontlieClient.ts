const BDL_BASE = "https://api.balldontlie.io/v1";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function bdlFetch(path: string, apiKey: string): Promise<unknown> {
  await sleep(90);
  const res = await fetch(`${BDL_BASE}${path}`, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    throw new Error(`balldontlie ${res.status}: ${(await res.text()).slice(0, 120)}`);
  }
  return res.json();
}
