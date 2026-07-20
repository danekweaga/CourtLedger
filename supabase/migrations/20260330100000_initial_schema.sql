-- CourtLedger: core schema, keepalive ping table, and RLS for user-owned tables.
-- Safe to re-run in SQL Editor (uses IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ---------------------------------------------------------------------------
-- Table: bets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  date_placed date NOT NULL DEFAULT CURRENT_DATE,
  game_date date NOT NULL,
  matchup text NOT NULL DEFAULT '',
  sportsbook text NOT NULL DEFAULT '',

  player_name text NOT NULL DEFAULT '',
  team text NOT NULL DEFAULT '',
  opponent text NOT NULL DEFAULT '',

  bet_category text NOT NULL DEFAULT 'player_prop',
  market_type text NOT NULL DEFAULT 'points',
  over_under text,
  line numeric,
  odds integer NOT NULL DEFAULT -110,
  stake numeric NOT NULL DEFAULT 0,
  potential_payout numeric NOT NULL DEFAULT 0,

  result_status text NOT NULL DEFAULT 'pending',
  live_status text NOT NULL DEFAULT 'not_started',
  current_stat_value numeric,
  target_remaining numeric,

  notes text,
  stream_url text,
  stat_source_url text,
  is_parlay_leg boolean NOT NULL DEFAULT false,
  bet_timing text NOT NULL DEFAULT 'pregame',
  season text,
  season_type text,
  is_free_bet boolean NOT NULL DEFAULT false,
  promo_toggle boolean NOT NULL DEFAULT false,
  cash_out_amount numeric,
  units_staked numeric,
  game_status text,
  player_active_status text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bets_user_id_date_placed_idx
  ON public.bets (user_id, date_placed DESC);

CREATE INDEX IF NOT EXISTS bets_user_id_result_status_idx
  ON public.bets (user_id, result_status);

-- ---------------------------------------------------------------------------
-- Table: profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Table: live_stats_cache
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_stats_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bet_id uuid NOT NULL REFERENCES public.bets (id) ON DELETE CASCADE,
  current_stat_value numeric NOT NULL DEFAULT 0,
  live_status text NOT NULL DEFAULT 'not_started',
  game_status text,
  player_active_status text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bet_id, user_id)
);

ALTER TABLE public.live_stats_cache
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS bet_id uuid REFERENCES public.bets (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS current_stat_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS live_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS game_status text,
  ADD COLUMN IF NOT EXISTS player_active_status text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'live_stats_cache'
      AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS live_stats_cache_user_id_idx
      ON public.live_stats_cache (user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Table: keepalive_ping (anon-readable; no user data)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.keepalive_ping (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pinged_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.keepalive_ping (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bets_set_updated_at ON public.bets;
CREATE TRIGGER bets_set_updated_at
  BEFORE UPDATE ON public.bets
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: bets
-- ---------------------------------------------------------------------------
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can insert own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can update own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can delete own bets" ON public.bets;

CREATE POLICY "Users can view own bets"
  ON public.bets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets"
  ON public.bets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bets"
  ON public.bets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bets"
  ON public.bets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- RLS: live_stats_cache
-- ---------------------------------------------------------------------------
ALTER TABLE public.live_stats_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'live_stats_cache'
      AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users can view own live stats" ON public.live_stats_cache;
    DROP POLICY IF EXISTS "Users can insert own live stats" ON public.live_stats_cache;
    DROP POLICY IF EXISTS "Users can update own live stats" ON public.live_stats_cache;
    DROP POLICY IF EXISTS "Users can delete own live stats" ON public.live_stats_cache;

    CREATE POLICY "Users can view own live stats"
      ON public.live_stats_cache
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own live stats"
      ON public.live_stats_cache
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own live stats"
      ON public.live_stats_cache
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete own live stats"
      ON public.live_stats_cache
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS: keepalive_ping (read-only ping; no secrets or user data)
-- ---------------------------------------------------------------------------
ALTER TABLE public.keepalive_ping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read keepalive ping" ON public.keepalive_ping;

CREATE POLICY "Anyone can read keepalive ping"
  ON public.keepalive_ping
  FOR SELECT
  TO anon, authenticated
  USING (true);
