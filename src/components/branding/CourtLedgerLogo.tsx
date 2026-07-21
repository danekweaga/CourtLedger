interface CourtLedgerLogoProps {
  variant?: "full" | "icon";
  className?: string;
}

export function CourtLedgerLogo({ variant = "full", className = "" }: CourtLedgerLogoProps) {
  if (variant === "icon") {
    return (
      <img
        src="/court-ledger-logo.png"
        alt="CourtLedger"
        className={`shrink-0 object-cover object-top ${className}`}
        decoding="async"
      />
    );
  }

  return (
    <img
      src="/court-ledger-logo.png"
      alt="CourtLedger"
      className={`block max-w-full object-contain ${className}`}
      decoding="async"
    />
  );
}
