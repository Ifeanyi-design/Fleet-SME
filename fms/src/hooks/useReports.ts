import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ReportFilters } from '@/lib/mockApi';

/** FR8 — filtered report rows + summary metrics. */
export function useReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports(filters),
    queryFn: () => api.getReport(filters),
    placeholderData: keepPreviousData,
  });
}
