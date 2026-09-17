import React from 'react';
import { RiskStats } from '../types/risk';
import { ShieldAlert, Activity, CheckCircle2, TrendingDown, Clock } from 'lucide-react';

interface RiskStatsCardsProps {
  stats: RiskStats | null;
  loading: boolean;
}

export const RiskStatsCards: React.FC<RiskStatsCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 sm:h-24 bg-white/70 rounded-2xl border border-slate-200 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const criticalAndHighResiduals =
    (stats.residualSeverityDistribution?.CRITICAL || 0) + (stats.residualSeverityDistribution?.HIGH || 0);

  const cards = [
    {
      title: 'Total Tracked Risks',
      value: stats.totalRisks,
      subtitle: `${stats.openRisks} open • ${stats.mitigatingRisks} mitigating`,
      icon: Activity,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50 border-sky-200',
    },
    {
      title: 'Critical / High Residual',
      value: criticalAndHighResiduals,
      subtitle: `${stats.residualSeverityDistribution?.CRITICAL || 0} Critical • ${stats.residualSeverityDistribution?.HIGH || 0} High`,
      icon: ShieldAlert,
      iconColor: criticalAndHighResiduals > 0 ? 'text-rose-600' : 'text-slate-600',
      iconBg: criticalAndHighResiduals > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200',
    },
    {
      title: 'Avg. Risk Reduction',
      value: `${stats.averageResidualReductionPercentage}%`,
      subtitle: 'Post-mitigation dampening',
      icon: TrendingDown,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Resolved / Closed',
      value: stats.closedRisks,
      subtitle: 'Verified compliant & closed',
      icon: CheckCircle2,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Overdue Reviews',
      value: stats.overdueReviews,
      subtitle: stats.overdueReviews > 0 ? 'Action required immediately' : 'All review dates on track',
      icon: Clock,
      iconColor: stats.overdueReviews > 0 ? 'text-amber-600' : 'text-slate-600',
      iconBg: stats.overdueReviews > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isLastOdd = idx === cards.length - 1 && cards.length % 2 !== 0;
        return (
          <div
            key={idx}
            className={`bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between ${
              isLastOdd ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-tight line-clamp-1">{card.title}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl border ${card.iconBg} shrink-0 ml-1`}>
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{card.value}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{card.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
