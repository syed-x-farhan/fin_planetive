import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, ChevronDown, ChevronUp, HelpCircle, Upload } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Service {
  name: string;
  price: string;
  clients: string;
  growth?: string;
  cost: string;
}

interface Expense {
  category: string;
  amount: string;
  growthRate?: string;
  notes?: string;
}

interface Equipment {
  name: string;
  cost: string;
  usefulLife?: string;
  purchaseDate?: string;
  notes?: string;
  depreciationMethod?: 'straight_line' | 'double_declining' | 'sum_of_years_digits' | 'units_of_production';
  salvageValue?: string; // for SYD
  totalUnits?: string; // for Units of Production
  unitsPerYear?: string[]; // for Units of Production
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

interface OtherIncomeOrCost {
  type: string;
  amount: string;
  notes?: string;
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

interface ServiceBusinessInputFormProps {
  onSubmit: (data: any) => void;
  onBack?: () => void;
  initialValues?: any;
}

const COMMON_EXPENSES = [
  'Rent',
  'Salaries',
  'Marketing',
  'Subscriptions',
  'Utilities',
  'Insurance',
];

export const ServiceBusinessInputForm: React.FC<ServiceBusinessInputFormProps> = ({ onSubmit, onBack, initialValues }) => {
  // Section toggles
  const [hasServices, setHasServices] = useState(initialValues?.services ? true : true);
  const [hasCosts, setHasCosts] = useState(initialValues?.expenses ? true : false);
  const [hasEquipment, setHasEquipment] = useState(initialValues?.equipment ? true : false);
  const [hasLoan, setHasLoan] = useState(initialValues?.loans ? true : false);
  const [hasTax, setHasTax] = useState(initialValues?.taxRate !== undefined ? true : true);
  const [hasOther, setHasOther] = useState(initialValues?.other ? true : false);
  const [hasShareholders, setHasShareholders] = useState(initialValues?.shareholders ? true : false);
  const [hasCreditSales, setHasCreditSales] = useState(initialValues?.creditSales ? true : false);
  const [creditSalesPercent, setCreditSalesPercent] = useState(initialValues?.creditSales?.percent || '');
  const [creditCollectionDays, setCreditCollectionDays] = useState(initialValues?.creditSales?.collectionDays || '');
  const [hasAP, setHasAP] = useState(initialValues?.accountsPayable ? true : false);
  const [apDays, setApDays] = useState(initialValues?.accountsPayable?.days || '');
  const [expenseInputType, setExpenseInputType] = useState<'monthly' | 'annual'>('annual');
  const [fiscalYearStart, setFiscalYearStart] = useState(initialValues?.fiscalYearStart || 'January');
  // Add revenue input type toggle
  const [revenueInputType, setRevenueInputType] = useState<'monthly' | 'annual'>('annual');
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
  const [services, setServices] = useState<Service[]>(initialValues?.services || [{ name: '', price: '', clients: '', growth: '', cost: '' }]);
  const [expenses, setExpenses] = useState<Expense[]>(initialValues?.expenses || []);
  const [equipment, setEquipment] = useState<Equipment[]>(initialValues?.equipment || []);
  const [loans, setLoans] = useState<Loan[]>(initialValues?.loans || []);
  const [other, setOther] = useState<OtherIncomeOrCost[]>(initialValues?.other || []);
  const [shareholders, setShareholders] = useState(initialValues?.shareholders || [ { name: '', amount: '', percent: '', notes: '' } ]);
  const [investments, setInvestments] = useState<Investment[]>(initialValues?.investments || []);

  // Simple fields
  const [selfFunding, setSelfFunding] = useState(initialValues?.selfFunding || '');
  const [taxRate, setTaxRate] = useState(initialValues?.taxRate || '25');
  const [forecastPeriod, setForecastPeriod] = useState(initialValues?.forecast?.period || '12');
  const [forecastType, setForecastType] = useState<'months' | 'years'>(initialValues?.forecast?.type || 'months');

  // Terminal Value Method State (fix ReferenceError)
  const [tvMethod, setTvMethod] = useState(initialValues?.tvMethod || 'perpetuity');
  const [tvMetric, setTvMetric] = useState(initialValues?.tvMetric || 'EBITDA');
  const [tvMultiple, setTvMultiple] = useState(initialValues?.tvMultiple || '8');
  const [tvCustomValue, setTvCustomValue] = useState(initialValues?.tvCustomValue || '');
  const [tvYear, setTvYear] = useState(initialValues?.tvYear || '5');

  // Handlers for dynamic lists
  const handleServiceChange = (idx: number, field: keyof Service, value: string) => {
    setServices(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addService = () => setServices(s => [...s, { name: '', price: '', clients: '', growth: '', cost: '' }]);
  const removeService = (idx: number) => setServices(s => s.filter((_, i) => i !== idx));

  const handleExpenseChange = (idx: number, field: keyof Expense, value: string) => {
    setExpenses(e => e.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addExpense = () => setExpenses(e => [...e, { category: '', amount: '', notes: '' }]);
  const removeExpense = (idx: number) => setExpenses(e => e.filter((_, i) => i !== idx));

  const handleEquipmentChange = (idx: number, field: keyof Equipment, value: string | string[]) => {
    setEquipment(eq => eq.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addEquipment = () => setEquipment(eq => [...eq, { name: '', cost: '', notes: '', usefulLife: '', purchaseDate: '', depreciationMethod: 'straight_line' }]);
  const removeEquipment = (idx: number) => setEquipment(eq => eq.filter((_, i) => i !== idx));

  const handleLoanChange = (idx: number, field: keyof Loan, value: string) => {
    setLoans(l => l.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addLoan = () => setLoans(l => [...l, { amount: '', rate: '', years: '', startDate: '', loanType: 'working_capital' }]);
  const removeLoan = (idx: number) => setLoans(l => l.filter((_, i) => i !== idx));

  const handleOtherChange = (idx: number, field: keyof OtherIncomeOrCost, value: string | boolean) => {
    setOther(o => o.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addOther = () => setOther(o => [...o, { type: '', amount: '', notes: '', isIncome: true }]);
  const removeOther = (idx: number) => setOther(o => o.filter((_, i) => i !== idx));

  const handleShareholderChange = (idx: number, field: string, value: string) => {
    setShareholders(s => s.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addShareholder = () => setShareholders(s => [...s, { name: '', amount: '', percent: '', notes: '' }]);
  const removeShareholder = (idx: number) => setShareholders(s => s.filter((_, i) => i !== idx));

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
    let processedServices = services;
    if (revenueInputType === 'annual') {
      processedServices = services.map(service => ({
        ...service,
        clients: service.clients ? (parseFloat(service.clients) / 12).toString() : '',
      }));
    }
    onSubmit({
      services: hasServices ? processedServices.map(s => ({
        ...s,
        price: sanitizeNumber(s.price),
        clients: sanitizeNumber(s.clients),
        growth: sanitizeNumber(s.growth),
        cost: sanitizeNumber(s.cost),
      })) : [],
      expenses: hasCosts ? processedExpenses.map(e => ({
        ...e,
        amount: sanitizeNumber(e.amount),
        growthRate: sanitizeNumber(e.growthRate),
      })) : [],
      equipment: hasEquipment ? equipment.map(eq => ({
        ...eq,
        cost: sanitizeNumber(eq.cost),
        usefulLife: sanitizeNumber(eq.usefulLife),
        salvageValue: sanitizeNumber(eq.salvageValue),
        totalUnits: sanitizeNumber(eq.totalUnits),
        unitsPerYear: Array.isArray(eq.unitsPerYear) ? eq.unitsPerYear.map(sanitizeNumber) : [],
      })) : [],
      selfFunding: sanitizeNumber(selfFunding),
      shareholders: hasShareholders ? shareholders : [],
      loans: hasLoan ? loans.map(l => ({
        ...l,
        amount: sanitizeNumber(l.amount),
        rate: sanitizeNumber(l.rate),
        years: sanitizeNumber(l.years),
        // Add type-specific fields to submission
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
      forecast: {
        period: sanitizeNumber(forecastPeriod),
        type: forecastType
      },
      creditSales: hasCreditSales ? {
        percent: sanitizeNumber(creditSalesPercent),
        collectionDays: sanitizeNumber(creditCollectionDays)
      } : undefined,
      accountsPayable: hasAP ? {
        days: sanitizeNumber(apDays)
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
      discountRate: useCostOfEquityOnly ? calcCostOfEquity().toString() : sanitizeNumber(discountRate),
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

  // If initialValues changes after mount, update state
  React.useEffect(() => {
    console.debug('[ServiceBusinessInputForm] initialValues received:', initialValues);
    if (initialValues) {
      setServices(initialValues.services || [{ name: '', price: '', clients: '', growth: '', cost: '' }]);
      setExpenses(initialValues.expenses || []);
      setEquipment(initialValues.equipment || []);
      setLoans(initialValues.loans || []);
      setOther(initialValues.other || []);
      setShareholders(initialValues.shareholders || [ { name: '', amount: '', percent: '', notes: '' } ]);
      setInvestments(initialValues.investments || []);
      setSelfFunding(initialValues.selfFunding || '');
      setTaxRate(initialValues.taxRate || '25');
      setForecastPeriod(initialValues.forecast?.period || '12');
      setForecastType(initialValues.forecast?.type || 'months');
      setHasServices(initialValues.services ? true : true);
      setHasCosts(initialValues.expenses ? true : false);
      setHasEquipment(initialValues.equipment ? true : false);
      setHasLoan(initialValues.loans ? true : false);
      setHasTax(initialValues.taxRate !== undefined ? true : true);
      setHasOther(initialValues.other ? true : false);
      setHasShareholders(initialValues.shareholders ? true : false);
      setHasCreditSales(initialValues.creditSales ? true : false);
      setCreditSalesPercent(initialValues.creditSales?.percent || '');
      setCreditCollectionDays(initialValues.creditSales?.collectionDays || '');
      setHasAP(initialValues.accountsPayable ? true : false);
      setApDays(initialValues.accountsPayable?.days || '');
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
      {/* Services Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Services Provided
            <Switch checked={hasServices} onCheckedChange={setHasServices} />
          </CardTitle>
          <div className="mt-1 mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-base">What services do you offer?</div>
              <div className="text-sm text-muted-foreground">List each service or project you provide, how much you charge, and how many clients you serve {revenueInputType === 'monthly' ? 'monthly' : 'annually'}.</div>
            </div>

          </div>
        </CardHeader>
        {hasServices && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Services</div>
            <Label className="block mb-4">Do you provide services to clients or take on projects?</Label>
            {/* Header Row for Services */}
            <div className="grid grid-cols-6 gap-4 items-center mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground">Service Name</div>
              <div className="text-xs font-semibold text-muted-foreground">Price/Client</div>
              <div className="text-xs font-semibold text-muted-foreground">Clients/{revenueInputType === 'monthly' ? 'Month' : 'Year'}</div>
              <div className="text-xs font-semibold text-muted-foreground">Growth %</div>
              <div className="text-xs font-semibold text-muted-foreground">Delivery Cost</div>
              <div className="text-xs" />
            </div>
            {services.map((service, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-4 items-center mb-2 px-1">
                <Input placeholder="Service Name (e.g. Logo Design)" value={service.name} onChange={e => handleServiceChange(idx, 'name', e.target.value)} />
                <Input placeholder="$500" value={service.price} onChange={e => handleServiceChange(idx, 'price', e.target.value)} />
                <Input placeholder={revenueInputType === 'monthly' ? '5 clients' : '60 clients'} value={service.clients} onChange={e => handleServiceChange(idx, 'clients', e.target.value)} />
                <Input placeholder="3%" value={service.growth} onChange={e => handleServiceChange(idx, 'growth', e.target.value)} />
                <Input placeholder="$50 cost" value={service.cost} onChange={e => handleServiceChange(idx, 'cost', e.target.value)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeService(idx)} className="justify-self-end"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="teal" onClick={addService} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Service</Button>
          </CardContent>
        )}
      </Card>

      {/* Monthly Costs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Business Regular Costs
            <Switch checked={hasCosts} onCheckedChange={setHasCosts} />
          </CardTitle>
          <div className="mt-1 mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-base">What are your regular business expenses?</div>
              <div className="text-sm text-muted-foreground">Add your recurring costs like rent, salaries, marketing, or subscriptions.</div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-2">
              <Label htmlFor="expenseInputType" className="mr-2">Enter as:</Label>
              <select id="expenseInputType" value={expenseInputType} onChange={e => setExpenseInputType(e.target.value as 'monthly' | 'annual')} className="border rounded px-2 py-1">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </CardHeader>
        {hasCosts && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">{expenseInputType === 'monthly' ? 'Monthly Business Expenses' : 'Annual Business Expenses'}</div>
            <Label className="block mb-4">Add your {expenseInputType === 'monthly' ? 'monthly' : 'annual'} expenses</Label>
            {/* Header Row for Expenses */}
            <div className="flex gap-x-4 items-center mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground w-40">Category</div>
              <div className="text-xs font-semibold text-muted-foreground w-24">Amount ({expenseInputType === 'monthly' ? '$/month' : '$/year'})</div>
              <div className="text-xs font-semibold text-muted-foreground w-20">Growth %</div>
              <div className="text-xs font-semibold text-muted-foreground w-40">Notes</div>
              <div className="text-xs w-10" />
            </div>
            {expenses.map((expense, idx) => (
              <div key={idx} className="flex gap-x-4 items-center mb-2 px-1">
                <Input list="expense-categories" placeholder="Category (e.g. Rent)" value={expense.category} onChange={e => handleExpenseChange(idx, 'category', e.target.value)} className="w-40" />
                <datalist id="expense-categories">
                  {COMMON_EXPENSES.map((cat) => <option key={cat} value={cat} />)}
                </datalist>
                <Input placeholder={expenseInputType === 'monthly' ? '$200' : '$2400'} value={expense.amount} onChange={e => handleExpenseChange(idx, 'amount', e.target.value)} className="w-24" />
                <Input placeholder="5%" value={expense.growthRate || ''} onChange={e => handleExpenseChange(idx, 'growthRate', e.target.value)} className="w-20" />
                <Input placeholder="Notes (optional)" value={expense.notes} onChange={e => handleExpenseChange(idx, 'notes', e.target.value)} className="w-40" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeExpense(idx)} className="ml-auto"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="teal" onClick={addExpense} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another Expense</Button>
          </CardContent>
        )}
      </Card>

      {/* Equipment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Equipment / Tools Purchased
            <Switch checked={hasEquipment} onCheckedChange={setHasEquipment} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Did you buy any equipment or tools?</div>
            <div className="text-sm text-muted-foreground">List any one-time purchases like laptops, cameras, or furniture for your business.</div>
          </div>
        </CardHeader>
        {hasEquipment && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Equipment</div>
            <Label className="block mb-4">Have you bought any equipment or tools for your business?</Label>
            {equipment.map((item, idx) => {
              const needsExtra = item.depreciationMethod === 'sum_of_years_digits' || item.depreciationMethod === 'units_of_production';
              return (
                <div key={idx} className="bg-white rounded-lg shadow border mb-6 p-6 flex flex-col gap-2 relative">
                  {/* Delete button in top-right */}
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEquipment(idx)} className="absolute top-2 right-2 z-10"><Trash2 className="w-4 h-4" /></Button>
                  <div className="flex flex-col md:flex-row md:items-end md:gap-6 gap-2">
                    <div className="flex flex-col flex-1 min-w-[180px]">
                      <Label className="text-xs mb-1">Item Name</Label>
                      <Input placeholder="e.g. Shelves" value={item.name} onChange={e => handleEquipmentChange(idx, 'name', e.target.value)} />
                    </div>
                    <div className="flex flex-col w-32">
                      <Label className="text-xs mb-1">Cost</Label>
                      <Input placeholder="$1000" value={item.cost} onChange={e => handleEquipmentChange(idx, 'cost', e.target.value)} />
                    </div>
                    <div className="flex flex-col w-32">
                      <Label className="text-xs mb-1">Useful Life (years)</Label>
                      <Input placeholder="e.g. 5" value={item.usefulLife || ''} onChange={e => handleEquipmentChange(idx, 'usefulLife', e.target.value)} />
                    </div>
                    <div className="flex flex-col w-40">
                      <Label className="text-xs mb-1">Purchase Date</Label>
                      <Input type="date" value={item.purchaseDate || ''} onChange={e => handleEquipmentChange(idx, 'purchaseDate', e.target.value)} title="If left blank, we'll assume you bought this at the start of your forecast." />
                    </div>
                    <div className="flex flex-col flex-1 min-w-[120px]">
                      <Label className="text-xs mb-1">Notes</Label>
                      <Input placeholder="Optional" value={item.notes} onChange={e => handleEquipmentChange(idx, 'notes', e.target.value)} />
                    </div>
                    <div className="flex flex-col w-56">
                      <Label className="text-xs mb-1">Depreciation Method</Label>
                      <select value={item.depreciationMethod || 'straight_line'} onChange={e => handleEquipmentChange(idx, 'depreciationMethod', e.target.value as Equipment['depreciationMethod'])} className="h-10 rounded border px-2">
                        <option value="straight_line">Straight-Line</option>
                        <option value="double_declining">Double Declining Balance</option>
                        <option value="sum_of_years_digits">Sum-of-the-Years'-Digits</option>
                        <option value="units_of_production">Units of Production</option>
                      </select>
                    </div>
                  </div>
                  {needsExtra && (
                    <div className="border-t pt-3 mt-2 flex flex-col md:flex-row md:items-end md:gap-6 gap-2 bg-gray-50 rounded">
                      <span className="text-xs font-semibold text-muted-foreground mb-2 md:mb-0 md:mr-4">Additional Depreciation Details:</span>
                      {item.depreciationMethod === 'sum_of_years_digits' && (
                        <div className="flex flex-col w-32">
                          <Label className="text-xs mb-1">Salvage Value</Label>
                          <Input placeholder="Optional" value={item.salvageValue || ''} onChange={e => handleEquipmentChange(idx, 'salvageValue', e.target.value)} />
                        </div>
                      )}
                      {item.depreciationMethod === 'units_of_production' && (
                        <>
                          <div className="flex flex-col w-32">
                            <Label className="text-xs mb-1">Total Expected Units</Label>
                            <Input placeholder="e.g. 10000" value={item.totalUnits || ''} onChange={e => handleEquipmentChange(idx, 'totalUnits', e.target.value)} />
                          </div>
                          <div className="flex flex-col w-48">
                            <Label className="text-xs mb-1">Units per Year (comma separated)</Label>
                            <Input placeholder="e.g. 2000,2000,2000,2000,2000" value={item.unitsPerYear ? item.unitsPerYear.join(',') : ''} onChange={e => handleEquipmentChange(idx, 'unitsPerYear', e.target.value.split(','))} />
                          </div>
                        </>
                      )}
            </div>
                  )}
              </div>
              );
            })}
            <Button type="button" variant="teal" onClick={addEquipment} className="mt-2"><Plus className="w-4 h-4 mr-1" /> Add Another</Button>
          </CardContent>
        )}
      </Card>

      {/* Funding & Loans Section */}
      <Card>
        <CardHeader>
          <CardTitle>Funding & Loans</CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">How did you start your business?</div>
            <div className="text-sm text-muted-foreground">Tell us about your own investment, any business loans, and other shareholders (if any).</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Funding</div>
          <Label className="block mb-4">Your own investment (Owner Equity)</Label>
          <Input placeholder="Your own investment (e.g. $5000)" value={selfFunding} onChange={e => setSelfFunding(e.target.value)} className="mb-2" />
          <div className="flex items-center gap-2 mb-2">
            <Label className="mr-2">Any other shareholder(s)?</Label>
            <Switch checked={hasShareholders} onCheckedChange={setHasShareholders} />
          </div>
          {hasShareholders && (
            <div className="space-y-2">
              <Label className="block mb-4">Other Shareholder(s)</Label>
              <div className="grid grid-cols-4 gap-4 items-center mb-2 text-xs font-medium text-muted-foreground">
                <div className="flex-1">Name</div>
                <div className="w-32">Amount</div>
                <div className="w-24">% Ownership</div>
                <div className="flex-1">Notes</div>
                <div className="w-8" />
              </div>
              {shareholders.map((sh, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 mb-3">
                  <Input placeholder="Name" value={sh.name} onChange={e => handleShareholderChange(idx, 'name', e.target.value)} className="flex-1" />
                  <Input placeholder="$10000" value={sh.amount} onChange={e => handleShareholderChange(idx, 'amount', e.target.value)} className="w-32" />
                  <Input placeholder="50" value={sh.percent} onChange={e => handleShareholderChange(idx, 'percent', e.target.value)} className="w-24" />
                  <Input placeholder="Notes (optional)" value={sh.notes} onChange={e => handleShareholderChange(idx, 'notes', e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeShareholder(idx)}><Trash2 className="w-4 h-4" /></Button>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Taxes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Taxes
            <Switch checked={hasTax} onCheckedChange={setHasTax} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you want to include taxes?</div>
            <div className="text-sm text-muted-foreground">We’ll use a default tax rate, but you can change it if needed.</div>
          </div>
        </CardHeader>
        {hasTax && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Taxes</div>
            <Label className="block mb-4">Do you want to include taxes in your model?</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={100} value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-24" />
              <span className="text-muted-foreground">%</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Other Income or Costs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Other Income or Costs
            <Switch checked={hasOther} onCheckedChange={setHasOther} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Anything else?</div>
            <div className="text-sm text-muted-foreground">Add any other income or costs not covered above, like sponsorships or refunds.</div>
          </div>
        </CardHeader>
        {hasOther && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Other Income/Costs</div>
            <Label className="block mb-4">Do you have any other sources of income or costs not mentioned above?</Label>
            {/* Header Row for Other Income/Costs */}
            <div className="flex gap-x-4 items-center mb-2 px-1">
              <div className="text-xs font-semibold text-muted-foreground w-40">Type</div>
              <div className="text-xs font-semibold text-muted-foreground w-24">Amount</div>
              <div className="text-xs font-semibold text-muted-foreground w-40">Notes</div>
              <div className="text-xs font-semibold text-muted-foreground w-24">Income/Cost</div>
              <div className="text-xs w-10" />
            </div>
            {other.map((item, idx) => (
              <div key={idx} className="flex gap-x-4 items-center mb-2 px-1">
                <Input placeholder="Type (e.g. Sponsorship)" value={item.type} onChange={e => handleOtherChange(idx, 'type', e.target.value)} className="w-40" />
                <Input placeholder="$100" value={item.amount} onChange={e => handleOtherChange(idx, 'amount', e.target.value)} className="w-24" />
                <Input placeholder="Notes (optional)" value={item.notes} onChange={e => handleOtherChange(idx, 'notes', e.target.value)} className="w-40" />
                <select value={item.isIncome ? 'income' : 'cost'} onChange={e => handleOtherChange(idx, 'isIncome', e.target.value === 'income')} className="w-24 border rounded px-2 py-1 text-xs">
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

      {/* Forecasting Section */}
      <Card>
        <CardHeader>
          <CardTitle>Forecasting</CardTitle>
          <div className="text-sm text-muted-foreground">How far into the future do you want to forecast?</div>
        </CardHeader>
        <CardContent className="space-y-2 mb-10">
          <div className="font-semibold text-lg mb-4">Forecasting</div>
          <Label>Forecast Period</Label>
          <div className="flex gap-2 items-center">
            <Input type="number" value={forecastPeriod} onChange={e => {
              let val = e.target.value;
              if (val === '' || isNaN(Number(val)) || Number(val) < 1) val = '1';
              setForecastPeriod(val);
            }} className="w-24" />
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

      {/* Credit Sales Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Credit Sales
            <Switch checked={hasCreditSales} onCheckedChange={setHasCreditSales} />
          </CardTitle>
          <div className="mt-1 mb-2">
            <div className="font-semibold text-base">Do you sell on credit?</div>
            <div className="text-sm text-muted-foreground">Specify what % of sales are on credit and the average collection period.</div>
          </div>
        </CardHeader>
        {hasCreditSales && (
          <CardContent className="space-y-2 mb-10">
            <div className="font-semibold text-lg mb-4">Credit Sales</div>
            <Label>Percent of Sales on Credit (%)</Label>
            <Input type="number" value={creditSalesPercent} onChange={e => setCreditSalesPercent(e.target.value)} placeholder="e.g. 20" />
            <Label>Average Collection Period (days)</Label>
            <Input type="number" value={creditCollectionDays} onChange={e => setCreditCollectionDays(e.target.value)} placeholder="e.g. 30" />
          </CardContent>
        )}
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
            <div>Annual Income</div>
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

      {/* Final CTA */}
      <Button type="submit" variant="teal" className="w-full h-12 text-lg font-bold mt-6">🚀 Generate My Financial Model</Button>
    </form>
  );
};

export default ServiceBusinessInputForm; 