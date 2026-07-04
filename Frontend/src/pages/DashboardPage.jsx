import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';
import { usePools, useMyTransactions } from '../hooks/queries';
import {
  PlusCircle, Search, Calendar, Users,
  TrendingUp, Crown, Zap, ArrowRight, Clock
} from 'lucide-react';
import TrustScoreDial from '../components/ui/TrustScoreDial';
import { TrustBadge, StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (cents) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100);

const relativeDate = (d) => {
  const diff = new Date(d) - new Date();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
};

/* ─── Dashboard Page ──────────────────────────────────────────────────────── */
const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const { data: poolsData, isLoading } = usePools();

  const pools = poolsData?.pools || [];

  // Classify by user role inside each pool
  const myHostedPools = pools.filter((p) =>
    p.members?.some((m) => (m.userId === (user?.id || user?._id) || m.userId?._id === (user?.id || user?._id)) && m.role === 'host')
  );
  const myContribPools = pools.filter((p) =>
    p.members?.some((m) => (m.userId === (user?.id || user?._id) || m.userId?._id === (user?.id || user?._id)) && m.role === 'contributor')
  );

  const { data: txData } = useMyTransactions();

  const score = user?.trustScore ?? 100;

  // Build a set of poolIds the user has completed payments for in the current cycle
  const paidPoolIds = new Set(
    (txData?.transactions || [])
      .filter(tx => tx.status === 'completed' && tx.type === 'contributor_debit')
      .map(tx => (tx.poolId?._id || tx.poolId)?.toString())
  );

  // Payments due = contrib pools where user has NOT paid this cycle
  const paymentsDue = myContribPools.filter(p => !paidPoolIds.has(p._id?.toString())).length;

  // Monthly saved = sum of share amounts for paid pools vs solo price (estimate)
  const monthlySaved = myContribPools
    .filter(p => paidPoolIds.has(p._id?.toString()))
    .reduce((acc, p) => acc + Math.round((p.totalCost - p.shareAmount) / 100), 0);

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient background */}
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
                value: myHostedPools.length,
                icon: Crown,
                color: 'text-[#F7931A]',
                bg: 'bg-[#F7931A]/10',
              },
              {
                label: 'Contributing To',
                value: myContribPools.length,
                icon: Users,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10',
              },
              {
                label: 'Monthly Saved',
                value: monthlySaved > 0 ? fmt(monthlySaved * 100) : '₹--',
                icon: TrendingUp,
                color: 'text-[#FFD600]',
                bg: 'bg-[#FFD600]/10',
              },
              {
                label: 'Payments Due',
                value: paymentsDue,
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
            <div className="flex items-center justify-center h-32 text-[#94A3B8]">Loading...</div>
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
            <Link to="/pools" className="font-mono text-xs text-[#F7931A] hover:text-[#FFD600] flex items-center gap-1 transition-colors">
              Browse pools <ArrowRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-[#94A3B8]">Loading...</div>
          ) : myContribPools.length === 0 ? (
            <div className="bg-[#0F1115] border border-dashed border-white/10 rounded-2xl p-10 text-center">
              <Users size={36} className="text-emerald-400/40 mx-auto mb-3" />
              <p className="text-[#94A3B8] text-sm">You haven't joined any pools yet.</p>
              <Link to="/pools" className="mt-4 inline-block">
                <Button variant="outline" size="sm" className="mt-3">Browse Pools</Button>
              </Link>
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
    </main>
  );
};

/* ─── Pool Card ───────────────────────────────────────────────────────────── */
const serviceIcons = { Netflix: '📺', Spotify: '🎵', YouTube: '▶️', Adobe: '🎨', Disney: '🏰', default: '📦' };

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
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((pool.shareAmount || 0) / 100)}
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
            {role === 'host' ? 'Host' : 'Contributor'}
          </span>
          <span className="font-mono text-xs text-[#94A3B8] capitalize">{pool.billingCycle}</span>
        </div>
      </div>
    </Link>
  );
};

export default DashboardPage;
