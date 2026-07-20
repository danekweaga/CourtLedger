import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const supabaseUrl = process.env.SUPABASE_TEST_URL ?? process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasIntegrationEnv = Boolean(supabaseUrl && anonKey && serviceRoleKey);

function createUserClient(url: string, key: string, accessToken: string): SupabaseClient {
  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function minimalBetPayload(userId: string) {
  return {
    user_id: userId,
    game_date: "2026-03-26",
    player_name: "RLS Test Player",
    team: "BOS",
    opponent: "LAL",
    market_type: "points",
    over_under: "over",
    line: 20.5,
    odds: -110,
    stake: 10,
    potential_payout: 19.09,
    result_status: "pending",
  };
}

if (hasIntegrationEnv) {
  describe("RLS isolation", () => {
    const env = {
      url: supabaseUrl!,
      anonKey: anonKey!,
      serviceRoleKey: serviceRoleKey!,
    };
  const admin = createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userAId = "";
  let userBId = "";
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let userABetId = "";
  let userAReportId = "";
  let userALiveStatId = "";

  beforeAll(async () => {
    const password = `Test-${crypto.randomUUID()}-Aa1!`;
    const emailA = `rls-a-${crypto.randomUUID()}@example.com`;
    const emailB = `rls-b-${crypto.randomUUID()}@example.com`;

    const createdA = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
    });
    const createdB = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
    });

    if (createdA.error || createdB.error || !createdA.data.user || !createdB.data.user) {
      throw createdA.error ?? createdB.error ?? new Error("Failed to create test users.");
    }

    userAId = createdA.data.user.id;
    userBId = createdB.data.user.id;

    const signInA = await admin.auth.signInWithPassword({ email: emailA, password });
    const signInB = await admin.auth.signInWithPassword({ email: emailB, password });
    if (signInA.error || signInB.error || !signInA.data.session || !signInB.data.session) {
      throw signInA.error ?? signInB.error ?? new Error("Failed to sign in test users.");
    }

    userAClient = createUserClient(env.url, env.anonKey, signInA.data.session.access_token);
    userBClient = createUserClient(env.url, env.anonKey, signInB.data.session.access_token);

    const betInsert = await userAClient.from("bets").insert(minimalBetPayload(userAId)).select("id").single();
    if (betInsert.error || !betInsert.data) {
      throw betInsert.error ?? new Error("Failed to seed user A bet.");
    }
    userABetId = betInsert.data.id;

    const profileInsert = await userAClient.from("profiles").insert({ id: userAId, display_name: "User A" }).select("id").single();
    if (profileInsert.error) {
      throw profileInsert.error;
    }

    const liveStatInsert = await userAClient
      .from("live_stats_cache")
      .insert({
        user_id: userAId,
        bet_id: userABetId,
        current_stat_value: 12,
        live_status: "in_progress",
      })
      .select("id")
      .single();
    if (liveStatInsert.error || !liveStatInsert.data) {
      throw liveStatInsert.error ?? new Error("Failed to seed user A live stat.");
    }
    userALiveStatId = liveStatInsert.data.id;

    const reportInsert = await userAClient
      .from("bet_intelligence_reports")
      .insert({
        user_id: userAId,
        bet_id: userABetId,
        pick_text: "RLS test report",
        player_name: "RLS Test Player",
      })
      .select("id")
      .single();
    if (reportInsert.error || !reportInsert.data) {
      throw reportInsert.error ?? new Error("Failed to seed user A intelligence report.");
    }
    userAReportId = reportInsert.data.id;
  });

  afterAll(async () => {
    if (!userAId && !userBId) {
      return;
    }
    if (userAId) {
      await admin.auth.admin.deleteUser(userAId);
    }
    if (userBId) {
      await admin.auth.admin.deleteUser(userBId);
    }
  });

  it("prevents User B from reading User A bets", async () => {
    const { data, error } = await userBClient.from("bets").select("*").eq("id", userABetId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("prevents User B from updating User A bets", async () => {
    const { data, error } = await userBClient
      .from("bets")
      .update({ notes: "cross-user update" })
      .eq("id", userABetId)
      .select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("prevents User B from settling User A bets", async () => {
    const { data, error } = await userBClient
      .from("bets")
      .update({ result_status: "win", live_status: "finished" })
      .eq("id", userABetId)
      .select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("prevents User B from deleting User A bets", async () => {
    const { data, error } = await userBClient.from("bets").delete().eq("id", userABetId).select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("prevents User B from reading User A profiles", async () => {
    const { data, error } = await userBClient.from("profiles").select("*").eq("id", userAId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("prevents User B from modifying User A live stats cache rows", async () => {
    const readAttempt = await userBClient.from("live_stats_cache").select("*").eq("id", userALiveStatId);
    expect(readAttempt.error).toBeNull();
    expect(readAttempt.data ?? []).toHaveLength(0);

    const updateAttempt = await userBClient
      .from("live_stats_cache")
      .update({ current_stat_value: 99 })
      .eq("id", userALiveStatId)
      .select("id");
    expect(updateAttempt.error).toBeNull();
    expect(updateAttempt.data ?? []).toHaveLength(0);
  });

  it("prevents User B from reading or deleting User A intelligence reports", async () => {
    const readAttempt = await userBClient.from("bet_intelligence_reports").select("*").eq("id", userAReportId);
    expect(readAttempt.error).toBeNull();
    expect(readAttempt.data ?? []).toHaveLength(0);

    const deleteAttempt = await userBClient
      .from("bet_intelligence_reports")
      .delete()
      .eq("id", userAReportId)
      .select("id");
    expect(deleteAttempt.error).toBeNull();
    expect(deleteAttempt.data ?? []).toHaveLength(0);
  });
  });
} else {
  describe("RLS isolation", () => {
    it("skips integration tests when Supabase env vars are not configured", () => {
      expect(true).toBe(true);
    });
  });
}
