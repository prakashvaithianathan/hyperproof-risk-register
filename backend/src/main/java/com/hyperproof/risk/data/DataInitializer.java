package com.hyperproof.risk.data;

import com.hyperproof.risk.entity.*;
import com.hyperproof.risk.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RiskRepository riskRepository;

    @Override
    public void run(String... args) {
        if (riskRepository.count() > 0) {
            log.info("Database already initialized with risk records.");
            return;
        }

        log.info("Populating database with realistic enterprise compliance risks and mitigations...");

        List<Risk> sampleRisks = new ArrayList<>();

        // 1. Critical Security Risk with multiple effective mitigations
        Risk ransomware = Risk.builder()
                .title("Ransomware Outbreak via Compromised Endpoints")
                .description("Malicious actors gain lateral movement through unpatched employee endpoints, encrypting mission-critical customer databases and demanding extortion payments.")
                .category(RiskCategory.SECURITY)
                .owner("Alex Chen (SecOps Lead)")
                .likelihood(4)
                .impact(5)
                .status(RiskStatus.MITIGATING)
                .complianceFrameworks(Set.of("SOC 2 CC6.1", "NIST CSF PR.AC-1", "ISO 27001 A.12"))
                .nextReviewDate(LocalDate.now().plusMonths(1))
                .mitigations(new ArrayList<>())
                .build();
        ransomware.addMitigation(Mitigation.builder()
                .description("CrowdStrike Falcon EDR deployed across 100% of corporate workstations with automated isolation.")
                .effectiveness(4)
                .build());
        ransomware.addMitigation(Mitigation.builder()
                .description("Immutable air-gapped AWS S3 object-lock backups tested with automated monthly restoration drills.")
                .effectiveness(5)
                .build());
        sampleRisks.add(ransomware);

        // 2. High Compliance Risk with 1 mitigation
        Risk gdprBreach = Risk.builder()
                .title("Unauthorized PII Data Ingestion in Analytics Pipeline")
                .description("Engineering teams inadvertently sending unmasked EU user telemetry and email identifiers into third-party product analytics platforms without explicit consent.")
                .category(RiskCategory.COMPLIANCE)
                .owner("Sarah Jenkins (DPO)")
                .likelihood(4)
                .impact(4)
                .status(RiskStatus.MITIGATING)
                .complianceFrameworks(Set.of("GDPR Art. 32", "SOC 2 CC6.3", "HIPAA §164.312"))
                .nextReviewDate(LocalDate.now().plusWeeks(2))
                .mitigations(new ArrayList<>())
                .build();
        gdprBreach.addMitigation(Mitigation.builder()
                .description("Automated CI/CD schema validation and automated PII anonymization gateway proxy.")
                .effectiveness(4)
                .build());
        sampleRisks.add(gdprBreach);

        // 3. High Financial Risk with zero mitigations (Open)
        Risk vendorVendorLockin = Risk.builder()
                .title("Single-Cloud Infrastructure Price Escalation & Outage")
                .description("Complete dependency on proprietary AWS DynamoDB and Lambda constructs leading to unexpected billing spikes and regional availability downtime.")
                .category(RiskCategory.FINANCIAL)
                .owner("David Miller (VP Infrastructure)")
                .likelihood(3)
                .impact(5)
                .status(RiskStatus.OPEN)
                .complianceFrameworks(Set.of("SOC 2 A1.2", "NIST CSF ID.BE-5"))
                .nextReviewDate(LocalDate.now().minusDays(3)) // Overdue!
                .mitigations(new ArrayList<>())
                .build();
        sampleRisks.add(vendorVendorLockin);

        // 4. Operational Risk with medium mitigation
        Risk deployDowntime = Risk.builder()
                .title("Production Database Migration Failures during Major Releases")
                .description("Manual Flyway/Liquibase schema migrations causing table locking and API timeout cascading during peak customer traffic.")
                .category(RiskCategory.OPERATIONAL)
                .owner("Elena Rostova (DevOps Lead)")
                .likelihood(3)
                .impact(3)
                .status(RiskStatus.MITIGATING)
                .complianceFrameworks(Set.of("SOC 2 CC7.1", "ISO 27001 A.14"))
                .nextReviewDate(LocalDate.now().plusMonths(3))
                .mitigations(new ArrayList<>())
                .build();
        deployDowntime.addMitigation(Mitigation.builder()
                .description("Blue/Green deployment pipeline with zero-downtime expand/contract schema pattern enforcement.")
                .effectiveness(3)
                .build());
        sampleRisks.add(deployDowntime);

        // 5. Strategic Risk (Critical Inherent, Open)
        Risk aiHallucination = Risk.builder()
                .title("GenAI Automated Decision Bias and Hallucinatory Output")
                .description("Autonomous AI evaluation agents rendering inaccurate risk assessment decisions that fail regulatory audits.")
                .category(RiskCategory.STRATEGIC)
                .owner("Marcus Vance (Chief AI Officer)")
                .likelihood(5)
                .impact(4)
                .status(RiskStatus.OPEN)
                .complianceFrameworks(Set.of("NIST AI RMF 1.0", "EU AI Act"))
                .nextReviewDate(LocalDate.now().plusWeeks(1))
                .mitigations(new ArrayList<>())
                .build();
        sampleRisks.add(aiHallucination);

        // 6. Inherently Low Risk - Closed without mitigations (de minimis risk allowed by business rule)
        Risk officeBadgeLoss = Risk.builder()
                .title("Physical Visitor Badge Misplacement at Secondary Branch")
                .description("Temporary paper visitor passes lost in secondary storage facility with no server room access.")
                .category(RiskCategory.OPERATIONAL)
                .owner("Karen O'Neill (Facilities)")
                .likelihood(1)
                .impact(2)
                .status(RiskStatus.CLOSED)
                .complianceFrameworks(Set.of("SOC 2 CC6.4"))
                .nextReviewDate(LocalDate.now().plusMonths(6))
                .mitigations(new ArrayList<>())
                .build();
        sampleRisks.add(officeBadgeLoss);

        // 7. Security Risk - Fully Mitigated and Closed
        Risk oldPhpServer = Risk.builder()
                .title("Legacy Public Marketing WordPress Vulnerabilities")
                .description("Legacy PHP blog running unmaintained plugins susceptible to remote code execution.")
                .category(RiskCategory.SECURITY)
                .owner("Alex Chen (SecOps Lead)")
                .likelihood(3)
                .impact(4)
                .status(RiskStatus.CLOSED)
                .complianceFrameworks(Set.of("SOC 2 CC7.1", "NIST CSF DE.CM-8"))
                .nextReviewDate(LocalDate.now().plusMonths(4))
                .mitigations(new ArrayList<>())
                .build();
        oldPhpServer.addMitigation(Mitigation.builder()
                .description("Decommissioned legacy server; migrated static assets to Next.js on Cloudflare Pages with WAF.")
                .effectiveness(5)
                .build());
        sampleRisks.add(oldPhpServer);

        riskRepository.saveAll(sampleRisks);
        log.info("Initialized {} realistic sample risks with mitigations successfully.", sampleRisks.size());
    }
}
