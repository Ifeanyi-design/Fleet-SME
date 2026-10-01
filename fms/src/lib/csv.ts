/**
 * Minimal CSV serialisation for report exports.
 * Handles the characters that actually break CSVs — commas, quotes and newlines —
 * and prepends a UTF-8 BOM so Excel opens ₦ and accented characters correctly.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Build an RFC-4180-ish CSV string (CRLF line endings). */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(',');
  const body = rows
    .map((row) => columns.map((column) => escapeCell(column.value(row))).join(','))
    .join('\r\n');
  return body ? `${header}\r\n${body}` : header;
}

/** Trigger a client-side download of a CSV string. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Timestamped export filename, e.g. `fleet-report-2026-10-01.csv`. */
export function reportFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}

/**
 * Minimal RFC-4180 CSV parser.
 *
 * Handles quoted fields, escaped quotes (""), commas and newlines inside quotes, CRLF,
 * and a leading UTF-8 BOM (which Excel adds). Returns a row-major array; fully blank
 * rows are dropped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  // Strip a BOM if the file came from Excel.
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  let i = 0;

  while (i < source.length) {
    const char = source.charAt(i);

    if (inQuotes) {
      if (char === '"') {
        if (source.charAt(i + 1) === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

/**
 * Map parsed CSV rows onto typed records using a header row.
 * Header names are matched case-insensitively and with spaces/underscores ignored, so
 * `Pickup Address`, `pickup_address` and `pickupaddress` all resolve to the same column.
 */
export function csvRowsToObjects(
  rows: string[][],
  aliases: Record<string, string[]>,
): Array<Record<string, string>> {
  const [headerRow, ...bodyRows] = rows;
  if (!headerRow) return [];

  const normalise = (value: string) => value.trim().toLowerCase().replace(/[\s_-]/g, '');

  // Build a lookup: normalised header -> logical field name.
  const headerToField = new Map<string, string>();
  for (const [field, names] of Object.entries(aliases)) {
    for (const name of names) headerToField.set(normalise(name), field);
  }

  const fieldIndexes: Array<{ field: string; index: number }> = [];
  headerRow.forEach((header, index) => {
    const field = headerToField.get(normalise(header));
    if (field) fieldIndexes.push({ field, index });
  });

  return bodyRows.map((cells) => {
    // Pre-seed every known field so a column missing from the header yields "" rather
    // than undefined — callers can then treat every field as a string.
    const record: Record<string, string> = {};
    for (const field of Object.keys(aliases)) record[field] = '';

    for (const { field, index } of fieldIndexes) {
      record[field] = (cells[index] ?? '').trim();
    }
    return record;
  });
}

