package com.hyperproof.risk.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hyperproof.risk.dto.CreateMitigationRequest;
import com.hyperproof.risk.dto.CreateRiskRequest;
import com.hyperproof.risk.dto.UpdateRiskRequest;
import com.hyperproof.risk.entity.RiskCategory;
import com.hyperproof.risk.entity.RiskStatus;
import com.hyperproof.risk.repository.RiskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class RiskApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RiskRepository riskRepository;

    @BeforeEach
    void setUp() {
        riskRepository.deleteAll();
    }

    @Test
    @DisplayName("End-to-End lifecycle: Create risk -> add mitigations -> verify residual score -> update -> close")
    void testEndToEndRiskLifecycle() throws Exception {
        // Step 1: Create a new Risk (Likelihood 4, Impact 5 => Inherent Score 20, Critical)
        CreateRiskRequest createRiskRequest = CreateRiskRequest.builder()
                .title("Unencrypted Cloud Storage Buckets")
                .description("Publicly accessible S3 buckets containing financial transaction records")
                .category(RiskCategory.SECURITY)
                .owner("DevSecOps Lead")
                .likelihood(4)
                .impact(5)
                .status(RiskStatus.OPEN)
                .complianceFrameworks(Set.of("SOC 2 CC6.1", "NIST CSF PR.DS-1"))
                .nextReviewDate(LocalDate.now().plusMonths(1))
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/risks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRiskRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Unencrypted Cloud Storage Buckets"))
                .andExpect(jsonPath("$.inherentScore").value(20))
                .andExpect(jsonPath("$.inherentSeverity").value("CRITICAL"))
                .andExpect(jsonPath("$.residualScore").value(20)) // With 0 mitigations, residual == inherent
                .andExpect(jsonPath("$.residualSeverity").value("CRITICAL"))
                .andExpect(jsonPath("$.mitigationCount").value(0))
                .andReturn();

        String responseBody = createResult.getResponse().getContentAsString();
        UUID riskId = UUID.fromString(objectMapper.readTree(responseBody).get("id").asText());

        // Step 2: Add first Mitigation (Effectiveness 4 -> 60% reduction -> retention 0.40 => 20 * 0.40 = 8)
        CreateMitigationRequest mitigation1 = CreateMitigationRequest.builder()
                .description("Automated AWS Config rule enforcing default KMS encryption")
                .effectiveness(4)
                .build();

        mockMvc.perform(post("/api/risks/" + riskId + "/mitigations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mitigation1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.effectiveness").value(4));

        // Step 3: Fetch Risk and verify residual score is now 8 (Medium severity)
        mockMvc.perform(get("/api/risks/" + riskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inherentScore").value(20))
                .andExpect(jsonPath("$.residualScore").value(8))
                .andExpect(jsonPath("$.residualSeverity").value("MEDIUM"))
                .andExpect(jsonPath("$.mitigationCount").value(1));

        // Step 4: Add second Mitigation (Effectiveness 5 -> 75% reduction -> retention 0.25 => 8 * 0.25 = 2)
        CreateMitigationRequest mitigation2 = CreateMitigationRequest.builder()
                .description("Cloud custodian IAM block preventing non-conforming bucket creation")
                .effectiveness(5)
                .build();

        mockMvc.perform(post("/api/risks/" + riskId + "/mitigations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mitigation2)))
                .andExpect(status().isCreated());

        // Step 5: Verify residual score compounded down to 2 (Low severity)
        mockMvc.perform(get("/api/risks/" + riskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.residualScore").value(2))
                .andExpect(jsonPath("$.residualSeverity").value("LOW"))
                .andExpect(jsonPath("$.mitigationCount").value(2));

        // Step 6: Close the risk (allowed because it has mitigations)
        UpdateRiskRequest closeRequest = UpdateRiskRequest.builder()
                .title("Unencrypted Cloud Storage Buckets")
                .category(RiskCategory.SECURITY)
                .likelihood(4)
                .impact(5)
                .status(RiskStatus.CLOSED)
                .build();

        mockMvc.perform(put("/api/risks/" + riskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    @DisplayName("Validation rejection: Likelihood and Impact out of 1-5 bounds return 400 Bad Request")
    void testInputValidationRejection() throws Exception {
        CreateRiskRequest invalidRequest = CreateRiskRequest.builder()
                .title("Invalid Score Risk")
                .category(RiskCategory.OPERATIONAL)
                .likelihood(7) // Invalid: > 5
                .impact(0)     // Invalid: < 1
                .build();

        mockMvc.perform(post("/api/risks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors", hasSize(2)));
    }

    @Test
    @DisplayName("Compliance Rule Rejection: Closing a High/Critical risk with 0 mitigations returns 422")
    void testCloseUnmitigatedHighRiskReturns422() throws Exception {
        // Create an unmitigated Critical risk
        CreateRiskRequest createRiskRequest = CreateRiskRequest.builder()
                .title("Unmitigated Zero Day Exploit")
                .category(RiskCategory.SECURITY)
                .likelihood(5)
                .impact(5)
                .status(RiskStatus.OPEN)
                .build();

        MvcResult result = mockMvc.perform(post("/api/risks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRiskRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID riskId = UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText());

        // Attempt to update status to CLOSED
        UpdateRiskRequest closeRequest = UpdateRiskRequest.builder()
                .title("Unmitigated Zero Day Exploit")
                .category(RiskCategory.SECURITY)
                .likelihood(5)
                .impact(5)
                .status(RiskStatus.CLOSED)
                .build();

        mockMvc.perform(put("/api/risks/" + riskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeRequest)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.message", containsString("Compliance Rule Violation")));
    }

    @Test
    @DisplayName("List and Filter API returns risks filtered and sorted by residual score descending")
    void testListAndFilterRisks() throws Exception {
        // Risk 1: High Inherent 20, no mitigations => Residual 20
        CreateRiskRequest r1 = CreateRiskRequest.builder()
                .title("Data Center Power Outage")
                .category(RiskCategory.OPERATIONAL)
                .likelihood(4)
                .impact(5)
                .status(RiskStatus.OPEN)
                .build();
        mockMvc.perform(post("/api/risks").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(r1)));

        // Risk 2: High Inherent 16, no mitigations => Residual 16
        CreateRiskRequest r2 = CreateRiskRequest.builder()
                .title("Phishing Campaign Breach")
                .category(RiskCategory.SECURITY)
                .likelihood(4)
                .impact(4)
                .status(RiskStatus.OPEN)
                .build();
        mockMvc.perform(post("/api/risks").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(r2)));

        // Filter by category SECURITY
        mockMvc.perform(get("/api/risks?category=SECURITY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Phishing Campaign Breach"));

        // List all sorted by residualScore desc (20 before 16)
        mockMvc.perform(get("/api/risks?sortBy=residualScore&sortDirection=desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].title").value("Data Center Power Outage"))
                .andExpect(jsonPath("$[1].title").value("Phishing Campaign Breach"));
    }
}
