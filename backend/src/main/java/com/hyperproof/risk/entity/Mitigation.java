package com.hyperproof.risk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mitigations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mitigation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_id", nullable = false)
    private Risk risk;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private Integer effectiveness; // 1 to 5

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
