import * as XLSX from 'xlsx';

/**
 * Generate Excel template for historical financial statements import
 * This template matches the structure of our generated financial statements
 */
export function generateHistoricalFinancialStatementsTemplate(companyType: string = 'service') {
  const workbook = XLSX.utils.book_new();

  // Helper function to add header with instructions
  const addHeaderWithInstructions = (worksheet: XLSX.WorkSheet, title: string, instructions: string[]) => {
    XLSX.utils.sheet_add_aoa(worksheet, [
      [title],
      [],
      ['INSTRUCTIONS:'],
      ...instructions.map(instruction => [instruction]),
      [],
      []
    ], { origin: -1 });
  };

  // Generate sample years (3 historical years + current year)
  const currentYear = new Date().getFullYear();
  const years = [
    (currentYear - 2).toString(),
    (currentYear - 1).toString(),
    currentYear.toString()
  ];

  // 1. Income Statement Template
  const incomeStatementSheet = XLSX.utils.aoa_to_sheet([
    ['FINANCIAL STATEMENTS TEMPLATE - INCOME STATEMENT'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter your historical income statement data for each year'],
    ['• Use the exact line item names provided for accurate mapping'],
    ['• Enter amounts in your base currency (positive for income, negative for expenses)'],
    ['• Leave blank if a line item does not apply to your business'],
    ['• Add additional years as columns if you have more historical data'],
    [],
    ['Line Item', ...years, 'Description'],
    
    // Revenue Section - Matches backend structure exactly
    ['REVENUE', '', '', '', 'Header - leave blank'],
    ['    Service Revenue', 500000, 550000, 600000, 'Total revenue from services'],
    ['TOTAL REVENUE', 500000, 550000, 600000, 'Sum of all revenue'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Cost of Goods Sold - Matches backend structure
    ['COST OF GOODS SOLD (COGS)', '', '', '', 'Header - leave blank'],
    ['    Direct Costs', 200000, 220000, 240000, 'Direct costs for service delivery'],
    ['TOTAL COGS', 200000, 220000, 240000, 'Sum of all direct costs'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Gross Profit - Matches backend structure
    ['GROSS PROFIT', 300000, 330000, 360000, 'Revenue minus COGS'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Operating Expenses - Matches backend structure exactly
    ['OPERATING EXPENSES', '', '', '', 'Header - leave blank'],
    ['    Salaries & Wages', 120000, 130000, 140000, 'Employee salaries and wages'],
    ['    Rent', 36000, 38000, 40000, 'Office rent and facilities'],
    ['    Utilities', 12000, 13000, 14000, 'Electricity, water, internet'],
    ['    Marketing & Advertising', 25000, 28000, 30000, 'Marketing and promotional costs'],
    ['    Insurance', 8000, 9000, 10000, 'Business insurance premiums'],
    ['    Professional Services', 15000, 16000, 18000, 'Legal, accounting, consulting'],
    ['    Software & Technology', 18000, 20000, 22000, 'Software licenses and IT costs'],
    ['    Travel & Entertainment', 10000, 8000, 12000, 'Business travel and client entertainment'],
    ['    Office Supplies', 5000, 5500, 6000, 'Office supplies and equipment'],
    ['    Depreciation & Amortization (Operating)', 15000, 18000, 20000, 'Asset depreciation'],
    ['    Other Operating Expenses', 8000, 9000, 10000, 'Miscellaneous operating costs'],
    ['TOTAL OPERATING EXPENSES', 272000, 294500, 322000, 'Sum of all operating expenses'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Other Operating Income/Expenses - Matches backend structure
    ['OTHER OPERATING INCOME / EXPENSES', '', '', '', 'Header - leave blank'],
    ['    Other Operating Income', 5000, 7000, 8000, 'Other operating income'],
    ['    Other Operating Expenses', -2000, -3000, -4000, 'Other operating expenses (negative)'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // EBITDA Section - Matches backend structure exactly
    ['EBITDA', 31000, 39500, 42000, 'Earnings before interest, taxes, depreciation, amortization'],
    ['    Less: Depreciation & Amortization', -15000, -18000, -20000, 'Depreciation expense (negative)'],
    ['EBIT', 16000, 21500, 22000, 'Earnings before interest and taxes'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Non-Operating Income/Expenses - Matches backend structure exactly
    ['NON-OPERATING INCOME / EXPENSES', '', '', '', 'Header - leave blank'],
    ['    Investment Income', 2000, 3000, 4000, 'Income from investments'],
    ['    Interest Expense', -8000, -10000, -12000, 'Interest paid on loans (negative)'],
    ['EARNINGS BEFORE TAXES (EBT)', 10000, 14500, 14000, 'Income before tax provision'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Tax Calculation - Matches backend structure exactly
    ['TAX CALCULATION', '', '', '', 'Header - leave blank'],
    ['    Tax Provision (with Loss Carryforward)', -2500, -3625, -3500, 'Tax expense (negative)'],
    ['NET INCOME', 7500, 10875, 10500, 'Final net income after taxes'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Cash Flow to Owner - Matches backend structure exactly
    ['CASH FLOW TO OWNER', '', '', '', 'Header - leave blank'],
    ['    Less: Owner Drawings', -50000, -55000, -60000, 'Owner withdrawals (negative)'],
    ['CASH AVAILABLE TO OWNER', -42500, -44125, -49500, 'Cash available after owner drawings']
  ]);

  // 2. Balance Sheet Template
  const balanceSheetSheet = XLSX.utils.aoa_to_sheet([
    ['FINANCIAL STATEMENTS TEMPLATE - BALANCE SHEET'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter your historical balance sheet data for each year'],
    ['• Assets = Liabilities + Equity (must balance)'],
    ['• Enter amounts as of year-end for each year'],
    ['• Use positive amounts for all items'],
    ['• Leave blank if a line item does not apply'],
    [],
    ['Line Item', ...years, 'Description'],
    
    // Assets - Matches backend structure exactly
    ['ASSETS', '', '', '', 'Header - leave blank'],
    ['Current Assets', '', '', '', 'Header - leave blank'],
    ['    Cash and Cash Equivalents', 50000, 75000, 100000, 'Cash in bank accounts'],
    ['    Accounts Receivable', 50000, 55000, 60000, 'Money owed by customers'],
    ['    Prepaid Expenses', 13600, 14725, 16100, 'Prepaid rent, insurance, etc.'],
    ['    Other Current Assets', 0, 0, 0, 'Other short-term assets'],
    ['Total Current Assets', 113600, 144725, 176100, 'Sum of current assets'],
    
    // Empty row
    ['', '', '', '', ''],
    
    ['Non-Current Assets', '', '', '', 'Header - leave blank'],
    ['    Property, Plant & Equipment (Gross)', 15000, 33000, 53000, 'Original cost of fixed assets'],
    ['    Less: Accumulated Depreciation', -15000, -33000, -53000, 'Total depreciation to date (negative)'],
    ['    Net Equipment', 0, 0, 0, 'Net book value of fixed assets'],
    ['    Investments', 0, 0, 0, 'Long-term investments'],
    ['    Intangible Assets (if applicable)', 0, 0, 0, 'Patents, trademarks, goodwill'],
    ['Total Non-Current Assets', 0, 0, 0, 'Sum of non-current assets'],
    
    // Empty row
    ['', '', '', '', ''],
    
    ['TOTAL ASSETS', 113600, 144725, 176100, 'Sum of all assets'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Liabilities - Matches backend structure exactly
    ['LIABILITIES', '', '', '', 'Header - leave blank'],
    ['Current Liabilities', '', '', '', 'Header - leave blank'],
    ['    Accounts Payable', 54400, 58900, 64400, 'Money owed to suppliers'],
    ['    Short-Term Loans (Due < 1 Year)', 0, 0, 0, 'Loans due within one year'],
    ['    Accrued Expenses', 27200, 29450, 32200, 'Accrued wages, utilities, etc.'],
    ['    Taxes Payable', 2500, 3625, 3500, 'Tax obligations'],
    ['Total Current Liabilities', 84100, 91975, 100100, 'Sum of current liabilities'],
    
    // Empty row
    ['', '', '', '', ''],
    
    ['Non-Current Liabilities', '', '', '', 'Header - leave blank'],
    ['    Long-Term Loans', 0, 0, 0, 'Loans due after one year'],
    ['    Lease Liabilities (if any)', 0, 0, 0, 'Lease obligations'],
    ['    Deferred Tax Liabilities', 0, 0, 0, 'Future tax obligations'],
    ['Total Non-Current Liabilities', 0, 0, 0, 'Sum of non-current liabilities'],
    
    // Empty row
    ['', '', '', '', ''],
    
    ['TOTAL LIABILITIES', 84100, 91975, 100100, 'Sum of all liabilities'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Equity - Matches backend structure exactly
    ['EQUITY', '', '', '', 'Header - leave blank'],
    ['    Common Stock / Share Capital', 50000, 50000, 50000, 'Issued share capital'],
    ['    Shareholder Contributions', 0, 0, 0, 'Additional shareholder contributions'],
    ['    Retained Earnings', -42500, -86625, -136125, 'Accumulated profits retained'],
    ['    Less: Owner Drawings', -50000, -55000, -60000, 'Owner withdrawals (negative)'],
    ['    Other Comprehensive Income (OCI)', 0, 0, 0, 'Other equity items'],
    ['TOTAL EQUITY', 29500, 52750, 76000, 'Sum of all equity'],
    
    // Empty row
    ['', '', '', '', ''],
    
    ['TOTAL LIABILITIES & EQUITY', 113600, 144725, 176100, 'Must equal Total Assets']
  ]);

  // 3. Cash Flow Statement Template
  const cashFlowSheet = XLSX.utils.aoa_to_sheet([
    ['FINANCIAL STATEMENTS TEMPLATE - CASH FLOW STATEMENT'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter your historical cash flow data for each year'],
    ['• Use positive amounts for cash inflows, negative for outflows'],
    ['• Operating activities: cash from day-to-day operations'],
    ['• Investing activities: cash from buying/selling assets'],
    ['• Financing activities: cash from loans, equity, dividends'],
    [],
    ['Line Item', ...years, 'Description'],
    
    // Operating Activities - Matches backend structure exactly
    ['OPERATING ACTIVITIES', '', '', '', 'Header - leave blank'],
    ['    Net Income', 7500, 10875, 10500, 'Net income from income statement'],
    ['    Depreciation & Amortization (Add Back)', 15000, 18000, 20000, 'Add back non-cash expenses'],
    ['    Changes in Working Capital', '', '', '', 'Header - leave blank'],
    ['        Accounts Receivable', -50000, -5000, -5000, 'Change in AR (negative if increase)'],
    ['        Accounts Payable', 54400, 4500, 5500, 'Change in AP (positive if increase)'],
    ['        Prepaid Expenses', -13600, -1125, -1375, 'Change in prepaid (negative if increase)'],
    ['    Net Cash from Operations', -1700, 27250, 29625, 'Total operating cash flow'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Investing Activities - Matches backend structure exactly
    ['INVESTING ACTIVITIES', '', '', '', 'Header - leave blank'],
    ['    Capital Expenditures', -15000, -18000, -20000, 'Capital expenditures (negative)'],
    ['    Investment Purchases', 0, 0, 0, 'Investment purchases (negative)'],
    ['    Net Cash from Investing', -15000, -18000, -20000, 'Total investing cash flow'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Financing Activities - Matches backend structure exactly
    ['FINANCING ACTIVITIES', '', '', '', 'Header - leave blank'],
    ['    Owner Investments', 50000, 0, 0, 'Owner capital contributions (positive)'],
    ['    Owner Drawings', -50000, -55000, -60000, 'Owner withdrawals (negative)'],
    ['    Loan Proceeds', 0, 0, 0, 'New borrowings (positive)'],
    ['    Loan Repayments', 0, 0, 0, 'Loan repayments (negative)'],
    ['    Net Cash from Financing', 0, -55000, -60000, 'Total financing cash flow'],
    
    // Empty row
    ['', '', '', '', ''],
    
    // Net Change in Cash - Matches backend structure exactly
    ['NET CHANGE IN CASH', -16700, -45750, -50375, 'Total change in cash position'],
    ['    Beginning Cash', 0, 50000, 75000, 'Starting cash balance'],
    ['    Ending Cash', 50000, 75000, 100000, 'Ending cash balance (must match Balance Sheet)']
  ]);



  // Add all sheets to workbook
  XLSX.utils.book_append_sheet(workbook, incomeStatementSheet, 'Income Statement');
  XLSX.utils.book_append_sheet(workbook, balanceSheetSheet, 'Balance Sheet');
  XLSX.utils.book_append_sheet(workbook, cashFlowSheet, 'Cash Flow Statement');

  return workbook;
}

/**
 * Download the historical financial statements template as an Excel file
 */
export function downloadHistoricalFinancialStatementsTemplate(companyType: string = 'service') {
  const workbook = generateHistoricalFinancialStatementsTemplate(companyType);
  
  // Generate file name with current date and company type
  const date = new Date().toISOString().split('T')[0];
  const fileName = `historical_financial_statements_template_${companyType}_${date}.xlsx`;
  
  // Write to file and trigger download
  XLSX.writeFile(workbook, fileName);
}

/**
 * Parse uploaded historical financial statements template
 */
export function parseHistoricalFinancialStatementsTemplate(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('Starting to parse financial statements template:', file.name);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log('File read successfully, parsing Excel data...');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('Excel workbook loaded, sheet names:', workbook.SheetNames);
        
        const parsedData: any = {
          incomeStatement: {},
          balanceSheet: {},
          cashFlow: {}
        };

        // Parse each sheet
        workbook.SheetNames.forEach(sheetName => {
          console.log('Processing sheet:', sheetName);
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Get the header row (row 10, 0-indexed row 9) which contains years
          const headerRow = jsonData[9]; // Row 10 (0-indexed)
          console.log('Header row:', headerRow);
          
          // Skip header rows (first 10 rows contain instructions)
          const dataRows = jsonData.slice(10).filter((row: any) => 
            row.length > 0 && row.some((cell: any) => cell !== '')
          );

          switch (sheetName.toLowerCase()) {
            case 'income statement':
              console.log('Parsing income statement, data rows:', dataRows.length);
              parsedData.incomeStatement = parseFinancialStatementData(dataRows, headerRow);
              console.log('Parsed income statement:', parsedData.incomeStatement);
              break;
            case 'balance sheet':
              console.log('Parsing balance sheet, data rows:', dataRows.length);
              parsedData.balanceSheet = parseFinancialStatementData(dataRows, headerRow);
              console.log('Parsed balance sheet:', parsedData.balanceSheet);
              break;
            case 'cash flow statement':
              console.log('Parsing cash flow statement, data rows:', dataRows.length);
              parsedData.cashFlow = parseFinancialStatementData(dataRows, headerRow);
              console.log('Parsed cash flow:', parsedData.cashFlow);
              break;
            default:
              console.log('Unknown sheet name:', sheetName);
          }
        });

        console.log('Final parsed data:', parsedData);
        resolve(parsedData);
      } catch (error) {
        console.error('Error parsing financial statements file:', error);
        reject(new Error('Failed to parse financial statements file: ' + error));
      }
    };

    reader.onerror = () => {
      console.error('Failed to read file');
      reject(new Error('Failed to read file'));
    };
    
    console.log('Starting to read file as ArrayBuffer...');
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Helper function to parse financial statement data rows
 */
function parseFinancialStatementData(dataRows: any[], headerRow: any[]): any {
  const result: any = {
    lineItems: [],
    years: []
  };

  if (dataRows.length === 0) return result;

  // Extract years from the provided header row
  console.log('Extracting years from header row:', headerRow);
  if (headerRow && headerRow.length > 1) {
    // Skip first column (line item names) and last column (description)
    for (let i = 1; i < headerRow.length - 1; i++) {
      const yearValue = headerRow[i];
      console.log(`Checking header[${i}]:`, yearValue, 'isNumber:', !isNaN(parseInt(yearValue)));
      if (yearValue && !isNaN(parseInt(yearValue))) {
        result.years.push(yearValue.toString());
      }
    }
  }
  
  console.log('Extracted years:', result.years);

  // Parse each data row (no need to skip first row since we're not using it for years anymore)
  dataRows.forEach((row: any, index: number) => {
    
    if (row[0] && row[0].trim() !== '') {
      const lineItem: any = {
        label: row[0],
        values: [],
        description: row[row.length - 1] || ''
      };

      // Extract values for each year
      for (let i = 1; i < row.length - 1; i++) {
        const value = parseFloat(row[i]) || 0;
        lineItem.values.push(value);
      }

      // Determine line item type based on formatting
      if (row[0].toUpperCase() === row[0] && !row[0].includes('TOTAL')) {
        lineItem.isHeader = true;
      } else if (row[0].includes('TOTAL') || row[0].includes('NET')) {
        lineItem.isTotal = true;
      }

      result.lineItems.push(lineItem);
    }
  });

  return result;
}