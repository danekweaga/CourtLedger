import { CourtLedgerLogo } from "../branding/CourtLedgerLogo";

interface PublicHomeProps {
  onContinue: () => void;
}

export function PublicHome({ onContinue }: PublicHomeProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-12">
        <section className="space-y-5">
          <CourtLedgerLogo className="mx-auto h-24 w-full max-w-xs md:h-28" />
          <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-6xl">Track NBA Bets Like a Pro</h1>
          <p className="max-w-2xl text-sm text-on-surface-variant md:text-base">
            Log your positions, monitor live progress, measure ROI, and export your ledger in one tactical dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onContinue}
              className="rounded-full bg-gradient-to-r from-primary to-primary-container px-6 py-3 text-sm font-bold text-[#002109] hover:opacity-90"
            >
              Continue to Login
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCard title="Live Tracking" text="Follow active NBA bets with progress, hit states, and stream links." />
          <FeatureCard title="Profit Analytics" text="Understand performance with ROI, win-rate, and market-level insights." />
          <FeatureCard title="Export Ready" text="Download CSV/XLSX reports for tax season and personal analysis." />
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-xl border border-outline-variant/20 bg-surface-container p-5">
      <h2 className="font-headline text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-on-surface-variant">{text}</p>
    </article>
  );
}
