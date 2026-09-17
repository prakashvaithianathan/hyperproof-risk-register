import React from 'react';
import { Risk, RiskStatus } from '../types/risk';
import { ScoreBadge } from './ScoreBadge';
import { CATEGORY_CONFIG } from '../services/scoring';
import {
  ShieldAlert,
  Sliders,
  ChevronRight,
  TrendingDown,
  Trash2,
  Edit,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  User,
} from 'lucide-react';

interface RiskTableProps {
  risks: Risk[];
  loading: boolean;
  onSelectRisk: (risk: Risk) => void;
  onEditRisk: (risk: Risk) => void;
  onDeleteRisk: (id: string, title: string) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onToggleSort: (field: string) => void;
}

export const RiskTable: React.FC<RiskTableProps> = ({
  risks,
  loading,
  onSelectRisk,
  onEditRisk,
  onDeleteRisk,
  sortBy,
  sortDirection,
  onToggleSort,
}) => {
  const getStatusBadge = (status: RiskStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            Open
          </span>
        );
      case 'MITIGATING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Mitigating
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Closed
          </span>
        );
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy.toLowerCase() === field.toLowerCase()) {
      return (
        <span className="text-hyperproof-600 font-bold ml-1 text-xs">
          {sortDirection === 'asc' ? '↑' : '↓'}
        </span>
      );
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1 inline opacity-0 group-hover:opacity-100" />;
  };

  if (loading && risks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-hyperproof-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Loading risk register records...</p>
      </div>
    );
  }

  if (risks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No risks match your filter criteria</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Try adjusting your search query, status, or category filters to find registered organizational risks.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Mobile Card View (< md) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {risks.map((risk) => {
          const catConfig = CATEGORY_CONFIG[risk.category] || CATEGORY_CONFIG.OPERATIONAL;
          const hasMitigations = risk.mitigationCount > 0;

          return (
            <div
              key={risk.id}
              onClick={() => onSelectRisk(risk)}
              className="p-4 hover:bg-sky-50/40 transition-colors cursor-pointer space-y-3"
            >
              {/* Card Header: Category, Status & Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${catConfig.bg}`}>
                    {catConfig.label}
                  </span>
                  {getStatusBadge(risk.status)}
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditRisk(risk)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteRisk(risk.id, risk.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectRisk(risk)}
                    className="p-1.5 text-slate-400 hover:text-hyperproof-600"
                    title="Open"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {risk.title}
                </h4>
                {risk.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-normal">
                    {risk.description}
                  </p>
                )}
              </div>

              {/* Score Badges Row */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Inherent (L{risk.likelihood}×I{risk.impact})
                  </span>
                  <ScoreBadge score={risk.inherentScore} severity={risk.inherentSeverity} size="sm" />
                </div>

                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Residual Risk
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ScoreBadge score={risk.residualScore} severity={risk.residualSeverity} size="sm" />
                    {hasMitigations && risk.reductionPercentage > 0 && (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-600">
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                        -{risk.reductionPercentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Framework tags & Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-3 flex-wrap">
                  {risk.owner && (
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <User className="w-3 h-3 text-slate-400" />
                      {risk.owner}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Sliders className="w-3 h-3 text-slate-400" />
                    {risk.mitigationCount} {risk.mitigationCount === 1 ? 'control' : 'controls'}
                  </span>
                </div>

                {risk.nextReviewDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{risk.nextReviewDate}</span>
                    {risk.isOverdue && (
                      <span className="text-rose-600 font-bold flex items-center gap-0.5 ml-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Compliance Framework Chips */}
              {risk.complianceFrameworks && risk.complianceFrameworks.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {risk.complianceFrameworks.map((fw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 group"
                onClick={() => onToggleSort('title')}
              >
                <div className="flex items-center">
                  <span>Risk Title & Details</span>
                  {getSortIcon('title')}
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-slate-800 group"
                onClick={() => onToggleSort('category')}
              >
                <div className="flex items-center">
                  <span>Category</span>
                  {getSortIcon('category')}
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-slate-800 group"
                onClick={() => onToggleSort('status')}
              >
                <div className="flex items-center">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-slate-800 group"
                onClick={() => onToggleSort('inherentScore')}
              >
                <div className="flex items-center">
                  <span>Inherent Score</span>
                  {getSortIcon('inherentScore')}
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-slate-800 group"
                onClick={() => onToggleSort('residualScore')}
              >
                <div className="flex items-center">
                  <span>Residual Score</span>
                  {getSortIcon('residualScore')}
                </div>
              </th>
              <th className="py-3.5 px-3">
                <span>Mitigations</span>
              </th>
              <th className="py-3.5 px-3">
                <span>Review Date</span>
              </th>
              <th className="py-3.5 px-4 text-right">
                <span>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {risks.map((risk) => {
              const catConfig = CATEGORY_CONFIG[risk.category] || CATEGORY_CONFIG.OPERATIONAL;
              const hasMitigations = risk.mitigationCount > 0;

              return (
                <tr
                  key={risk.id}
                  onClick={() => onSelectRisk(risk)}
                  className="hover:bg-sky-50/40 cursor-pointer transition-colors group"
                >
                  {/* Title & Description */}
                  <td className="py-4 px-4 max-w-md">
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 group-hover:text-hyperproof-600 transition-colors line-clamp-1">
                            {risk.title}
                          </h4>
                        </div>
                        {risk.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-normal">
                            {risk.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                          {risk.owner && (
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <User className="w-3 h-3 text-slate-400" />
                              {risk.owner}
                            </span>
                          )}
                          {risk.complianceFrameworks && risk.complianceFrameworks.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {risk.complianceFrameworks.slice(0, 2).map((fw, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap"
                                >
                                  {fw}
                                </span>
                              ))}
                              {risk.complianceFrameworks.length > 2 && (
                                <span className="text-[10px] text-slate-400">
                                  +{risk.complianceFrameworks.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${catConfig.bg}`}>
                      {catConfig.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    {getStatusBadge(risk.status)}
                  </td>

                  {/* Inherent Score */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-0.5">
                      <ScoreBadge score={risk.inherentScore} severity={risk.inherentSeverity} />
                      <span className="text-[10px] font-mono text-slate-400 pl-1">
                        L{risk.likelihood} × I{risk.impact}
                      </span>
                    </div>
                  </td>

                  {/* Residual Score */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-0.5">
                      <ScoreBadge score={risk.residualScore} severity={risk.residualSeverity} />
                      {hasMitigations && risk.reductionPercentage > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 pl-1">
                          <TrendingDown className="w-3 h-3" />
                          -{risk.reductionPercentage}%
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Mitigation Count */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                        hasMitigations
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {risk.mitigationCount} {risk.mitigationCount === 1 ? 'control' : 'controls'}
                    </span>
                  </td>

                  {/* Next Review Date & Overdue */}
                  <td className="py-4 px-3 whitespace-nowrap">
                    {risk.nextReviewDate ? (
                      <div className="flex flex-col text-xs">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {risk.nextReviewDate}
                        </span>
                        {risk.isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not scheduled</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEditRisk(risk)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Risk"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRisk(risk.id, risk.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Risk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectRisk(risk)}
                        className="p-1.5 text-slate-400 group-hover:text-hyperproof-600 group-hover:translate-x-0.5 transition-all"
                        title="Open Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
