import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';
import { CalculationResult } from '@/services/api';
import { useCalculationResult } from '@/contexts/CalculationResultContext';

const isTotalRow = (label: string) =>
  /total|net income|net cash|ending cash|gross profit|ebit|ebt|assets|liabilities|equity/i.test(label);

const formatYear = (year: string | number, idx: number) => {
  if (typeof year === 'string') {
    return year;
  }
  // For numeric years, format as YYYY
  return year.toString();
};

// Helper function to validate and normalize calculation result
const normalizeCalculationResult = (data: any): CalculationResult | null => {
  if (!data) return null;
  
  console.log('Normalizing calculation result:', data);
  
  // Handle nested data structure (data.data contains the actual calculation result)
  const calculationData = data.data || data;
  
  // For historical data, the structure might be different
  // Check if we have the historical format
  if (calculationData.statements) {
    // Historical format with nested statements
    const statements = calculationData.statements;
    if (!statements.income_statement || !statements.balance_sheet) {
      console.error('Missing required statements in historical calculation result');
      return null;
    }
    
    // Normalize income statement
    const incomeStatement = statements.income_statement;
    if (!incomeStatement.years || !incomeStatement.line_items) {
      console.error('Invalid income statement structure');
      return null;
    }
    
    // Normalize balance sheet
    const balanceSheet = statements.balance_sheet;
    if (!balanceSheet.years || !balanceSheet.line_items) {
      console.error('Invalid balance sheet structure');
      return null;
    }
    
    // Normalize cash flow (optional)
    let cashFlow = statements.cash_flow;
    // Cash flow should be an object with years and line_items, not an array
    
    // Normalize KPIs
    const kpis = calculationData.company_metrics || {
      gross_margin: 0,
      operating_margin: 0,
      net_margin: 0,
      current_ratio: 0,
      debt_to_equity: 0,
      roe: 0,
      roa: 0
    };
    
    // Add projections if missing
    const projections = calculationData.projections || {
      years: [],
      revenue: [],
      net_income: [],
      ebitda: [],
      free_cash_flow: []
    };
    
    return {
      income_statement: incomeStatement,
      balance_sheet: balanceSheet,
      cash_flow: cashFlow || null,
      kpis,
      projections,
      amortization_table: calculationData.amortization_table,
      expense_breakdown: calculationData.expense_breakdown,
      expenses: calculationData.expenses,
      operating_expenses: calculationData.operating_expenses,
      equity: calculationData.equity,
      // IMPORTANT: Preserve dashboard_kpis from backend
      dashboard_kpis: calculationData.dashboard_kpis || {}
    };
  } else {
    // Direct format (statements not nested)
    // Ensure required fields exist
    if (!calculationData.income_statement || !calculationData.balance_sheet) {
      console.error('Missing required statements in calculation result');
      return null;
    }
    
    // Normalize income statement
    const incomeStatement = calculationData.income_statement;
    if (!incomeStatement.years || !incomeStatement.line_items) {
      console.error('Invalid income statement structure');
      return null;
    }
    
    // Normalize balance sheet
    const balanceSheet = calculationData.balance_sheet;
    if (!balanceSheet.years || !balanceSheet.line_items) {
      console.error('Invalid balance sheet structure');
      return null;
    }
    
    // Normalize cash flow (optional)
    let cashFlow = calculationData.cash_flow;
    // Cash flow should be an object with years and line_items, not an array
    
    // Normalize KPIs
    const kpis = calculationData.kpis || calculationData.company_metrics || {
      gross_margin: 0,
      operating_margin: 0,
      net_margin: 0,
      current_ratio: 0,
      debt_to_equity: 0,
      roe: 0,
      roa: 0
    };
    
    // Add projections if missing
    const projections = calculationData.projections || {
      years: [],
      revenue: [],
      net_income: [],
      ebitda: [],
      free_cash_flow: []
    };
    
    return {
      income_statement: incomeStatement,
      balance_sheet: balanceSheet,
      cash_flow: cashFlow || null,
      kpis,
      projections,
      amortization_table: calculationData.amortization_table,
      expense_breakdown: calculationData.expense_breakdown,
      expenses: calculationData.expenses,
      operating_expenses: calculationData.operating_expenses,
      equity: calculationData.equity,
      // IMPORTANT: Preserve dashboard_kpis from backend
      dashboard_kpis: calculationData.dashboard_kpis || {}
    };
  }
};

interface HistoricalStatementsProps {
  calculationResult?: CalculationResult | null;
}

const HistoricalStatements: React.FC<HistoricalStatementsProps> = ({ calculationResult: propCalculationResult }) => {
  const navigate = useNavigate();
  const { historicalCalculationResult } = useCalculationResult();
  const [tab, setTab] = useState('income');
  const [selectedModel, setSelectedModel] = useState<string>('historical');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(propCalculationResult);

  const handleModelSelect = (modelId: string) => setSelectedModel(modelId);

  // Load calculation result from context or localStorage (hybrid approach)
  useEffect(() => {
    if (!calculationResult) {
      // Try context first (primary)
      if (historicalCalculationResult) {
        console.log('Loading from context:', historicalCalculationResult);
        console.log('Context data keys:', Object.keys(historicalCalculationResult));
        console.log('Has dashboard_kpis in context?', 'dashboard_kpis' in historicalCalculationResult);
        console.log('Context dashboard_kpis:', (historicalCalculationResult as any).dashboard_kpis);
        
        const normalized = normalizeCalculationResult(historicalCalculationResult);
        if (normalized) {
          console.log('Successfully normalized calculation result from context');
          console.log('Normalized data keys:', Object.keys(normalized));
          console.log('Has dashboard_kpis in normalized?', 'dashboard_kpis' in normalized);
          console.log('Normalized dashboard_kpis:', normalized.dashboard_kpis);
          setCalculationResult(normalized);
        }
      } else {
        // Fallback to localStorage (backup)
        const stored = localStorage.getItem('historical_calculation_result');
        console.log('Loading from localStorage:', stored);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('Parsed calculation result:', parsed);
            console.log('Parsed result keys:', Object.keys(parsed));
            console.log('Income statement structure:', parsed.income_statement);
            console.log('Balance sheet structure:', parsed.balance_sheet);
            console.log('Cash flow structure:', parsed.cash_flow);
            
            // Normalize the data structure
            const normalized = normalizeCalculationResult(parsed);
            if (normalized) {
              console.log('Successfully normalized calculation result');
              setCalculationResult(normalized);
            } else {
              console.error('Failed to normalize calculation result');
              // Clear invalid data
              localStorage.removeItem('historical_calculation_result');
            }
          } catch (error) {
            console.error('Failed to parse stored calculation result:', error);
            // Clear corrupted data
            localStorage.removeItem('historical_calculation_result');
          }
        } else {
          console.log('No historical calculation result found in localStorage');
        }
      }
    }
  }, [calculationResult, historicalCalculationResult]);

  if (!calculationResult || !calculationResult.income_statement || !calculationResult.balance_sheet) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SidebarProvider>
          <div className="flex-1 flex w-full pt-16">
            <AppSidebar 
              selectedModel={selectedModel}
              onModelSelect={(modelId) => navigate(`/model/${modelId}`)}
            />
            <SidebarInset className="flex-1">
              <div className="container mx-auto p-6">
                <div className="text-center py-16">
                  <h3 className="text-lg font-semibold mb-2">No Historical Calculation Results</h3>
                  <p className="text-muted-foreground">Please run a historical calculation to see the statements.</p>
                  <Button 
                    onClick={() => navigate('/historical')}
                    className="mt-4"
                  >
                    Go to Historical Model
                  </Button>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  const showAmort = !!calculationResult.amortization_table;
  const tabsGridClass = showAmort ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SidebarProvider>
        <div className="flex-1 flex w-full pt-16 bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Sidebar */}
          <div className="hidden md:block w-64 border-r bg-white/90">
            <AppSidebar selectedModel={selectedModel} onModelSelect={handleModelSelect} />
          </div>
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center px-2">
            <div className="w-full max-w-5xl mx-auto mt-10 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Historical Financial Statements</h1>
                <p className="text-slate-500 text-base">Multi-year professional statements based on historical data</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-10 px-6 text-base font-semibold shadow-sm"
                  onClick={() => navigate('/historical')}
                >
                  Back to Form
                </Button>
                <Button
                  variant="outline"
                  className="h-10 px-6 text-base font-semibold shadow-sm"
                  onClick={() => navigate('/historical/dashboard')}
                >
                  Go to Dashboard
                </Button>
                <Button
                  style={{ backgroundColor: '#14b8a6', color: '#fff', border: 'none' }}
                  className="h-10 px-6 text-base font-bold shadow-sm hover:opacity-90"
                  onClick={() => {
                    // Import export logic
                    import('@/components/excel/exportStatementsToExcel').then(({ exportStatementsToExcel }) => {
                      exportStatementsToExcel({
                        modelName: 'Historical Model',
                        incomeStatement: calculationResult.income_statement,
                        balanceSheet: calculationResult.balance_sheet,
                        cashFlow: calculationResult.cash_flow,
                      });
                    });
                  }}
                >
                  Export to Excel
                </Button>
              </div>
            </div>
            <Card className="w-full max-w-5xl shadow-xl border-slate-200">
              <CardHeader className="pb-2">
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className={`grid ${tabsGridClass} w-full mb-2`}>
                    <TabsTrigger value="income">Income Statement</TabsTrigger>
                    <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
                    <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                    {showAmort && <TabsTrigger value="amortization">Amortization</TabsTrigger>}
                  </TabsList>
                  <TabsContent value="income">
                    <StatementTable statement={calculationResult.income_statement} years={calculationResult.income_statement.years} />
                  </TabsContent>
                  <TabsContent value="balance">
                    <StatementTable statement={calculationResult.balance_sheet} years={calculationResult.balance_sheet.years} />
                  </TabsContent>
                                     <TabsContent value="cashflow">
                    {calculationResult.cash_flow && typeof calculationResult.cash_flow === 'object' && 'years' in calculationResult.cash_flow ? (
                      <StatementTable statement={calculationResult.cash_flow} years={(calculationResult.cash_flow as any).years} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Cash flow statement not available
                      </div>
                    )}
                  </TabsContent>
                  {showAmort && (
                    <TabsContent value="amortization">
                      <AmortizationTable table={calculationResult.amortization_table} />
                    </TabsContent>
                  )}
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

const StatementTable: React.FC<{ statement: any; years: string[] | number[] }> = ({ statement, years }) => (
  <div className="overflow-x-auto">
    <Table className="min-w-[600px]">
      <TableHeader className="sticky top-0 bg-white/90 z-10">
        <TableRow>
          <TableHead className="w-56 text-slate-700 text-base font-semibold">Line Item</TableHead>
          {years.map((year: string | number, idx: number) => (
            <TableHead key={`year-${idx}-${year}`} className="text-slate-700 text-base font-semibold text-right">
              {formatYear(year, idx)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {statement.line_items.map((item: any, idx: number) => {
          // Handle different types of rows
          const isHeader = item.is_header;
          const isSubItem = item.is_sub_item;
          const isTotal = item.is_total;
          const isSpacer = item.is_spacer;
          
          // Skip rendering for spacer rows
          if (isSpacer) {
            return (
              <TableRow key={`spacer-${idx}`} className="h-2">
                <TableCell colSpan={years.length + 1} className="p-0"></TableCell>
              </TableRow>
            );
          }
          
          return (
            <TableRow
              key={`${idx}-${item.label}`}
              className={
                `${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} ` +
                (isHeader ? 'bg-slate-100 font-bold text-slate-900 text-sm uppercase tracking-wide' : '') +
                (isSubItem ? ' text-slate-600' : '') +
                (isTotal ? ' font-bold text-slate-900 border-t border-slate-200' : '') +
                (!isHeader && !isSubItem && !isTotal ? ' text-slate-700' : '')
              }
            >
              <TableCell className={`w-56 ${isHeader ? 'font-bold' : ''} ${isSubItem ? 'pl-8' : ''}`}>
                {item.label}
              </TableCell>
              {item.values.map((val: number, i: number) => (
                <TableCell key={`${idx}-${i}`} className="text-right tabular-nums">
                  {isHeader ? '' : (val !== 0 ? `$${val.toLocaleString()}` : '$0')}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

const AmortizationTable: React.FC<{ table: any }> = ({ table }) => {
  if (!table || !table.headers || !table.rows) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No amortization data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[600px]">
        <TableHeader className="sticky top-0 bg-white/90 z-10">
          <TableRow>
            {table.headers.map((header: string, idx: number) => (
              <TableHead key={idx} className="text-slate-700 text-base font-semibold text-right">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row: any[], rowIdx: number) => (
            <TableRow key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
              {row.map((cell: any, cellIdx: number) => (
                <TableCell key={cellIdx} className="text-right tabular-nums">
                  {typeof cell === 'number' ? `$${cell.toLocaleString()}` : cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HistoricalStatements;
