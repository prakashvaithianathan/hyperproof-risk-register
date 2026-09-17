package com.hyperproof.risk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name = "risks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Risk {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RiskCategory category;

    @Column(length = 255)
    private String owner;

    @Column(nullable = false)
    private Integer likelihood; // 1 to 5

    @Column(nullable = false)
    private Integer impact; // 1 to 5

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RiskStatus status;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "risk_compliance_frameworks", joinColumns = @JoinColumn(name = "risk_id"))
    @Column(name = "framework_tag")
    @Builder.Default
    private Set<String> complianceFrameworks = new HashSet<>();

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "risk", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Mitigation> mitigations = new ArrayList<>();

    public void addMitigation(Mitigation mitigation) {
        mitigations.add(mitigation);
        mitigation.setRisk(this);
    }

    public void removeMitigation(Mitigation mitigation) {
        mitigations.remove(mitigation);
        mitigation.setRisk(null);
    }
}
