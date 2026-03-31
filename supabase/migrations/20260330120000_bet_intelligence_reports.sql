-- CourtLedger: Bet Intelligence — reports storage, RLS, indexes, updated_at
--
-- Apply: Supabase Dashboard → SQL → New query → paste this file → Run.
-- Safe to re-run in SQL Editor (policies are dropped before recreate).
-- Also works with: supabase db push (if project is linked).

-- ---------------------------------------------------------------------------
-- Table: bet_intelligence_reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bet_intelligence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bet_id uuid REFERENCES public.bets (id) ON DELETE SET NULL,

  pick_text text NOT NULL DEFAULT '',
  player_name text NOT NULL DEFAULT '',
  team text NOT NULL DEFAULT '',
  opponent text NOT NULL DEFAULT '',
  market_type text NOT NULL DEFAULT '',
  over_under text,
  line numeric NOT NULL DEFAULT 0,
  opening_line numeric,
  current_odds integer NOT NULL DEFAULT -110,

  projection numeric NOT NULL DEFAULT 0,
  hit_probability numeric NOT NULL DEFAULT 0,
  confidence text NOT NULL DEFAULT 'Low',
  edge_score integer NOT NULL DEFAULT 1 CHECK (edge_score >= 1 AND edge_score <= 10),
  prediction text NOT NULL DEFAULT 'MISS',

  main_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  what_changed_today jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden_edge text NOT NULL DEFAULT '',
  trap_warning boolean NOT NULL DEFAULT false,
  trap_warning_reason text NOT NULL DEFAULT '',

  simulation_low numeric NOT NULL DEFAULT 0,
  simulation_high numeric NOT NULL DEFAULT 0,
  estimated_hit_frequency numeric NOT NULL DEFAULT 0,
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,

  data_quality text NOT NULL DEFAULT 'Low',
  best_time_to_bet text NOT NULL DEFAULT 'Wait',
  final_verdict text NOT NULL DEFAULT 'Pass',

  input_snapshot jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bet_intelligence_reports_user_id_created_at_idx
  ON public.bet_intelligence_reports (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bet_intelligence_reports_bet_id_idx
  ON public.bet_intelligence_reports (bet_id)
  WHERE bet_id IS NOT NULL;

COMMENT ON TABLE public.bet_intelligence_reports IS 'Saved Bet Intelligence analysis reports (NBA, user-scoped).';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_bet_intelligence_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bet_intelligence_reports_set_updated_at ON public.bet_intelligence_reports;
CREATE TRIGGER bet_intelligence_reports_set_updated_at
  BEFORE UPDATE ON public.bet_intelligence_reports
  FOR EACH ROW
  -- Use PROCEDURE for broad Postgres compatibility. If your host errors, try: EXECUTE FUNCTION ... instead.
  EXECUTE PROCEDURE public.set_bet_intelligence_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.bet_intelligence_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own intelligence reports" ON public.bet_intelligence_reports;
DROP POLICY IF EXISTS "Users can insert own intelligence reports" ON public.bet_intelligence_reports;
DROP POLICY IF EXISTS "Users can update own intelligence reports" ON public.bet_intelligence_reports;
DROP POLICY IF EXISTS "Users can delete own intelligence reports" ON public.bet_intelligence_reports;

CREATE POLICY "Users can view own intelligence reports"
  ON public.bet_intelligence_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intelligence reports"
  ON public.bet_intelligence_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intelligence reports"
  ON public.bet_intelligence_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own intelligence reports"
  ON public.bet_intelligence_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Optional seed examples (commented — uncomment and replace user_id to test)
-- ---------------------------------------------------------------------------
-- INSERT INTO public.bet_intelligence_reports (
--   user_id, pick_text, player_name, team, opponent, market_type, over_under, line, opening_line, current_odds,
--   projection, hit_probability, confidence, edge_score, prediction, main_reasons, what_changed_today,
--   hidden_edge, trap_warning, trap_warning_reason, simulation_low, simulation_high, estimated_hit_frequency,
--   risk_flags, data_quality, best_time_to_bet, final_verdict
-- ) VALUES (
--   'YOUR_USER_UUID',
--   'J. Tatum Over 27.5 Points',
--   'Jayson Tatum', 'BOS', 'MIA', 'points', 'over', 27.5, 26.5, -108,
--   28.4, 0.54, 'Medium', 6, 'HIT',
--   '["Mild line value vs opening","Stable minutes role","Matchup pace neutral"]'::jsonb,
--   '["Line steamed up 1.0 pt","No new injury flags in manual notes"]'::jsonb,
--   'Books may be slow to price a quiet usage bump if a secondary creator is out.',
--   false, '',
--   24.2, 32.8, 0.52,
--   '["Blowout risk if spread widens"]'::jsonb,
--   'Medium', 'Wait', 'Lean'
-- );
