import { parseHistoricalBusinessDataTemplate } from './generateHistoricalDataTemplate';

export interface ProcessedHistoricalData {
  // Basic Information
  companyName?: string;
  industry?: string;
  businessModel?: string;
  
  // Historical Data by Year
  historicalExpenses: HistoricalYearData[];
  historicalEquipment: HistoricalEquipmentData[];
  historicalLoans: HistoricalLoanData[];
  historicalOtherIncomeCosts: HistoricalOtherData[];
  historicalInvestments: HistoricalInvestmentData[];
  historicalShareholders: HistoricalShareholderData[];
  
  // Service Business Specific
  historicalServices?: HistoricalServiceData[];
  serviceMetrics?: HistoricalServiceMetrics[];
}

export interface HistoricalYearData {
  year: number;
  expenses: Array<{
    category: string;
    amount: number;
    type: 'Fixed' | 'Variable';
    notes?: string;
  }>;
}

export interface HistoricalEquipmentData {
  year: number;
  equipment: Array<{
    name: string;
    purchaseCost: number;
    purchaseYear: number;
    depreciationMethod: string;
    usefulLife: number;
    notes?: string;
  }>;
}

export interface HistoricalLoanData {
  year: number;
  loans: Array<{
    name: string;
    loanType: string;
    subType: string;
    amount: number;
    interestRate: number;
    term: number;
    startYear: number;
  }>;
}

export interface HistoricalOtherData {
  year: number;
  items: Array<{
    description: string;
    amount: number;
    type: 'Income' | 'Cost';
    notes?: string;
  }>;
}

export interface HistoricalInvestmentData {
  year: number;
  investments: Array<{
    name: string;
    investmentType: string;
    amount: number;
    investor: string;
    notes?: string;
  }>;
}

export interface HistoricalShareholderData {
  year: number;
  shareholders: Array<{
    name: string;
    sharesOwned: number;
    ownershipPercent: number;
    shareClass: string;
    notes?: string;
  }>;
}

export interface HistoricalServiceData {
  year: number;
  services: Array<{
    serviceName: string;
    revenue: number;
    cost: number;
    notes?: string;
  }>;
}

export interface HistoricalServiceMetrics {
  year: number;
  metrics: Array<{
    metric: string;
    value: number;
    unit: string;
    notes?: string;
  }>;
}

/**
 * Process uploaded Excel data and convert it to form-compatible format
 */
export async function processHistoricalExcelData(file: File): Promise<ProcessedHistoricalData> {
  try {
    // Parse the Excel file using our template parser
    const parsedData = await parseHistoricalBusinessDataTemplate(file);
    
    // Convert parsed data to form format
    const processedData: ProcessedHistoricalData = {
      historicalExpenses: [],
      historicalEquipment: [],
      historicalLoans: [],
      historicalOtherIncomeCosts: [],
      historicalInvestments: [],
      historicalShareholders: [],
      historicalServices: [],
      serviceMetrics: []
    };

    // Process expenses by year
    const expensesByYear = groupByYear(parsedData.expenses);
    processedData.historicalExpenses = Object.entries(expensesByYear).map(([year, expenses]) => ({
      year: parseInt(year),
      expenses: expenses.map((expense: any) => ({
        category: expense.category,
        amount: expense.amount,
        type: expense.type,
        notes: expense.notes
      }))
    }));

    // Process equipment by year
    const equipmentByYear = groupByYear(parsedData.equipment);
    processedData.historicalEquipment = Object.entries(equipmentByYear).map(([year, equipment]) => ({
      year: parseInt(year),
      equipment: equipment.map((item: any) => ({
        name: item.name,
        purchaseCost: item.purchaseCost,
        purchaseYear: item.purchaseYear,
        depreciationMethod: item.depreciationMethod,
        usefulLife: item.usefulLife,
        notes: item.notes
      }))
    }));

    // Process loans by year
    const loansByYear = groupByYear(parsedData.loans);
    processedData.historicalLoans = Object.entries(loansByYear).map(([year, loans]) => ({
      year: parseInt(year),
      loans: loans.map((loan: any) => ({
        name: loan.name,
        loanType: loan.loanType,
        amount: loan.amount,
        interestRate: loan.interestRate,
        term: loan.term,
        startYear: loan.startYear,
        notes: loan.notes
      }))
    }));

    // Process other income/costs by year
    const otherByYear = groupByYear(parsedData.otherIncomeCosts);
    processedData.historicalOtherIncomeCosts = Object.entries(otherByYear).map(([year, items]) => ({
      year: parseInt(year),
      items: items.map((item: any) => ({
        description: item.description,
        amount: item.amount,
        type: item.type,
        notes: item.notes
      }))
    }));

    // Process investments by year
    const investmentsByYear = groupByYear(parsedData.investments);
    processedData.historicalInvestments = Object.entries(investmentsByYear).map(([year, investments]) => ({
      year: parseInt(year),
      investments: investments.map((investment: any) => ({
        name: investment.name,
        investmentType: investment.investmentType,
        amount: investment.amount,
        investor: investment.investor,
        notes: investment.notes
      }))
    }));

    // Process shareholders by year
    const shareholdersByYear = groupByYear(parsedData.shareholders);
    processedData.historicalShareholders = Object.entries(shareholdersByYear).map(([year, shareholders]) => ({
      year: parseInt(year),
      shareholders: shareholders.map((shareholder: any) => ({
        name: shareholder.name,
        sharesOwned: shareholder.sharesOwned,
        ownershipPercent: shareholder.ownershipPercent,
        shareClass: shareholder.shareClass,
        notes: shareholder.notes
      }))
    }));

    // Process services by year (if available)
    if (parsedData.services && parsedData.services.length > 0) {
      const servicesByYear = groupByYear(parsedData.services);
      processedData.historicalServices = Object.entries(servicesByYear).map(([year, services]) => ({
        year: parseInt(year),
        services: services.map((service: any) => ({
          serviceName: service.serviceName,
          revenue: service.revenue,
          cost: service.cost,
          notes: service.notes
        }))
      }));
    }

    // Process service metrics by year (if available)
    if (parsedData.serviceMetrics && parsedData.serviceMetrics.length > 0) {
      const metricsByYear = groupByYear(parsedData.serviceMetrics);
      processedData.serviceMetrics = Object.entries(metricsByYear).map(([year, metrics]) => ({
        year: parseInt(year),
        metrics: metrics.map((metric: any) => ({
          metric: metric.metric,
          value: metric.value,
          unit: metric.unit,
          notes: metric.notes
        }))
      }));
    }

    return processedData;
  } catch (error) {
    console.error('Error processing historical Excel data:', error);
    throw new Error('Failed to process Excel data. Please check the file format.');
  }
}

/**
 * Group data items by year
 */
function groupByYear(data: any[]): Record<string, any[]> {
  return data.reduce((acc, item) => {
    const year = item.year || new Date().getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(item);
    return acc;
  }, {} as Record<string, any[]>);
}

/**
 * Convert processed data to form state format
 */
export function convertToFormState(processedData: ProcessedHistoricalData) {
  return {
    // Basic information (if available)
    companyName: processedData.companyName || '',
    industry: processedData.industry || '',
    businessModel: processedData.businessModel || '',
    
    // Historical data arrays
    historicalExpenses: processedData.historicalExpenses,
    historicalEquipment: processedData.historicalEquipment,
    historicalLoans: processedData.historicalLoans,
    historicalOtherIncomeCosts: processedData.historicalOtherIncomeCosts,
    historicalInvestments: processedData.historicalInvestments,
    historicalShareholders: processedData.historicalShareholders,
    
    // Service-specific data
    historicalServices: processedData.historicalServices || [],
    serviceMetrics: processedData.serviceMetrics || []
  };
} 