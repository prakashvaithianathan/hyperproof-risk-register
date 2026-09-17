package com.hyperproof.risk.dto;

import com.hyperproof.risk.entity.RiskCategory;
import com.hyperproof.risk.entity.RiskStatus;
import com.hyperproof.risk.entity.SeverityBand;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskResponse {
    private UUID id;
    private String title;
    private String description;
    private RiskCategory category;
    private String owner;
    private Integer likelihood;
    private Integer impact;
    private RiskStatus status;
    private Set<String> complianceFrameworks;
    private LocalDate nextReviewDate;
    private Boolean isOverdue;

    // Computed Scoring properties
    private Integer inherentScore;
    private SeverityBand inherentSeverity;
    private Integer residualScore;
    private SeverityBand residualSeverity;
    private Double reductionPercentage;
    private Integer mitigationCount;

    private Instant createdAt;
    private Instant updatedAt;

    private List<MitigationResponse> mitigations;
}
