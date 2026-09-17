import React from 'react';
import { SeverityBand } from '../types/risk';
import { SEVERITY_CONFIG } from '../services/scoring';

interface ScoreBadgeProps {
  score: number;
  severity: SeverityBand;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  severity,
  size = 'md',
  showLabel = true,
}) => {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-bold',
    lg: 'px-3.5 py-1.5 text-sm font-bold',
  };

  const numberSizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-all ${config.badgeClass} ${sizeClasses[size]}`}
      title={`Score: ${score}/25 (${config.label} Severity)`}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-white/80 font-mono font-bold text-slate-800 ${numberSizeClasses[size]}`}
      >
        {score}
      </span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
