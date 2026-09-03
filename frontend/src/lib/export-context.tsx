'use client';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface ExportMemberRow {
  name: string;
  role: string;
  assigned: number;
  done: number;
  inProgress: number;
  completionPct: number;
}

export interface ExportProjectRow {
  name: string;
  status: string;
  totalIssues: number;
  openIssues: number;
  completionPct: number;
}

export interface ExportOverviewMetric {
  label: string;
  value: number;
}

export interface ExportData {
  dateRange: string;
  generatedAt: string;
  generatedBy: string;
  activeTab: string;
  metrics: ExportOverviewMetric[];
  projects: ExportProjectRow[];
  members: ExportMemberRow[];
}

interface ExportContextValue {
  data: ExportData | null;
  setData: (data: ExportData | null) => void;
}

const ExportContext = createContext<ExportContextValue>({
  data: null,
  setData: () => {},
});

export function useExportData() {
  return useContext(ExportContext);
}

export function ExportProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ExportData | null>(null);
  const value = useMemo(() => ({ data, setData }), [data]);
  return <ExportContext.Provider value={value}>{children}</ExportContext.Provider>;
}