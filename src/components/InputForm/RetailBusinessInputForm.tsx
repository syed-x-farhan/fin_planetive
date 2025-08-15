import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, ChevronDown, ChevronUp, HelpCircle, Upload } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Product {
  name: string;
  price: string;
  units: string;
  growthRate?: string;
  cost: string;
  yearlyValues?: { year: string; units: string }[];
}

interface Expense {
  name: string;
  amount: string;
  growthRate?: string;
  yearlyValues?: { year: string; amount: string }[];
}

interface CapitalExpenditure {
  name: string;
  assetType: 'tangible' | 'intangible';
  // Simple method fields
  cost?: string;
  usefulLife?: string;
  purchaseDate?: string;
  depreciationMethod?: 'straight_line' | 'double_declining' | 'sum_of_years_digits' | 'units_of_production';
  salvageValue?: string; // for SYD
  totalUnits?: string; // for Units of Production
  unitsPerYear?: string[]; // for Units of Production
  // Advanced method fields
  depreciationRate?: string;
  yearlyValues?: { year: string; amount: string }[];
  // Common fields
  notes?: string;
}

interface DividendPayout {
  year: string;
  percentage: string;
}

interface CapitalCost {
  name: string;
  assetType: 'tangible' | 'intangible';
  depreciationRate: string;
  year1: string;
  year2Addition: string;
  year3Addition: string;
  year4Addition: string;
  year5Addition: string;
}

interface Loan {
  amount: string;
  rate: string;
  years: string;
  startDate?: string;
  // New fields for loan types
  loanType: LoanType;
  subType?: string; // For subtypes like LC, Bills Discounting, etc.
  
  // Type-specific fields
  revolvingLimit?: string; // For working capital loans
  utilizationRate?: string; // For revolving facilities
  collateralType?: string; // For secured loans
  guaranteeAmount?: string; // For letters of guarantee
  royaltyPercentage?: string; // For royalty-based startup loans
  fixedRoyaltyAmount?: string; // For fixed royalty startup loans
  royaltyType?: 'percentage' | 'fixed'; // For royalty type selection
  equityStake?: string; // For equity-based startup loans
  tradeDocumentType?: string; // For trade finance
  tenor?: string; // For trade finance instruments
}

type LoanType = 
  | 'working_capital'      // Running financing
  | 'sme_loan'            // SME loan
  | 'trade_finance'       // Trade finance (with subtypes)
  | 'letter_of_guarantee' // Letter of Guarantee
  | 'startup_loan';       // Startup loans (with subtypes)

interface OtherItem {
  name: string;
  amount: string;
  isIncome: boolean;
}

interface Investment {
  name: string;
  amount: string;
  date: string;
  expectedReturn?: string;
  maturityValue?: string;
  maturityType?: 'year' | 'duration';
  income: boolean;
  incomeAmount?: string;
}

interface RetailBusinessInputFormProps {
  onSubmit: (data: any) => void;
  onBack?: () => void;
  initialValues?: any;
}

export const RetailBusinessInputForm: React.FC<RetailBusinessInputFormProps> = ({ onSubmit, onBack, initialValues }) => {
  // Section toggles
  const [hasProducts, setHasProducts] = useState(initialValues?.products ? true : true);
  const [hasExpenses, setHasExpenses] = useState(initialValues?.expenses ? true : true);
  const [hasCapitalExpenditure, setHasCapitalExpenditure] = useState(initialValues?.capitalExpenditures ? true : false);
  const [hasDividendPayout, setHasDividendPayout] = useState(initialValues?.dividendPayouts ? true : false);
  const [hasCapitalCosts, setHasCapitalCosts] = useState(initialValues?.capitalCosts ? true : false);
  const [hasEquipment, setHasEquipment] = useState(initialValues?.equipment ? true : false);
  const [hasLoan, setHasLoan] = useState(initialValues?.loans ? true : false);
  const [hasTax, setHasTax] = useState(initialValues?.taxRate !== undefined ? true : true);
  const [hasOther, setHasOther] = useState(initialValues?.other ? true : false);
  const [hasEquity, setHasEquity] = useState(false);
  const [equity, setEquity] = useState('');
  const [hasCreditSales, setHasCreditSales] = useState(initialValues?.creditSales ? true : false);
  const [creditSalesPercent, setCreditSalesPercent] = useState(initialValues?.creditSales?.percent || '');
  const [creditCollectionDays, setCreditCollectionDays] = useState(initialValues?.creditSales?.collectionDays || '');
  const [forecastPeriod, setForecastPeriod] = useState(initialValues?.forecast?.period || '12');
  const [forecastType, setForecastType] = useState<'months' | 'years'>(initialValues?.forecast?.type || 'months');
  const [hasOwnerSalary, setHasOwnerSalary] = useState(initialValues?.ownerSalary ? true : false);
  const [ownerSalary, setOwnerSalary] = useState(initialValues?.ownerSalary?.amount || '');
  const [ownerSalaryFrequency, setOwnerSalaryFrequency] = useState(initialValues?.ownerSalary?.frequency || 'monthly');
  const [hasAP, setHasAP] = useState(initialValues?.accountsPayable ? true : false);
  const [apDays, setApDays] = useState(initialValues?.accountsPayable?.days || '');
  const [hasShareholders, setHasShareholders] = useState(initialValues?.shareholders ? true : false);
  const [shareholders, setShareholders] = useState(initialValues?.shareholders || [{ name: '', amount: '', percent: '', notes: '' }]);
  const [expenseInputType, setExpenseInputType] = useState<'monthly' | 'annual'>('monthly');
  const [expenseInputMethod, setExpenseInputMethod] = useState<'growth_rate' | 'yearly_values'>('growth_rate');
  const [fiscalYearStart, setFiscalYearStart] = useState(initialValues?.fiscalYearStart || 'January');
  
  // Capital expenditure controls
  const [capexInputMethod, setCapexInputMethod] = useState<'simple' | 'advanced'>('simple');
  const [capexYears, setCapexYears] = useState(5);
  // Add revenue input type toggle
  const [revenueInputType, setRevenueInputType] = useState<'monthly' | 'annual'>('monthly');
  const [revenueInputMethod, setRevenueInputMethod] = useState<'growth_rate' | 'yearly_values'>('growth_rate');
  const [revenueYears, setRevenueYears] = useState(5);
  // Add state for Discount Rate and Terminal Growth Rate
  const [discountRate, setDiscountRate] = useState(initialValues?.discountRate || '10');
  const [terminalGrowth, setTerminalGrowth] = useState(initialValues?.terminalGrowth || '2');
  // Add state for WACC build-up
  const [useWaccBuildUp, setUseWaccBuildUp] = useState(false);
  const [useCostOfEquityOnly, setUseCostOfEquityOnly] = useState(false);
  const [rfRate, setRfRate] = useState('4');
  const [beta, setBeta] = useState('1.0');
  const [marketPremium, setMarketPremium] = useState('6');
  const [costOfDebt, setCostOfDebt] = useState('6');
  const [taxRateWacc, setTaxRateWacc] = useState(initialValues?.taxRate || '25');
  const [equityPct, setEquityPct] = useState('60');
  const [debtPct, setDebtPct] = useState('40');
  
  // Global Interest Rate Settings
  const [hasGlobalInterestRates, setHasGlobalInterestRates] = useState(initialValues?.globalInterestRates ? true : false);
  const [shortTermInterestRate, setShortTermInterestRate] = useState(initialValues?.globalInterestRates?.shortTerm || '5');
  const [longTermInterestRate, setLongTermInterestRate] = useState(initialValues?.globalInterestRates?.longTerm || '6');
  const [investmentInterestRate, setInvestmentInterestRate] = useState(initialValues?.globalInterestRates?.investment || '4');
  const [useGlobalRatesForLoans, setUseGlobalRatesForLoans] = useState(initialValues?.globalInterestRates?.useForLoans || false);
  // Calculate Cost of Equity and WACC
  const calcCostOfEquity = () => {
    const rf = parseFloat(rfRate) || 0;
    const b = parseFloat(beta) || 0;
    const mp = parseFloat(marketPremium) || 0;
    return rf + b * mp;
  };
  const calcAfterTaxCostOfDebt = () => {
    const kd = parseFloat(costOfDebt) || 0;
    const t = (parseFloat(taxRateWacc) || 0) / 100;
    return kd * (1 - t);
  };
  const calcWacc = () => {
    const ke = calcCostOfEquity();
    const kd = calcAfterTaxCostOfDebt();
    const e = (parseFloat(equityPct) || 0) / 100;
    const d = (parseFloat(debtPct) || 0) / 100;
    return e * ke + d * kd;
  };

  // Dynamic lists
  const [products, setProducts] = useState<Product[]>(initialValues?.products || [{ name: '', price: '', units: '', growthRate: '', cost: '' }]);
  const [expenses, setExpenses] = useState<Expense[]>(initialValues?.expenses || [{ name: '', amount: '', growthRate: '' }]);
  const [equipment, setEquipment] = useState<CapitalExpenditure[]>(initialValues?.equipment || []);
  const [capitalExpenditures, setCapitalExpenditures] = useState<CapitalExpenditure[]>(initialValues?.capitalExpenditures || []);
  const [dividendPayouts, setDividendPayouts] = useState<DividendPayout[]>(initialValues?.dividendPayouts || [
    { year: 'Year 1', percentage: '0' },
    { year: 'Year 2', percentage: '15' },
    { year: 'Year 3+', percentage: '20' }
  ]);
  const [capitalCosts, setCapitalCosts] = useState<CapitalCost[]>(initialValues?.capitalCosts || []);
  const [loans, setLoans] = useState<Loan[]>(initialValues?.loans || []);
  const [other, setOther] = useState<OtherItem[]>(initialValues?.other || []);
  const [investments, setInvestments] = useState<Investment[]>(initialValues?.investments || []);

  // Simple fields
  const [inventoryDays, setInventoryDays] = useState(initialValues?.inventoryDays || '');
  const [selfFunding, setSelfFunding] = useState(initialValues?.selfFunding || '');
  const [taxRate, setTaxRate] = useState(initialValues?.taxRate || '25');
  
  // Customer numbers for multiple years
  const [customerNumbers, setCustomerNumbers] = useState<{ year: string; customers: string }[]>(
    initialValues?.customerNumbers || [
      { year: '1', customers: '' },
      { year: '2', customers: '' },
      { year: '3', customers: '' },
      { year: '4', customers: '' },
      { year: '5', customers: '' }
    ]
  );
  
  // Expense years for yearly values method
  const [expenseYears, setExpenseYears] = useState<number>(5);

  // Handlers for dynamic lists
  const handleCustomerNumberChange = (idx: number, field: 'year' | 'customers', value: string) => {
    setCustomerNumbers(c => c.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  
  const addCustomerYear = () => {
    const nextYear = (customerNumbers.length + 1).toString();
    setCustomerNumbers(c => [...c, { year: nextYear, customers: '' }]);
  };
  
  const removeCustomerYear = (idx: number) => {
    if (customerNumbers.length > 1) {
      setCustomerNumbers(c => {
        const newNumbers = c.filter((_, i) => i !== idx);
        // Renumber the years to be sequential
        return newNumbers.map((item, i) => ({ ...item, year: (i + 1).toString() }));
      });
    }
  };
  
  const handleProductChange = (idx: number, field: keyof Product, value: string) => {
    setProducts(products => products.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  
  const handleProductYearlyValueChange = (idx: number, yearIdx: number, value: string) => {
    setProducts(products => products.map((product, i) => {
      if (i === idx) {
        const updatedYearlyValues = [...(product.yearlyValues || [])];
        while (updatedYearlyValues.length <= yearIdx) {
          updatedYearlyValues.push({ year: (updatedYearlyValues.length + 1).toString(), units: '' });
        }
        updatedYearlyValues[yearIdx] = { ...updatedYearlyValues[yearIdx], units: value };
        return { ...product, yearlyValues: updatedYearlyValues };
      }
      return product;
    }));
  };
  
  const addProduct = () => setProducts([...products, { name: '', price: '', units: '', growthRate: '', cost: '', yearlyValues: [] }]);
  const removeProduct = (idx: number) => setProducts(products => products.filter((_, i) => i !== idx));
  
  const addRevenueYear = () => {
    setRevenueYears(prev => prev + 1);
    // Update existing products to include the new year
    setProducts(products => products.map(product => ({
      ...product,
      yearlyValues: [...(product.yearlyValues || []), { year: (product.yearlyValues?.length || 0) + 1 + '', units: '' }]
    })));
  };
  
  const removeRevenueYear = () => {
    if (revenueYears > 1) {
      setRevenueYears(prev => prev - 1);
      // Update existing products to remove the last year
      setProducts(products => products.map(product => ({
        ...product,
        yearlyValues: product.yearlyValues?.slice(0, revenueYears - 1) || []
      })));
    }
  };

  const handleExpenseChange = (idx: number, field: keyof Expense, value: string) => {
    setExpenses(expenses => expenses.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };
  
  const handleExpenseYearlyValueChange = (expenseIdx: number, yearIdx: number, value: string) => {
    setExpenses(expenses => expenses.map((expense, i) => {
      if (i === expenseIdx) {
        const yearlyValues = expense.yearlyValues || [];
        const updatedYearlyValues = yearlyValues.map((yv, j) => 
          j === yearIdx ? { ...yv, amount: value } : yv
        );
        return { ...expense, yearlyValues: updatedYearlyValues };
      }
      return expense;
    }));
  };
  
  const addExpense = () => setExpenses([...expenses, { 
    name: '', 
    amount: '', 
    growthRate: '',
    yearlyValues: Array.from({ length: expenseYears }, (_, i) => ({ 
      year: (i + 1).toString(), 
      amount: '' 
    }))
  }]);
  const removeExpense = (idx: number) => setExpenses(expenses => expenses.filter((_, i) => i !== idx));
  
  const addExpenseYear = () => {
    setExpenseYears(prev => prev + 1);
    // Update existing expenses to include the new year
    setExpenses(expenses => expenses.map(expense => ({
      ...expense,
      yearlyValues: [
        ...(expense.yearlyValues || []),
        { year: (expenseYears + 1).toString(), amount: '' }
      ]
    })));
  };
  
  const removeExpenseYear = () => {
    if (expenseYears > 1) {
      setExpenseYears(prev => prev - 1);
      // Update existing expenses to remove the last year
      setExpenses(expenses => expenses.map(expense => ({
        ...expense,
        yearlyValues: expense.yearlyValues?.slice(0, expenseYears - 1) || []
      })));
    }
  };

  const handleCapitalExpenditureChange = (idx: number, field: keyof CapitalExpenditure, value: string | string[]) => {
    setCapitalExpenditures(capex => capex.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  
  const handleCapitalExpenditureYearlyValueChange = (idx: number, yearIdx: number, value: string) => {
    setCapitalExpenditures(capex => capex.map((item, i) => {
      if (i === idx) {
        const updatedYearlyValues = [...(item.yearlyValues || [])];
        while (updatedYearlyValues.length <= yearIdx) {
          updatedYearlyValues.push({ year: (updatedYearlyValues.length + 1).toString(), amount: '' });
        }
        updatedYearlyValues[yearIdx] = { ...updatedYearlyValues[yearIdx], amount: value };
        return { ...item, yearlyValues: updatedYearlyValues };
      }
      return item;
    }));
  };
  
  const addCapitalExpenditure = () => setCapitalExpenditures(capex => [...capex, { 
    name: '', 
    assetType: 'tangible', 
    cost: '',
    usefulLife: '',
    purchaseDate: '',
    depreciationRate: '15',
    yearlyValues: [],
    notes: ''
  }]);
  
  const removeCapitalExpenditure = (idx: number) => setCapitalExpenditures(capex => capex.filter((_, i) => i !== idx));
  
  const addCapexYear = () => {
    setCapexYears(prev => Math.min(prev + 1, 10));
  };
  
  const removeCapexYear = () => {
    if (capexYears > 2) {
      setCapexYears(prev => prev - 1);
      // Update existing capital expenditures to remove the last year
      setCapitalExpenditures(capex => capex.map(item => ({
        ...item,
        yearlyValues: item.yearlyValues?.slice(0, capexYears - 1) || []
      })));
    }
  };

  const handleDividendPayoutChange = (idx: number, field: keyof DividendPayout, value: string) => {
    setDividendPayouts(dividends => dividends.map((dividend, i) => i === idx ? { ...dividend, [field]: value } : dividend));
  };
  
  const addDividendPayout = () => setDividendPayouts(dividends => {
    const nextYearNumber = dividends.length + 1;
    const yearLabel = nextYearNumber <= 2 ? `Year ${nextYearNumber}` : `Year ${nextYearNumber}+`;
    return [...dividends, { 
      year: yearLabel, 
      percentage: '0' 
    }];
  });
  
  const removeDividendPayout = (idx: number) => setDividendPayouts(dividends => dividends.filter((_, i) => i !== idx));

  const handleCapitalCostChange = (idx: number, field: keyof CapitalCost, value: string) => {
    setCapitalCosts(costs => costs.map((cost, i) => i === idx ? { ...cost, [field]: value } : cost));
  };
  const addCapitalCost = () => setCapitalCosts(costs => [...costs, { 
    name: '', 
    assetType: 'intangible', 
    depreciationRate: '15', 
    year1: '', 
    year2Addition: '', 
    year3Addition: '', 
    year4Addition: '', 
    year5Addition: '' 
  }]);
  const removeCapitalCost = (idx: number) => setCapitalCosts(costs => costs.filter((_, i) => i !== idx));

  const handleLoanChange = (idx: number, field: keyof Loan, value: string) => {
    setLoans(l => l.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addLoan = () => setLoans(l => [...l, { amount: '', rate: '', years: '', startDate: '', loanType: 'working_capital' }]);
  const removeLoan = (idx: number) => setLoans(l => l.filter((_, i) => i !== idx));

  const handleOtherChange = (idx: number, field: keyof OtherItem, value: string | boolean) => {
    setOther(o => o.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addOther = () => setOther(o => [...o, { name: '', amount: '', isIncome: false }]);
  const removeOther = (idx: number) => setOther(o => o.filter((_, i) => i !== idx));

  // Shareholder handlers
  const handleShareholderChange = (idx: number, field: string, value: string) => {
    setShareholders(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addShareholder = () => setShareholders(s => [...s, { name: '', amount: '', percent: '', notes: '' }]);
  const removeShareholder = (idx: number) => setShareholders(s => s.filter((_, i) => i !== idx));

  // Investment handlers
  const handleInvestmentChange = (idx: number, field: keyof Investment, value: string | boolean) => {
    setInvestments(investments => investments.map((inv, i) => i === idx ? { ...inv, [field]: value } : inv));
  };
  const addInvestment = () => setInvestments([...investments, { name: '', amount: '', date: '', expectedReturn: '', maturityValue: '', maturityType: 'year', income: false, incomeAmount: '' }]);
  const removeInvestment = (idx: number) => setInvestments(investments => investments.filter((_, i) => i !== idx));

  // Submission
  const sanitizeNumber = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    return isNaN(Number(val)) ? 0 : Number(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert annual expenses to monthly if needed
    let processedExpenses = expenses;
    if (expenseInputType === 'annual') {
      processedExpenses = expenses.map(exp => ({
        ...exp,
        amount: exp.amount ? (parseFloat(exp.amount) / 12).toString() : ''
      }));
    }
    // Convert annual revenue to monthly if needed
    let processedProducts = products;
    if (revenueInputType === 'annual') {
      processedProducts = products.map(product => ({
        ...product,
        units: product.units ? (parseFloat(product.units) / 12).toString() : '',
        // Optionally, you could also divide price if price is annual, but usually price is per unit
      }));
    }
    onSubmit({
      customerNumbers: customerNumbers.map(c => ({
        year: c.year,
        customers: sanitizeNumber(c.customers)
      })),
      products: hasProducts ? processedProducts.map(p => ({
        ...p,
        price: sanitizeNumber(p.price),
        units: revenueInputMethod === 'growth_rate' ? sanitizeNumber(p.units) : undefined,
        growthRate: revenueInputMethod === 'growth_rate' ? sanitizeNumber(p.growthRate) : undefined,
        cost: sanitizeNumber(p.cost),
        yearlyValues: revenueInputMethod === 'yearly_values' ? p.yearlyValues?.map(yv => ({
          year: yv.year,
          units: sanitizeNumber(yv.units)
        })) : undefined,
      })) : [],
      revenueInputMethod,
      revenueYears,
      expenses: hasExpenses ? processedExpenses.map(e => ({
        ...e,
        amount: expenseInputMethod === 'growth_rate' ? sanitizeNumber(e.amount) : undefined,
        growthRate: expenseInputMethod === 'growth_rate' ? sanitizeNumber(e.growthRate) : undefined,
        yearlyValues: expenseInputMethod === 'yearly_values' ? e.yearlyValues?.map(yv => ({
          year: yv.year,
          amount: sanitizeNumber(yv.amount)
        })) : undefined,
      })) : [],
      capitalExpenditures: hasCapitalExpenditure ? capitalExpenditures.map(capex => ({
        ...capex,
        cost: sanitizeNumber(capex.cost),
        usefulLife: sanitizeNumber(capex.usefulLife),
        depreciationRate: sanitizeNumber(capex.depreciationRate),
        salvageValue: sanitizeNumber(capex.salvageValue),
        totalUnits: sanitizeNumber(capex.totalUnits),
        unitsPerYear: Array.isArray(capex.unitsPerYear) ? capex.unitsPerYear.map(sanitizeNumber) : [],
        yearlyValues: capex.yearlyValues?.map(yv => ({
          year: yv.year,
          amount: sanitizeNumber(yv.amount)
        })) || [],
      })) : [],
      capexInputMethod,
      capexYears,
      capitalCosts: hasCapitalCosts ? capitalCosts.map(cost => ({
        ...cost,
        depreciationRate: sanitizeNumber(cost.depreciationRate),
        year1: sanitizeNumber(cost.year1),
        year2Addition: sanitizeNumber(cost.year2Addition),
        year3Addition: sanitizeNumber(cost.year3Addition),
        year4Addition: sanitizeNumber(cost.year4Addition),
        year5Addition: sanitizeNumber(cost.year5Addition),
      })) : [],
      dividendPayouts: hasDividendPayout ? dividendPayouts.map(dividend => ({
        ...dividend,
        percentage: sanitizeNumber(dividend.percentage)
      })) : [],
      inventoryDays: sanitizeNumber(inventoryDays),
      selfFunding: sanitizeNumber(selfFunding),
      shareholders: hasShareholders ? shareholders : [],
      loans: hasLoan ? loans.map(l => ({
        ...l,
        amount: sanitizeNumber(l.amount),
        rate: sanitizeNumber(l.rate),
        years: sanitizeNumber(l.years),
        revolvingLimit: sanitizeNumber(l.revolvingLimit),
        utilizationRate: sanitizeNumber(l.utilizationRate),
        collateralType: l.collateralType,
        guaranteeAmount: sanitizeNumber(l.guaranteeAmount),
        royaltyPercentage: sanitizeNumber(l.royaltyPercentage),
        fixedRoyaltyAmount: sanitizeNumber(l.fixedRoyaltyAmount),
        royaltyType: l.royaltyType,
        equityStake: sanitizeNumber(l.equityStake),
        tradeDocumentType: l.tradeDocumentType,
        tenor: sanitizeNumber(l.tenor),
      })) : [],
      taxRate: hasTax ? sanitizeNumber(taxRate) : null,
      other: hasOther ? other : [],
      creditSales: {
        percent: sanitizeNumber(creditSalesPercent),
        collectionDays: sanitizeNumber(creditCollectionDays)
      },
      accountsPayable: hasAP ? {
        days: sanitizeNumber(apDays)
      } : undefined,
      forecast: {
        period: sanitizeNumber(forecastPeriod),
        type: forecastType
      },
      ownerSalary: hasOwnerSalary ? {
        amount: sanitizeNumber(ownerSalary),
        frequency: ownerSalaryFrequency
      } : undefined,
      investments: investments.map(inv => ({
        ...inv,
        amount: sanitizeNumber(inv.amount),
        expectedReturn: sanitizeNumber(inv.expectedReturn),
        maturityValue: sanitizeNumber(inv.maturityValue),
        incomeAmount: sanitizeNumber(inv.incomeAmount),
      })),
      fiscalYearStart,
      currentDate: new Date().toISOString(),
      discountRate: useCostOfEquityOnly ? calcWacc() : sanitizeNumber(discountRate),
      terminalGrowth: sanitizeNumber(terminalGrowth),
      tvMethod,
      tvMetric,
      tvMultiple: sanitizeNumber(tvMultiple),
      tvCustomValue: sanitizeNumber(tvCustomValue),
      tvYear: sanitizeNumber(tvYear),
      globalInterestRates: hasGlobalInterestRates ? {
        shortTerm: sanitizeNumber(shortTermInterestRate),
        longTerm: sanitizeNumber(longTermInterestRate),
        investment: sanitizeNumber(investmentInterestRate),
        useForLoans: useGlobalRatesForLoans,
      } : undefined,
    });
  };

  // Auto-lock input type to annual when yearly values method is selected
  React.useEffect(() => {
    if (expenseInputMethod === 'yearly_values') {
      setExpenseInputType('annual');
    }
  }, [expenseInputMethod]);

  React.useEffect(() => {
    if (revenueInputMethod === 'yearly_values') {
      setRevenueInputType('annual');
    }
  }, [revenueInputMethod]);
  
  // If initialValues changes after mount, update state
  React.useEffect(() => {
    if (initialValues) {
      setCustomerNumbers(initialValues.customerNumbers || [
        { year: '1', customers: '' },
        { year: '2', customers: '' },
        { year: '3', customers: '' },
        { year: '4', customers: '' },
        { year: '5', customers: '' }
      ]);
      setProducts(initialValues.products || [{ name: '', price: '', units: '', growthRate: '', cost: '' }]);
      setExpenses(initialValues.expenses || [{ 
        name: '', 
        amount: '', 
        growthRate: '',
        yearlyValues: [
          { year: '1', amount: '' },
          { year: '2', amount: '' },
          { year: '3', amount: '' },
          { year: '4', amount: '' },
          { year: '5', amount: '' }
        ]
      }]);
      setEquipment(initialValues.equipment || []);
      setLoans(initialValues.loans || []);
      setOther(initialValues.other || []);
      setInvestments(initialValues.investments || []);
      setInventoryDays(initialValues.inventoryDays || '');
      setSelfFunding(initialValues.selfFunding || '');
      setTaxRate(initialValues.taxRate || '25');
      setHasProducts(initialValues.products ? true : true);
      setHasExpenses(initialValues.expenses ? true : true);
      setHasEquipment(initialValues.equipment ? true : false);
      setHasLoan(initialValues.loans ? true : false);
      setHasTax(initialValues.taxRate !== undefined ? true : true);
      setHasOther(initialValues.other ? true : false);
      setHasCreditSales(initialValues.creditSales ? true : false);
      setCreditSalesPercent(initialValues.creditSales?.percent || '');
      setCreditCollectionDays(initialValues.creditSales?.collectionDays || '');
      setForecastPeriod(initialValues.forecast?.period || '12');
      setForecastType(initialValues.forecast?.type || 'months');
      setHasOwnerSalary(initialValues.ownerSalary ? true : false);
      setOwnerSalary(initialValues.ownerSalary?.amount || '');
      setOwnerSalaryFrequency(initialValues.ownerSalary?.frequency || 'monthly');
      setHasAP(initialValues.accountsPayable ? true : false);
      setApDays(initialValues.accountsPayable?.days || '');
      setHasShareholders(initialValues.shareholders ? true : false);
      setShareholders(initialValues.shareholders || [{ name: '', amount: '', percent: '', notes: '' }]);
      setExpenseInputType(initialValues.expenseInputType || 'monthly');
      setExpenseInputMethod(initialValues.expenseInputMethod || 'growth_rate');
      setExpenseYears(initialValues.expenseYears || 5);
      setFiscalYearStart(initialValues.fiscalYearStart || 'January');
      setRevenueInputType(initialValues.revenueInputType || 'monthly');
      setDiscountRate(initialValues.discountRate || '10');
      setTerminalGrowth(initialValues.terminalGrowth || '2');
      setUseWaccBuildUp(initialValues.useWaccBuildUp || false);
      setUseCostOfEquityOnly(initialValues.useCostOfEquityOnly || false);
      setRfRate(initialValues.rfRate || '4');
      setBeta(initialValues.beta || '1.0');
      setMarketPremium(initialValues.marketPremium || '6');
      setCostOfDebt(initialValues.costOfDebt || '6');
      setTaxRateWacc(initialValues.taxRateWacc || '25');
      setEquityPct(initialValues.equityPct || '60');
      setDebtPct(initialValues.debtPct || '40');
      setTvMethod(initialValues.tvMethod || 'perpetuity');
      setTvMetric(initialValues.tvMetric || 'EBITDA');
      setTvMultiple(initialValues.tvMultiple || '8');
      setTvCustomValue(initialValues.tvCustomValue || '');
      setTvYear(initialValues.tvYear || '5');
      
      // Global Interest Rates
      setHasGlobalInterestRates(initialValues.globalInterestRates ? true : false);
      setShortTermInterestRate(initialValues.globalInterestRates?.shortTerm || '5');
      setLongTermInterestRate(initialValues.globalInterestRates?.longTerm || '6');
      setInvestmentInterestRate(initialValues.globalInterestRates?.investment || '4');
      setUseGlobalRatesForLoans(initialValues.globalInterestRates?.useForLoans || false);
    }
  }, [initialValues]);

  const [expandedEquipment, setExpandedEquipment] = useState<number | null>(null);
  const [tvMethod, setTvMethod] = useState('perpetuity');
  const [tvMetric, setTvMetric] = useState('EBITDA');
  const [tvMultiple, setTvMultiple] = useState('8');
  const [tvCustomValue, setTvCustomValue] = useState('');
  const [tvYear, setTvYear] = useState(forecastPeriod || '5');

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-10 py-8 px-2">
      {/* Header with Back and Import buttons */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              ← Back
            </Button>
          )}
          <Button type="button" variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import from Excel
          </Button>
        </div>
      </div>
      {/* Fiscal Year Selector */}
      <div className="mb-6">
        <Label className="block mb-2 font-semibold">Fiscal Year Starts In</Label>
        <select
          value={fiscalYearStart}
          onChange={e => setFiscalYearStart(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-xs"
        >
          {[
            'January', 'July'
          ].map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      
      {/* Customer Numbers Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Total number of customers</CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">What is your projected customer count for each year?</div>
            <div className="text-sm text-muted-foreground">Enter the total number of customers you expect to have for each year of your forecast period.</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {customerNumbers.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Year {item.year}</Label>
                  {customerNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomerYear(idx)}
                      className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="e.g., 67"
                  value={item.customers}
                  onChange={(e) => handleCustomerNumberChange(idx, 'customers', e.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addCustomerYear}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Year
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Products Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Products
            <Switch checked={hasProducts} onCheckedChange={setHasProducts} />
          </CardTitle>
          <div className="mt-1 mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-base">What products do you sell?</div>
              <div className="text-sm text-muted-foreground">List each product, its price, units sold per {revenueInputType === 'monthly' ? 'month' : 'year'}, growth, and cost per item.</div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-2">
              <Label htmlFor="revenueInputType" className="mr-2">Enter as:</Label>
              <select id="revenueInputType" value={revenueInputType} onChange={e => setRevenueInputType(e.target.value as 'monthly' | 'annual')} className="border rounded px-2 py-1">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </CardHeader>
        {hasProducts && (
          <CardContent className="space-y-4 mb-10">
            {/* Method Selection */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label htmlFor="revenueInputMethod" className="font-medium">Method:</Label>
                <select 
                  id="revenueInputMethod" 
                  value={revenueInputMethod} 
                  onChange={e => setRevenueInputMethod(e.target.value as 'growth_rate' | 'yearly_values')} 
                  className="border rounded px-3 py-2"
                >
                  <option value="growth_rate">Growth Rate</option>
                  <option value="yearly_values">Yearly Values</option>
                </select>
              </div>
              {revenueInputMethod === 'yearly_values' && (
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Years:</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeRevenueYear}
                      disabled={revenueYears <= 1}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="px-3 text-sm font-medium bg-white border rounded py-1 min-w-[3rem] text-center">{revenueYears}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRevenueYear}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Products List */}
            <div className="space-y-4">
              {products.map((product, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Product Name</Label>
                        <Input 
                          placeholder="Product Name" 
                          value={product.name} 
                          onChange={e => handleProductChange(idx, 'name', e.target.value)} 
                          className="font-medium"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Price per Unit ($)</Label>
                        <Input 
                          placeholder="$20" 
                          value={product.price} 
                          onChange={e => handleProductChange(idx, 'price', e.target.value)} 
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Cost per Unit ($)</Label>
                        <Input 
                          placeholder="$5" 
                          value={product.cost} 
                          onChange={e => handleProductChange(idx, 'cost', e.target.value)} 
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeProduct(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {revenueInputMethod === 'growth_rate' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Units Sold ({revenueInputType === 'monthly' ? 'per month' : 'per year'})</Label>
                        <Input 
                          placeholder={revenueInputType === 'monthly' ? '100' : '1200'} 
                          value={product.units} 
                          onChange={e => handleProductChange(idx, 'units', e.target.value)} 
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Annual Growth Rate (%)</Label>
                        <Input 
                          placeholder="10%" 
                          value={product.growthRate || ''} 
                          onChange={e => handleProductChange(idx, 'growthRate', e.target.value)} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Yearly Units Sold ({revenueInputType === 'monthly' ? 'per month' : 'per year'})</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: revenueYears }, (_, i) => (
                          <div key={i} className="flex flex-col">
                            <Label className="text-xs text-muted-foreground mb-1">Year {i + 1}</Label>
                            <Input 
                              placeholder={revenueInputType === 'monthly' ? '100' : '1200'} 
                              value={product.yearlyValues?.[i]?.units || ''} 
                              onChange={e => handleProductYearlyValueChange(idx, i, e.target.value)} 
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addProduct} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Another Product
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Business Expenses
            <Switch checked={hasExpenses} onCheckedChange={setHasExpenses} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">What are your regular business expenses?</div>
            <div className="text-sm text-muted-foreground">Add your recurring costs like rent, salaries, marketing, or utilities.</div>
          </div>
        </CardHeader>
        {hasExpenses && (
          <CardContent className="space-y-4 mb-10">
            {/* Method Selection */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label htmlFor="expenseInputType" className="font-medium">Enter as:</Label>
                <select 
                  id="expenseInputType" 
                  value={expenseInputType} 
                  onChange={e => setExpenseInputType(e.target.value as 'monthly' | 'annual')} 
                  disabled={expenseInputMethod === 'yearly_values'}
                  className={`border rounded px-3 py-2 ${expenseInputMethod === 'yearly_values' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="expenseInputMethod" className="font-medium">Method:</Label>
                <select 
                  id="expenseInputMethod" 
                  value={expenseInputMethod} 
                  onChange={e => setExpenseInputMethod(e.target.value as 'growth_rate' | 'yearly_values')} 
                  className="border rounded px-3 py-2"
                >
                  <option value="growth_rate">Growth Rate</option>
                  <option value="yearly_values">Yearly Values</option>
                </select>
              </div>
              {expenseInputMethod === 'yearly_values' && (
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Years:</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeExpenseYear}
                      disabled={expenseYears <= 1}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="px-3 text-sm font-medium bg-white border rounded py-1 min-w-[3rem] text-center">{expenseYears}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExpenseYear}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Expenses List */}
            <div className="space-y-4">
              {expenses.map((expense, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <Input 
                      placeholder="Expense Name" 
                      value={expense.name} 
                      onChange={e => handleExpenseChange(idx, 'name', e.target.value)} 
                      className="w-64 font-medium"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeExpense(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {expenseInputMethod === 'growth_rate' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Amount ({expenseInputType === 'monthly' ? '$/month' : '$/year'})</Label>
                        <Input 
                          placeholder={expenseInputType === 'monthly' ? '$200' : '$2400'} 
                          value={expense.amount} 
                          onChange={e => handleExpenseChange(idx, 'amount', e.target.value)} 
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Annual Growth Rate</Label>
                        <Input 
                          placeholder="5%" 
                          value={expense.growthRate || ''} 
                          onChange={e => handleExpenseChange(idx, 'growthRate', e.target.value)} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Yearly Values ({expenseInputType === 'monthly' ? '$/month' : '$/year'})</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: expenseYears }, (_, i) => (
                          <div key={i} className="flex flex-col">
                            <Label className="text-xs text-muted-foreground mb-1">Year {i + 1}</Label>
                            <Input 
                              placeholder={expenseInputType === 'monthly' ? '$200' : '$2400'} 
                              value={expense.yearlyValues?.[i]?.amount || ''} 
                              onChange={e => handleExpenseYearlyValueChange(idx, i, e.target.value)} 
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addExpense} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Another Expense
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Capital Expenditures Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Capital Expenditures
            <Switch checked={hasCapitalExpenditure} onCheckedChange={setHasCapitalExpenditure} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you have any capital investments or equipment purchases?</div>
            <div className="text-sm text-muted-foreground">Add equipment, development costs, licenses, patents, or other capital investments.</div>
          </div>
        </CardHeader>
        {hasCapitalExpenditure && (
          <CardContent className="space-y-4 mb-10">
            {/* Method Selection */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label htmlFor="capexInputMethod" className="font-medium">Planning Method:</Label>
                <select 
                  id="capexInputMethod" 
                  value={capexInputMethod} 
                  onChange={e => setCapexInputMethod(e.target.value as 'simple' | 'advanced')} 
                  className="border rounded px-3 py-2"
                >
                  <option value="simple">Simple (One-time purchases)</option>
                  <option value="advanced">Advanced (Multi-year planning)</option>
                </select>
              </div>
              {capexInputMethod === 'advanced' && (
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Planning Years:</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeCapexYear}
                      disabled={capexYears <= 2}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="px-3 text-sm font-medium bg-white border rounded py-1 min-w-[3rem] text-center">{capexYears}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCapexYear}
                      disabled={capexYears >= 10}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Capital Expenditures List */}
            <div className="space-y-4">
              {capitalExpenditures.map((capex, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <Input 
                      placeholder="Asset Name (e.g. Equipment, Development, Patents)" 
                      value={capex.name} 
                      onChange={e => handleCapitalExpenditureChange(idx, 'name', e.target.value)} 
                      className="w-64 font-medium"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCapitalExpenditure(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {capexInputMethod === 'simple' ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1">Cost ($)</Label>
                          <Input 
                            placeholder="$5,000" 
                            value={capex.cost} 
                            onChange={e => handleCapitalExpenditureChange(idx, 'cost', e.target.value)} 
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1">Asset Type</Label>
                          <select 
                            value={capex.assetType} 
                            onChange={e => handleCapitalExpenditureChange(idx, 'assetType', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          >
                            <option value="tangible">Tangible Assets</option>
                            <option value="intangible">Intangible Assets</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1">Useful Life (years)</Label>
                          <Input 
                            placeholder="5" 
                            value={capex.usefulLife} 
                            onChange={e => handleCapitalExpenditureChange(idx, 'usefulLife', e.target.value)} 
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1">Purchase Date</Label>
                          <Input 
                            type="date" 
                            value={capex.purchaseDate} 
                            onChange={e => handleCapitalExpenditureChange(idx, 'purchaseDate', e.target.value)} 
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1">Depreciation Method</Label>
                          <select 
                            value={capex.depreciationMethod || 'straight_line'} 
                            onChange={e => handleCapitalExpenditureChange(idx, 'depreciationMethod', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          >
                            <option value="straight_line">Straight-Line</option>
                            <option value="double_declining">Double Declining Balance</option>
                            <option value="sum_of_years_digits">Sum-of-the-Years'-Digits</option>
                            <option value="units_of_production">Units of Production</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Additional fields for specific depreciation methods */}
                      {(capex.depreciationMethod === 'sum_of_years_digits' || capex.depreciationMethod === 'units_of_production') && (
                        <div className="border-t pt-3 mt-2 bg-gray-50 rounded p-3">
                          <span className="text-xs font-semibold text-muted-foreground mb-2 block">Additional Depreciation Details:</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {capex.depreciationMethod === 'sum_of_years_digits' && (
                              <div>
                                <Label className="text-sm text-muted-foreground mb-1">Salvage Value ($)</Label>
                                <Input 
                                  placeholder="$500" 
                                  value={capex.salvageValue || ''} 
                                  onChange={e => handleCapitalExpenditureChange(idx, 'salvageValue', e.target.value)} 
                                />
                              </div>
                            )}
                            {capex.depreciationMethod === 'units_of_production' && (
                              <>
                                <div>
                                  <Label className="text-sm text-muted-foreground mb-1">Total Expected Units</Label>
                                  <Input 
                                    placeholder="10,000" 
                                    value={capex.totalUnits || ''} 
                                    onChange={e => handleCapitalExpenditureChange(idx, 'totalUnits', e.target.value)} 
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground mb-1">Units per Year (comma separated)</Label>
                                  <Input 
                                    placeholder="2000,2000,2000,2000,2000" 
                                    value={Array.isArray(capex.unitsPerYear) ? capex.unitsPerYear.join(',') : ''} 
                                    onChange={e => handleCapitalExpenditureChange(idx, 'unitsPerYear', e.target.value.split(',').map(s => s.trim()))} 
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1">Asset Type</Label>
                          <select 
                            value={capex.assetType} 
                            onChange={e => handleCapitalExpenditureChange(idx, 'assetType', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                          >
                            <option value="intangible">Intangible Assets</option>
                            <option value="tangible">Tangible Assets</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1">Depreciation Rate (%)</Label>
                          <Input 
                            placeholder="15" 
                            value={capex.depreciationRate} 
                            onChange={e => handleCapitalExpenditureChange(idx, 'depreciationRate', e.target.value)} 
                          />
                        </div>
                      </div>
                      
                      {/* Year-by-year investments */}
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Yearly Investments ($)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {Array.from({ length: capexYears }, (_, i) => (
                            <div key={i} className="flex flex-col">
                              <Label className="text-xs text-muted-foreground mb-1">
                                Year {i + 1} {i === 0 ? '(Initial)' : '(Addition)'}
                              </Label>
                              <Input 
                                placeholder={i === 0 ? '$300,500' : '$28,500'} 
                                value={capex.yearlyValues?.[i]?.amount || ''} 
                                onChange={e => handleCapitalExpenditureYearlyValueChange(idx, i, e.target.value)} 
                                className="text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Notes field for both methods */}
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground mb-1">Notes (optional)</Label>
                    <Input 
                      placeholder="Additional details about this investment" 
                      value={capex.notes} 
                      onChange={e => handleCapitalExpenditureChange(idx, 'notes', e.target.value)} 
                    />
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addCapitalExpenditure} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Another Capital Expenditure
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dividend Payout Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Dividend Payout
            <Switch checked={hasDividendPayout} onCheckedChange={setHasDividendPayout} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you plan to pay dividends to shareholders?</div>
            <div className="text-sm text-muted-foreground">Set the percentage of net profit to be paid as dividends for each year.</div>
          </div>
        </CardHeader>
        {hasDividendPayout && (
          <CardContent className="space-y-4 mb-10">
            {/* Dividend Payouts List */}
            <div className="space-y-4">
              {dividendPayouts.map((dividend, idx) => (
                <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Year/Period</Label>
                        <Input 
                          placeholder={`Year ${idx + 1}${idx >= 2 ? '+' : ''}`} 
                          value={dividend.year} 
                          onChange={e => handleDividendPayoutChange(idx, 'year', e.target.value)} 
                          className="font-medium"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Percentage of Net Profit (%)</Label>
                        <div className="flex items-center">
                          <Input 
                            placeholder="15" 
                            value={dividend.percentage} 
                            onChange={e => handleDividendPayoutChange(idx, 'percentage', e.target.value)} 
                            className="text-right"
                          />
                          <span className="ml-2 text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeDividendPayout(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {dividend.percentage === '0' || dividend.percentage === '' ? (
                    <div className="text-sm text-muted-foreground">
                      No dividends will be paid in this period
                    </div>
                  ) : (
                    <div className="text-sm text-green-600">
                      {dividend.percentage}% of net profit will be paid as dividends
                    </div>
                  )}
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addDividendPayout} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Another Period
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Inventory Section */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Holding (days)</CardTitle>
          <div className="text-sm text-muted-foreground">How many days of inventory do you keep on hand?</div>
        </CardHeader>
        <CardContent>
          <Input type="number" value={inventoryDays} onChange={e => setInventoryDays(e.target.value)} placeholder="Optional" />
        </CardContent>
      </Card>

      {/* Funding, Loans & Shareholders Section */}
      <Card>
        <CardHeader>
          <CardTitle>Funding & Loans</CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">How did you start your retail business?</div>
            <div className="text-sm text-muted-foreground">Tell us about your own investment, any business loans, and other shareholders (if any).</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Funding & Loans</div>
          <Label className="block mb-4">Your own investment (Owner Equity)</Label>
          <Input placeholder="Your own investment (e.g. $5000)" value={selfFunding} onChange={e => setSelfFunding(e.target.value)} className="mb-2" />
          <div className="flex items-center gap-2 mb-2">
            <Label className="mr-2">Any other shareholder(s)?</Label>
            <Switch checked={hasShareholders} onCheckedChange={setHasShareholders} />
          </div>
          {hasShareholders && (
            <div className="space-y-2">
              <Label className="block mb-4">Other Shareholder(s)</Label>
              {/* Header Row for Shareholders */}
              <div className="grid grid-cols-4 md:grid-cols-5 gap-4 items-center mb-2 px-1">
                <div className="text-xs font-semibold text-muted-foreground">Name</div>
                <div className="text-xs font-semibold text-muted-foreground">Amount</div>
                <div className="text-xs font-semibold text-muted-foreground">% Ownership</div>
                <div className="text-xs font-semibold text-muted-foreground">Notes</div>
                <div className="text-xs" />
              </div>
              {shareholders.map((sh, idx) => (
                <div key={idx} className="grid grid-cols-4 md:grid-cols-5 gap-4 items-center mb-2 px-1">
                  <Input placeholder="Name" value={sh.name} onChange={e => handleShareholderChange(idx, 'name', e.target.value)} className="flex-1" />
                  <Input placeholder="$10000" value={sh.amount} onChange={e => handleShareholderChange(idx, 'amount', e.target.value)} className="w-32" />
                  <Input placeholder="50" value={sh.percent} onChange={e => handleShareholderChange(idx, 'percent', e.target.value)} className="w-24" />
                  <Input placeholder="Notes (optional)" value={sh.notes} onChange={e => handleShareholderChange(idx, 'notes', e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeShareholder(idx)} className="justify-self-end"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="teal" onClick={addShareholder} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Shareholder</Button>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <Label className="mr-2">Did you take a loan?</Label>
            <Switch checked={hasLoan} onCheckedChange={setHasLoan} />
          </div>
          {hasLoan && (
            <div className="space-y-4">
              {loans.map((loan, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-4">
                  {/* Loan Type Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Loan Type</Label>
                      <Select 
                        value={loan.loanType || 'working_capital'} 
                        onValueChange={(value) => handleLoanChange(idx, 'loanType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="working_capital">Working Capital Loan</SelectItem>
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
                        <Label className="text-sm font-semibold">
                          {loan.loanType === 'trade_finance' ? 'Trade Finance Type' : 'Startup Loan Type'}
                        </Label>
                        <Select 
                          value={loan.subType || ''} 
                          onValueChange={(value) => handleLoanChange(idx, 'subType', value)}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Amount</Label>
                      <Input 
                        placeholder="$10000" 
                        value={loan.amount} 
                        onChange={e => handleLoanChange(idx, 'amount', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Rate %</Label>
                      <Input 
                        placeholder="5%" 
                        value={loan.rate} 
                        onChange={e => handleLoanChange(idx, 'rate', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Years</Label>
                      <Input 
                        placeholder="3" 
                        value={loan.years} 
                        onChange={e => handleLoanChange(idx, 'years', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Start Date</Label>
                      <Input 
                        type="date" 
                        value={loan.startDate || ''} 
                        onChange={e => handleLoanChange(idx, 'startDate', e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Type-specific fields */}
                  {loan.loanType === 'working_capital' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Revolving Limit</Label>
                        <Input 
                          placeholder="$50000" 
                          value={loan.revolvingLimit || ''} 
                          onChange={e => handleLoanChange(idx, 'revolvingLimit', e.target.value)} 
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Utilization Rate %</Label>
                        <Input 
                          placeholder="80%" 
                          value={loan.utilizationRate || ''} 
                          onChange={e => handleLoanChange(idx, 'utilizationRate', e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

                  {loan.loanType === 'sme_loan' && (
                    <div>
                      <Label className="text-sm font-semibold">Collateral Type</Label>
                      <Input 
                        placeholder="Property, Equipment, etc." 
                        value={loan.collateralType || ''} 
                        onChange={e => handleLoanChange(idx, 'collateralType', e.target.value)} 
                      />
                    </div>
                  )}

                  {loan.loanType === 'letter_of_guarantee' && (
                    <div>
                      <Label className="text-sm font-semibold">Guarantee Amount</Label>
                      <Input 
                        placeholder="$25000" 
                        value={loan.guaranteeAmount || ''} 
                        onChange={e => handleLoanChange(idx, 'guaranteeAmount', e.target.value)} 
                      />
                    </div>
                  )}

                  {loan.loanType === 'startup_loan' && loan.subType === 'royalty' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">Royalty Type</Label>
                        <RadioGroup onValueChange={(value) => handleLoanChange(idx, 'royaltyType', value)} value={loan.royaltyType || 'percentage'} className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percentage" id="percentage" />
                            <Label htmlFor="percentage">Percentage</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fixed" id="fixed" />
                            <Label htmlFor="fixed">Fixed Amount</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      {loan.royaltyType === 'percentage' && (
                        <div>
                          <Label className="text-sm font-semibold">Royalty Percentage %</Label>
                          <Input 
                            placeholder="5%" 
                            value={loan.royaltyPercentage || ''} 
                            onChange={e => handleLoanChange(idx, 'royaltyPercentage', e.target.value)} 
                          />
                        </div>
                      )}
                      {loan.royaltyType === 'fixed' && (
                        <div>
                          <Label className="text-sm font-semibold">Fixed Royalty Amount</Label>
                          <Input 
                            placeholder="$1000" 
                            value={loan.fixedRoyaltyAmount || ''} 
                            onChange={e => handleLoanChange(idx, 'fixedRoyaltyAmount', e.target.value)} 
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {loan.loanType === 'startup_loan' && loan.subType === 'equity' && (
                    <div>
                      <Label className="text-sm font-semibold">Equity Stake %</Label>
                      <Input 
                        placeholder="10%" 
                        value={loan.equityStake || ''} 
                        onChange={e => handleLoanChange(idx, 'equityStake', e.target.value)} 
                      />
                    </div>
                  )}

                  {loan.loanType === 'startup_loan' && loan.subType === 'fixed' && (
                    <div>
                      <Label className="text-sm font-semibold">Fixed Royalty Amount ($)</Label>
                      <Input 
                        placeholder="$10000" 
                        value={loan.fixedRoyaltyAmount || ''} 
                        onChange={e => handleLoanChange(idx, 'fixedRoyaltyAmount', e.target.value)} 
                      />
                    </div>
                  )}

                  {loan.loanType === 'trade_finance' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Trade Document Type</Label>
                        <Input 
                          placeholder="Invoice, Bill of Lading, etc." 
                          value={loan.tradeDocumentType || ''} 
                          onChange={e => handleLoanChange(idx, 'tradeDocumentType', e.target.value)} 
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Tenor (Days)</Label>
                        <Input 
                          placeholder="90" 
                          value={loan.tenor || ''} 
                          onChange={e => handleLoanChange(idx, 'tenor', e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Remove button */}
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeLoan(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLoan} className="mt-2">
                <Plus className="w-4 h-4 mr-1" /> Add Another Loan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Interest Rate Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Global Interest Rate Settings
            <Switch checked={hasGlobalInterestRates} onCheckedChange={setHasGlobalInterestRates} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Set default interest rates for calculations</div>
            <div className="text-sm text-muted-foreground">These rates will be used for general calculations and can override individual loan rates.</div>
          </div>
        </CardHeader>
        {hasGlobalInterestRates && (
          <CardContent className="space-y-4 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-semibold mb-2">Short-term Interest Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={0.1}
                  value={shortTermInterestRate}
                  onChange={e => setShortTermInterestRate(e.target.value)}
                  placeholder="5.0"
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">For loans &lt; 1 year, working capital</div>
              </div>
              <div>
                <Label className="block text-sm font-semibold mb-2">Long-term Interest Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={0.1}
                  value={longTermInterestRate}
                  onChange={e => setLongTermInterestRate(e.target.value)}
                  placeholder="6.0"
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">For loans &gt; 1 year, term debt</div>
              </div>
            </div>
            <div>
              <Label className="block text-sm font-semibold mb-2">Investment Interest Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={investmentInterestRate}
                onChange={e => setInvestmentInterestRate(e.target.value)}
                placeholder="4.0"
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">For cash investments, savings accounts</div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="useGlobalRatesForLoans"
                checked={useGlobalRatesForLoans}
                onChange={e => setUseGlobalRatesForLoans(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useGlobalRatesForLoans" className="text-sm">
                Use global rates for individual loans (overrides loan-specific rates)
              </Label>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Credit Sales Section (always present) */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Sales</CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you sell on credit?</div>
            <div className="text-sm text-muted-foreground">Specify what % of sales are on credit and the average collection period.</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Credit Sales</div>
          <Label>Percent of Sales on Credit (%)</Label>
          <Input type="number" value={creditSalesPercent} onChange={e => setCreditSalesPercent(e.target.value)} placeholder="e.g. 20" />
          <Label>Average Collection Period (days)</Label>
          <Input type="number" value={creditCollectionDays} onChange={e => setCreditCollectionDays(e.target.value)} placeholder="e.g. 30" />
        </CardContent>
      </Card>
      {/* Accounts Payable Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Accounts Payable
            <Switch checked={hasAP} onCheckedChange={setHasAP} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you pay your suppliers on credit?</div>
            <div className="text-sm text-muted-foreground">Specify the average number of days you take to pay your suppliers/vendors.</div>
          </div>
        </CardHeader>
        {hasAP && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Accounts Payable</div>
            <Label>Average Payment Period (days)</Label>
            <Input type="number" value={apDays} onChange={e => setApDays(e.target.value)} placeholder="e.g. 30" />
          </CardContent>
        )}
      </Card>
      {/* Forecasting Section */}
      <Card>
        <CardHeader>
          <CardTitle>Forecasting</CardTitle>
          <div className="text-sm text-muted-foreground">How far into the future do you want to forecast?</div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Forecasting</div>
          <Label>Forecast Period</Label>
          <div className="flex gap-x-4 items-center">
            <Input type="number" value={forecastPeriod} onChange={e => setForecastPeriod(e.target.value)} className="w-24" />
            <select value={forecastType} onChange={e => setForecastType(e.target.value as 'months' | 'years')} className="border rounded px-2 py-1">
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </CardContent>
      </Card>
      {/* DCF Parameters Section */}
      <Card>
        <CardHeader>
          <CardTitle>DCF Valuation Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Label className="block text-xs font-semibold text-muted-foreground">How do you want to set your discount rate?</Label>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">WACC (Weighted Average Cost of Capital) is the rate used to discount future cash flows. You can either enter it directly or build it from its components.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-4 items-center">
              <button type="button" className={`px-3 py-1 rounded ${!useWaccBuildUp ? 'bg-teal-600 text-white' : 'bg-gray-200'}`} onClick={() => setUseWaccBuildUp(false)}>Enter WACC Directly</button>
              <button type="button" className={`px-3 py-1 rounded ${useWaccBuildUp ? 'bg-teal-600 text-white' : 'bg-gray-200'}`} onClick={() => setUseWaccBuildUp(true)}>Build WACC from Components</button>
            </div>
          </div>
          {!useWaccBuildUp && (
            <div>
              <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Discount Rate (WACC) %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={discountRate}
                onChange={e => setDiscountRate(e.target.value)}
                className="w-32"
              />
            </div>
          )}
          {useWaccBuildUp && (
            <div className="space-y-4 border rounded p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold text-sm">Cost of Equity (CAPM)</div>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Cost of Equity (CAPM) Inputs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap gap-4 items-end mb-2">
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Risk-Free Rate (%)</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The return you'd expect from a completely safe investment — usually a government bond. In Pakistan, you can use the current rate of a 10-year government bond (e.g., PIB).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input type="number" value={rfRate} onChange={e => setRfRate(e.target.value)} className="w-24" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Beta</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">A number that shows how risky your business is compared to the market. If you're unsure, use 1.0 for an average-risk business, below 1 for safer, or above 1 for riskier.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input type="number" value={beta} onChange={e => setBeta(e.target.value)} className="w-24" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Market Risk Premium (%)</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Extra return that investors expect from the stock market above the risk-free rate. Usually estimated between 4% to 8%. You can use 6% as a default.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input type="number" value={marketPremium} onChange={e => setMarketPremium(e.target.value)} className="w-24" />
                </div>
                <div className="font-semibold text-xs">= Cost of Equity: <span className="text-teal-700">{calcCostOfEquity().toFixed(2)}%</span></div>
              </div>
              <div className="flex items-center gap-2 mb-2 mt-4">
                <div className="font-semibold text-sm">Cost of Debt</div>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Cost of Debt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap gap-4 items-end mb-2">
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Pre-Tax Cost of Debt (%)</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The average interest rate you pay (or expect to pay) on your loans. Check your loan documents or use bank loan rates as a reference (e.g., 14%-18% in Pakistan).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input type="number" value={costOfDebt} onChange={e => setCostOfDebt(e.target.value)} className="w-24" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Tax Rate (%)</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The percentage of your profits that goes to taxes. If you're not sure, use your country's corporate tax rate (e.g., 29% in Pakistan).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input type="number" value={taxRateWacc} onChange={e => setTaxRateWacc(e.target.value)} className="w-24" />
                </div>
                <div className="font-semibold text-xs">= After-Tax Cost of Debt: <span className="text-teal-700">{calcAfterTaxCostOfDebt().toFixed(2)}%</span></div>
              </div>
              <div className="flex items-center gap-2 mb-2 mt-4">
                <div className="font-semibold text-sm">Capital Structure</div>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Capital Structure</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap gap-4 items-end mb-2">
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Equity (%)</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The portion of your business funded by your own money or investors. If you put in PKR 60 and took a loan of PKR 40, then equity is 60%.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input type="number" value={equityPct} onChange={e => setEquityPct(e.target.value)} className="w-24" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Debt (%)</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The portion of your business funded by borrowed money (like loans). In the above example, debt is 40%. (Equity + Debt should equal 100%)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input type="number" value={debtPct} onChange={e => setDebtPct(e.target.value)} className="w-24" />
                </div>
              </div>
              <div className="font-semibold text-xs mt-2">WACC: <span className="text-teal-700">{calcWacc().toFixed(2)}%</span></div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="useCostOfEquityOnly" checked={useCostOfEquityOnly} onChange={e => setUseCostOfEquityOnly(e.target.checked)} />
                <Label htmlFor="useCostOfEquityOnly" className="text-xs">Use Cost of Equity as Discount Rate (Levered DCF)</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminal Value Parameters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Terminal Value Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="mt-2">
            <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Terminal Value Method</Label>
            <select value={tvMethod} onChange={e => setTvMethod(e.target.value)} className="border rounded px-2 py-1 w-64">
              <option value="perpetuity">Perpetuity Growth (Gordon Growth)</option>
              <option value="exit-multiple">Exit Multiple</option>
              <option value="liquidation">Liquidation Value</option>
              <option value="none">No Terminal Value</option>
            </select>
          </div>
          {tvMethod === 'perpetuity' && (
            <div className="flex gap-4 items-end mt-2">
            <div>
              <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Terminal Growth Rate %</Label>
              <Input
                type="number"
                min={-10}
                max={20}
                step={0.01}
                value={terminalGrowth}
                onChange={e => setTerminalGrowth(e.target.value)}
                className="w-32"
              />
            </div>
            </div>
          )}
          {tvMethod === 'exit-multiple' && (
            <div className="flex gap-4 items-end mt-2">
              <div>
                <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Metric</Label>
                <select value={tvMetric} onChange={e => setTvMetric(e.target.value)} className="border rounded px-2 py-1 w-32">
                  <option value="EBITDA">EBITDA</option>
                  <option value="EBIT">EBIT</option>
                  <option value="Revenue">Revenue</option>
                  <option value="NetIncome">Net Income</option>
                </select>
              </div>
              <div>
                <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Multiple (e.g. 8x)</Label>
                <Input type="number" min={0} step={0.1} value={tvMultiple} onChange={e => setTvMultiple(e.target.value)} className="w-24" />
              </div>
            </div>
          )}
          {tvMethod === 'liquidation' && (
            <div className="flex gap-4 items-end mt-2">
              <div>
                <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Custom Terminal Value ($)</Label>
                <Input type="number" min={0} step={1} value={tvCustomValue} onChange={e => setTvCustomValue(e.target.value)} className="w-32" />
              </div>
            </div>
          )}
          <div className="mt-2">
            <Label className="block text-xs font-semibold mb-1 text-muted-foreground">Terminal Year</Label>
            <Input type="number" min={1} max={forecastPeriod} value={tvYear} onChange={e => setTvYear(e.target.value)} className="w-24" />
          </div>
        </CardContent>
      </Card>
      {/* Owner Salary/Drawings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Owner Salary / Drawings
            <Switch checked={hasOwnerSalary} onCheckedChange={setHasOwnerSalary} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you take money out of the business?</div>
            <div className="text-sm text-muted-foreground">Specify if/how much you take as salary or drawings.</div>
          </div>
        </CardHeader>
        {hasOwnerSalary && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Owner Salary / Drawings</div>
            <Label>Amount</Label>
            <Input type="number" value={ownerSalary} onChange={e => setOwnerSalary(e.target.value)} placeholder="e.g. 2000" />
            <Label>Frequency</Label>
            <select value={ownerSalaryFrequency} onChange={e => setOwnerSalaryFrequency(e.target.value)} className="border rounded px-2 py-1">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </CardContent>
        )}
      </Card>

      {/* Tax Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Tax
            <Switch checked={hasTax} onCheckedChange={setHasTax} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you want to apply a tax rate?</div>
            <div className="text-sm text-muted-foreground">Default is 25% if enabled.</div>
          </div>
        </CardHeader>
        {hasTax && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Tax</div>
            <Label>Tax Rate (%)</Label>
            <Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="Optional, default 25%" />
          </CardContent>
        )}
      </Card>

      {/* Other Income/Costs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Other Income / Costs
            <Switch checked={hasOther} onCheckedChange={setHasOther} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Any other income or costs?</div>
            <div className="text-sm text-muted-foreground">Add any additional income or costs not covered above.</div>
          </div>
        </CardHeader>
        {hasOther && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Other Income / Costs</div>
            <Label className="block mb-4">Other Income or Costs</Label>
            {/* Header Row for Other Income/Costs */}
            <div className="flex gap-x-4 items-center mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground w-40">Name/Description</div>
              <div className="text-xs font-semibold text-muted-foreground w-24">Amount</div>
              <div className="text-xs font-semibold text-muted-foreground w-24">Income?</div>
              <div className="text-xs w-10" />
            </div>
            {other.map((item, idx) => (
              <div key={idx} className="flex gap-x-4 items-center mb-2 px-1">
                <Input placeholder="Type (e.g. Grant)" value={item.name} onChange={e => handleOtherChange(idx, 'name', e.target.value)} className="w-40" />
                <Input placeholder="$100" value={item.amount} onChange={e => handleOtherChange(idx, 'amount', e.target.value)} className="w-24" />
                <select value={item.isIncome ? 'income' : 'cost'} onChange={e => handleOtherChange(idx, 'isIncome', e.target.value === 'income')} className="w-24 border rounded px-2 py-1">
                  <option value="income">Income</option>
                  <option value="cost">Cost</option>
                </select>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOther(idx)} className="ml-auto"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addOther} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another</Button>
          </CardContent>
        )}
      </Card>

      {/* Business Investments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Business Investments</CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you have any business investments?</div>
            <div className="text-sm text-muted-foreground">Add details for each investment your business has made.</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Investments</div>
          <Label className="block mb-4">Add your business investments</Label>
          {/* Header Row for Investments */}
          <div className="grid grid-cols-9 gap-4 items-center mb-2 px-1 text-xs font-semibold text-muted-foreground">
            <div>Investment Name</div>
            <div>Amount</div>
            <div>Date</div>
            <div>Expected Return (%)</div>
            <div>Maturity Type</div>
            <div>Maturity</div>
            <div>Income?</div>
            <div className="w-8" />
          </div>
          {investments.map((inv, idx) => (
            <div key={idx} className="grid grid-cols-9 gap-4 items-center mb-4 px-1 py-2 bg-white rounded shadow-sm">
              <Input placeholder="e.g. Mutual Fund in ABC" value={inv.name} onChange={e => handleInvestmentChange(idx, 'name', e.target.value)} className="w-full" />
              <Input placeholder="$5000" value={inv.amount} onChange={e => handleInvestmentChange(idx, 'amount', e.target.value)} className="w-full" />
              <Input type="date" value={inv.date} onChange={e => handleInvestmentChange(idx, 'date', e.target.value)} className="w-full" />
              <Input placeholder="8" value={inv.expectedReturn || ''} onChange={e => handleInvestmentChange(idx, 'expectedReturn', e.target.value)} className="w-full" />
              <select value={inv.maturityType || 'year'} onChange={e => handleInvestmentChange(idx, 'maturityType', e.target.value as 'year' | 'duration')} className="border rounded px-2 py-1 w-full">
                <option value="year">Year</option>
                <option value="duration">Duration (years)</option>
              </select>
              <Input placeholder={inv.maturityType === 'duration' ? '5' : '2028'} value={inv.maturityValue || ''} onChange={e => handleInvestmentChange(idx, 'maturityValue', e.target.value)} className="w-full" />
              <select value={inv.income ? 'yes' : 'no'} onChange={e => handleInvestmentChange(idx, 'income', e.target.value === 'yes')} className="border rounded px-2 py-1 w-full">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              {inv.income ? (
                <Input placeholder="Annual Income ($)" value={inv.incomeAmount || ''} onChange={e => handleInvestmentChange(idx, 'incomeAmount', e.target.value)} className="w-full ml-2" />
              ) : (
                <div />
              )}
              <Button type="button" variant="ghost" size="icon" onClick={() => removeInvestment(idx)} className="ml-auto"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="teal" onClick={addInvestment} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Investment</Button>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button type="submit" size="lg" variant="teal" className="px-8 py-3 text-lg font-semibold shadow-md">Calculate Financials</Button>
      </div>
    </form>
  );
}; 