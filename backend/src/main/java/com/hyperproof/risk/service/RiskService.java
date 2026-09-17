package com.hyperproof.risk.service;

import com.hyperproof.risk.dto.*;
import com.hyperproof.risk.entity.*;
import com.hyperproof.risk.exception.BusinessRuleViolationException;
import com.hyperproof.risk.exception.ResourceNotFoundException;
import com.hyperproof.risk.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskService {

    private final RiskRepository riskRepository;
    private final ScoringService scoringService;
    private final RiskMapper riskMapper;

    @Transactional
    public RiskResponse createRisk(CreateRiskRequest request) {
        int inherentScore = scoringService.calculateInherentScore(request.getLikelihood(), request.getImpact());
        RiskStatus status = request.getStatus() != null ? request.getStatus() : RiskStatus.OPEN;

        // Business rule: Check if attempting to create directly as CLOSED with 0 mitigations
        validateClosedRiskComplianceRule(status, inherentScore, 0);

        Risk risk = Risk.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .category(request.getCategory())
                .owner(request.getOwner() != null ? request.getOwner().trim() : null)
                .likelihood(request.getLikelihood())
                .impact(request.getImpact())
                .status(status)
                .complianceFrameworks(request.getComplianceFrameworks() != null ? request.getComplianceFrameworks() : new HashSet<>())
                .nextReviewDate(request.getNextReviewDate())
                .mitigations(new ArrayList<>())
                .build();

        Risk savedRisk = riskRepository.save(risk);
        log.info("Created risk ID={} title='{}' inherentScore={}", savedRisk.getId(), savedRisk.getTitle(), inherentScore);
        return riskMapper.toResponse(savedRisk, true);
    }

    @Transactional(readOnly = true)
    public RiskResponse getRiskById(UUID id) {
        Risk risk = riskRepository.findByIdWithMitigations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk not found with ID: " + id));
        return riskMapper.toResponse(risk, true);
    }

    @Transactional(readOnly = true)
    public List<RiskResponse> listRisks(RiskCategory category, RiskStatus status, String search, String sortBy, String sortDirection) {
        List<Risk> risks = riskRepository.findFilteredWithMitigations(category, status, (search != null && !search.isBlank()) ? search.trim() : null);

        List<RiskResponse> responses = risks.stream()
                .map(r -> riskMapper.toResponse(r, false))
                .collect(Collectors.toList());

        // Sort results
        String field = (sortBy != null && !sortBy.isBlank()) ? sortBy.toLowerCase() : "residualscore";
        boolean ascending = "asc".equalsIgnoreCase(sortDirection);

        Comparator<RiskResponse> comparator;
        switch (field) {
            case "inherentscore":
                comparator = Comparator.comparing(RiskResponse::getInherentScore);
                break;
            case "title":
                comparator = Comparator.comparing(r -> r.getTitle().toLowerCase());
                break;
            case "category":
                comparator = Comparator.comparing(r -> r.getCategory().name());
                break;
            case "status":
                comparator = Comparator.comparing(r -> r.getStatus().name());
                break;
            case "createdat":
                comparator = Comparator.comparing(RiskResponse::getCreatedAt);
                break;
            case "updatedat":
                comparator = Comparator.comparing(RiskResponse::getUpdatedAt);
                break;
            case "residualscore":
            default:
                // Default sort: residual score descending (highest risk first)
                comparator = Comparator.comparing(RiskResponse::getResidualScore);
                break;
        }

        if (!ascending) {
            comparator = comparator.reversed();
        }

        // Secondary sort by title if tie
        comparator = comparator.thenComparing(r -> r.getTitle().toLowerCase());

        responses.sort(comparator);
        return responses;
    }

    @Transactional
    public RiskResponse updateRisk(UUID id, UpdateRiskRequest request) {
        Risk risk = riskRepository.findByIdWithMitigations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk not found with ID: " + id));

        int inherentScore = scoringService.calculateInherentScore(request.getLikelihood(), request.getImpact());
        int mitigationCount = risk.getMitigations() != null ? risk.getMitigations().size() : 0;

        // Business rule check for CLOSED status
        validateClosedRiskComplianceRule(request.getStatus(), inherentScore, mitigationCount);

        risk.setTitle(request.getTitle().trim());
        risk.setDescription(request.getDescription());
        risk.setCategory(request.getCategory());
        risk.setOwner(request.getOwner() != null ? request.getOwner().trim() : null);
        risk.setLikelihood(request.getLikelihood());
        risk.setImpact(request.getImpact());
        risk.setStatus(request.getStatus());
        if (request.getComplianceFrameworks() != null) {
            risk.setComplianceFrameworks(request.getComplianceFrameworks());
        }
        risk.setNextReviewDate(request.getNextReviewDate());

        Risk updatedRisk = riskRepository.save(risk);
        log.info("Updated risk ID={} title='{}'", updatedRisk.getId(), updatedRisk.getTitle());
        return riskMapper.toResponse(updatedRisk, true);
    }

    @Transactional
    public void deleteRisk(UUID id) {
        if (!riskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Risk not found with ID: " + id);
        }
        riskRepository.deleteById(id);
        log.info("Deleted risk ID={}", id);
    }

    @Transactional(readOnly = true)
    public RiskStatsResponse getStats() {
        List<Risk> risks = riskRepository.findAll();
        long total = risks.size();
        long open = 0;
        long mitigating = 0;
        long closed = 0;
        long overdue = 0;
        LocalDate today = LocalDate.now();

        Map<String, Long> inherentSeverityDist = new LinkedHashMap<>();
        Map<String, Long> residualSeverityDist = new LinkedHashMap<>();
        Map<String, Long> categoryDist = new LinkedHashMap<>();

        for (SeverityBand band : SeverityBand.values()) {
            inherentSeverityDist.put(band.name(), 0L);
            residualSeverityDist.put(band.name(), 0L);
        }
        for (RiskCategory cat : RiskCategory.values()) {
            categoryDist.put(cat.name(), 0L);
        }

        double totalReductionSum = 0;

        for (Risk r : risks) {
            if (r.getStatus() == RiskStatus.OPEN) open++;
            else if (r.getStatus() == RiskStatus.MITIGATING) mitigating++;
            else if (r.getStatus() == RiskStatus.CLOSED) closed++;

            if (r.getNextReviewDate() != null && r.getNextReviewDate().isBefore(today)) {
                overdue++;
            }

            categoryDist.put(r.getCategory().name(), categoryDist.get(r.getCategory().name()) + 1);

            int inherent = scoringService.calculateInherentScore(r.getLikelihood(), r.getImpact());
            SeverityBand inhBand = scoringService.calculateSeverityBand(inherent);
            inherentSeverityDist.put(inhBand.name(), inherentSeverityDist.get(inhBand.name()) + 1);

            int residual = scoringService.calculateResidualScore(inherent, r.getMitigations());
            SeverityBand resBand = scoringService.calculateSeverityBand(residual);
            residualSeverityDist.put(resBand.name(), residualSeverityDist.get(resBand.name()) + 1);

            totalReductionSum += scoringService.calculateReductionPercentage(inherent, residual);
        }

        double avgReduction = total > 0 ? Math.round((totalReductionSum / total) * 10.0) / 10.0 : 0.0;

        return RiskStatsResponse.builder()
                .totalRisks(total)
                .openRisks(open)
                .mitigatingRisks(mitigating)
                .closedRisks(closed)
                .overdueReviews(overdue)
                .averageResidualReductionPercentage(avgReduction)
                .inherentSeverityDistribution(inherentSeverityDist)
                .residualSeverityDistribution(residualSeverityDist)
                .categoryDistribution(categoryDist)
                .build();
    }

    /**
     * Business Rule Enforcement:
     * Risks with Medium, High, or Critical inherent severity cannot be closed without at least 1 mitigating control.
     * Low inherent risks (score <= 5) may be closed as accepted / de minimis risks.
     */
    public void validateClosedRiskComplianceRule(RiskStatus status, int inherentScore, int mitigationCount) {
        if (status == RiskStatus.CLOSED && mitigationCount == 0) {
            SeverityBand inherentBand = scoringService.calculateSeverityBand(inherentScore);
            if (inherentBand != SeverityBand.LOW) {
                throw new BusinessRuleViolationException(
                        String.format("Compliance Rule Violation: Cannot mark risk with '%s' inherent severity (Score: %d) as CLOSED with zero mitigating controls. Add at least one mitigation control or lower inherent score to LOW (<= 5) before closing.",
                                inherentBand.getDisplayName(), inherentScore)
                );
            }
        }
    }
}
