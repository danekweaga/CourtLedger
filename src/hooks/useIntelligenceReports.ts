import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { deleteIntelligenceReport, fetchIntelligenceReports, saveIntelligenceReport } from "../lib/betIntelligenceService";
import type { BetIntelligenceReportRow, BetIntelligenceScenarioInput, IntelligenceReportResult } from "../types/betIntelligence";

export function useIntelligenceReports(userId: string) {
  const [reports, setReports] = useState<BetIntelligenceReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchIntelligenceReports(userId);
      setReports(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load intelligence reports.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveReport = useCallback(
    async (input: BetIntelligenceScenarioInput, report: IntelligenceReportResult, betId: string | null) => {
      setSaving(true);
      try {
        const row = await saveIntelligenceReport(userId, betId, input, report);
        setReports((prev) => [row, ...prev]);
        toast.success("Report saved.");
        return row;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed.");
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [userId],
  );

  const removeReport = useCallback(
    async (id: string) => {
      try {
        await deleteIntelligenceReport(userId, id);
        setReports((prev) => prev.filter((r) => r.id !== id));
        toast.success("Report deleted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed.");
      }
    },
    [userId],
  );

  return { reports, loading, saving, reload: load, saveReport, removeReport };
}
