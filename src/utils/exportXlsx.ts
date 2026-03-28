import * as XLSX from "xlsx";
import type { Bet } from "../types/bets";
import { EXPORT_COLUMNS, toExportRow } from "./exportColumns";

export function downloadXlsx(filename: string, bets: Bet[]) {
  const rows = bets.map((bet) => toExportRow(bet));
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...EXPORT_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "CourtLedger");
  XLSX.writeFile(workbook, filename);
}
