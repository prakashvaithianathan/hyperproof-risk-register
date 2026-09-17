import React, { useState, useEffect } from 'react';
import { Risk, CreateMitigationPayload, RiskStatus } from '../types/risk';
import { ScoreBadge } from './ScoreBadge';
import { CATEGORY_CONFIG, calculateResidualScore, getSeverityBand } from '../services/scoring';
import {
  X,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Star,
  User,
  Calendar,
  Layers,
  Edit,
} from 'lucide-react';

interface RiskDetailDrawerProps {
  risk: Risk | null;
  isOpen: boolean;
  onClose: () => void;
  onAddMitigation: (riskId: string, payload: CreateMitigationPayload) => Promise<void>;
  onDeleteMitigation: (riskId: string, mitigationId: string) => Promise<void>;
  onUpdateStatus: (riskId: string, newStatus: RiskStatus) => Promise<void>;
  onEditRisk: (risk: Risk) => void;
}

export const RiskDetailDrawer: React.FC<RiskDetailDrawerProps> = ({
  risk,
  isOpen,
  onClose,
  onAddMitigation,
  onDeleteMitigation,
  onUpdateStatus,
  onEditRisk,
}) => {
  const [mitigationDesc, setMitigationDesc] = useState('');
  const [effectiveness, setEffectiveness] = useState<number>(4);
  const [isAddingMitigation, setIsAddingMitigation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !risk) return null;

  const catConfig = CATEGORY_CONFIG[risk.category] || CATEGORY_CONFIG.OPERATIONAL;
  const currentMitigations = risk.mitigations || [];

  // Live simulation of new mitigation addition
  const simulatedMitigations = [
    ...currentMitigations.map((m) => ({ effectiveness: m.effectiveness })),
    { effectiveness },
  ];
  const simulatedResidualScore = calculateResidualScore(risk.inherentScore, simulatedMitigations);
  const simulatedSeverityBand = getSeverityBand(simulatedResidualScore);
  const projectedDrop = risk.residualScore - simulatedResidualScore;

  const handleCreateMitigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitigationDesc.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await onAddMitigation(risk.id, {
        description: mitigationDesc.trim(),
        effectiveness,
      });
      setMitigationDesc('');
      setEffectiveness(4);
      setIsAddingMitigation(false);
    } catch (err: any) {
      setError(err.message || 'Failed to attach mitigation control');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: RiskStatus) => {
    if (newStatus === risk.status) return;
    setStatusUpdating(true);
    setError(null);
    try {
      await onUpdateStatus(risk.id, newStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteMitigation = async (mitigationId: string) => {
    setError(null);
    try {
      await onDeleteMitigation(risk.id, mitigationId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete mitigation');
    }
  };

  const effectivenessLabels = [
    '',
    '1 - Minimal (15% reduction)',
    '2 - Minor (30% reduction)',
    '3 - Moderate (45% reduction)',
    '4 - High (60% reduction)',
    '5 - Critical / Automated (75% reduction)',
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 cursor-default w-full sm:w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full sm:w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/75">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${catConfig.bg}`}>
                    {catConfig.label}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {risk.id.substring(0, 8)}...
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {risk.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metadata & Status bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200/80 text-xs">
              <div className="flex items-center gap-4 text-slate-600">
                {risk.owner && (
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {risk.owner}
                  </span>
                )}
                {risk.nextReviewDate && (
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Review: {risk.nextReviewDate}
                  </span>
                )}
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold text-[11px] uppercase">Status:</span>
                <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 border border-slate-300">
                  {(['OPEN', 'MITIGATING', 'CLOSED'] as RiskStatus[]).map((s) => (
                    <button
                      key={s}
                      disabled={statusUpdating}
                      onClick={() => handleStatusChange(s)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        risk.status === s
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">Compliance / Validation Notice</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Score Comparison Gauge */}
            <div className="bg-gradient-to-br from-slate-50 to-sky-50/40 rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-hyperproof-600" />
                  Continuous Risk Scoring Analysis
                </h3>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  Scale: 1 – 25
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Inherent Score Card */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Inherent Risk
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Before controls</p>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-3xl font-black text-slate-900 font-mono">
                      {risk.inherentScore}
                    </div>
                    <ScoreBadge score={risk.inherentScore} severity={risk.inherentSeverity} size="sm" />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 font-mono">
                    Likelihood {risk.likelihood} × Impact {risk.impact}
                  </div>
                </div>

                {/* Residual Score Card */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Residual Risk
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Post-mitigation remaining</p>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-3xl font-black text-hyperproof-600 font-mono">
                      {risk.residualScore}
                    </div>
                    <ScoreBadge score={risk.residualScore} severity={risk.residualSeverity} size="sm" />
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>-{risk.reductionPercentage}% Risk Reduction</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description and Frameworks */}
            {risk.description && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Scenario & Impact Description
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {risk.description}
                </p>
              </div>
            )}

            {/* Compliance Framework Mapping Chips */}
            {risk.complianceFrameworks && risk.complianceFrameworks.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Mapped Compliance Frameworks
                </h4>
                <div className="flex flex-wrap gap-2">
                  {risk.complianceFrameworks.map((fw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mitigations & Controls Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Applied Mitigating Controls ({currentMitigations.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controls actively dampening inherent probability or impact
                  </p>
                </div>

                {!isAddingMitigation && (
                  <button
                    onClick={() => setIsAddingMitigation(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-hyperproof-600 hover:bg-hyperproof-700 rounded-xl shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Control
                  </button>
                )}
              </div>

              {/* Add Mitigation Inline Form */}
              {isAddingMitigation && (
                <form
                  onSubmit={handleCreateMitigation}
                  className="bg-sky-50/50 border border-sky-200 rounded-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      Add Mitigation Control
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingMitigation(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Control Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Automated IAM zero-trust policy with periodic access reviews..."
                      value={mitigationDesc}
                      onChange={(e) => setMitigationDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-hyperproof-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Effectiveness Rating:
                      </label>
                      <span className="text-xs font-semibold text-hyperproof-700 font-mono">
                        {effectivenessLabels[effectiveness]}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEffectiveness(val)}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                            effectiveness === val
                              ? 'bg-hyperproof-600 text-white border-hyperproof-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ★ {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Simulation of Score Impact */}
                  <div className="p-3 bg-white rounded-xl border border-sky-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Projected Residual Score:
                    </span>
                    <div className="flex items-center gap-2">
                      <ScoreBadge
                        score={simulatedResidualScore}
                        severity={simulatedSeverityBand}
                        size="sm"
                      />
                      {projectedDrop > 0 && (
                        <span className="text-emerald-700 font-bold">
                          (-{projectedDrop} pts)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingMitigation(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-hyperproof-600 hover:bg-hyperproof-700 rounded-lg shadow-sm"
                    >
                      {submitting ? 'Attaching...' : 'Save & Attach Control'}
                    </button>
                  </div>
                </form>
              )}

              {/* Mitigations List */}
              {currentMitigations.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No mitigating controls attached</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Residual risk currently equals inherent risk ({risk.inherentScore}). Add controls to reduce exposure.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentMitigations.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-800">
                            Control #{idx + 1}
                          </span>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= m.effectiveness
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            (Eff: {m.effectiveness}/5 • {m.effectiveness * 15}% factor)
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-normal leading-relaxed">
                          {m.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteMitigation(m.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Remove Control"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/75 flex items-center justify-between">
            <button
              onClick={() => onEditRisk(risk)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Risk Attributes
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
