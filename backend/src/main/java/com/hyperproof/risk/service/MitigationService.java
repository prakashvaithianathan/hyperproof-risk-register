package com.hyperproof.risk.service;

import com.hyperproof.risk.dto.CreateMitigationRequest;
import com.hyperproof.risk.dto.MitigationResponse;
import com.hyperproof.risk.dto.RiskMapper;
import com.hyperproof.risk.dto.UpdateMitigationRequest;
import com.hyperproof.risk.entity.Mitigation;
import com.hyperproof.risk.entity.Risk;
import com.hyperproof.risk.exception.ResourceNotFoundException;
import com.hyperproof.risk.repository.MitigationRepository;
import com.hyperproof.risk.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MitigationService {

    private final RiskRepository riskRepository;
    private final MitigationRepository mitigationRepository;
    private final RiskMapper riskMapper;

    @Transactional(readOnly = true)
    public List<MitigationResponse> getMitigationsForRisk(UUID riskId) {
        if (!riskRepository.existsById(riskId)) {
            throw new ResourceNotFoundException("Risk not found with ID: " + riskId);
        }
        return mitigationRepository.findByRiskIdOrderByCreatedAtDesc(riskId).stream()
                .map(riskMapper::toMitigationResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MitigationResponse createMitigation(UUID riskId, CreateMitigationRequest request) {
        Risk risk = riskRepository.findByIdWithMitigations(riskId)
                .orElseThrow(() -> new ResourceNotFoundException("Risk not found with ID: " + riskId));

        Mitigation mitigation = Mitigation.builder()
                .risk(risk)
                .description(request.getDescription().trim())
                .effectiveness(request.getEffectiveness())
                .build();

        risk.addMitigation(mitigation);
        Mitigation saved = mitigationRepository.save(mitigation);
        log.info("Created mitigation ID={} for Risk ID={}", saved.getId(), riskId);
        return riskMapper.toMitigationResponse(saved);
    }

    @Transactional
    public MitigationResponse updateMitigation(UUID riskId, UUID mitigationId, UpdateMitigationRequest request) {
        Mitigation mitigation = mitigationRepository.findByIdAndRiskId(mitigationId, riskId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Mitigation not found with ID: %s for Risk ID: %s", mitigationId, riskId)));

        mitigation.setDescription(request.getDescription().trim());
        mitigation.setEffectiveness(request.getEffectiveness());

        Mitigation updated = mitigationRepository.save(mitigation);
        log.info("Updated mitigation ID={} for Risk ID={}", updated.getId(), riskId);
        return riskMapper.toMitigationResponse(updated);
    }

    @Transactional
    public void deleteMitigation(UUID riskId, UUID mitigationId) {
        Risk risk = riskRepository.findByIdWithMitigations(riskId)
                .orElseThrow(() -> new ResourceNotFoundException("Risk not found with ID: " + riskId));

        Mitigation mitigation = mitigationRepository.findByIdAndRiskId(mitigationId, riskId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Mitigation not found with ID: %s for Risk ID: %s", mitigationId, riskId)));

        risk.removeMitigation(mitigation);
        mitigationRepository.delete(mitigation);
        log.info("Deleted mitigation ID={} for Risk ID={}", mitigationId, riskId);
    }
}
