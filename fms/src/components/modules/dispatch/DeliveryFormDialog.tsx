import { useEffect, useMemo, useState } from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import type { Customer } from '@/types/domain';
import {
  deliverySchema,
  type DeliveryFormValues,
  type DeliveryItemFormValues,
} from '@/lib/validators';
import { errorMessage } from '@/lib/errors';
import { useZodForm } from '@/hooks/useZodForm';
import { useCreateDelivery } from '@/hooks/useMutations';
import { useCustomers, useProducts } from '@/hooks/useReferenceData';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { CustomerFormDialog } from '@/components/modules/dispatch/CustomerFormDialog';

/**
 * FR3 — New delivery order with line items.
 *
 * The domain model, made explicit in the UI:
 *   CUSTOMER = the sending business. Their registered address is the default PICKUP.
 *   DROP-OFF = the recipient's address, captured per waybill (the PRD's 3NF schema has
 *              no recipient entity, so the recipient lives on the delivery).
 * So the pickup is prefilled and editable, and only the drop-off is typed fresh.
 */

const INITIAL: DeliveryFormValues = {
  customerId: Number.NaN,
  recipientName: '',
  recipientPhone: '',
  pickupAddress: '',
  dropoffAddress: '',
  items: [{ productId: Number.NaN, quantity: 1 }],
};

export interface DeliveryFormDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DeliveryFormDialog({ open, onClose }: DeliveryFormDialogProps) {
  const form = useZodForm(deliverySchema, INITIAL);
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const createDelivery = useCreateDelivery();
  const { toast } = useToast();

  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  useEffect(() => {
    if (open) form.reset(INITIAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const customerOptions = useMemo(
    () => [
      { value: '', label: 'Select a customer…' },
      ...(customersQuery.data ?? []).map((c) => ({
        value: String(c.customerId),
        label: `${c.name} — ${c.phone}`,
      })),
    ],
    [customersQuery.data],
  );

  const productOptions = useMemo(
    () => [
      { value: '', label: 'Select a product…' },
      ...(productsQuery.data ?? []).map((p) => ({
        value: String(p.productId),
        label: `${p.productName} (${p.category})`,
      })),
    ],
    [productsQuery.data],
  );

  /** Selecting a customer prefills the pickup address from their record. */
  function applyCustomer(customer: Customer) {
    form.setField('customerId', customer.customerId);
    form.setField('pickupAddress', customer.address);
  }

  function handleCustomerChange(value: string) {
    if (value === '') {
      form.setField('customerId', Number.NaN);
      return;
    }
    const id = Number(value);
    const customer = (customersQuery.data ?? []).find((c) => c.customerId === id);
    if (customer) applyCustomer(customer);
  }

  function updateItem(index: number, patch: Partial<DeliveryItemFormValues>) {
    const next = form.values.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    form.setField('items', next);
  }

  function addItem() {
    form.setField('items', [...form.values.items, { productId: Number.NaN, quantity: 1 }]);
  }

  function removeItem(index: number) {
    form.setField(
      'items',
      form.values.items.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit() {
    const data = form.validate();
    if (!data) return;

    form.setSubmitting(true);
    try {
      const delivery = await createDelivery.mutateAsync(data);
      toast({
        variant: 'success',
        title: 'Order created',
        description: `${delivery.trackingCode} is pending allocation on the dispatch board.`,
      });
      onClose();
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Could not create order',
        description: errorMessage(err),
      });
    } finally {
      form.setSubmitting(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="New Delivery Order"
        description="Capture the waybill. It lands on the dispatch board as Pending."
        size="lg"
        dismissible={!form.submitting}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={form.submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={form.submitting}>
              Create order
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-control border border-blue-200 bg-blue-50 px-3.5 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-700" aria-hidden />
            <p className="text-[13px] text-blue-900">
              The <strong>customer</strong> is the business sending the parcel — their address is
              the pickup. The <strong>drop-off</strong> is the recipient&apos;s address, entered per
              waybill.
            </p>
          </div>

          <Field label="Customer (sender)" htmlFor="dCustomer" required error={form.errors.customerId}>
            <div className="flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <Select
                  id="dCustomer"
                  options={customerOptions}
                  value={Number.isNaN(form.values.customerId) ? '' : String(form.values.customerId)}
                  invalid={Boolean(form.errors.customerId)}
                  disabled={customersQuery.isLoading}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                leftIcon={<Plus className="size-4" />}
                onClick={() => setCustomerDialogOpen(true)}
              >
                New
              </Button>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Recipient name"
              htmlFor="dRecipientName"
              error={form.errors.recipientName}
              helper="Who receives the parcel (FR3)."
            >
              <Input
                id="dRecipientName"
                placeholder="e.g. Ngozi Eze"
                value={form.values.recipientName}
                invalid={Boolean(form.errors.recipientName)}
                onChange={(e) => form.setField('recipientName', e.target.value)}
              />
            </Field>

            <Field
              label="Recipient phone"
              htmlFor="dRecipientPhone"
              error={form.errors.recipientPhone}
              helper="Used by the rider to call on arrival."
            >
              <Input
                id="dRecipientPhone"
                type="tel"
                placeholder="+2348031234567"
                value={form.values.recipientPhone}
                invalid={Boolean(form.errors.recipientPhone)}
                onChange={(e) => form.setField('recipientPhone', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Pickup address"
              htmlFor="dPickup"
              required
              error={form.errors.pickupAddress}
              helper="Where the rider collects — prefilled from the customer."
            >
              <Input
                id="dPickup"
                placeholder="Where the rider collects"
                value={form.values.pickupAddress}
                invalid={Boolean(form.errors.pickupAddress)}
                onChange={(e) => form.setField('pickupAddress', e.target.value)}
              />
            </Field>

            <Field
              label="Drop-off address"
              htmlFor="dDropoff"
              required
              error={form.errors.dropoffAddress}
              helper="The recipient's address."
            >
              <Input
                id="dDropoff"
                placeholder="Where the rider delivers"
                value={form.values.dropoffAddress}
                invalid={Boolean(form.errors.dropoffAddress)}
                onChange={(e) => form.setField('dropoffAddress', e.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-control border border-hairline bg-surface-sunken p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink-primary">Line items</p>
                <p className="text-xs text-ink-secondary">What is being carried on this waybill</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={<Plus className="size-4" />}
                onClick={addItem}
              >
                Add item
              </Button>
            </div>

            {form.errors.items && (
              <p className="mb-2 text-xs text-state-error">{form.errors.items}</p>
            )}

            <div className="space-y-2.5">
              {form.values.items.map((item, index) => (
                <div key={index} className="flex items-end gap-2.5">
                  <div className="flex-1">
                    <Select
                      aria-label={`Product for line ${index + 1}`}
                      options={productOptions}
                      value={Number.isNaN(item.productId) ? '' : String(item.productId)}
                      disabled={productsQuery.isLoading}
                      onChange={(e) =>
                        updateItem(index, {
                          productId: e.target.value === '' ? Number.NaN : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      aria-label={`Quantity for line ${index + 1}`}
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={Number.isNaN(item.quantity) ? '' : String(item.quantity)}
                      onChange={(e) =>
                        updateItem(index, {
                          quantity: e.target.value === '' ? Number.NaN : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <IconButton
                    label={`Remove line ${index + 1}`}
                    onClick={() => removeItem(index)}
                    disabled={form.values.items.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Nested dialog: register a sender without losing the order in progress. */}
      <CustomerFormDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onSaved={applyCustomer}
      />
    </>
  );
}
