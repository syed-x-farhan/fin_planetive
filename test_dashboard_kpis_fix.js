// Simple test to verify dashboard_kpis preservation
console.log('=== TESTING DASHBOARD KPIS PRESERVATION ===');

// Simulate the data structure that frontend receives
const mockData = {
  success: true,
  data: {
    success: true,
    company_type: 'service',
    income_statement: {
      years: ['2024', '2025'],
      line_items: []
    },
    balance_sheet: {
      years: ['2024', '2025'],
      line_items: []
    },
    cash_flow: null,
    dashboard_kpis: {
      total_revenue: 3117.74,
      total_expenses: 12.76,
      net_income: 2302.63,
      profit_margin: 73.86,
      roe: 142.96,
      client_retention_rate: 85,
      utilization_rate: 75,
      clv: 25000,
      cac: 5000,
      terminal_value: 31177.38
    }
  }
};

// Simulate the normalizeCalculationResult function (fixed version)
function testNormalize(data) {
  if (!data) return null;
  
  console.log('Input data keys:', Object.keys(data));
  
  const calculationData = data.data || data;
  console.log('calculationData keys:', Object.keys(calculationData));
  console.log('calculationData.dashboard_kpis:', calculationData.dashboard_kpis);
  
  // Check if we have required statements
  if (!calculationData.income_statement || !calculationData.balance_sheet) {
    console.error('Missing required statements');
    return null;
  }
  
  // The fixed normalization should preserve dashboard_kpis
  const result = {
    income_statement: calculationData.income_statement,
    balance_sheet: calculationData.balance_sheet,
    cash_flow: calculationData.cash_flow || null,
    kpis: calculationData.kpis || {},
    projections: calculationData.projections || {},
    // IMPORTANT: This is the fix!
    dashboard_kpis: calculationData.dashboard_kpis || data.data?.dashboard_kpis || data.dashboard_kpis || {}
  };
  
  console.log('Result dashboard_kpis:', result.dashboard_kpis);
  console.log('Has dashboard_kpis in result?', 'dashboard_kpis' in result);
  
  return result;
}

// Test the normalization
const normalized = testNormalize(mockData);

if (normalized && normalized.dashboard_kpis && Object.keys(normalized.dashboard_kpis).length > 0) {
  console.log('✅ SUCCESS: dashboard_kpis preserved!');
  console.log('KPIs found:', Object.keys(normalized.dashboard_kpis));
} else {
  console.log('❌ FAILED: dashboard_kpis lost!');
}

// Test the mapping function
function testMapping(results) {
  if (!results) return null;
  
  console.log('\n=== TESTING MAPPING FUNCTION ===');
  const dashboardKpis = results.dashboard_kpis || {};
  console.log('Extracted dashboard_kpis:', dashboardKpis);
  
  const overview = {
    totalRevenue: dashboardKpis.total_revenue || 0,
    totalExpenses: dashboardKpis.total_expenses || 0,
    netIncome: dashboardKpis.net_income || 0,
    profitMargin: dashboardKpis.profit_margin || 0
  };
  
  console.log('Mapped overview:', overview);
  
  return { overview, kpis: dashboardKpis };
}

const mapped = testMapping(normalized);

if (mapped && mapped.overview.totalRevenue > 0) {
  console.log('✅ SUCCESS: Mapping works correctly!');
  console.log('Revenue:', mapped.overview.totalRevenue);
  console.log('Profit Margin:', mapped.overview.profitMargin);
} else {
  console.log('❌ FAILED: Mapping not working!');
}

console.log('\n🎯 EXPECTED RESULT: Dashboard should show real KPIs instead of zeros!');