package com.hyperproof.risk.service;

import com.hyperproof.risk.entity.Mitigation;
import com.hyperproof.risk.entity.SeverityBand;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ScoringServiceTest {

    private ScoringService scoringService;

    @BeforeEach
    void setUp() {
        scoringService = new ScoringService();
    }

    @Test
    @DisplayName("Inherent score equals likelihood multiplied by impact")
    void testCalculateInherentScore() {
        assertEquals(1, scoringService.calculateInherentScore(1, 1));
        assertEquals(25, scoringService.calculateInherentScore(5, 5));
        assertEquals(12, scoringService.calculateInherentScore(3, 4));
        assertEquals(15, scoringService.calculateInherentScore(5, 3));
    }

    @ParameterizedTest
    @CsvSource({
            "0, 3",
            "6, 3",
            "3, 0",
            "3, 6",
            "-1, 5"
    })
    @DisplayName("Inherent score throws IllegalArgumentException for out-of-range inputs")
    void testInherentScoreInvalidInputs(int likelihood, int impact) {
        assertThrows(IllegalArgumentException.class, () -> scoringService.calculateInherentScore(likelihood, impact));
    }

    @Test
    @DisplayName("Residual score equals inherent score when risk has zero mitigations")
    void testResidualScoreZeroMitigations() {
        int inherent = 20;
        int residualNull = scoringService.calculateResidualScore(inherent, null);
        int residualEmpty = scoringService.calculateResidualScore(inherent, Collections.emptyList());

        assertEquals(inherent, residualNull);
        assertEquals(inherent, residualEmpty);
    }

    @Test
    @DisplayName("Single highly effective mitigation (eff=5) meaningfully reduces inherent risk (75% reduction)")
    void testResidualScoreSingleHighEffectivenessMitigation() {
        int inherent = 25; // 5 x 5 (Critical)
        Mitigation mitigation = Mitigation.builder()
                .effectiveness(5)
                .description("Automated zero-trust IAM and MFA enforcement")
                .build();

        // 25 * (1 - 5 * 0.15) = 25 * 0.25 = 6.25 -> round to 6 (Medium)
        int residual = scoringService.calculateResidualScore(inherent, List.of(mitigation));
        assertEquals(6, residual);
        assertEquals(SeverityBand.MEDIUM, scoringService.calculateSeverityBand(residual));
    }

    @Test
    @DisplayName("Single moderate mitigation (eff=3) provides proportionate reduction (45% reduction)")
    void testResidualScoreSingleModerateEffectivenessMitigation() {
        int inherent = 20;
        Mitigation mitigation = Mitigation.builder()
                .effectiveness(3)
                .description("Quarterly manual access reviews")
                .build();

        // 20 * (1 - 3 * 0.15) = 20 * 0.55 = 11 -> round to 11
        int residual = scoringService.calculateResidualScore(inherent, List.of(mitigation));
        assertEquals(11, residual);
    }

    @Test
    @DisplayName("Multiple mitigations compound with diminishing returns")
    void testResidualScoreMultipleMitigationsCompounding() {
        int inherent = 20;
        Mitigation m1 = Mitigation.builder().effectiveness(4).build(); // 60% reduction -> 0.40 retention
        Mitigation m2 = Mitigation.builder().effectiveness(3).build(); // 45% reduction -> 0.55 retention

        // 20 * 0.40 * 0.55 = 20 * 0.22 = 4.4 -> round to 4
        int residual = scoringService.calculateResidualScore(inherent, List.of(m1, m2));
        assertEquals(4, residual);
        assertEquals(SeverityBand.LOW, scoringService.calculateSeverityBand(residual));
    }

    @Test
    @DisplayName("Residual score never falls below floor of 1")
    void testResidualScoreNeverBelowOne() {
        int inherent = 5;
        // 3 max-effectiveness mitigations: 5 * 0.25^3 = 0.078
        List<Mitigation> heavyMitigations = List.of(
                Mitigation.builder().effectiveness(5).build(),
                Mitigation.builder().effectiveness(5).build(),
                Mitigation.builder().effectiveness(5).build()
        );

        int residual = scoringService.calculateResidualScore(inherent, heavyMitigations);
        assertEquals(1, residual, "Residual score must be clamped to minimum of 1");
    }

    @ParameterizedTest(name = "Score {0} maps to SeverityBand {1}")
    @CsvSource({
            "1, LOW",
            "5, LOW",
            "6, MEDIUM",
            "12, MEDIUM",
            "13, HIGH",
            "19, HIGH",
            "20, CRITICAL",
            "25, CRITICAL"
    })
    @DisplayName("Severity band boundary mapping is accurate")
    void testSeverityBandBoundaries(int score, SeverityBand expectedBand) {
        assertEquals(expectedBand, scoringService.calculateSeverityBand(score));
    }

    @Test
    @DisplayName("Reduction percentage calculation is accurate")
    void testCalculateReductionPercentage() {
        assertEquals(0.0, scoringService.calculateReductionPercentage(20, 20));
        assertEquals(76.0, scoringService.calculateReductionPercentage(25, 6));
        assertEquals(80.0, scoringService.calculateReductionPercentage(20, 4));
    }
}
