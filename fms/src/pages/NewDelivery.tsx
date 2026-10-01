import { Dispatch } from '@/pages/Dispatch';

/**
 * `/dispatch/new` — the dispatch board with the New Order dialog open.
 * Keeping one board component avoids duplicating the queue + allocation logic.
 */
export function NewDelivery() {
  return <Dispatch initialFormOpen />;
}
