import apiClient from './client'
import type {
  ComplianceReportResponse,
  DeploymentHistoryReportResponse,
  TopMissingPatchesResponse,
  RiskMatrixResponse,
  DeploymentMatrixResponse,
  ComplianceDocumentResponse,
  DeploymentDocumentResponse,
} from '../types/report'

export async function getComplianceReport(dateFrom?: string, dateTo?: string): Promise<ComplianceReportResponse> {
  const params: Record<string, string> = {}
  if (dateFrom) params.date_from = dateFrom
  if (dateTo) params.date_to = dateTo
  const { data } = await apiClient.get<ComplianceReportResponse>('/reports/compliance', { params })
  return data
}

export async function getDeploymentHistoryReport(dateFrom?: string, dateTo?: string): Promise<DeploymentHistoryReportResponse> {
  const params: Record<string, string> = {}
  if (dateFrom) params.date_from = dateFrom
  if (dateTo) params.date_to = dateTo
  const { data } = await apiClient.get<DeploymentHistoryReportResponse>('/reports/deployment-history', { params })
  return data
}

export async function getTopMissingPatchesReport(limit: number = 50): Promise<TopMissingPatchesResponse> {
  const { data } = await apiClient.get<TopMissingPatchesResponse>('/reports/top-missing-patches', { params: { limit } })
  return data
}

export async function getRiskMatrixReport(): Promise<RiskMatrixResponse> {
  const { data } = await apiClient.get<RiskMatrixResponse>('/reports/risk-matrix')
  return data
}

export async function getDeploymentMatrixReport(): Promise<DeploymentMatrixResponse> {
  const { data } = await apiClient.get<DeploymentMatrixResponse>('/reports/deployment-matrix')
  return data
}

export async function getComplianceDocumentReport(fromDate?: string, toDate?: string): Promise<ComplianceDocumentResponse> {
  const params: Record<string, string> = {}
  if (fromDate) params.from_date = fromDate
  if (toDate) params.to_date = toDate
  const { data } = await apiClient.get<ComplianceDocumentResponse>('/reports/compliance-report', { params })
  return data
}

export async function getDeploymentDocumentReport(fromDate?: string, toDate?: string): Promise<DeploymentDocumentResponse> {
  const params: Record<string, string> = {}
  if (fromDate) params.from_date = fromDate
  if (toDate) params.to_date = toDate
  const { data } = await apiClient.get<DeploymentDocumentResponse>('/reports/deployment-report', { params })
  return data
}
