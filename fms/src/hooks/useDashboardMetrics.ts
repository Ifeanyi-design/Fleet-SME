import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { RangeKey } from '@/lib/mockApi';

/** FR8 — operational dashboard aggregate metrics. */
export function useDashboardMetrics(range: RangeKey = '30d') {
  return useQuery({
    queryKey: queryKeys.dashboard(range),
    queryFn: () => api.getDashboardMetrics(range),
    placeholderData: keepPreviousData,
  });
}
