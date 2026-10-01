import { useRef, useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import type { CustomerImportResult } from '@/types/domain';
import { csvRowsToObjects, downloadCsv, parseCsv } from '@/lib/csv';
import { errorMessage } from '@/lib/errors';
import { customerSchema } from '@/lib/validators';
import { useImportCustomers } from '@/hooks/useReferenceData';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

/**
 * FR3 — bulk customer import from a CSV (or an Excel sheet saved as CSV).
 *
 * The file is parsed in the browser and validated row by row, so the user sees what will
 * be imported (and what is malformed) before anything is written. The API also validates
 * per row, so a single bad line never blocks the rest of the sheet.
 */

const ALIASES = {
  name: ['name', 'customer', 'customer name', 'business', 'business name'],
  phone: ['phone', 'phone number', 'phonenumber', 'tel', 'telephone', 'mobile'],
  address: ['address', 'pickup address', 'pickupaddress', 'pickup', 'location'],
};

const TEMPLATE_CSV =
  'name,phone,address\r\n' +
  'Ada Fashion House,+2348021114455,"12 Adeniran Ogunsanya St, Surulere, Lagos"\r\n' +
  'HealthPlus Pharmacy,+2348092226611,"45 Awolowo Road, Ikoyi, Lagos"\r\n';

interface ParsedRow {
  name: string;
  phone: string;
  address: string;
  valid: boolean;
  problem?: string;
}

export interface CustomerImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CustomerImportDialog({ open, onClose }: CustomerImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<CustomerImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const importCustomers = useImportCustomers();
  const { toast } = useToast();

  function reset() {
    setRows([]);
    setFileName('');
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const objects = csvRowsToObjects(parseCsv(text), ALIASES);

      if (objects.length === 0) {
        setParseError(
          'No rows found. The file needs a header row containing name, phone and address.',
        );
        setRows([]);
        return;
      }

      const parsed: ParsedRow[] = objects.map((row) => {
        const candidate = {
          name: row.name ?? '',
          phone: row.phone ?? '',
          address: row.address ?? '',
        };
        const check = customerSchema.safeParse(candidate);
        return {
          ...candidate,
          valid: check.success,
          ...(check.success ? {} : { problem: check.error.issues[0]?.message ?? 'Invalid row' }),
        };
      });

      setRows(parsed);
    } catch (err) {
      setParseError(errorMessage(err, 'Could not read that file.'));
    }
  }

  async function handleImport() {
    const valid = rows.filter((row) => row.valid).map(({ name, phone, address }) => ({
      name,
      phone,
      address,
    }));
    if (valid.length === 0) return;

    try {
      const outcome = await importCustomers.mutateAsync(valid);
      setResult(outcome);
      toast({
        variant: outcome.created > 0 ? 'success' : 'warning',
        title: `${outcome.created} customer(s) imported`,
        description: outcome.skipped
          ? `${outcome.skipped} already existed and were skipped.`
          : 'All valid rows were added.',
      });
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Import failed',
        description: errorMessage(err),
      });
    }
  }

  const validCount = rows.filter((row) => row.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Import Customers"
      description="Upload a CSV with name, phone and address columns."
      size="lg"
      dismissible={!importCustomers.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={importCustomers.isPending}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              loading={importCustomers.isPending}
              disabled={validCount === 0}
              leftIcon={<Upload className="size-4" />}
            >
              Import {validCount > 0 ? `${validCount} customer(s)` : ''}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Step 1 — choose a file */}
        <div className="rounded-control border border-dashed border-hairline-strong bg-surface-sunken px-4 py-5 text-center">
          <FileSpreadsheet className="mx-auto mb-2 size-6 text-ink-muted" aria-hidden />
          <p className="text-[13px] font-medium text-ink-primary">
            {fileName || 'No file chosen'}
          </p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            Columns: <span className="font-mono">name</span>,{' '}
            <span className="font-mono">phone</span>, <span className="font-mono">address</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Upload className="size-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              leftIcon={<Download className="size-4" />}
              onClick={() => downloadCsv('customer-import-template.csv', TEMPLATE_CSV)}
            >
              Download template
            </Button>
          </div>
        </div>

        {parseError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-control border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{parseError}</span>
          </div>
        )}

        {/* Step 2 — preview */}
        {rows.length > 0 && !result && (
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="font-medium text-ink-primary">{rows.length} row(s) read</span>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                {validCount} ready
              </span>
              {invalidCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {invalidCount} will be skipped
                </span>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto rounded-control border border-hairline">
              <table className="w-full text-left text-[13px]">
                <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm">
                  <tr>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                      Name
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F2F4]">
                  {rows.slice(0, 25).map((row, index) => (
                    <tr key={index} className={row.valid ? undefined : 'bg-red-50/60'}>
                      <td className="px-3 py-2 text-ink-body">{row.name || '—'}</td>
                      <td className="px-3 py-2 tabular-nums text-ink-body">{row.phone || '—'}</td>
                      <td className="px-3 py-2 text-ink-body">
                        {row.address || '—'}
                        {!row.valid && row.problem && (
                          <span className="mt-0.5 block text-xs text-red-600">{row.problem}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 25 && (
              <p className="mt-1.5 text-xs text-ink-muted">
                Showing the first 25 of {rows.length} rows.
              </p>
            )}
          </div>
        )}

        {/* Step 3 — outcome */}
        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-chip bg-surface-sunken px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Imported
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-brand-700">
                  {result.created}
                </p>
              </div>
              <div className="rounded-chip bg-surface-sunken px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Skipped
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-ink-secondary">
                  {result.skipped}
                </p>
              </div>
              <div className="rounded-chip bg-surface-sunken px-3 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Rejected
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-ink-secondary">
                  {result.errors.length}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-control border border-red-200 bg-red-50 px-3.5 py-3">
                {result.errors.map((error) => (
                  <li key={error.row} className="text-[13px] text-red-700">
                    <span className="font-medium">Row {error.row}:</span> {error.message}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-ink-secondary">
              Skipped rows already existed (matched on name + phone).
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
