import { Download } from 'lucide-react';
import { downloadCsv, toCsv, type CsvColumn } from '@/lib/csv';
import { formatNumber } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/** Client-side CSV export (FR8 output design). */

export interface ExportButtonProps<T> {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
  label?: string;
  disabled?: boolean;
}

export function ExportButton<T>({
  rows,
  columns,
  filename,
  label = 'Export CSV',
  disabled = false,
}: ExportButtonProps<T>) {
  const { toast } = useToast();

  function handleExport() {
    if (rows.length === 0) return;
    downloadCsv(filename, toCsv(rows, columns));
    toast({
      variant: 'success',
      title: 'Export ready',
      description: `${formatNumber(rows.length)} rows written to ${filename}.`,
    });
  }

  return (
    <Button
      variant="secondary"
      leftIcon={<Download className="size-4" />}
      onClick={handleExport}
      disabled={disabled || rows.length === 0}
      title={rows.length === 0 ? 'Nothing to export' : `Export ${rows.length} rows`}
    >
      {label}
    </Button>
  );
}
