/**
 * API Service for Financial Modeling Backend
 * 
 * This service handles all communication with the FastAPI backend
 * for the 3-Statement financial model.
 */

import { Variable, VariableSection } from '@/config/models/threeStatementConfig';

// API Base URL - Uses environment variable in production, falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AmortizationTable {
  headers: string[];
  rows: (string | number)[][];
}

export interface CashFlowPeriod {
  year: string;
  operating_activities: [string, number][];
  net_cash_from_operating_activities: number;
  investing_activities: [string, number][];
  net_cash_from_investing_activities: number;
  financing_activities: [string, number][];
  net_cash_from_financing_activities: number;
  net_change_in_cash: number;
  opening_cash_balance: number;
  closing_cash_balance: number;
}

export interface CalculationResult {
  income_statement: {
    years: string[];
    line_items: { label: string; values: number[] }[];
    expense_breakdown?: { name: string; value: number }[];
  };
  balance_sheet: {
    years: string[];
    line_items: { label: string; values: number[] }[];
  };
  cash_flow: CashFlowPeriod[];
  amortization_table?: AmortizationTable;
  kpis: {
    gross_margin: number;
    operating_margin: number;
    net_margin: number;
    current_ratio: number;
    debt_to_equity: number;
    roe: number;
    roa: number;
  };
  projections: {
    years: number[];
    revenue: number[];
    net_income: number[];
    ebitda: number[];
    free_cash_flow: number[];
  };
  expense_breakdown?: { name: string; value: number }[];
  expenses?: { name?: string; category?: string; type?: string; amount?: number; value?: number }[];
  operating_expenses?: { name?: string; category?: string; amount?: number; value?: number }[] | Record<string, number>;
  equity?: {
    shareholders: { name: string; shares: number; value: number }[];
  };
  // Company information
  company_type?: string;
  company_metrics?: Record<string, any>;
  // Dashboard KPIs from backend calculation
  dashboard_kpis?: {
    total_revenue?: number;
    total_expenses?: number;
    net_income?: number;
    profit_margin?: number;
    roe?: number;
    asset_turnover?: number;
    current_ratio?: number;
    debt_to_equity?: number;
    client_retention_rate?: number;
    utilization_rate?: number;
    clv?: number;
    cac?: number;
    wacc?: number;
    terminal_growth?: number;
    terminal_value?: number;
    revenue_growth?: number;
    ebitda_margin?: number;
  };
}

/**
 * Generic API request helper
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  console.log('=== API REQUEST DEBUG ===');
  console.log('Making request to:', `${API_BASE_URL}${endpoint}`);
  console.log('Request options:', options);
  
  try {
                 const response = await fetch(`${API_BASE_URL}${endpoint}`, {
               headers: {
                 'Content-Type': 'application/json',
                 ...options.headers,
               },
               ...options,
               // Add timeout to prevent hanging
               signal: AbortSignal.timeout(30000), // 30 second timeout
             });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return { success: true, data };
             } catch (error) {
             console.error('API request failed:', error);
             let errorMessage = 'Unknown error occurred';
             
             if (error instanceof Error) {
               if (error.name === 'AbortError') {
                 errorMessage = 'Request timed out. Please try again.';
               } else if (error.message.includes('Failed to fetch')) {
                 errorMessage = 'Cannot connect to server. Please check if the backend is running.';
               } else {
                 errorMessage = error.message;
               }
             }
             
             return {
               success: false,
               error: errorMessage,
             };
           }
}

/**
 * 3-Statement Model API Functions
 */

/**
 * Get model variables from backend
 */
export async function getModelVariables(modelId: string): Promise<ApiResponse<VariableSection[]>> {
  return apiRequest<VariableSection[]>(`/models/${modelId}/variables`);
}

/**
 * Save model variables to backend
 */
export async function saveModelVariables(
  modelId: string,
  variables: VariableSection[]
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/models/${modelId}/variables`, {
    method: 'POST',
    body: JSON.stringify({ variables }),
  });
}

/**
 * Add a new variable to the model
 */
export async function addVariable(
  modelId: string,
  sectionId: string,
  variable: Variable
): Promise<ApiResponse<Variable>> {
  return apiRequest<Variable>(`/models/${modelId}/sections/${sectionId}/variables`, {
    method: 'POST',
    body: JSON.stringify(variable),
  });
}

/**
 * Update a variable value
 */
export async function updateVariable(
  modelId: string,
  sectionId: string,
  variableId: string,
  updates: Partial<Variable>
): Promise<ApiResponse<Variable>> {
  return apiRequest<Variable>(`/models/${modelId}/sections/${sectionId}/variables/${variableId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a variable
 */
export async function deleteVariable(
  modelId: string,
  sectionId: string,
  variableId: string
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/models/${modelId}/sections/${sectionId}/variables/${variableId}`, {
    method: 'DELETE',
  });
}

/**
 * Calculate 3-Statement model
 */
export async function calculateModel(
  modelId: string,
  variables: VariableSection[],
  forecastPeriod?: string
): Promise<ApiResponse<CalculationResult>> {
  return apiRequest<CalculationResult>(`/models/${modelId}/calculate`, {
    method: 'POST',
    body: JSON.stringify(forecastPeriod ? { variables, forecastPeriod } : { variables }),
  });
}

/**
 * Get model calculation results
 */
export async function getModelResults(modelId: string): Promise<ApiResponse<CalculationResult>> {
  return apiRequest<CalculationResult>(`/models/${modelId}/results`);
}

/**
 * Import Excel data
 */
export async function importExcelData(
  modelId: string,
  file: File
): Promise<ApiResponse<{ message: string; imported_count: number; parsed_data: any }>> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${API_BASE_URL}/models/${modelId}/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Import failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
}

/**
 * Parse Excel file and return structured data
 */
export async function parseExcelFile(file: File): Promise<ApiResponse<{
  sheets: string[];
  columns: string[];
  data: any[];
  fileName: string;
  rowCount: number;
}>> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${API_BASE_URL}/models/parse-excel`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Excel parsing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Excel parsing failed',
    };
  }
}

/**
 * Apply column mappings and import data
 */
export async function applyColumnMappings(
  modelId: string,
  mappings: any[],
  data: any[]
): Promise<ApiResponse<{ message: string; updated_variables: any[] }>> {
  return apiRequest<{ message: string; updated_variables: any[] }>(`/models/${modelId}/apply-mappings`, {
    method: 'POST',
    body: JSON.stringify({ mappings, data }),
  });
}

// Sensitivity Analysis API Types
export interface SensitivityRequest {
  free_cash_flows: number[];
  wacc_range: number[];
  terminal_growth_range: number[];
  terminal_value_method: string;
}

export interface SensitivityMatrixEntry {
  wacc: number;
  values: { growth: number; dcf: number }[];
}

export interface SensitivityMatrixResponse {
  matrix: SensitivityMatrixEntry[];
}

/**
 * Run DCF Sensitivity Analysis (heatmap matrix)
 */
export async function getSensitivityMatrix(
  req: SensitivityRequest
): Promise<ApiResponse<SensitivityMatrixResponse>> {
  return apiRequest<SensitivityMatrixResponse>(
    '/models/sensitivity-analysis',
    {
      method: 'POST',
      body: JSON.stringify(req),
    }
  );
}

/**
 * Historical Model API Functions
 */

/**
 * Calculate historical financial model
 */
export async function calculateHistoricalModel(
  data: any
): Promise<ApiResponse<CalculationResult>> {
  console.log('=== FRONTEND API CALL DEBUG ===');
  console.log('Calling calculateHistoricalModel with data:', data);
  console.log('API endpoint: /models/historical/calculate');
  
  try {
    const result = await apiRequest<CalculationResult>('/models/historical/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('API call successful, result:', result);
    return result;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

/**
 * Process imported financial statements and generate forecasts
 */
export async function processFinancialStatements(
  data: any
): Promise<ApiResponse<CalculationResult>> {
  console.log('=== FINANCIAL STATEMENTS API CALL DEBUG ===');
  console.log('Calling processFinancialStatements with data:', data);
  console.log('API endpoint: /models/historical/financial-statements');
  
  try {
    const result = await apiRequest<CalculationResult>('/models/historical/financial-statements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('Financial statements API call successful, result:', result);
    return result;
  } catch (error) {
    console.error('Financial statements API call failed:', error);
    throw error;
  }
}

/**
 * Get available company types for historical calculations
 */
export async function getHistoricalCompanyTypes(): Promise<ApiResponse<Record<string, any>>> {
  return apiRequest<Record<string, any>>('/models/historical/company-types');
}

/**
 * Get information about a specific company type
 */
export async function getHistoricalCompanyTypeInfo(
  companyType: string
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/models/historical/company-types/${companyType}`);
}

/**
 * Validate historical data
 */
export async function validateHistoricalData(
  companyType: string,
  data: any
): Promise<ApiResponse<any>> {
  return apiRequest<any>('/models/historical/validate', {
    method: 'POST',
    body: JSON.stringify({ companyType, data }),
  });
}

/**
 * Dashboard API Functions
 */

/**
 * Calculate dashboard metrics for historical data
 */
export async function calculateHistoricalDashboard(
  companyType: string,
  statementsData: any
): Promise<ApiResponse<any>> {
  return apiRequest<any>('/models/historical/dashboard-metrics', {
    method: 'POST',
    body: JSON.stringify({
      companyType,
      statementsData
    })
  });
}

/**
 * Get available company types for dashboard calculations
 */
export async function getDashboardCompanyTypes(): Promise<ApiResponse<Record<string, any>>> {
  return apiRequest<Record<string, any>>('/models/historical/dashboard/company-types');
}

/**
 * Get information about a specific dashboard company type
 */
export async function getDashboardCompanyTypeInfo(
  companyType: string
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/models/historical/dashboard/company-types/${companyType}`);
}

/**
 * Get available chart types for a specific company type
 */
export async function getDashboardChartTypes(
  companyType: string
): Promise<ApiResponse<string[]>> {
  return apiRequest<string[]>(`/models/historical/dashboard/${companyType}/chart-types`);
}

/**
 * Get KPI categories for a specific company type
 */
export async function getDashboardKpiCategories(
  companyType: string
): Promise<ApiResponse<string[]>> {
  return apiRequest<string[]>(`/models/historical/dashboard/${companyType}/kpi-categories`);
}

// Export real API functions
export const api = {
  getModelVariables,
  saveModelVariables,
  addVariable,
  updateVariable,
  deleteVariable,
  calculateModel, // Use real API, not mockApi
  getModelResults,
  importExcelData,
  parseExcelFile,
  applyColumnMappings,
  // Historical functions
  calculateHistoricalModel,
  processFinancialStatements,
  getHistoricalCompanyTypes,
  getHistoricalCompanyTypeInfo,
  validateHistoricalData,
  // Dashboard functions
  calculateHistoricalDashboard,
  getDashboardCompanyTypes,
  getDashboardCompanyTypeInfo,
  getDashboardChartTypes,
  getDashboardKpiCategories
}; 