'use client';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type DateRange = 'today' | '7d' | '30d' | 'all';

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time',
};

interface DateRangeContextValue {
  range: DateRange;
  setRange: (range: DateRange) => void;
}

const DateRangeContext = createContext<DateRangeContextValue>({
  range: '30d',
  setRange: () => {},
});

export function useDateRange() {
  return useContext(DateRangeContext);
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>('30d');
  const value = useMemo(() => ({ range, setRange }), [range]);
  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}