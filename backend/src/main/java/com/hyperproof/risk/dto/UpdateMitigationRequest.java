package com.hyperproof.risk.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMitigationRequest {

    @NotBlank(message = "Mitigation description is required")
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @NotNull(message = "Effectiveness is required")
    @Min(value = 1, message = "Effectiveness must be an integer between 1 and 5")
    @Max(value = 5, message = "Effectiveness must be an integer between 1 and 5")
    private Integer effectiveness;
}
