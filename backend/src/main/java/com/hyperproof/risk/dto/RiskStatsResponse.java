package com.hyperproof.risk.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskStatsResponse {
    private long totalRisks;
    private long openRisks;
    private long mitigatingRisks;
    private long closedRisks;
    private long overdueReviews;
    private double averageResidualReductionPercentage;
    private Map<String, Long> inherentSeverityDistribution;
    private Map<String, Long> residualSeverityDistribution;
    private Map<String, Long> categoryDistribution;
}
