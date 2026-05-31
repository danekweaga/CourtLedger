interface CourtLedgerLogoProps {
  variant?: "full" | "icon";
  className?: string;
}

export function CourtLedgerLogo({ variant = "full", className = "" }: CourtLedgerLogoProps) {
  const src = variant === "icon" ? "/favicon.png" : "/court-ledger-logo.png";

  return (
    <img
      src={src}
      alt="CourtLedger"
      className={className}
      decoding="async"
    />
  );
}
