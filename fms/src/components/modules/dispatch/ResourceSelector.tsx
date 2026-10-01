import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';

/**
 * Availability-aware resource picker (FR4).
 * Only resources currently flagged Available are offered — the server re-checks on
 * commit, so a stale list surfaces as a 409 conflict rather than a bad dispatch.
 */

export interface ResourceOption {
  id: number;
  primary: string;
  secondary: string;
}

export interface ResourceSelectorProps {
  label: string;
  htmlFor: string;
  value: number | null;
  onChange: (value: number | null) => void;
  options: ResourceOption[];
  placeholder: string;
  /** Shown when there are no available resources. */
  emptyHint: string;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
}

export function ResourceSelector({
  label,
  htmlFor,
  value,
  onChange,
  options,
  placeholder,
  emptyHint,
  loading = false,
  disabled = false,
  error,
}: ResourceSelectorProps) {
  const selectOptions = [
    { value: '', label: options.length === 0 ? emptyHint : placeholder },
    ...options.map((option) => ({
      value: String(option.id),
      label: `${option.primary} — ${option.secondary}`,
    })),
  ];

  return (
    <Field
      label={label}
      htmlFor={htmlFor}
      required
      error={error}
      helper={options.length === 0 && !loading ? emptyHint : undefined}
    >
      <Select
        id={htmlFor}
        options={selectOptions}
        value={value === null ? '' : String(value)}
        invalid={Boolean(error)}
        disabled={disabled || loading || options.length === 0}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </Field>
  );
}
