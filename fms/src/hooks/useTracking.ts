import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

/** FR9 — public tracking lookup by code. */
export function useTracking(trackingCode: string) {
  const code = trackingCode.trim();
  return useQuery({
    queryKey: queryKeys.tracking(code.toUpperCase()),
    queryFn: () => api.getTracking(code),
    enabled: code.length >= 4,
    retry: false,
  });
}
