package com.hyperproof.risk.controller;

import com.hyperproof.risk.dto.CreateMitigationRequest;
import com.hyperproof.risk.dto.MitigationResponse;
import com.hyperproof.risk.dto.UpdateMitigationRequest;
import com.hyperproof.risk.service.MitigationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/risks/{riskId}/mitigations")
@RequiredArgsConstructor
public class MitigationController {

    private final MitigationService mitigationService;

    @GetMapping
    public ResponseEntity<List<MitigationResponse>> getMitigations(@PathVariable UUID riskId) {
        List<MitigationResponse> mitigations = mitigationService.getMitigationsForRisk(riskId);
        return ResponseEntity.ok(mitigations);
    }

    @PostMapping
    public ResponseEntity<MitigationResponse> createMitigation(
            @PathVariable UUID riskId,
            @Valid @RequestBody CreateMitigationRequest request) {
        MitigationResponse created = mitigationService.createMitigation(riskId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{mitigationId}")
    public ResponseEntity<MitigationResponse> updateMitigation(
            @PathVariable UUID riskId,
            @PathVariable UUID mitigationId,
            @Valid @RequestBody UpdateMitigationRequest request) {
        MitigationResponse updated = mitigationService.updateMitigation(riskId, mitigationId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{mitigationId}")
    public ResponseEntity<Void> deleteMitigation(
            @PathVariable UUID riskId,
            @PathVariable UUID mitigationId) {
        mitigationService.deleteMitigation(riskId, mitigationId);
        return ResponseEntity.noContent().build();
    }
}
