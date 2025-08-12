import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useCalculationResult } from '@/contexts/CalculationResultContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Download,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Percent,
  Building2,
  CreditCard,
  Activity,
  UserCheck,
  Crown,
  MousePointer,
  Clock,
  TrendingUp,
  Layers,
  Calendar,
  PieChartIcon,
  Zap,
  Shield,
  Repeat,
  Calculator,
  Briefcase,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Gauge,
  LineChart,
  CircleDollarSign,
  Wallet,
  ArrowRightLeft,
  ArrowUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CalculationResult } from '@/services/api';
import { exportDashboardToPDF } from '@/services/pdfExport';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend, LabelList, ReferenceLine, Area, PieChart, Pie, Cell } from 'recharts';
import SensitivityHeatmap from '@/components/SensitivityHeatmap';
import TornadoChart from '@/components/TornadoChart';

// Define color palette
const PRIMARY_COLOR = 'hsl(170, 70%, 45%)'; // Teal/Green
const SECONDARY_COLOR = 'hsl(20, 90%, 60%)'; // Orange
const SUCCESS_COLOR = 'hsl(142, 76%, 36%)'; // Green
const WARNING_COLOR = 'hsl(38, 92%, 50%)'; // Yellow
const DANGER_COLOR = 'hsl(0, 84%, 60%)'; // Red
const INFO_COLOR = 'hsl(199, 89%, 48%)'; // Blue
const EXPENSE_COLOR = 'hsl(0, 84%, 60%)'; // Red for expenses

// Dashboard tabs configuration
const HISTORICAL_DASHBOARD_TABS = [
  { value: 'overview', label: 'Business Overview', icon: Building2 },
  { value: 'ratios', label: 'Ratio Analysis', icon: BarChart3 },
  { value: 'analysis', label: 'Horizontal & Vertical Analysis', icon: ArrowRightLeft },
  { value: 'sensitivity', label: 'Sensitivity Analysis', icon: Layers },
];

// Scalable sensitivity parameters by company type
const SENSITIVITY_PARAMETERS = {
  service: {
    revenueGrowth: { label: 'Revenue Growth Rate', unit: '%', base: 0, best: 15, worst: -15 },
    clientRetention: { label: 'Client Retention Rate', unit: '%', base: 0, best: 10, worst: -10 },
    operatingMargin: { label: 'Operating Margin', unit: '%', base: 0, best: 5, worst: -5 },
    taxRate: { label: 'Tax Rate', unit: '%', base: 0, best: -5, worst: 5 },
    workingCapitalDays: { label: 'Working Capital Days', unit: ' days', base: 0, best: -15, worst: 15 },
    wacc: { label: 'WACC/Discount Rate', unit: '%', base: 0, best: -2, worst: 2 },
    terminalGrowth: { label: 'Terminal Growth Rate', unit: '%', base: 0, best: 1, worst: -1 }
  },
  manufacturing: {
    revenueGrowth: { label: 'Revenue Growth Rate', unit: '%', base: 0, best: 15, worst: -15 },
    grossMargin: { label: 'Gross Margin', unit: '%', base: 0, best: 8, worst: -8 },
    capacityUtilization: { label: 'Capacity Utilization', unit: '%', base: 0, best: 20, worst: -20 },
    workingCapitalDays: { label: 'Working Capital Days', unit: 'days', base: 0, best: -10, worst: 10 },
    capexPercent: { label: 'CapEx as % of Revenue', unit: '%', base: 0, best: -25, worst: 25 },
    wacc: { label: 'WACC/Discount Rate', unit: '%', base: 0, best: -2, worst: 2 },
    terminalGrowth: { label: 'Terminal Growth Rate', unit: '%', base: 0, best: 1, worst: -1 }
  },
  tech: {
    revenueGrowth: { label: 'Revenue Growth Rate', unit: '%', base: 0, best: 25, worst: -25 },
    cac: { label: 'Customer Acquisition Cost', unit: '%', base: 0, best: -30, worst: 30 },
    clv: { label: 'Customer Lifetime Value', unit: '%', base: 0, best: 25, worst: -25 },
    churnRate: { label: 'Churn Rate', unit: '%', base: 0, best: -20, worst: 20 },
    grossMargin: { label: 'Gross Margin', unit: '%', base: 0, best: 5, worst: -5 },
    wacc: { label: 'WACC/Discount Rate', unit: '%', base: 0, best: -2, worst: 2 },
    terminalGrowth: { label: 'Terminal Growth Rate', unit: '%', base: 0, best: 1.5, worst: -1.5 }
  }
};

// Helper function to get sensitivity parameters for current company type
const getSensitivityParameters = (companyType: string = 'service') => {
  return SENSITIVITY_PARAMETERS[companyType as keyof typeof SENSITIVITY_PARAMETERS] || SENSITIVITY_PARAMETERS.service;
};

// Debt to Equity Ratio Bar Component
const DebtToEquityBar: React.FC<{ calculationResult: CalculationResult | null }> = ({ calculationResult }) => {
  if (!calculationResult) {
    return (
      <div className="flex items-center justify-center h-16">
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  // Extract debt-to-equity ratio from dashboard KPIs (real calculated data)
  let debtToEquityRatio = calculationResult.dashboard_kpis?.debt_to_equity ||
    calculationResult.kpis?.debt_to_equity || 0;

  // If the ratio is 0 but we have balance sheet data, calculate it manually
  if (debtToEquityRatio === 0 && calculationResult.balance_sheet) {
    const totalLiabilities = calculationResult.balance_sheet.line_items?.find(item => 
      item.label === 'TOTAL LIABILITIES'
    );
    const totalEquity = calculationResult.balance_sheet.line_items?.find(item => 
      item.label === 'TOTAL EQUITY'
    );
    
    if (totalLiabilities && totalEquity && totalLiabilities.values && totalEquity.values) {
      // Use base year (current year) data instead of latest forecast year
      // If yearsInBusiness = 2, then years[1] = 2025 (base year), years[0] = 2024 (historical)
      const yearsInBusiness = 2; // This should come from the form data, but hardcoded for now
      const baseYearIdx = yearsInBusiness - 1; // Index 1 = 2025 (base year)
      
      const baseYearLiabilities = totalLiabilities.values[baseYearIdx] || 0;
      const baseYearEquity = totalEquity.values[baseYearIdx] || 0;
      
      if (baseYearEquity !== 0) {
        debtToEquityRatio = baseYearLiabilities / baseYearEquity;
        console.log('=== MANUAL DEBT TO EQUITY CALCULATION (Base Year) ===');
        console.log('Base Year Index:', baseYearIdx);
        console.log('Base Year Liabilities:', baseYearLiabilities);
        console.log('Base Year Equity:', baseYearEquity);
        console.log('Calculated D/E ratio:', debtToEquityRatio);
      }
    }
  }

  // Show final debt to equity ratio value
  console.log('Debt to Equity Ratio:', debtToEquityRatio);

  // Calculate debt and equity percentages for visualization
  // D/E ratio = Total Debt / Total Equity
  // To show as percentages: Debt% = D/(D+E), Equity% = E/(D+E)
  const totalDebtEquity = debtToEquityRatio + 1; // D/E + 1 = (D+E)/E
  const debtPercentage = Math.min(Math.max((debtToEquityRatio / totalDebtEquity) * 100, 0), 100);
  const equityPercentage = Math.min(Math.max((1 / totalDebtEquity) * 100, 0), 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Debt to Equity Ratio</h3>
        <span className="text-sm font-bold text-foreground">{debtToEquityRatio.toFixed(2)}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
        <div className="h-full flex">
          {/* Equity portion (green) */}
          <div
            className="bg-green-500 h-full flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
            style={{ width: `${equityPercentage}%` }}
          >
            {equityPercentage > 15 && `${equityPercentage.toFixed(0)}% Equity`}
          </div>
          {/* Debt portion (red) */}
          <div
            className="bg-red-500 h-full flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
            style={{ width: `${debtPercentage}%` }}
          >
            {debtPercentage > 15 && `${debtPercentage.toFixed(0)}% Debt`}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          Equity
        </span>
        <span className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
          Debt
        </span>
      </div>
    </div>
  );
};

// Revenue vs Expense Chart Component
const RevenueVsExpenseChart: React.FC<{ calculationResult: CalculationResult | null }> = ({ calculationResult }) => {
  if (!calculationResult) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Extract data from calculation result
  const incomeStatement = calculationResult.income_statement;
  const years = incomeStatement?.years || [];
  const lineItems = incomeStatement?.line_items || [];

  // Debug: Log the data structure
  console.log('=== REVENUE VS EXPENSE CHART - DATA EXTRACTION ===');
  console.log('Income statement keys:', Object.keys(incomeStatement || {}));
  console.log('Years array:', years);
  console.log('Line items count:', lineItems?.length || 0);
  console.log('First few line items:', lineItems?.slice(0, 5).map(item => ({
    label: item.label,
    values: item.values?.slice(0, 3) // Show first 3 values
  })));

  // Validate data structure
  if (!incomeStatement) {
    console.error('❌ No income statement found in calculationResult');
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Income statement data not found</p>
          <p className="text-xs text-muted-foreground">Available keys: {Object.keys(calculationResult).join(', ')}</p>
        </div>
      </div>
    );
  }

  if (!years || years.length === 0) {
    console.error('❌ No years found in income statement');
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No year data found</p>
          <p className="text-xs text-muted-foreground">Income statement keys: {Object.keys(incomeStatement).join(', ')}</p>
        </div>
      </div>
    );
  }

  if (!lineItems || lineItems.length === 0) {
    console.error('❌ No line items found in income statement');
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No line items found</p>
          <p className="text-xs text-muted-foreground">Income statement keys: {Object.keys(incomeStatement).join(', ')}</p>
        </div>
      </div>
    );
  }

  // More robust revenue detection - try multiple possible labels and patterns
  let revenueItem = null;
  
  // First, try to find the actual revenue line item (most accurate)
  revenueItem = lineItems.find((item: any) => {
    const label = item.label?.toLowerCase() || '';
    // Skip header rows and look for actual data rows
    if ((item as any).is_header || (item as any).is_spacer) return false;
    
    return [
      'total revenue', 'revenue', 'sales', 'gross revenue', 'net revenue',
      'service revenue', 'product revenue', 'operating revenue'
    ].some(revenueLabel => label.includes(revenueLabel));
  });
  
  // If no revenue found in line items, fallback to dashboard_kpis
  if (!revenueItem && calculationResult.dashboard_kpis?.total_revenue) {
    const totalRevenue = calculationResult.dashboard_kpis.total_revenue;
    const syntheticRevenueValues = years.map(() => totalRevenue / years.length);
    
    revenueItem = {
      label: 'Total Revenue (from dashboard_kpis)',
      values: syntheticRevenueValues
    };
  }

  // More robust expense detection - try multiple approaches
  let expensesItem = null;
  
  // First, try to find the actual expense line item (most accurate)
  expensesItem = lineItems.find((item: any) => {
    const label = item.label?.toLowerCase() || '';
    return [
      'total operating expenses', 'operating expenses', 'total expenses',
      'operating costs', 'total costs', 'expenses'
    ].some(expenseLabel => label.includes(expenseLabel));
  });
  
  // If no expense line item found, fallback to dashboard_kpis
  if (!expensesItem && calculationResult.dashboard_kpis?.total_expenses) {
    const totalExpenses = calculationResult.dashboard_kpis.total_expenses;
    const syntheticExpenseValues = years.map(() => totalExpenses / years.length);
    
    expensesItem = {
      label: 'Total Expenses (from dashboard_kpis)',
      values: syntheticExpenseValues
    };
  }

  // Debug: Log what we found
  console.log('=== REVENUE VS EXPENSE CHART - ITEM DETECTION ===');
  console.log('Revenue item found:', revenueItem ? {
    label: revenueItem.label,
    values: revenueItem.values?.slice(0, 3)
  } : 'NOT FOUND');
  console.log('Expenses item found:', expensesItem ? {
    label: expensesItem.label,
    values: expensesItem.values?.slice(0, 3)
  } : 'NOT FOUND');

  // If total operating expenses not found or zero, try to find individual expense categories
  if (!expensesItem || (expensesItem.values && expensesItem.values.every((val: number) => val === 0))) {
    // Look for expense line items with various patterns
    const expensePatterns = [
      'expense -', 'cost -', 'operating', 'administrative', 'marketing',
      'research', 'development', 'rent', 'utilities', 'insurance', 'depreciation',
      'amortization', 'interest', 'taxes', 'salaries', 'wages', 'benefits'
    ];

    const individualExpenseItems = lineItems.filter((item: any) => {
      const label = item.label?.toLowerCase() || '';
      return expensePatterns.some(pattern => label.includes(pattern)) && 
             !label.includes('revenue') && 
             !label.includes('income') &&
             !label.includes('gross') &&
             !label.includes('net');
    });

    if (individualExpenseItems.length > 0) {
      // Sum up all individual expense values
      const summedValues = years.map((_, idx) => {
        return individualExpenseItems.reduce((sum, item) => {
          const value = item.values?.[idx] || 0;
          return sum + Math.abs(value); // Ensure positive values
        }, 0);
      });

      // Create a synthetic expenses item
      expensesItem = {
        label: 'Total Expenses (Calculated)',
        values: summedValues
      };
    }
  }

  // If still no expenses found, try to calculate from revenue and net income
  if (!expensesItem && revenueItem) {
    const netIncomeItem = lineItems.find((item: any) => {
      const label = item.label?.toLowerCase() || '';
      return ['net income', 'net profit', 'profit after tax', 'earnings after tax'].some(
        incomeLabel => label.includes(incomeLabel)
      );
    });

    if (netIncomeItem && netIncomeItem.values) {
      const calculatedExpenseValues = years.map((_, idx) => {
        const revenue = revenueItem.values?.[idx] || 0;
        const netIncome = netIncomeItem.values[idx] || 0;
        return Math.max(0, revenue - netIncome); // Expenses = Revenue - Net Income
      });

      expensesItem = {
        label: 'Total Expenses (Calculated from Net Income)',
        values: calculatedExpenseValues
      };
    }
  }

  if (!revenueItem || !expensesItem) {
    // Show more detailed error information
    const availableLabels = lineItems.map(item => item.label).join(', ');
    
    // Try to find any items that might contain revenue or expense data
    const potentialRevenueItems = lineItems.filter(item => 
      item.label && item.label.toLowerCase().includes('revenue')
    );
    const potentialExpenseItems = lineItems.filter(item => 
      item.label && item.label.toLowerCase().includes('expense')
    );
    
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Revenue or expense data not found</p>
          <p className="text-xs text-muted-foreground">Available labels: {availableLabels}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Revenue items: {potentialRevenueItems.length}, Expense items: {potentialExpenseItems.length}
          </p>
        </div>
      </div>
    );
  }

  const revenueValues = revenueItem.values || [];
  const expenseValues = expensesItem.values || [];

  // Show dashboard KPI values
  console.log('Dashboard KPIs - Total Revenue:', calculationResult.dashboard_kpis?.total_revenue);
  console.log('Dashboard KPIs - Total Expenses:', calculationResult.dashboard_kpis?.total_expenses);
  console.log('Dashboard KPIs - Net Income:', calculationResult.dashboard_kpis?.net_income);

  // Create enhanced chart data for ALL years (historical and forecasted)
  const chartData = years.map((year: string, idx: number) => {
    const revenue = revenueValues[idx] || 0;
    const expenses = Math.abs(expenseValues[idx] || 0); // Ensure positive value for bar

    // Calculate net income and margins
    const netIncome = revenue - expenses;
    const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    // Calculate expense-to-revenue ratio (efficiency metric)
    const expenseToRevenueRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;

    // Calculate growth rates (year-over-year)
    const prevRevenue = idx > 0 ? (revenueValues[idx - 1] || 0) : revenue;
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Determine if this is historical, current, or forecast year
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year);
    let yearType = 'historical';
    if (yearNum === currentYear) {
      yearType = 'current';
    } else if (yearNum > currentYear) {
      yearType = 'forecast';
    }

    return {
      period: year,
      yearType,
      revenue: revenue, // Keep original values, don't convert to thousands
      expenses: expenses,
      expenseToRevenueRatio: expenseToRevenueRatio,
      revenueGrowth: revenueGrowth,
      // Add efficiency indicators
      isEfficient: expenseToRevenueRatio < 70, // Less than 70% expense ratio is good
      // Add raw values for debugging
      rawRevenue: revenue,
      rawExpenses: expenses
    };
  });

  // Show final chart data with debugging info
  console.log('=== REVENUE VS EXPENSE CHART - FINAL DATA ===');
  console.log('Total years:', years.length);
  console.log('Years:', years);
  console.log('Chart data:', chartData);
  chartData.forEach((item, idx) => {
    console.log(`Year ${item.period} (${item.yearType}): Revenue: $${item.revenue.toFixed(2)}, Expenses: $${item.expenses.toFixed(2)}`);
  });

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 11 }}
            interval={0} // Show all years
          />
          <YAxis 
            yAxisId="left" 
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              // Format Y-axis labels to show actual values, not thousands
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
              return `$${value.toFixed(0)}`;
            }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />
          <Tooltip
            formatter={(value: any, name: string, props: any) => {
              const data = props.payload;
              if (name === 'revenue') {
                // Format tooltip to show actual values with proper formatting
                if (value >= 1000000) return [`$${(value / 1000000).toFixed(2)}M`, 'Revenue'];
                if (value >= 1000) return [`$${(value / 1000).toFixed(1)}K`, 'Revenue'];
                return [`$${value.toFixed(2)}`, 'Revenue'];
              } else if (name === 'expenses') {
                if (value >= 1000000) return [`$${(value / 1000000).toFixed(2)}M`, 'Expenses'];
                if (value >= 1000) return [`$${(value / 1000).toFixed(1)}K`, 'Expenses'];
                return [`$${value.toFixed(2)}`, 'Expenses'];
              } else if (name === 'expenseToRevenueRatio') {
                return [`${value.toFixed(1)}%`, 'Expense Ratio'];
              }
              return [`${value.toLocaleString()}`, name];
            }}
            labelFormatter={(label) => `Year: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value: string) => {
              if (value === 'expenseToRevenueRatio') return 'Expense/Revenue Ratio';
              return value.charAt(0).toUpperCase() + value.slice(1);
            }}
          />
          <Bar yAxisId="left" dataKey="revenue" fill={PRIMARY_COLOR} name="revenue">
            <LabelList
              dataKey="revenue"
              position="top"
              formatter={(value: number) => {
                // Format labels to show actual values, not just "0K" for small values
                if (value === 0) return '$0';
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                return `$${value.toFixed(0)}`;
              }}
              style={{
                fontSize: '10px',
                fontWeight: '600',
                fill: '#1f2937',
                textShadow: '0 0 2px white'
              }}
              offset={3}
            />
          </Bar>
          <Bar yAxisId="left" dataKey="expenses" fill={EXPENSE_COLOR} name="expenses">
            <LabelList
              dataKey="expenses"
              position="top"
              formatter={(value: number) => {
                // Format labels to show actual values, not just "0K" for small values
                if (value === 0) return '$0';
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                return `$${value.toFixed(0)}`;
              }}
              style={{
                fontSize: '10px',
                fontWeight: '600',
                fill: '#1f2937',
                textShadow: '0 0 2px white'
              }}
              offset={3}
            />
          </Bar>

          <ReferenceLine yAxisId="right" y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="expenseToRevenueRatio"
            name="expenseToRevenueRatio"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Historical Analysis Chart Component
const HistoricalAnalysisChart: React.FC<{ calculationResult: CalculationResult | null }> = ({ calculationResult }) => {
  if (!calculationResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Extract data from calculation result
  const incomeStatement = calculationResult.income_statement;
  const years = incomeStatement?.years || [];
  const lineItems = incomeStatement?.line_items || [];

  // Find revenue, EBITDA, and net income line items
  const revenueItem = lineItems.find((item: any) => item.label === 'TOTAL REVENUE');
  const ebitdaItem = lineItems.find((item: any) => item.label === 'EBITDA');
  const netIncomeItem = lineItems.find((item: any) => item.label === 'NET INCOME');

  const revenueValues = revenueItem?.values || [];
  const ebitdaValues = ebitdaItem?.values || [];
  const netIncomeValues = netIncomeItem?.values || [];

  // Create chart data with sections
  const chartData = years.map((year: string, index: number) => {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year);

    let section = 'historical';
    if (yearNum === currentYear) {
      section = 'current';
    } else if (yearNum > currentYear) {
      section = 'forecast';
    }

    return {
      year,
      section,
      revenue: (revenueValues[index] || 0) / 1000, // Convert to thousands for better display
      ebitda: (ebitdaValues[index] || 0) / 1000,
      netIncome: (netIncomeValues[index] || 0) / 1000,
    };
  });

  // Get unique sections
  const sections = [...new Set(chartData.map(d => d.section))];

  // Calculate insights for each section
  const insights: Record<string, any> = {};
  sections.forEach(section => {
    const sectionData = chartData.filter(d => d.section === section);

    if (sectionData.length > 0) {
      const avgRevenue = sectionData.reduce((sum, d) => sum + d.revenue, 0) / sectionData.length;
      const avgEbitda = sectionData.reduce((sum, d) => sum + d.ebitda, 0) / sectionData.length;
      const avgNetIncome = sectionData.reduce((sum, d) => sum + d.netIncome, 0) / sectionData.length;
      const totalRevenue = sectionData.reduce((sum, d) => sum + d.revenue, 0);

      insights[section] = {
        vertical: section === 'historical' ? 'Historical Performance' :
          section === 'current' ? 'Current Performance' : 'Projected Performance',
        horizontal: section === 'historical' ? 'Past Data' :
          section === 'current' ? 'Present' : 'Future Trend ↑',
        equity: `$${(avgNetIncome * 10).toFixed(0)}K`, // Simple equity estimate
        enterprise: `$${(totalRevenue * 1.5).toFixed(0)}K`, // Simple enterprise value estimate
        avgRevenue: `$${avgRevenue.toFixed(0)}K`,
        avgEbitda: `$${avgEbitda.toFixed(0)}K`,
        avgNetIncome: `$${avgNetIncome.toFixed(0)}K`,
        periods: sectionData.length
      };
    }
  });

  const formatCurrency = (value: number) => `$${value.toFixed(0)}K`;

  return (
    <div className="w-full">
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

            {/* Background color coding for sections */}
            {sections.includes('historical') && (
              <ReferenceArea
                x1={chartData.find(d => d.section === 'historical')?.year}
                x2={chartData.filter(d => d.section === 'historical').slice(-1)[0]?.year}
                fill="#dc2626"
                fillOpacity={0.1}
              />
            )}
            {sections.includes('current') && (
              <ReferenceArea
                x1={chartData.find(d => d.section === 'current')?.year}
                x2={chartData.filter(d => d.section === 'current').slice(-1)[0]?.year}
                fill="#f59e0b"
                fillOpacity={0.1}
              />
            )}
            {sections.includes('forecast') && (
              <ReferenceArea
                x1={chartData.find(d => d.section === 'forecast')?.year}
                x2={chartData.filter(d => d.section === 'forecast').slice(-1)[0]?.year}
                fill="#059669"
                fillOpacity={0.1}
              />
            )}

            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: 'Amount ($K)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const formatValue = formatCurrency(value);
                const labels = {
                  revenue: 'Revenue',
                  ebitda: 'EBITDA',
                  netIncome: 'Net Income'
                };
                return [formatValue, labels[name as keyof typeof labels] || name];
              }}
              labelFormatter={(label) => `Year: ${label}`}
            />

            {/* Net Income as bars */}
            <Bar
              dataKey="netIncome"
              fill="#14b8a6"
              fillOpacity={0.7}
              barSize={20}
              name="netIncome"
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3 mt-4 mb-4">
        {/* Data Series Legend */}
        <div className="flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-teal-500 opacity-70 rounded"></div>
            <span className="text-muted-foreground">Net Income</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-blue-600 rounded"></div>
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-red-600 rounded"></div>
            <span className="text-muted-foreground">EBITDA</span>
          </div>
        </div>

        {/* Section Background Legend */}
        <div className="flex justify-center gap-4 text-xs">
          {sections.includes('historical') && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 opacity-60 rounded"></div>
              <span className="text-muted-foreground">Historical</span>
            </div>
          )}
          {sections.includes('current') && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-200 opacity-60 rounded"></div>
              <span className="text-muted-foreground">Current</span>
            </div>
          )}
          {sections.includes('forecast') && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 opacity-60 rounded"></div>
              <span className="text-muted-foreground">Forecasted</span>
            </div>
          )}
        </div>
      </div>

      {/* Section KPIs */}
      <div className={`grid grid-cols-1 md:grid-cols-${sections.length} gap-2 mt-3`}>
        {sections.map(section => {
          let bgClass = "bg-muted";
          let textClass = "text-foreground";

          if (section === 'historical') {
            bgClass = "bg-red-50 border border-red-100";
            textClass = "text-red-900";
          } else if (section === 'current') {
            bgClass = "bg-amber-50 border border-amber-100";
            textClass = "text-amber-900";
          } else if (section === 'forecast') {
            bgClass = "bg-green-50 border border-green-100";
            textClass = "text-green-900";
          }

          return (
            <div key={section} className={`${bgClass} rounded-lg p-3 flex flex-col items-center`}>
              <div className={`font-semibold text-xs mb-1 ${textClass}`}>{insights[section]?.vertical || '-'}</div>
              <div className="text-xs text-muted-foreground mb-2">{insights[section]?.horizontal || '-'}</div>
              <div className="text-xs text-muted-foreground">Avg Revenue: {insights[section]?.avgRevenue || '-'}</div>
              <div className="text-xs text-muted-foreground">Avg EBITDA: {insights[section]?.avgEbitda || '-'}</div>
              <div className="text-xs text-muted-foreground">Periods: {insights[section]?.periods || 0}</div>
            </div>
          );
        })}
      </div>

      {/* Valuation Rows */}
      <div className={`grid grid-cols-1 md:grid-cols-${sections.length} gap-2 mt-2`}>
        {sections.map(section => {
          let bgClass = "bg-background";
          let textClass = "text-foreground";
          let borderClass = "border";

          if (section === 'historical') {
            bgClass = "bg-red-50";
            borderClass = "border-red-100";
            textClass = "text-red-900";
          } else if (section === 'current') {
            bgClass = "bg-amber-50";
            borderClass = "border-amber-100";
            textClass = "text-amber-900";
          } else if (section === 'forecast') {
            bgClass = "bg-green-50";
            borderClass = "border-green-100";
            textClass = "text-green-900";
          }

          return (
            <div key={section} className={`rounded-lg p-2 flex flex-col items-center ${borderClass} ${bgClass}`}>
              <div className="text-xs text-muted-foreground">Equity Value</div>
              <div className={`font-bold text-sm ${textClass}`}>{insights[section]?.equity || '-'}</div>
            </div>
          );
        })}
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-${sections.length} gap-2 mt-2`}>
        {sections.map(section => {
          let bgClass = "bg-background";
          let textClass = "text-foreground";
          let borderClass = "border";

          if (section === 'historical') {
            bgClass = "bg-red-50";
            borderClass = "border-red-100";
            textClass = "text-red-900";
          } else if (section === 'current') {
            bgClass = "bg-amber-50";
            borderClass = "border-amber-100";
            textClass = "text-amber-900";
          } else if (section === 'forecast') {
            bgClass = "bg-green-50";
            borderClass = "border-green-100";
            textClass = "text-green-900";
          }

          return (
            <div key={section} className={`rounded-lg p-2 flex flex-col items-center ${borderClass} ${bgClass}`}>
              <div className="text-xs text-muted-foreground">Enterprise Value</div>
              <div className={`font-bold text-sm ${textClass}`}>{insights[section]?.enterprise || '-'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple KPI interface for ratio analysis
interface SimpleKPI {
  name: string;
  value: number;
  unit: string;
  benchmark: { good: number; average: number; poor: number };
  inverse?: boolean;
  format?: string;
  icon: React.ComponentType<any>;
}

// Ratio Analysis Tab Component
const RatioAnalysisTab: React.FC<{ calculationResult: CalculationResult | null }> = ({ calculationResult }) => {
  if (!calculationResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available for ratio analysis</p>
      </div>
    );
  }

  // Extract KPIs and financial data
  const dashboardKpis = calculationResult.dashboard_kpis || {} as any;
  const companyMetrics = calculationResult.company_metrics || {} as any;
  const companyType = calculationResult.company_type || 'service';

  // Calculate derived ratios from actual available data
  const calculateDerivedRatios = () => {
    const incomeStatement = calculationResult.income_statement;
    const balanceSheet = calculationResult.balance_sheet;
    
    if (!incomeStatement?.line_items || !balanceSheet?.line_items) {
      return {};
    }

    // Helper function to find line item values
    const findLineItemValue = (lineItems: any[], keywords: string[], yearIndex: number = -1) => {
      for (const item of lineItems) {
        const label = item.label?.toLowerCase() || '';
        if (keywords.some(keyword => label.includes(keyword.toLowerCase()))) {
          const values = item.values || [];
          // Use base year (2025) by default instead of latest year (2030)
          // If yearsInBusiness = 2, then years[1] = 2025 (base year), years[0] = 2024 (historical)
          const baseYearIdx = 1; // Index 1 = 2025 (base year)
          return yearIndex === -1 ? values[baseYearIdx] || 0 : values[yearIndex] || 0;
        }
      }
      return 0;
    };

    const incomeItems = incomeStatement.line_items;
    const balanceItems = balanceSheet.line_items;
    
    // Extract key values
    const totalRevenue = findLineItemValue(incomeItems, ['total revenue', 'revenue']);
    const totalExpenses = findLineItemValue(incomeItems, ['total operating expenses', 'operating expenses']);
    const netIncome = findLineItemValue(incomeItems, ['net income']);
    const ebitda = findLineItemValue(incomeItems, ['ebitda']);
    const operatingIncome = findLineItemValue(incomeItems, ['operating income', 'ebit']);
    
    const totalAssets = findLineItemValue(balanceItems, ['total assets']);
    const currentAssets = findLineItemValue(balanceItems, ['current assets']);
    const currentLiabilities = findLineItemValue(balanceItems, ['current liabilities']);
    const totalEquity = findLineItemValue(balanceItems, ['total equity', 'equity']);
    const totalLiabilities = findLineItemValue(balanceItems, ['total liabilities', 'liabilities']);
    
    // Calculate derived ratios
    const derived = {
      gross_margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0,
      operating_margin: totalRevenue > 0 ? (operatingIncome / totalRevenue * 100) : 0,
      roa: totalAssets > 0 ? (netIncome / totalAssets * 100) : 0,
      equity_ratio: totalAssets > 0 ? (totalEquity / totalAssets * 100) : 0,
      debt_ratio: totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0,
      working_capital: currentAssets - currentLiabilities,
      expense_ratio: totalRevenue > 0 ? (totalExpenses / totalRevenue * 100) : 0,
    };

    return derived;
  };

  const derivedRatios = calculateDerivedRatios() as any;

  // KPIs based on actual available data from historical analysis
  const allKpis = [
    // PROFITABILITY RATIOS (Based on Income Statement)
        {
          name: 'Profit Margin',
          value: dashboardKpis.profit_margin || 0,
          unit: '%',
          benchmark: { good: 15, average: 10, poor: 5 },
      inverse: false,
          icon: Percent
        },
        {
          name: 'EBITDA Margin',
          value: dashboardKpis.ebitda_margin || 0,
          unit: '%',
          benchmark: { good: 25, average: 15, poor: 10 },
      inverse: false,
          icon: TrendingUp
        },
        {
      name: 'Gross Margin',
      value: derivedRatios.gross_margin || 0,
      unit: '%',
      benchmark: { good: 60, average: 40, poor: 20 },
      inverse: false,
      icon: PieChartIcon
    },
    {
      name: 'Operating Margin',
      value: derivedRatios.operating_margin || 0,
      unit: '%',
      benchmark: { good: 20, average: 12, poor: 5 },
      inverse: false,
      icon: LineChart
    },
    {
      name: 'ROE',
          value: dashboardKpis.roe || 0,
          unit: '%',
          benchmark: { good: 20, average: 15, poor: 10 },
      inverse: false,
          icon: Crown
    },
    {
      name: 'ROA',
      value: derivedRatios.roa || 0,
      unit: '%',
      benchmark: { good: 10, average: 6, poor: 3 },
      inverse: false,
      icon: Briefcase
    },

    // LIQUIDITY RATIOS (Based on Balance Sheet)
        {
          name: 'Current Ratio',
          value: dashboardKpis.current_ratio || 0,
          unit: 'x',
          benchmark: { good: 2.0, average: 1.5, poor: 1.0 },
      inverse: false,
          icon: Activity
    },
    {
      name: 'Working Capital',
      value: derivedRatios.working_capital || 0,
      unit: '$',
      benchmark: { good: 100000, average: 50000, poor: 10000 },
      inverse: false,
      icon: Wallet,
      format: 'currency'
    },

    // LEVERAGE RATIOS (Based on Balance Sheet)
        {
          name: 'Debt-to-Equity',
          value: dashboardKpis.debt_to_equity || 0,
          unit: 'x',
          benchmark: { good: 0.3, average: 0.5, poor: 1.0 },
      inverse: true,
      icon: CreditCard
    },
    {
      name: 'Debt Ratio',
      value: derivedRatios.debt_ratio || 0,
      unit: '%',
      benchmark: { good: 30, average: 50, poor: 70 },
      inverse: true,
      icon: AlertCircle
    },
    {
      name: 'Equity Ratio',
      value: derivedRatios.equity_ratio || 0,
      unit: '%',
      benchmark: { good: 70, average: 50, poor: 30 },
      inverse: false,
      icon: Shield
    },

    // EFFICIENCY RATIOS (Based on Income Statement & Balance Sheet)
        {
          name: 'Asset Turnover',
          value: dashboardKpis.asset_turnover || 0,
          unit: 'x',
          benchmark: { good: 1.5, average: 1.0, poor: 0.5 },
      inverse: false,
          icon: BarChart3
    },
    {
      name: 'Expense Ratio',
      value: derivedRatios.expense_ratio || 0,
      unit: '%',
      benchmark: { good: 50, average: 70, poor: 85 },
      inverse: true,
      icon: TrendingDown
    },

    // GROWTH & VALUATION RATIOS
    {
      name: 'Revenue Growth',
      value: dashboardKpis.revenue_growth || 0,
      unit: '%',
      benchmark: { good: 20, average: 10, poor: 0 },
      inverse: false,
      icon: TrendingUp
    },
    {
      name: 'Terminal Value',
      value: dashboardKpis.terminal_value || 0,
      unit: '$',
      benchmark: { good: 1000000, average: 500000, poor: 100000 },
      inverse: false,
      icon: Target,
      format: 'currency'
    },
    {
      name: 'WACC',
      value: dashboardKpis.wacc || 0,
      unit: '%',
      benchmark: { good: 8, average: 12, poor: 18 },
      inverse: true,
      icon: Calculator
    },

    // SERVICE BUSINESS SPECIFIC METRICS (From Form Data)
    ...(companyType === 'service' ? [
      {
        name: 'Client Retention',
          value: dashboardKpis.client_retention_rate || 0,
          unit: '%',
          benchmark: { good: 90, average: 80, poor: 70 },
        inverse: false,
          icon: UserCheck
        },
        {
          name: 'Utilization Rate',
          value: dashboardKpis.utilization_rate || 0,
          unit: '%',
          benchmark: { good: 85, average: 75, poor: 65 },
        inverse: false,
          icon: Clock
        },
        {
        name: 'CLV',
          value: dashboardKpis.clv || 0,
          unit: '$',
          benchmark: { good: 50000, average: 25000, poor: 10000 },
        inverse: false,
        icon: DollarSign,
          format: 'currency'
        },
        {
        name: 'CAC',
          value: dashboardKpis.cac || 0,
          unit: '$',
          benchmark: { good: 1000, average: 2000, poor: 5000 },
        inverse: true,
        icon: MousePointer,
        format: 'currency'
      },
      {
        name: 'CLV/CAC Ratio',
        value: dashboardKpis.clv > 0 && dashboardKpis.cac > 0 ? 
               (dashboardKpis.clv / dashboardKpis.cac) : 0,
        unit: 'x',
        benchmark: { good: 5.0, average: 3.0, poor: 1.5 },
        inverse: false,
        icon: CheckCircle
      }
    ] : [])
  ];

  // Helper function to get color based on performance
  const getPerformanceColor = (value: number, benchmark: any, inverse: boolean = false) => {
    if (inverse) {
      // For inverse metrics (lower is better)
      if (value <= benchmark.good) return 'text-green-600 bg-green-50 border-green-200';
      if (value <= benchmark.average) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      return 'text-red-600 bg-red-50 border-red-200';
    } else {
      // For normal metrics (higher is better)
      if (value >= benchmark.good) return 'text-green-600 bg-green-50 border-green-200';
      if (value >= benchmark.average) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  // Helper function to format KPI values
  const formatKpiValue = (value: number, format?: string, unit?: string) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }

    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }

    if (unit === 'x') {
      return `${value.toFixed(2)}x`;
    }

    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Comprehensive KPI Grid - Name on top, value below with icons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {allKpis.map((kpi, index) => {
          const colorClass = getPerformanceColor(kpi.value, kpi.benchmark, kpi.inverse);
          const IconComponent = kpi.icon;
          
          return (
            <div
              key={index}
              className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${colorClass}`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                {/* Icon */}
                <IconComponent className="h-6 w-6 opacity-80" />
                
                {/* KPI Name */}
                <h3 className="font-semibold text-sm leading-tight">
                  {kpi.name}
                </h3>
                
                {/* KPI Value */}
                <div className="font-bold text-xl">
                  {formatKpiValue(kpi.value, kpi.format, kpi.unit)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// FCF Over Time Chart Component
const FCFOverTimeChart: React.FC<{ calculationResult: CalculationResult | null }> = ({ calculationResult }) => {
  if (!calculationResult?.projections?.free_cash_flow) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No FCF data available</p>
      </div>
    );
  }

  const fcfData = calculationResult.projections.free_cash_flow.map((value, index) => ({
    year: `Year ${index + 1}`,
    fcf: value / 1000, // Convert to thousands
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={fcfData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => [`$${value.toFixed(0)}K`, 'Free Cash Flow']}
          labelFormatter={(label) => `${label}`}
        />
        <Area 
          type="monotone" 
          dataKey="fcf" 
          stroke={PRIMARY_COLOR} 
          fill={PRIMARY_COLOR} 
          fillOpacity={0.3}
        />
        <Line 
          type="monotone" 
          dataKey="fcf" 
          stroke={PRIMARY_COLOR} 
          strokeWidth={2}
          dot={{ fill: PRIMARY_COLOR, strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Revenue vs Expense Donut Chart Component
const RevenueExpenseDonutChart: React.FC<{ calculationResult: CalculationResult | null }> = ({ calculationResult }) => {
  if (!calculationResult?.income_statement?.line_items) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No financial data available</p>
      </div>
    );
  }

  // Find revenue and total expenses
  const incomeItems = calculationResult.income_statement.line_items;
  const revenueItem = incomeItems.find((item: any) => 
    ['total revenue', 'revenue'].some(keyword => 
      item.label?.toLowerCase().includes(keyword)
    )
  );
  
  const expenseItem = incomeItems.find((item: any) => 
    ['total operating expenses', 'operating expenses'].some(keyword => 
      item.label?.toLowerCase().includes(keyword)
    )
  );

  if (!revenueItem || !expenseItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Insufficient data for chart</p>
      </div>
    );
  }

  // Get base year values (current year) instead of latest forecast year
  // If yearsInBusiness = 2, then years[1] = 2025 (base year), years[0] = 2024 (historical)
  const baseYearIdx = 1; // Index 1 = 2025 (base year)
  const revenue = revenueItem.values?.[baseYearIdx] || 0;
  const expenses = expenseItem.values?.[baseYearIdx] || 0;
  const netIncome = revenue - expenses;

  const data = [
    { name: 'Revenue', value: revenue, color: SUCCESS_COLOR },
    { name: 'Expenses', value: expenses, color: EXPENSE_COLOR },
    { name: 'Net Income', value: netIncome, color: PRIMARY_COLOR }
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, 'Amount']}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.name}</span>
            </div>
            <span className="text-muted-foreground">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Horizontal and Vertical Analysis Tab Component
const HorizontalVerticalAnalysisTab: React.FC<{ calculationResult: CalculationResult | null }> = ({ calculationResult }) => {
  if (!calculationResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available for analysis</p>
      </div>
    );
  }

  const incomeStatement = calculationResult.income_statement;
  const balanceSheet = calculationResult.balance_sheet;
  
  if (!incomeStatement?.line_items || !balanceSheet?.line_items || !incomeStatement?.years) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Insufficient data for horizontal and vertical analysis</p>
      </div>
    );
  }

  const years = incomeStatement.years;

  // Helper function to calculate year-over-year growth
  const calculateHorizontalAnalysis = (values: number[]) => {
    const growth: (number | null)[] = [null]; // First year has no previous year
    for (let i = 1; i < values.length; i++) {
      const current = values[i];
      const previous = values[i - 1];
      if (previous !== 0 && previous !== null && previous !== undefined) {
        growth.push(((current - previous) / Math.abs(previous)) * 100);
      } else {
        growth.push(null);
      }
    }
    return growth;
  };

  // Helper function to calculate vertical analysis (percentage of base)
  const calculateVerticalAnalysis = (values: number[], baseValues: number[]) => {
    return values.map((value, index) => {
      const base = baseValues[index];
      return base !== 0 ? (value / Math.abs(base)) * 100 : 0;
    });
  };

  // Get base line items for vertical analysis
  const revenueItem = incomeStatement.line_items.find((item: any) => 
    ['total revenue', 'revenue'].some(keyword => 
      item.label?.toLowerCase().includes(keyword)
    )
  );
  
  const totalAssetsItem = balanceSheet.line_items.find((item: any) => 
    item.label?.toLowerCase().includes('total assets')
  );

  // Prepare data for horizontal analysis
  const horizontalData = incomeStatement.line_items
    .filter((item: any) => item.label && !item.label.toLowerCase().includes('total'))
    .slice(0, 8) // Limit to top 8 items for readability
    .map((item: any) => ({
      name: item.label,
      values: item.values || [],
      growth: calculateHorizontalAnalysis(item.values || [])
    }));

  // Prepare data for vertical analysis (Income Statement)
  const verticalIncomeData = incomeStatement.line_items
    .filter((item: any) => item.label && !item.label.toLowerCase().includes('total'))
    .slice(0, 8)
    .map((item: any) => ({
      name: item.label,
      values: item.values || [],
      percentages: revenueItem ? calculateVerticalAnalysis(item.values || [], revenueItem.values || []) : []
    }));

  // Prepare data for vertical analysis (Balance Sheet)
  const verticalBalanceData = balanceSheet.line_items
    .filter((item: any) => item.label && !item.label.toLowerCase().includes('total'))
    .slice(0, 8)
    .map((item: any) => ({
      name: item.label,
      values: item.values || [],
      percentages: totalAssetsItem ? calculateVerticalAnalysis(item.values || [], totalAssetsItem.values || []) : []
    }));

  // Format currency
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  // Format percentage with color coding
  const formatPercentage = (value: number | null, type: 'growth' | 'vertical' = 'growth') => {
    if (value === null || value === undefined) return 'N/A';
    
    const colorClass = type === 'growth' 
      ? value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
      : 'text-blue-600';
    
    return <span className={colorClass}>{value.toFixed(1)}%</span>;
  };

  return (
    <div className="space-y-8">


      {/* Horizontal Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Horizontal Analysis - Year-over-Year Growth
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Shows percentage change of each line item compared to the previous year
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Line Item</th>
                  {years.map((year: string, index: number) => (
                    <th key={year} className="text-center p-3 font-semibold">
                      {year}
                      {index === 0 && <div className="text-xs text-muted-foreground">(Base)</div>}
                      {index > 0 && <div className="text-xs text-muted-foreground">(% Change)</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horizontalData.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.name}</td>
                    {years.map((year: string, yearIdx: number) => (
                      <td key={year} className="text-center p-3">
                        <div className="text-sm font-semibold">
                          {formatCurrency(item.values[yearIdx] || 0)}
      </div>
                        {yearIdx > 0 && (
                          <div className="text-sm">
                            {formatPercentage(item.growth[yearIdx], 'growth')}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Vertical Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Statement Vertical Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Income Statement - Vertical Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Each item as percentage of total revenue
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Item</th>
                    {years.map((year: string) => (
                      <th key={year} className="text-center p-2 font-semibold text-xs">
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {verticalIncomeData.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm font-medium">{item.name}</td>
                      {years.map((year: string, yearIdx: number) => (
                        <td key={year} className="text-center p-2">
                          <div className="text-xs">
                            {formatPercentage(item.percentages[yearIdx], 'vertical')}
                    </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
                    </div>
          </CardContent>
        </Card>

        {/* Balance Sheet Vertical Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Balance Sheet - Vertical Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Each item as percentage of total assets
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Item</th>
                    {years.map((year: string) => (
                      <th key={year} className="text-center p-2 font-semibold text-xs">
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {verticalBalanceData.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm font-medium">{item.name}</td>
                      {years.map((year: string, yearIdx: number) => (
                        <td key={year} className="text-center p-2">
                          <div className="text-xs">
                            {formatPercentage(item.percentages[yearIdx], 'vertical')}
                  </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

// Helper function to validate and normalize calculation result
const normalizeCalculationResult = (data: any): CalculationResult | null => {
  if (!data) return null;

  // Handle both nested and direct data structures
  // If data has a nested 'data' property, use that; otherwise use data directly
  const calculationData = data.data || data;

  // Check if dashboard_kpis is in the data structure
  if (calculationData.dashboard_kpis) {
    console.log('✅ Found dashboard_kpis in calculation data:', calculationData.dashboard_kpis);
  } else {
    console.log('❌ dashboard_kpis not found in calculation data');
    console.log('Available keys:', Object.keys(calculationData));
  }

  // For historical data, the structure might be different
  // Check if we have the historical format with nested statements
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

// Map real calculation results to dashboard data structure
function mapHistoricalResultsToDashboardData(results: CalculationResult | null) {
  if (!results) return null;

  // Use the new dashboard_kpis from backend (should be preserved by normalization)
  const dashboardKpis = results.dashboard_kpis || {};

  // Show dashboard KPIs from backend
  console.log('Dashboard KPIs from backend:', dashboardKpis);

  // Overview data from dashboard KPIs
  const overview = {
    totalRevenue: dashboardKpis.total_revenue || 0,
    totalExpenses: dashboardKpis.total_expenses || 0,
    netIncome: dashboardKpis.net_income || 0,
    profitMargin: dashboardKpis.profit_margin || 0
  };

  // KPIs for dashboard cards
  const kpis = {
    // Financial ratios
    roe: dashboardKpis.roe || 0,
    asset_turnover: dashboardKpis.asset_turnover || 0,
    current_ratio: dashboardKpis.current_ratio || 0,

    // Service business metrics
    client_retention_rate: dashboardKpis.client_retention_rate || 85,
    utilization_rate: dashboardKpis.utilization_rate || 75,
    clv: dashboardKpis.clv || 25000,
    cac: dashboardKpis.cac || 1500,

    // DCF/Valuation metrics
    wacc: dashboardKpis.wacc || 10,
    terminal_value: dashboardKpis.terminal_value || 0,
    revenue_growth: dashboardKpis.revenue_growth || 0,
    ebitda_margin: dashboardKpis.ebitda_margin || 0
  };

  // Revenue breakdown (from income statement)
  const revenue = results.income_statement?.line_items || [];

  // Expenses breakdown
  const expenses = results.expense_breakdown || [];

  // Cash flow data
  const cashFlowData = results.cash_flow || [];

  // Projections data
  const projections = results.projections || {};

  return {
    overview,
    revenue,
    expenses,
    cashFlowData,
    projections,
    kpis,
    balance: results.balance_sheet || {},
    equity: results.equity || {}
  };
}

interface HistoricalDashboardProps {
  calculationResult?: CalculationResult | null;
}

const HistoricalDashboard: React.FC<HistoricalDashboardProps> = ({ calculationResult: propCalculationResult }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { historicalCalculationResult, businessName, businessDescription } = useCalculationResult();
  const [selectedModel, setSelectedModel] = useState<string>('historical');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(propCalculationResult);
  const [activeTab, setActiveTab] = useState('overview');
  const [sensitivityScenario, setSensitivityScenario] = useState('base');
  const [companyType, setCompanyType] = useState('service'); // This could come from form data

  // Generate sensitivity values based on company type
  const generateSensitivityValues = (type: string) => {
    const params = getSensitivityParameters(type);
    const scenarios: any = { base: {}, best: {}, worst: {} };

    Object.keys(params).forEach(key => {
      const param = params[key as keyof typeof params];
      scenarios.base[key] = param.base;
      scenarios.best[key] = param.best;
      scenarios.worst[key] = param.worst;
    });

    return scenarios;
  };

  const [sensitivityValues, setSensitivityValues] = useState(() => generateSensitivityValues(companyType));

  // Update sensitivity values when company type changes
  useEffect(() => {
    setSensitivityValues(generateSensitivityValues(companyType));
  }, [companyType]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const toastShownRef = useRef(false);

  // Load calculation result from context or localStorage (hybrid approach)
  useEffect(() => {
    if (!calculationResult) {
      // Try context first (primary)
      if (historicalCalculationResult) {
        console.log('=== LOADING FROM CONTEXT ===');
        console.log('Context data type:', typeof historicalCalculationResult);
        console.log('Context data keys:', Object.keys(historicalCalculationResult));
        console.log('Has dashboard_kpis in context?', 'dashboard_kpis' in historicalCalculationResult);
        console.log('Context dashboard_kpis value:', (historicalCalculationResult as any).dashboard_kpis);

        // Check nested data structure (raw API response)
        const rawData = historicalCalculationResult as any;
        if (rawData.data) {
          console.log('Has dashboard_kpis in data.data?', 'dashboard_kpis' in rawData.data);
          console.log('data.data.dashboard_kpis:', rawData.data.dashboard_kpis);
        }

        const normalized = normalizeCalculationResult(historicalCalculationResult);
        if (normalized) {
          console.log('=== AFTER NORMALIZATION ===');
          console.log('Normalized data keys:', Object.keys(normalized));
          console.log('Has dashboard_kpis in normalized?', 'dashboard_kpis' in normalized);
          console.log('Normalized dashboard_kpis:', normalized.dashboard_kpis);
          setCalculationResult(normalized);
        }
      } else {
        // Fallback to localStorage (backup)
        const stored = localStorage.getItem('historical_calculation_result');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('=== LOADING FROM LOCALSTORAGE ===');
            console.log('LocalStorage data keys:', Object.keys(parsed));
            console.log('Has dashboard_kpis in localStorage?', 'dashboard_kpis' in parsed);
            console.log('LocalStorage dashboard_kpis:', parsed.dashboard_kpis);

            // Normalize the data structure
            const normalized = normalizeCalculationResult(parsed);
            if (normalized) {
              console.log('=== AFTER LOCALSTORAGE NORMALIZATION ===');
              console.log('Normalized data keys:', Object.keys(normalized));
              console.log('Has dashboard_kpis in normalized?', 'dashboard_kpis' in normalized);
              console.log('Normalized dashboard_kpis:', normalized.dashboard_kpis);
              setCalculationResult(normalized);
            } else {
              console.error('Failed to normalize calculation result for dashboard');
              // Clear invalid data
              localStorage.removeItem('historical_calculation_result');
            }
          } catch (error) {
            console.error('Failed to parse stored calculation result:', error);
            // Clear corrupted data
            localStorage.removeItem('historical_calculation_result');
          }
        }
      }
    }
  }, [calculationResult, historicalCalculationResult]);

  const dashboardData = useMemo(() =>
    mapHistoricalResultsToDashboardData(calculationResult),
    [calculationResult]
  );

  // Show success message when dashboard loads with data (only once)
  useEffect(() => {
    if (calculationResult && !toastShownRef.current) {
      toast({
        title: "Dashboard Loaded",
        description: "Historical dashboard data loaded successfully.",
      });
      toastShownRef.current = true;
    }
  }, [calculationResult, toast]);

  if (!calculationResult || !dashboardData) {
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
                  <h3 className="text-lg font-semibold mb-2">No Historical Data</h3>
                  <p className="text-muted-foreground">Please run a historical calculation to see the dashboard.</p>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleExportPDF = async () => {
    try {
      await exportDashboardToPDF(
        calculationResult || {
          income_statement: null,
          balance_sheet: null,
          cash_flow: null,
          kpis: { gross_margin: 0, operating_margin: 0, net_margin: 0, current_ratio: 0, debt_to_equity: 0, roe: 0, roa: 0 },
          projections: { years: [], revenue: [], net_income: [], ebitda: [], free_cash_flow: [] }
        },
        'Historical Model'
      );
      toast({
        title: "Export Successful",
        description: "Dashboard exported to PDF successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard to PDF.",
        variant: "destructive",
      });
    }
  };



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
                selectedModel={selectedModel}
                onModelSelect={(modelId) => navigate(`/model/${modelId}`)}
                tabs={HISTORICAL_DASHBOARD_TABS}
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
              {businessName ? `${businessName} Dashboard` : 'Historical Dashboard'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              {businessDescription || 'Financial analysis based on historical data'}
            </p>
          </div>

          {/* Dashboard Content */}
          <div className="w-full px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Business Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Main Dashboard Content */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Side - KPI Grid */}
                  <div className="lg:col-span-2">
                    <div className="space-y-3">
                      {/* Row 1: Revenue, Expenses, Profit Margin, Terminal Value */}
                      <div className="grid grid-cols-4 gap-2">
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                              <DollarSign className="h-4 w-4" style={{ color: SUCCESS_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: SUCCESS_COLOR }}>
                              {formatCurrency(dashboardData?.overview?.totalRevenue || 0)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
                              <CreditCard className="h-4 w-4" style={{ color: DANGER_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: DANGER_COLOR }}>
                              {formatCurrency(dashboardData?.overview?.totalExpenses || 0)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
                              <Percent className="h-4 w-4" style={{ color: PRIMARY_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>
                              {formatPercent(dashboardData?.overview?.totalRevenue > 0 ? (dashboardData?.overview?.netIncome / dashboardData?.overview?.totalRevenue) * 100 : 0)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Terminal Value</CardTitle>
                              <Target className="h-4 w-4" style={{ color: INFO_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: INFO_COLOR }}>
                              {formatCurrency(dashboardData?.kpis?.terminal_value || 0)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Row 2: ROE, Asset Turnover, Current Ratio, WACC */}
                      <div className="grid grid-cols-4 gap-2">
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">ROE</CardTitle>
                              <BarChart3 className="h-4 w-4" style={{ color: SUCCESS_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: SUCCESS_COLOR }}>
                              {formatPercent(dashboardData?.kpis?.roe || 0)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Asset Turnover</CardTitle>
                              <Activity className="h-4 w-4" style={{ color: WARNING_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: WARNING_COLOR }}>
                              {(dashboardData?.kpis?.asset_turnover || 0).toFixed(1)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Current Ratio</CardTitle>
                              <Building2 className="h-4 w-4" style={{ color: INFO_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: INFO_COLOR }}>
                              {(dashboardData?.kpis?.current_ratio || 0).toFixed(1)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">WACC</CardTitle>
                              <Percent className="h-4 w-4" style={{ color: DANGER_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: DANGER_COLOR }}>
                              {formatPercent(dashboardData?.kpis?.wacc || 0)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Row 3: Client Retention, CLV, CAC, Utilization Rate */}
                      <div className="grid grid-cols-4 gap-2">
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Client Retention</CardTitle>
                              <UserCheck className="h-4 w-4" style={{ color: SUCCESS_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: SUCCESS_COLOR }}>
                              {formatPercent(dashboardData?.kpis?.client_retention_rate || 0)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">CLV</CardTitle>
                              <Crown className="h-4 w-4" style={{ color: PRIMARY_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>
                              {formatCurrency(dashboardData?.kpis?.clv || 0)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">CAC</CardTitle>
                              <MousePointer className="h-4 w-4" style={{ color: DANGER_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: DANGER_COLOR }}>
                              {formatCurrency(dashboardData?.kpis?.cac || 0)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="h-28 w-36 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="pb-1">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-muted-foreground">Utilization Rate</CardTitle>
                              <Clock className="h-4 w-4" style={{ color: WARNING_COLOR }} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl font-bold" style={{ color: WARNING_COLOR }}>
                              {formatPercent(dashboardData?.kpis?.utilization_rate || 0)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Debt to Equity Bar - Integrated with KPIs */}
                      <div className="mt-3">
                        <Card className="h-20">
                          <CardContent className="p-3 h-full flex items-center">
                            <DebtToEquityBar calculationResult={calculationResult} />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Revenue vs Expense Chart */}
                  <div className="lg:col-span-3">
                    <Card className="h-full min-h-[400px]">
                      <CardHeader>
                        <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
                        <p className="text-sm text-muted-foreground">With efficiency ratio analysis</p>
                      </CardHeader>
                      <CardContent className="h-full p-6">
                        <RevenueVsExpenseChart calculationResult={calculationResult} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* New Row: FCF Over Time and Revenue vs Expense Donut Chart */}
                  <div className="lg:col-span-5 mt-6">
                    <div className="grid grid-cols-12 gap-6">
                      {/* FCF Over Time Chart - 75% width (9 columns) */}
                      <div className="col-span-9">
                        <Card>
                          <CardHeader>
                            <CardTitle>Free Cash Flow Over Time</CardTitle>
                            <p className="text-sm text-muted-foreground">Projected cash flow trends</p>
                          </CardHeader>
                          <CardContent>
                            <FCFOverTimeChart calculationResult={calculationResult} />
                          </CardContent>
                        </Card>
                      </div>

                      {/* Revenue vs Expense Donut Chart - 25% width (3 columns) */}
                      <div className="col-span-3">
                        <Card>
                          <CardHeader>
                            <CardTitle>Revenue vs Expenses</CardTitle>
                            <p className="text-sm text-muted-foreground">Percentage breakdown</p>
                          </CardHeader>
                          <CardContent>
                            <RevenueExpenseDonutChart calculationResult={calculationResult} />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* Full Width Historical Analysis Chart */}
                  <div className="lg:col-span-5 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Historical Analysis & Projections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <HistoricalAnalysisChart calculationResult={calculationResult} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sensitivity Analysis: Heatmap and Tornado Chart */}
                  <div className="lg:col-span-5 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Sensitivity Heatmap</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <SensitivityHeatmap
                            data={[]}
                            balanceSheetData={calculationResult?.balance_sheet}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Tornado Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <TornadoChart data={[]} />
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                </div>
              </TabsContent>

              {/* Ratio Analysis Tab */}
              <TabsContent value="ratios" className="space-y-6">
                <RatioAnalysisTab calculationResult={calculationResult} />
              </TabsContent>

              {/* Horizontal & Vertical Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6">
                <HorizontalVerticalAnalysisTab calculationResult={calculationResult} />
              </TabsContent>

              {/* Sensitivity Analysis Tab */}
              <TabsContent value="sensitivity" className="space-y-6">
                {/* Scenario Selection */}
                <div className="flex justify-center mb-6">
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    {['base', 'best', 'worst'].map((scenario) => (
                      <button
                        key={scenario}
                        onClick={() => setSensitivityScenario(scenario)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sensitivityScenario === scenario
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {scenario === 'base' ? 'Base Case' : scenario === 'best' ? 'Best Case' : 'Worst Case'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Sensitivity Parameters */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Sensitivity Parameters - {companyType.charAt(0).toUpperCase() + companyType.slice(1)} Company</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Adjust key variables to see impact on valuation ({sensitivityScenario.charAt(0).toUpperCase() + sensitivityScenario.slice(1)} Case)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(getSensitivityParameters(companyType)).map(([key, param]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium text-gray-900">{param.label}</Label>
                            <div className={`flex items-center px-2 py-1 rounded ${sensitivityValues[sensitivityScenario as keyof typeof sensitivityValues][key] > 0
                              ? 'bg-green-100'
                              : sensitivityValues[sensitivityScenario as keyof typeof sensitivityValues][key] < 0
                                ? 'bg-red-100'
                                : 'bg-gray-100'
                              }`}>
                              <input
                                type="number"
                                step={0.1}
                                min={param.worst}
                                max={param.best}
                                value={sensitivityValues[sensitivityScenario as keyof typeof sensitivityValues][key]}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value) || 0;
                                  // Clamp value within bounds
                                  const clampedValue = Math.max(param.worst, Math.min(param.best, newValue));
                                  setSensitivityValues(prev => ({
                                    ...prev,
                                    [sensitivityScenario]: {
                                      ...prev[sensitivityScenario as keyof typeof prev],
                                      [key]: clampedValue
                                    }
                                  }));
                                }}
                                className={`w-12 text-center text-sm font-bold bg-transparent border-none outline-none ${sensitivityValues[sensitivityScenario as keyof typeof sensitivityValues][key] > 0
                                  ? 'text-green-700'
                                  : sensitivityValues[sensitivityScenario as keyof typeof sensitivityValues][key] < 0
                                    ? 'text-red-700'
                                    : 'text-gray-700'
                                  }`}
                              />
                              <span className={`text-sm font-bold ${sensitivityValues[sensitivityScenario as keyof typeof sensitivityValues][key] > 0
                                ? 'text-green-700'
                                : sensitivityValues[sensitivityScenario as keyof typeof sensitivityValues][key] < 0
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                                }`}>
                                {param.unit}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-red-600 font-medium w-12 text-left">
                              {param.worst}{param.unit}
                            </span>
                            <div className="flex-1 relative">
                              <input
                                type="range"
                                min={param.worst}
                                max={param.best}
                                step={0.1}
                                value={sensitivityValues[sensitivityScenario as keyof typeof sensitivityValues][key]}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  setSensitivityValues(prev => ({
                                    ...prev,
                                    [sensitivityScenario]: {
                                      ...prev[sensitivityScenario as keyof typeof prev],
                                      [key]: newValue
                                    }
                                  }));
                                }}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, 
                                    #fecaca 0%, 
                                    #f3f4f6 45%, 
                                    #f3f4f6 55%, 
                                    #bbf7d0 100%)`
                                }}
                              />
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-500"></div>
                            </div>
                            <span className="text-xs text-green-600 font-medium w-12 text-right">
                              +{param.best}{param.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CEO-Level KPIs Row */}
                <div className="flex gap-3 mb-6 overflow-x-auto whitespace-nowrap">
                  {/* Enterprise Value */}
                  <Card className="flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center">
                    <CardHeader className="p-0 mb-1 flex flex-col items-center">
                      <Building2 className="h-5 w-5 text-primary mb-1" />
                      <CardTitle className="text-xs">Enterprise Value</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="text-lg font-bold">
                        ${((1000000) *
                          (sensitivityScenario === 'best' ? 1.2 : sensitivityScenario === 'worst' ? 0.8 : 1) / 1000000).toFixed(1)}M
                      </div>
                    </CardContent>
                  </Card>

                  {/* Equity Value */}
                  <Card className="flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center">
                    <CardHeader className="p-0 mb-1 flex flex-col items-center">
                      <DollarSign className="h-5 w-5 text-primary mb-1" />
                      <CardTitle className="text-xs">Equity Value</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="text-lg font-bold">
                        ${((800000) *
                          (sensitivityScenario === 'best' ? 1.25 : sensitivityScenario === 'worst' ? 0.75 : 1) / 1000000).toFixed(1)}M
                      </div>
                    </CardContent>
                  </Card>

                  {/* NPV */}
                  <Card className="flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center">
                    <CardHeader className="p-0 mb-1 flex flex-col items-center">
                      <TrendingUp className="h-5 w-5 text-primary mb-1" />
                      <CardTitle className="text-xs">NPV</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="text-lg font-bold">
                        ${((500000) *
                          (sensitivityScenario === 'best' ? 1.4 : sensitivityScenario === 'worst' ? 0.6 : 1) / 1000000).toFixed(1)}M
                      </div>
                    </CardContent>
                  </Card>

                  {/* IRR */}
                  <Card className="flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center">
                    <CardHeader className="p-0 mb-1 flex flex-col items-center">
                      <Percent className="h-5 w-5 text-primary mb-1" />
                      <CardTitle className="text-xs">IRR</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="text-lg font-bold">
                        {(15 * (sensitivityScenario === 'best' ? 1.3 : sensitivityScenario === 'worst' ? 0.7 : 1)).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payback Period */}
                  <Card className="flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center">
                    <CardHeader className="p-0 mb-1 flex flex-col items-center">
                      <Calendar className="h-5 w-5 text-primary mb-1" />
                      <CardTitle className="text-xs">Payback Period</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="text-lg font-bold">
                        {(3.5 * (sensitivityScenario === 'best' ? 0.8 : sensitivityScenario === 'worst' ? 1.4 : 1)).toFixed(1)} yrs
                      </div>
                    </CardContent>
                  </Card>

                  {/* ROIC */}
                  <Card className="flex-1 max-w-xs p-3 flex flex-col items-center justify-center text-center">
                    <CardHeader className="p-0 mb-1 flex flex-col items-center">
                      <Target className="h-5 w-5 text-primary mb-1" />
                      <CardTitle className="text-xs">ROIC</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="text-lg font-bold">
                        {(18 * (sensitivityScenario === 'best' ? 1.25 : sensitivityScenario === 'worst' ? 0.75 : 1)).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Scenario Waterfall & Revenue Profitability Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Scenario Waterfall Analysis</CardTitle>
                      <p className="text-sm text-muted-foreground">Enterprise Value impact by variable</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={[
                            { variable: 'Base EV', value: 100, cumulative: 100, type: 'base' },
                            { variable: 'Revenue Growth', value: sensitivityScenario === 'best' ? 15 : sensitivityScenario === 'worst' ? -20 : 0, cumulative: sensitivityScenario === 'best' ? 115 : sensitivityScenario === 'worst' ? 80 : 100, type: 'change' },
                            { variable: 'EBITDA Margin', value: sensitivityScenario === 'best' ? 8 : sensitivityScenario === 'worst' ? -12 : 0, cumulative: sensitivityScenario === 'best' ? 123 : sensitivityScenario === 'worst' ? 68 : 100, type: 'change' },
                            { variable: 'WACC', value: sensitivityScenario === 'best' ? 5 : sensitivityScenario === 'worst' ? -8 : 0, cumulative: sensitivityScenario === 'best' ? 128 : sensitivityScenario === 'worst' ? 60 : 100, type: 'change' },
                            { variable: 'Terminal Growth', value: sensitivityScenario === 'best' ? 3 : sensitivityScenario === 'worst' ? -5 : 0, cumulative: sensitivityScenario === 'best' ? 131 : sensitivityScenario === 'worst' ? 55 : 100, type: 'change' },
                            { variable: 'Final EV', value: 0, cumulative: sensitivityScenario === 'best' ? 131 : sensitivityScenario === 'worst' ? 55 : 100, type: 'final' }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="variable" angle={-45} textAnchor="end" height={80} fontSize={10} />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [`${value}%`, name === 'value' ? 'Impact' : 'Cumulative EV']} />
                            <Bar dataKey="value" fill={PRIMARY_COLOR} />
                            <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue & Profitability Trends</CardTitle>
                      <p className="text-sm text-muted-foreground">Historical vs. Projected performance</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={[
                            { year: '2022', revenue: 80, ebitda: 16, netIncome: 8, section: 'historical' },
                            { year: '2023', revenue: 90, ebitda: 20, netIncome: 12, section: 'historical' },
                            { year: '2024', revenue: 100, ebitda: 25, netIncome: 15, section: 'current' },
                            { year: '2025', revenue: 110 * (sensitivityScenario === 'best' ? 1.1 : sensitivityScenario === 'worst' ? 0.9 : 1), ebitda: 30 * (sensitivityScenario === 'best' ? 1.2 : sensitivityScenario === 'worst' ? 0.8 : 1), netIncome: 20 * (sensitivityScenario === 'best' ? 1.3 : sensitivityScenario === 'worst' ? 0.7 : 1), section: 'forecast' },
                            { year: '2026', revenue: 120 * (sensitivityScenario === 'best' ? 1.15 : sensitivityScenario === 'worst' ? 0.85 : 1), ebitda: 36 * (sensitivityScenario === 'best' ? 1.25 : sensitivityScenario === 'worst' ? 0.75 : 1), netIncome: 25 * (sensitivityScenario === 'best' ? 1.4 : sensitivityScenario === 'worst' ? 0.6 : 1), section: 'forecast' },
                            { year: '2027', revenue: 130 * (sensitivityScenario === 'best' ? 1.2 : sensitivityScenario === 'worst' ? 0.8 : 1), ebitda: 42 * (sensitivityScenario === 'best' ? 1.3 : sensitivityScenario === 'worst' ? 0.7 : 1), netIncome: 30 * (sensitivityScenario === 'best' ? 1.5 : sensitivityScenario === 'worst' ? 0.5 : 1), section: 'forecast' }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}M`, '']} />
                            <Legend />
                            <Bar dataKey="revenue" fill={PRIMARY_COLOR} name="Revenue" />
                            <Line type="monotone" dataKey="ebitda" stroke="#f59e0b" strokeWidth={2} name="EBITDA" />
                            <Line type="monotone" dataKey="netIncome" stroke="#059669" strokeWidth={2} name="Net Income" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monte Carlo & Cash Flow Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monte Carlo Simulation</CardTitle>
                      <p className="text-sm text-muted-foreground">NPV probability distribution</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={[
                            { npv: 200, probability: 5, cumulative: 5 },
                            { npv: 300, probability: 15, cumulative: 20 },
                            { npv: 400, probability: 25, cumulative: 45 },
                            { npv: 500, probability: 30, cumulative: 75 },
                            { npv: 600, probability: 20, cumulative: 95 },
                            { npv: 700, probability: 5, cumulative: 100 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="npv" label={{ value: 'NPV ($M)', position: 'insideBottom', offset: -5 }} />
                            <YAxis yAxisId="left" label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
                            <YAxis yAxisId="right" orientation="right" label={{ value: 'Cumulative (%)', angle: 90, position: 'insideRight' }} />
                            <Tooltip />
                            <Bar yAxisId="left" dataKey="probability" fill={INFO_COLOR} name="Probability" />
                            <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#dc2626" strokeWidth={2} name="Cumulative" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow Analysis</CardTitle>
                      <p className="text-sm text-muted-foreground">Operating, Investing & Financing flows</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={[
                            { year: '2024', operating: 25, investing: -5, financing: -8, freeCashFlow: 20 },
                            { year: '2025', operating: 30 * (sensitivityScenario === 'best' ? 1.2 : sensitivityScenario === 'worst' ? 0.8 : 1), investing: -6, financing: -10, freeCashFlow: 24 * (sensitivityScenario === 'best' ? 1.3 : sensitivityScenario === 'worst' ? 0.7 : 1) },
                            { year: '2026', operating: 36 * (sensitivityScenario === 'best' ? 1.25 : sensitivityScenario === 'worst' ? 0.75 : 1), investing: -7, financing: -12, freeCashFlow: 29 * (sensitivityScenario === 'best' ? 1.4 : sensitivityScenario === 'worst' ? 0.6 : 1) },
                            { year: '2027', operating: 42 * (sensitivityScenario === 'best' ? 1.3 : sensitivityScenario === 'worst' ? 0.7 : 1), investing: -8, financing: -15, freeCashFlow: 34 * (sensitivityScenario === 'best' ? 1.5 : sensitivityScenario === 'worst' ? 0.5 : 1) }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}M`, '']} />
                            <Legend />
                            <Bar dataKey="operating" fill={SUCCESS_COLOR} name="Operating CF" />
                            <Bar dataKey="investing" fill={WARNING_COLOR} name="Investing CF" />
                            <Bar dataKey="financing" fill={DANGER_COLOR} name="Financing CF" />
                            <Line type="monotone" dataKey="freeCashFlow" stroke="#8b5cf6" strokeWidth={3} name="Free Cash Flow" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default HistoricalDashboard;
