import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Risk, RiskStats, RiskCategory, RiskStatus, CreateRiskPayload, UpdateRiskPayload, CreateMitigationPayload } from './types/risk';
import { RiskStatsCards } from './components/RiskStatsCards';
import { RiskHeatmap } from './components/RiskHeatmap';
import { RiskTable } from './components/RiskTable';
import { RiskModal } from './components/RiskModal';
import { RiskDetailDrawer } from './components/RiskDetailDrawer';
import { CustomSelect } from './components/CustomSelect';
import { ToastProvider, useToast } from './components/Toast';
import {
  Shield,
  Plus,
  Search,
  RefreshCw,
  LayoutGrid,
} from 'lucide-react';

const MainDashboard: React.FC = () => {
  const { showToast } = useToast();

  const [risks, setRisks] = useState<Risk[]>([]);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<RiskStatus | ''>('');
  const [sortBy, setSortBy] = useState('residualScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals & Selected Risk
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  // Load risks & stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [risksData, statsData] = await Promise.all([
        api.getRisks({
          category: categoryFilter,
          status: statusFilter,
          search: search.trim() || undefined,
          sortBy,
          sortDirection,
        }),
        api.getStats(),
      ]);

      setRisks(risksData);
      setStats(statsData);

      // If a risk was selected, refresh its details
      if (selectedRiskId) {
        try {
          const detailed = await api.getRiskById(selectedRiskId);
          setSelectedRisk(detailed);
        } catch {
          setSelectedRisk(null);
          setSelectedRiskId(null);
        }
      }
    } catch (err: any) {
      showToast('error', 'Failed to load risk data', err.message || 'Check server connection');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, search, sortBy, sortDirection, selectedRiskId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle single risk selection for drawer
  const handleSelectRisk = async (risk: Risk) => {
    setSelectedRiskId(risk.id);
    try {
      const detailed = await api.getRiskById(risk.id);
      setSelectedRisk(detailed);
    } catch (err: any) {
      showToast('error', 'Error loading risk details', err.message);
    }
  };

  // Create or Update Risk
  const handleSaveRisk = async (data: CreateRiskPayload | UpdateRiskPayload, isEdit: boolean) => {
    try {
      if (isEdit && editingRisk) {
        await api.updateRisk(editingRisk.id, data as UpdateRiskPayload);
        showToast('success', 'Risk Updated', `Updated "${data.title}" successfully.`);
      } else {
        await api.createRisk(data as CreateRiskPayload);
        showToast('success', 'Risk Created', `Added "${data.title}" to the register.`);
      }
      setEditingRisk(null);
      await fetchData();
    } catch (err: any) {
      showToast('error', 'Compliance / Validation Error', err.message || 'Operation failed');
      throw err;
    }
  };

  // Delete Risk
  const handleDeleteRisk = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the risk "${title}"?`)) {
      return;
    }
    try {
      await api.deleteRisk(id);
      showToast('success', 'Risk Deleted', `Removed "${title}" from the register.`);
      if (selectedRiskId === id) {
        setSelectedRisk(null);
        setSelectedRiskId(null);
      }
      await fetchData();
    } catch (err: any) {
      showToast('error', 'Error deleting risk', err.message);
    }
  };

  // Add Mitigation to selected risk
  const handleAddMitigation = async (riskId: string, payload: CreateMitigationPayload) => {
    try {
      await api.createMitigation(riskId, payload);
      showToast('success', 'Control Attached', 'Mitigating control added. Residual score recalculated.');
      // Refresh details & list
      const detailed = await api.getRiskById(riskId);
      setSelectedRisk(detailed);
      await fetchData();
    } catch (err: any) {
      showToast('error', 'Failed to attach control', err.message);
      throw err;
    }
  };

  // Delete Mitigation
  const handleDeleteMitigation = async (riskId: string, mitigationId: string) => {
    try {
      await api.deleteMitigation(riskId, mitigationId);
      showToast('info', 'Control Removed', 'Mitigation removed and residual score adjusted.');
      const detailed = await api.getRiskById(riskId);
      setSelectedRisk(detailed);
      await fetchData();
    } catch (err: any) {
      showToast('error', 'Failed to remove control', err.message);
    }
  };

  // Update Status in drawer
  const handleUpdateStatus = async (riskId: string, newStatus: RiskStatus) => {
    if (!selectedRisk) return;
    try {
      await api.updateRisk(riskId, {
        title: selectedRisk.title,
        description: selectedRisk.description,
        category: selectedRisk.category,
        owner: selectedRisk.owner,
        likelihood: selectedRisk.likelihood,
        impact: selectedRisk.impact,
        status: newStatus,
        complianceFrameworks: selectedRisk.complianceFrameworks,
        nextReviewDate: selectedRisk.nextReviewDate,
      });
      showToast('success', 'Status Updated', `Risk status changed to ${newStatus}.`);
      const detailed = await api.getRiskById(riskId);
      setSelectedRisk(detailed);
      await fetchData();
    } catch (err: any) {
      showToast('error', 'Status Update Blocked', err.message || 'Cannot change status');
      throw err;
    }
  };

  const handleToggleSort = (field: string) => {
    if (sortBy.toLowerCase() === field.toLowerCase()) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-hyperproof-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-hyperproof-600/20">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg sm:text-xl">
              Hyperproof
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                showHeatmap
                  ? 'bg-sky-50 text-hyperproof-700 border-sky-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showHeatmap ? 'Hide 5x5 Heatmap' : 'Show 5x5 Heatmap'}</span>
              <span className="sm:hidden">{showHeatmap ? 'Hide 5x5' : '5x5'}</span>
            </button>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin text-hyperproof-600' : ''}`} />
            </button>

            <button
              onClick={() => {
                setEditingRisk(null);
                setIsRiskModalOpen(true);
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-white bg-hyperproof-600 hover:bg-hyperproof-700 rounded-xl shadow-md shadow-hyperproof-600/25 hover:shadow-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add New Risk</span>
              <span className="sm:hidden">New Risk</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* KPI Metric Summary Row */}
        <RiskStatsCards stats={stats} loading={loading && !stats} />

        {/* 5x5 Heatmap Matrix */}
        {showHeatmap && <RiskHeatmap risks={risks} onSelectRisk={handleSelectRisk} />}

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3.5 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search risks by title, description, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-hyperproof-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline">Cat:</span>
              <CustomSelect
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val as RiskCategory | '')}
                className="w-full"
                minWidth="w-full sm:min-w-[140px]"
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'SECURITY', label: 'Security', dotColor: 'bg-rose-500' },
                  { value: 'COMPLIANCE', label: 'Compliance', dotColor: 'bg-teal-500' },
                  { value: 'OPERATIONAL', label: 'Operational', dotColor: 'bg-blue-500' },
                  { value: 'FINANCIAL', label: 'Financial', dotColor: 'bg-purple-500' },
                  { value: 'STRATEGIC', label: 'Strategic', dotColor: 'bg-indigo-500' },
                ]}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline">Status:</span>
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as RiskStatus | '')}
                className="w-full"
                minWidth="w-full sm:min-w-[130px]"
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'OPEN', label: 'Open', dotColor: 'bg-sky-500' },
                  { value: 'MITIGATING', label: 'Mitigating', dotColor: 'bg-amber-500' },
                  { value: 'CLOSED', label: 'Closed', dotColor: 'bg-slate-400' },
                ]}
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline">Sort:</span>
              <CustomSelect
                value={`${sortBy}-${sortDirection}`}
                onChange={(val) => {
                  const [field, dir] = val.split('-');
                  setSortBy(field);
                  setSortDirection(dir as 'asc' | 'desc');
                }}
                className="w-full"
                minWidth="w-full sm:min-w-[190px]"
                options={[
                  { value: 'residualScore-desc', label: 'Residual Score (High First)' },
                  { value: 'residualScore-asc', label: 'Residual Score (Low First)' },
                  { value: 'inherentScore-desc', label: 'Inherent Score (High First)' },
                  { value: 'title-asc', label: 'Title (A - Z)' },
                  { value: 'createdAt-desc', label: 'Recently Added' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Risk Table */}
        <RiskTable
          risks={risks}
          loading={loading}
          onSelectRisk={handleSelectRisk}
          onEditRisk={(risk) => {
            setEditingRisk(risk);
            setIsRiskModalOpen(true);
          }}
          onDeleteRisk={handleDeleteRisk}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
        />
      </main>

      {/* Modals & Drawers */}
      <RiskModal
        isOpen={isRiskModalOpen}
        onClose={() => {
          setIsRiskModalOpen(false);
          setEditingRisk(null);
        }}
        onSubmit={handleSaveRisk}
        initialRisk={editingRisk}
      />

      <RiskDetailDrawer
        risk={selectedRisk}
        isOpen={Boolean(selectedRisk)}
        onClose={() => {
          setSelectedRisk(null);
          setSelectedRiskId(null);
        }}
        onAddMitigation={handleAddMitigation}
        onDeleteMitigation={handleDeleteMitigation}
        onUpdateStatus={handleUpdateStatus}
        onEditRisk={(risk) => {
          setSelectedRisk(null);
          setSelectedRiskId(null);
          setEditingRisk(risk);
          setIsRiskModalOpen(true);
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <MainDashboard />
    </ToastProvider>
  );
}

export default App;
