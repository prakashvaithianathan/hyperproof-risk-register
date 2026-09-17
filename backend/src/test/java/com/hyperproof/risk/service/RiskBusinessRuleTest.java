package com.hyperproof.risk.service;

import com.hyperproof.risk.dto.RiskMapper;
import com.hyperproof.risk.entity.RiskCategory;
import com.hyperproof.risk.entity.RiskStatus;
import com.hyperproof.risk.exception.BusinessRuleViolationException;
import com.hyperproof.risk.repository.RiskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RiskBusinessRuleTest {

    private RiskService riskService;
    private ScoringService scoringService;
    private RiskRepository riskRepository;
    private RiskMapper riskMapper;

    @BeforeEach
    void setUp() {
        riskRepository = Mockito.mock(RiskRepository.class);
        scoringService = new ScoringService();
        riskMapper = new RiskMapper(scoringService);
        riskService = new RiskService(riskRepository, scoringService, riskMapper);
    }

    @Test
    @DisplayName("Closing a Critical inherent risk with 0 mitigations is strictly rejected")
    void testCloseCriticalRiskWithoutMitigationsRejected() {
        int criticalInherentScore = 20; // 4 x 5
        assertThrows(BusinessRuleViolationException.class, () ->
                riskService.validateClosedRiskComplianceRule(RiskStatus.CLOSED, criticalInherentScore, 0));
    }

    @Test
    @DisplayName("Closing a High inherent risk with 0 mitigations is rejected")
    void testCloseHighRiskWithoutMitigationsRejected() {
        int highInherentScore = 15; // 3 x 5
        assertThrows(BusinessRuleViolationException.class, () ->
                riskService.validateClosedRiskComplianceRule(RiskStatus.CLOSED, highInherentScore, 0));
    }

    @Test
    @DisplayName("Closing a Medium inherent risk with 0 mitigations is rejected")
    void testCloseMediumRiskWithoutMitigationsRejected() {
        int mediumInherentScore = 9; // 3 x 3
        assertThrows(BusinessRuleViolationException.class, () ->
                riskService.validateClosedRiskComplianceRule(RiskStatus.CLOSED, mediumInherentScore, 0));
    }

    @Test
    @DisplayName("Closing a Low inherent risk with 0 mitigations is allowed (de minimis accepted risk)")
    void testCloseLowRiskWithoutMitigationsAllowed() {
        int lowInherentScore = 4; // 2 x 2
        assertDoesNotThrow(() ->
                riskService.validateClosedRiskComplianceRule(RiskStatus.CLOSED, lowInherentScore, 0));
    }

    @Test
    @DisplayName("Closing any risk with 1 or more mitigations is allowed")
    void testCloseRiskWithMitigationsAllowed() {
        int criticalInherentScore = 25; // 5 x 5
        assertDoesNotThrow(() ->
                riskService.validateClosedRiskComplianceRule(RiskStatus.CLOSED, criticalInherentScore, 1));
    }

    @Test
    @DisplayName("Setting status to OPEN or MITIGATING with 0 mitigations is always allowed")
    void testOpenOrMitigatingStatusAllowedWithoutMitigations() {
        assertDoesNotThrow(() ->
                riskService.validateClosedRiskComplianceRule(RiskStatus.OPEN, 25, 0));
        assertDoesNotThrow(() ->
                riskService.validateClosedRiskComplianceRule(RiskStatus.MITIGATING, 25, 0));
    }
}
