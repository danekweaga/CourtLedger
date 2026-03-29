import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

interface SettingsPageProps {
  session: Session;
}

export function SettingsPage({ session }: SettingsPageProps) {
  const [defaultUnit, setDefaultUnit] = useState("1");
  const [defaultStake, setDefaultStake] = useState("25");
  const [showOnlyNba, setShowOnlyNba] = useState(true);

  useEffect(() => {
    const storedUnit = localStorage.getItem("courtledger.defaultUnit");
    const storedStake = localStorage.getItem("courtledger.defaultStake");
    const storedSport = localStorage.getItem("courtledger.showOnlyNba");
    if (storedUnit) {
      setDefaultUnit(storedUnit);
    }
    if (storedStake) {
      setDefaultStake(storedStake);
    }
    if (storedSport) {
      setShowOnlyNba(storedSport === "true");
    }
  }, []);

  function savePreferences() {
    localStorage.setItem("courtledger.defaultUnit", defaultUnit);
    localStorage.setItem("courtledger.defaultStake", defaultStake);
    localStorage.setItem("courtledger.showOnlyNba", String(showOnlyNba));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-outline-variant/20 bg-surface-container p-6">
        <h3 className="font-headline text-xl font-bold">Account</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">Email</p>
            <p className="mt-1 text-sm text-on-surface">{session.user.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">User ID</p>
            <p className="mt-1 break-all text-sm text-on-surface">{session.user.id}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant/20 bg-surface-container p-6">
        <h3 className="font-headline text-xl font-bold">Betting Preferences</h3>
        <p className="mt-1 text-sm text-on-surface-variant">These are local device preferences for faster bet entry.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-on-surface-variant">Default Units</span>
            <input
              type="number"
              step="0.1"
              value={defaultUnit}
              onChange={(event) => setDefaultUnit(event.target.value)}
              className="w-full rounded-lg border-none bg-surface-container-lowest px-3 py-2 text-sm text-on-surface ring-1 ring-transparent focus:ring-primary/40"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-on-surface-variant">Default Stake ($)</span>
            <input
              type="number"
              step="0.01"
              value={defaultStake}
              onChange={(event) => setDefaultStake(event.target.value)}
              className="w-full rounded-lg border-none bg-surface-container-lowest px-3 py-2 text-sm text-on-surface ring-1 ring-transparent focus:ring-primary/40"
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-on-surface">
          <input type="checkbox" checked={showOnlyNba} onChange={(event) => setShowOnlyNba(event.target.checked)} />
          Show NBA-focused defaults only
        </label>

        <button
          type="button"
          onClick={savePreferences}
          className="mt-5 rounded-full bg-gradient-to-r from-primary to-primary-container px-5 py-2 text-sm font-bold text-[#002109]"
        >
          Save Preferences
        </button>
      </section>
    </div>
  );
}
