import { useEffect, useMemo } from 'react';
import { maintenanceSchema, type MaintenanceFormValues } from '@/lib/validators';
import { errorMessage } from '@/lib/errors';
import { useZodForm } from '@/hooks/useZodForm';
import { useCreateMaintenance } from '@/hooks/useMutations';
import { useVehicles } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';

/** FR6 / PRD TC05 — Log Maintenance form. */

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialValues(vehicleId?: number): MaintenanceFormValues {
  return {
    vehicleId: vehicleId ?? Number.NaN,
    serviceDate: today(),
    odometer: null,
    description: '',
    cost: Number.NaN,
    nextDueDate: '',
  };
}

export interface MaintenanceFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-select a vehicle (used from the vehicle detail page). */
  defaultVehicleId?: number;
}

export function MaintenanceFormDialog({
  open,
  onClose,
  defaultVehicleId,
}: MaintenanceFormDialogProps) {
  const form = useZodForm(maintenanceSchema, initialValues(defaultVehicleId));
  const vehiclesQuery = useVehicles();
  const createMaintenance = useCreateMaintenance();
  const { toast } = useToast();

  useEffect(() => {
    if (open) form.reset(initialValues(defaultVehicleId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultVehicleId]);

  const vehicleOptions = useMemo(
    () => [
      { value: '', label: 'Select a vehicle…' },
      ...(vehiclesQuery.data ?? []).map((v) => ({
        value: String(v.vehicleId),
        label: `${v.registrationNumber} — ${v.make} ${v.model}`,
      })),
    ],
    [vehiclesQuery.data],
  );

  async function handleSubmit() {
    const data = form.validate();
    if (!data) return;

    form.setSubmitting(true);
    try {
      await createMaintenance.mutateAsync(data);
      toast({
        variant: 'success',
        title: 'Maintenance logged',
        description: 'The service event was recorded against the vehicle.',
      });
      onClose();
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Could not log maintenance',
        description: errorMessage(err),
      });
    } finally {
      form.setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Log Maintenance"
      description="Record a workshop service event and schedule the next one."
      dismissible={!form.submitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={form.submitting}>
            Save log
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Vehicle"
          htmlFor="mVehicle"
          required
          error={form.errors.vehicleId}
          className="sm:col-span-2"
        >
          <Select
            id="mVehicle"
            options={vehicleOptions}
            value={Number.isNaN(form.values.vehicleId) ? '' : String(form.values.vehicleId)}
            invalid={Boolean(form.errors.vehicleId)}
            disabled={vehiclesQuery.isLoading}
            onChange={(e) =>
              form.setField('vehicleId', e.target.value === '' ? Number.NaN : Number(e.target.value))
            }
          />
        </Field>

        <Field
          label="Service date"
          htmlFor="mServiceDate"
          required
          error={form.errors.serviceDate}
        >
          <Input
            id="mServiceDate"
            type="date"
            value={form.values.serviceDate}
            invalid={Boolean(form.errors.serviceDate)}
            onChange={(e) => form.setField('serviceDate', e.target.value)}
          />
        </Field>

        <Field
          label="Odometer reading (km)"
          htmlFor="mOdometer"
          error={form.errors.odometer}
          helper="Optional — the reading at service time (FR6)."
        >
          <Input
            id="mOdometer"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="e.g. 12500"
            value={form.values.odometer === null ? '' : String(form.values.odometer)}
            invalid={Boolean(form.errors.odometer)}
            onChange={(e) =>
              form.setField('odometer', e.target.value === '' ? null : Number(e.target.value))
            }
          />
        </Field>

        <Field label="Cost (₦)" htmlFor="mCost" required error={form.errors.cost}>
          <Input
            id="mCost"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
            value={Number.isNaN(form.values.cost) ? '' : String(form.values.cost)}
            invalid={Boolean(form.errors.cost)}
            onChange={(e) =>
              form.setField('cost', e.target.value === '' ? Number.NaN : Number(e.target.value))
            }
          />
        </Field>

        <Field
          label="Work description"
          htmlFor="mDescription"
          required
          error={form.errors.description}
          className="sm:col-span-2"
        >
          <Textarea
            id="mDescription"
            placeholder="e.g. Engine Oil & Spark Plug Replacement"
            value={form.values.description}
            invalid={Boolean(form.errors.description)}
            onChange={(e) => form.setField('description', e.target.value)}
          />
        </Field>

        <Field
          label="Next service due"
          htmlFor="mNextDue"
          required
          error={form.errors.nextDueDate}
          helper="Drives the preventive maintenance alert."
          className="sm:col-span-2"
        >
          <Input
            id="mNextDue"
            type="date"
            value={form.values.nextDueDate}
            invalid={Boolean(form.errors.nextDueDate)}
            onChange={(e) => form.setField('nextDueDate', e.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
