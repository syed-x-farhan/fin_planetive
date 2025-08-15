import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, DollarSign, Users, TrendingUp, Building, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ServiceBusinessAddon from './addons/ServiceBusinessAddon';
import RetailBusinessAddon from './addons/RetailBusinessAddon';

interface HistoricalExpense {
  category: string;
  historicalAmount: string;
}

interface HistoricalEquipment {
  name: string;
  cost: string;
  usefulLife: string;
  purchaseDate: string;
  depreciationMethod?: 'straight_line' | 'double_declining' | 'sum_of_years_digits' | 'units_of_production';
  salvageValue?: string;
  totalUnits?: string;
  unitsPerYear?: string[];
}

interface HistoricalLoan {
  amount: string;
  rate: string;
  years: string;
  startDate: string;
  loanType: LoanType;
  subType?: string;
  revolvingLimit?: string;
  utilizationRate?: string;
  collateralType?: string;
  guaranteeAmount?: string;
  royaltyPercentage?: string;
  fixedRoyaltyAmount?: string;
  royaltyType?: 'percentage' | 'fixed';
  equityStake?: string;
  tradeDocumentType?: string;
  tenor?: string;
}

type LoanType =
  | 'working_capital'
  | 'sme_loan'
  | 'trade_finance'
  | 'letter_of_guarantee'
  | 'startup_loan';

interface HistoricalOtherIncomeOrCost {
  type: string;
  amount: string;
  isIncome: boolean;
}

interface HistoricalInvestment {
  name: string;
  amount: string;
  date: string;
  expectedReturn?: string;
  maturityValue?: string;
  maturityType?: 'year' | 'duration';
  income: boolean;
  incomeAmount?: string;
}

interface HistoricalShareholder {
  name: string;
  amount: string;
  percent: string;
}

interface HistoricalService {
  name: string;
  historicalRevenue: string;
  historicalClients: string;
  cost: string;
}

interface HistoricalServiceYearData {
  year: string;
  services: HistoricalService[];
}

interface HistoricalExpenseYearData {
  year: string;
  expenses: HistoricalExpense[];
}

interface HistoricalEquipmentYearData {
  year: string;
  equipment: HistoricalEquipment[];
}

interface HistoricalLoanYearData {
  year: string;
  loans: HistoricalLoan[];
}

interface HistoricalOtherYearData {
  year: string;
  other: HistoricalOtherIncomeOrCost[];
}

interface HistoricalInvestmentYearData {
  year: string;
  investments: HistoricalInvestment[];
}

interface HistoricalShareholderYearData {
  year: string;
  shareholders: HistoricalShareholder[];
}

interface BaseHistoricalDataForm {
  // Basic Information
  yearsInBusiness: string;
  forecastYears: string;

  // Historical Data by Year
  historicalServices: HistoricalServiceYearData[];
  historicalExpenses: HistoricalExpenseYearData[];
  historicalEquipment: HistoricalEquipmentYearData[];
  historicalLoans: HistoricalLoanYearData[];
  historicalOther: HistoricalOtherYearData[];
  historicalInvestments: HistoricalInvestmentYearData[];
  historicalShareholders: HistoricalShareholderYearData[];

  // Current Year Data (for projections)
  services: HistoricalService[];
  serviceBusinessModel?: {
    serviceDeliveryModel: 'hourly' | 'project' | 'retainer' | 'subscription';
    pricingStrategy: 'fixed' | 'variable' | 'tiered';
    clientRetentionRate: string;
    utilizationRate: string;
    teamSize: string;
    teamGrowthRate: string;
    averageProjectDuration: string;
    clientAcquisitionCost: string;
    customerLifetimeValue: string;
    recurringRevenuePercent: string;
    churnRate: string;
    expansionRevenuePercent: string;
    seasonalityFactor: string;
  };
  retailBusinessModel?: {
    storeCount: number;
    averageStoreSize: number;
    inventoryTurnover: number;
    grossMargin: number;
    storeUtilization: number;
    customerTraffic: number;
    averageTransactionValue: number;
    seasonalVariation: number;
    onlineSalesPercentage: number;
    supplyChainEfficiency: number;
    storeLocationQuality: number;
    competitiveAdvantage: string;
  };
  expenses: HistoricalExpense[];
  equipment: HistoricalEquipment[];
  loans: HistoricalLoan[];
  other: HistoricalOtherIncomeOrCost[];
  investments: HistoricalInvestment[];
  shareholders: HistoricalShareholder[];

  // Assumptions
  taxRate: string;
  selfFunding: string;
  payrollExpenses: string;
  annualSalaryIncrease: string;
  annualManagementSalaryIncrease: string;
  dividendPayoutRate: string;
  capitalCosts: string;
  operationalCosts: string;

  // Growth Assumptions
  revenueGrowthRate: string;
  expenseGrowthRate: string;
  customerGrowthRate: string;
  totalCustomers: string;

  // Credit Sales & Accounts Payable
  creditSales: {
    percent: string;
    collectionDays: string;
  };
  accountsPayable: {
    days: string;
  };

  // Owner Drawings
  ownerDrawings: {
    amount: string;
    frequency: 'monthly' | 'annual';
  };

  // Fiscal Year
  fiscalYearStart: string;

  // Terminal Value & Discount Rate
  discountRate: string;
  terminalGrowth: string;
  tvMethod: string;
  tvMetric: string;
  tvMultiple: string;
  tvCustomValue: string;
  tvYear: string;

  // WACC & Global Interest Rates
  useWaccBuildUp: boolean;
  useCostOfEquityOnly: boolean;
  rfRate: string;
  beta: string;
  marketPremium: string;
  costOfDebt: string;
  taxRateWacc: string;
  equityPct: string;
  debtPct: string;
  paidUpCapital: string;
  investmentEquity: string;
  globalInterestRates: {
    shortTerm: string;
    longTerm: string;
    investment: string;
    useForLoans: boolean;
  };
}

interface BaseHistoricalDataFormProps {
  onSubmit: (data: BaseHistoricalDataForm) => void;
  isLoading?: boolean;
  companyType?: string;
  initialData?: any;
}

// Reusable Growth Rate Calculator Component
interface GrowthRateCalculatorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  getHistoricalData: () => number[];
  calculationMethod: 'simple' | 'weighted' | 'cagr' | 'custom';
  setCalculationMethod: (method: 'simple' | 'weighted' | 'cagr' | 'custom') => void;
}

const GrowthRateCalculator: React.FC<GrowthRateCalculatorProps> = ({
  label,
  value,
  onChange,
  placeholder,
  getHistoricalData,
  calculationMethod,
  setCalculationMethod
}) => {
  const calculateSimpleAverage = (data: number[]): number => {
    if (data.length < 2) return 0;
    const growthRates = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1] > 0) {
        growthRates.push(((data[i] - data[i - 1]) / data[i - 1]) * 100);
      }
    }
    return growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;
  };

  const calculateWeightedAverage = (data: number[]): number => {
    if (data.length < 2) return 0;
    const growthRates = [];
    const weights = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1] > 0) {
        growthRates.push(((data[i] - data[i - 1]) / data[i - 1]) * 100);
        weights.push(i); // More recent years get higher weights
      }
    }
    if (growthRates.length === 0) return 0;
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    return growthRates.reduce((sum, rate, index) => sum + (rate * weights[index]), 0) / totalWeight;
  };

  const calculateCAGR = (data: number[]): number => {
    if (data.length < 2 || data[0] <= 0 || data[data.length - 1] <= 0) return 0;
    const periods = data.length - 1;
    return Math.pow(data[data.length - 1] / data[0], 1 / periods) - 1;
  };

  const handleMethodClick = (method: 'simple' | 'weighted' | 'cagr' | 'custom') => {
    if (method === 'custom') {
      setCalculationMethod('custom');
      return;
    }

    const data = getHistoricalData();
    let rate = 0;

    switch (method) {
      case 'simple':
        rate = calculateSimpleAverage(data);
        break;
      case 'weighted':
        rate = calculateWeightedAverage(data);
        break;
      case 'cagr':
        rate = calculateCAGR(data) * 100;
        break;
    }

    onChange(rate.toFixed(1));
    setCalculationMethod(method);
  };

  const getMethodValue = (method: 'simple' | 'weighted' | 'cagr'): string => {
    const data = getHistoricalData();
    let rate = 0;

    switch (method) {
      case 'simple':
        rate = calculateSimpleAverage(data);
        break;
      case 'weighted':
        rate = calculateWeightedAverage(data);
        break;
      case 'cagr':
        rate = calculateCAGR(data) * 100;
        break;
    }

    return rate.toFixed(1);
  };

  return (
    <div>
      <Label className="flex items-center gap-2">
        {label}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Choose calculation method: Simple Average (basic average), Weighted Average (recent years matter more), CAGR (compound growth over time), or Custom (manual input).</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded hover:bg-teal-50 ${calculationMethod === 'simple' ? 'border-teal-200 bg-teal-50' : 'border-gray-200'
            }`}
          title="Simple Average: Basic average of year-over-year growth rates"
          onClick={() => handleMethodClick('simple')}
        >
          Simple ({getMethodValue('simple')}%)
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded hover:bg-teal-50 ${calculationMethod === 'weighted' ? 'border-teal-200 bg-teal-50' : 'border-gray-200'
            }`}
          title="Weighted Average: Recent years have more influence on the calculation"
          onClick={() => handleMethodClick('weighted')}
        >
          Weighted ({getMethodValue('weighted')}%)
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded hover:bg-teal-50 ${calculationMethod === 'cagr' ? 'border-teal-200 bg-teal-50' : 'border-gray-200'
            }`}
          title="CAGR: Compound Annual Growth Rate over the entire time period"
          onClick={() => handleMethodClick('cagr')}
        >
          CAGR ({getMethodValue('cagr')}%)
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs border rounded hover:bg-teal-50 ${calculationMethod === 'custom' ? 'border-teal-200 bg-teal-50' : 'border-gray-200'
            }`}
          title="Custom: Enter your own growth rate"
          onClick={() => handleMethodClick('custom')}
        >
          Custom
        </button>
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCalculationMethod('custom');
        }}
        placeholder={placeholder}
        disabled={calculationMethod !== 'custom'}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {calculationMethod === 'custom'
          ? 'Enter your custom growth rate'
          : 'Auto-calculated from your historical data. Click Custom to override.'}
      </p>
    </div>
  );
};

// Helper function to convert year to date format
const convertYearToDate = (year: string | number): string => {
  if (!year) return `${new Date().getFullYear()}-01-01`;
  const yearStr = year.toString();
  // If it's already in date format, return as is
  if (yearStr.includes('-')) return yearStr;
  // Convert year to date format (January 1st of that year)
  return `${yearStr}-01-01`;
};

const BaseHistoricalDataForm: React.FC<BaseHistoricalDataFormProps> = ({ onSubmit, isLoading = false, companyType = 'service', initialData }) => {
  // Section toggles
  const [hasExpenses, setHasExpenses] = useState(true);
  const [hasEquipment, setHasEquipment] = useState(false);
  const [hasLoans, setHasLoans] = useState(false);
  const [hasOther, setHasOther] = useState(false);
  const [hasInvestments, setHasInvestments] = useState(false);
  const [hasShareholders, setHasShareholders] = useState(false);
  const [hasGlobalInterestRates, setHasGlobalInterestRates] = useState(false);

  // Current year data (for projections)
  const [services, setServices] = useState<HistoricalService[]>([
    { name: '', historicalRevenue: '', historicalClients: '', cost: '' }
  ]);
  const [expenses, setExpenses] = useState<HistoricalExpense[]>([]);
  const [equipment, setEquipment] = useState<HistoricalEquipment[]>([]);
  const [loans, setLoans] = useState<HistoricalLoan[]>([]);
  const [other, setOther] = useState<HistoricalOtherIncomeOrCost[]>([]);
  const [investments, setInvestments] = useState<HistoricalInvestment[]>([]);
  const [shareholders, setShareholders] = useState<HistoricalShareholder[]>([]);

  // Service business model state
  const [serviceBusinessModel, setServiceBusinessModel] = useState({
    serviceDeliveryModel: 'hourly' as 'hourly' | 'project' | 'retainer' | 'subscription',
    pricingStrategy: 'fixed' as 'fixed' | 'variable' | 'tiered',
    clientRetentionRate: '85',
    utilizationRate: '75',
    teamSize: '10',
    teamGrowthRate: '20',
    averageProjectDuration: '90',
    clientAcquisitionCost: '5000',
    customerLifetimeValue: '25000',
    recurringRevenuePercent: '60',
    churnRate: '15',
    expansionRevenuePercent: '25',
    seasonalityFactor: '20'
  });

  // Retail business model state
  const [retailBusinessModel, setRetailBusinessModel] = useState({
    storeCount: 1,
    averageStoreSize: 2000,
    inventoryTurnover: 4.5,
    grossMargin: 35.0,
    storeUtilization: 75.0,
    customerTraffic: 150,
    averageTransactionValue: 45.50,
    seasonalVariation: 25.0,
    onlineSalesPercentage: 15.0,
    supplyChainEfficiency: 7.5,
    storeLocationQuality: 8.0,
    competitiveAdvantage: ''
  });

  // Simple fields
  const [yearsInBusiness, setYearsInBusiness] = useState('3');
  const [forecastYears, setForecastYears] = useState('5');
  const [taxRate, setTaxRate] = useState('25');
  const [selfFunding, setSelfFunding] = useState('');
  const [revenueGrowthRate, setRevenueGrowthRate] = useState('10');
  const [expenseGrowthRate, setExpenseGrowthRate] = useState('5');
  const [customerGrowthRate, setCustomerGrowthRate] = useState('15');
  const [totalCustomers, setTotalCustomers] = useState('100');

  // Calculation method states
  const [revenueCalculationMethod, setRevenueCalculationMethod] = useState<'simple' | 'weighted' | 'cagr' | 'custom'>('custom');
  const [expenseCalculationMethod, setExpenseCalculationMethod] = useState<'simple' | 'weighted' | 'cagr' | 'custom'>('custom');
  const [customerCalculationMethod, setCustomerCalculationMethod] = useState<'simple' | 'weighted' | 'cagr' | 'custom'>('custom');

  // Additional fields from venture forms
  const [creditSalesPercent, setCreditSalesPercent] = useState('');
  const [creditCollectionDays, setCreditCollectionDays] = useState('');
  const [apDays, setApDays] = useState('');
  const [payrollExpenses, setPayrollExpenses] = useState('');
  const [annualSalaryIncrease, setAnnualSalaryIncrease] = useState('3');
  const [annualManagementSalaryIncrease, setAnnualManagementSalaryIncrease] = useState('5');
  const [dividendPayoutRate, setDividendPayoutRate] = useState('30');
  const [capitalCosts, setCapitalCosts] = useState('');
  const [operationalCosts, setOperationalCosts] = useState('');

  const [ownerDrawings, setOwnerDrawings] = useState('');
  const [ownerDrawingsFrequency, setOwnerDrawingsFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [fiscalYearStart, setFiscalYearStart] = useState('January');
  const [discountRate, setDiscountRate] = useState('10');
  const [terminalGrowth, setTerminalGrowth] = useState('2');
  const [tvMethod, setTvMethod] = useState('perpetuity');
  const [tvMetric, setTvMetric] = useState('EBITDA');
  const [tvMultiple, setTvMultiple] = useState('8');
  const [tvCustomValue, setTvCustomValue] = useState('');
  const [tvYear, setTvYear] = useState('5');
  const [useWaccBuildUp, setUseWaccBuildUp] = useState(false);
  const [useCostOfEquityOnly, setUseCostOfEquityOnly] = useState(false);
  const [rfRate, setRfRate] = useState('3');
  const [beta, setBeta] = useState('1.2');
  const [marketPremium, setMarketPremium] = useState('6');
  const [costOfDebt, setCostOfDebt] = useState('8');
  const [taxRateWacc, setTaxRateWacc] = useState('25');
  const [equityPct, setEquityPct] = useState('70');
  const [debtPct, setDebtPct] = useState('30');
  const [paidUpCapital, setPaidUpCapital] = useState('');
  const [investmentEquity, setInvestmentEquity] = useState('');
  const [globalInterestRates, setGlobalInterestRates] = useState({
    shortTerm: '5',
    longTerm: '6',
    investment: '4',
    useForLoans: false
  });

  // Data extraction functions for the GrowthRateCalculator component
  const getHistoricalRevenueData = (): number[] => {
    return historicalServices.flatMap(yearData =>
      yearData.services.map(service => parseFloat(service.historicalRevenue) || 0)
    ).filter(amount => amount > 0);
  };

  const getHistoricalExpenseData = (): number[] => {
    return historicalExpenses.flatMap(yearData =>
      yearData.expenses.map(expense => parseFloat(expense.historicalAmount) || 0)
    ).filter(amount => amount > 0);
  };

  const getHistoricalCustomerData = (): number[] => {
    return historicalServices.flatMap(yearData =>
      yearData.services.map(service => parseFloat(service.historicalClients) || 0)
    ).filter(amount => amount > 0);
  };

  // Populate form with initial data when available
  useEffect(() => {
    if (initialData) {
      // Populate historical expenses
      if (initialData.historicalExpenses) {
        setHistoricalExpenses(initialData.historicalExpenses.map((yearData: any) => ({
          year: (yearData.year || new Date().getFullYear()).toString(),
          expenses: yearData.expenses.map((expense: any) => ({
            category: expense.category || '',
            historicalAmount: (expense.amount || 0).toString(),
            growthRate: '0'
          }))
        })));
      }

      // Populate historical equipment
      if (initialData.historicalEquipment) {
        setHistoricalEquipment(initialData.historicalEquipment.map((yearData: any) => ({
          year: (yearData.year || new Date().getFullYear()).toString(),
          equipment: yearData.equipment.map((item: any) => ({
            name: item.name || '',
            cost: (item.purchaseCost || 0).toString(),
            usefulLife: (item.usefulLife || 5).toString(),
            // Convert year to proper date format for purchase date
            purchaseDate: convertYearToDate(item.purchaseYear),
            depreciationMethod: (item.depreciationMethod || 'Straight Line').toLowerCase().replace(' ', '_') as any
          }))
        })));
        // Auto-toggle equipment section when equipment is imported
        setHasEquipment(true);
      }

      // Populate historical loans
      if (initialData.historicalLoans) {
        setHistoricalLoans(initialData.historicalLoans.map((yearData: any) => ({
          year: (yearData.year || new Date().getFullYear()).toString(),
          loans: yearData.loans.map((loan: any) => ({
            amount: (loan.amount || 0).toString(),
            rate: (loan.interestRate || 0).toString(),
            years: (loan.term || 1).toString(),
            // Convert year to proper date format for start date
            startDate: convertYearToDate(loan.startYear),
            loanType: (loan.loanType || 'Working Capital').toLowerCase().replace(' ', '_') as any,
            subType: loan.subType || ''
          }))
        })));
        // Auto-toggle loans section when loans are imported
        setHasLoans(true);
      }

      // Populate historical other income/costs
      if (initialData.historicalOtherIncomeCosts) {
        setHistoricalOther(initialData.historicalOtherIncomeCosts.map((yearData: any) => ({
          year: (yearData.year || new Date().getFullYear()).toString(),
          other: yearData.items.map((item: any) => ({
            type: item.description || '',
            amount: (item.amount || 0).toString(),
            isIncome: item.type === 'Income'
          }))
        })));
        // Auto-toggle other income/costs section when data is imported
        setHasOther(true);
      }

      // Populate historical investments
      if (initialData.historicalInvestments) {
        setHistoricalInvestments(initialData.historicalInvestments.map((yearData: any) => ({
          year: (yearData.year || new Date().getFullYear()).toString(),
          investments: yearData.investments.map((investment: any) => ({
            name: investment.name || '',
            amount: (investment.amount || 0).toString(),
            // Convert year to proper date format for investment date
            date: convertYearToDate(investment.year),
            income: false,
            incomeAmount: ''
          }))
        })));
        // Auto-toggle investments section when data is imported
        setHasInvestments(true);
      }

      // Populate historical shareholders
      if (initialData.historicalShareholders) {
        setHistoricalShareholders(initialData.historicalShareholders.map((yearData: any) => ({
          year: (yearData.year || new Date().getFullYear()).toString(),
          shareholders: yearData.shareholders.map((shareholder: any) => ({
            name: shareholder.name || '',
            amount: (shareholder.sharesOwned || 0).toString(),
            percent: (shareholder.ownershipPercent || 0).toString()
          }))
        })));
        // Auto-toggle shareholders section when data is imported
        setHasShareholders(true);
      }

      // Populate historical services (if available)
      if (initialData.historicalServices) {
        setHistoricalServices(initialData.historicalServices.map((yearData: any) => ({
          year: (yearData.year || new Date().getFullYear()).toString(),
          services: yearData.services.map((service: any) => ({
            name: service.serviceName || '',
            historicalRevenue: (service.revenue || 0).toString(),
            historicalClients: '0',
            growthRate: '0',
            cost: (service.cost || 0).toString()
          }))
        })));
      }
    }
  }, [initialData]);

  const [historicalServices, setHistoricalServices] = useState<HistoricalServiceYearData[]>([
    { year: '2023', services: [{ name: '', historicalRevenue: '', historicalClients: '', cost: '' }] },
    { year: '2024', services: [{ name: '', historicalRevenue: '', historicalClients: '', cost: '' }] },
    { year: '2025', services: [{ name: '', historicalRevenue: '', historicalClients: '', cost: '' }] }
  ]);

  const [historicalExpenses, setHistoricalExpenses] = useState<HistoricalExpenseYearData[]>([
    { year: '2023', expenses: [] },
    { year: '2024', expenses: [] },
    { year: '2025', expenses: [] }
  ]);

  const [historicalEquipment, setHistoricalEquipment] = useState<HistoricalEquipmentYearData[]>([
    { year: '2023', equipment: [] },
    { year: '2024', equipment: [] },
    { year: '2025', equipment: [] }
  ]);

  const [historicalLoans, setHistoricalLoans] = useState<HistoricalLoanYearData[]>([
    { year: '2023', loans: [] },
    { year: '2024', loans: [] },
    { year: '2025', loans: [] }
  ]);

  const [historicalOther, setHistoricalOther] = useState<HistoricalOtherYearData[]>([
    { year: '2023', other: [] },
    { year: '2024', other: [] },
    { year: '2025', other: [] }
  ]);

  const [historicalInvestments, setHistoricalInvestments] = useState<HistoricalInvestmentYearData[]>([
    { year: '2023', investments: [] },
    { year: '2024', investments: [] },
    { year: '2025', investments: [] }
  ]);

  const [historicalShareholders, setHistoricalShareholders] = useState<HistoricalShareholderYearData[]>([
    { year: '2023', shareholders: [] },
    { year: '2024', shareholders: [] },
    { year: '2025', shareholders: [] }
  ]);

  // Update historical data when years in business changes
  React.useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = parseInt(yearsInBusiness) || 3;

    // Update historical data
    const newHistoricalServices: HistoricalServiceYearData[] = [];
    const newHistoricalExpenses: HistoricalExpenseYearData[] = [];
    const newHistoricalEquipment: HistoricalEquipmentYearData[] = [];
    const newHistoricalLoans: HistoricalLoanYearData[] = [];
    const newHistoricalOther: HistoricalOtherYearData[] = [];
    const newHistoricalInvestments: HistoricalInvestmentYearData[] = [];
    const newHistoricalShareholders: HistoricalShareholderYearData[] = [];

    // FIXED: Align with backend logic - historical years should start from (currentYear - years + 1)
    // For yearsInBusiness = 2: generates 2024, 2025 (2024 = historical, 2025 = current)
    // For yearsInBusiness = 3: generates 2023, 2024, 2025 (2023, 2024 = historical, 2025 = current)
    for (let i = 0; i < years; i++) {
      const year = (currentYear - years + i + 1).toString();

      newHistoricalServices.push({
        year,
        services: [{ name: '', historicalRevenue: '', historicalClients: '', cost: '' }]
      });

      newHistoricalExpenses.push({
        year,
        expenses: []
      });

      newHistoricalEquipment.push({
        year,
        equipment: []
      });

      newHistoricalLoans.push({
        year,
        loans: []
      });

      newHistoricalOther.push({
        year,
        other: []
      });

      newHistoricalInvestments.push({
        year,
        investments: []
      });

      newHistoricalShareholders.push({
        year,
        shareholders: []
      });
    }

    setHistoricalServices(newHistoricalServices);
    setHistoricalExpenses(newHistoricalExpenses);
    setHistoricalEquipment(newHistoricalEquipment);
    setHistoricalLoans(newHistoricalLoans);
    setHistoricalOther(newHistoricalOther);
    setHistoricalInvestments(newHistoricalInvestments);
    setHistoricalShareholders(newHistoricalShareholders);
  }, [yearsInBusiness]);

  // Service handlers
  const handleServiceChange = (idx: number, field: keyof HistoricalService, value: string) => {
    setServices(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addService = () => setServices(s => [...s, { name: '', historicalRevenue: '', historicalClients: '', cost: '' }]);
  const removeService = (idx: number) => setServices(s => s.filter((_, i) => i !== idx));

  const handleHistoricalServiceChange = (yearIdx: number, serviceIdx: number, field: keyof HistoricalService, value: string) => {
    setHistoricalServices(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          services: yearData.services.map((service, j) =>
            j === serviceIdx ? { ...service, [field]: value } : service
          )
        }
        : yearData
    ));
  };

  const addHistoricalService = (yearIdx: number) => {
    setHistoricalServices(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          services: [...yearData.services, { name: '', historicalRevenue: '', historicalClients: '', cost: '' }]
        }
        : yearData
    ));
  };

  const removeHistoricalService = (yearIdx: number, serviceIdx: number) => {
    setHistoricalServices(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          services: yearData.services.filter((_, j) => j !== serviceIdx)
        }
        : yearData
    ));
  };

  const handleExpenseChange = (idx: number, field: keyof HistoricalExpense, value: string) => {
    setExpenses(e => e.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addExpense = () => setExpenses(e => [...e, { category: '', historicalAmount: '' }]);
  const removeExpense = (idx: number) => setExpenses(e => e.filter((_, i) => i !== idx));

  const handleEquipmentChange = (idx: number, field: keyof HistoricalEquipment, value: string) => {
    setEquipment(e => e.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addEquipment = () => setEquipment(e => [...e, { name: '', cost: '', usefulLife: '', purchaseDate: '' }]);
  const removeEquipment = (idx: number) => setEquipment(e => e.filter((_, i) => i !== idx));

  const handleLoanChange = (idx: number, field: keyof HistoricalLoan, value: string) => {
    setLoans(l => l.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addLoan = () => setLoans(l => [...l, { amount: '', rate: '', years: '', startDate: '', loanType: 'working_capital' }]);
  const removeLoan = (idx: number) => setLoans(l => l.filter((_, i) => i !== idx));

  const handleHistoricalExpenseChange = (yearIdx: number, expenseIdx: number, field: keyof HistoricalExpense, value: string) => {
    setHistoricalExpenses(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          expenses: yearData.expenses.map((expense, j) =>
            j === expenseIdx ? { ...expense, [field]: value } : expense
          )
        }
        : yearData
    ));
  };

  const addHistoricalExpense = (yearIdx: number) => {
    setHistoricalExpenses(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          expenses: [...yearData.expenses, { category: '', historicalAmount: '', growthRate: '' }]
        }
        : yearData
    ));
  };

  const removeHistoricalExpense = (yearIdx: number, expenseIdx: number) => {
    setHistoricalExpenses(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          expenses: yearData.expenses.filter((_, j) => j !== expenseIdx)
        }
        : yearData
    ));
  };

  const handleHistoricalEquipmentChange = (yearIdx: number, equipmentIdx: number, field: keyof HistoricalEquipment, value: string) => {
    setHistoricalEquipment(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          equipment: yearData.equipment.map((equipment, j) =>
            j === equipmentIdx ? { ...equipment, [field]: value } : equipment
          )
        }
        : yearData
    ));
  };

  const addHistoricalEquipment = (yearIdx: number) => {
    setHistoricalEquipment(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          equipment: [...yearData.equipment, { name: '', cost: '', usefulLife: '', purchaseDate: '' }]
        }
        : yearData
    ));
  };

  const removeHistoricalEquipment = (yearIdx: number, equipmentIdx: number) => {
    setHistoricalEquipment(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          equipment: yearData.equipment.filter((_, j) => j !== equipmentIdx)
        }
        : yearData
    ));
  };

  const handleHistoricalLoanChange = (yearIdx: number, loanIdx: number, field: keyof HistoricalLoan, value: string) => {
    setHistoricalLoans(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          loans: yearData.loans.map((loan, j) =>
            j === loanIdx ? { ...loan, [field]: value } : loan
          )
        }
        : yearData
    ));
  };

  const addHistoricalLoan = (yearIdx: number) => {
    setHistoricalLoans(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          loans: [...yearData.loans, { amount: '', rate: '', years: '', startDate: '', loanType: 'working_capital' }]
        }
        : yearData
    ));
  };

  const removeHistoricalLoan = (yearIdx: number, loanIdx: number) => {
    setHistoricalLoans(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          loans: yearData.loans.filter((_, j) => j !== loanIdx)
        }
        : yearData
    ));
  };

  const handleOtherChange = (idx: number, field: keyof HistoricalOtherIncomeOrCost, value: string | boolean) => {
    setOther(o => o.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addOther = () => setOther(o => [...o, { type: '', amount: '', isIncome: true }]);
  const removeOther = (idx: number) => setOther(o => o.filter((_, i) => i !== idx));

  const handleHistoricalOtherChange = (yearIdx: number, otherIdx: number, field: keyof HistoricalOtherIncomeOrCost, value: string | boolean) => {
    setHistoricalOther(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          other: yearData.other.map((item, j) =>
            j === otherIdx ? { ...item, [field]: value } : item
          )
        }
        : yearData
    ));
  };

  const addHistoricalOther = (yearIdx: number) => {
    setHistoricalOther(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          other: [...yearData.other, { type: '', amount: '', isIncome: true }]
        }
        : yearData
    ));
  };

  const removeHistoricalOther = (yearIdx: number, otherIdx: number) => {
    setHistoricalOther(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          other: yearData.other.filter((_, j) => j !== otherIdx)
        }
        : yearData
    ));
  };

  const handleInvestmentChange = (idx: number, field: keyof HistoricalInvestment, value: string | boolean) => {
    setInvestments(inv => inv.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addInvestment = () => setInvestments(inv => [...inv, { name: '', amount: '', date: '', expectedReturn: '', maturityValue: '', maturityType: 'year', income: false, incomeAmount: '' }]);
  const removeInvestment = (idx: number) => setInvestments(inv => inv.filter((_, i) => i !== idx));

  const handleHistoricalInvestmentChange = (yearIdx: number, investmentIdx: number, field: keyof HistoricalInvestment, value: string | boolean) => {
    setHistoricalInvestments(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          investments: yearData.investments.map((item, j) =>
            j === investmentIdx ? { ...item, [field]: value } : item
          )
        }
        : yearData
    ));
  };

  const addHistoricalInvestment = (yearIdx: number) => {
    setHistoricalInvestments(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          investments: [...yearData.investments, { name: '', amount: '', date: '', expectedReturn: '', maturityValue: '', maturityType: 'year', income: false, incomeAmount: '' }]
        }
        : yearData
    ));
  };

  const removeHistoricalInvestment = (yearIdx: number, investmentIdx: number) => {
    setHistoricalInvestments(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          investments: yearData.investments.filter((_, j) => j !== investmentIdx)
        }
        : yearData
    ));
  };

  const handleShareholderChange = (idx: number, field: keyof HistoricalShareholder, value: string) => {
    setShareholders(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addShareholder = () => setShareholders(s => [...s, { name: '', amount: '', percent: '' }]);
  const removeShareholder = (idx: number) => setShareholders(s => s.filter((_, i) => i !== idx));

  const handleHistoricalShareholderChange = (yearIdx: number, shareholderIdx: number, field: keyof HistoricalShareholder, value: string) => {
    setHistoricalShareholders(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          shareholders: yearData.shareholders.map((item, j) =>
            j === shareholderIdx ? { ...item, [field]: value } : item
          )
        }
        : yearData
    ));
  };

  const addHistoricalShareholder = (yearIdx: number) => {
    setHistoricalShareholders(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          shareholders: [...yearData.shareholders, { name: '', amount: '', percent: '' }]
        }
        : yearData
    ));
  };

  const removeHistoricalShareholder = (yearIdx: number, shareholderIdx: number) => {
    setHistoricalShareholders(h => h.map((yearData, i) =>
      i === yearIdx
        ? {
          ...yearData,
          shareholders: yearData.shareholders.filter((_, j) => j !== shareholderIdx)
        }
        : yearData
    ));
  };

  const handleSubmit = () => {
    const formData: BaseHistoricalDataForm = {
      yearsInBusiness,
      forecastYears,
      historicalServices,
      historicalExpenses,
      historicalEquipment,
      historicalLoans,
      historicalOther,
      historicalInvestments,
      historicalShareholders,
      services: companyType === 'service' ? services : [],
      serviceBusinessModel: companyType === 'service' ? serviceBusinessModel : undefined,
      retailBusinessModel: companyType === 'retail' ? retailBusinessModel : undefined,
      expenses: hasExpenses ? expenses : [],
      equipment: hasEquipment ? equipment : [],
      loans: hasLoans ? loans : [],
      other,
      investments,
      shareholders,
      taxRate,
      selfFunding,
      payrollExpenses,
      annualSalaryIncrease,
      annualManagementSalaryIncrease,
      dividendPayoutRate,
      capitalCosts,
      operationalCosts,
      revenueGrowthRate,
      expenseGrowthRate,
      customerGrowthRate,
      totalCustomers,
      creditSales: { percent: creditSalesPercent, collectionDays: creditCollectionDays },
      accountsPayable: { days: apDays },
      ownerDrawings: { amount: ownerDrawings, frequency: ownerDrawingsFrequency },
      fiscalYearStart,
      discountRate,
      terminalGrowth,
      tvMethod,
      tvMetric,
      tvMultiple,
      tvCustomValue,
      tvYear,
      useWaccBuildUp,
      useCostOfEquityOnly,
      rfRate,
      beta,
      marketPremium,
      costOfDebt,
      taxRateWacc,
      equityPct,
      debtPct,
      paidUpCapital,
      investmentEquity,
      globalInterestRates
    };
    onSubmit(formData);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Historical Business Model</CardTitle>
          <CardDescription className="text-lg">
            Tell us about your business history to create better financial projections
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Basic Information Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Basic Information</CardTitle>
          <CardDescription>Core business setup and configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="yearsInBusiness">Years in Business</Label>
              <Input
                type="number"
                value={yearsInBusiness}
                onChange={(e) => setYearsInBusiness(e.target.value)}
                placeholder="3"
              />
            </div>

            <div>
              <Label htmlFor="forecastYears">Forecast Years</Label>
              <Input
                type="number"
                value={forecastYears}
                onChange={(e) => setForecastYears(e.target.value)}
                placeholder="5"
              />
            </div>

            <div>
              <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
              <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="January">January</SelectItem>
                  <SelectItem value="June">June</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="selfFunding">Self Funding Amount</Label>
              <Input
                type="number"
                value={selfFunding}
                onChange={(e) => setSelfFunding(e.target.value)}
                placeholder="50000"
              />
              <p className="text-xs text-muted-foreground mt-1">Amount you can invest from own resources</p>
            </div>

            <div>
              <Label htmlFor="totalCustomers">Total Customers</Label>
              <Input
                type="number"
                value={totalCustomers}
                onChange={(e) => setTotalCustomers(e.target.value)}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground mt-1">Current total customer base</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Assumptions Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Financial Assumptions</CardTitle>
          <CardDescription>Key financial parameters and growth rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="25"
              />
            </div>

            <div>
              <Label htmlFor="dividendPayoutRate">Dividend Payout Rate (%)</Label>
              <Input
                type="number"
                value={dividendPayoutRate}
                onChange={(e) => setDividendPayoutRate(e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground mt-1">Percentage of profits paid as dividends</p>
            </div>

            <div>
              <Label htmlFor="revenueGrowthRate">Revenue Growth Rate (%)</Label>
              <Input
                type="number"
                value={revenueGrowthRate}
                onChange={(e) => setRevenueGrowthRate(e.target.value)}
                placeholder="10"
              />
            </div>

            <div>
              <Label htmlFor="expenseGrowthRate">Expense Growth Rate (%)</Label>
              <Input
                type="number"
                value={expenseGrowthRate}
                onChange={(e) => setExpenseGrowthRate(e.target.value)}
                placeholder="5"
              />
            </div>

            <div>
              <Label htmlFor="customerGrowthRate">Customer Growth Rate (%)</Label>
              <Input
                type="number"
                value={customerGrowthRate}
                onChange={(e) => setCustomerGrowthRate(e.target.value)}
                placeholder="15"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Costs Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Operational Costs & Expenses</CardTitle>
          <CardDescription>Annual operational and capital expenditure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="payrollExpenses">Payroll Expenses ($)</Label>
              <Input
                type="number"
                value={payrollExpenses}
                onChange={(e) => setPayrollExpenses(e.target.value)}
                placeholder="100000"
              />
              <p className="text-xs text-muted-foreground mt-1">Annual payroll costs</p>
            </div>

            <div>
              <Label htmlFor="operationalCosts">Operational Costs ($)</Label>
              <Input
                type="number"
                value={operationalCosts}
                onChange={(e) => setOperationalCosts(e.target.value)}
                placeholder="75000"
              />
              <p className="text-xs text-muted-foreground mt-1">Annual operational expenses</p>
            </div>

            <div>
              <Label htmlFor="capitalCosts">Capital Costs ($)</Label>
              <Input
                type="number"
                value={capitalCosts}
                onChange={(e) => setCapitalCosts(e.target.value)}
                placeholder="50000"
              />
              <p className="text-xs text-muted-foreground mt-1">Annual capital expenditure</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Growth Assumptions Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Salary Growth Assumptions</CardTitle>
          <CardDescription>Expected annual salary increases for different employee categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="annualSalaryIncrease">Annual Salary Increase (%)</Label>
              <Input
                type="number"
                value={annualSalaryIncrease}
                onChange={(e) => setAnnualSalaryIncrease(e.target.value)}
                placeholder="3"
              />
              <p className="text-xs text-muted-foreground mt-1">Expected annual salary growth for staff</p>
            </div>

            <div>
              <Label htmlFor="annualManagementSalaryIncrease">Management Salary Increase (%)</Label>
              <Input
                type="number"
                value={annualManagementSalaryIncrease}
                onChange={(e) => setAnnualManagementSalaryIncrease(e.target.value)}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground mt-1">Expected annual salary growth for management</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Business Add-on */}
      {companyType === 'service' && (
        <ServiceBusinessAddon
          historicalServices={historicalServices}
          services={services}
          serviceBusinessModel={serviceBusinessModel}
          onHistoricalServicesChange={setHistoricalServices}
          onServicesChange={setServices}
          onServiceBusinessModelChange={setServiceBusinessModel}
          yearsInBusiness={yearsInBusiness}
        />
      )}

      {/* Retail Business Add-on */}
      {companyType === 'retail' && (
        <RetailBusinessAddon
          retailBusinessModel={retailBusinessModel}
          onRetailBusinessModelChange={setRetailBusinessModel}
        />
      )}

      {/* Owner Drawings Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Owner Drawings</CardTitle>
          <CardDescription>Enter owner drawings information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            {/* Owner Drawings */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Owner Drawings</h4>
              <div className="space-y-4">
                <div>
                  <Label>Drawings Amount</Label>
                  <Input
                    type="number"
                    value={ownerDrawings}
                    onChange={(e) => setOwnerDrawings(e.target.value)}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select value={ownerDrawingsFrequency} onValueChange={(value: 'monthly' | 'annual') => setOwnerDrawingsFrequency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Expenses by Year Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Historical Expenses by Year</CardTitle>
          <CardDescription>Enter your expenses data for each year</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {historicalExpenses.map((yearData, yearIdx) => (
            <Card key={yearIdx} className="p-4 border-2 border-teal-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Year {yearData.year}</h4>
                <Button type="button" onClick={() => addHistoricalExpense(yearIdx)} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </div>
              <div className="space-y-4">
                {yearData.expenses.map((expense, expenseIdx) => (
                  <Card key={expenseIdx} className="p-4 border border-teal-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Expense Category</Label>
                        <Input
                          value={expense.category}
                          onChange={(e) => handleHistoricalExpenseChange(yearIdx, expenseIdx, 'category', e.target.value)}
                          placeholder="e.g., Rent, Salaries, Marketing"
                        />
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={expense.historicalAmount}
                          onChange={(e) => handleHistoricalExpenseChange(yearIdx, expenseIdx, 'historicalAmount', e.target.value)}
                          placeholder="12000"
                        />
                      </div>

                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeHistoricalExpense(yearIdx, expenseIdx)}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Historical Equipment by Year Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Historical Equipment by Year (Optional)</CardTitle>
              <CardDescription>Enter your equipment data for each year</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="has-equipment" className="text-sm font-medium">Include Equipment</Label>
              <Switch
                id="has-equipment"
                checked={hasEquipment}
                onCheckedChange={setHasEquipment}
              />
            </div>
          </div>
        </CardHeader>
        {hasEquipment && (
          <CardContent className="space-y-4">
            {historicalEquipment.map((yearData, yearIdx) => (
              <Card key={yearIdx} className="p-4 border-2 border-teal-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Year {yearData.year}</h4>
                  <Button type="button" onClick={() => addHistoricalEquipment(yearIdx)} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment
                  </Button>
                </div>
                <div className="space-y-4">
                  {yearData.equipment.map((item, equipmentIdx) => (
                    <Card key={equipmentIdx} className="p-4 border">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label>Equipment/Asset Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => handleHistoricalEquipmentChange(yearIdx, equipmentIdx, 'name', e.target.value)}
                            placeholder="e.g., Office Equipment"
                          />
                        </div>
                        <div>
                          <Label>Cost</Label>
                          <Input
                            type="number"
                            value={item.cost}
                            onChange={(e) => handleHistoricalEquipmentChange(yearIdx, equipmentIdx, 'cost', e.target.value)}
                            placeholder="5000"
                          />
                        </div>
                        <div>
                          <Label>Useful Life (Years)</Label>
                          <Input
                            type="number"
                            value={item.usefulLife}
                            onChange={(e) => handleHistoricalEquipmentChange(yearIdx, equipmentIdx, 'usefulLife', e.target.value)}
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <Label>Purchase Date</Label>
                          <Input
                            type="date"
                            value={item.purchaseDate}
                            onChange={(e) => handleHistoricalEquipmentChange(yearIdx, equipmentIdx, 'purchaseDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeHistoricalEquipment(yearIdx, equipmentIdx)}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Historical Loans by Year Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Historical Loans by Year (Optional)</CardTitle>
              <CardDescription>Enter your loans data for each year</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="has-loans" className="text-sm font-medium">Include Loans</Label>
              <Switch
                id="has-loans"
                checked={hasLoans}
                onCheckedChange={setHasLoans}
              />
            </div>
          </div>
        </CardHeader>
        {hasLoans && (
          <CardContent className="space-y-4">
            {historicalLoans.map((yearData, yearIdx) => (
              <Card key={yearIdx} className="p-4 border-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Year {yearData.year}</h4>
                  <Button type="button" onClick={() => addHistoricalLoan(yearIdx)} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Loan
                  </Button>
                </div>
                <div className="space-y-4">
                  {yearData.loans.map((loan, loanIdx) => (
                    <Card key={loanIdx} className="p-4 border">
                      {/* Loan Type Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Loan Type</Label>
                          <Select
                            value={loan.loanType}
                            onValueChange={(value) => handleHistoricalLoanChange(yearIdx, loanIdx, 'loanType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="working_capital">Working Capital</SelectItem>
                              <SelectItem value="sme_loan">SME Loan</SelectItem>
                              <SelectItem value="trade_finance">Trade Finance</SelectItem>
                              <SelectItem value="letter_of_guarantee">Letter of Guarantee</SelectItem>
                              <SelectItem value="startup_loan">Startup Loan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Sub-type selection for specific loan types */}
                        {(loan.loanType === 'trade_finance' || loan.loanType === 'startup_loan') && (
                          <div>
                            <Label>
                              {loan.loanType === 'trade_finance' ? 'Trade Finance Type' : 'Startup Loan Type'}
                            </Label>
                            <Select
                              value={loan.subType || ''}
                              onValueChange={(value) => handleHistoricalLoanChange(yearIdx, loanIdx, 'subType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {loan.loanType === 'trade_finance' ? (
                                  <>
                                    <SelectItem value="letter_of_credit">Letter of Credit (LC)</SelectItem>
                                    <SelectItem value="bills_discounting">Bills Discounting</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value="equity">Equity</SelectItem>
                                    <SelectItem value="royalty">Royalty</SelectItem>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Basic Loan Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label>Loan Amount</Label>
                          <Input
                            type="number"
                            value={loan.amount}
                            onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'amount', e.target.value)}
                            placeholder="50000"
                          />
                        </div>
                        <div>
                          <Label>Interest Rate (%)</Label>
                          <Input
                            type="number"
                            value={loan.rate}
                            onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'rate', e.target.value)}
                            placeholder="6.5"
                          />
                        </div>
                        <div>
                          <Label>Loan Term (Years)</Label>
                          <Input
                            type="number"
                            value={loan.years}
                            onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'years', e.target.value)}
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={loan.startDate}
                            onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'startDate', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Type-specific fields */}
                      {loan.loanType === 'working_capital' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label>Revolving Limit</Label>
                            <Input
                              placeholder="$50000"
                              value={loan.revolvingLimit || ''}
                              onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'revolvingLimit', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Utilization Rate (%)</Label>
                            <Input
                              placeholder="80%"
                              value={loan.utilizationRate || ''}
                              onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'utilizationRate', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {loan.loanType === 'sme_loan' && (
                        <div className="mt-4">
                          <Label>Collateral Type</Label>
                          <Input
                            placeholder="Property, Equipment, etc."
                            value={loan.collateralType || ''}
                            onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'collateralType', e.target.value)}
                          />
                        </div>
                      )}

                      {loan.loanType === 'letter_of_guarantee' && (
                        <div className="mt-4">
                          <Label>Guarantee Amount</Label>
                          <Input
                            placeholder="$10000"
                            value={loan.guaranteeAmount || ''}
                            onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'guaranteeAmount', e.target.value)}
                          />
                        </div>
                      )}

                      {loan.loanType === 'startup_loan' && loan.subType === 'royalty' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label>Royalty Type</Label>
                            <Select
                              value={loan.royaltyType || 'percentage'}
                              onValueChange={(value) => handleHistoricalLoanChange(yearIdx, loanIdx, 'royaltyType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>
                              {loan.royaltyType === 'percentage' ? 'Royalty Percentage (%)' : 'Fixed Royalty Amount'}
                            </Label>
                            <Input
                              placeholder={loan.royaltyType === 'percentage' ? "5%" : "$1000"}
                              value={loan.royaltyType === 'percentage' ? (loan.royaltyPercentage || '') : (loan.fixedRoyaltyAmount || '')}
                              onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, loan.royaltyType === 'percentage' ? 'royaltyPercentage' : 'fixedRoyaltyAmount', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {loan.loanType === 'startup_loan' && loan.subType === 'equity' && (
                        <div className="mt-4">
                          <Label>Equity Stake (%)</Label>
                          <Input
                            placeholder="10%"
                            value={loan.equityStake || ''}
                            onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'equityStake', e.target.value)}
                          />
                        </div>
                      )}

                      {loan.loanType === 'trade_finance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label>Trade Document Type</Label>
                            <Input
                              placeholder="Invoice, PO, etc."
                              value={loan.tradeDocumentType || ''}
                              onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'tradeDocumentType', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Tenor (Days)</Label>
                            <Input
                              placeholder="90"
                              value={loan.tenor || ''}
                              onChange={(e) => handleHistoricalLoanChange(yearIdx, loanIdx, 'tenor', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeHistoricalLoan(yearIdx, loanIdx)}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Historical Other Income/Costs by Year Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Historical Other Income/Costs by Year</CardTitle>
              <CardDescription>Enter any other income or costs for each year</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="has-other" className="text-sm font-medium">Include Other Items</Label>
              <Switch
                id="has-other"
                checked={hasOther}
                onCheckedChange={setHasOther}
              />
            </div>
          </div>
        </CardHeader>
        {hasOther && (
          <CardContent className="space-y-4">
            {historicalOther.map((yearData, yearIdx) => (
              <Card key={yearIdx} className="p-4 border-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Year {yearData.year}</h4>
                  <Button type="button" onClick={() => addHistoricalOther(yearIdx)} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-4">
                  {yearData.other.map((item, itemIdx) => (
                    <Card key={itemIdx} className="p-4 border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Type/Description</Label>
                          <Input
                            value={item.type}
                            onChange={(e) => handleHistoricalOtherChange(yearIdx, itemIdx, 'type', e.target.value)}
                            placeholder="e.g., Interest Income, Legal Fees"
                          />
                        </div>
                        <div>
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleHistoricalOtherChange(yearIdx, itemIdx, 'amount', e.target.value)}
                            placeholder="5000"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={item.isIncome}
                            onCheckedChange={(checked) => handleHistoricalOtherChange(yearIdx, itemIdx, 'isIncome', checked)}
                          />
                          <Label>{item.isIncome ? 'Income' : 'Cost'}</Label>
                        </div>
                      </div>
                      {yearData.other.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeHistoricalOther(yearIdx, itemIdx)}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Historical Investments by Year Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Historical Investments by Year</CardTitle>
              <CardDescription>Enter your investments data for each year</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="has-investments" className="text-sm font-medium">Include Investments</Label>
              <Switch
                id="has-investments"
                checked={hasInvestments}
                onCheckedChange={setHasInvestments}
              />
            </div>
          </div>
        </CardHeader>
        {hasInvestments && (
          <CardContent className="space-y-4">
            {historicalInvestments.map((yearData, yearIdx) => (
              <Card key={yearIdx} className="p-4 border-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Year {yearData.year}</h4>
                  <Button type="button" onClick={() => addHistoricalInvestment(yearIdx)} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Investment
                  </Button>
                </div>
                <div className="space-y-4">
                  {yearData.investments.map((investment, investmentIdx) => (
                    <Card key={investmentIdx} className="p-4 border">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label>Investment Name</Label>
                          <Input
                            value={investment.name}
                            onChange={(e) => handleHistoricalInvestmentChange(yearIdx, investmentIdx, 'name', e.target.value)}
                            placeholder="e.g., Stock Portfolio, Real Estate"
                          />
                        </div>
                        <div>
                          <Label>Amount Invested</Label>
                          <Input
                            type="number"
                            value={investment.amount}
                            onChange={(e) => handleHistoricalInvestmentChange(yearIdx, investmentIdx, 'amount', e.target.value)}
                            placeholder="100000"
                          />
                        </div>
                        <div>
                          <Label>Investment Date</Label>
                          <Input
                            type="date"
                            value={investment.date}
                            onChange={(e) => handleHistoricalInvestmentChange(yearIdx, investmentIdx, 'date', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Expected Return (%)</Label>
                          <Input
                            type="number"
                            value={investment.expectedReturn || ''}
                            onChange={(e) => handleHistoricalInvestmentChange(yearIdx, investmentIdx, 'expectedReturn', e.target.value)}
                            placeholder="8"
                          />
                        </div>
                        <div>
                          <Label>Maturity Value</Label>
                          <Input
                            type="number"
                            value={investment.maturityValue || ''}
                            onChange={(e) => handleHistoricalInvestmentChange(yearIdx, investmentIdx, 'maturityValue', e.target.value)}
                            placeholder="120000"
                          />
                        </div>
                        <div>
                          <Label>Maturity Type</Label>
                          <Select
                            value={investment.maturityType || 'year'}
                            onValueChange={(value) => handleHistoricalInvestmentChange(yearIdx, investmentIdx, 'maturityType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="year">Years</SelectItem>
                              <SelectItem value="duration">Duration</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={investment.income}
                            onCheckedChange={(checked) => handleHistoricalInvestmentChange(yearIdx, investmentIdx, 'income', checked)}
                          />
                          <Label>Generates Income</Label>
                        </div>
                        {investment.income && (
                          <div>
                            <Label>Income Amount</Label>
                            <Input
                              type="number"
                              value={investment.incomeAmount || ''}
                              onChange={(e) => handleHistoricalInvestmentChange(yearIdx, investmentIdx, 'incomeAmount', e.target.value)}
                              placeholder="5000"
                            />
                          </div>
                        )}
                      </div>
                      {yearData.investments.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeHistoricalInvestment(yearIdx, investmentIdx)}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Historical Shareholders by Year Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Historical Shareholders by Year</CardTitle>
              <CardDescription>Enter your shareholders data for each year</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="has-shareholders" className="text-sm font-medium">Include Shareholders</Label>
              <Switch
                id="has-shareholders"
                checked={hasShareholders}
                onCheckedChange={setHasShareholders}
              />
            </div>
          </div>
        </CardHeader>
        {hasShareholders && (
          <CardContent className="space-y-4">
            {historicalShareholders.map((yearData, yearIdx) => (
              <Card key={yearIdx} className="p-4 border-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Year {yearData.year}</h4>
                  <Button type="button" onClick={() => addHistoricalShareholder(yearIdx)} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shareholder
                  </Button>
                </div>
                <div className="space-y-4">
                  {yearData.shareholders.map((shareholder, shareholderIdx) => (
                    <Card key={shareholderIdx} className="p-4 border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Shareholder Name</Label>
                          <Input
                            value={shareholder.name}
                            onChange={(e) => handleHistoricalShareholderChange(yearIdx, shareholderIdx, 'name', e.target.value)}
                            placeholder="e.g., John Doe, ABC Corp"
                          />
                        </div>
                        <div>
                          <Label>Investment Amount</Label>
                          <Input
                            type="number"
                            value={shareholder.amount}
                            onChange={(e) => handleHistoricalShareholderChange(yearIdx, shareholderIdx, 'amount', e.target.value)}
                            placeholder="50000"
                          />
                        </div>
                        <div>
                          <Label>Ownership Percentage (%)</Label>
                          <Input
                            type="number"
                            value={shareholder.percent}
                            onChange={(e) => handleHistoricalShareholderChange(yearIdx, shareholderIdx, 'percent', e.target.value)}
                            placeholder="25"
                          />
                        </div>
                      </div>
                      {yearData.shareholders.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeHistoricalShareholder(yearIdx, shareholderIdx)}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Current Year Projections Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Current Year Projections</CardTitle>
          <CardDescription>Set your expectations for future growth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <GrowthRateCalculator
                label="Expected Revenue Growth Rate (%)"
                value={revenueGrowthRate}
                onChange={setRevenueGrowthRate}
                placeholder="10"
                getHistoricalData={getHistoricalRevenueData}
                calculationMethod={revenueCalculationMethod}
                setCalculationMethod={setRevenueCalculationMethod}
              />
            </div>

            <div>
              <GrowthRateCalculator
                label="Expected Expense Growth Rate (%)"
                value={expenseGrowthRate}
                onChange={setExpenseGrowthRate}
                placeholder="5"
                getHistoricalData={getHistoricalExpenseData}
                calculationMethod={expenseCalculationMethod}
                setCalculationMethod={setExpenseCalculationMethod}
              />
            </div>

            <div>
              <GrowthRateCalculator
                label="Expected Customer Growth Rate (%)"
                value={customerGrowthRate}
                onChange={setCustomerGrowthRate}
                placeholder="15"
                getHistoricalData={getHistoricalCustomerData}
                calculationMethod={customerCalculationMethod}
                setCalculationMethod={setCustomerCalculationMethod}
              />
            </div>

            <div>
              <Label htmlFor="selfFunding">Additional Funding Needed</Label>
              <Input
                type="number"
                value={selfFunding}
                onChange={(e) => setSelfFunding(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Growth Rate Calculation Methods</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Simple Average:</strong> Basic average of year-over-year growth rates</li>
              <li>• <strong>Weighted Average:</strong> Recent years have more influence on the calculation</li>
              <li>• <strong>CAGR:</strong> Compound Annual Growth Rate over the entire time period</li>
              <li>• <strong>Override:</strong> You can always enter your own rate if you expect different conditions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Global Interest Rates Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Global Interest Rates</CardTitle>
              <CardDescription>Set market interest rates for financial modeling</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="has-global-interest-rates" className="text-sm font-medium">Include Interest Rates</Label>
              <Switch
                id="has-global-interest-rates"
                checked={hasGlobalInterestRates}
                onCheckedChange={setHasGlobalInterestRates}
              />
            </div>
          </div>
        </CardHeader>
        {hasGlobalInterestRates && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Short-term Rate (%)</Label>
                <Input
                  type="number"
                  value={globalInterestRates.shortTerm}
                  onChange={(e) => setGlobalInterestRates(prev => ({ ...prev, shortTerm: e.target.value }))}
                  placeholder="5.5"
                />
              </div>
              <div>
                <Label>Long-term Rate (%)</Label>
                <Input
                  type="number"
                  value={globalInterestRates.longTerm}
                  onChange={(e) => setGlobalInterestRates(prev => ({ ...prev, longTerm: e.target.value }))}
                  placeholder="7.0"
                />
              </div>
              <div>
                <Label>Investment Rate (%)</Label>
                <Input
                  type="number"
                  value={globalInterestRates.investment}
                  onChange={(e) => setGlobalInterestRates(prev => ({ ...prev, investment: e.target.value }))}
                  placeholder="4.0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={globalInterestRates.useForLoans}
                  onCheckedChange={(checked) => setGlobalInterestRates(prev => ({ ...prev, useForLoans: checked }))}
                />
                <Label>Use for Loan Calculations</Label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Terminal Value Parameters Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Terminal Value Parameters</CardTitle>
          <CardDescription>Set parameters for DCF terminal value calculation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Terminal Value Method</Label>
              <Select
                value={tvMethod}
                onValueChange={setTvMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple">Exit Multiple</SelectItem>
                  <SelectItem value="perpetuity">Perpetuity Growth</SelectItem>
                  <SelectItem value="custom">Custom Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Terminal Growth Rate (%)</Label>
              <Input
                type="number"
                value={terminalGrowth}
                onChange={(e) => setTerminalGrowth(e.target.value)}
                placeholder="3.0"
              />
            </div>
            {tvMethod === 'multiple' && (
              <>
                <div>
                  <Label>TV Metric</Label>
                  <Select
                    value={tvMetric}
                    onValueChange={setTvMetric}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ebitda">EBITDA</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="earnings">Net Earnings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>TV Multiple</Label>
                  <Input
                    type="number"
                    value={tvMultiple}
                    onChange={(e) => setTvMultiple(e.target.value)}
                    placeholder="8.0"
                  />
                </div>
              </>
            )}
            {tvMethod === 'custom' && (
              <div>
                <Label>Custom Terminal Value</Label>
                <Input
                  type="number"
                  value={tvCustomValue}
                  onChange={(e) => setTvCustomValue(e.target.value)}
                  placeholder="1000000"
                />
              </div>
            )}
            <div>
              <Label>Terminal Year</Label>
              <Input
                type="number"
                value={tvYear}
                onChange={(e) => setTvYear(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WACC Build-up Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">WACC Build-up</CardTitle>
          <CardDescription>Calculate Weighted Average Cost of Capital</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4 items-center">
            <button
              type="button"
              className={`px-3 py-1 rounded ${!useWaccBuildUp ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setUseWaccBuildUp(false)}
            >
              Enter WACC Directly
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded ${useWaccBuildUp ? 'bg-teal-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setUseWaccBuildUp(true)}
            >
              Build WACC from Components
            </button>
          </div>

          {!useWaccBuildUp && (
            <div>
              <Label>Discount Rate (WACC) %</Label>
              <Input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                placeholder="12.0"
              />
            </div>
          )}

          {useWaccBuildUp && (
            <div className="space-y-6 border rounded p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Risk-free Rate (%)</Label>
                  <Input
                    type="number"
                    value={rfRate}
                    onChange={(e) => setRfRate(e.target.value)}
                    placeholder="3.0"
                  />
                </div>
                <div>
                  <Label>Beta</Label>
                  <Input
                    type="number"
                    value={beta}
                    onChange={(e) => setBeta(e.target.value)}
                    placeholder="1.2"
                  />
                </div>
                <div>
                  <Label>Market Premium (%)</Label>
                  <Input
                    type="number"
                    value={marketPremium}
                    onChange={(e) => setMarketPremium(e.target.value)}
                    placeholder="6.0"
                  />
                </div>
                <div>
                  <Label>Cost of Debt (%)</Label>
                  <Input
                    type="number"
                    value={costOfDebt}
                    onChange={(e) => setCostOfDebt(e.target.value)}
                    placeholder="8.0"
                  />
                </div>
                <div>
                  <Label>Tax Rate for WACC (%)</Label>
                  <Input
                    type="number"
                    value={taxRateWacc}
                    onChange={(e) => setTaxRateWacc(e.target.value)}
                    placeholder="25.0"
                  />
                </div>
                <div>
                  <Label>Target Equity %</Label>
                  <Input
                    type="number"
                    value={equityPct}
                    onChange={(e) => setEquityPct(e.target.value)}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label>Target Debt %</Label>
                  <Input
                    type="number"
                    value={debtPct}
                    onChange={(e) => setDebtPct(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label>Paid Up Capital ($)</Label>
                  <Input
                    type="number"
                    value={paidUpCapital}
                    onChange={(e) => setPaidUpCapital(e.target.value)}
                    placeholder="100000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Total capital contributed by shareholders</p>
                </div>
                <div>
                  <Label>Investment Equity ($)</Label>
                  <Input
                    type="number"
                    value={investmentEquity}
                    onChange={(e) => setInvestmentEquity(e.target.value)}
                    placeholder="150000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Additional equity investments</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button Card */}
      <Card className="shadow-lg border-teal-200">
        <CardContent className="flex justify-center pt-8">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            {isLoading ? 'Calculating...' : 'Calculate Historical Model'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaseHistoricalDataForm; 