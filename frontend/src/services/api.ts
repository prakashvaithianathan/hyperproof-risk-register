import {
  Risk,
  CreateRiskPayload,
  UpdateRiskPayload,
  Mitigation,
  CreateMitigationPayload,
  UpdateMitigationPayload,
  RiskStats,
  RiskCategory,
  RiskStatus,
} from '../types/risk';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Request failed with status ${response.status}: ${response.statusText}` };
    }
    throw errorData;
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {
  // Risk Endpoints
  async getRisks(params?: {
    category?: RiskCategory | '';
    status?: RiskStatus | '';
    search?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<Risk[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortDirection) query.append('sortDirection', params.sortDirection);

    const response = await fetch(`${API_BASE}/risks?${query.toString()}`);
    return handleResponse<Risk[]>(response);
  },

  async getRiskById(id: string): Promise<Risk> {
    const response = await fetch(`${API_BASE}/risks/${id}`);
    return handleResponse<Risk>(response);
  },

  async createRisk(payload: CreateRiskPayload): Promise<Risk> {
    const response = await fetch(`${API_BASE}/risks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Risk>(response);
  },

  async updateRisk(id: string, payload: UpdateRiskPayload): Promise<Risk> {
    const response = await fetch(`${API_BASE}/risks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Risk>(response);
  },

  async deleteRisk(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/risks/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  async getStats(): Promise<RiskStats> {
    const response = await fetch(`${API_BASE}/risks/stats`);
    return handleResponse<RiskStats>(response);
  },

  // Mitigation Endpoints
  async getMitigations(riskId: string): Promise<Mitigation[]> {
    const response = await fetch(`${API_BASE}/risks/${riskId}/mitigations`);
    return handleResponse<Mitigation[]>(response);
  },

  async createMitigation(riskId: string, payload: CreateMitigationPayload): Promise<Mitigation> {
    const response = await fetch(`${API_BASE}/risks/${riskId}/mitigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Mitigation>(response);
  },

  async updateMitigation(riskId: string, mitigationId: string, payload: UpdateMitigationPayload): Promise<Mitigation> {
    const response = await fetch(`${API_BASE}/risks/${riskId}/mitigations/${mitigationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Mitigation>(response);
  },

  async deleteMitigation(riskId: string, mitigationId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/risks/${riskId}/mitigations/${mitigationId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};
