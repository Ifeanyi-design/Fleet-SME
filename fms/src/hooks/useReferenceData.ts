import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CustomerInput } from '@/lib/mockDb';

/** Reference data for the delivery order form (FR3). */

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers(),
    queryFn: () => api.getCustomers(),
    staleTime: 5 * 60_000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => api.getProducts(),
    staleTime: 5 * 60_000,
  });
}

/** FR3 — register a new customer (sender) inline from the order form. */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => api.createCustomer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, input }: { customerId: number; input: Partial<CustomerInput> }) =>
      api.updateCustomer(customerId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

/** FR3 — bulk import from a parsed CSV/Excel sheet. */
export function useImportCustomers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customers: CustomerInput[]) => api.importCustomers(customers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
