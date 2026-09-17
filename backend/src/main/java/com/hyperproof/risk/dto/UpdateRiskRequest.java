package com.hyperproof.risk.dto;

import com.hyperproof.risk.entity.RiskCategory;
import com.hyperproof.risk.entity.RiskStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRiskRequest {

    @NotBlank(message = "Title is required and cannot be blank")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @Size(max = 4000, message = "Description cannot exceed 4000 characters")
    private String description;

    @NotNull(message = "Category is required (OPERATIONAL, FINANCIAL, COMPLIANCE, SECURITY, STRATEGIC)")
    private RiskCategory category;

    @Size(max = 255, message = "Owner cannot exceed 255 characters")
    private String owner;

    @NotNull(message = "Likelihood is required")
    @Min(value = 1, message = "Likelihood must be an integer between 1 and 5")
    @Max(value = 5, message = "Likelihood must be an integer between 1 and 5")
    private Integer likelihood;

    @NotNull(message = "Impact is required")
    @Min(value = 1, message = "Impact must be an integer between 1 and 5")
    @Max(value = 5, message = "Impact must be an integer between 1 and 5")
    private Integer impact;

    @NotNull(message = "Status is required (OPEN, MITIGATING, CLOSED)")
    private RiskStatus status;

    private Set<String> complianceFrameworks;

    private LocalDate nextReviewDate;
}
