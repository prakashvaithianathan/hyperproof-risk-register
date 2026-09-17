package com.hyperproof.risk.controller;

import com.hyperproof.risk.dto.CreateRiskRequest;
import com.hyperproof.risk.dto.RiskResponse;
import com.hyperproof.risk.dto.RiskStatsResponse;
import com.hyperproof.risk.dto.UpdateRiskRequest;
import com.hyperproof.risk.entity.RiskCategory;
import com.hyperproof.risk.entity.RiskStatus;
import com.hyperproof.risk.service.RiskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
public class RiskController {

    private final RiskService riskService;

    @PostMapping
    public ResponseEntity<RiskResponse> createRisk(@Valid @RequestBody CreateRiskRequest request) {
        RiskResponse response = riskService.createRisk(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RiskResponse>> listRisks(
            @RequestParam(required = false) RiskCategory category,
            @RequestParam(required = false) RiskStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "residualScore") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        List<RiskResponse> risks = riskService.listRisks(category, status, search, sortBy, sortDirection);
        return ResponseEntity.ok(risks);
    }

    @GetMapping("/stats")
    public ResponseEntity<RiskStatsResponse> getRiskStats() {
        RiskStatsResponse stats = riskService.getStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RiskResponse> getRiskById(@PathVariable UUID id) {
        RiskResponse response = riskService.getRiskById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RiskResponse> updateRisk(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRiskRequest request) {
        RiskResponse response = riskService.updateRisk(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRisk(@PathVariable UUID id) {
        riskService.deleteRisk(id);
        return ResponseEntity.noContent().build();
    }
}
