import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../admin/components/modal';
import { getPurchaseQuote } from '../api';
import { formatNairaAmount } from '../utils';

// Only the final server quote is authorized for debit. No PIN is sent for quoting.
export default function useQuotedPurchase(service: string, purchase: (data: any) => Promise<any>) {
  const [pending, setPending] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const resolver = useRef<((value: any) => void) | null>(null);
  const active = useRef(false);
  const submitting = useRef(false);
  useEffect(() => () => { resolver.current?.(null); resolver.current = null; }, []);
  const close = () => { if (busy) return; setPending(null); resolver.current?.(null); resolver.current = null; };
  const reviewPurchase = async (input: any) => {
    if (active.current) return null;
    active.current = true;
    try {
      const quote = await getPurchaseQuote(service, input);
      return await new Promise(resolve => { resolver.current = resolve; setPending({ quote, input }); });
    } catch (error: any) {
      toast.error(error.message);
      return null;
    } finally { active.current = false; }
  };
  const confirm = async () => {
    if (submitting.current || !pending) return;
    submitting.current = true;
    setBusy(true);
    try {
      const { input, quote } = pending;
      const result = await purchase({ ...input, amount: quote.amount, provider: quote.provider, serviceID: quote.serviceID, pricingKey: quote.pricingKey });
      resolver.current?.(result);
    } catch (error: any) {
      toast.error(error.message || 'Check your transaction history before trying again.');
      resolver.current?.(null);
    } finally { resolver.current = null; setPending(null); setBusy(false); submitting.current = false; }
  };
  const pricingDialog = <div style={{ position: 'relative', zIndex: 110 }}><Modal isOpen={!!pending} closeModal={close} title="Confirm payment" showCloseButton={!busy} size="sm">
    {pending && <div className="space-y-4">
      <p>Review the current price before your wallet is charged.</p>
      <dl className="space-y-3">
        <div className="flex justify-between gap-4"><dt>Service value</dt><dd>{formatNairaAmount(pending.quote.amount)}</dd></div>
        {pending.quote.retailAmount !== pending.quote.amount && <div className="flex justify-between gap-4"><dt>Listed price</dt><dd>{formatNairaAmount(pending.quote.retailAmount)}</dd></div>}
        <div className="flex justify-between gap-4"><dt>Customer discount ({pending.quote.customerDiscountRate}%)</dt><dd>{formatNairaAmount(pending.quote.customerDiscountAmount)}</dd></div>
        <div className="flex justify-between gap-4 font-semibold"><dt>Wallet debit</dt><dd>{formatNairaAmount(pending.quote.customerCharge)}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="ot-button ot-button-secondary" disabled={busy} onClick={close}>Cancel</button>
        <button type="button" className="ot-button ot-button-primary" disabled={busy} onClick={confirm}>{busy ? 'Processing…' : `Pay ${formatNairaAmount(pending.quote.customerCharge)}`}</button>
      </div>
    </div>}
  </Modal></div>;
  return { reviewPurchase, pricingDialog };
}
