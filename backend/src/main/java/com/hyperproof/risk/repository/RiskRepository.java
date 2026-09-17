package com.hyperproof.risk.repository;

import com.hyperproof.risk.entity.Risk;
import com.hyperproof.risk.entity.RiskCategory;
import com.hyperproof.risk.entity.RiskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiskRepository extends JpaRepository<Risk, UUID>, JpaSpecificationExecutor<Risk> {

    @Query("SELECT DISTINCT r FROM Risk r LEFT JOIN FETCH r.mitigations WHERE r.id = :id")
    Optional<Risk> findByIdWithMitigations(@Param("id") UUID id);

    @Query("SELECT DISTINCT r FROM Risk r LEFT JOIN FETCH r.mitigations " +
           "WHERE (:category IS NULL OR r.category = :category) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:search IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.owner) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Risk> findFilteredWithMitigations(@Param("category") RiskCategory category,
                                          @Param("status") RiskStatus status,
                                          @Param("search") String search);
}
