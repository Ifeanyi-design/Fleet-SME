import { useEffect } from 'react';
import type { Customer } from '@/types/domain';
import { customerSchema, type CustomerFormValues } from '@/lib/validators';
import { errorMessage } from '@/lib/errors';
import { useZodForm } from '@/hooks/useZodForm';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useReferenceData';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';

/**
 * FR3 — add or edit a customer (the sending business).
 *
 * The customer is the *sender*: the address captured here becomes the default pickup
 * point for their waybills. Each waybill then carries its own recipient drop-off address,
 * because the PRD's schema has no recipient entity.
 */

const EMPTY: CustomerFormValues = { name: '', phone: '', address: '' };

export interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pass a customer to edit; omit (or null) to create. */
  customer?: Customer | null;
  /** Called with the created/updated customer. */
  onSaved?: (customer: Customer) => void;
}

export function CustomerFormDialog({
  open,
  onClose,
  customer = null,
  onSaved,
}: CustomerFormDialogProps) {
  const isEdit = customer !== null;

  const form = useZodForm(customerSchema, EMPTY);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    form.reset(
      customer
        ? { name: customer.name, phone: customer.phone, address: customer.address }
        : EMPTY,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?.customerId]);

  const busy = createCustomer.isPending || updateCustomer.isPending;

  async function handleSubmit() {
    const data = form.validate();
    if (!data) return;

    form.setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateCustomer.mutateAsync({ customerId: customer.customerId, input: data })
        : await createCustomer.mutateAsync(data);

      toast({
        variant: 'success',
        title: isEdit ? 'Customer updated' : 'Customer added',
        description: `${saved.name} is ready to be selected on delivery orders.`,
      });
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast({
        variant: 'error',
        title: isEdit ? 'Could not update customer' : 'Could not add customer',
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
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      description="The sending business. Their address becomes the default pickup point."
      dismissible={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={form.submitting || busy}>
            {isEdit ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Business / customer name" htmlFor="cName" required error={form.errors.name}>
          <Input
            id="cName"
            placeholder="e.g. Ada Fashion House"
            value={form.values.name}
            invalid={Boolean(form.errors.name)}
            onChange={(e) => form.setField('name', e.target.value)}
          />
        </Field>

        <Field label="Phone number" htmlFor="cPhone" required error={form.errors.phone}>
          <Input
            id="cPhone"
            type="tel"
            placeholder="+2348021114455"
            value={form.values.phone}
            invalid={Boolean(form.errors.phone)}
            onChange={(e) => form.setField('phone', e.target.value)}
          />
        </Field>

        <Field
          label="Pickup address"
          htmlFor="cAddress"
          required
          error={form.errors.address}
          helper="Where riders collect from — usually the business premises."
        >
          <Textarea
            id="cAddress"
            rows={2}
            placeholder="12 Adeniran Ogunsanya St, Surulere, Lagos"
            value={form.values.address}
            invalid={Boolean(form.errors.address)}
            onChange={(e) => form.setField('address', e.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
