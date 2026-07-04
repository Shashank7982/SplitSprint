import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';
import { useMyPools, useJoinPool, useMyTransactions } from '../hooks/queries';
import { addToast } from '../store/uiSlice';
import api from '../services/api';
import {
  PlusCircle, Search, Calendar, Users,
  TrendingUp, Crown, Zap, ArrowRight, Clock,
  UserPlus, X, Key
} from 'lucide-react';
import TrustScoreDial from '../components/ui/TrustScoreDial';
import { TrustBadge, StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (cents) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100);

/* ─── Join Pool Modal ─────────────────────────────────────────────────────── */
const JoinPoolModal = ({ onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [poolId, setPoolId] = useState('');
  const [step, setStep] = useState('code'); // 'code' | 'confirm'
  const [foundPool, setFoundPool] = useState(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const joinPool = useJoinPool();
  const dispatch = useDispatch();

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim() || inviteCode.trim().length < 6) {
      setError('Please enter a valid invite code');
      return;
    }
    setError('');
    setSearching(true);

    try {
      const { data } = await api.get(`/api/pools?inviteCode=${inviteCode.trim().toUpperCase()}`);
      const match = (data.pools || []).find(p => p.inviteCode === inviteCode.trim().toUpperCase());
      if (match) {
        setFoundPool(match);
        setPoolId(match._id);
        setStep('confirm');
      } else {
        setError('No pool found with that invite code. Ask your host to double-check.');
      }
    } catch {
      setError('Could not look up pool. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await joinPool.mutateAsync({ poolId, inviteCode: inviteCode.trim().toUpperCase() });
      dispatch(addToast({ type: 'success', message: `You've joined ${foundPool?.serviceName}! 🎉` }));
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to join pool. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_80px_-20px_rgba(247,147,26,0.3)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-[#F7931A]" />
            <h2 className="font-heading font-semibold text-white">Join a Pool</h2>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleLookup} className="flex flex-col gap-4">
            <p className="font-mono text-xs text-[#94A3B8]">
              Get the invite code from the pool host and enter it below.
            </p>
            <Input
              label="Invite Code"
              type="text"
              id="join-invite-code"
              placeholder="e.g. ABC12345"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              error={error}
              className="font-mono tracking-widest text-center text-lg"
              maxLength={10}
            />
            <Button type="submit" loading={searching} className="w-full">
              <Search size={15} /> Find Pool
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
              <p className="font-mono text-xs text-[#94A3B8] mb-1">Pool Found!</p>
              <p className="font-heading font-semibold text-white">{foundPool?.serviceName} — {foundPool?.planTier}</p>
              <p className="font-mono text-[#F7931A] text-sm mt-1">{fmt(foundPool?.shareAmount)} / {foundPool?.billingCycle}</p>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <Button type="submit" loading={joinPool.isPending} className="w-full">
              <UserPlus size={15} /> Confirm & Join
            </Button>
            <button type="button" onClick={() => { setStep('code'); setFoundPool(null); setError(''); }} className="font-mono text-xs text-[#94A3B8] hover:text-white text-center transition-colors">
              ← Use a different code
            </button>
          </form>
        )}

        <p className="font-mono text-xs text-[#94A3B8] text-center mt-4">
          Requires Trust Score ≥ 50 to join.
        </p>
      </div>
    </div>
  );
};

/* ─── Pool Card ───────────────────────────────────────────────────────────── */
const serviceIcons = { Netflix: '📺', Spotify: '🎵', YouTube: '▶️', Adobe: '🎨', Disney: '🏰', Apple: '🍎', default: '📦' };

const PoolCard = ({ pool, role }) => {
  const icon = serviceIcons[pool.serviceName] || serviceIcons.default;
  const slotsUsed = pool.members?.length || 0;

  return (
    <Link to={`/pools/${pool._id}`} className="group block">
      <div className="bg-[#0F1115] border border-white/8 rounded-2xl p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#F7931A]/30 group-hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/20 flex items-center justify-center text-xl">
              {icon}
            </div>
            <div>
              <div className="font-heading font-semibold text-white text-sm">{pool.serviceName}</div>
              <div className="font-mono text-xs text-[#94A3B8]">{pool.planTier}</div>
            </div>
          </div>
          <StatusBadge status={pool.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="font-mono text-xs text-[#94A3B8]">Your Share</div>
            <div className="font-heading font-bold text-[#F7931A]">
              {fmt(pool.shareAmount || 0)}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs text-[#94A3B8]">Members</div>
            <div className="font-mono text-sm text-white">{slotsUsed}/{pool.slots}</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={[
            'font-mono text-xs px-2 py-0.5 rounded-full border',
            role === 'host'
              ? 'text-[#F7931A] bg-[#F7931A]/10 border-[#F7931A]/30'
              : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
          ].join(' ')}>
            {role === 'host' ? '👑 Host' : '🤝 Contributor'}
          </span>
          <span className="font-mono text-xs text-[#94A3B8] capitalize">{pool.billingCycle}</span>
        </div>
      </div>
    </Link>
  );
};

/* ─── Dashboard Page ──────────────────────────────────────────────────────── */
const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const [showJoin, setShowJoin] = useState(false);
  const { data: myPoolsData, isLoading, refetch } = useMyPools();

  const myHostedPools = myPoolsData?.hosted || [];
  const myContribPools = myPoolsData?.contributing || [];

  const { data: txData } = useMyTransactions();

  const score = user?.trustScore ?? 100;

  // Build a set of poolIds the user has completed payments for
  const paidPoolIds = new Set(
    (txData?.transactions || [])
      .filter(tx => tx.status === 'completed' && tx.type === 'contributor_debit')
      .map(tx => (tx.poolId?._id || tx.poolId)?.toString())
  );

  const paymentsDue = myContribPools.filter(p => !paidPoolIds.has(p._id?.toString())).length;
  const monthlySaved = myContribPools
    .filter(p => paidPoolIds.has(p._id?.toString()))
    .reduce((acc, p) => acc + Math.round((p.totalCost - p.shareAmount) / 100), 0);

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-[#F7931A] opacity-[0.035] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <p className="font-mono text-xs text-[#F7931A] uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-white">
              Hey, <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span> 👋
            </h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Here's your SplitStream overview.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F7931A]/40 text-[#F7931A] hover:bg-[#F7931A]/10 font-mono text-xs uppercase tracking-wider transition-all duration-200"
            >
              <Key size={14} /> Join Pool
            </button>
            <Link to="/pools">
              <Button variant="outline" size="sm">
                <Search size={15} /> Browse Pools
              </Button>
            </Link>
            <Link to="/pools/create">
              <Button size="sm">
                <PlusCircle size={15} /> Create Pool
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Top Grid: Score + Stats ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {/* Trust Score Card */}
          <div className="md:col-span-1 bg-[#0F1115] border border-white/10 rounded-2xl p-7 flex flex-col items-center text-center hover:border-[#F7931A]/30 transition-all duration-300 hover:shadow-[0_0_40px_-15px_rgba(247,147,26,0.2)]">
            <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-widest mb-4">Trust Score</p>
            <TrustScoreDial score={score} size={160} />
            <div className="mt-4">
              <TrustBadge score={score} />
            </div>
            <p className="font-mono text-xs text-[#94A3B8] mt-3">Pay on time to earn +2 pts</p>
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[
              {
                label: 'Pools Hosting',
                value: isLoading ? '…' : myHostedPools.length,
                icon: Crown,
                color: 'text-[#F7931A]',
                bg: 'bg-[#F7931A]/10',
              },
              {
                label: 'Contributing To',
                value: isLoading ? '…' : myContribPools.length,
                icon: Users,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
              },
              {
                label: 'Monthly Saved',
                value: isLoading ? '…' : (monthlySaved > 0 ? fmt(monthlySaved * 100) : '₹--'),
                icon: TrendingUp,
                color: 'text-[#FFD600]',
                bg: 'bg-[#FFD600]/10',
              },
              {
                label: 'Payments Due',
                value: isLoading ? '…' : paymentsDue,
                icon: Clock,
                color: paymentsDue === 0 ? 'text-emerald-400' : 'text-red-400',
                bg: paymentsDue === 0 ? 'bg-emerald-400/10' : 'bg-red-400/10',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#0F1115] border border-white/8 rounded-2xl p-5 flex flex-col gap-3 hover:border-[#F7931A]/20 transition-all duration-300"
              >
                <div className={['w-9 h-9 rounded-lg flex items-center justify-center', stat.bg].join(' ')}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <div>
                  <div className="font-heading font-bold text-2xl text-white">{stat.value}</div>
                  <div className="font-mono text-xs text-[#94A3B8] mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Hosted Pools ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-xl text-white flex items-center gap-2">
              <Crown size={18} className="text-[#F7931A]" /> Pools You Host
            </h2>
            <Link to="/pools/create" className="font-mono text-xs text-[#F7931A] hover:text-[#FFD600] flex items-center gap-1 transition-colors">
              + New Pool
            </Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-[#0F1115] border border-white/5 rounded-2xl h-40 animate-pulse" />
              ))}
            </div>
          ) : myHostedPools.length === 0 ? (
            <div className="bg-[#0F1115] border border-dashed border-white/10 rounded-2xl p-10 text-center">
              <Zap size={36} className="text-[#F7931A]/40 mx-auto mb-3" />
              <p className="text-[#94A3B8] text-sm">You haven't created any pools yet.</p>
              <Link to="/pools/create" className="mt-4 inline-block">
                <Button size="sm" className="mt-3">Create Your First Pool</Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myHostedPools.map((pool) => (
                <PoolCard key={pool._id} pool={pool} role="host" />
              ))}
            </div>
          )}
        </section>

        {/* ── Contributing Pools ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-xl text-white flex items-center gap-2">
              <Users size={18} className="text-emerald-400" /> Contributing To
            </h2>
            <button
              onClick={() => setShowJoin(true)}
              className="font-mono text-xs text-[#F7931A] hover:text-[#FFD600] flex items-center gap-1 transition-colors"
            >
              <Key size={12} /> Join a pool <ArrowRight size={12} />
            </button>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-[#0F1115] border border-white/5 rounded-2xl h-40 animate-pulse" />
              ))}
            </div>
          ) : myContribPools.length === 0 ? (
            <div className="bg-[#0F1115] border border-dashed border-white/10 rounded-2xl p-10 text-center">
              <Users size={36} className="text-emerald-400/40 mx-auto mb-3" />
              <p className="text-[#94A3B8] text-sm">You haven't joined any pools yet.</p>
              <button onClick={() => setShowJoin(true)} className="mt-4 inline-block">
                <Button variant="outline" size="sm" className="mt-3"><Key size={14} /> Join a Pool</Button>
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myContribPools.map((pool) => (
                <PoolCard key={pool._id} pool={pool} role="contributor" />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Join Modal */}
      {showJoin && (
        <JoinPoolModal
          onClose={() => {
            setShowJoin(false);
            refetch();
          }}
        />
      )}
    </main>
  );
};

export default DashboardPage;
