import * as XLSX from 'xlsx';

/**
 * Generate Excel template for historical business data import
 * Uses hybrid approach: base sheets + conditional company-specific sheets
 */
export function generateHistoricalBusinessDataTemplate(companyType: string = 'service') {
  const workbook = XLSX.utils.book_new();

  // Helper function to add sample data row
  const addSampleRow = (worksheet: XLSX.WorkSheet, data: any[]) => {
    XLSX.utils.sheet_add_aoa(worksheet, [data], { origin: -1 });
  };

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

  // ===== BASE SHEETS (Common to all company types) =====

  // 1. Basic Information Sheet
  const basicInfoSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - BASIC INFORMATION'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter basic business information and assumptions'],
    ['• These are fundamental parameters for your business model'],
    ['• All fields are required for accurate calculations'],
    [],
    ['Field', 'Value', 'Unit', 'Description'],
    ['Years in Business', 3, 'Years', 'How long the business has been operating'],
    ['Forecast Years', 5, 'Years', 'Number of years to forecast'],
    ['Tax Rate', 25, 'Percentage', 'Corporate tax rate'],
    ['Self Funding', 50000, 'Currency', 'Amount you can invest from own resources'],
    ['Fiscal Year Start', 'January', 'Month', 'Start of fiscal year'],
    ['Revenue Input Type', 'Annual', 'Type', 'Annual or Monthly revenue input'],
    ['Expense Input Type', 'Annual', 'Type', 'Annual or Monthly expense input']
  ]);

  // 2. Services Sheet
  const servicesSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - SERVICES'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter each service your business provides'],
    ['• Include revenue and cost for each service'],
    ['• Add multiple rows for different years if you have historical data'],
    ['• Leave blank if not applicable'],
    ['• Growth rates are now handled in the Growth Assumptions section'],
    [],
    ['Service Name', 'Revenue', 'Cost', 'Year'],
    ['Consulting Services', 100000, 60000, 2023],
    ['Training Programs', 50000, 20000, 2023],
    ['Software Development', 150000, 80000, 2023],
    ['Marketing Services', 75000, 45000, 2023],
    ['', '', '', 2022],
    ['', '', '', 2021]
  ]);

  // 3. Expenses Sheet
  const expensesSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - EXPENSES'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter all business expenses by category'],
    ['• Include both fixed and variable expenses'],
    ['• Add multiple rows for different years if you have historical data'],
    ['• Use consistent category names'],
    ['• Growth rates are now handled in the Growth Assumptions section'],
    [],
    ['Expense Category', 'Amount', 'Year', 'Type'],
    ['Salaries & Wages', 200000, 2023, 'Fixed'],
    ['Rent', 36000, 2023, 'Fixed'],
    ['Utilities', 12000, 2023, 'Variable'],
    ['Marketing', 25000, 2023, 'Variable'],
    ['Insurance', 8000, 2023, 'Fixed'],
    ['Software Licenses', 15000, 2023, 'Variable'],
    ['Travel', 10000, 2023, 'Variable'],
    ['Office Supplies', 5000, 2023, 'Variable'],
    ['', '', 2022, ''],
    ['', '', 2021, '']
  ]);

  // 4. Equipment Sheet
  const equipmentSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - EQUIPMENT'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter all equipment and assets purchased'],
    ['• Include purchase cost and depreciation method'],
    ['• Add multiple rows for different years if you have historical data'],
    ['• Depreciation Methods: Straight Line, Double Declining, Sum of Years, Units of Production'],
    [],
    ['Equipment Name', 'Purchase Cost', 'Purchase Year', 'Depreciation Method', 'Useful Life (Years)'],
    ['Laptops', 15000, 2023, 'Straight Line', 3],
    ['Office Furniture', 8000, 2023, 'Straight Line', 7],
    ['Software Licenses', 5000, 2023, 'Straight Line', 1],
    ['Vehicles', 25000, 2023, 'Double Declining', 5],
    ['', '', 2022, '', ''],
    ['', '', 2021, '', '']
  ]);

  // 5. Loans Sheet
  const loansSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - LOANS'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter all loans and financing arrangements'],
    ['• Include loan type, amount, interest rate, and term'],
    ['• Add multiple rows for different loans'],
    ['• Loan Types: Working Capital, SME Loan, Trade Finance, Letter of Guarantee, Startup Loan'],
    ['• Sub Types: Only required for Trade Finance (LC, Bills Discounting) and Startup Loan (Equity, Royalty, Fixed)'],
    ['• For Startup Loan with Royalty Sub Type: specify Royalty Type (Percentage or Fixed)'],
    ['• For Trade Finance: specify Trade Document Type (LC, Bills Discounting, etc.)'],
    ['• Leave Sub Type blank for Working Capital, SME Loan, and Letter of Guarantee'],
    [],
    ['Loan Name', 'Loan Type', 'Sub Type', 'Amount', 'Interest Rate (%)', 'Term (Years)', 'Start Year', 'Royalty Type', 'Royalty %/Amount', 'Trade Document Type', 'Tenor'],
    ['Working Capital Loan', 'Working Capital', '', 50000, 8.5, 3, 2023, '', '', '', ''],
    ['Equipment Financing', 'SME Loan', '', 30000, 7.2, 5, 2023, '', '', '', ''],
    ['Trade Finance LC', 'Trade Finance', 'Letter of Credit (LC)', 25000, 6.8, 1, 2023, '', '', 'LC', '90 days'],
    ['Startup Equity Loan', 'Startup Loan', 'Equity', 100000, 5.5, 5, 2023, '', '', '', ''],
    ['Startup Royalty Loan', 'Startup Loan', 'Royalty', 75000, 4.2, 4, 2023, 'Percentage', '5', '', ''],
    ['Startup Fixed Royalty', 'Startup Loan', 'Royalty', 60000, 3.8, 3, 2023, 'Fixed', '5000', '', ''],
    ['', '', '', '', '', '', 2022, '', '', '', ''],
    ['', '', '', '', '', '', 2021, '', '', '', '']
  ]);

  // 6. Other Income/Costs Sheet
  const otherIncomeCostsSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - OTHER INCOME/COSTS'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter any other income or costs not covered above'],
    ['• Include one-time items, grants, subsidies, etc.'],
    ['• Add multiple rows for different years if you have historical data'],
    ['• Use positive amounts for income, negative for costs'],
    [],
    ['Description', 'Amount', 'Type', 'Year'],
    ['Government Grant', 10000, 'Income', 2023],
    ['Interest Income', 2000, 'Income', 2023],
    ['Legal Fees', -5000, 'Cost', 2023],
    ['Consulting Fees', -8000, 'Cost', 2023],
    ['', '', '', 2022],
    ['', '', '', 2021]
  ]);

  // 7. Investments Sheet
  const investmentsSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - INVESTMENTS'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter all investments made in the business'],
    ['• Include equity investments, loans to business, etc.'],
    ['• Add multiple rows for different years if you have historical data'],
    ['• Investment Types: Equity, Loan, Asset Purchase, Other'],
    [],
    ['Investment Name', 'Investment Type', 'Amount', 'Year', 'Investor'],
    ['Founder Investment', 'Equity', 50000, 2023, 'Founder'],
    ['Angel Investment', 'Equity', 100000, 2023, 'Angel Investor'],
    ['Equipment Investment', 'Asset Purchase', 25000, 2023, 'Business'],
    ['Working Capital', 'Loan', 30000, 2023, 'Founder'],
    ['', '', '', 2022, ''],
    ['', '', '', 2021, '']
  ]);

  // 8. Shareholders Sheet
  const shareholdersSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - SHAREHOLDERS'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter all shareholders and their ownership details'],
    ['• Include shares owned and ownership percentage'],
    ['• Add multiple rows for different years if ownership changed'],
    ['• Ownership percentage should total 100%'],
    [],
    ['Shareholder Name', 'Shares Owned', 'Ownership %', 'Year', 'Share Class'],
    ['Founder', 1000, 60, 2023, 'Common'],
    ['Angel Investor', 500, 30, 2023, 'Preferred'],
    ['Employee Stock', 100, 5, 2023, 'Common'],
    ['Advisor', 50, 2.5, 2023, 'Common'],
    ['', '', '', 2022, ''],
    ['', '', '', 2021, '']
  ]);

  // 9. Growth Assumptions Sheet
  const growthAssumptionsSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - GROWTH ASSUMPTIONS'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter growth rate assumptions for your business'],
    ['• These rates will be used for future projections'],
    ['• Rates should be based on historical performance or industry benchmarks'],
    ['• All rates should be entered as percentages (e.g., 15 for 15%)'],
    [],
    ['Growth Type', 'Rate (%)', 'Description'],
    ['Revenue Growth Rate', 15, 'Expected annual revenue growth'],
    ['Expense Growth Rate', 10, 'Expected annual expense growth'],
    ['Customer Growth Rate', 20, 'Expected annual customer growth']
  ]);

  // 10. Credit Sales Sheet
  const creditSalesSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - CREDIT SALES'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter credit sales and payment terms information'],
    ['• This affects cash flow calculations'],
    ['• Collection days should reflect your actual payment terms'],
    ['• Accounts payable days should reflect your payment terms to suppliers'],
    [],
    ['Field', 'Value', 'Unit', 'Description'],
    ['Credit Sales Percentage', 30, 'Percentage', 'Percentage of sales on credit'],
    ['Collection Days', 45, 'Days', 'Average days to collect payment'],
    ['Accounts Payable Days', 30, 'Days', 'Average days to pay suppliers']
  ]);

  // 11. Owner Drawings Sheet
  const ownerDrawingsSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - OWNER DRAWINGS'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter owner drawings information'],
    ['• This affects cash flow and profitability calculations'],
    ['• Frequency should be Monthly or Annual'],
    ['• Amount should be the total annual amount'],
    [],
    ['Field', 'Value', 'Unit', 'Description'],
    ['Owner Drawings Amount', 50000, 'Currency', 'Annual owner drawings'],
    ['Owner Drawings Frequency', 'Annual', 'Frequency', 'Monthly or Annual']
  ]);

  // 12. Terminal Value Sheet
  const terminalValueSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - TERMINAL VALUE'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter terminal value calculation parameters'],
    ['• These are used for DCF valuation'],
    ['• Terminal value method options: Perpetuity, Multiple, Custom'],
    ['• Terminal value metric options: EBITDA, Revenue, FCF'],
    [],
    ['Field', 'Value', 'Unit', 'Description'],
    ['Discount Rate', 12, 'Percentage', 'Discount rate for DCF'],
    ['Terminal Growth', 3, 'Percentage', 'Long-term growth rate'],
    ['Terminal Value Method', 'Perpetuity', 'Method', 'Perpetuity, Multiple, or Custom'],
    ['Terminal Value Metric', 'EBITDA', 'Metric', 'EBITDA, Revenue, or FCF'],
    ['Terminal Value Multiple', 8, 'Multiple', 'EBITDA multiple if using multiple method'],
    ['Terminal Value Custom', '', 'Currency', 'Custom terminal value if using custom method'],
    ['Terminal Value Year', 5, 'Year', 'Year for terminal value calculation']
  ]);

  // 13. WACC Sheet
  const waccSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - WACC'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter WACC (Weighted Average Cost of Capital) parameters'],
    ['• These are used for discount rate calculations'],
    ['• Use WACC Build Up: true for component-based calculation, false for direct input'],
    ['• Use Cost of Equity Only: true to use only cost of equity'],
    [],
    ['Field', 'Value', 'Unit', 'Description'],
    ['Use WACC Build Up', 'true', 'Boolean', 'Use component-based WACC calculation'],
    ['Use Cost of Equity Only', 'false', 'Boolean', 'Use only cost of equity'],
    ['Risk-Free Rate', 3.5, 'Percentage', 'Government bond rate'],
    ['Beta', 1.2, 'Ratio', 'Stock beta relative to market'],
    ['Market Premium', 6, 'Percentage', 'Market risk premium'],
    ['Cost of Debt', 8, 'Percentage', 'Pre-tax cost of debt'],
    ['Tax Rate for WACC', 25, 'Percentage', 'Corporate tax rate for WACC'],
    ['Equity Percentage', 70, 'Percentage', 'Percentage of equity in capital structure'],
    ['Debt Percentage', 30, 'Percentage', 'Percentage of debt in capital structure']
  ]);

  // 14. Global Interest Rates Sheet
  const globalInterestRatesSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - GLOBAL INTEREST RATES'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter global interest rate parameters'],
    ['• These rates are used for various calculations'],
    ['• Short term rate: typically 1-3 year government bond rate'],
    ['• Long term rate: typically 10-year government bond rate'],
    ['• Investment rate: rate for investment opportunities'],
    ['• Use for Loans: whether to apply these rates to loan calculations'],
    [],
    ['Field', 'Value', 'Unit', 'Description'],
    ['Short Term Rate', 4, 'Percentage', 'Short-term interest rate'],
    ['Long Term Rate', 5.5, 'Percentage', 'Long-term interest rate'],
    ['Investment Rate', 7, 'Percentage', 'Investment opportunity rate'],
    ['Use for Loans', 'true', 'Boolean', 'Apply rates to loan calculations']
  ]);

  // ===== CONDITIONAL SHEETS (Company-specific) =====

  // Service-specific sheets
  const serviceBusinessModelSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - SERVICE BUSINESS MODEL'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter service business model parameters'],
    ['• These are specific to service-based businesses'],
    ['• Service Delivery Model: Hourly, Project, Retainer, Subscription'],
    ['• Pricing Strategy: Fixed, Variable, Tiered'],
    ['• Client Retention Rate: percentage of clients retained annually'],
    [],
    ['Field', 'Value', 'Unit', 'Description'],
    ['Service Delivery Model', 'Project', 'Model', 'Hourly, Project, Retainer, or Subscription'],
    ['Pricing Strategy', 'Fixed', 'Strategy', 'Fixed, Variable, or Tiered'],
    ['Client Retention Rate', 85, 'Percentage', 'Annual client retention rate']
  ]);

  const serviceMetricsSheet = XLSX.utils.aoa_to_sheet([
    ['BUSINESS DATA TEMPLATE - SERVICE METRICS'],
    [],
    ['INSTRUCTIONS:'],
    ['• Enter service-specific operational metrics'],
    ['• These are additional metrics for service businesses'],
    ['• Add multiple rows for different years if you have historical data'],
    ['• All percentages should be entered as decimals (e.g., 0.75 for 75%)'],
    [],
    ['Metric', 'Value', 'Year', 'Unit'],
    ['Utilization Rate', 0.75, 2023, 'Percentage'],
    ['Team Size', 8, 2023, 'People'],
    ['Team Growth Rate', 0.25, 2023, 'Percentage'],
    ['Average Project Duration', 3, 2023, 'Months'],
    ['Client Acquisition Cost', 2000, 2023, 'Currency'],
    ['Customer Lifetime Value', 15000, 2023, 'Currency'],
    ['Recurring Revenue %', 0.60, 2023, 'Percentage'],
    ['Churn Rate', 0.10, 2023, 'Percentage'],
    ['Expansion Revenue %', 0.20, 2023, 'Percentage'],
    ['Seasonality Factor', 0.15, 2023, 'Percentage'],
    ['', '', 2022, ''],
    ['', '', 2021, '']
  ]);

  // Future company-specific sheets (ready for implementation)
  // const retailMetricsSheet = XLSX.utils.aoa_to_sheet([...]);
  // const saasMetricsSheet = XLSX.utils.aoa_to_sheet([...]);
  // const energyMetricsSheet = XLSX.utils.aoa_to_sheet([...]);
  // const realEstateMetricsSheet = XLSX.utils.aoa_to_sheet([...]);

  // ===== ADD SHEETS TO WORKBOOK =====

  // Add base sheets (common to all company types)
  XLSX.utils.book_append_sheet(workbook, basicInfoSheet, 'Basic Information');
  XLSX.utils.book_append_sheet(workbook, servicesSheet, 'Services');
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');
  XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment');
  XLSX.utils.book_append_sheet(workbook, loansSheet, 'Loans');
  XLSX.utils.book_append_sheet(workbook, otherIncomeCostsSheet, 'Other Income Costs');
  XLSX.utils.book_append_sheet(workbook, investmentsSheet, 'Investments');
  XLSX.utils.book_append_sheet(workbook, shareholdersSheet, 'Shareholders');
  XLSX.utils.book_append_sheet(workbook, growthAssumptionsSheet, 'Growth Assumptions');
  XLSX.utils.book_append_sheet(workbook, creditSalesSheet, 'Credit Sales');
      XLSX.utils.book_append_sheet(workbook, ownerDrawingsSheet, 'Owner Drawings');
  XLSX.utils.book_append_sheet(workbook, terminalValueSheet, 'Terminal Value');
  XLSX.utils.book_append_sheet(workbook, waccSheet, 'WACC');
  XLSX.utils.book_append_sheet(workbook, globalInterestRatesSheet, 'Global Interest Rates');

  // Add conditional sheets based on company type
  switch (companyType.toLowerCase()) {
    case 'service':
      XLSX.utils.book_append_sheet(workbook, serviceBusinessModelSheet, 'Service Business Model');
      XLSX.utils.book_append_sheet(workbook, serviceMetricsSheet, 'Service Metrics');
      break;
    
    // Future company types (ready for implementation)
    // case 'retail':
    //   XLSX.utils.book_append_sheet(workbook, retailMetricsSheet, 'Retail Metrics');
    //   break;
    // case 'saas':
    //   XLSX.utils.book_append_sheet(workbook, saasMetricsSheet, 'SaaS Metrics');
    //   break;
    // case 'energy':
    //   XLSX.utils.book_append_sheet(workbook, energyMetricsSheet, 'Energy Metrics');
    //   break;
    // case 'realestate':
    //   XLSX.utils.book_append_sheet(workbook, realEstateMetricsSheet, 'Real Estate Metrics');
    //   break;
    
    default:
      // For unknown company types, still include service sheets as default
      XLSX.utils.book_append_sheet(workbook, serviceBusinessModelSheet, 'Service Business Model');
      XLSX.utils.book_append_sheet(workbook, serviceMetricsSheet, 'Service Metrics');
      break;
  }

  return workbook;
}

/**
 * Download the historical business data template as an Excel file
 */
export function downloadHistoricalBusinessDataTemplate(companyType: string = 'service') {
  const workbook = generateHistoricalBusinessDataTemplate(companyType);
  
  // Generate file name with current date and company type
  const date = new Date().toISOString().split('T')[0];
  const fileName = `historical_business_data_template_${companyType}_${date}.xlsx`;
  
  // Write to file and trigger download
  XLSX.writeFile(workbook, fileName);
}

/**
 * Parse uploaded historical business data template
 */
export function parseHistoricalBusinessDataTemplate(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const parsedData: any = {
          services: [],
          expenses: [],
          equipment: [],
          loans: [],
          otherIncomeCosts: [],
          investments: [],
          shareholders: [],
          serviceMetrics: []
        };

        // Parse each sheet
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Skip header rows (first 8-10 rows contain instructions)
          const dataRows = jsonData.slice(10).filter((row: any) => 
            row.length > 0 && row.some((cell: any) => cell !== '')
          );

          switch (sheetName.toLowerCase()) {
            case 'services':
              parsedData.services = dataRows.map((row: any) => ({
                serviceName: row[0] || '',
                revenue: parseFloat(row[1]) || 0,
                cost: parseFloat(row[2]) || 0,
                year: parseInt(row[3]) || new Date().getFullYear()
              }));
              break;
            case 'expenses':
              parsedData.expenses = dataRows.map((row: any) => ({
                category: row[0] || '',
                amount: parseFloat(row[1]) || 0,
                year: parseInt(row[2]) || new Date().getFullYear(),
                type: row[3] || 'Variable'
              }));
              break;
            case 'equipment':
              parsedData.equipment = dataRows.map((row: any) => ({
                name: row[0] || '',
                purchaseCost: parseFloat(row[1]) || 0,
                purchaseYear: parseInt(row[2]) || new Date().getFullYear(),
                depreciationMethod: row[3] || 'Straight Line',
                usefulLife: parseInt(row[4]) || 5
              }));
              break;
                         case 'loans':
               parsedData.loans = dataRows.map((row: any) => ({
                 name: row[0] || '',
                 loanType: row[1] || 'Working Capital',
                 subType: row[2] || '',
                 amount: parseFloat(row[3]) || 0,
                 interestRate: parseFloat(row[4]) || 0,
                 term: parseInt(row[5]) || 1,
                 startYear: parseInt(row[6]) || new Date().getFullYear(),
                 royaltyType: row[7] || '',
                 royaltyPercentage: row[8] || '',
                 fixedRoyaltyAmount: row[8] || '',
                 tradeDocumentType: row[9] || '',
                 tenor: row[10] || ''
               }));
               break;
            case 'other income costs':
              parsedData.otherIncomeCosts = dataRows.map((row: any) => ({
                description: row[0] || '',
                amount: parseFloat(row[1]) || 0,
                type: row[2] || 'Cost',
                year: parseInt(row[3]) || new Date().getFullYear()
              }));
              break;
            case 'investments':
              parsedData.investments = dataRows.map((row: any) => ({
                name: row[0] || '',
                investmentType: row[1] || 'Equity',
                amount: parseFloat(row[2]) || 0,
                year: parseInt(row[3]) || new Date().getFullYear(),
                investor: row[4] || ''
              }));
              break;
            case 'shareholders':
              parsedData.shareholders = dataRows.map((row: any) => ({
                name: row[0] || '',
                sharesOwned: parseInt(row[1]) || 0,
                ownershipPercent: parseFloat(row[2]) || 0,
                year: parseInt(row[3]) || new Date().getFullYear(),
                shareClass: row[4] || 'Common'
              }));
              break;
            case 'service metrics':
              parsedData.serviceMetrics = dataRows.map((row: any) => ({
                metric: row[0] || '',
                value: parseFloat(row[1]) || 0,
                year: parseInt(row[2]) || new Date().getFullYear(),
                unit: row[3] || ''
              }));
              break;
          }
        });

        resolve(parsedData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
} 