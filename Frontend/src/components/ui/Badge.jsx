import React from 'react';

const getTrustConfig = (score) => {
  if (score >= 90) return { label: 'Trusted',          color: 'text-emerald-400',  bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', dot: 'bg-emerald-400' };
  if (score >= 70) return { label: 'Good Standing',    color: 'text-yellow-400',   bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30',  dot: 'bg-yellow-400' };
  if (score >= 50) return { label: 'Needs Improvement',color: 'text-orange-400',   bg: 'bg-orange-400/10',  border: 'border-orange-400/30',  dot: 'bg-orange-400' };
  return             { label: 'Restricted',           color: 'text-red-400',      bg: 'bg-red-400/10',     border: 'border-red-400/30',     dot: 'bg-red-400' };
};

export const TrustBadge = ({ score, className = '' }) => {
  const cfg = getTrustConfig(score ?? 100);
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'rounded-full border text-xs font-mono tracking-wider',
        cfg.bg, cfg.border, cfg.color,
        className,
      ].join(' ')}
    >
      <span className="relative flex h-2 w-2">
        <span className={['animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', cfg.dot].join(' ')} />
        <span className={['relative inline-flex rounded-full h-2 w-2', cfg.dot].join(' ')} />
      </span>
      {cfg.label}
    </span>
  );
};

export const ScoreBadge = ({ score, className = '' }) => {
  const cfg = getTrustConfig(score ?? 100);
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5',
        'rounded border text-xs font-mono',
        cfg.bg, cfg.border, cfg.color,
        className,
      ].join(' ')}
    >
      {score ?? 100}
    </span>
  );
};

export const StatusBadge = ({ status, className = '' }) => {
  const configs = {
    active:    { label: 'Active',    color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
    draft:     { label: 'Draft',     color: 'text-[#94A3B8]',   bg: 'bg-white/5',        border: 'border-white/10' },
    closed:    { label: 'Closed',    color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30' },
    pending:   { label: 'Pending',   color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30' },
    completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
    failed:    { label: 'Failed',    color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30' },
  };
  const cfg = configs[status] || configs.active;
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono border',
        cfg.bg, cfg.border, cfg.color,
        className,
      ].join(' ')}
    >
      {cfg.label}
    </span>
  );
};

export default TrustBadge;
