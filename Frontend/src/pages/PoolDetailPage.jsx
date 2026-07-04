import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import {
  Users, Calendar, CreditCard, ArrowLeft, Shield,
  Copy, Check, UserPlus, X, Crown, Zap, Lock
} from 'lucide-react';
import { usePool, useJoinPool, useCreatePaymentIntent, usePayUpi, useVerifyUpiPayment } from '../hooks/queries';
import { selectCurrentUser } from '../store/authSlice';
import { addToast } from '../store/uiSlice';
import { TrustBadge, ScoreBadge, StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

const fmt = (cents) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100);

const serviceIcons = { Netflix: '📺', Spotify: '🎵', YouTube: '▶️', Adobe: '🎨', Disney: '🏰', Apple: '🍎', default: '📦' };

/* ─── Join Modal ──────────────────────────────────────────────────────────── */
const JoinModal = ({ pool, onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const joinPool = useJoinPool();
  const dispatch = useDispatch();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) { setError('Invite code is required'); return; }
    setError('');
    try {
      await joinPool.mutateAsync({ poolId: pool._id, inviteCode: inviteCode.trim().toUpperCase() });
      dispatch(addToast({ type: 'success', message: `Joined ${pool.serviceName} pool!` }));
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid invite code or unable to join.';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="join-modal-title">
      <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_80px_-20px_rgba(247,147,26,0.3)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-[#F7931A]" />
            <h2 id="join-modal-title" className="font-heading font-semibold text-white">Join Pool</h2>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 p-4 bg-black/30 rounded-xl">
          <p className="font-mono text-xs text-[#94A3B8] mb-1">Joining</p>
          <p className="font-heading font-semibold text-white">{pool.serviceName} — {pool.planTier}</p>
          <p className="font-mono text-[#F7931A] text-sm mt-1">{fmt(pool.shareAmount)} / {pool.billingCycle}</p>
        </div>

        <form onSubmit={handleJoin} noValidate className="flex flex-col gap-4">
          <Input
            label="Invite Code"
            type="text"
            id="invite-code"
            placeholder="8-character code (e.g. ABC12345)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            error={error}
            className="font-mono tracking-widest text-center text-lg"
            maxLength={8}
          />
          <Button type="submit" loading={joinPool.isPending} className="w-full">
            <UserPlus size={15} /> Join Pool
          </Button>
        </form>

        <p className="font-mono text-xs text-[#94A3B8] text-center mt-4">
          Requires Trust Score ≥ 50 to join.
        </p>
      </div>
    </div>
  );
};

/* ─── Payment Form ────────────────────────────────────────────────────────── */
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#fff',
      fontFamily: '"JetBrains Mono", monospace',
      fontSmoothing: 'antialiased',
      fontSize: '14px',
      '::placeholder': { color: 'rgba(255,255,255,0.25)' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
  hidePostalCode: true,
};

const PaymentForm = ({ pool, onSuccess }) => {
  const createIntent = useCreatePaymentIntent();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calls simplified backend endpoint to immediately record completed transaction
      await createIntent.mutateAsync({ poolId: pool._id });
      
      // Simulate Stripe processing delay for premium UI feel
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      dispatch(addToast({ type: 'success', message: 'Payment successful! Trust score +2 🎉' }));
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Payment failed. Please try again.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-4">
      <div>
        <label className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider block mb-2">
          Card Details
        </label>
        <div className="bg-black/50 border-b-2 border-white/20 px-4 py-4 transition-colors focus-within:border-[#F7931A]">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-mono">
        <Lock size={12} className="text-[#F7931A]" />
        Test card: 4242 4242 4242 4242 · Any expiry/CVC
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading}
        loading={loading}
      >
        <CreditCard size={16} />
        Pay {fmt(pool.shareAmount)} Now
      </Button>
    </form>
  );
};

/* ─── Pool Detail Page ────────────────────────────────────────────────────── */
const PoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, error, refetch } = usePool(id);
  const [showJoin, setShowJoin] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payMethod, setPayMethod] = useState('stripe'); // stripe or upi
  const [upiLoading, setUpiLoading] = useState(false);
  const [justPaid, setJustPaid] = useState(false);

  const payUpiMut = usePayUpi();
  const verifyUpiMut = useVerifyUpiPayment();

  if (isLoading) {
    return (
      <main className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#F7931A] border-t-transparent animate-spin" />
          <p className="font-mono text-sm text-[#94A3B8]">Loading pool details...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load pool. It may not exist.</p>
          <Button onClick={() => navigate('/pools')}>Back to Pools</Button>
        </div>
      </main>
    );
  }

  const pool = data.pool || data;
  const icon = serviceIcons[pool.serviceName] || serviceIcons.default;
  const currentUserId = String(user?.id || user?._id || '');
  const memberObj = pool.members?.find((m) => {
    const memberId = String(m.userId?._id || m.userId || '');
    return memberId && currentUserId && memberId === currentUserId;
  });
  const isMember = !!memberObj;
  const isHost = memberObj?.role === 'host';
  const slotsAvail = pool.slots - (pool.members?.length || 0);

  const copyInvite = () => {
    navigator.clipboard.writeText(pool.inviteCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-[#F7931A] opacity-[0.04] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-6 font-mono text-sm"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left: Pool Info ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Header card */}
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-7">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#F7931A]/10 border border-[#F7931A]/20 flex items-center justify-center text-4xl shrink-0">
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="font-heading font-bold text-2xl text-white">{pool.serviceName}</h1>
                    <StatusBadge status={pool.status} />
                  </div>
                  <p className="text-[#94A3B8] text-sm">{pool.planTier}</p>
                  <p className="font-mono text-xs text-[#94A3B8] mt-1 capitalize">{pool.billingCycle} billing</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Cost',   value: fmt(pool.totalCost) },
                  { label: 'Your Share',   value: fmt(pool.shareAmount), accent: true },
                  { label: 'Slots',        value: `${pool.members?.length || 0} / ${pool.slots}` },
                ].map((s) => (
                  <div key={s.label} className="bg-black/30 rounded-xl p-4 text-center">
                    <div className="font-mono text-xs text-[#94A3B8] mb-1">{s.label}</div>
                    <div className={['font-heading font-bold text-lg', s.accent ? 'text-[#F7931A]' : 'text-white'].join(' ')}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Credentials Card */}
            {isMember && (
              <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-7 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F7931A]/5 blur-2xl rounded-full pointer-events-none" />
                
                <h2 className="font-heading font-semibold text-white mb-5 flex items-center gap-2">
                  <Shield size={17} className="text-[#F7931A]" /> Service Login Details
                </h2>

                {(isHost || pool.hasPaidThisCycle || justPaid) ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Email / Username</p>
                        <p className="font-mono text-sm text-white select-all">{pool.serviceEmail || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pool.serviceEmail || '');
                          dispatch(addToast({ type: 'success', message: 'Email copied!' }));
                        }}
                        className="text-[#94A3B8] hover:text-[#F7931A] p-2 hover:bg-white/5 rounded-lg transition-all"
                        title="Copy Username"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Password</p>
                        <p className="font-mono text-sm text-white select-all">{pool.servicePassword || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pool.servicePassword || '');
                          dispatch(addToast({ type: 'success', message: 'Password copied!' }));
                        }}
                        className="text-[#94A3B8] hover:text-[#F7931A] p-2 hover:bg-white/5 rounded-lg transition-all"
                        title="Copy Password"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-[#F7931A]/5 border border-[#F7931A]/20 rounded-xl text-center flex flex-col items-center gap-3">
                    <Lock className="text-[#F7931A]" size={24} />
                    <div>
                      <p className="text-white text-sm font-semibold">Credentials Locked</p>
                      <p className="text-[#94A3B8] text-xs mt-1">Please pay your share to view the account login details.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Members list */}
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-7">
              <h2 className="font-heading font-semibold text-white mb-5 flex items-center gap-2">
                <Users size={17} className="text-[#F7931A]" /> Members
              </h2>
              <div className="flex flex-col gap-3">
                {pool.members?.map((member, i) => {
                  const u = member.userId?.name ? member.userId : { name: 'Unknown', trustScore: 0 };
                  return (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{u.name}</span>
                            {member.role === 'host' && (
                              <Crown size={12} className="text-[#FFD600]" title="Host" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#94A3B8] capitalize">{member.role}</span>
                            {member.status === 'payment_pending_verification' && (
                              <span className="font-mono text-[10px] text-yellow-500 bg-yellow-500/15 px-1.5 py-0.5 rounded border border-yellow-500/30">Pending UPI Verify</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrustBadge score={u.trustScore ?? 100} />
                      </div>
                    </div>
                  );
                })}

                {/* Empty slots */}
                {Array(slotsAvail).fill(0).map((_, i) => (
                  <div key={`empty-${i}`} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 opacity-30">
                    <div className="w-9 h-9 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                      <UserPlus size={14} className="text-white/40" />
                    </div>
                    <span className="font-mono text-xs text-[#94A3B8]">Open slot</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Actions ── */}
          <div className="flex flex-col gap-5">
            {/* Billing info */}
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={15} className="text-[#F7931A]" /> Billing
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Next billing</span>
                  <span className="font-mono text-white text-xs">
                    {pool.nextBillingDate
                      ? new Date(pool.nextBillingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Amount due</span>
                  <span className="font-mono text-[#F7931A] font-semibold">{fmt(pool.shareAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="font-heading font-semibold text-white">Actions</h3>

              {/* Host actions */}
              {isHost && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3 bg-[#F7931A]/5 border border-[#F7931A]/20 rounded-xl">
                    <div>
                      <p className="font-mono text-xs text-[#94A3B8]">Invite Code</p>
                      <p className="font-mono text-sm font-bold text-[#F7931A] tracking-widest">{pool.inviteCode}</p>
                    </div>
                    <button onClick={copyInvite} className="text-[#94A3B8] hover:text-[#F7931A] transition-colors" aria-label="Copy invite code">
                      {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>

                  {pool.upiId && (
                    <div className="p-3 bg-black/30 border border-white/5 rounded-xl">
                      <p className="font-mono text-xs text-[#94A3B8] mb-1">Your UPI ID</p>
                      <p className="font-mono text-sm text-white select-all">{pool.upiId}</p>
                    </div>
                  )}

                  {/* Pending UPI Payment Verifications */}
                  {pool.members?.filter(m => m.status === 'payment_pending_verification').map((pendingMember) => {
                    const u = pendingMember.userId?.name ? pendingMember.userId : { name: 'Unknown' };
                    return (
                      <div key={pendingMember.userId?._id || pendingMember.userId} className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-xs font-semibold">{u.name} paid via UPI</span>
                          <span className="font-mono text-[#F7931A] text-xs font-bold">{fmt(pool.shareAmount)}</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          loading={verifyUpiMut.isPending}
                          onClick={async () => {
                            try {
                              await verifyUpiMut.mutateAsync({ poolId: pool._id, memberId: pendingMember.userId?._id || pendingMember.userId });
                              dispatch(addToast({ type: 'success', message: 'Payment verified!' }));
                              refetch();
                            } catch (e) {
                              dispatch(addToast({ type: 'error', message: 'Failed to verify payment.' }));
                            }
                          }}
                        >
                          Confirm Receipt
                        </Button>
                      </div>
                    );
                  })}

                  <Button variant="danger" size="sm" className="w-full" onClick={() =>
                    dispatch(addToast({ type: 'warning', message: 'Pool close feature coming soon.' }))
                  }>
                    Close Pool
                  </Button>
                </div>
              )}

              {/* Non-member: Join */}
              {!isMember && pool.status === 'active' && slotsAvail > 0 && (
                <Button className="w-full" onClick={() => setShowJoin(true)}>
                  <UserPlus size={15} /> Join Pool
                </Button>
              )}

              {/* Full pool */}
              {!isMember && slotsAvail === 0 && (
                <div className="text-center py-4">
                  <p className="font-mono text-xs text-[#94A3B8]">This pool is full.</p>
                </div>
              )}

              {/* Member: Pay */}
              {isMember && !isHost && (
                <>
                  {(pool.hasPaidThisCycle || justPaid) ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-xl p-4 text-center">
                      <p className="font-mono text-xs text-emerald-400 mb-1">✓ Payment Complete</p>
                      <p className="text-white text-xs">You have settled your share for this billing cycle. 🎉</p>
                    </div>
                  ) : memberObj?.status === 'payment_pending_verification' ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/35 rounded-xl p-4 text-center">
                      <p className="font-mono text-xs text-yellow-500 mb-1">Status: Pending Verification</p>
                      <p className="text-white text-xs">Host is verifying your UPI payment.</p>
                    </div>
                  ) : !showPay ? (
                    <Button className="w-full" onClick={() => setShowPay(true)}>
                      <CreditCard size={15} /> Pay My Share
                    </Button>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-heading font-semibold text-white text-sm">Pay {fmt(pool.shareAmount)}</span>
                        <button onClick={() => setShowPay(false)} className="text-[#94A3B8] hover:text-white transition-colors">
                          <X size={16} />
                        </button>
                      </div>

                      {pool.upiId ? (
                        <div className="flex gap-2 mb-4 bg-black/40 p-1.5 rounded-lg border border-white/5">
                          <button
                            type="button"
                            onClick={() => setPayMethod('stripe')}
                            className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${payMethod === 'stripe' ? 'bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/35' : 'text-[#94A3B8] hover:text-white'}`}
                          >
                            Card
                          </button>
                          <button
                            type="button"
                            onClick={() => setPayMethod('upi')}
                            className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${payMethod === 'upi' ? 'bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/35' : 'text-[#94A3B8] hover:text-white'}`}
                          >
                            UPI QR
                          </button>
                        </div>
                      ) : null}

                      {payMethod === 'stripe' || !pool.upiId ? (
                        <PaymentForm pool={pool} onSuccess={() => { setJustPaid(true); setShowPay(false); refetch(); }} />
                      ) : (
                        <div className="flex flex-col gap-4 text-center">
                          <div className="bg-white p-3 rounded-2xl inline-block mx-auto">
                            <QRCodeSVG
                              value={`upi://pay?pa=${pool.upiId}&pn=${encodeURIComponent(pool.hostId?.name || 'SplitStream Host')}&am=${(pool.shareAmount / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent('SplitStream: ' + pool.serviceName)}`}
                              size={180}
                              level="M"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                            <span className="font-mono text-xs text-[#94A3B8] select-all truncate">{pool.upiId}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pool.upiId);
                                dispatch(addToast({ type: 'success', message: 'UPI ID copied!' }));
                              }}
                              className="text-xs text-[#F7931A] hover:underline shrink-0"
                            >
                              Copy
                            </button>
                          </div>

                          <Button
                            className="w-full"
                            loading={upiLoading}
                            onClick={async () => {
                              setUpiLoading(true);
                              try {
                                await payUpiMut.mutateAsync({ poolId: pool._id });
                                dispatch(addToast({ type: 'success', message: 'Payment marked as completed. Waiting for host approval!' }));
                                setShowPay(false);
                                refetch();
                              } catch (err) {
                                dispatch(addToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update.' }));
                              } finally {
                                setUpiLoading(false);
                              }
                            }}
                          >
                            I Have Paid Via UPI
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Security note */}
              <div className="flex items-center gap-2 pt-2">
                <Shield size={12} className="text-[#94A3B8]" />
                <span className="font-mono text-xs text-[#94A3B8]">Secured by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoin && (
        <JoinModal
          pool={pool}
          onClose={() => setShowJoin(false)}
          onSuccess={() => { setShowJoin(false); refetch(); }}
        />
      )}
    </main>
  );
};

export default PoolDetailPage;
