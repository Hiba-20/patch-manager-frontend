export interface HostComplianceRow {
  host_id: string
  hostname: string
  ip_address: string
  os_type: string
  status: string
  compliance_status: string
  last_scan_at: string | null
  days_since_scan: number | null
  total_missing: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  compliance_score: number
}

export interface ComplianceReportResponse {
  generated_at: string
  date_from: string | null
  date_to: string | null
  total_hosts: number
  compliant_hosts: number
  partial_hosts: number
  non_compliant_hosts: number
  never_scanned_hosts: number
  fleet_compliance_rate: number
  rows: HostComplianceRow[]
}

export interface DeploymentHistoryRow {
  deployment_id: string
  patch_name: string
  patch_severity: string | null
  hostname: string
  host_id: string
  status: string
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  duration_seconds: number | null
}

export interface DeploymentHistoryReportResponse {
  generated_at: string
  date_from: string | null
  date_to: string | null
  total_deployments: number
  successful: number
  failed: number
  success_rate: number
  avg_duration_seconds: number | null
  rows: DeploymentHistoryRow[]
}

export interface TopMissingPatchRow {
  kb_id: string
  title: string
  severity: string
  affected_hosts: number
  host_names: string[]
}

export interface TopMissingPatchesResponse {
  generated_at: string
  total_unique_patches: number
  rows: TopMissingPatchRow[]
}

export interface HostRiskRow {
  host_id: string
  hostname: string
  ip_address: string
  os_type: string
  risk_level: string
  risk_score: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  last_scan_at: string | null
}

export interface RiskMatrixResponse {
  generated_at: string
  critical_hosts: number
  high_risk_hosts: number
  medium_risk_hosts: number
  low_risk_hosts: number
  unknown_hosts: number
  rows: HostRiskRow[]
}

export interface DeploymentMatrixCell {
  status: string
  started_at: string | null
  finished_at: string | null
  deployment_id: string
}

export interface DeploymentMatrixRow {
  patch_id: string
  patch_name: string
  severity: string | null
  classification: string | null
  hosts: Record<string, DeploymentMatrixCell>
}

export interface DeploymentMatrixHost {
  id: string
  hostname: string
  ip_address: string
  os_type: string
}

export interface DeploymentMatrixResponse {
  generated_at: string
  patches: DeploymentMatrixRow[]
  hosts: DeploymentMatrixHost[]
  total_patches: number
  total_hosts: number
}

// ── Document Report Types ────────────────────────────────────────────────────

export interface DocMeta {
  title: string
  generated_at: string
  generated_by: string
  date_range: { from: string | null; to: string | null } | null
  report_id: string
}

export interface DocMissingPatch {
  kb_id: string
  title: string
  severity: string
  classification: string | null
  days_missing: number
}

export interface DocHost {
  host_id: string
  hostname: string
  os: string
  compliance_score: number
  status: string
  last_scan: string | null
  missing_patches: DocMissingPatch[]
  failed_deployments_count: number
  recommendations: string[]
}

export interface DocPatchSummary {
  kb_id: string
  title: string
  severity: string
  classification: string | null
  affected_hosts: string[]
  deployed_count: number
  failed_count: number
  success_rate: number
  recommendation: string
}

export interface DocFailureAnalysis {
  deployment_id: string
  kb_id: string
  hostname: string
  failed_at: string | null
  error_message: string | null
  attempt_number: number
}

export interface ComplianceDocumentResponse {
  meta: DocMeta
  summary: {
    total_hosts: number
    compliant_hosts: number
    partial_hosts: number
    non_compliant_hosts: number
    never_scanned_hosts: number
    compliance_rate: number
    total_missing_patches: number
    critical_missing: number
    avg_compliance_score: number
  }
  findings: string[]
  hosts: DocHost[]
  patch_summary: DocPatchSummary[]
  failure_analysis: DocFailureAnalysis[]
}

export interface DocDeployment {
  deployment_id: string
  kb_id: string
  title: string
  severity: string | null
  hostname: string
  status: string
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  duration_minutes: number | null
  error_message: string | null
  approved_by: string | null
  retry_count: number
}

export interface DocByPatch {
  kb_id: string
  title: string
  severity: string | null
  total_attempts: number
  success: number
  failed: number
  success_rate: number
  hosts_attempted: string[]
  recommendation: string
}

export interface DocByHost {
  hostname: string
  total_deployments: number
  successful: number
  failed: number
  success_rate: number
  patches_attempted: string[]
  recommendation: string
}

export interface DeploymentDocumentResponse {
  meta: DocMeta
  summary: {
    total_deployments: number
    successful: number
    failed: number
    pending: number
    success_rate: number
    most_failed_patch: string
    most_affected_host: string
    avg_deployment_duration_minutes: number
  }
  findings: string[]
  deployments: DocDeployment[]
  by_patch: DocByPatch[]
  by_host: DocByHost[]
}
