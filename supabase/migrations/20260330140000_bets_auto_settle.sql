-- Auto-settlement metadata for NBA player props (synced by Edge Function + balldontlie).
ALTER TABLE public.bets
  ADD COLUMN IF NOT EXISTS auto_settle_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stats_player_id integer NULL,
  ADD COLUMN IF NOT EXISTS stats_game_id integer NULL,
  ADD COLUMN IF NOT EXISTS last_auto_settle_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS auto_settle_error text NULL;

COMMENT ON COLUMN public.bets.auto_settle_enabled IS 'When true, sync-bet-settlements grades this row from NBA box scores.';
COMMENT ON COLUMN public.bets.stats_player_id IS 'balldontlie NBA player id (optional; improves matching).';
COMMENT ON COLUMN public.bets.stats_game_id IS 'balldontlie NBA game id cache after first resolution.';
