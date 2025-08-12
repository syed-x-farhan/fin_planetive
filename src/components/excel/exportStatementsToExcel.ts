import * as XLSX from 'xlsx';

/**
 * Export financial statements to a professionally formatted Excel file.
 * @param params - Object containing all required statement data and meta info
 */
export function exportStatementsToExcel({
  companyName,
  modelName,
  exportDate = new Date(),
  incomeStatement,
  balanceSheet,
  cashFlow,
}: {
  companyName?: string;
  modelName?: string;
  exportDate?: Date;
  incomeStatement: any;
  balanceSheet: any;
  cashFlow: any;
}) {
  // Helper: format date
  const formatDate = (date: Date) => date.toLocaleDateString();

  // 1. Prepare Income Statement sheet
  const incomeSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
    [companyName || 'Company', modelName || 'Financial Model'],
    ['Income Statement', '', '', '', formatDate(exportDate)],
    [],
    // Header row
    ['Line Item', ...(incomeStatement?.years || [])],
    // Data rows
    ...(incomeStatement?.line_items || []).map((item: any) => [item.label, ...(item.values || [])]),
  ]);

  // 2. Prepare Balance Sheet sheet
  const balanceSheetSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
    [companyName || 'Company', modelName || 'Financial Model'],
    ['Balance Sheet', '', '', '', formatDate(exportDate)],
    [],
    ['Line Item', ...(balanceSheet?.years || [])],
    ...(balanceSheet?.line_items || []).map((item: any) => [item.label, ...(item.values || [])]),
  ]);

  // 3. Prepare Cash Flow sheet
  let cashFlowSheet: XLSX.WorkSheet;
  
  if (cashFlow?.line_items && cashFlow?.years) {
    // New format (like income statement and balance sheet)
    cashFlowSheet = XLSX.utils.aoa_to_sheet([
      [companyName || 'Company', modelName || 'Financial Model'],
      ['Cash Flow Statement', '', '', '', formatDate(exportDate)],
      [],
      ['Line Item', ...(cashFlow.years || [])],
      ...(cashFlow.line_items || []).map((item: any) => [item.label, ...(item.values || [])]),
    ]);
  } else if (Array.isArray(cashFlow) && cashFlow.length > 0) {
    // Old format (array of periods)
    const years = cashFlow.map((period: any) => period.year);
    
    // Prepare cash flow data
    const cashFlowData = [];
    
    // Opening Cash Balance
    const openingCashRow = ['Opening Cash Balance'];
    cashFlow.forEach((period: any, idx: number) => {
      const val = idx === 0 ? 100000 : cashFlow[idx - 1]?.ending_cash ?? 0;
      openingCashRow.push(val);
    });
    cashFlowData.push(openingCashRow);
    
    // Operating Activities Section
    cashFlowData.push(['Operating Activities']);
    if (cashFlow[0]?.operating_activities) {
      cashFlow[0].operating_activities.forEach((item: any, idx: number) => {
        const row = [item[0]];
        cashFlow.forEach((period: any) => {
          const value = period.operating_activities?.[idx]?.[1] ?? 0;
          row.push(value);
        });
        cashFlowData.push(row);
      });
    }
    
    // Net Cash from Operating Activities
    const netOperatingRow = ['Net Cash from Operating Activities'];
    cashFlow.forEach((period: any) => {
      netOperatingRow.push(period.net_cash_from_operating_activities ?? 0);
    });
    cashFlowData.push(netOperatingRow);
    
    // Investing Activities Section
    cashFlowData.push(['Investing Activities']);
    if (cashFlow[0]?.investing_activities) {
      cashFlow[0].investing_activities.forEach((item: any, idx: number) => {
        const row = [item[0]];
        cashFlow.forEach((period: any) => {
          const value = period.investing_activities?.[idx]?.[1] ?? 0;
          row.push(value);
        });
        cashFlowData.push(row);
      });
    }
    
    // Net Cash from Investing Activities
    const netInvestingRow = ['Net Cash from Investing Activities'];
    cashFlow.forEach((period: any) => {
      netInvestingRow.push(period.net_cash_from_investing_activities ?? 0);
    });
    cashFlowData.push(netInvestingRow);
    
    // Financing Activities Section
    cashFlowData.push(['Financing Activities']);
    if (cashFlow[0]?.financing_activities) {
      cashFlow[0].financing_activities.forEach((item: any, idx: number) => {
        const row = [item[0]];
        cashFlow.forEach((period: any) => {
          const value = period.financing_activities?.[idx]?.[1] ?? 0;
          row.push(value);
        });
        cashFlowData.push(row);
      });
    }
    
    // Net Cash from Financing Activities
    const netFinancingRow = ['Net Cash from Financing Activities'];
    cashFlow.forEach((period: any) => {
      netFinancingRow.push(period.net_cash_from_financing_activities ?? 0);
    });
    cashFlowData.push(netFinancingRow);
    
    // Net Change in Cash
    const netChangeRow = ['Net Change in Cash'];
    cashFlow.forEach((period: any) => {
      netChangeRow.push(period.net_change_in_cash ?? 0);
    });
    cashFlowData.push(netChangeRow);
    
    // Closing Cash Balance
    const closingCashRow = ['Closing Cash Balance'];
    cashFlow.forEach((period: any) => {
      closingCashRow.push(period.ending_cash ?? 0);
    });
    cashFlowData.push(closingCashRow);
    
    cashFlowSheet = XLSX.utils.aoa_to_sheet([
      [companyName || 'Company', modelName || 'Financial Model'],
      ['Cash Flow Statement', '', '', '', formatDate(exportDate)],
      [],
      ['Line Item', ...years],
      ...cashFlowData,
    ]);
  } else {
    // Fallback for unexpected format
    cashFlowSheet = XLSX.utils.aoa_to_sheet([
      [companyName || 'Company', modelName || 'Financial Model'],
      ['Cash Flow Statement', '', '', '', formatDate(exportDate)],
      [],
      ['Line Item', 'No data available'],
      ['Cash flow data is in an unexpected format', ''],
    ]);
  }

  // 4. Create workbook and add all sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, incomeSheet, 'Income Statement');
  XLSX.utils.book_append_sheet(wb, balanceSheetSheet, 'Balance Sheet');
  XLSX.utils.book_append_sheet(wb, cashFlowSheet, 'Cash Flow');

  // 5. Export workbook to file
  const fileName = `${companyName || 'Company'}_${modelName || 'Statements'}_${formatDate(exportDate)}.xlsx`.replace(/\s+/g, '_');
  XLSX.writeFile(wb, fileName);
}
