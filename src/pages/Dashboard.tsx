import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  CreditCard,
  Banknote,
  Users,
  Calendar,
  BarChart2,
  Percent,
  Layers,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MODEL_CONFIGS, ModelId } from '@/config/models';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, ReferenceLine, ReferenceArea, AreaChart, Area, LabelList, YAxis as RechartsYAxis } from 'recharts';
import { mapPeriodsToSections, ChartSection } from '@/utils/chartSectionUtils';
import { useCalculationResult } from '@/contexts/CalculationResultContext';
import { CalculationResult } from '@/services/api';
import { exportDashboardTabsToPDF } from '@/services/pdfExport';
import SensitivityHeatmap from '@/components/SensitivityHeatmap';
import TornadoChart from '@/components/TornadoChart';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

// Define color palette at the top of the file (after imports):
const PRIMARY_COLOR = 'hsl(170, 70%, 45%)'; // Teal/Green
const PRIMARY_COLOR_LIGHT = 'hsl(170, 70%, 65%)';
const SECONDARY_COLOR = 'hsl(20, 90%, 60%)'; // Orange
const EXPENSE_COLOR = 'hsl(0, 80%, 60%)'; // Red
const PIE_COLORS = [
  'hsl(170, 70%, 45%)',
  'hsl(170, 70%, 55%)',
  'hsl(170, 70%, 65%)',
  'hsl(170, 70%, 35%)',
  'hsl(170, 70%, 25%)',
  'hsl(170, 70%, 75%)',
];
const PIE_EXPENSE_COLORS = [
  'hsl(0, 80%, 60%)',
  'hsl(20, 90%, 60%)',
  'hsl(10, 80%, 70%)',
  'hsl(0, 80%, 50%)',
  'hsl(0, 80%, 40%)',
  'hsl(0, 80%, 30%)',
];

// Map real calculation results to dashboard data structure
function mapCalculationResultsToDashboardData(results: CalculationResult | any) {
  if (!results) return null;

  // Extract income statement values for overview
  let totalRevenue = 0, totalExpenses = 0, netIncome = 0;
  const incomeStatement = results.income_statement;
  // If backend format: { years: [], line_items: [] }
  if (incomeStatement && Array.isArray(incomeStatement.line_items)) {
    const yearIdx = 0; // first year
    const findValue = (label: string) => {
      const item = incomeStatement.line_items.find((li: any) => li.label.toLowerCase() === label.toLowerCase());
      return item && Array.isArray(item.values) ? item.values[yearIdx] : 0;
    };
    totalRevenue = findValue('Revenue');
    totalExpenses = findValue('Operating Expenses');
    netIncome = findValue('Net Income');
  } else {
    // fallback to old format
    const income = Array.isArray(incomeStatement) ? incomeStatement[0] : incomeStatement || {};
    totalRevenue = income.revenue ?? 0;
    totalExpenses = income.operating_expenses ?? 0;
    netIncome = income.net_income ?? 0;
  }
  const balance = results.balance_sheet || {};
  const cashflow = results.cash_flow || {};
  const equity = results.equity || {};

  // KPIs
  const kpis = results.kpis || {};

  // Overview
  const overview = {
    totalRevenue,
    totalExpenses,
    netIncome,
    monthlyGrowth: 0 // You can calculate this if you have previous month data
  };




  // Revenue (prefer backend breakdown, fallback to old)
  const revenue = results.revenue_breakdown || results.income_statement?.monthly_breakdown || [];

  // Expenses - handle different company types and data structures
  let expenses = [];
  
  // Check for different possible locations of expense data
  if (results.expense_breakdown) {
    // Standard expense breakdown (should work for all business types now)
    expenses = results.expense_breakdown;
  } else if (results.income_statement?.expense_breakdown) {
    // Income statement expense breakdown
    expenses = results.income_statement.expense_breakdown;
  } else if (results.operating_expenses) {
    // Handle direct operating expenses object (Service/Retail)
    if (Array.isArray(results.operating_expenses)) {
      expenses = results.operating_expenses.map((exp: any) => ({
        category: exp.name || exp.category || 'Expense',
        amount: exp.amount || exp.value || 0,
        name: exp.name || exp.category || 'Expense',
        value: exp.amount || exp.value || 0
      }));
    } else if (typeof results.operating_expenses === 'object') {
      expenses = Object.entries(results.operating_expenses).map(([category, amount]) => ({
        category,
        amount: amount as number,
        name: category,
        value: amount as number
      }));
    }
  } else if (results.expenses) {
    // Handle direct expenses array (Service/Retail fallback)
    if (Array.isArray(results.expenses)) {
      expenses = results.expenses.map((exp: any) => ({
        category: exp.name || exp.category || exp.type || 'Expense',
        amount: exp.amount || exp.value || 0,
        name: exp.name || exp.category || exp.type || 'Expense',
        value: exp.amount || exp.value || 0
      }));
    }
  }

  // Process and format the expenses
  if (Array.isArray(expenses) && expenses.length > 0) {
    const total = expenses.reduce((sum, item) => {
      const amount = typeof item.amount === 'number' ? item.amount : 
                   typeof item.value === 'number' ? item.value : 0;
      return sum + Math.abs(amount); // Use absolute value to handle any negative amounts
    }, 0) || 1; // Prevent division by zero

    expenses = expenses.map((item) => {
      const category = item.category || item.name || 'Expense';
      const amount = typeof item.amount === 'number' ? item.amount : 
                    typeof item.value === 'number' ? item.value : 0;
      const percent = Math.abs(amount) / total; // Use absolute value for percentage calculation
      
      // Generate a consistent color based on category name
      const color = item.color || 
                   `hsl(${(category.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 13) % 360}, 70%, 60%)`;
      
      return {
        ...item,
        category,
        amount: Math.abs(amount), // Store as positive for display
        percent,
        color,
        name: category,
        value: Math.abs(amount), // Ensure value is positive for charts
      };
    });
    
    // Sort by amount in descending order
    expenses.sort((a, b) => b.amount - a.amount);
  }

  // Cash Flow (prefer backend breakdown, fallback to old)
  const cashFlow = results.cashflow_breakdown || cashflow.monthly_breakdown || [];

  // Equity data from backend
  const equityData = {
    shareholders: equity.shareholders || [],
    ownerSalary: equity.ownerSalary ?? 0
  };
  


  // Forecast (prefer projections, fallback to old forecast)
  let forecast = results.forecast || [];
  if (results.projections && results.projections.years) {
    forecast = results.projections.years.map((year: any, idx: number) => {
      const revenue = results.projections.revenue?.[idx] ?? 0;
      const netIncome = results.projections.net_income?.[idx] ?? 0;
      const ebitda = results.projections.ebitda?.[idx] ?? 0;
      const freeCashFlow = results.projections.free_cash_flow?.[idx] ?? 0;
      
      // Calculate expenses as revenue - net income (approximation)
      // Since backend doesn't provide expenses in projections, we estimate it
      const expenses = revenue - netIncome;
      
      // Calculate COGS for sensitivity analysis
      // Estimate COGS as a percentage of revenue (typical range 30-70%)
      // We'll use the EBITDA margin to estimate COGS
      const ebitdaMargin = ebitda / revenue;
      const estimatedCogsMargin = Math.max(0.3, 1 - ebitdaMargin - 0.15); // Assume 15% for other expenses
      const cogs = revenue * estimatedCogsMargin;
      
      return {
        year: String(year), // Ensure year is a string for proper X-axis display
        revenue: Number(revenue) || 0,
        cogs: Number(cogs) || 0, // Add COGS field
        netIncome: Number(netIncome) || 0,
        ebitda: Number(ebitda) || 0,
        freeCashFlow: Number(freeCashFlow) || 0,
        expenses: Number(expenses) || 0,
      };
    });
  } else if (results.forecast && Array.isArray(results.forecast)) {
    // Preserve original forecast structure from backend (including COGS)
    forecast = results.forecast.map((item: any) => ({
      year: String(item.year),
      revenue: Number(item.revenue) || 0,
      cogs: Number(item.cogs) || 0,
      gross_profit: Number(item.gross_profit) || 0,
      operating_expenses: Number(item.operating_expenses) || 0,
      ebit: Number(item.ebit) || 0,
      netIncome: Number(item.net_income) || 0,
      ebitda: Number(item.ebitda) || 0,
      freeCashFlow: Number(item.free_cash_flow) || 0,
      expenses: Number(item.operating_expenses) || 0,
    }));
  }
  

  
  // Additional debug for chart data
  if (forecast && forecast.length > 0) {

  }

  // --- NEW: Time-based Revenue vs Expenses Data ---
  let revenueVsExpenses = [];
  if (incomeStatement && Array.isArray(incomeStatement.line_items) && Array.isArray(incomeStatement.years)) {
    // Find revenue and expenses line items
    const revenueItem = incomeStatement.line_items.find((li: any) => li.label.toLowerCase() === 'revenue');
    const expensesItem = incomeStatement.line_items.find((li: any) => li.label.toLowerCase() === 'operating expenses');
    if (revenueItem && expensesItem) {
      revenueVsExpenses = incomeStatement.years.map((year: string, idx: number) => {
        const revenue = revenueItem.values[idx] ?? 0;
        const expenses = Math.abs(expensesItem.values[idx] ?? 0); // Ensure positive value for bar
        const total = revenue + expenses;
        
        // Calculate percentages
        const revenuePercent = total > 0 ? (revenue / total) * 100 : 0;
        const expensesPercent = total > 0 ? (expenses / total) * 100 : 0;
        
        // Calculate expense-to-revenue ratio (expense efficiency ratio)
        const expenseToRevenueRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;
        
        return {
        period: year,
          revenue: revenue,
          expenses: expenses,
          revenuePercent: revenuePercent,
          expensesPercent: expensesPercent,
          expenseToRevenueRatio: expenseToRevenueRatio,
          total: total
        };
      });
      

    }
  }

  // Performance tab data preparation
  // Revenue Growth Trend - use forecast data or revenue vs expenses data
  const revenueGrowthData = forecast.length > 0 ? forecast.map((item: any) => ({
    month: item.year,
    value: item.revenue
  })) : revenueVsExpenses.map((item: any) => ({
    month: item.period,
    value: item.revenue
  }));

  // EBITDA vs Net Income - use forecast data
  const ebitdaVsNetIncomeData = forecast.length > 0 ? forecast.map((item: any) => ({
    month: item.year,
    value: item.ebitda || 0,
    profit: item.netIncome || 0
  })) : [];

  // Cash Flow Analysis - prepare from cash flow data
  let cashFlowAnalysisData = [];
  if (results.cash_flow && Array.isArray(results.cash_flow)) {
    cashFlowAnalysisData = results.cash_flow.map((period: any, idx: number) => ({
      month: `Year ${idx + 1}`,
      operating: period.operating_cash_flow || period.net_cash_from_operating_activities || 0,
      investing: period.investing_cash_flow || period.net_cash_from_investing_activities || 0,
      financing: period.financing_cash_flow || period.net_cash_from_financing_activities || 0
    }));
  } else if (forecast.length > 0) {
    // Fallback to using forecast data for cash flow
    cashFlowAnalysisData = forecast.map((item: any) => ({
      month: item.year,
      operating: item.freeCashFlow || 0,
      investing: 0, // Not available in forecast
      financing: 0  // Not available in forecast
    }));
  }

  return {
    overview,
    revenue,
    expenses,
    cashFlow,
    equity: equityData,
    forecast,
    kpis,
    // Pass through raw statements for analysis tables
    income_statement: results.income_statement,
    balance_sheet: results.balance_sheet,
    cash_flow: results.cash_flow,
    revenueVsExpenses, // <-- add this
    // Performance tab data
    revenueGrowthData,
    ebitdaVsNetIncomeData,
    cashFlowAnalysisData,
    sensitivityMatrix: results.sensitivityMatrix,
    tornadoData: results.tornadoData,
    valuation: results.valuation,
    dcf: results.dcf,
  };
}

// Helper for formatting large numbers
function formatCurrency(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

// Helper for formatting NPV with 1 decimal point
function formatNPV(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(1)}`;
  }
}

// Helper to calculate Payback Period from cash flows
function calculatePaybackPeriod(cashFlow: any[]) {
  if (!Array.isArray(cashFlow) || cashFlow.length === 0) return null;
  let cumulative = 0;
  for (let i = 0; i < cashFlow.length; i++) {
    const period = cashFlow[i];
    cumulative += period.net_change_in_cash || 0;
    if (cumulative >= 0) return period.year || i + 1;
  }
  return null;
}
// Helper to calculate DuPont ratios
function calculateDuPontRatios(calculationResults: any) {
  const income = calculationResults.income_statement;
  const balance = calculationResults.balance_sheet;
  if (!income || !balance) return {};
  // Get base year values
  const getValue = (items: any[], label: string) => {
    const item = items.find((li) => li.label.toLowerCase() === label.toLowerCase());
    return item && Array.isArray(item.values) ? item.values[0] : 0;
  };
  const netIncome = getValue(income.line_items, 'Net Income');
  const revenue = getValue(income.line_items, 'Revenue');
  const totalAssets = getValue(balance.line_items, 'Total Assets');
  const totalEquity = getValue(balance.line_items, 'Total Equity');
  const netProfitMargin = revenue ? netIncome / revenue : 0;
  const assetTurnover = totalAssets ? revenue / totalAssets : 0;
  const equityMultiplier = totalEquity ? totalAssets / totalEquity : 0;
  const roe = netProfitMargin * assetTurnover * equityMultiplier;
  return { netProfitMargin, assetTurnover, equityMultiplier, roe };
}

const DASHBOARD_TABS = [
  { value: 'overview', label: 'Business Overview', icon: Building },
  { value: 'performance', label: 'Performance', icon: TrendingUp },
  { value: 'capital', label: 'Capital & Ownership', icon: Users },
  { value: 'analysis', label: 'Financial Analysis', icon: BarChart2 },
  { value: 'ratios', label: 'Financial Ratios', icon: Percent },
  { value: 'sensitivity', label: 'Sensitivity Analysis', icon: Layers },
];

// Add this type above the Dashboard component
type SensitivityKey = 'revenueGrowth' | 'operatingMargin' | 'capex' | 'workingCapitalDays' | 'taxRate' | 'wacc' | 'terminalGrowth';

export default function Dashboard() {
  const [expenseView, setExpenseView] = useState<'monthly' | 'annual'>('monthly');
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calculationResult } = useCalculationResult();
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [modelVariables, setModelVariables] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sensitivityScenario, setSensitivityScenario] = useState('base');
  const [sensitivityValues, setSensitivityValues] = useState({
    base: { revenueGrowth: 0, operatingMargin: 0, capex: 0, workingCapitalDays: 0, taxRate: 0, wacc: 0, terminalGrowth: 0 },
    best: { revenueGrowth: 10, operatingMargin: 5, capex: -15, workingCapitalDays: -5, taxRate: -2, wacc: -1, terminalGrowth: 0.5 },
    worst: { revenueGrowth: -15, operatingMargin: -10, capex: 25, workingCapitalDays: 10, taxRate: 5, wacc: 2, terminalGrowth: -1 }
  });
  
  // Force recalculation when sensitivity values change
  useEffect(() => {
    setRecalculationTrigger(prev => prev + 1);
  }, [sensitivityValues]);
  const [monteCarloData, setMonteCarloData] = useState([]);
  const [monteCarloLoading, setMonteCarloLoading] = useState(false);
  const [monteCarloError, setMonteCarloError] = useState<string | null>(null);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [sensitivityData, setSensitivityData] = useState<any>(null);
  const [sensitivityLoading, setSensitivityLoading] = useState(false);
  const [sensitivityError, setSensitivityError] = useState<string | null>(null);
  const [riskAnalysisData, setRiskAnalysisData] = useState<any>(null);
  const [riskAnalysisLoading, setRiskAnalysisLoading] = useState(false);
  const [riskAnalysisError, setRiskAnalysisError] = useState<string | null>(null);
  const [recalculationTrigger, setRecalculationTrigger] = useState(0);
  const { businessName, businessDescription } = useCalculationResult();

  // Hide sidebar by default, show on hover near left edge
  // Only for Dashboard page

  useEffect(() => {
    // Debug log to check what Dashboard receives
    if (calculationResult) {
      const mapped = mapCalculationResultsToDashboardData(calculationResult);
    }
  }, [calculationResult]);

  useEffect(() => {
    // Hybrid: use context if available, else localStorage
    if (calculationResult) {
      setCalculationResults(mapCalculationResultsToDashboardData(calculationResult));
    } else {
      const saved = localStorage.getItem(`model_${modelId}_variables`);
      let realData = null;
      try {
        realData = saved ? JSON.parse(saved) : null;
      } catch {
        realData = null;
      }
      setCalculationResults(mapCalculationResultsToDashboardData(realData));
    }
    // Optionally, load model variables if needed
    // setModelVariables(...)
  }, [modelId, calculationResult]);

  useEffect(() => {
    async function fetchMonteCarlo() {
      if (!calculationResults?.forecast) return;
      setMonteCarloLoading(true);
      setMonteCarloError(null);
      try {
        const free_cash_flows = calculationResults.forecast.map((row: any) => row.freeCashFlow ?? 0);
        const payload = {
          free_cash_flows,
          discount_rate_range: [0.08, 0.12], // TODO: wire to scenario/slider
          terminal_growth_range: [0.01, 0.03], // TODO: wire to scenario/slider
          runs: 500
        };
        const res = await fetch('/api/v1/models/monte-carlo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setMonteCarloData(data.npvDistribution || []);
      } catch (e: any) {
        setMonteCarloError(e.message || 'Error fetching Monte Carlo data');
      } finally {
        setMonteCarloLoading(false);
      }
    }
    fetchMonteCarlo();
  }, [calculationResults]);

  // Fetch scenario data when calculation results or sensitivity values change
  useEffect(() => {
    async function fetchScenarioData() {
      if (!calculationResults?.forecast) return;
      
      setScenarioLoading(true);
      setScenarioError(null);
      
      try {
        // Debug: Check what forecast data we're sending
        console.log('[DEBUG] Frontend forecast data being sent:', calculationResults.forecast);
        console.log('[DEBUG] First forecast item:', calculationResults.forecast?.[0]);
        console.log('[DEBUG] First forecast item keys:', Object.keys(calculationResults.forecast?.[0] || {}));
        console.log('[DEBUG] Has COGS field?', 'cogs' in (calculationResults.forecast?.[0] || {}));
        
        const payload = {
          base_forecast: calculationResults.forecast,
          scenario_configs: {
            best: sensitivityValues.best,
            worst: sensitivityValues.worst
          },
          base_discount_rate: calculationResults.dcf?.discount_rate || 0.1,
          base_terminal_growth: calculationResults.dcf?.terminal_growth || 0.02
        };
        

        
        const res = await fetch('/api/v1/models/scenario-calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();


        setScenarioData(data.scenarios);
      } catch (e: any) {
        setScenarioError(e.message || 'Error fetching scenario data');

      } finally {
        setScenarioLoading(false);
      }
    }
    
    fetchScenarioData();
  }, [calculationResults, sensitivityValues, recalculationTrigger]);



  // Fetch sensitivity analysis data
  useEffect(() => {
    async function fetchSensitivityData() {
      if (!calculationResults?.forecast) return;
      
      setSensitivityLoading(true);
      setSensitivityError(null);
      
      try {
        // Debug: Check what forecast data we're sending to sensitivity analysis
        console.log('[DEBUG] Sensitivity analysis - Frontend forecast data:', calculationResults.forecast);
        console.log('[DEBUG] Sensitivity analysis - First forecast item:', calculationResults.forecast?.[0]);
        console.log('[DEBUG] Sensitivity analysis - First forecast item keys:', Object.keys(calculationResults.forecast?.[0] || {}));
        console.log('[DEBUG] Sensitivity analysis - Has COGS field?', 'cogs' in (calculationResults.forecast?.[0] || {}));
        
        const payload = {
          base_forecast: calculationResults.forecast,
          sensitivity_ranges: {
            revenueGrowth: { low: -20, high: 20 },
            operatingMargin: { low: -10, high: 10 },

            capex: { low: -15, high: 15 },
            workingCapitalDays: { low: -10, high: 10 },
            taxRate: { low: -5, high: 5 },
            wacc: { low: -2, high: 2 },
            terminalGrowth: { low: -1, high: 1 }
          },
          base_discount_rate: calculationResults.dcf?.discount_rate || 0.1,
          base_terminal_growth: calculationResults.dcf?.terminal_growth || 0.02
        };
        
        const res = await fetch('/api/v1/models/sensitivity-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setSensitivityData(data);
      } catch (e: any) {
        setSensitivityError(e.message || 'Error fetching sensitivity data');

      } finally {
        setSensitivityLoading(false);
      }
    }
    
    fetchSensitivityData();
  }, [calculationResults]);

  // Fetch risk analysis data
  useEffect(() => {
    async function fetchRiskAnalysis() {
      if (!calculationResults?.forecast) return;
      
      setRiskAnalysisLoading(true);
      setRiskAnalysisError(null);
      
      try {
        const free_cash_flows = calculationResults.forecast.map((row: any) => row.freeCashFlow ?? 0);
        const payload = {
          free_cash_flows,
          base_discount_rate: calculationResults.dcf?.discount_rate || 0.1,
          base_terminal_growth: calculationResults.dcf?.terminal_growth || 0.02,
          runs: 1000
        };
        
        const res = await fetch('/api/v1/models/risk-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setRiskAnalysisData(data);
      } catch (e: any) {
        setRiskAnalysisError(e.message || 'Error fetching risk analysis data');

      } finally {
        setRiskAnalysisLoading(false);
      }
    }
    
    fetchRiskAnalysis();
  }, [calculationResults]);

  // Helper functions moved inside component to access state
  // Real-time calculation for sensitivity analysis
  const [realTimeKpis, setRealTimeKpis] = useState<any>(null);
  const [realTimeLoading, setRealTimeLoading] = useState(false);

  // Calculate real-time KPIs when sensitivity parameters change
  useEffect(() => {
    if (!calculationResults?.forecast || sensitivityScenario === 'base') {
      setRealTimeKpis(null);
      return;
    }

    const calculateRealTimeKpis = async () => {
      setRealTimeLoading(true);
      try {
        const currentValues = sensitivityValues[sensitivityScenario];

        const payload = {
          base_forecast: calculationResults.forecast, // User's original input data
          scenario_values: currentValues, // Sensitivity adjustments to apply
          base_discount_rate: calculationResults.dcf?.discount_rate || 0.1,
          base_terminal_growth: calculationResults.dcf?.terminal_growth || 0.02
        };

        const res = await fetch('/api/v1/models/single-scenario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setRealTimeKpis(data);
      } catch (e: any) {

        setRealTimeKpis(null);
      } finally {
        setRealTimeLoading(false);
      }
    };

    calculateRealTimeKpis();
  }, [sensitivityValues, sensitivityScenario, calculationResults]);

  function getScenarioKpi(scenario: 'base' | 'best' | 'worst', key: string, calculationResults: any, sensitivityValues: any) {
    
    // For base case, use backend-calculated scenario data (consistent with best/worst cases)
    if (scenario === 'base' && scenarioData?.base) {
      const baseKpis = scenarioData.base;
      
      switch (key) {
        case 'npv': return baseKpis.npv;
        case 'irr': return baseKpis.irr;
        case 'payback_period': return baseKpis.payback_period;
        case 'cumulative_fcf': return baseKpis.cumulative_fcf;
        case 'year_1_revenue': return baseKpis.year_1_revenue;
        case 'year_5_revenue': return baseKpis.year_5_revenue;
        case 'year_1_gross_margin': return baseKpis.year_1_gross_margin;
        case 'year_1_net_margin': return baseKpis.year_1_net_margin;
        default: return 0;
      }
    }
    
    // Fallback to original calculation results if backend scenario data not available
    if (scenario === 'base' && calculationResults?.valuation) {
      
      // Get base case data once to avoid variable hoisting issues
      const year1Revenue = calculationResults.forecast?.[0]?.revenue || 0;
      
      // Get COGS and gross profit from income statement data structure
      const incomeStatementData = calculationResults.income_statement?.line_items;
      const year1Cogs = incomeStatementData?.[1]?.values?.[0] || 0; // COGS is at index 1
      const year1GrossProfit = incomeStatementData?.[2]?.values?.[0] || 0; // Gross Profit is at index 2
      const year1NetIncome = incomeStatementData?.[12]?.values?.[0] || 0; // Net Income is at index 12

      
      // Calculate gross profit if not available
      const calculatedGrossProfit = year1GrossProfit || (year1Revenue - year1Cogs);
      

      
      switch (key) {
        case 'npv': return calculationResults.valuation.npv;
        case 'irr': return calculationResults.valuation.irr;
        case 'payback_period': 
          return calculationResults.valuation.payback_period;
        case 'cumulative_fcf': return calculationResults.forecast?.reduce((sum: number, year: any) => sum + (year.freeCashFlow || 0), 0) || 0;
        case 'year_1_revenue': return year1Revenue;
        case 'year_5_revenue': 
          return calculationResults.forecast?.[4]?.revenue || 0;
        case 'year_1_gross_margin': 
          return year1Revenue > 0 ? (calculatedGrossProfit / year1Revenue) * 100 : 0;
        case 'year_1_net_margin': 
          return year1Revenue > 0 ? (year1NetIncome / year1Revenue) * 100 : 0;
        default: return 0;
      }
    }
    
    // For sensitivity analysis tab, use real-time calculation based on current parameter values
    if (scenario === sensitivityScenario && scenario !== 'base' && realTimeKpis) {
      
      switch (key) {
        case 'npv': return realTimeKpis.npv;
        case 'irr': return realTimeKpis.irr;
        case 'payback_period': 
          return realTimeKpis.payback_period;
        case 'cumulative_fcf': return realTimeKpis.cumulative_fcf;
        case 'year_1_revenue': return realTimeKpis.year_1_revenue;
        case 'year_5_revenue': return realTimeKpis.year_5_revenue;
        case 'year_1_gross_margin': 
          // Fallback calculation if backend doesn't return margin
          if (realTimeKpis.year_1_gross_margin !== undefined) {
            return realTimeKpis.year_1_gross_margin;
          } else {
            // Calculate margin from adjusted forecast data
            const adjustedForecast = realTimeKpis.adjusted_forecast?.[0];
            if (adjustedForecast && adjustedForecast.revenue > 0) {
              const grossProfit = adjustedForecast.gross_profit || (adjustedForecast.revenue - adjustedForecast.cogs);
              return (grossProfit / adjustedForecast.revenue) * 100;
            }
            return 0;
          }
        case 'year_1_net_margin': 
          // Fallback calculation if backend doesn't return margin
          if (realTimeKpis.year_1_net_margin !== undefined) {
            return realTimeKpis.year_1_net_margin;
          } else {
            // Calculate margin from adjusted forecast data
            const adjustedForecast = realTimeKpis.adjusted_forecast?.[0];
            if (adjustedForecast && adjustedForecast.revenue > 0) {
              const netIncome = adjustedForecast.net_income;
              return (netIncome / adjustedForecast.revenue) * 100;
            }
            return 0;
          }
        default: return 0;
      }
    }
    
    // For predefined scenarios (best/worst), use scenario data
    if (!scenarioData || !scenarioData[scenario]) {
      return 0;
    }
    
    const scenarioKpis = scenarioData[scenario];
    
    switch (key) {
      case 'npv': 
        return scenarioKpis.npv;
      case 'irr': 
        return scenarioKpis.irr;
      case 'payback_period': 
        return scenarioKpis.payback_period;
      case 'cumulative_fcf': 
        return scenarioKpis.cumulative_fcf;
      case 'year_1_revenue': 
        return scenarioKpis.year_1_revenue;
      case 'year_5_revenue': 
        return scenarioKpis.year_5_revenue;
              case 'year_1_gross_margin': 
          // Fallback calculation if backend doesn't return margin
          if (scenarioKpis.year_1_gross_margin !== undefined) {
            return scenarioKpis.year_1_gross_margin;
          } else {
            // Calculate margin from adjusted forecast data
            const adjustedForecast = scenarioKpis.adjusted_forecast?.[0];
            if (adjustedForecast && adjustedForecast.revenue > 0) {
              const grossProfit = adjustedForecast.gross_profit || (adjustedForecast.revenue - adjustedForecast.cogs);
              const margin = (grossProfit / adjustedForecast.revenue) * 100;
              return margin;
            }
            return 0;
          }
      case 'year_1_net_margin': 
        // Fallback calculation if backend doesn't return margin
        if (scenarioKpis.year_1_net_margin !== undefined) {
          
          return scenarioKpis.year_1_net_margin;
        } else {
          // Calculate margin from adjusted forecast data
          const adjustedForecast = scenarioKpis.adjusted_forecast?.[0];
          
          if (adjustedForecast && adjustedForecast.revenue > 0) {
            const netIncome = adjustedForecast.net_income;
            const margin = (netIncome / adjustedForecast.revenue) * 100;
            
            return margin;
          }
          return 0;
        }
      default: return 0;
    }
  }

  function getScenarioChartData(calculationResults: any, sensitivityValues: any) {
    if (!scenarioData) {
      // Fallback to base case only
      return [
        { name: 'Base Case', npv: calculationResults?.valuation?.npv || 0, irr: calculationResults?.valuation?.irr || 0, netIncome: calculationResults?.forecast?.[0]?.net_income || 0 }
      ];
    }
    
    return [
      { 
        name: 'Base Case', 
        npv: scenarioData.base?.npv || 0, 
        irr: scenarioData.base?.irr || 0, 
        netIncome: scenarioData.base?.adjusted_forecast?.[0]?.net_income || 0 
      },
      { 
        name: 'Best Case', 
        npv: scenarioData.best?.npv || 0, 
        irr: scenarioData.best?.irr || 0, 
        netIncome: scenarioData.best?.adjusted_forecast?.[0]?.net_income || 0 
      },
      { 
        name: 'Worst Case', 
        npv: scenarioData.worst?.npv || 0, 
        irr: scenarioData.worst?.irr || 0, 
        netIncome: scenarioData.worst?.adjusted_forecast?.[0]?.net_income || 0 
      }
    ];
  }

  function getScenarioFcfChartData(calculationResults: any) {
    if (!scenarioData) {
      // Fallback to base case only
      const baseFcf = calculationResults?.forecast?.map((year: any, index: number) => ({
        year: `Year ${index + 1}`,
        'Base Case': year.freeCashFlow || 0
      })) || [];
      return baseFcf;
    }
    
    const years = calculationResults?.forecast?.length || 0;
    const chartData = [];
    
    for (let i = 0; i < years; i++) {
      const yearData: any = { year: `Year ${i + 1}` };
      
      if (scenarioData.base?.free_cash_flows) {
        yearData['Base Case'] = scenarioData.base.free_cash_flows[i] || 0;
      }
      if (scenarioData.best?.free_cash_flows) {
        yearData['Best Case'] = scenarioData.best.free_cash_flows[i] || 0;
      }
      if (scenarioData.worst?.free_cash_flows) {
        yearData['Worst Case'] = scenarioData.worst.free_cash_flows[i] || 0;
      }
      
      chartData.push(yearData);
    }
    
    return chartData;
  }

  function getScenarioRevenueExpenseChartData(calculationResults: any, currentScenario: string) {
    const years = calculationResults?.forecast?.length || 0;
    const chartData = [];
    
    for (let i = 0; i < years; i++) {
      const yearData: any = { year: `Year ${i + 1}` };
      
      if (currentScenario === 'base') {
        // Base case - use user's original input data (no adjustments)
        if (calculationResults?.forecast?.[i]) {
          yearData['Revenue'] = calculationResults.forecast[i].revenue || 0;
          yearData['Expenses'] = calculationResults.forecast[i].expenses || 0;
          yearData['Net Income'] = calculationResults.forecast[i].netIncome || 0;
        }
      } else if (currentScenario === 'best' && scenarioData?.best?.adjusted_forecast?.[i]) {
        // Best case - user's data adjusted with optimistic parameters
        yearData['Revenue'] = scenarioData.best.adjusted_forecast[i].revenue || 0;
        yearData['Expenses'] = scenarioData.best.adjusted_forecast[i].operating_expenses || 0;
        yearData['Net Income'] = scenarioData.best.adjusted_forecast[i].net_income || 0;
      } else if (currentScenario === 'worst' && scenarioData?.worst?.adjusted_forecast?.[i]) {
        // Worst case - user's data adjusted with pessimistic parameters
        yearData['Revenue'] = scenarioData.worst.adjusted_forecast[i].revenue || 0;
        yearData['Expenses'] = scenarioData.worst.adjusted_forecast[i].operating_expenses || 0;
        yearData['Net Income'] = scenarioData.worst.adjusted_forecast[i].net_income || 0;
      } else {
        // Fallback to user's original data if scenario data not available
        if (calculationResults?.forecast?.[i]) {
          yearData['Revenue'] = calculationResults.forecast[i].revenue || 0;
          yearData['Expenses'] = calculationResults.forecast[i].expenses || 0;
          yearData['Net Income'] = calculationResults.forecast[i].netIncome || 0;
        }
      }
      
      chartData.push(yearData);
    }
    
    return chartData;
  }

  const getModelName = () => {
    return modelId ? MODEL_CONFIGS[modelId as ModelId]?.info.name || 'Financial Model' : 'Financial Model';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExportPDF = async () => {
    try {
      // Get only the currently active tab element
      const currentTab = DASHBOARD_TABS.find(tab => tab.value === activeTab);
      if (!currentTab) {
        toast({
          title: "Export Failed",
          description: "Current tab not found.",
          variant: "destructive"
        });
        return;
      }

      const element = document.querySelector(`[data-value="${activeTab}"]`) as HTMLElement;
      if (!element) {
        toast({
          title: "Export Failed",
          description: "Current tab content not found.",
          variant: "destructive"
        });
        return;
      }

      const tabElements = [{
        tabId: activeTab,
        element: element,
        title: currentTab.label
      }];

      // Show loading toast
      toast({
        title: "Exporting PDF",
        description: `Capturing ${currentTab.label} tab... This may take a moment.`
      });

      // Export to PDF
      const pdfBlob = await exportDashboardTabsToPDF(tabElements, getModelName());
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getModelName().replace(/\s+/g, '_')}_${currentTab.label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${currentTab.label} has been exported successfully.`
      });
    } catch (error) {
      
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSliderChange = (key: SensitivityKey, value: string) => {
    const newValue = parseFloat(value);
    
    setSensitivityValues(prev => {
      const updated = {
        ...prev,
        [sensitivityScenario]: {
          ...prev[sensitivityScenario],
          [key]: newValue
        }
      };
      return updated;
    });
    
    // Force recalculation by incrementing trigger
    setRecalculationTrigger(prev => prev + 1);
  };

  if (!calculationResults || !calculationResults.overview) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar selectedModel={modelId as ModelId} onModelSelect={() => {}} />
            <SidebarInset className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">No Calculation Results</h2>
                <p className="text-muted-foreground">Please run a calculation to see the dashboard.</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate('/')} variant="outline">Back to Home</Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExportPDF}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                    disabled={!calculationResults}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  // --- Cash Flow Section Chart Data Preparation ---
  const { data: chartPeriods, sections: chartSections } = mapPeriodsToSections({
    income_statement: calculationResults.income_statement,
    cash_flow: calculationResults.cash_flow
  });
  // Prepare insights per section with real KPIs
  const insights: Record<string, any> = {};
  chartSections.forEach(section => {
    // Get data for this section
    const sectionData = chartPeriods.filter(p => p.section === section);
    
    if (sectionData.length > 0) {
      // Calculate KPIs for this section
      const avgRevenue = sectionData.reduce((sum, p) => sum + p.revenue, 0) / sectionData.length;
      const avgEBITDA = sectionData.reduce((sum, p) => sum + p.ebitda, 0) / sectionData.length;
      const avgCashFlow = sectionData.reduce((sum, p) => sum + p.cashFlow, 0) / sectionData.length;
      const totalCashFlow = sectionData.reduce((sum, p) => sum + p.cashFlow, 0);
      
    insights[section] = {
        vertical: section === 'current' ? 'Current Valuation' : 'Projected Valuation',
        horizontal: section === 'current' ? 'Baseline' : 'Trend ↑',
        equity: formatCurrency(avgCashFlow),
        enterprise: formatCurrency(totalCashFlow),
        revenue: formatCurrency(avgRevenue),
        ebitda: formatCurrency(avgEBITDA),
        cashFlow: formatCurrency(avgCashFlow),
        periods: sectionData.length
      };
    } else {
      insights[section] = {
        vertical: section === 'current' ? 'Current Valuation' : 'Projected Valuation',
        horizontal: section === 'current' ? 'Baseline' : 'Trend ↑',
        equity: '-',
        enterprise: '-',
        revenue: '-',
        ebitda: '-',
        cashFlow: '-',
        periods: 0
      };
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SidebarProvider>
        {/* Hot zone for mouse hover to show sidebar */}
        <div
          style={{
            position: 'fixed',
            top: 64, // Start below the fixed header (64px height)
            left: 0,
            width: sidebarVisible ? 272 : 16,
            height: 'calc(100vh - 64px)', // Adjust height to account for header
            zIndex: 50,
          overflow: 'hidden', // Prevent background/border bleed
          background: 'transparent', // No background on parent
        }}
        onMouseEnter={() => setSidebarVisible(true)}
        onMouseLeave={() => setSidebarVisible(false)}
        className="group/sidebar-hotzone"
      >
        {sidebarVisible && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 272,
              height: '100vh',
              transform: 'translateX(0)',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '4px 0 16px rgba(0,0,0,0.10)',
              background: '#fff',
              borderRight: 'none',
              overflow: 'hidden',
              zIndex: 100,
            }}
            onMouseEnter={() => setSidebarVisible(true)}
            onMouseLeave={() => setSidebarVisible(false)}
          >
            <AppSidebar
              selectedModel={modelId as ModelId}
              onModelSelect={() => {}}
              tabs={DASHBOARD_TABS}
              activeTab={activeTab}
              onTabSelect={setActiveTab}
            />
          </div>
        )}
      </div>
      {/* Main dashboard content, full width */}
      <SidebarInset className="flex-1" style={{ marginLeft: 0, marginTop: '64px' }}>
          {/* PDF Export Button - Top Right */}
          <div className="absolute top-4 right-6 z-10">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Personalized Welcome Section */}
          <div className="mb-8 mt-6 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              {businessName ? `${businessName} Dashboard` : 'Financial Dashboard'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              {businessDescription || 'Your comprehensive financial analysis and modeling platform'}
            </p>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* 🏢 Business Overview */}
              <TabsContent value="overview" className="space-y-6" data-value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-[483px_1fr] gap-4 w-full" style={{ marginBottom: '37px' }}>
                  {/* Left Column - All KPIs in 4x3 grid */}
                  <div className="grid grid-cols-4 gap-2" style={{ fontSize: '14px' }}>
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${calculationResults.overview.totalRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculationResults.overview.totalRevenue)}</div>
                    </CardContent>
                  </Card>

                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">Total Expenses</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${calculationResults.overview.totalExpenses >= 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(calculationResults.overview.totalExpenses)}</div>
                    </CardContent>
                  </Card>

                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">Net Income</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${calculationResults.overview.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(calculationResults.overview.netIncome)}</div>
                    </CardContent>
                  </Card>

                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">Profit Margin</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${calculationResults.kpis?.net_margin !== undefined ? (calculationResults.kpis.net_margin >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>{calculationResults.kpis?.net_margin !== undefined ? `${calculationResults.kpis.net_margin.toFixed(1)}%` : 'N/A'}</div>
                    </CardContent>
                  </Card>

                  {/* IRR KPI */}
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">IRR</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${(() => {
                        const irr = calculationResults?.valuation?.irr;
                        return getBusinessOverviewKpiColor('IRR', irr);
                      })()}`}>{(() => {
                        const irr = calculationResults?.valuation?.irr;

                        if (irr !== undefined && irr !== null) {
                          const irrPercent = irr * 100;
                          
                          return `${irrPercent.toFixed(1)}%`;
                        }
                        return 'N/A';
                      })()}</div>
                    </CardContent>
                  </Card>

                  {/* NPV KPI */}
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">NPV</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${(() => {
                        const npv = calculationResults?.valuation?.npv;
                        return getBusinessOverviewKpiColor('NPV', npv);
                      })()}`}>{(() => {
                        const npv = calculationResults?.valuation?.npv;

                        if (npv !== undefined && npv !== null) {
                          
                          return formatNPV(npv);
                        }
                        return 'N/A';
                      })()}</div>
                    </CardContent>
                  </Card>

                  {/* Payback Period KPI */}
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">Payback Period</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${(() => {
                        const paybackPeriod = calculationResults?.valuation?.payback_period;
                        return getBusinessOverviewKpiColor('Payback Period', paybackPeriod);
                      })()}`}>{(() => {
                        const paybackPeriod = calculationResults?.valuation?.payback_period;

                        if (paybackPeriod !== undefined && paybackPeriod !== null && paybackPeriod !== 999) {
                          
                          return `${paybackPeriod.toFixed(1)}Y`;
                        }
                        return 'Never';
                      })()}</div>
                    </CardContent>
                  </Card>

                  {/* Asset Turnover Ratio KPI */}
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">Asset Turnover</CardTitle>
                      <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${(() => { 
                        const d = calculateDuPontRatios(calculationResults); 
                        return getBusinessOverviewKpiColor('Asset Turnover', d.assetTurnover);
                      })()}`}>{(() => { const d = calculateDuPontRatios(calculationResults); return d.assetTurnover !== undefined ? d.assetTurnover.toFixed(2) : 'N/A'; })()}</div>
                    </CardContent>
                  </Card>

                  {/* Financial Leverage Ratio (Equity Multiplier) KPI */}
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">Equity Multiplier</CardTitle>
                      <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${(() => { 
                        const d = calculateDuPontRatios(calculationResults); 
                        return getBusinessOverviewKpiColor('Equity Multiplier', d.equityMultiplier);
                      })()}`}>{(() => { const d = calculateDuPontRatios(calculationResults); return d.equityMultiplier !== undefined ? d.equityMultiplier.toFixed(2) : 'N/A'; })()}</div>
                    </CardContent>
                  </Card>

                  {/* ROE KPI */}
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">ROE</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${(() => { 
                        const d = calculateDuPontRatios(calculationResults); 
                        return getBusinessOverviewKpiColor('ROE', d.roe);
                      })()}`}>{(() => { const d = calculateDuPontRatios(calculationResults); return d.roe !== undefined ? `${(d.roe * 100).toFixed(1)}%` : 'N/A'; })()}</div>
                    </CardContent>
                  </Card>

                  {/* Discount Rate (WACC) KPI */}
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">WACC</CardTitle>
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${(() => {
                        const discountRate = calculationResults?.dcf?.discount_rate;
                        if (discountRate !== undefined && discountRate !== null) {
                          const rate = discountRate > 1 ? discountRate : discountRate * 100;
                          return getBusinessOverviewKpiColor('WACC', rate / 100);
                        }
                        return '';
                      })()}`}>{(() => {
                        const discountRate = calculationResults?.dcf?.discount_rate;

                        if (discountRate !== undefined && discountRate !== null) {
                          // Handle both percentage (0-100) and decimal (0-1) formats
                          const rate = discountRate > 1 ? discountRate : discountRate * 100;
                          
                          return `${rate.toFixed(2)}%`;
                        }
                        return 'N/A';
                      })()}</div>
                    </CardContent>
                  </Card>

                  {/* Terminal Value % of DCF KPI */}
                  <Card className="h-20" style={{ minWidth: '115px' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-2">
                      <CardTitle className="text-xs font-medium">Terminal Value</CardTitle>
                      <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className={`text-lg font-bold ${(() => {
                        const tv = calculationResults?.dcf?.terminal_value;
                        const dcf = calculationResults?.dcf?.dcf_value;
                        if (tv !== undefined && dcf !== undefined && dcf !== 0) {
                          const tvPercent = (tv / dcf) * 100;
                          return getBusinessOverviewKpiColor('Terminal Value', tvPercent);
                        }
                        return '';
                      })()}`}>{(() => {
                        const tv = calculationResults?.dcf?.terminal_value;
                        const dcf = calculationResults?.dcf?.dcf_value;
                        if (tv !== undefined && dcf !== undefined && dcf !== 0) {
                          return `${((tv / dcf) * 100).toFixed(1)}%`;
                        }
                        return 'N/A';
                      })()}</div>
                    </CardContent>
                  </Card>

                  </div>

                  {/* Right Column - Revenue vs Expenses Chart */}
                  <div className="flex items-start">
                    <Card className="w-full" style={{ height: '240px' }}>
                      <CardHeader className="text-2xl font-semibold tracking-tight p-4 pb-2">
                        Revenue vs Expenses (with Efficiency Ratio)
                      </CardHeader>
                      <CardContent style={{ padding: "8px 38px 16px 16px" }}>
                        <ResponsiveContainer width="100%" height={172}>
                          <ComposedChart data={calculationResults.revenueVsExpenses}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip 
                              formatter={(value: any, name: string, props: any) => {
                                const data = props.payload;
                                if (name === 'revenue') {
                                  return [`$${value.toLocaleString()} (${data.revenuePercent?.toFixed(1)}%)`, 'Revenue'];
                                } else if (name === 'expenses') {
                                  return [`$${value.toLocaleString()} (${data.expensesPercent?.toFixed(1)}%)`, 'Expenses'];
                                } else if (name === 'expenseToRevenueRatio') {
                                  return [`${value.toFixed(1)}%`, 'Expense/Revenue Ratio'];
                                }
                                return [`$${value.toLocaleString()}`, name];
                              }} 
                            />
                            <Legend 
                              formatter={(value: string) => {
                                if (value === 'expenseToRevenueRatio') return 'Expense/Revenue Ratio';
                                return value.charAt(0).toUpperCase() + value.slice(1);
                              }}
                            />
                            <Bar yAxisId="left" dataKey="revenue" fill={PRIMARY_COLOR}>
                              <LabelList 
                                dataKey="revenuePercent" 
                                position="top" 
                                formatter={(value: number) => value > 0 ? `${value.toFixed(0)}%` : '0%'}
                                style={{ 
                                  fontSize: '11px', 
                                  fontWeight: '600',
                                  fill: '#1f2937',
                                  textShadow: '0 0 2px white'
                                }}
                                offset={5}
                              />
                            </Bar>
                            <Bar yAxisId="left" dataKey="expenses" fill={EXPENSE_COLOR}>
                              <LabelList 
                                dataKey="expensesPercent" 
                                position="top" 
                                formatter={(value: number) => value > 0 ? `${value.toFixed(0)}%` : '0%'}
                                style={{ 
                                  fontSize: '11px', 
                                  fontWeight: '600',
                                  fill: '#1f2937',
                                  textShadow: '0 0 2px white'
                                }}
                                offset={5}
                              />
                            </Bar>
                            <ReferenceLine yAxisId="right" y={100} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                            <Line 
                              yAxisId="right" 
                              type="monotone" 
                              dataKey="expenseToRevenueRatio" 
                              name="Expense/Revenue Ratio"
                              stroke="#8b5cf6" 
                              strokeWidth={2}
                              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Capital Structure Loading Bar */}
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Capital Structure</CardTitle>
                      {/* Legend moved to header */}
                      {(() => {
                        const balanceSheet = calculationResults.balance_sheet;
                        if (!balanceSheet || !balanceSheet.line_items) {
                          return null;
                        }
                        return (
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded"></div>
                              <span className="text-sm text-muted-foreground">Equity</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded"></div>
                              <span className="text-sm text-muted-foreground">Debt</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const balanceSheet = calculationResults.balance_sheet;
                      if (!balanceSheet || !balanceSheet.line_items) {
                        return <div className="text-muted-foreground text-center py-4">No balance sheet data</div>;
                      }

                      const findValue = (label: string) => {
                        const item = balanceSheet.line_items.find((li: any) => li.label.toLowerCase().includes(label.toLowerCase()));
                        return item && Array.isArray(item.values) ? item.values[item.values.length - 1] : 0;
                      };

                      const totalEquity = findValue('Total Equity');
                      const totalLiabilities = findValue('Total Liabilities');
                      const total = totalEquity + totalLiabilities || 1;

                      const equityPercentage = (totalEquity / total) * 100;
                      const debtPercentage = (totalLiabilities / total) * 100;

                      return (
                        <div className="w-full">
                          {/* Loading Bar with percentages inside */}
                          <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden flex">
                            <div
                              className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ width: `${equityPercentage}%` }}
                            >
                              {equityPercentage > 10 ? `${equityPercentage.toFixed(1)}%` : ''}
                            </div>
                            <div
                              className="bg-blue-500 h-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ width: `${debtPercentage}%` }}
                            >
                              {debtPercentage > 10 ? `${debtPercentage.toFixed(1)}%` : ''}
                            </div>
                          </div>

                          {/* Amount information below */}
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>Equity: ${totalEquity.toLocaleString()}</span>
                            <span>Debt: ${totalLiabilities.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* --- New Row: Waterfall and Capital Structure Charts --- */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Free Cash Flow Line Chart */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Free Cash Flow (FCF) Over Time</CardTitle>
                      <CardDescription>Projected Free Cash Flow by Year</CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={calculationResults.forecast} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, 'FCF']} />
                          <Line type="monotone" dataKey="freeCashFlow" stroke="#14b8a6" strokeWidth={3} dot={true} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                                    {/* Revenue & Expense Breakdown */}
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Revenue vs Expenses</CardTitle>
                      <CardDescription>Total revenue and expenses distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                                            {(() => {
                        // Use the same values as the KPIs - this ensures consistency
                        const totalRevenue = calculationResults.overview?.totalRevenue || 0;
                        const totalExpenses = calculationResults.overview?.totalExpenses || 0;
                        const total = totalRevenue + totalExpenses || 1;
                        


                           
                        // Create simplified data with just Revenue and Expenses
                        const simplifiedData = [
                          {
                            name: 'Revenue',
                            value: totalRevenue,
                            percent: (totalRevenue / total) * 100,
                            color: '#10b981', // Green for revenue
                            type: 'Revenue'
                          },
                          {
                            name: 'Expenses',
                            value: totalExpenses,
                            percent: (totalExpenses / total) * 100,
                            color: '#ef4444', // Red for expenses
                            type: 'Expense'
                          }
                        ];
                        
                          return (
                            <div className="flex flex-col items-center">
                              <PieChart width={220} height={220}>
                                  <Pie
                                  data={simplifiedData}
                                  dataKey="value"
                                  nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    stroke="#fff"
                                  label={({ percent, name }) => `${name} ${percent.toFixed(0)}%`}
                                    labelLine={false}
                                  >
                                  {simplifiedData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                <Tooltip formatter={(value: number, name: string, props: any) => [`$${value.toLocaleString()} (${props.payload.percent.toFixed(1)}%)`, props.payload.name]} />
                                </PieChart>
                            {/* Simplified Legend */}
                            <div className="flex justify-center gap-4 mt-4">
                              {simplifiedData.map((entry, idx) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full block" style={{ background: entry.color }} />
                                  <span className="text-sm text-muted-foreground">
                                    {entry.name} <span className={entry.type === 'Expense' ? 'text-red-500' : 'text-green-500'}>({entry.percent.toFixed(0)}%)</span>
                                  </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                      })()}
                    </CardContent>
                  </Card>
                </div>



                {/* --- Cash Flow Performance Analysis Chart --- */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow Performance Analysis</CardTitle>
                    <CardDescription>Current vs Projected FCF, Revenue, and EBITDA with Period KPIs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CashFlowSectionsChart
                      periods={chartPeriods}
                      sections={chartSections}
                      insights={insights}
                    />
                  </CardContent>
                </Card>

                {/* Sensitivity Analysis Heatmap and Tornado Chart side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SensitivityHeatmap 
                    data={calculationResults.sensitivityMatrix} 
                    balanceSheetData={calculationResults.balanceSheet}
                  />
                  <TornadoChart data={calculationResults.tornadoData} />
                </div>



                {/* --- FCF Table --- */}
                {/* Removed FCFTable from Business Overview */}


              </TabsContent>

              {/* 💰 Performance */}
              <TabsContent value="performance" className="space-y-6" data-value="performance">
                {/* Responsive grid for all main charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Revenue Growth Trend */}
                  <Card className="min-h-[220px] max-h-[300px] flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-base">Revenue Growth Trend</CardTitle>
                      <CardDescription className="text-xs">Revenue progression over time</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {calculationResults.revenueGrowthData && calculationResults.revenueGrowthData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={calculationResults.revenueGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, 'Revenue']} />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} name="Revenue" />
                        </LineChart>
                      </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <p className="text-sm">No revenue data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {/* EBITDA vs Net Income */}
                  <Card className="min-h-[220px] max-h-[300px] flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-base">EBITDA vs Net Income</CardTitle>
                      <CardDescription className="text-xs">Profitability comparison</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {calculationResults.ebitdaVsNetIncomeData && calculationResults.ebitdaVsNetIncomeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={calculationResults.ebitdaVsNetIncomeData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, '']} />
                            <Legend />
                            <Bar dataKey="value" fill="#10b981" name="EBITDA" />
                            <Bar dataKey="profit" fill="#f59e0b" name="Net Income" />
                        </BarChart>
                      </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <p className="text-sm">No profitability data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {/* Cash Flow Analysis */}
                  <Card className="min-h-[220px] max-h-[300px] flex flex-col">
                  <CardHeader>
                      <CardTitle className="text-base">Cash Flow Analysis</CardTitle>
                      <CardDescription className="text-xs">Operating, investing, financing</CardDescription>
                  </CardHeader>
                    <CardContent className="flex-1">
                      {calculationResults.cashFlowAnalysisData && calculationResults.cashFlowAnalysisData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={calculationResults.cashFlowAnalysisData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, '']} />
                            <Legend />
                            <Bar dataKey="operating" fill="#3b82f6" name="Operating" />
                            <Bar dataKey="investing" fill="#8b5cf6" name="Investing" />
                            <Bar dataKey="financing" fill="#ef4444" name="Financing" />
                        </BarChart>
                    </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <p className="text-sm">No cash flow data available</p>
                        </div>
                      )}
                  </CardContent>
                </Card>
                  {/* Financial Projections (main trend, larger) */}
                  <Card className="min-h-[300px] max-h-[400px] flex flex-col col-span-1 md:col-span-2 lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="text-base">Financial Projections</CardTitle>
                      <CardDescription className="text-xs">Revenue, expenses, net income</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {calculationResults.forecast && calculationResults.forecast.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart 
                            data={calculationResults.forecast}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" type="category" tick={{ fontSize: 11 }} />
                            <YAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                            <Tooltip formatter={(value, name) => [`$${(value as number).toLocaleString()}`, name]} labelFormatter={(label) => `Year ${label}`} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke={PRIMARY_COLOR} strokeWidth={3} name="Revenue" dot={false} connectNulls={false} />
                            <Line type="monotone" dataKey="expenses" stroke={EXPENSE_COLOR} strokeWidth={2} name="Expenses" dot={false} strokeDasharray="5 5" connectNulls={false} />
                            <Line type="monotone" dataKey="netIncome" stroke="#16a34a" strokeWidth={3} name="Net Income" dot={false} connectNulls={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-60 text-muted-foreground">
                          <div className="text-center">
                            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No forecast data to display</p>
                            <p className="text-sm">Complete the calculation to see financial projections</p>
                  </div>
                </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Forecast Year Cards (compact) - KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mt-6">
{calculationResults.forecast && calculationResults.forecast.length > 0 && calculationResults.forecast.map((year: any, index: number) => (
  <Card key={index} className="min-h-[160px] flex flex-col justify-between">
     <CardHeader>
       <CardTitle className="text-base">{year.year}</CardTitle>
     </CardHeader>
     <CardContent className="space-y-1.5">
       <div>
         <div className="text-xs text-muted-foreground">Revenue</div>
         <div className="font-bold">{formatCurrency(year.revenue)}</div>
       </div>
       <div>
         <div className="text-xs text-muted-foreground">Expenses</div>
         <div className="font-bold text-red-600">{formatCurrency(year.expenses)}</div>
       </div>
       <div>
         <div className="text-xs text-muted-foreground">Net Income</div>
         <div className="font-bold text-green-600">{formatCurrency(year.netIncome)}</div>
       </div>
       <div>
         <div className="text-xs text-muted-foreground">EBITDA</div>
         <div className="font-bold text-blue-600">{formatCurrency(year.ebitda)}</div>
       </div>
       <div>
         <div className="text-xs text-muted-foreground">Free Cash Flow</div>
         <div className="font-bold text-purple-600">{formatCurrency(year.freeCashFlow)}</div>
       </div>
       <div>
         <div className="text-xs text-muted-foreground">Gross Profit</div>
         <div className="font-bold text-orange-600">{formatCurrency(year.revenue - year.expenses)}</div>
       </div>
     </CardContent>
   </Card>
 ))}
</div>
              </TabsContent>

              {/* 👥 Capital & Ownership */}
              <TabsContent value="capital" className="space-y-6" data-value="capital">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Shareholder Distribution</CardTitle>
                      <CardDescription>Ownership percentage and value</CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className="space-y-4">
                        {calculationResults.equity?.shareholders?.length > 0 ? (
                          calculationResults.equity.shareholders.map((shareholder: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-3 border rounded">
                              <div>
                                <div className="font-medium">{shareholder.name}</div>
                                <div className="text-sm text-muted-foreground">{shareholder.shares}% ownership</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">${shareholder.value.toLocaleString()}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No shareholders data available</p>
                            <p className="text-sm">Add shareholders in the input form to see distribution</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Owner Salary Impact</CardTitle>
                      <CardDescription>Annual compensation and tax implications</CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-2">
                      <div className="space-y-4">
                        {calculationResults.equity?.ownerSalary > 0 ? (
                          <>
                            <div className="flex justify-between">
                              <span>Annual Salary</span>
                              <span className="font-bold">${calculationResults.equity.ownerSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Estimated Tax (25%)</span>
                              <span className="font-bold">${(calculationResults.equity.ownerSalary * 0.25).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>Net After Tax</span>
                              <span className="font-bold">${(calculationResults.equity.ownerSalary * 0.75).toLocaleString()}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No owner salary data available</p>
                            <p className="text-sm">Set owner salary in the input form to see tax impact</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* 📊 Financial Analysis */}
              <TabsContent value="analysis" className="space-y-6" data-value="analysis">
                <Card>
                  <CardHeader>
                    <CardTitle>Horizontal & Vertical Analysis</CardTitle>
                    <CardDescription>Period-over-period and percentage-of-base analysis for key statements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Horizontal Analysis Table */}
                    <h3 className="font-semibold mb-2 mt-4">Horizontal Analysis (YoY % Change)</h3>
                    <HorizontalAnalysisTable calculationResults={calculationResults} />
                    {/* Vertical Analysis Table */}
                    <h3 className="font-semibold mb-2 mt-8">Vertical Analysis (% of Revenue)</h3>
                    <VerticalAnalysisTable calculationResults={calculationResults} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 📈 Financial Ratios */}
              <TabsContent value="ratios" className="space-y-6" data-value="ratios">
                {/* Legend */}
                <div className="flex justify-end mb-2">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-400 border border-green-700"></span>Good</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-300 border border-yellow-700"></span>Caution</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-400 border border-red-700"></span>Needs Attention</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gray-200 border border-gray-400"></span>N/A</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Expanded Ratio Cards */}
                  {(() => {
                    // Helper to get values from statements
                    const getValue = (items, label) => {
                      if (!items) return undefined;
                      const item = items.find((li) => li.label.toLowerCase() === label.toLowerCase());
                      return item && Array.isArray(item.values) ? item.values[0] : undefined;
                    };
                    const income = calculationResults.income_statement;
                    const balance = calculationResults.balance_sheet;
                    const cashFlow = calculationResults.cash_flow;
                    const kpis = calculationResults.kpis || {};
                    // Extract values
                    const revenue = getValue(income?.line_items, 'Revenue');
                    const cogs = getValue(income?.line_items, 'Cost of Goods Sold (COGS)') ?? getValue(income?.line_items, 'COGS');
                    const grossProfit = getValue(income?.line_items, 'Gross Profit');
                    const operatingExpenses = getValue(income?.line_items, 'Operating Expenses');
                    const ebit = getValue(income?.line_items, 'EBIT');
                    const interestExpense = getValue(income?.line_items, 'Interest Expense');
                    const netIncome = getValue(income?.line_items, 'Net Income');
                    const totalAssets = getValue(balance?.line_items, 'Total Assets');
                    const totalEquity = getValue(balance?.line_items, 'Total Equity');
                    const totalLiabilities = getValue(balance?.line_items, 'Total Liabilities');
                    const cash = getValue(balance?.line_items, 'Cash');
                    const inventory = getValue(balance?.line_items, 'Inventory');
                    const accountsReceivable = getValue(balance?.line_items, 'Accounts Receivable');
                    const accountsPayable = getValue(balance?.line_items, 'Accounts Payable');
                    const currentAssets = getValue(balance?.line_items, 'Total Current Assets');
                    const currentLiabilities = getValue(balance?.line_items, 'Total Current Liabilities');
                    // Calculate ratios
                    const quickRatio = currentLiabilities ? ((currentAssets - (inventory ?? 0)) / currentLiabilities) : undefined;
                    const cashRatio = currentLiabilities ? (cash / currentLiabilities) : undefined;
                    const assetTurnover = totalAssets ? (revenue / totalAssets) : undefined;
                    const inventoryTurnover = inventory ? (cogs / inventory) : undefined;
                    const receivablesTurnover = accountsReceivable ? (revenue / accountsReceivable) : undefined;
                    const payablesTurnover = accountsPayable ? (cogs / accountsPayable) : undefined;
                    const interestCoverage = interestExpense && interestExpense !== 0 ? (ebit / interestExpense) : undefined;
                    const equityMultiplier = totalEquity ? (totalAssets / totalEquity) : undefined;
                    const roce = (totalAssets && currentLiabilities) ? (ebit / (totalAssets - currentLiabilities)) * 100 : undefined;
                    const grossProfitRatio = revenue ? (grossProfit / revenue) * 100 : undefined;
                    // Helper for status and color
                    const getStatus = (value, good, caution, reverse = false) => {
                      if (value === undefined || value === null || isNaN(value)) return 'N/A';
                      if (!reverse) {
                        if (value >= good) return 'Good';
                        if (value >= caution) return 'Caution';
                        return 'Needs Attention';
                      } else {
                        if (value <= good) return 'Good';
                        if (value <= caution) return 'Caution';
                        return 'Needs Attention';
                      }
                    };
                    const getCardColor = (status) => {
                      if (status === 'Good') return 'bg-green-200/60 border-green-300 text-green-800';
                      if (status === 'Caution') return 'bg-yellow-200/60 border-yellow-500 text-yellow-900';
                      if (status === 'Needs Attention') return 'bg-red-400/30 border-red-500 text-red-900';
                      return 'bg-gray-200 border-gray-400 text-gray-500';
                    };
                    // All ratios to display
                    const ratios = [
                      // Core
                      { label: 'Gross Margin', value: kpis.gross_margin, status: getStatus(kpis.gross_margin, 45, 30), insight: kpis.gross_margin >= 45 ? 'Strong margin. You retain a healthy portion of revenue after direct costs.' : kpis.gross_margin >= 30 ? 'Margin is moderate. Consider improving pricing or reducing direct costs.' : 'Low margin. Review pricing and cost structure.', icon: <BarChart2 className="h-5 w-5" /> },
                      { label: 'Operating Margin', value: kpis.operating_margin, status: getStatus(kpis.operating_margin, 15, 8), insight: kpis.operating_margin >= 15 ? 'Healthy operating margin. Operating costs are well managed.' : kpis.operating_margin >= 8 ? 'Operating margin is below optimal. Review operating expenses.' : 'Low operating margin. Take action to reduce costs.', icon: <TrendingUp className="h-5 w-5" /> },
                      { label: 'Net Margin', value: kpis.net_margin, status: getStatus(kpis.net_margin, 10, 5), insight: kpis.net_margin >= 10 ? 'Strong profitability after all expenses.' : kpis.net_margin >= 5 ? 'Net margin is moderate. Watch for rising costs.' : 'Low net margin. Review all expenses and pricing.', icon: <TrendingDown className="h-5 w-5" /> },
                      { label: 'Current Ratio', value: kpis.current_ratio, status: getStatus(kpis.current_ratio, 1.5, 1), insight: kpis.current_ratio >= 1.5 ? 'Strong liquidity. You can cover short-term obligations.' : kpis.current_ratio >= 1 ? 'Liquidity is tight. Monitor cash and receivables.' : 'Low liquidity. Risk of not meeting short-term obligations.', icon: <CreditCard className="h-5 w-5" /> },
                      { label: 'Quick Ratio', value: quickRatio, status: getStatus(quickRatio, 1, 0.7), insight: quickRatio >= 1 ? 'Quick assets can cover current liabilities.' : quickRatio >= 0.7 ? 'Quick ratio is a bit low. Monitor receivables and cash.' : 'Quick ratio is very low. Improve liquidity.', icon: <CreditCard className="h-5 w-5" /> },
                      { label: 'Cash Ratio', value: cashRatio, status: getStatus(cashRatio, 0.5, 0.2), insight: cashRatio >= 0.5 ? 'Strong cash position for obligations.' : cashRatio >= 0.2 ? 'Cash ratio is a bit low. Monitor cash reserves.' : 'Low cash ratio. Risk of cash shortfall.', icon: <CreditCard className="h-5 w-5" /> },
                      { label: 'Debt to Equity', value: kpis.debt_to_equity, status: getStatus(kpis.debt_to_equity, 0.5, 1, true), insight: kpis.debt_to_equity <= 0.5 ? 'Low leverage. Financial risk is well managed.' : kpis.debt_to_equity <= 1 ? 'Moderate leverage. Monitor debt levels.' : 'High leverage. Consider reducing debt.', icon: <Banknote className="h-5 w-5" /> },
                      { label: 'Equity Multiplier', value: equityMultiplier, status: getStatus(equityMultiplier, 2, 3, true), insight: equityMultiplier <= 2 ? 'Low leverage. Conservative capital structure.' : equityMultiplier <= 3 ? 'Moderate leverage. Monitor capital structure.' : 'High leverage. Review debt levels.', icon: <Layers className="h-5 w-5" /> },
                      { label: 'Interest Coverage', value: interestCoverage, status: getStatus(interestCoverage, 3, 1.5), insight: interestCoverage >= 3 ? 'Earnings can easily cover interest.' : interestCoverage >= 1.5 ? 'Coverage is tight. Monitor debt costs.' : 'Low coverage. Risk of not meeting interest payments.', icon: <DollarSign className="h-5 w-5" /> },
                      { label: 'ROE', value: kpis.roe, status: getStatus(kpis.roe, 12, 8), insight: kpis.roe >= 12 ? 'Strong return for shareholders.' : kpis.roe >= 8 ? 'ROE is moderate. Seek to improve profitability.' : 'Low ROE. Review profitability and capital structure.', icon: <Layers className="h-5 w-5" /> },
                      { label: 'ROA', value: kpis.roa, status: getStatus(kpis.roa, 8, 5), insight: kpis.roa >= 8 ? 'Efficient use of assets to generate profit.' : kpis.roa >= 5 ? 'ROA is moderate. Improve asset utilization.' : 'Low ROA. Review asset efficiency.', icon: <Percent className="h-5 w-5" /> },
                      { label: 'ROCE', value: roce, status: getStatus(roce, 10, 6), insight: roce >= 10 ? 'Strong return on capital employed.' : roce >= 6 ? 'ROCE is moderate. Seek to improve returns.' : 'Low ROCE. Review capital allocation.', icon: <Percent className="h-5 w-5" /> },
                      { label: 'Gross Profit Ratio', value: grossProfitRatio, status: getStatus(grossProfitRatio, 45, 30), insight: grossProfitRatio >= 45 ? 'Strong gross profit ratio.' : grossProfitRatio >= 30 ? 'Moderate gross profit ratio.' : 'Low gross profit ratio.', icon: <BarChart2 className="h-5 w-5" /> },
                      { label: 'Asset Turnover', value: assetTurnover, status: getStatus(assetTurnover, 1, 0.5), insight: assetTurnover >= 1 ? 'Efficient use of assets to generate revenue.' : assetTurnover >= 0.5 ? 'Asset turnover is moderate.' : 'Low asset turnover. Improve asset utilization.', icon: <BarChart2 className="h-5 w-5" /> },
                      { label: 'Inventory Turnover', value: inventoryTurnover, status: getStatus(inventoryTurnover, 5, 3), insight: inventoryTurnover >= 5 ? 'Inventory is turning over quickly.' : inventoryTurnover >= 3 ? 'Inventory turnover is moderate.' : 'Low inventory turnover. Review inventory management.', icon: <BarChart2 className="h-5 w-5" /> },
                      { label: 'Receivables Turnover', value: receivablesTurnover, status: getStatus(receivablesTurnover, 8, 5), insight: receivablesTurnover >= 8 ? 'Receivables are collected quickly.' : receivablesTurnover >= 5 ? 'Receivables turnover is moderate.' : 'Low receivables turnover. Review credit policy.', icon: <BarChart2 className="h-5 w-5" /> },
                      { label: 'Payables Turnover', value: payablesTurnover, status: getStatus(payablesTurnover, 6, 3), insight: payablesTurnover >= 6 ? 'Payables are paid promptly.' : payablesTurnover >= 3 ? 'Payables turnover is moderate.' : 'Low payables turnover. Review payment policy.', icon: <BarChart2 className="h-5 w-5" /> },
                    ];
                    return ratios.map((ratio) => {
                      const cardColor = getCardColor(ratio.status);
                      return (
                        <Card key={ratio.label} className={`shadow-lg border-2 ${cardColor} transition-transform hover:scale-105`}>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                              {ratio.icon}
                              <CardTitle className={`text-base font-semibold`}>{ratio.label}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="px-3 pb-2">
                            <div className={`text-3xl font-bold mb-1`}>
                              {ratio.value !== undefined && ratio.value !== null && !isNaN(ratio.value) ? `${Number(ratio.value).toFixed(2)}${ratio.label.includes('Ratio') || ratio.label === 'Debt to Equity' ? '' : '%'}` : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">{ratio.insight}</div>
                          </CardContent>
                        </Card>
                      );
                    });
                  })()}
                </div>
              </TabsContent>

              {/* 📊 Sensitivity Analysis */}
              <TabsContent value="sensitivity" className="space-y-6" data-value="sensitivity">
                {/* Loading states */}
                {(scenarioLoading || sensitivityLoading) && (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Calculating scenarios...</p>
                            </div>
                          </div>
                )}
                
                {/* Error states */}
                {(scenarioError || sensitivityError) && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <p className="text-sm text-destructive">
                      {scenarioError || sensitivityError}
                    </p>
                            </div>
                )}
                
                                 {/* Rest of the sensitivity tab content */}
                 {!scenarioLoading && !sensitivityLoading && (
                   <>
                     {/* Sub-tabs for scenario selection */}
                     <Tabs value={sensitivityScenario} onValueChange={setSensitivityScenario} className="w-full mb-4">
                       <TabsList>
                         <TabsTrigger value="base">Base Case</TabsTrigger>
                         <TabsTrigger value="best">Best Case</TabsTrigger>
                         <TabsTrigger value="worst">Worst Case</TabsTrigger>
                       </TabsList>
                     </Tabs>
                     <Accordion type="single" collapsible defaultValue={undefined} className="w-full">
                       <AccordionItem value="sensitivity-inputs">
                         <AccordionTrigger className="text-base font-semibold">Sensitivity Inputs</AccordionTrigger>
                         <AccordionContent>
                           <Card className="shadow-none border-none p-0">
                             <CardContent className="p-0">
                               <div className="flex flex-col gap-2">
                                 {/* Revenue Growth (%) */}
                                 <div className="flex items-center gap-2">
                                   <Label htmlFor="slider-revenueGrowth" className="w-40 text-xs">Revenue Growth (%)</Label>
                                   <Slider
                                     id="slider-revenueGrowth"
                                     min={-20}
                                     max={40}
                                     step={1}
                                     value={[sensitivityValues[sensitivityScenario].revenueGrowth]}
                                     onValueChange={([v]) => handleSliderChange('revenueGrowth', String(v))}
                                     className="flex-1"
                                   />
                                   <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold min-w-[32px] text-center">{sensitivityValues[sensitivityScenario].revenueGrowth}%</span>
                          </div>
                                 {/* Operating Margin (%) */}
                                 <div className="flex items-center gap-2">
                                   <Label htmlFor="slider-operatingMargin" className="w-40 text-xs">Operating Margin (%)</Label>
                                   <Slider
                                     id="slider-operatingMargin"
                                     min={0}
                                     max={60}
                                     step={1}
                                     value={[sensitivityValues[sensitivityScenario].operatingMargin]}
                                     onValueChange={([v]) => handleSliderChange('operatingMargin', String(v))}
                                     className="flex-1"
                                   />
                                   <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold min-w-[32px] text-center">{sensitivityValues[sensitivityScenario].operatingMargin}%</span>
                        </div>

                                 {/* CapEx (%) */}
                                 <div className="flex items-center gap-2">
                                   <Label htmlFor="slider-capex" className="w-40 text-xs">CapEx (%)</Label>
                                   <Slider
                                     id="slider-capex"
                                     min={0}
                                     max={30}
                                     step={1}
                                     value={[sensitivityValues[sensitivityScenario].capex]}
                                     onValueChange={([v]) => handleSliderChange('capex', String(v))}
                                     className="flex-1"
                                   />
                                   <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold min-w-[32px] text-center">{sensitivityValues[sensitivityScenario].capex}%</span>
                            </div>
                                 {/* Working Capital Assumptions (days) */}
                                 <div className="flex items-center gap-2">
                                   <Label htmlFor="slider-workingCapitalDays" className="w-40 text-xs">Working Capital (Days)</Label>
                                   <Slider
                                     id="slider-workingCapitalDays"
                                     min={0}
                                     max={120}
                                     step={1}
                                     value={[sensitivityValues[sensitivityScenario].workingCapitalDays]}
                                     onValueChange={([v]) => handleSliderChange('workingCapitalDays', String(v))}
                                     className="flex-1"
                                   />
                                   <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold min-w-[32px] text-center">{sensitivityValues[sensitivityScenario].workingCapitalDays}d</span>
                            </div>
                                 {/* Tax Rate (%) */}
                                 <div className="flex items-center gap-2">
                                   <Label htmlFor="slider-taxRate" className="w-40 text-xs">Tax Rate (%)</Label>
                                   <Slider
                                     id="slider-taxRate"
                                     min={0}
                                     max={50}
                                     step={1}
                                     value={[sensitivityValues[sensitivityScenario].taxRate]}
                                     onValueChange={([v]) => handleSliderChange('taxRate', String(v))}
                                     className="flex-1"
                                   />
                                   <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold min-w-[32px] text-center">{sensitivityValues[sensitivityScenario].taxRate}%</span>
                            </div>
                                 {/* WACC (Discount Rate %) */}
                                 <div className="flex items-center gap-2">
                                   <Label htmlFor="slider-wacc" className="w-40 text-xs">WACC (Discount Rate %)</Label>
                                   <Slider
                                     id="slider-wacc"
                                     min={0}
                                     max={25}
                                     step={0.1}
                                     value={[sensitivityValues[sensitivityScenario].wacc]}
                                     onValueChange={([v]) => handleSliderChange('wacc', String(v))}
                                     className="flex-1"
                                   />
                                   <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold min-w-[32px] text-center">{sensitivityValues[sensitivityScenario].wacc}%</span>
                          </div>
                                 {/* Terminal Growth Rate (%) */}
                                 <div className="flex items-center gap-2">
                                   <Label htmlFor="slider-terminalGrowth" className="w-40 text-xs">Terminal Growth Rate (%)</Label>
                                   <Slider
                                     id="slider-terminalGrowth"
                                     min={-5}
                                     max={10}
                                     step={0.1}
                                     value={[sensitivityValues[sensitivityScenario].terminalGrowth]}
                                     onValueChange={([v]) => handleSliderChange('terminalGrowth', String(v))}
                                     className="flex-1"
                                   />
                                   <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-xs font-semibold min-w-[32px] text-center">{sensitivityValues[sensitivityScenario].terminalGrowth}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                         </AccordionContent>
                       </AccordionItem>
                     </Accordion>
                     {/* KPI Cards for selected scenario */}
                     <div className="flex gap-3 mb-4 overflow-x-auto whitespace-nowrap">
                       {/* NPV */}
                       <Card className={`flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center ${getKpiColor('NPV', getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'npv', calculationResults, sensitivityValues))}`}>
                         <CardHeader className="p-0 mb-1 flex flex-col items-center">
                           <DollarSign className="h-5 w-5 text-primary mb-1" />
                           <CardTitle className="text-xs font-semibold">NPV</CardTitle>
                    </CardHeader>
                         <CardContent className="p-0">
                           <div className={`text-lg font-bold`}>{formatNPV(getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'npv', calculationResults, sensitivityValues))}</div>
                    </CardContent>
                  </Card>
                       {/* IRR */}
                       <Card className={`flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center ${getKpiColor('IRR', getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'irr', calculationResults, sensitivityValues))}`}>
                         <CardHeader className="p-0 mb-1 flex flex-col items-center">
                           <TrendingUp className="h-5 w-5 text-primary mb-1" />
                           <CardTitle className="text-xs font-semibold">IRR</CardTitle>
                    </CardHeader>
                         <CardContent className="p-0">
                           <div className={`text-lg font-bold`}>{safeToFixed(getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'irr', calculationResults, sensitivityValues) !== null ? getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'irr', calculationResults, sensitivityValues) * 100 : undefined, 1)}%</div>
                    </CardContent>
                  </Card>
                       {/* Payback Period */}
                       <Card className={`flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center ${getKpiColor('Payback', getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'payback_period', calculationResults, sensitivityValues))}`}>
                         <CardHeader className="p-0 mb-1 flex flex-col items-center">
                           <Calendar className="h-5 w-5 text-primary mb-1" />
                           <CardTitle className="text-xs font-semibold">Payback Period</CardTitle>
                    </CardHeader>
                         <CardContent className="p-0">
                                               <div className="text-lg font-bold">{(() => {
                      const paybackPeriod = getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'payback_period', calculationResults, sensitivityValues);
                      if (paybackPeriod === null || paybackPeriod === undefined || paybackPeriod === 999) {
                        return 'Never';
                      }
                      if (paybackPeriod === 0) {
                        return 'Immediate';
                      }
                      return `${paybackPeriod.toFixed(1)}Y`;
                    })()}</div>
                    </CardContent>
                  </Card>
                       {/* Cumulative FCF */}
                       <Card className={`flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center ${getKpiColor('Cumulative FCF', getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'cumulative_fcf', calculationResults, sensitivityValues))}`}>
                         <CardHeader className="p-0 mb-1 flex flex-col items-center">
                           <BarChart2 className="h-5 w-5 text-primary mb-1" />
                           <CardTitle className="text-xs font-semibold">Cumulative FCF</CardTitle>
                  </CardHeader>
                         <CardContent className="p-0">
                           <div className="text-lg font-bold">{formatCurrency(getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'cumulative_fcf', calculationResults, sensitivityValues))}</div>
                         </CardContent>
                       </Card>
                       {/* Year 1 Revenue */}
                       <Card className={`flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center ${getKpiColor('Year 1 Revenue', getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'year_1_revenue', calculationResults, sensitivityValues))}`}>
                         <CardHeader className="p-0 mb-1 flex flex-col items-center">
                           <DollarSign className="h-5 w-5 text-primary mb-1" />
                           <CardTitle className="text-xs font-semibold">Year 1 Revenue</CardTitle>
                         </CardHeader>
                         <CardContent className="p-0">
                           <div className="text-lg font-bold">{formatCurrency(getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'year_1_revenue', calculationResults, sensitivityValues))}</div>
                         </CardContent>
                       </Card>
                       {/* Year 5 Revenue */}
                       <Card className={`flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center ${getKpiColor('Year 5 Revenue', getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'year_5_revenue', calculationResults, sensitivityValues))}`}>
                         <CardHeader className="p-0 mb-1 flex flex-col items-center">
                           <DollarSign className="h-5 w-5 text-primary mb-1" />
                           <CardTitle className="text-xs font-semibold">Year 5 Revenue</CardTitle>
                         </CardHeader>
                         <CardContent className="p-0">
                           <div className="text-lg font-bold">{formatCurrency(getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'year_5_revenue', calculationResults, sensitivityValues))}</div>
                         </CardContent>
                       </Card>
                       {/* Gross Margin */}
                       <Card className={`flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center ${getKpiColor('Gross Margin', getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'year_1_gross_margin', calculationResults, sensitivityValues))}`}>
                         <CardHeader className="p-0 mb-1 flex flex-col items-center">
                           <Percent className="h-5 w-5 text-primary mb-1" />
                           <CardTitle className="text-xs font-semibold">Gross Margin</CardTitle>
                         </CardHeader>
                         <CardContent className="p-0">
                           <div className="text-lg font-bold">{safeToFixed(getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'year_1_gross_margin', calculationResults, sensitivityValues), 1)}%</div>
                         </CardContent>
                       </Card>
                       {/* Net Margin */}
                       <Card className={`flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center ${getKpiColor('Net Margin', getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'year_1_net_margin', calculationResults, sensitivityValues))}`}>
                         <CardHeader className="p-0 mb-1 flex flex-col items-center">
                           <Percent className="h-5 w-5 text-primary mb-1" />
                           <CardTitle className="text-xs font-semibold">Net Margin</CardTitle>
                         </CardHeader>
                         <CardContent className="p-0">
                           <div className="text-lg font-bold">{safeToFixed(getScenarioKpi(sensitivityScenario as 'base' | 'best' | 'worst', 'year_1_net_margin', calculationResults, sensitivityValues), 1)}%</div>
                         </CardContent>
                       </Card>
                      </div>
                     {/* Scenario Comparison Table and Chart Row */}
                     <div className="flex flex-col md:flex-row gap-4 mb-6">
                       {/* Scenario Comparison Table (50%) */}
                       <div className="md:w-1/2 w-full min-h-[340px]">
                         <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto h-full">
                           <div className="font-semibold mb-2 text-sm">Scenario Comparison</div>
                           <table className="min-w-full text-xs border rounded">
                             <thead>
                               <tr>
                                 <th className="p-2 border bg-muted">KPI</th>
                                 <th className="p-2 border bg-muted">Base</th>
                                 <th className="p-2 border bg-muted">Best</th>
                                 <th className="p-2 border bg-muted">Worst</th>
                               </tr>
                             </thead>
                             <tbody>
                               {[
                                 { label: 'NPV', key: 'npv', format: formatNPV },
                                 { label: 'IRR', key: 'irr', format: v => safeToFixed(v * 100, 1) + '%' },
                                 { label: 'Payback', key: 'payback_period', format: v => {
                                   if (v === null || v === undefined || v === 999) {
                                     return 'Never';
                                   }
                                   if (v === 0) {
                                     return 'Immediate';
                                   }
                                   return safeToFixed(v, 1) + 'Y';
                                 }},
                                 { label: 'Year 1 Revenue', key: 'year_1_revenue', format: formatCurrency },
                                 { label: 'Year 5 Revenue', key: 'year_5_revenue', format: formatCurrency },
                                 { label: 'Gross Margin', key: 'year_1_gross_margin', format: v => safeToFixed(v, 1) + '%' },
                                 { label: 'Net Margin', key: 'year_1_net_margin', format: v => safeToFixed(v, 1) + '%' },
                                 { label: 'Cumulative FCF', key: 'cumulative_fcf', format: formatCurrency },
                               ].map(row => {
                                 // Get values for each scenario
                                 const base = getScenarioKpi('base', row.key, calculationResults, sensitivityValues);
                                 const best = getScenarioKpi('best', row.key, calculationResults, sensitivityValues);
                                 const worst = getScenarioKpi('worst', row.key, calculationResults, sensitivityValues);
                                 // Find best/worst for highlighting
                                 const values = [base, best, worst];
                                 const isHigherBetter = ['npv', 'irr', 'year_1_revenue', 'year_5_revenue', 'year_1_gross_margin', 'year_1_net_margin', 'cumulative_fcf'].includes(row.key);
                                 const bestVal = isHigherBetter ? Math.max(...values.filter(v => v !== null && v !== undefined)) : Math.min(...values.filter(v => v !== null && v !== undefined));
                                 const worstVal = isHigherBetter ? Math.min(...values.filter(v => v !== null && v !== undefined)) : Math.max(...values.filter(v => v !== null && v !== undefined));
                                 return (
                                   <tr key={row.key}>
                                     <td className="p-2 border font-medium text-muted-foreground">{row.label}</td>
                                     {[base, best, worst].map((val, i) => (
                                       <td
                                         key={i}
                                         className={`p-2 border text-center font-semibold ${val === bestVal ? 'bg-green-50 text-green-700' : ''} ${val === worstVal ? 'bg-red-50 text-red-700' : ''}`}
                                       >
                                         {val === null || val === undefined || isNaN(val) ? 'N/A' : row.format(val)}
                                       </td>
                                     ))}
                                   </tr>
                                 );
                               })}
                             </tbody>
                           </table>
                      </div>
                      </div>
                       {/* Scenario Comparison Chart (50%) */}
                       <div className="md:w-1/2 w-full min-h-[340px] flex items-center justify-center">
                         <div className="w-full h-full bg-card rounded-lg border shadow-sm flex items-center justify-center p-4">
                           <ResponsiveContainer width="100%" height="100%">
                             <BarChart
                               data={getScenarioChartData(calculationResults, sensitivityValues)}
                               margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                               barCategoryGap={"20%"}
                               barGap={2}
                             >
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis dataKey="name" fontSize={12} />
                               <YAxis fontSize={12} />
                               <Tooltip formatter={(value: number, name: string) => name === 'IRR' ? `${safeToFixed(value, 1)}%` : `$${value.toLocaleString()}`} />
                               <Legend />
                               <Bar dataKey="npv" fill="#16a34a" name="NPV" />
                               <Bar dataKey="irr" fill="#0ea5e9" name="IRR" />
                               <Bar dataKey="netIncome" fill="#f59e42" name="Net Income" />
                             </BarChart>
                           </ResponsiveContainer>
                    </div>
                        </div>
                        </div>
                     {/* Cash Flow Visualization Section */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                       {/* FCF Line Chart */}
                       <Card className="p-4 flex flex-col h-[320px]">
                         <CardHeader className="p-0 mb-2">
                           <CardTitle className="text-sm font-semibold">Free Cash Flow (FCF) Over Time</CardTitle>
                           <CardDescription className="text-xs">Projected FCF for each year (Base, Best, Worst)</CardDescription>
                         </CardHeader>
                         <CardContent className="flex-1 p-0">
                           <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={getScenarioFcfChartData(calculationResults)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis dataKey="year" fontSize={12} />
                               <YAxis fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                               <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                               <Legend />
                               <Line type="monotone" dataKey="Base Case" stroke="#0ea5e9" strokeWidth={2} name="Base" />
                               <Line type="monotone" dataKey="Best Case" stroke="#16a34a" strokeWidth={2} name="Best" />
                               <Line type="monotone" dataKey="Worst Case" stroke="#ef4444" strokeWidth={2} name="Worst" />
                             </LineChart>
                           </ResponsiveContainer>
                         </CardContent>
                       </Card>
                       {/* Stacked Area Chart: Revenue, Expenses, Net Income */}
                       <Card className="p-4 flex flex-col h-[320px]">
                         <CardHeader className="p-0 mb-2">
                           <CardTitle className="text-sm font-semibold">Revenue, Expenses, Net Income Over Time</CardTitle>
                           <CardDescription className="text-xs">{sensitivityScenario.charAt(0).toUpperCase() + sensitivityScenario.slice(1)} Case Scenario</CardDescription>
                         </CardHeader>
                         <CardContent className="flex-1 p-0">
                           <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={getScenarioRevenueExpenseChartData(calculationResults, sensitivityScenario)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis dataKey="year" fontSize={12} />
                               <YAxis fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                               <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                               <Legend />
                               <Area type="monotone" dataKey="Revenue" stackId="1" stroke="#0ea5e9" fill="#bae6fd" name="Revenue" />
                               <Area type="monotone" dataKey="Expenses" stackId="1" stroke="#ef4444" fill="#fecaca" name="Expenses" />
                               <Area type="monotone" dataKey="Net Income" stackId="1" stroke="#16a34a" fill="#bbf7d0" name="Net Income" />
                             </AreaChart>
                           </ResponsiveContainer>
                         </CardContent>
                       </Card>
                        </div>
                     {/* Risk & Probability Analysis Section */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 mb-4">
                       {/* Probability Gauges */}
                       <Card className="p-4 flex flex-col h-[286px] items-center justify-center">
                         <CardHeader className="p-0 mb-2">
                           <CardTitle className="text-sm font-semibold">Risk & Probability Analysis</CardTitle>
                           <CardDescription className="text-xs">
                             {riskAnalysisLoading ? 'Calculating probabilities...' : 
                              riskAnalysisError ? 'Error loading data' : 
                              'Based on Monte Carlo simulation'}
                           </CardDescription>
                         </CardHeader>
                         <CardContent className="flex-1 flex flex-col gap-4 items-center justify-center p-0">
                           {riskAnalysisLoading ? (
                             <div className="text-muted-foreground">Loading risk analysis...</div>
                           ) : riskAnalysisError ? (
                             <div className="text-destructive">{riskAnalysisError}</div>
                           ) : (
                             <div className="flex gap-6">
                               <div className="flex flex-col items-center">
                                 <span className="text-xs mb-1">Positive NPV</span>
                                 <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-lg font-bold border-2 border-green-400">
                                   {riskAnalysisData?.positive_npv_probability || 0}%
                                 </div>
                               </div>
                               <div className="flex flex-col items-center">
                                 <span className="text-xs mb-1">IRR &gt; 15%</span>
                                 <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold border-2 border-blue-400">
                                   {riskAnalysisData?.irr_above_threshold_probability || 0}%
                                 </div>
                               </div>
                               <div className="flex flex-col items-center">
                                 <span className="text-xs mb-1">Probability of Loss</span>
                                 <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-lg font-bold border-2 border-red-400">
                                   {riskAnalysisData?.probability_of_loss || 0}%
                                 </div>
                               </div>
                             </div>
                           )}
                         </CardContent>
                       </Card>
                       {/* Monte Carlo Simulation Histogram (live) */}
                       <Card className="p-4 flex flex-col h-[286px] items-center justify-center">
                         <CardHeader className="p-0 mb-2">
                           <CardTitle className="text-sm font-semibold">Monte Carlo Simulation</CardTitle>
                           <CardDescription className="text-xs">Distribution of NPV (live)</CardDescription>
                         </CardHeader>
                         <CardContent className="flex-1 flex items-center justify-center p-0 w-full">
                           {monteCarloLoading ? (
                             <div className="text-muted-foreground">Loading simulation...</div>
                           ) : monteCarloError ? (
                             <div className="text-destructive">{monteCarloError}</div>
                           ) : (
                             <ResponsiveContainer width="100%" height={120}>
                               <BarChart data={monteCarloData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                 <CartesianGrid strokeDasharray="3 3" />
                                 <XAxis dataKey="bin" fontSize={11} />
                                 <YAxis fontSize={11} />
                                 <Tooltip formatter={(value: number) => `${value} runs`} />
                                 <Bar dataKey="count" fill="#0ea5e9" name="Runs" />
                               </BarChart>
                             </ResponsiveContainer>
                           )}
                         </CardContent>
                       </Card>
                     </div>
                   </>
                 )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

function HorizontalAnalysisTable({ calculationResults }: { calculationResults: any }) {
  // Example: Income Statement horizontal analysis
  const statement = calculationResults?.income_statement || calculationResults?.incomeStatement;
  if (!statement || !statement.years || !statement.line_items) return <div>No data for horizontal analysis.</div>;
  const years = statement.years;
  const items = statement.line_items;
  // Calculate YoY % change for each item
  const getChange = (values: number[]) => values.map((v, i) => i === 0 ? null : ((v - values[i-1]) / Math.abs(values[i-1] || 1)) * 100);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border">
        <thead>
          <tr>
            <th className="p-2 border">Line Item</th>
            {years.map((year: string) => <th key={year} className="p-2 border">{year}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => {
            const changes = getChange(item.values);
            return (
              <tr key={item.label}>
                <td className="p-2 border font-medium">{item.label}</td>
                {item.values.map((v: number, i: number) => (
                  <td key={i} className="p-2 border text-center">{i === 0 ? '-' : `${changes[i]?.toFixed(1)}%`}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VerticalAnalysisTable({ calculationResults }: { calculationResults: any }) {
  // Example: Income Statement vertical analysis
  const statement = calculationResults?.income_statement || calculationResults?.incomeStatement;
  if (!statement || !statement.years || !statement.line_items) return <div>No data for vertical analysis.</div>;
  const years = statement.years;
  const items = statement.line_items;
  // Find revenue for each year
  const revenueItem = items.find((item: any) => item.label.toLowerCase() === 'revenue');
  const revenue = revenueItem ? revenueItem.values : years.map(() => 1);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border">
        <thead>
          <tr>
            <th className="p-2 border">Line Item</th>
            {years.map((year: string) => <th key={year} className="p-2 border">{year}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr key={item.label}>
              <td className="p-2 border font-medium">{item.label}</td>
              {item.values.map((v: number, i: number) => (
                <td key={i} className="p-2 border text-center">{revenue[i] ? `${((v / revenue[i]) * 100).toFixed(1)}%` : '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WaterfallChart({ cashFlow }: { cashFlow: any[] }) {
  // Use the latest period (last item)
  const period = Array.isArray(cashFlow) && cashFlow.length > 0 ? cashFlow[cashFlow.length - 1] : null;
  if (!period) return <div className="text-muted-foreground">No cash flow data</div>;
  // Extract values
  const operating = period.net_cash_from_operating_activities || 0;
  // CapEx is usually negative investing activities; sum negative investing items
  const capex = Array.isArray(period.investing_activities)
    ? period.investing_activities.filter((item: [string, number]) => /capex|equipment|purchase|fixed asset/i.test(item[0])).reduce((sum: number, item: [string, number]) => sum + item[1], 0)
    : period.net_cash_from_investing_activities || 0;
  const financing = period.net_cash_from_financing_activities || 0;
  const net = period.net_change_in_cash || (operating + capex + financing);
  // Waterfall steps
  const data = [
    { name: 'Operating', value: operating },
    { name: 'CapEx', value: capex },
    { name: 'Financing', value: financing },
    { name: 'Net Cash Flow', value: net },
  ];
  // Cumulative for waterfall effect
  let cumulative = 0;
  const waterfallData = data.map((d, i) => {
    const prev = cumulative;
    cumulative += d.value;
    return {
      ...d,
      start: i === 0 ? 0 : prev,
      end: cumulative,
      color: d.name === 'CapEx' ? '#dc2626' : d.name === 'Financing' ? '#2563eb' : d.name === 'Operating' ? '#16a34a' : '#a21caf',
    };
  });
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
        <Bar dataKey="value" fill="#0ea5e9">
          {waterfallData.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CapitalStructurePie({ balanceSheet }: { balanceSheet: any }) {
  if (!balanceSheet || !balanceSheet.line_items) return <div className="text-muted-foreground">No balance sheet data</div>;
  // Try to extract equity and debt from line_items
  const findValue = (label: string) => {
    const item = balanceSheet.line_items.find((li: any) => li.label.toLowerCase().includes(label.toLowerCase()));
    return item && Array.isArray(item.values) ? item.values[item.values.length - 1] : 0;
  };
  const totalEquity = findValue('Total Equity');
  const totalLiabilities = findValue('Total Liabilities');
  const shareCapital = findValue('Share Capital');
  const retainedEarnings = findValue('Retained Earnings');
  

  
  const total = totalEquity + totalLiabilities || 1;
  const data = [
    { name: 'Equity', value: totalEquity, color: '#16a34a', percent: totalEquity / total },
    { name: 'Debt', value: totalLiabilities, color: '#2563eb', percent: totalLiabilities / total },
  ];
  return (
    <div className="flex flex-col items-center">
      <PieChart width={220} height={220}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            stroke="#fff"
            label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
            labelLine={false}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-cap-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
        </PieChart>
      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {data.map((entry, idx) => (
          <div key={entry.name} className="flex items-center gap-2 min-w-[90px]">
            <span className="w-3 h-3 rounded-full block" style={{ background: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FCFTable({ forecast }: { forecast: any[] }) {
  if (!Array.isArray(forecast) || forecast.length === 0) {
    return <div className="text-muted-foreground">No forecast data available</div>;
  }
  const hasNegative = forecast.some(item => typeof item.freeCashFlow === 'number' && item.freeCashFlow < 0);
  return (
    <div className="w-full">
      <table className="min-w-full border rounded bg-background text-foreground text-sm">
        <caption className="mt-4 text-sm text-muted-foreground">Projected Free Cash Flow (FCF) for each year</caption>
        <thead>
          <tr>
            {forecast.map((item, idx) => (
              <th key={item.year || idx} className="p-4 border-b font-medium text-muted-foreground h-12 align-middle">
                {item.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {forecast.map((item, idx) => (
              <td key={item.year || idx} className="p-4 border-b text-2xl font-bold text-emerald-600 align-middle">
                {typeof item.freeCashFlow === 'number' ? `$${item.freeCashFlow.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}` : '-'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {hasNegative && (
        <div className="mt-2 text-xs text-destructive-foreground dark:text-red-400">
          Negative FCF indicates cash outflow in that year.
        </div>
      )}
    </div>
  );
}

// CashFlowSectionsChart component
function CashFlowSectionsChart({ periods, sections, insights }: { periods: any[], sections: ChartSection[], insights: any }) {
  // periods: [{ date, revenue, ebitda, cashFlow, section }]
  // sections: ['current', 'forecast'] or ['historical', 'current', 'forecast']


  // Find section boundaries for ReferenceLine
  const currEnd = periods.filter(p => p.section === 'current').length - 1;
  
  return (
    <div className="w-full">
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={periods} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            
            {/* Background color coding for sections */}
            {sections.includes('current') && (
              <ReferenceArea
                x1={periods.find(p => p.section === 'current')?.date}
                x2={periods.filter(p => p.section === 'current').slice(-1)[0]?.date}
                fill="#dc2626"
                fillOpacity={0.1}
              />
            )}
            {sections.includes('forecast') && (
              <ReferenceArea
                x1={periods.find(p => p.section === 'forecast')?.date}
                x2={periods.filter(p => p.section === 'forecast').slice(-1)[0]?.date}
                fill="#059669"
                fillOpacity={0.1}
              />
            )}
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Amount ($M)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const formatValue = `$${value}M`;
                const labels = {
                  cashFlow: 'Free Cash Flow',
                  revenue: 'Revenue', 
                  ebitda: 'EBITDA'
                };
                return [formatValue, labels[name as keyof typeof labels] || name];
              }}
              labelFormatter={(label) => `Period: ${label}`}
            />
            
            {/* Section dividers - Removed dashed forecast line */}
            
            {/* FCF as bars */}
            <Bar 
              dataKey="cashFlow" 
              fill="#14b8a6" 
              fillOpacity={0.7}
              barSize={20}
              name="cashFlow"
            />
            
            {/* Revenue line */}
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              name="revenue"
            />
            
            {/* EBITDA line */}
            <Line 
              type="monotone" 
              dataKey="ebitda" 
              stroke="#dc2626" 
              strokeWidth={3}
              dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
              name="ebitda"
            />
            
            {/* FCF line */}
            <Line 
              type="monotone" 
              dataKey="cashFlow" 
              stroke="#059669" 
              strokeWidth={3}
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              name="cashFlow"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-col gap-4 mt-4 mb-4">
        {/* Data Series Legend */}
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-teal-500 opacity-70 rounded"></div>
            <span className="text-sm text-muted-foreground">FCF (Bars)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-600 rounded"></div>
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-600 rounded"></div>
            <span className="text-sm text-muted-foreground">EBITDA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-emerald-600 rounded"></div>
            <span className="text-sm text-muted-foreground">FCF (Line)</span>
          </div>
        </div>
        
        {/* Section Background Legend */}
        <div className="flex justify-center gap-6">
          {sections.includes('current') && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 opacity-60 rounded"></div>
              <span className="text-xs text-muted-foreground">Current</span>
            </div>
          )}
          {sections.includes('forecast') && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 opacity-60 rounded"></div>
              <span className="text-xs text-muted-foreground">Forecasted</span>
            </div>
          )}
        </div>
      </div>
      {/* Section KPIs Row */}
      <div className={`grid grid-cols-1 md:grid-cols-${sections.length} gap-4 mt-4`}>
        {sections.map(section => {
          let bgClass = "bg-muted";
          let textClass = "text-foreground";

          if (section === 'current') {
            bgClass = "bg-red-50 border border-red-100";
            textClass = "text-red-900";
          } else if (section === 'forecast') {
            bgClass = "bg-green-50 border border-green-100";
            textClass = "text-green-900";
          }

          return (
            <div key={section} className={`${bgClass} rounded-lg p-4 flex flex-col items-center`}>
              <div className={`font-semibold text-sm mb-1 ${textClass}`}>{insights[section]?.vertical || '-'}</div>
              <div className="text-xs text-muted-foreground mb-2">{insights[section]?.horizontal || '-'}</div>
              <div className="text-xs text-muted-foreground">Avg Revenue: {insights[section]?.revenue || '-'}</div>
              <div className="text-xs text-muted-foreground">Avg EBITDA: {insights[section]?.ebitda || '-'}</div>
              <div className="text-xs text-muted-foreground">Avg FCF: {insights[section]?.cashFlow || '-'}</div>
              <div className="text-xs text-muted-foreground">Periods: {insights[section]?.periods || 0}</div>
            </div>
          );
        })}
      </div>
      {/* Valuation Row */}
      <div className={`grid grid-cols-1 md:grid-cols-${sections.length} gap-4 mt-2`}>
        {sections.map(section => {
          let bgClass = "bg-background";
          let textClass = "text-foreground";
          let borderClass = "border";

          if (section === 'current') {
            bgClass = "bg-red-50";
            borderClass = "border-red-100";
            textClass = "text-red-900";
          } else if (section === 'forecast') {
            bgClass = "bg-green-50";
            borderClass = "border-green-100";
            textClass = "text-green-900";
          }

          return (
            <div key={section} className={`rounded-lg p-3 flex flex-col items-center ${borderClass} ${bgClass}`}>
              <div className="text-xs text-muted-foreground">Equity Value</div>
              <div className={`font-bold text-lg ${textClass}`}>{insights[section]?.equity || '-'}</div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Value Row */}
      <div className={`grid grid-cols-1 md:grid-cols-${sections.length} gap-4 mt-2`}>
        {sections.map(section => {
          let bgClass = "bg-background";
          let textClass = "text-foreground";
          let borderClass = "border";

          if (section === 'current') {
            bgClass = "bg-red-50";
            borderClass = "border-red-100";
            textClass = "text-red-900";
          } else if (section === 'forecast') {
            bgClass = "bg-green-50";
            borderClass = "border-green-100";
            textClass = "text-green-900";
          }

          return (
            <div key={section} className={`rounded-lg p-3 flex flex-col items-center ${borderClass} ${bgClass}`}>
              <div className="text-xs text-muted-foreground">Enterprise Value</div>
              <div className={`font-bold text-lg ${textClass}`}>{insights[section]?.enterprise || '-'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Add a helper function for safe toFixed
function safeToFixed(value: number | null | undefined, digits: number) {
  return value !== undefined && value !== null && !isNaN(value) ? value.toFixed(digits) : 'N/A';
}

// Add a helper to determine KPI color class
function getKpiColor(kpi: string, value: number | undefined | null): string {
  switch (kpi) {
    case 'NPV':
    case 'Cumulative FCF':
      if (value === undefined || value === null) return 'bg-muted';
      return value > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';
    case 'IRR':
      if (value === undefined || value === null) return 'bg-muted';
      if (value < 0) return 'bg-red-50 text-red-700';
      if (value >= 0.15) return 'bg-green-50 text-green-700';
      return 'bg-yellow-50 text-yellow-700';
    case 'Payback':
      if (value === undefined || value === null) return 'bg-muted';
      if (value < 4) return 'bg-green-50 text-green-700';
      if (value <= 6) return 'bg-yellow-50 text-yellow-700';
      return 'bg-red-50 text-red-700';
    case 'Gross Margin':
    case 'Net Margin':
      if (value === undefined || value === null) return 'bg-muted';
      if (value > 20) return 'bg-green-50 text-green-700';
      if (value >= 10) return 'bg-yellow-50 text-yellow-700';
      return 'bg-red-50 text-red-700';
    case 'Year 1 Revenue':
    case 'Year 5 Revenue':
      if (value === undefined || value === null) return 'bg-muted';
      return value > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';
    default:
      return '';
  }
}

// Add a helper to determine Business Overview KPI color class
function getBusinessOverviewKpiColor(kpi: string, value: number | undefined | null): string {
  switch (kpi) {
    case 'NPV':
      if (value === undefined || value === null) return '';
      return value > 0 ? 'text-green-600' : 'text-red-600';
    case 'IRR':
      if (value === undefined || value === null) return '';
      if (value < 0) return 'text-red-600';
      if (value >= 0.15) return 'text-green-600';
      return 'text-yellow-600';
    case 'Payback Period':
      if (value === undefined || value === null || value === 999) return 'text-gray-600';
      if (value < 4) return 'text-green-600';
      if (value <= 6) return 'text-yellow-600';
      return 'text-red-600';
    case 'Asset Turnover':
      if (value === undefined || value === null) return '';
      if (value > 1.5) return 'text-green-600';
      if (value >= 0.8) return 'text-yellow-600';
      return 'text-red-600';
    case 'Equity Multiplier':
      if (value === undefined || value === null) return '';
      if (value < 2) return 'text-green-600';
      if (value <= 3) return 'text-yellow-600';
      return 'text-red-600';
    case 'ROE':
      if (value === undefined || value === null) return '';
      if (value > 0.15) return 'text-green-600';
      if (value >= 0.08) return 'text-yellow-600';
      return 'text-red-600';
    case 'WACC':
      if (value === undefined || value === null) return '';
      if (value < 0.12) return 'text-green-600';
      if (value <= 0.18) return 'text-yellow-600';
      return 'text-red-600';
    case 'Terminal Value':
      if (value === undefined || value === null) return '';
      if (value < 70) return 'text-green-600';
      if (value <= 85) return 'text-yellow-600';
      return 'text-red-600';
    default:
      return '';
  }
}
