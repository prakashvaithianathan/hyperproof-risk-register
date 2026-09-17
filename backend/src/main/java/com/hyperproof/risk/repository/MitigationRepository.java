package com.hyperproof.risk.repository;

import com.hyperproof.risk.entity.Mitigation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MitigationRepository extends JpaRepository<Mitigation, UUID> {
    List<Mitigation> findByRiskIdOrderByCreatedAtDesc(UUID riskId);
    Optional<Mitigation> findByIdAndRiskId(UUID id, UUID riskId);
}
