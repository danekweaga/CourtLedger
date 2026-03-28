import type { Bet } from "../types/bets";
import { EXPORT_COLUMNS, toExportRow } from "./exportColumns";

function escapeCsvValue(value: string | number | null) {
  if (value === null) {
    return "";
  }
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(bets: Bet[]): string {
  const headers = EXPORT_COLUMNS.join(",");
  const rows = bets.map((bet) => {
    const row = toExportRow(bet);
    return EXPORT_COLUMNS.map((key) => escapeCsvValue(row[key])).join(",");
  });
  return [headers, ...rows].join("\n");
}

export function downloadCsv(filename: string, bets: Bet[]) {
  const csv = buildCsv(bets);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
