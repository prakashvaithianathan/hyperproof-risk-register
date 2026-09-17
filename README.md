# Hyperproof Risk Register — Risk Management Feature

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-30%20Passed-success.svg)](#running-automated-tests)

A modern full-stack **Risk Register** application designed for continuous risk management and compliance posture tracking. Built for the Hyperproof Software Engineer take-home assessment, this system allows compliance officers and security teams to create risks, quantify inherent risk probability and impact, attach mitigating controls, dynamically calculate residual risk scores with diminishing marginal returns, and visualize organizational risk exposure on interactive 5x5 heatmap matrices.

---

## Quick Start (Run Locally in < 5 Minutes)

### Prerequisites
- **Java 21 LTS** or newer
- **Maven 3.8+**
- **Node.js 18+** & **npm**

---

### Step 1: Start the Spring Boot Backend (Port `8080`)

```bash
cd backend
mvn spring-boot:run
```

- Backend runs on `http://localhost:8080`
- Pre-populated with realistic sample risks across Security, Compliance, Operational, Financial, and Strategic categories.
- Uses fast zero-config **H2 In-Memory DB** by default (`/h2-console` enabled).
- *(Optional)* To run with PostgreSQL: `docker compose up -d` then `mvn spring-boot:run -Dspring-boot.run.profiles=postgres`.

---

### Step 2: Start the React + TypeScript Frontend (Port `5173`)

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

- Open **`http://localhost:5173`** in your browser.
- Vite automatically proxies API requests to `http://localhost:8080`.

---

### Quick Launch Scripts (Windows & Unix)

- **Windows**: Double-click `start-all.bat` in the root folder.
- **macOS / Linux**: Run `./start.sh`.

---

## Scoring Logic & Mathematical Formulation

### 1. Inherent Risk Score
Inherent risk represents the raw, unmitigated exposure of an organization prior to applying any controls:

$$\text{Inherent Risk} = \text{Likelihood} \times \text{Impact}$$

- **Likelihood ($L$)**: Integer from $1$ (Rare) to $5$ (Almost Certain).
- **Impact ($I$)**: Integer from $1$ (Insignificant) to $5$ (Catastrophic).
- **Inherent Score Range**: $1 \times 1 = 1$ (minimum) to $5 \times 5 = 25$ (maximum).

---

### 2. Residual Risk Score Formulation

Residual risk is the risk remaining after one or more mitigating controls have been deployed. We designed and implemented a **Multiplicative Compound Dampening Model** with **Diminishing Marginal Returns**:

$$\text{Residual Risk} = \max\left(1, \text{round}\left(\text{Inherent Score} \times \prod_{i=1}^{n} \left(1 - \text{effectiveness}_i \times 0.15\right)\right)\right)$$

where $\text{effectiveness}_i \in \{1, 2, 3, 4, 5\}$ is the effectiveness rating of the $i$-th mitigation control.

#### Why This Formula?
1. **Sanity Check 1 (Zero Mitigations)**:
   When $n = 0$, $\prod = 1.0 \implies \text{Residual} = \text{Inherent}$. An unmitigated risk remains at its full inherent severity.
2. **Sanity Check 2 (Single Highly Effective Control)**:
   A single control with maximum effectiveness ($e=5$) yields a factor of $1 - (5 \times 0.15) = 0.25$ (a **$75\%$ risk reduction**). For example, a Critical inherent score of $25$ drops to $\text{round}(25 \times 0.25) = 6$ (Medium severity).
3. **Sanity Check 3 (Strict Residual Floor $\ge 1$)**:
   In enterprise governance (NIST SP 800-30, ISO 27005), absolute zero risk is a fallacy. No matter how many controls are layered, residual risk is bounded by a floor of $\mathbf{1}$.
4. **Diminishing Marginal Returns (Defense-in-Depth)**:
   Each subsequent control dampens the *remaining* residual risk rather than subtracting a flat linear number. This accurately mirrors real-world security engineering where stacking redundant controls provides incremental resilience rather than dropping scores to zero.

#### Effectiveness Levels Breakdown

| Rating | Factor ($1 - e \times 0.15$) | Single Control Reduction | Example ($20 \text{ Inherent}$) |
| :--- | :--- | :--- | :--- |
| **1 - Minimal** | $0.85$ | $15\%$ reduction | $17$ (High) |
| **2 - Minor** | $0.70$ | $30\%$ reduction | $14$ (High) |
| **3 - Moderate** | $0.55$ | $45\%$ reduction | $11$ (Medium) |
| **4 - High** | $0.40$ | $60\%$ reduction | $8$ (Medium) |
| **5 - Automated/Critical** | $0.25$ | $75\%$ reduction | $5$ (Low) |
| **Compounding (Eff 4 + Eff 5)** | $0.40 \times 0.25 = 0.10$ | $90\%$ reduction | $2$ (Low) |

---

### 3. Severity Bands
Both inherent and residual scores are mapped to standardized severity tiers:

| Score Range | Severity Band | Visual Indicator | Color Hex | Action Required |
| :---: | :---: | :---: | :---: | :--- |
| **1 – 5** | **Low** | Green | `#10b981` | Acceptable; routine monitoring |
| **6 – 12** | **Medium** | Amber | `#f59e0b` | Managed; regular review |
| **13 – 19** | **High** | Orange | `#f97316` | Remediation plan required |
| **20 – 25** | **Critical** | Rose Red | `#ef4444` | Immediate executive escalation |

---

## Business Rule Decision: Closing a Risk with Zero Mitigations

### The Dilemma
> *What should happen if someone tries to mark a risk "Closed" while it has zero mitigations?*

### Our Policy Implementation & Compliance Rationale
In enterprise risk and compliance management (SOC 2 CC7.1, NIST SP 800-30, ISO 27001), arbitrarily closing unmitigated risks creates a severe audit vulnerability ("rubber-stamping" unchecked hazards).

We implement the following rule:
- **Medium, High, and Critical inherent risks (Score $\ge 6$) CANNOT be marked "Closed" without at least one mitigating control attached.**
  Attempting to do so triggers an explicit `422 Unprocessable Entity` response:
  > *"Compliance Rule Violation: Cannot mark risk with 'HIGH' inherent severity (Score: 16) as CLOSED with zero mitigating controls. Add at least one mitigation control or lower inherent score to LOW (<= 5) before closing."*
- **Low inherent risks (Score $\le 5$) CAN be closed without mitigations.**
  Inherently low risks (e.g., probability 1, impact 2) represent de minimis or formally accepted risks that do not warrant control overhead and can be legitimately closed.

---

## Architecture & Code Organization

```
Risk Management Workspace
├── backend/                                   # Spring Boot 3.3.4 (Java 21) REST API
│   ├── src/main/java/com/hyperproof/risk/
│   │   ├── config/WebConfig.java              # CORS config for frontend origins
│   │   ├── controller/
│   │   │   ├── RiskController.java            # REST endpoints for risks & stats
│   │   │   └── MitigationController.java      # REST endpoints for mitigations
│   │   ├── dto/                               # Validated Request/Response DTOs & Mapper
│   │   ├── entity/                            # JPA entities (Risk, Mitigation, Enums)
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java    # RFC-compliant error formatting
│   │   │   └── BusinessRuleViolationException # Custom domain rule exception
│   │   ├── repository/                        # JPA Repositories with JPQL queries
│   │   ├── service/
│   │   │   ├── ScoringService.java            # Isolated, pure scoring engine
│   │   │   ├── RiskService.java               # Risk business operations & rule checks
│   │   │   └── MitigationService.java         # Mitigation management & cascade updates
│   │   └── data/DataInitializer.java          # Realistic enterprise seed data
│   └── src/test/java/com/hyperproof/risk/     # Comprehensive JUnit 5 & MockMvc tests
│
├── frontend/                                  # React 18 + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── RiskTable.tsx                  # Sortable risk register table
│   │   │   ├── RiskHeatmap.tsx                # 5x5 Likelihood x Impact matrix
│   │   │   ├── RiskStatsCards.tsx             # KPI summary metrics
│   │   │   ├── RiskModal.tsx                  # Create/Edit risk with live score preview
│   │   │   ├── RiskDetailDrawer.tsx           # Mitigation manager with delta projection
│   │   │   ├── ScoreBadge.tsx                 # Severity badge with score counter
│   │   │   └── Toast.tsx                      # Toast alert notification context
│   │   ├── services/
│   │   │   ├── api.ts                         # Type-safe API client
│   │   │   └── scoring.ts                     # Client-side instant preview math
│   │   ├── types/risk.ts                      # Full TypeScript interfaces
│   │   └── App.tsx                            # Root application dashboard
│   ├── tailwind.config.js
│   └── vite.config.ts                         # Dev server & reverse proxy
│
├── docker-compose.yml                         # Optional PostgreSQL container
├── start-all.bat                              # One-click startup for Windows
├── start.sh                                   # One-click startup for Linux/macOS
└── README.md
```

---

## Running Automated Tests

All tests can be executed with single standard commands:

### Backend Tests (JUnit 5 + Spring Boot Test + MockMvc)

```bash
cd backend
mvn test
```

**Test Coverage Summary (30 tests passing):**
- `ScoringServiceTest` (20 tests): Inherent score bounds ($1..5$), invalid parameter rejections, zero-mitigation equality, single control $75\%$ reduction, multi-control compounding, residual floor $= 1$, and exact severity boundary mappings ($1, 5, 6, 12, 13, 19, 20, 25$).
- `RiskBusinessRuleTest` (6 tests): Verification that closing unmitigated Critical, High, and Medium risks is rejected, while Low risks and risks with $\ge 1$ control are permitted.
- `RiskApiIntegrationTest` (4 tests): Full lifecycle API tests (Create risk $\rightarrow$ add mitigation $\rightarrow$ check residual drop $\rightarrow$ add second mitigation $\rightarrow$ close risk $\rightarrow$ test invalid input 400 rejection $\rightarrow$ test 422 compliance rule rejection $\rightarrow$ test filter and sort).

### Frontend Tests (Vitest + React Testing Library)

```bash
cd frontend
npm test
```

**Test Coverage Summary (13 tests passing):**
- `scoring.test.ts` (9 tests): Inherent probability & impact bounds, severity band classifications (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), residual compound dampening, zero mitigations baseline, and floor clamping ($\ge 1$).
- `components.test.tsx` (4 tests): Unit rendering tests for `ScoreBadge` and severity color mappings.

### Frontend Production Build

```bash
cd frontend
npm run build
```

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/risks` | List risks (Supports `category`, `status`, `search`, `sortBy`, `sortDirection`) |
| `POST` | `/api/risks` | Create a new risk with likelihood & impact validation |
| `GET` | `/api/risks/{id}` | Get single risk with full list of mitigations & calculated scores |
| `PUT` | `/api/risks/{id}` | Update risk attributes, scores, or status |
| `DELETE` | `/api/risks/{id}` | Delete a risk and its associated mitigations |
| `GET` | `/api/risks/stats` | Aggregate dashboard stats (KPIs, severity distributions) |
| `GET` | `/api/risks/{riskId}/mitigations` | List mitigations for a risk |
| `POST` | `/api/risks/{riskId}/mitigations` | Attach a new mitigating control (recalculates residual score) |
| `PUT` | `/api/risks/{riskId}/mitigations/{mitigationId}` | Update a mitigation's description or effectiveness |
| `DELETE` | `/api/risks/{riskId}/mitigations/{mitigationId}` | Delete a mitigation (recalculates residual score) |

---

## Stretch Goals Implemented

1. **Compliance Framework Mapping**:
   Risks can be mapped to industry compliance standards including **SOC 2** (`CC6.1`, `CC6.3`, `CC7.1`), **NIST CSF** (`PR.AC-1`, `PR.DS-1`), **ISO 27001**, **GDPR**, and **HIPAA**. These mappings appear as interactive badges on the table and detail drawer.
2. **Next Review Date & Overdue Indicator**:
   Each risk tracks a review schedule. Overdue risks automatically display visual alert indicators across the table and KPI summary.
3. **5x5 Interactive Risk Matrix Heatmap**:
   Visualizes all organizational risks on a 5x5 Likelihood $\times$ Impact grid with interactive quadrant inspection.
4. **Live Score Simulation**:
   When creating risks or attaching new controls, the UI computes and previews the exact residual score drop in real time before saving.

---

## Key Assumptions & Trade-offs

1. **In-Memory H2 vs. PostgreSQL**:
   - *Decision*: Configured H2 as the default dev profile with PostgreSQL profile readily switchable via `application.yml` / Docker Compose.
   - *Rationale*: Guarantees zero-dependency local startup in $<1$ minute for reviewers while remaining production-ready with standard JPA dialects.
2. **Dynamic Inherent & Residual Score Computation**:
   - *Decision*: Scores are computed dynamically by `ScoringService` during entity retrieval and mapping rather than stored in static database columns.
   - *Rationale*: Eliminates data drift or stale cached scores when mitigations are added, updated, or deleted.
3. **Single Organization Scope**:
   - *Decision*: Omitted multi-tenancy and authentication as specified in the prompt out-of-scope guidelines.

---

## What We'd Do Differently / Add With More Time

1. **Control Assessment Frequency & Evidence Attachment**:
   Allow compliance teams to upload audit evidence (PDFs, screenshots) to individual mitigations and set automated recurring control test cadences.
2. **Audit Log / History Timeline**:
   Record an immutable event log for every risk score adjustment or status change to show auditors who altered risk ratings and when.
3. **Risk Acceptance Exception Workflows**:
   Support a formal "Risk Acceptance" exception workflow with manager approvals and expiration dates for risks that cannot be mitigated immediately.
4. **Custom Risk Scoring Models**:
   Allow organizations to configure their own custom formula weights (e.g. 3x3 matrices or dollar-value annualized loss expectancy / ALE calculations).
