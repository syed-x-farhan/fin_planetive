// businessInputParser.ts

// Define the sections and fields for business input import
export const businessInputSections = [
  'services', 'expenses', 'equipment', 'shareholders', 'loans', 'other', 'investments', 'assumptions', 'wacc', 'terminal_value', 'global_interest_rates'
];

export const businessInputFields = {
  services: ['name', 'price', 'clients', 'growth', 'cost'],
  expenses: ['category', 'amount', 'growthRate', 'notes'],
  equipment: ['name', 'cost', 'usefulLife', 'purchaseDate', 'notes'],
  shareholders: ['name', 'amount', 'percent', 'notes'],
  loans: ['amount', 'rate', 'years', 'startDate'],
  other: ['type', 'amount', 'notes', 'isIncome'],
  investments: ['name', 'amount', 'date', 'expectedReturn', 'maturityValue', 'maturityType', 'income', 'incomeAmount'],
  assumptions: ['taxRate', 'forecast', 'selfFunding', 'notes'],
  // New WACC and DCF fields
  wacc: ['useWaccBuildUp', 'useCostOfEquityOnly', 'rfRate', 'beta', 'marketPremium', 'costOfDebt', 'taxRateWacc', 'equityPct', 'debtPct'],
  // Terminal value fields
  terminal_value: ['tvMethod', 'tvMetric', 'tvMultiple', 'tvCustomValue', 'tvYear'],
  // Global interest rates
  global_interest_rates: ['hasGlobalInterestRates', 'shortTermInterestRate', 'longTermInterestRate', 'investmentInterestRate', 'useGlobalRatesForLoans'],
};

export function getSectionFields(section) {
  return businessInputFields[section] || [];
}

// Main parser: takes Excel data and mappings, returns business input object
export function parseBusinessInputExcel(data, mappings) {
  // Debug logs for input
  console.debug('[parseBusinessInputExcel] input data:', data);
  console.debug('[parseBusinessInputExcel] mappings:', mappings);
  // For each section, extract rows and map columns to fields
  const result = {};
  for (const section of businessInputSections) {
    const sectionFields = businessInputFields[section];
    // Find mappings for this section
    const sectionMappings = mappings.filter(m => m.section === section && m.mappedTo);
    console.debug(`[parseBusinessInputExcel] section: ${section}, sectionMappings:`, sectionMappings);
    if (sectionMappings.length === 0) continue;
    // Extract rows for this section
    const sectionRows = data.filter(row => 
      (row.__section && row.__section === section) ||
      (row.__sheetName && row.__sheetName.toLowerCase() === section.toLowerCase())
    );
    console.debug(`[parseBusinessInputExcel] section: ${section}, sectionRows:`, sectionRows);
    result[section] = sectionRows.map((row, rowIdx) => {
      const obj = {};
      for (const mapping of sectionMappings) {
        // Log the mapping process
        console.debug(`[parseBusinessInputExcel] mapping row ${rowIdx}, excelColumn: ${mapping.excelColumn}, mappedTo: ${mapping.mappedTo}, value:`, row[mapping.excelColumn]?.value);
        let value = row[mapping.excelColumn]?.value ?? '';
        
        // Handle boolean fields
        if (['useWaccBuildUp', 'useCostOfEquityOnly', 'hasGlobalInterestRates', 'useGlobalRatesForLoans'].includes(mapping.mappedTo)) {
          value = parseBoolean(value);
        }
        
        // Handle numeric fields
        if (['rfRate', 'beta', 'marketPremium', 'costOfDebt', 'taxRateWacc', 'equityPct', 'debtPct', 
             'shortTermInterestRate', 'longTermInterestRate', 'investmentInterestRate',
             'tvMultiple', 'tvCustomValue', 'tvYear'].includes(mapping.mappedTo)) {
          value = parseFloat(value) || 0;
        }
        
        obj[mapping.mappedTo] = value;
      }
      return obj;
    });
  }
  
  // Flatten first row of assumptions (if present) into top-level fields
  if ((result as any).assumptions && Array.isArray((result as any).assumptions) && (result as any).assumptions.length > 0) {
    const assumptions = (result as any).assumptions[0];
    for (const key in assumptions) {
      result[key] = assumptions[key];
    }
    delete (result as any).assumptions;
  }
  
  // Handle WACC section - flatten first row to top-level
  if ((result as any).wacc && Array.isArray((result as any).wacc) && (result as any).wacc.length > 0) {
    const waccData = (result as any).wacc[0];
    for (const key in waccData) {
      result[key] = waccData[key];
    }
    delete (result as any).wacc;
  }
  
  // Handle terminal value section - flatten first row to top-level
  if ((result as any).terminal_value && Array.isArray((result as any).terminal_value) && (result as any).terminal_value.length > 0) {
    const tvData = (result as any).terminal_value[0];
    for (const key in tvData) {
      result[key] = tvData[key];
    }
    delete (result as any).terminal_value;
  }
  
  // Handle global interest rates section - create nested structure
  if ((result as any).global_interest_rates && Array.isArray((result as any).global_interest_rates) && (result as any).global_interest_rates.length > 0) {
    const globalRates = (result as any).global_interest_rates[0];
    result.globalInterestRates = {
      shortTerm: globalRates.shortTermInterestRate || 5,
      longTerm: globalRates.longTermInterestRate || 6,
      investment: globalRates.investmentInterestRate || 4,
      useForLoans: globalRates.useGlobalRatesForLoans || false
    };
    delete (result as any).global_interest_rates;
  }
  
  // Debug log for final result
  console.debug('[parseBusinessInputExcel] result:', result);
  return result;
}

// Helper function to parse boolean values
function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'on';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
} 