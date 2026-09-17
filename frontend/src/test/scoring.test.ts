import { describe, it, expect } from 'vitest';
import {
  calculateInherentScore,
  getSeverityBand,
  calculateResidualScore,
  calculateReductionPercentage,
  SEVERITY_CONFIG,
} from '../services/scoring';

describe('Frontend Scoring Engine', () => {
  it('calculates inherent risk score correctly (Likelihood * Impact)', () => {
    expect(calculateInherentScore(1, 1)).toBe(1);
    expect(calculateInherentScore(5, 5)).toBe(25);
    expect(calculateInherentScore(4, 4)).toBe(16);
    expect(calculateInherentScore(3, 4)).toBe(12);
  });

  it('clamps likelihood and impact to [1, 5] bounds safely', () => {
    expect(calculateInherentScore(0, 3)).toBe(3); // 1 * 3
    expect(calculateInherentScore(6, 5)).toBe(25); // 5 * 5
  });

  it('maps scores to correct severity bands', () => {
    expect(getSeverityBand(1)).toBe('LOW');
    expect(getSeverityBand(5)).toBe('LOW');
    expect(getSeverityBand(6)).toBe('MEDIUM');
    expect(getSeverityBand(12)).toBe('MEDIUM');
    expect(getSeverityBand(13)).toBe('HIGH');
    expect(getSeverityBand(19)).toBe('HIGH');
    expect(getSeverityBand(20)).toBe('CRITICAL');
    expect(getSeverityBand(25)).toBe('CRITICAL');
  });

  it('returns inherent score when zero mitigations exist', () => {
    expect(calculateResidualScore(20, [])).toBe(20);
  });

  it('calculates 75% reduction for single highly effective mitigation (eff=5)', () => {
    // 25 * (1 - 5 * 0.15) = 25 * 0.25 = 6.25 -> round to 6
    const residual = calculateResidualScore(25, [{ effectiveness: 5 }]);
    expect(residual).toBe(6);
  });

  it('compounds multiple mitigations with diminishing marginal returns', () => {
    // 20 * (1 - 4 * 0.15) * (1 - 3 * 0.15) = 20 * 0.40 * 0.55 = 4.4 -> round to 4
    const residual = calculateResidualScore(20, [{ effectiveness: 4 }, { effectiveness: 3 }]);
    expect(residual).toBe(4);
  });

  it('strictly enforces minimum residual floor of 1', () => {
    const residual = calculateResidualScore(5, [
      { effectiveness: 5 },
      { effectiveness: 5 },
      { effectiveness: 5 },
    ]);
    expect(residual).toBe(1);
  });

  it('calculates risk reduction percentage accurately', () => {
    expect(calculateReductionPercentage(20, 20)).toBe(0);
    expect(calculateReductionPercentage(25, 6)).toBe(76);
    expect(calculateReductionPercentage(20, 4)).toBe(80);
  });

  it('provides visual metadata config for all severity bands', () => {
    expect(SEVERITY_CONFIG.LOW.label).toBe('Low');
    expect(SEVERITY_CONFIG.MEDIUM.label).toBe('Medium');
    expect(SEVERITY_CONFIG.HIGH.label).toBe('High');
    expect(SEVERITY_CONFIG.CRITICAL.label).toBe('Critical');
  });
});
