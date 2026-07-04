import React from 'react';

const getArcColor = (score) => {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#fbbf24';
  if (score >= 50) return '#F7931A';
  return '#ef4444';
};

const TrustScoreDial = ({ score = 100, size = 180, className = '' }) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc spans 240 degrees (from 150° to 390°, bottom left to bottom right)
  const startAngleDeg = 150;
  const totalDeg = 240;
  const fillDeg = (clampedScore / 100) * totalDeg;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcPath = (startDeg, endDeg) => {
    const start = {
      x: cx + radius * Math.cos(toRad(startDeg)),
      y: cy + radius * Math.sin(toRad(startDeg)),
    };
    const end = {
      x: cx + radius * Math.cos(toRad(endDeg)),
      y: cy + radius * Math.sin(toRad(endDeg)),
    };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const trackPath = arcPath(startAngleDeg, startAngleDeg + totalDeg);
  const fillPath = fillDeg > 0 ? arcPath(startAngleDeg, startAngleDeg + fillDeg) : null;
  const color = getArcColor(clampedScore);

  return (
    <div className={['relative inline-flex items-center justify-center', className].join(' ')}>
      <svg width={size} height={size} aria-label={`Trust score: ${clampedScore}`}>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
              transition: 'stroke-dashoffset 0.6s ease',
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-heading font-bold leading-none"
          style={{ fontSize: size * 0.22, color }}
        >
          {clampedScore}
        </span>
        <span className="font-mono text-[#94A3B8] mt-1" style={{ fontSize: size * 0.07 }}>
          / 100
        </span>
      </div>
    </div>
  );
};

export default TrustScoreDial;
