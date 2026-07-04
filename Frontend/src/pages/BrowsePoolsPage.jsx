import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Users, ArrowUpDown, Zap, ChevronRight } from 'lucide-react';
import { usePools } from '../hooks/queries';
import { TrustBadge, StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const serviceIcons = {
  'Netflix': '📺',
  'Amazon Prime': '🎬',
  'Disney+': '🏰',
  'Spotify Premium': '🎵',
  'Spotify': '🎵',
  'YouTube Premium': '▶️',
  'YouTube': '▶️',
  'Apple Music': '🍎',
  'ChatGPT Plus': '💬',
  'Google AI Pro (Gemini)': '✨',
  'Claude Pro': '🧠',
  'Perplexity Pro': '🔍',
  'Microsoft 365': '💼',
  'Adobe Creative Cloud': '🎨',
  'Adobe': '🎨',
  'Canva Pro': '🖌️',
  'Notion Plus': '📝',
  'Figma Professional': '📐',
  'Dropbox Plus': '☁️',
  'Google One': '💾',
  'LinkedIn Premium': '👔',
  'Duolingo Super': '🦉',
  'Xbox Game Pass Ultimate': '🎮',
  default: '📦'
};

const fmt = (cents) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cents / 100);

/* ─── Pool Card ───────────────────────────────────────────────────────────── */
const PoolCard = ({ pool }) => {
  const icon = serviceIcons[pool.serviceName] || serviceIcons.default;
  const slotsAvail = pool.slots - (pool.members?.length || 0);

  return (
    <Link to={`/pools/${pool._id}`} className="group block h-full">
      <div className="h-full bg-[#0F1115] border border-white/8 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#F7931A]/35 group-hover:shadow-[0_0_40px_-15px_rgba(247,147,26,0.25)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/20 flex items-center justify-center text-2xl">
              {icon}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-white">{pool.serviceName}</h3>
              <p className="font-mono text-xs text-[#94A3B8]">{pool.planTier}</p>
            </div>
          </div>
          <StatusBadge status={pool.status} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 flex-1">
          <div className="bg-black/30 rounded-xl p-3">
            <div className="font-mono text-xs text-[#94A3B8] mb-1">Per slot</div>
            <div className="font-heading font-bold text-[#F7931A] text-sm">{fmt(pool.shareAmount)}</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <div className="font-mono text-xs text-[#94A3B8] mb-1">Open slots</div>
            <div className={['font-heading font-bold text-sm', slotsAvail > 0 ? 'text-emerald-400' : 'text-red-400'].join(' ')}>
              {slotsAvail}/{pool.slots}
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-3">
            <div className="font-mono text-xs text-[#94A3B8] mb-1">Cycle</div>
            <div className="font-mono text-xs text-white capitalize">{pool.billingCycle}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center text-[10px] text-white font-bold">
              {pool.host?.name?.[0]?.toUpperCase() || 'H'}
            </div>
            <span className="text-[#94A3B8] text-xs">{pool.host?.name || 'Host'}</span>
            {pool.host?.trustScore !== undefined && (
              <TrustBadge score={pool.host.trustScore} className="text-[10px] px-2 py-0.5" />
            )}
          </div>
          <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-[#F7931A] transition-colors" />
        </div>
      </div>
    </Link>
  );
};

/* ─── Browse Pools Page ───────────────────────────────────────────────────── */
const BrowsePoolsPage = () => {
  const [filters, setFilters] = useState({
    service: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = usePools(filters);
  const pools = data?.pools || [];

  const sortOptions = [
    { value: 'newest',     label: 'Newest First' },
    { value: 'price_asc',  label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'trust',      label: 'Host Trust Score' },
  ];

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#F7931A] opacity-[0.04] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs text-[#F7931A] uppercase tracking-widest mb-2">Marketplace</p>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-white mb-2">
            Browse <span className="gradient-text">Active Pools</span>
          </h1>
          <p className="text-[#94A3B8] text-sm">Find subscription pools to join and start saving.</p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by service name..."
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
              className="w-full bg-[#0F1115] border border-white/10 rounded-full px-4 pl-10 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#F7931A]/50 transition-colors"
              aria-label="Search pools"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-mono transition-all duration-300',
                showFilters
                  ? 'border-[#F7931A]/50 text-[#F7931A] bg-[#F7931A]/10'
                  : 'border-white/10 text-[#94A3B8] hover:border-white/30 hover:text-white',
              ].join(' ')}
              aria-expanded={showFilters}
            >
              <Filter size={14} /> Filters
            </button>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="bg-[#0F1115] border border-white/10 rounded-full px-4 py-2.5 text-sm font-mono text-[#94A3B8] focus:outline-none focus:border-[#F7931A]/50 transition-colors"
              aria-label="Sort pools"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-6 mb-6 grid sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">Min Price (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="bg-black/50 border-b-2 border-white/20 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F7931A] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">Max Price (₹)</label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="bg-black/50 border-b-2 border-white/20 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F7931A] transition-colors"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ service: '', minPrice: '', maxPrice: '', sort: 'newest' })}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex items-center gap-2 mb-5">
          <span className="font-mono text-sm text-[#94A3B8]">
            {isLoading ? 'Loading...' : `${pools.length} pool${pools.length !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 text-red-400 text-sm mb-6">
            Failed to load pools. Make sure the backend is running.
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-[#0F1115] border border-white/5 rounded-2xl h-56 animate-pulse" />
            ))}
          </div>
        ) : pools.length === 0 ? (
          <div className="text-center py-20">
            <Zap size={48} className="text-[#F7931A]/30 mx-auto mb-4" />
            <p className="text-[#94A3B8] mb-4">No pools found matching your filters.</p>
            <Button variant="outline" onClick={() => setFilters({ service: '', minPrice: '', maxPrice: '', sort: 'newest' })}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <PoolCard key={pool._id} pool={pool} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default BrowsePoolsPage;
