import { useEffect } from 'react';
import type { Vehicle } from '@/types/domain';
import { vehicleSchema, VEHICLE_STATUSES, VEHICLE_TYPES, type VehicleFormValues } from '@/lib/validators';
import { errorMessage } from '@/lib/errors';
import { useZodForm } from '@/hooks/useZodForm';
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/useMutations';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

/** FR1 / PRD TC01 — register or modify a vehicle. */

const EMPTY: VehicleFormValues = {
  registrationNumber: '',
  make: '',
  model: '',
  vehicleType: 'bike',
  odometer: Number.NaN,
  status: 'available',
};

const TYPE_OPTIONS = VEHICLE_TYPES.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

const STATUS_OPTIONS = VEHICLE_STATUSES.map((s) => ({
  value: s,
  label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export interface VehicleFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pass a vehicle to edit; omit (or null) to register a new one. */
  vehicle?: Vehicle | null;
}

export function VehicleFormDialog({ open, onClose, vehicle = null }: VehicleFormDialogProps) {
  const isEdit = vehicle !== null;

  const form = useZodForm(vehicleSchema, EMPTY);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    form.reset(
      vehicle
        ? {
            registrationNumber: vehicle.registrationNumber,
            make: vehicle.make,
            model: vehicle.model,
            vehicleType: vehicle.vehicleType,
            odometer: vehicle.odometer,
            status: vehicle.status,
          }
        : EMPTY,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle?.vehicleId]);

  const busy = createVehicle.isPending || updateVehicle.isPending;

  async function handleSubmit() {
    const data = form.validate();
    if (!data) return;

    form.setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateVehicle.mutateAsync({ vehicleId: vehicle.vehicleId, input: data })
        : await createVehicle.mutateAsync(data);

      toast({
        variant: 'success',
        title: isEdit ? 'Vehicle updated' : 'Vehicle registered',
        description: `${saved.registrationNumber} ${isEdit ? 'was updated.' : 'was added to the fleet.'}`,
      });
      onClose();
    } catch (err) {
      toast({
        variant: 'error',
        title: isEdit ? 'Could not update vehicle' : 'Could not register vehicle',
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
      title={isEdit ? 'Edit Vehicle' : 'Register New Vehicle'}
      description={
        isEdit ? 'Modify this fleet asset record.' : 'Add a vehicle to the fleet asset register.'
      }
      dismissible={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={form.submitting || busy}>
            {isEdit ? 'Save changes' : 'Register vehicle'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Registration number"
          htmlFor="reg"
          required
          error={form.errors.registrationNumber}
          className="sm:col-span-2"
        >
          <Input
            id="reg"
            placeholder="e.g. IBD-452-XY"
            value={form.values.registrationNumber}
            invalid={Boolean(form.errors.registrationNumber)}
            onChange={(e) => form.setField('registrationNumber', e.target.value)}
            className="font-mono uppercase"
          />
        </Field>

        <Field label="Make" htmlFor="make" required error={form.errors.make}>
          <Input
            id="make"
            placeholder="e.g. Bajaj"
            value={form.values.make}
            invalid={Boolean(form.errors.make)}
            onChange={(e) => form.setField('make', e.target.value)}
          />
        </Field>

        <Field label="Model" htmlFor="model" required error={form.errors.model}>
          <Input
            id="model"
            placeholder="e.g. Boxer BM150"
            value={form.values.model}
            invalid={Boolean(form.errors.model)}
            onChange={(e) => form.setField('model', e.target.value)}
          />
        </Field>

        <Field label="Vehicle type" htmlFor="type" required error={form.errors.vehicleType}>
          <Select
            id="type"
            options={TYPE_OPTIONS}
            value={form.values.vehicleType}
            invalid={Boolean(form.errors.vehicleType)}
            onChange={(e) =>
              form.setField('vehicleType', e.target.value as VehicleFormValues['vehicleType'])
            }
          />
        </Field>

        <Field
          label="Odometer reading (km)"
          htmlFor="odometer"
          required
          error={form.errors.odometer}
        >
          <Input
            id="odometer"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={Number.isNaN(form.values.odometer) ? '' : String(form.values.odometer)}
            invalid={Boolean(form.errors.odometer)}
            onChange={(e) =>
              form.setField('odometer', e.target.value === '' ? Number.NaN : Number(e.target.value))
            }
          />
        </Field>

        <Field
          label="Operational status"
          htmlFor="status"
          error={form.errors.status}
          helper="Newly registered vehicles default to Available."
          className="sm:col-span-2"
        >
          <Select
            id="status"
            options={STATUS_OPTIONS}
            value={form.values.status}
            onChange={(e) =>
              form.setField('status', e.target.value as VehicleFormValues['status'])
            }
          />
        </Field>
      </div>
    </Dialog>
  );
}
