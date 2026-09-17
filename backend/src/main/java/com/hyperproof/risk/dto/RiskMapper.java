package com.hyperproof.risk.dto;

import com.hyperproof.risk.entity.Mitigation;
import com.hyperproof.risk.entity.Risk;
import com.hyperproof.risk.entity.SeverityBand;
import com.hyperproof.risk.service.ScoringService;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class RiskMapper {

    private final ScoringService scoringService;

    public RiskMapper(ScoringService scoringService) {
        this.scoringService = scoringService;
    }

    public RiskResponse toResponse(Risk risk, boolean includeMitigations) {
        if (risk == null) {
            return null;
        }

        int inherentScore = scoringService.calculateInherentScore(risk.getLikelihood(), risk.getImpact());
        SeverityBand inherentSeverity = scoringService.calculateSeverityBand(inherentScore);

        List<Mitigation> mitigations = risk.getMitigations() != null ? risk.getMitigations() : Collections.emptyList();
        int residualScore = scoringService.calculateResidualScore(inherentScore, mitigations);
        SeverityBand residualSeverity = scoringService.calculateSeverityBand(residualScore);
        double reductionPercentage = scoringService.calculateReductionPercentage(inherentScore, residualScore);

        boolean isOverdue = false;
        if (risk.getNextReviewDate() != null) {
            isOverdue = risk.getNextReviewDate().isBefore(LocalDate.now());
        }

        List<MitigationResponse> mitigationResponses = null;
        if (includeMitigations) {
            mitigationResponses = mitigations.stream()
                    .map(this::toMitigationResponse)
                    .collect(Collectors.toList());
        }

        return RiskResponse.builder()
                .id(risk.getId())
                .title(risk.getTitle())
                .description(risk.getDescription())
                .category(risk.getCategory())
                .owner(risk.getOwner())
                .likelihood(risk.getLikelihood())
                .impact(risk.getImpact())
                .status(risk.getStatus())
                .complianceFrameworks(risk.getComplianceFrameworks())
                .nextReviewDate(risk.getNextReviewDate())
                .isOverdue(isOverdue)
                .inherentScore(inherentScore)
                .inherentSeverity(inherentSeverity)
                .residualScore(residualScore)
                .residualSeverity(residualSeverity)
                .reductionPercentage(reductionPercentage)
                .mitigationCount(mitigations.size())
                .createdAt(risk.getCreatedAt())
                .updatedAt(risk.getUpdatedAt())
                .mitigations(mitigationResponses)
                .build();
    }

    public MitigationResponse toMitigationResponse(Mitigation mitigation) {
        if (mitigation == null) {
            return null;
        }
        return MitigationResponse.builder()
                .id(mitigation.getId())
                .riskId(mitigation.getRisk() != null ? mitigation.getRisk().getId() : null)
                .description(mitigation.getDescription())
                .effectiveness(mitigation.getEffectiveness())
                .createdAt(mitigation.getCreatedAt())
                .build();
    }
}
