import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPricingRules, getPricingOptions, getPricingPreview, savePricingRule } from '../../api';
import { formatNairaAmount } from '../../../utils';

const initial = { provider: 'vtpass', service: 'data', network: 'mtn', planCode: '', providerCommissionType: 'percentage', providerCommissionRate: '', providerCommissionCap: '', customerDiscountRate: '' };

export default function PricingRules() {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pendingEdit = useRef<any>(null);
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['pricing-rules'], queryFn: getPricingRules });
  const mutation = useMutation({ mutationFn: savePricingRule, onSuccess: () => { setSaved(true); setEditingId(null); cache.invalidateQueries({ queryKey: ['pricing-rules'] }); } });

  const options = useQuery({
    queryKey: ['pricing-options', form.provider, form.service],
    queryFn: () => getPricingOptions({ provider: form.provider, service: form.service }),
    enabled: !!form.provider && !!form.service,
  });

  const preview = useQuery({
    queryKey: ['pricing-preview', form.provider, form.service, form.network, form.planCode],
    queryFn: () => getPricingPreview({ provider: form.provider, service: form.service, network: form.network || '*', planCode: form.planCode || '' }),
    enabled: !!form.provider && !!form.service,
  });

  // After options load, apply pending edit so dropdowns have the right choices
  useEffect(() => {
    if (!options.data || !pendingEdit.current) return;
    const edit = pendingEdit.current;
    pendingEdit.current = null;
    setForm(edit);
  }, [options.data]);

  const filteredPlanCodes = options.data?.planCodes?.filter(p => !form.network || p.network === form.network) || [];

  // Match rule: for data/cable services match planCode if set, otherwise match network/provider/service
  const matchedRule = query.data?.rules.find(r => {
    if (r.provider !== form.provider || r.service !== form.service) return false;
    if (form.planCode) return r.planCode === form.planCode && r.network === form.network;
    return r.network === (form.network || '*') && !r.planCode;
  });

  const set = (field: string, value: string) => {
    setSaved(false);
    const next = { ...form, [field]: value };
    if (field === 'provider' || field === 'service') {
      next.network = 'mtn';
      next.planCode = '';
    }
    if (field === 'network') next.planCode = '';
    setForm(next);
  };

  const startEdit = (rule: any) => {
    setSaved(false);
    const ruleForm = {
      provider: rule.provider,
      service: rule.service,
      network: rule.network,
      planCode: rule.planCode || '',
      providerCommissionType: rule.providerCommissionType || 'percentage',
      providerCommissionRate: String(rule.providerCommissionRate),
      providerCommissionCap: rule.providerCommissionCap == null ? '' : String(rule.providerCommissionCap),
      customerDiscountRate: String(rule.customerDiscountRate),
    };
    // If provider/service changed, queue the edit for after options load
    if (rule.provider !== form.provider || rule.service !== form.service) {
      pendingEdit.current = ruleForm;
      setForm({ ...ruleForm, network: ruleForm.network, planCode: '' });
    } else {
      setForm(ruleForm);
    }
    setEditingId(rule._id);
  };

  const field = (name: keyof typeof initial, label: string, options?: string[]) => <label className="block" key={name}>
    <span className="ot-field-label">{label}</span>
    {options ? <select className="ot-field" value={form[name]} onChange={e => set(name, e.target.value)}>{options.map(value => <option key={value} value={value}>{value === '*' ? 'All networks/services' : value}</option>)}</select>
      : <input className="ot-field" value={form[name]} type={['providerCommissionRate', 'providerCommissionCap', 'customerDiscountRate'].includes(name) ? 'number' : 'text'} min="0" step="0.01" max={name === 'customerDiscountRate' || (name === 'providerCommissionRate' && form.providerCommissionType === 'percentage') ? '99.99' : undefined} required={name !== 'planCode' && name !== 'providerCommissionCap'} onChange={e => set(name, e.target.value)} />}
  </label>;

  const discount = Number(form.customerDiscountRate) || 0;
  const providerRate = Number(form.providerCommissionRate) || 0;
  const capped = form.providerCommissionCap === '' ? providerRate : Math.min(providerRate, Number(form.providerCommissionCap));
  const platformRate = Math.round((capped - discount) * 100) / 100;

  const previewData = preview.data;
  const isEditingSavedRule = editingId != null && matchedRule?._id === editingId;
  const isNewRule = !matchedRule;

  return <section className="space-y-5">
    <div><h2>OhTopUp pricing rules</h2><p className="ot-admin-muted mt-2">Configure how provider commission is shared between customers and your platform. Enter the provider's contracted commission rate, then set the customer discount. OhTopUp retains the difference as platform margin before operational fees.</p></div>
    {query.isError && <p role="alert">Could not load pricing rules. <button onClick={() => query.refetch()}>Retry</button></p>}

    {previewData && <div className="ot-panel p-4">
      <h3 className="mb-2">Checkout currently uses</h3>
      {previewData.matchedRule ? (
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span><strong>{previewData.effectiveDiscountRate}%</strong> customer discount from saved rule ({previewData.matchedRule.network}{previewData.matchedRule.planCode ? ` / ${previewData.matchedRule.planCode}` : ''})</span>
        </div>
      ) : previewData.legacyRate > 0 ? (
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          <span><strong>{previewData.legacyRate}%</strong> customer discount from legacy {previewData.legacySource} settings — no OhTopUp rule saved for this scope</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
          <span>No customer discount configured for this scope</span>
        </div>
      )}
    </div>}

    {/* Commission breakdown for ₦100 */}
    {(providerRate > 0 || discount > 0) && <div className="ot-panel p-4">
      <h3 className="mb-3">Commission split on a ₦100 service</h3>
      <div className="flex items-stretch gap-1 rounded-lg overflow-hidden text-sm text-white">
        <div className="bg-emerald-600 px-3 py-2 flex-1 text-center">
          <div className="font-semibold">{discount}%</div>
          <div className="text-xs opacity-80">Customer discount</div>
          <div className="font-bold">{formatNairaAmount(discount)}</div>
        </div>
        <div className="bg-blue-600 px-3 py-2 flex-1 text-center">
          <div className="font-semibold">{platformRate}%</div>
          <div className="text-xs opacity-80">OhTopUp platform</div>
          <div className="font-bold">{formatNairaAmount(platformRate)}</div>
        </div>
        <div className="bg-gray-500 px-3 py-2 flex-1 text-center">
          <div className="font-semibold">{100 - capped}%</div>
          <div className="text-xs opacity-80">Provider keeps</div>
          <div className="font-bold">{formatNairaAmount(100 - capped)}</div>
        </div>
      </div>
      <p className="text-xs ot-admin-muted mt-2">Provider commission {form.providerCommissionType === 'flat' ? `is ₦${providerRate} per transaction` : `is ${providerRate}%`}{form.providerCommissionCap !== '' ? `, capped at ₦${form.providerCommissionCap}` : ''}. Customer discount is {discount}%. OhTopUp retains the ₦{platformRate} difference before operational fees.</p>
    </div>}

    <form className="ot-panel p-4 sm:p-6 space-y-4" onSubmit={e => { e.preventDefault(); setSaved(false); mutation.mutate({ ...form, providerCommissionRate: Number(form.providerCommissionRate), providerCommissionCap: form.providerCommissionCap === '' ? null : Number(form.providerCommissionCap), customerDiscountRate: Number(form.customerDiscountRate) }); }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('provider', 'Third-party provider', ['vtpass', 'clubkonnect'])}
        {field('service', 'Service', ['airtime', 'data', 'cable', 'electricity'])}

        <label className="block">
          <span className="ot-field-label">Network or service ID</span>
          <select className="ot-field" value={form.network} onChange={e => set('network', e.target.value)}>
            <option value="*">All networks/services</option>
            {(options.data?.networks || []).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {options.isLoading && <p className="text-xs ot-admin-muted mt-1">Loading networks…</p>}
        </label>

        {(form.service === 'data' || form.service === 'cable') && <label className="block">
          <span className="ot-field-label">Plan code (optional override)</span>
          <select className="ot-field" value={form.planCode} onChange={e => set('planCode', e.target.value)}>
            <option value="">None — apply to all plans</option>
            {filteredPlanCodes.map(p => <option key={p.planId} value={p.planId}>{p.label}</option>)}
          </select>
          {filteredPlanCodes.length === 0 && form.network !== '*' && !options.isLoading && <p className="text-xs ot-admin-muted mt-1">No plans found for this network</p>}
        </label>}

        {field('providerCommissionType', 'Provider commission type', ['percentage', 'flat'])}
        {field('providerCommissionRate', form.providerCommissionType === 'flat' ? 'Provider commission (₦ per transaction)' : 'Provider commission (%)')}
        {field('providerCommissionCap', 'Provider commission cap (₦, optional)')}
        {field('customerDiscountRate', 'Customer discount (%)')}
      </div>

      {matchedRule && !editingId && (
        <div className="flex items-center gap-2 text-sm p-2 rounded bg-blue-50 text-blue-800">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
          <span>This scope already has a saved rule ({matchedRule.customerDiscountRate}% discount). Click Edit to modify it.</span>
        </div>
      )}
      {isEditingSavedRule && (
        <div className="flex items-center gap-2 text-sm p-2 rounded bg-emerald-50 text-emerald-800">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Editing saved rule for this scope.</span>
        </div>
      )}
      {isNewRule && (discount > 0 || providerRate > 0) && (
        <div className="flex items-center gap-2 text-sm p-2 rounded bg-amber-50 text-amber-800">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          <span>{previewData?.matchedRule ? 'Updating existing rule for this scope.' : 'New rule — will override legacy discount for this scope.'}</span>
        </div>
      )}

      <p className="text-sm ot-admin-muted">Provider commission is what the third-party provider (VTPass/ClubKonnect) pays you per transaction. Customer discount is what you pass to the customer. OhTopUp margin is what your platform retains before operational fees.</p>
      <p className="text-sm ot-admin-muted">Use mtn, airtel, glo, or 9mobile for mobile services; the service ID (such as ikeja-electric or dstv) for bills. A plan rule takes priority over a network rule, then the provider/service default. Saving the same scope replaces its rates.</p>
      <p className="text-sm ot-admin-muted">Flat and capped commissions are checked against each purchase amount. Provider costs are estimates until confirmed by the delivery response. Keep these rates current with your provider contract.</p>
      {mutation.isError && <p role="alert" className="ot-field-error">{mutation.error.message}</p>}
      {saved && <p role="status">Pricing rule saved.</p>}
      <div className="flex gap-2">
        <button className="ot-button ot-button-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : isEditingSavedRule ? 'Update rule' : 'Save new rule'}</button>
        {isEditingSavedRule && <button type="button" className="ot-button ot-button-secondary" onClick={() => { setEditingId(null); setForm(initial); }}>Cancel</button>}
      </div>
    </form>

    {query.data && <>
      <div className="ot-panel p-4"><h3>Delivered transactions using recorded pricing</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"><div><p className="text-sm ot-admin-muted">Customer discounts</p><p className="font-semibold">{formatNairaAmount(query.data.summary.customerDiscounts)}</p></div><div><p className="text-sm ot-admin-muted">Confirmed platform margin</p><p className="font-semibold">{formatNairaAmount(query.data.summary.confirmedMargin)}</p></div><div><p className="text-sm ot-admin-muted">Awaiting provider cost</p><p className="font-semibold">{query.data.summary.unconfirmedTransactions} transactions</p></div></div></div>
      <div className="ot-admin-table-wrap"><table className="ot-admin-table"><thead><tr><th>Scope</th><th>Provider commission</th><th>Customer discount</th><th>OhTopUp margin</th><th>Action</th></tr></thead><tbody>{query.data.rules.map(rule => {
        const ruleProviderRate = rule.providerCommissionType === 'flat' ? rule.providerCommissionRate : rule.providerCommissionRate;
        const ruleCapped = rule.providerCommissionCap != null ? Math.min(ruleProviderRate, rule.providerCommissionCap) : ruleProviderRate;
        const ruleMargin = Math.round((ruleCapped - rule.customerDiscountRate) * 100) / 100;
        return <tr key={rule._id}>
          <td>{rule.provider} · {rule.service} · {rule.network}{rule.planCode && ` · ${rule.planCode}`}</td>
          <td>{rule.providerCommissionRate}{rule.providerCommissionType === 'percentage' ? '%' : ' NGN'}{rule.providerCommissionCap != null && ` (cap ₦${rule.providerCommissionCap})`}</td>
          <td>{rule.customerDiscountRate}%</td>
          <td className="font-medium">{ruleMargin}%</td>
          <td><button className="ot-button ot-button-secondary" onClick={() => startEdit(rule)}>Edit</button></td>
        </tr>;
      })}</tbody></table></div>
      {!query.data.rules.length && <p>No OhTopUp rules configured. Existing discounts remain in use until you save a rule.</p>}
    </>}
  </section>;
}
