package com.hyperproof.risk.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MitigationResponse {
    private UUID id;
    private UUID riskId;
    private String description;
    private Integer effectiveness;
    private Instant createdAt;
}
