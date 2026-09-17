export type RiskCategory = 'OPERATIONAL' | 'FINANCIAL' | 'COMPLIANCE' | 'SECURITY' | 'STRATEGIC';
export type RiskStatus = 'OPEN' | 'MITIGATING' | 'CLOSED';
export type SeverityBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Mitigation {
  id: string;
  riskId: string;
  description: string;
  effectiveness: number; // 1-5
  createdAt: string;
}

export interface Risk {
  id: string;
  title: string;
  description?: string;
  category: RiskCategory;
  owner?: string;
  likelihood: number; // 1-5
  impact: number;     // 1-5
  status: RiskStatus;
  complianceFrameworks?: string[];
  nextReviewDate?: string;
  isOverdue?: boolean;

  // Computed scores from backend
  inherentScore: number;
  inherentSeverity: SeverityBand;
  residualScore: number;
  residualSeverity: SeverityBand;
  reductionPercentage: number;
  mitigationCount: number;

  createdAt: string;
  updatedAt: string;
  mitigations?: Mitigation[];
}

export interface CreateRiskPayload {
  title: string;
  description?: string;
  category: RiskCategory;
  owner?: string;
  likelihood: number;
  impact: number;
  status?: RiskStatus;
  complianceFrameworks?: string[];
  nextReviewDate?: string;
}

export interface UpdateRiskPayload {
  title: string;
  description?: string;
  category: RiskCategory;
  owner?: string;
  likelihood: number;
  impact: number;
  status: RiskStatus;
  complianceFrameworks?: string[];
  nextReviewDate?: string;
}

export interface CreateMitigationPayload {
  description: string;
  effectiveness: number; // 1-5
}

export interface UpdateMitigationPayload {
  description: string;
  effectiveness: number; // 1-5
}

export interface RiskStats {
  totalRisks: number;
  openRisks: number;
  mitigatingRisks: number;
  closedRisks: number;
  overdueReviews: number;
  averageResidualReductionPercentage: number;
  inherentSeverityDistribution: Record<SeverityBand, number>;
  residualSeverityDistribution: Record<SeverityBand, number>;
  categoryDistribution: Record<RiskCategory, number>;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path?: string;
  validationErrors?: Array<{
    field: string;
    rejectedValue: any;
    message: string;
  }>;
}
