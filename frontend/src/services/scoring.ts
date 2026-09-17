import { SeverityBand } from '../types/risk';

export function calculateInherentScore(likelihood: number, impact: number): number {
  const l = Math.max(1, Math.min(5, likelihood || 1));
  const i = Math.max(1, Math.min(5, impact || 1));
  return l * i;
}

export function getSeverityBand(score: number): SeverityBand {
  if (score <= 5) return 'LOW';
  if (score <= 12) return 'MEDIUM';
  if (score <= 19) return 'HIGH';
  return 'CRITICAL';
}

export function calculateResidualScore(inherentScore: number, mitigations: Array<{ effectiveness: number }>): number {
  if (!mitigations || mitigations.length === 0) {
    return inherentScore;
  }

  let compoundMultiplier = 1.0;
  for (const m of mitigations) {
    const eff = Math.max(1, Math.min(5, m.effectiveness || 1));
    const retentionFraction = 1.0 - (eff * 0.15);
    compoundMultiplier *= retentionFraction;
  }

  const calculated = Math.round(inherentScore * compoundMultiplier);
  return Math.max(1, calculated);
}

export function calculateReductionPercentage(inherentScore: number, residualScore: number): number {
  if (inherentScore <= 0) return 0;
  const reduction = ((inherentScore - residualScore) / inherentScore) * 100;
  return Math.round(reduction * 10) / 10;
}

export const SEVERITY_CONFIG: Record<
  SeverityBand,
  { label: string; bg: string; text: string; border: string; badgeClass: string; dotClass: string; hex: string }
> = {
  LOW: {
    label: 'Low',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
    hex: '#10b981',
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    hex: '#f59e0b',
  },
  HIGH: {
    label: 'High',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    dotClass: 'bg-orange-500',
    hex: '#f97316',
  },
  CRITICAL: {
    label: 'Critical',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-500',
    hex: '#ef4444',
  },
};

export const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  OPERATIONAL: { label: 'Operational', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', icon: 'Cpu' },
  FINANCIAL: { label: 'Financial', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', icon: 'DollarSign' },
  COMPLIANCE: { label: 'Compliance', bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-700', icon: 'ShieldCheck' },
  SECURITY: { label: 'Security', bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', icon: 'Lock' },
  STRATEGIC: { label: 'Strategic', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700', icon: 'Target' },
};
