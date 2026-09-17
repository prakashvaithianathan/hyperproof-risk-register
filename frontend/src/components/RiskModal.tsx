import React, { useState, useEffect } from 'react';
import { Risk, CreateRiskPayload, UpdateRiskPayload, RiskCategory, RiskStatus } from '../types/risk';
import { calculateInherentScore, getSeverityBand } from '../services/scoring';
import { ScoreBadge } from './ScoreBadge';
import { CustomSelect } from './CustomSelect';
import { X, Sparkles, Shield, AlertTriangle } from 'lucide-react';

interface RiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRiskPayload | UpdateRiskPayload, isEdit: boolean) => Promise<void>;
  initialRisk?: Risk | null;
}

const FRAMEWORK_OPTIONS = [
  'SOC 2 CC6.1',
  'SOC 2 CC6.3',
  'SOC 2 CC7.1',
  'NIST CSF PR.AC-1',
  'NIST CSF PR.DS-1',
  'ISO 27001 A.12',
  'GDPR Art. 32',
  'HIPAA §164.312',
];

export const RiskModal: React.FC<RiskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialRisk,
}) => {
  const isEdit = Boolean(initialRisk);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RiskCategory>('SECURITY');
  const [owner, setOwner] = useState('');
  const [likelihood, setLikelihood] = useState<number>(3);
  const [impact, setImpact] = useState<number>(3);
  const [status, setStatus] = useState<RiskStatus>('OPEN');
  const [complianceFrameworks, setComplianceFrameworks] = useState<string[]>([]);
  const [nextReviewDate, setNextReviewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRisk) {
      setTitle(initialRisk.title || '');
      setDescription(initialRisk.description || '');
      setCategory(initialRisk.category || 'SECURITY');
      setOwner(initialRisk.owner || '');
      setLikelihood(initialRisk.likelihood || 3);
      setImpact(initialRisk.impact || 3);
      setStatus(initialRisk.status || 'OPEN');
      setComplianceFrameworks(initialRisk.complianceFrameworks || []);
      setNextReviewDate(initialRisk.nextReviewDate || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('SECURITY');
      setOwner('');
      setLikelihood(3);
      setImpact(3);
      setStatus('OPEN');
      setComplianceFrameworks(['SOC 2 CC6.1']);
      setNextReviewDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
    setError(null);
  }, [initialRisk, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Live computed scores
  const liveInherentScore = calculateInherentScore(likelihood, impact);
  const liveSeverityBand = getSeverityBand(liveInherentScore);

  const toggleFramework = (fw: string) => {
    if (complianceFrameworks.includes(fw)) {
      setComplianceFrameworks(complianceFrameworks.filter((f) => f !== fw));
    } else {
      setComplianceFrameworks([...complianceFrameworks, fw]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateRiskPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        owner: owner.trim() || undefined,
        likelihood,
        impact,
        status,
        complianceFrameworks,
        nextReviewDate: nextReviewDate || undefined,
      };

      await onSubmit(payload, isEdit);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save risk record');
    } finally {
      setSubmitting(false);
    }
  };

  const likelihoodLabels = ['', '1 (Rare)', '2 (Unlikely)', '3 (Moderate)', '4 (Likely)', '5 (Almost Certain)'];
  const impactLabels = ['', '1 (Insignificant)', '2 (Minor)', '3 (Moderate)', '4 (Major)', '5 (Catastrophic)'];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-hyperproof-50 border border-hyperproof-200 text-hyperproof-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Edit Risk Assessment' : 'Register New Organizational Risk'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Update severity, controls, and compliance scope' : 'Define inherent probability, impact, and controls'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error saving risk:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Risk Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unauthorized PII Data Ingestion in Analytics Pipeline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hyperproof-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Category & Status & Owner Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val as RiskCategory)}
                className="w-full"
                minWidth="w-full"
                options={[
                  { value: 'SECURITY', label: 'Security', dotColor: 'bg-rose-500' },
                  { value: 'COMPLIANCE', label: 'Compliance', dotColor: 'bg-teal-500' },
                  { value: 'OPERATIONAL', label: 'Operational', dotColor: 'bg-blue-500' },
                  { value: 'FINANCIAL', label: 'Financial', dotColor: 'bg-purple-500' },
                  { value: 'STRATEGIC', label: 'Strategic', dotColor: 'bg-indigo-500' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={status}
                onChange={(val) => setStatus(val as RiskStatus)}
                className="w-full"
                minWidth="w-full"
                options={[
                  { value: 'OPEN', label: 'Open', dotColor: 'bg-sky-500' },
                  { value: 'MITIGATING', label: 'Mitigating', dotColor: 'bg-amber-500' },
                  { value: 'CLOSED', label: 'Closed', dotColor: 'bg-slate-400' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Risk Owner
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Chen (SecOps)"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 focus:border-hyperproof-500 rounded-xl text-xs font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-hyperproof-500/20 transition-all placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Context
            </label>
            <textarea
              rows={2}
              placeholder="Describe the vulnerability, threat scenario, or compliance exposure..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-sm font-normal focus:outline-none focus:ring-2 focus:ring-hyperproof-500"
            />
          </div>

          {/* Interactive Likelihood & Impact with LIVE Computed Score */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-hyperproof-600" />
                Live Inherent Risk Scoring
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Computed Score:</span>
                <ScoreBadge score={liveInherentScore} severity={liveSeverityBand} size="md" />
              </div>
            </div>

            {/* Likelihood 1-5 buttons */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Likelihood: <span className="text-hyperproof-600 font-semibold">{likelihoodLabels[likelihood]}</span>
                </label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLikelihood(val)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      likelihood === val
                        ? 'bg-hyperproof-600 text-white border-hyperproof-600 shadow-sm scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact 1-5 buttons */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Impact: <span className="text-hyperproof-600 font-semibold">{impactLabels[impact]}</span>
                </label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setImpact(val)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      impact === val
                        ? 'bg-hyperproof-600 text-white border-hyperproof-600 shadow-sm scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance Frameworks mapping (Stretch Goal) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Compliance Framework Mapping (Stretch Goal)
            </label>
            <div className="flex flex-wrap gap-2">
              {FRAMEWORK_OPTIONS.map((fw) => {
                const selected = complianceFrameworks.includes(fw);
                return (
                  <button
                    key={fw}
                    type="button"
                    onClick={() => toggleFramework(fw)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      selected
                        ? 'bg-hyperproof-50 text-hyperproof-700 border-hyperproof-300 ring-1 ring-hyperproof-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {fw}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Review Date (Stretch Goal) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Next Review Date (Stretch Goal)
            </label>
            <input
              type="date"
              value={nextReviewDate}
              onChange={(e) => setNextReviewDate(e.target.value)}
              className="px-3.5 py-2 bg-slate-50/50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-hyperproof-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold text-white bg-hyperproof-600 hover:bg-hyperproof-700 disabled:opacity-50 rounded-xl shadow-md shadow-hyperproof-600/20 transition-all"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
