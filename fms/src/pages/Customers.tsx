import { useMemo, useState } from 'react';
import { Pencil, Phone, Plus, Upload, Users } from 'lucide-react';
import type { Customer } from '@/types/domain';
import { isMockData } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomers } from '@/hooks/useReferenceData';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconButton } from '@/components/ui/IconButton';
import { FilterBar } from '@/components/modules/shared/FilterBar';
import { DataTable, type Column } from '@/components/modules/shared/DataTable';
import { CustomerFormDialog } from '@/components/modules/dispatch/CustomerFormDialog';
import { CustomerImportDialog } from '@/components/modules/customers/CustomerImportDialog';

/**
 * Customers (FR3).
 *
 * A customer is the *sending business*. Their registered address is the default pickup
 * point for their waybills; the recipient's drop-off is captured per delivery. In the
 * Case Organisation A scenario orders arrive by phone/WhatsApp, so the dispatch office
 * maintains this list — customers do not log in.
 */
export function Customers() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const query = useCustomers();

  const customers = useMemo(() => {
    const rows = query.data ?? [];
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((c) =>
      [c.name, c.phone, c.address].some((value) => value.toLowerCase().includes(term)),
    );
  }, [query.data, debouncedSearch]);

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      cell: (c) => <span className="text-sm font-medium text-ink-primary">{c.name}</span>,
      mobileLabel: 'Customer',
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (c) => (
        <a
          href={`tel:${c.phone}`}
          className="inline-flex items-center gap-1.5 text-[13px] tabular-nums text-brand-700 transition-colors hover:text-brand-800 hover:underline"
        >
          <Phone className="size-3.5" aria-hidden />
          {c.phone}
        </a>
      ),
      mobileLabel: 'Phone',
    },
    {
      key: 'address',
      header: 'Pickup address',
      cell: (c) => <span className="text-[13px] text-ink-body">{c.address}</span>,
      mobileLabel: 'Pickup',
    },
  ];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setFormOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="The businesses that send parcels. Their address is the default pickup point."
        breadcrumbs={[{ label: 'Customer' }, { label: 'Customers' }]}
        actions={
          <>
            {isMockData && <Badge variant="neutral">Demo data</Badge>}
            <Button
              variant="secondary"
              leftIcon={<Upload className="size-4" />}
              onClick={() => setImportOpen(true)}
            >
              Import CSV
            </Button>
            <Button leftIcon={<Plus className="size-4" />} onClick={openCreate}>
              Add customer
            </Button>
          </>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, phone or address…"
      />

      {query.isError ? (
        <ErrorState title="Could not load customers" onRetry={() => void query.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={customers}
          keyOf={(c) => c.customerId}
          loading={query.isLoading}
          pageSize={12}
          ariaLabel="Customers"
          emptyTitle={debouncedSearch ? 'No customers match your search' : 'No customers yet'}
          emptyDescription={
            debouncedSearch
              ? 'Try a different search term.'
              : 'Add one manually, or import a sheet with the Import CSV button.'
          }
          emptyAction={
            !debouncedSearch ? (
              <Button leftIcon={<Users className="size-4" />} onClick={openCreate}>
                Add your first customer
              </Button>
            ) : undefined
          }
          rowActions={(c) => (
            <IconButton label={`Edit ${c.name}`} onClick={() => openEdit(c)}>
              <Pencil className="size-4" />
            </IconButton>
          )}
        />
      )}

      <CustomerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        customer={editing}
      />
      <CustomerImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
