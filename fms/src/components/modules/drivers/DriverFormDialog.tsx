import { useEffect } from 'react';
import type { Driver } from '@/types/domain';
import { driverSchema, DRIVER_STATUSES, type DriverFormValues } from '@/lib/validators';
import { errorMessage } from '@/lib/errors';
import { useZodForm } from '@/hooks/useZodForm';
import { useCreateDriver, useUpdateDriver } from '@/hooks/useMutations';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

/** FR2 — enrol or update a driver. */

const EMPTY: DriverFormValues = {
  fullName: '',
  phoneNumber: '',
  licenseNumber: '',
  licenseExpiryDate: '',
  status: 'available',
};

const STATUS_OPTIONS = DRIVER_STATUSES.map((s) => ({
  value: s,
  label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export interface DriverFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pass a driver to edit; omit (or null) to enrol a new one. */
  driver?: Driver | null;
}

export function DriverFormDialog({ open, onClose, driver = null }: DriverFormDialogProps) {
  const isEdit = driver !== null;

  const form = useZodForm(driverSchema, EMPTY);
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    form.reset(
      driver
        ? {
            fullName: driver.fullName,
            phoneNumber: driver.phoneNumber,
            licenseNumber: driver.licenseNumber,
            licenseExpiryDate: driver.licenseExpiryDate,
            status: driver.status,
          }
        : EMPTY,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, driver?.driverId]);

  const busy = createDriver.isPending || updateDriver.isPending;

  async function handleSubmit() {
    const data = form.validate();
    if (!data) return;

    form.setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateDriver.mutateAsync({ driverId: driver.driverId, input: data })
        : await createDriver.mutateAsync(data);

      toast({
        variant: 'success',
        title: isEdit ? 'Driver updated' : 'Driver enrolled',
        description: `${saved.fullName} ${isEdit ? 'was updated.' : 'was added to the roster.'}`,
      });
      onClose();
    } catch (err) {
      toast({
        variant: 'error',
        title: isEdit ? 'Could not update driver' : 'Could not enrol driver',
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
      title={isEdit ? 'Edit Driver' : 'Enroll Driver'}
      description={
        isEdit
          ? 'Update this rider’s profile and licence details.'
          : 'Add a rider/driver to the roster with their licence details.'
      }
      dismissible={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={form.submitting || busy}>
            {isEdit ? 'Save changes' : 'Enroll driver'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          htmlFor="fullName"
          required
          error={form.errors.fullName}
          className="sm:col-span-2"
        >
          <Input
            id="fullName"
            placeholder="e.g. Musa Ibrahim"
            value={form.values.fullName}
            invalid={Boolean(form.errors.fullName)}
            onChange={(e) => form.setField('fullName', e.target.value)}
          />
        </Field>

        <Field label="Phone number" htmlFor="phone" required error={form.errors.phoneNumber}>
          <Input
            id="phone"
            type="tel"
            placeholder="+2348038039526"
            value={form.values.phoneNumber}
            invalid={Boolean(form.errors.phoneNumber)}
            onChange={(e) => form.setField('phoneNumber', e.target.value)}
          />
        </Field>

        <Field label="Licence number" htmlFor="licence" required error={form.errors.licenseNumber}>
          <Input
            id="licence"
            placeholder="DL-LAG-0000"
            value={form.values.licenseNumber}
            invalid={Boolean(form.errors.licenseNumber)}
            onChange={(e) => form.setField('licenseNumber', e.target.value)}
            className="font-mono uppercase"
          />
        </Field>

        <Field
          label="Licence expiry date"
          htmlFor="expiry"
          required
          error={form.errors.licenseExpiryDate}
        >
          <Input
            id="expiry"
            type="date"
            value={form.values.licenseExpiryDate}
            invalid={Boolean(form.errors.licenseExpiryDate)}
            onChange={(e) => form.setField('licenseExpiryDate', e.target.value)}
          />
        </Field>

        <Field label="Operational status" htmlFor="driverStatus" error={form.errors.status}>
          <Select
            id="driverStatus"
            options={STATUS_OPTIONS}
            value={form.values.status}
            onChange={(e) => form.setField('status', e.target.value as DriverFormValues['status'])}
          />
        </Field>
      </div>
    </Dialog>
  );
}
