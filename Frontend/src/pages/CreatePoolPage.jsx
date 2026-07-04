import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Tv, Music, Play, Layers, ToggleLeft, ToggleRight,
  Users, ArrowRight, Copy, Check, Zap
} from 'lucide-react';
import { useCreatePool } from '../hooks/queries';
import { addToast } from '../store/uiSlice';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const servicePresets = [
  { name: 'Netflix',  icon: Tv,       color: '#E50914' },
  { name: 'Spotify',  icon: Music,    color: '#1DB954' },
  { name: 'YouTube',  icon: Play,  color: '#FF0000' },
  { name: 'Adobe',    icon: Layers,   color: '#FF0000' },
];

const CreatePoolPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const createPool = useCreatePool();

  const [form, setForm] = useState({
    serviceName: '',
    planTier: '',
    totalCost: '',
    billingCycle: 'monthly',
    slots: 4,
    upiId: '',
    serviceEmail: '',
    servicePassword: '',
    visibility: 'public',
  });
  const [errors, setErrors] = useState({});
  const [createdPool, setCreatedPool] = useState(null);
  const [copied, setCopied] = useState(false);

  const shareAmount = form.totalCost && form.slots
    ? Math.round(Number(form.totalCost) / form.slots)
    : 0;

  const validate = () => {
    const errs = {};
    if (!form.serviceName.trim()) errs.serviceName = 'Service name is required';
    if (!form.planTier.trim()) errs.planTier = 'Plan tier is required';
    if (!form.totalCost || isNaN(Number(form.totalCost)) || Number(form.totalCost) <= 0)
      errs.totalCost = 'Enter a valid cost';
    if (!form.serviceEmail.trim()) errs.serviceEmail = 'Service login username/email is required';
    if (!form.servicePassword.trim()) errs.servicePassword = 'Service login password is required';
    if (form.upiId.trim() && !form.upiId.includes('@'))
      errs.upiId = 'Enter a valid UPI ID (e.g., name@upi)';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      // Convert INR to paise (cents equivalent)
      const payload = {
        ...form,
        totalCost: Math.round(Number(form.totalCost) * 100),
        slots: Number(form.slots),
      };
      const data = await createPool.mutateAsync(payload);
      setCreatedPool(data.pool || data);
      dispatch(addToast({ type: 'success', message: 'Pool created successfully!' }));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create pool.';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdPool?.inviteCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (createdPool) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#F7931A] opacity-[0.06] blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_-10px_rgba(247,147,26,0.6)]">
            <Zap size={36} className="text-white" />
          </div>

          <h2 className="font-heading font-bold text-3xl text-white mb-2">Pool Created!</h2>
          <p className="text-[#94A3B8] mb-8">Share this invite code with your members.</p>

          <div className="bg-[#0F1115] border border-[#F7931A]/30 rounded-2xl p-8 mb-6 shadow-[0_0_40px_-10px_rgba(247,147,26,0.2)]">
            <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-widest mb-3">Invite Code</p>
            <div className="font-mono text-4xl font-bold tracking-[0.3em] text-[#F7931A] mb-5">
              {createdPool.inviteCode}
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 mx-auto px-5 py-2 rounded-full border border-[#F7931A]/30 text-[#F7931A] text-sm font-mono hover:bg-[#F7931A]/10 transition-all duration-300"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="bg-[#0F1115] border border-white/8 rounded-xl p-5 mb-6 text-left">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Service', createdPool.serviceName],
                ['Plan', createdPool.planTier],
                ['Total Cost', `₹${(createdPool.totalCost / 100).toFixed(0)}`],
                ['Per Slot', `₹${(createdPool.shareAmount / 100).toFixed(0)}`],
                ['Slots', createdPool.slots],
                ['Billing', createdPool.billingCycle],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="font-mono text-xs text-[#94A3B8]">{k}</div>
                  <div className="font-heading font-semibold text-white text-sm">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/pools/create') || setCreatedPool(null)}
            >
              Create Another
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate(`/pools/${createdPool._id}`)}
            >
              View Pool <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[300px] bg-[#F7931A] opacity-[0.04] blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto relative">
        <div className="mb-8">
          <p className="font-mono text-xs text-[#F7931A] uppercase tracking-widest mb-2">Host</p>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-white mb-2">
            Create a <span className="gradient-text">Pool</span>
          </h1>
          <p className="text-[#94A3B8] text-sm">Set up a shared subscription pool and invite contributors.</p>
        </div>

        <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">

            {/* Service presets */}
            <div>
              <label className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider block mb-3">
                Quick Pick
              </label>
              <div className="grid grid-cols-4 gap-2">
                {servicePresets.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setForm({ ...form, serviceName: s.name })}
                    className={[
                      'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-mono transition-all duration-200',
                      form.serviceName === s.name
                        ? 'border-[#F7931A]/60 bg-[#F7931A]/10 text-[#F7931A]'
                        : 'border-white/8 text-[#94A3B8] hover:border-white/20 hover:text-white',
                    ].join(' ')}
                    aria-pressed={form.serviceName === s.name}
                  >
                    <s.icon size={20} />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Name */}
            <Input
              label="Service Name"
              type="text"
              id="pool-service"
              placeholder="e.g. Netflix, Spotify, Adobe..."
              value={form.serviceName}
              onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
              error={errors.serviceName}
            />

            {/* Plan Tier */}
            <Input
              label="Plan Tier"
              type="text"
              id="pool-tier"
              placeholder="e.g. Premium 4K, Family Plan..."
              value={form.planTier}
              onChange={(e) => setForm({ ...form, planTier: e.target.value })}
              error={errors.planTier}
            />

            {/* Service Email/Username */}
            <Input
              label="Service Login Email / Username"
              type="text"
              id="pool-service-email"
              placeholder="Username or email used to log into Netflix/Spotify"
              value={form.serviceEmail}
              onChange={(e) => setForm({ ...form, serviceEmail: e.target.value })}
              error={errors.serviceEmail}
            />

            {/* Service Password */}
            <Input
              label="Service Login Password"
              type="password"
              id="pool-service-password"
              placeholder="Password for the shared account"
              value={form.servicePassword}
              onChange={(e) => setForm({ ...form, servicePassword: e.target.value })}
              error={errors.servicePassword}
            />

            {/* UPI ID */}
            <Input
              label="UPI ID (Optional)"
              type="text"
              id="pool-upi"
              placeholder="e.g. yourname@upi (For direct members payments)"
              value={form.upiId}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              error={errors.upiId}
            />

            {/* Total Cost + Billing Cycle */}
            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                label="Total Cost (₹)"
                type="number"
                id="pool-cost"
                placeholder="e.g. 649"
                value={form.totalCost}
                onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
                error={errors.totalCost}
                min="1"
              />

              {/* Billing Cycle Toggle */}
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">Billing Cycle</label>
                <div className="flex gap-2 mt-2.5">
                  {['monthly', 'annual'].map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setForm({ ...form, billingCycle: cycle })}
                      className={[
                        'flex-1 py-2.5 rounded-lg border text-xs font-mono capitalize transition-all duration-200',
                        form.billingCycle === cycle
                          ? 'border-[#F7931A]/60 bg-[#F7931A]/10 text-[#F7931A]'
                          : 'border-white/10 text-[#94A3B8] hover:border-white/20',
                      ].join(' ')}
                      aria-pressed={form.billingCycle === cycle}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pool Visibility */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">Pool Visibility</label>
              <div className="flex gap-2.5 mt-2">
                {['public', 'private'].map((vis) => (
                  <button
                    key={vis}
                    type="button"
                    onClick={() => setForm({ ...form, visibility: vis })}
                    className={[
                      'flex-1 py-3 px-4 rounded-xl border text-xs font-mono text-left transition-all duration-200 flex flex-col gap-0.5',
                      form.visibility === vis
                        ? 'border-[#F7931A]/60 bg-[#F7931A]/10 text-[#F7931A]'
                        : 'border-white/10 text-[#94A3B8] hover:border-white/20',
                    ].join(' ')}
                    aria-pressed={form.visibility === vis}
                  >
                    <span className="font-bold capitalize">{vis}</span>
                    <span className="text-[10px] text-[#94A3B8] font-sans">
                      {vis === 'public'
                        ? 'Anyone can browse and join directly'
                        : 'Invite-only, hidden from search results'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slots slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="slots-slider" className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">
                  Number of Slots
                </label>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F7931A]/10 border border-[#F7931A]/30 rounded-full">
                  <Users size={12} className="text-[#F7931A]" />
                  <span className="font-mono text-sm font-bold text-[#F7931A]">{form.slots}</span>
                </div>
              </div>
              <input
                id="slots-slider"
                type="range"
                min="2"
                max="6"
                step="1"
                value={form.slots}
                onChange={(e) => setForm({ ...form, slots: Number(e.target.value) })}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#F7931A]"
                aria-valuenow={form.slots}
                aria-valuemin={2}
                aria-valuemax={6}
              />
              <div className="flex justify-between font-mono text-xs text-[#94A3B8] mt-1">
                {[2, 3, 4, 5, 6].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>

            {/* Live preview */}
            {shareAmount > 0 && (
              <div className="bg-gradient-to-r from-[#EA580C]/10 to-[#F7931A]/10 border border-[#F7931A]/25 rounded-2xl p-5 text-center">
                <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Each member pays</p>
                <p className="font-heading font-bold text-4xl gradient-text">₹{shareAmount}</p>
                <p className="font-mono text-xs text-[#94A3B8] mt-1">
                  {form.billingCycle === 'annual' ? 'per year' : 'per month'} · {form.slots} members
                </p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={createPool.isPending}
            >
              Create Pool & Generate Invite Code <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default CreatePoolPage;
