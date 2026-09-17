package com.hyperproof.risk.service;

import com.hyperproof.risk.entity.Mitigation;
import com.hyperproof.risk.entity.SeverityBand;
import org.springframework.stereotype.Service;

import java.util.Collection;

/**
 * Core risk scoring engine.
 * 
 * Inherent Risk:
 *   Inherent Score = Likelihood (1-5) * Impact (1-5) -> Range [1, 25]
 * 
 * Residual Risk:
 *   Residual Score = max(1, round(Inherent * Product(1 - effectiveness_i * 0.15)))
 *   - Effectiveness range is [1, 5].
 *   - 0 mitigations -> factor = 1.0 -> Residual = Inherent
 *   - 1 mitigation with effectiveness 5 -> 75% reduction (e.g. 25 -> 6)
 *   - Multiple mitigations compound with diminishing marginal returns (defense-in-depth)
 *   - Bounded by a strict floor of 1 (residual risk is never 0 in enterprise governance)
 * 
 * Severity Bands (1-25):
 *   - Low: 1 - 5
 *   - Medium: 6 - 12
 *   - High: 13 - 19
 *   - Critical: 20 - 25
 */
@Service
public class ScoringService {

    public static final double EFFECTIVENESS_FACTOR_PER_LEVEL = 0.15; // 15% per effectiveness point (max 75% per single control)
    public static final int MIN_SCORE = 1;
    public static final int MAX_SCORE = 25;

    public int calculateInherentScore(int likelihood, int impact) {
        if (likelihood < 1 || likelihood > 5) {
            throw new IllegalArgumentException("Likelihood must be between 1 and 5, received: " + likelihood);
        }
        if (impact < 1 || impact > 5) {
            throw new IllegalArgumentException("Impact must be between 1 and 5, received: " + impact);
        }
        return likelihood * impact;
    }

    public int calculateResidualScore(int inherentScore, Collection<Mitigation> mitigations) {
        if (inherentScore < MIN_SCORE || inherentScore > MAX_SCORE) {
            throw new IllegalArgumentException("Inherent score must be between 1 and 25, received: " + inherentScore);
        }

        if (mitigations == null || mitigations.isEmpty()) {
            return inherentScore;
        }

        double compoundMultiplier = 1.0;
        for (Mitigation m : mitigations) {
            int eff = m.getEffectiveness();
            if (eff < 1 || eff > 5) {
                throw new IllegalArgumentException("Mitigation effectiveness must be between 1 and 5, received: " + eff);
            }
            // Each mitigation reduces remaining risk by (effectiveness * 15%)
            double reductionFraction = eff * EFFECTIVENESS_FACTOR_PER_LEVEL;
            double retentionFraction = 1.0 - reductionFraction; // e.g., eff=5 => 0.25 retained
            compoundMultiplier *= retentionFraction;
        }

        long calculated = Math.round(inherentScore * compoundMultiplier);
        return (int) Math.max(MIN_SCORE, calculated);
    }

    public SeverityBand calculateSeverityBand(int score) {
        return SeverityBand.fromScore(score);
    }

    public double calculateReductionPercentage(int inherentScore, int residualScore) {
        if (inherentScore <= 0) {
            return 0.0;
        }
        double reduction = ((double) (inherentScore - residualScore) / inherentScore) * 100.0;
        return Math.round(reduction * 10.0) / 10.0;
    }
}
