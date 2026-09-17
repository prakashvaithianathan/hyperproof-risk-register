import React, { useState } from 'react';
import { Risk } from '../types/risk';
import { calculateInherentScore, getSeverityBand } from '../services/scoring';
import { Shield, Sparkles } from 'lucide-react';

interface RiskHeatmapProps {
  risks: Risk[];
  onSelectRisk: (risk: Risk) => void;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ risks, onSelectRisk }) => {
  const [hoveredCell, setHoveredCell] = useState<{ l: number; i: number } | null>(null);

  // Group risks by (likelihood, impact)
  const cellRisksMap = new Map<string, Risk[]>();
  for (const r of risks) {
    const key = `${r.likelihood}-${r.impact}`;
    if (!cellRisksMap.has(key)) {
      cellRisksMap.set(key, []);
    }
    cellRisksMap.get(key)!.push(r);
  }

  const getCellBg = (score: number) => {
    const band = getSeverityBand(score);
    switch (band) {
      case 'CRITICAL':
        return 'bg-rose-500/15 border-rose-400 hover:bg-rose-500/25';
      case 'HIGH':
        return 'bg-orange-500/15 border-orange-400 hover:bg-orange-500/25';
      case 'MEDIUM':
        return 'bg-amber-500/15 border-amber-400 hover:bg-amber-500/25';
      case 'LOW':
      default:
        return 'bg-emerald-500/15 border-emerald-400 hover:bg-emerald-500/25';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">5x5 Risk Likelihood & Impact Matrix</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> Live Distribution
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualization of inherent risk distribution across standard Likelihood × Impact severity quadrants.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium text-[11px] sm:text-xs">Low (1-5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 font-medium text-[11px] sm:text-xs">Med (6-12)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-slate-600 font-medium text-[11px] sm:text-xs">High (13-19)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600 font-medium text-[11px] sm:text-xs">Crit (20-25)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Heatmap Grid */}
        <div className="lg:col-span-8 overflow-x-auto pb-2">
          <div className="flex min-w-[340px] sm:min-w-0">
            {/* Y Axis Label */}
            <div className="flex items-center justify-center pr-2 sm:pr-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 -rotate-90 whitespace-nowrap">
                Likelihood →
              </span>
            </div>

            {/* Matrix Container */}
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[5, 4, 3, 2, 1].map((l) =>
                  [1, 2, 3, 4, 5].map((i) => {
                    const score = calculateInherentScore(l, i);
                    const cellRisks = cellRisksMap.get(`${l}-${i}`) || [];
                    const isHovered = hoveredCell?.l === l && hoveredCell?.i === i;

                    return (
                      <div
                        key={`${l}-${i}`}
                        onMouseEnter={() => setHoveredCell({ l, i })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (cellRisks.length > 0) {
                            onSelectRisk(cellRisks[0]);
                          } else {
                            setHoveredCell({ l, i });
                          }
                        }}
                        className={`relative rounded-xl border p-1.5 sm:p-2 min-h-[52px] sm:min-h-[64px] transition-all flex flex-col justify-between cursor-pointer ${getCellBg(
                          score
                        )} ${isHovered ? 'ring-2 ring-hyperproof-600 scale-[1.02] z-10 shadow-md' : ''}`}
                      >
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono font-bold text-slate-500">
                          <span>{score}</span>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 font-normal">
                            L{l}×I{i}
                          </span>
                        </div>

                        {cellRisks.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cellRisks.slice(0, 3).map((r) => (
                              <button
                                key={r.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectRisk(r);
                                }}
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-900 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow hover:scale-110 hover:bg-hyperproof-600 transition-transform"
                                title={`${r.title} (Inherent: ${r.inherentScore}, Residual: ${r.residualScore})`}
                              >
                                {r.category[0]}
                              </button>
                            ))}
                            {cellRisks.length > 3 && (
                              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-200 text-slate-700 text-[9px] sm:text-[10px] font-bold flex items-center justify-center">
                                +{cellRisks.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* X Axis Label */}
              <div className="text-center mt-3">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Impact →
                </span>
                <div className="grid grid-cols-5 text-center text-[9px] sm:text-[10px] text-slate-500 mt-1 font-medium">
                  <span>1 - Minor</span>
                  <span>2 - Low</span>
                  <span>3 - Med</span>
                  <span>4 - Major</span>
                  <span>5 - Crit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Cell Risk Inspector */}
        <div className="lg:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-200/80 min-h-[260px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Shield className="w-4 h-4 text-hyperproof-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cell Inspector {hoveredCell ? `(L${hoveredCell.l} × I${hoveredCell.i})` : ''}
              </h4>
            </div>

            {hoveredCell ? (
              <div className="mt-3 space-y-2">
                {(() => {
                  const cellRisks = cellRisksMap.get(`${hoveredCell.l}-${hoveredCell.i}`) || [];
                  const cellScore = calculateInherentScore(hoveredCell.l, hoveredCell.i);
                  const band = getSeverityBand(cellScore);

                  if (cellRisks.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 py-6 text-center italic">
                        No risks currently in this {band.toLowerCase()} severity quadrant (Score {cellScore}).
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {cellRisks.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => onSelectRisk(r)}
                          className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-hyperproof-500 cursor-pointer shadow-sm transition-all hover:translate-x-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 line-clamp-1">{r.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                            <span>Res: <strong className="text-slate-700">{r.residualScore}</strong></span>
                            <span>•</span>
                            <span>Controls: <strong className="text-slate-700">{r.mitigationCount}</strong></span>
                            <span>•</span>
                            <span className="text-[10px] uppercase font-bold text-hyperproof-600">{r.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                Hover over any matrix coordinate to inspect contained risks and control effectiveness.
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex justify-between">
            <span>Total Mapped Risks:</span>
            <strong className="text-slate-800">{risks.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
