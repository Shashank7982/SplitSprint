import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../store/authSlice';
import { useMyTransactions } from '../hooks/queries';
import TrustScoreDial from '../components/ui/TrustScoreDial';
import { TrustBadge } from '../components/ui/Badge';
import { Shield, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import TrustScoreDialComponent from '../components/ui/TrustScoreDial';

const tips = [
  { icon: CheckCircle, color: 'text-emerald-400', tip: 'Pay on time every cycle — earns +2 trust points each payment.' },
  { icon: Clock,       color: 'text-[#F7931A]',   tip: 'Never miss a payment. Failed payments subtract 10 points.' },
  { icon: RotateCcw,   color: 'text-blue-400',    tip: 'Retry failed payments quickly — retried success gives +1 point.' },
  { icon: Shield,      color: 'text-[#FFD600]',   tip: 'Stay active in pools. Pool default costs -25 points.' },
];

const transactionIcons = {
  completed: { icon: TrendingUp,   color: 'text-emerald-400', label: 'Payment' },
  failed:    { icon: TrendingDown, color: 'text-red-400',     label: 'Failed' },
  pending:   { icon: Clock,        color: 'text-yellow-400',  label: 'Pending' },
};

const fmt = (cents) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100);

const ProfilePage = () => {
  const user = useSelector(selectCurrentUser);
  const score = user?.trustScore ?? 100;
  const { data: txData, isLoading: txLoading } = useMyTransactions();

  const realTransactions = txData?.transactions || [];

  const getTierLabel = (s) => {
    if (s >= 90) return { label: 'Trusted',           color: 'text-emerald-400', range: '90–100' };
    if (s >= 70) return { label: 'Good Standing',     color: 'text-yellow-400',  range: '70–89'  };
    if (s >= 50) return { label: 'Needs Improvement', color: 'text-orange-400',  range: '50–69'  };
    return              { label: 'Restricted',        color: 'text-red-400',     range: '< 50'   };
  };

  const tier = getTierLabel(score);

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-[#F7931A] opacity-[0.035] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs text-[#F7931A] uppercase tracking-widest mb-2">Profile</p>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-white">
            {user?.name || 'Your'} <span className="gradient-text">Profile</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left: Score + Info ── */}
          <div className="flex flex-col gap-6">
            {/* Score Card */}
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-[#F7931A]/30 transition-all duration-300 hover:shadow-[0_0_40px_-15px_rgba(247,147,26,0.2)]">
              <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-widest mb-5">Trust Score</p>
              <TrustScoreDialComponent score={score} size={200} className="mb-4" />
              <TrustBadge score={score} className="mb-3" />
              <div className={['font-heading font-semibold text-sm', tier.color].join(' ')}>
                Tier: {tier.label}
              </div>
              <p className="font-mono text-xs text-[#94A3B8] mt-2">Range: {tier.range}</p>
            </div>

            {/* User Info */}
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-white mb-4">Account Info</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Name',  value: user?.name  || '—' },
                  { label: 'Email', value: user?.email || '—' },
                  { label: 'Role',  value: user?.role  || 'user' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">{label}</span>
                    <span className="text-white text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Transactions + Tips ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Transaction History */}
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-7">
              <h2 className="font-heading font-semibold text-white mb-5 flex items-center gap-2">
                <TrendingUp size={17} className="text-[#F7931A]" /> Transaction History
              </h2>
              <div className="flex flex-col">
                {txLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 rounded-full border-2 border-[#F7931A] border-t-transparent animate-spin" />
                  </div>
                ) : realTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock size={32} className="text-[#94A3B8]/40 mx-auto mb-3" />
                    <p className="text-[#94A3B8] text-sm">No transactions yet. Pay your first share!</p>
                  </div>
                ) : realTransactions.map((tx, i) => {
                  const cfg = transactionIcons[tx.status] || transactionIcons.pending;
                  const points = tx.status === 'completed' ? '+2' : tx.status === 'failed' ? '-10' : '—';
                  const positive = points.startsWith('+');
                  const neutral = points === '—';
                  return (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between py-4 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className={['w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                          tx.status === 'completed' ? 'bg-emerald-400/10' :
                          tx.status === 'failed'    ? 'bg-red-400/10' :
                                                      'bg-yellow-400/10'
                        ].join(' ')}>
                          <cfg.icon size={16} className={cfg.color} />
                        </div>
                        <div>
                          <div className="font-heading font-medium text-white text-sm">{tx.poolId?.serviceName || 'Pool'}</div>
                          <div className="font-mono text-xs text-[#94A3B8]">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {cfg.label}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="font-heading font-semibold text-white text-sm">{fmt(tx.amount)}</span>
                        <span className={[
                          'font-mono text-xs font-bold px-2 py-0.5 rounded-full border min-w-[40px] text-center',
                          positive ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' :
                          neutral  ? 'text-[#94A3B8] bg-white/5 border-white/10' :
                                     'text-red-400 bg-red-400/10 border-red-400/30',
                        ].join(' ')}>
                          {points}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-7">
              <h2 className="font-heading font-semibold text-white mb-5 flex items-center gap-2">
                <Shield size={17} className="text-[#F7931A]" /> How to Improve Your Score
              </h2>
              <div className="flex flex-col gap-4">
                {tips.map(({ icon: Icon, color, tip }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={15} className={color} />
                    </div>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-white/5">
                <Link to="/pools">
                  <button className="flex items-center gap-2 text-[#F7931A] hover:text-[#FFD600] transition-colors font-mono text-sm">
                    Start paying on time <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
