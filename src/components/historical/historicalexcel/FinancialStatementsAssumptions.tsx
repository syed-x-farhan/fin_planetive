import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator, HelpCircle, DollarSign, Percent, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProcessedFinancialStatementsData } from './FinancialStatementsProcessor';

interface FinancialStatementsAssumptionsProps {
  data: ProcessedFinancialStatementsData;
  onAssumptionsChange: (assumptions: FinancialAssumptions) => void;
  initialAssumptions?: FinancialAssumptions;
}

export interface FinancialAssumptions {
  // Basic Parameters
  forecastYears: string;
  taxRate: string;
  
  // Growth Rates
  revenueGrowthRate: string;
  revenueCalculationMethod: 'simple' | 'weighted' | 'cagr' | 'custom';
  expenseGrowthRate: string;
  expenseCalculationMethod: 'simple' | 'weighted' | 'cagr' | 'custom';
  
  // Working Capital Assumptions
  creditSalesPercent: string;
  creditCollectionDays: string;
  accountsPayableDays: string;
  
  // Owner/Shareholder Assumptions
  ownerDrawingsAmount: string;
  ownerDrawingsFrequency: 'monthly' | 'annual';
  
  // Fiscal Year
  fiscalYearStart: string;
  
  // Terminal Value & Discount Rate
  discountRate: string;
  terminalGrowth: string;
  tvMethod: string;
  tvMetric: string;
  tvMultiple: string;
}

const FinancialStatementsAssumptions: React.FC<FinancialStatementsAssumptionsProps> = ({
  data,
  onAssumptionsChange,
  initialAssumptions
}) => {
  // Initialize assumptions with auto-calculated values
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(() => {
    if (initialAssumptions) return initialAssumptions;
    
    // Auto-calculate growth rates from historical data
    const autoCalculatedAssumptions = calculateGrowthRatesFromData(data);
    
    return {
      forecastYears: '5',
      taxRate: '25',
      revenueGrowthRate: autoCalculatedAssumptions.revenueGrowthRate,
      revenueCalculationMethod: 'cagr',
      expenseGrowthRate: autoCalculatedAssumptions.expenseGrowthRate,
      expenseCalculationMethod: 'cagr',
      creditSalesPercent: '30',
      creditCollectionDays: '45',
      accountsPayableDays: '30',
      ownerDrawingsAmount: '50000',
      ownerDrawingsFrequency: 'annual',
      fiscalYearStart: 'January',
      discountRate: '10',
      terminalGrowth: '2',
      tvMethod: 'perpetuity',
      tvMetric: 'EBITDA',
      tvMultiple: '8'
    };
  });

  // Update parent when assumptions change
  useEffect(() => {
    onAssumptionsChange(assumptions);
  }, [assumptions, onAssumptionsChange]);

  const updateAssumption = (key: keyof FinancialAssumptions, value: string) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  const handleGrowthRateMethodChange = (
    type: 'revenue' | 'expense',
    method: 'simple' | 'weighted' | 'cagr' | 'custom'
  ) => {
    if (method === 'custom') {
      if (type === 'revenue') {
        updateAssumption('revenueCalculationMethod', 'custom');
      } else {
        updateAssumption('expenseCalculationMethod', 'custom');
      }
      return;
    }

    // Auto-calculate based on method
    const growthRates = calculateGrowthRatesFromData(data, method);
    
    if (type === 'revenue') {
      updateAssumption('revenueGrowthRate', growthRates.revenueGrowthRate);
      updateAssumption('revenueCalculationMethod', method);
    } else {
      updateAssumption('expenseGrowthRate', growthRates.expenseGrowthRate);
      updateAssumption('expenseCalculationMethod', method);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get historical summary for context
  const historicalSummary = getHistoricalSummary(data);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Forecasting Assumptions
          </CardTitle>
          <CardDescription>
            Review and adjust the auto-calculated assumptions for your financial projections. 
            These are based on your historical financial data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-teal-600">{data.incomeStatement.years?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Years of Historical Data</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{formatCurrency(historicalSummary.latestRevenue)}</div>
              <div className="text-sm text-muted-foreground">Latest Year Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{historicalSummary.avgGrowthRate}%</div>
              <div className="text-sm text-muted-foreground">Historical Avg Growth</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions Tabs */}
      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="growth">Growth Rates</TabsTrigger>
          <TabsTrigger value="working-capital">Working Capital</TabsTrigger>
          <TabsTrigger value="owner">Owner/Shareholder</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Growth Rate Assumptions</CardTitle>
              <CardDescription>
                Auto-calculated from your historical data. You can change the calculation method or enter custom rates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Forecast Years</Label>
                  <Input
                    type="number"
                    value={assumptions.forecastYears}
                    onChange={(e) => updateAssumption('forecastYears', e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={assumptions.taxRate}
                    onChange={(e) => updateAssumption('taxRate', e.target.value)}
                    min="0"
                    max="50"
                  />
                </div>
              </div>

              {/* Revenue Growth Rate */}
              <div>
                <Label className="flex items-center gap-2">
                  Revenue Growth Rate (%)
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Choose calculation method: Simple Average, Weighted Average (recent years matter more), CAGR (compound growth), or Custom (manual input).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex gap-2 mb-2">
                  {(['simple', 'weighted', 'cagr', 'custom'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={`px-3 py-1 text-xs border rounded hover:bg-teal-50 ${
                        assumptions.revenueCalculationMethod === method 
                          ? 'border-teal-200 bg-teal-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleGrowthRateMethodChange('revenue', method)}
                    >
                      {method === 'simple' && 'Simple'}
                      {method === 'weighted' && 'Weighted'}
                      {method === 'cagr' && 'CAGR'}
                      {method === 'custom' && 'Custom'}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={assumptions.revenueGrowthRate}
                  onChange={(e) => {
                    updateAssumption('revenueGrowthRate', e.target.value);
                    updateAssumption('revenueCalculationMethod', 'custom');
                  }}
                  disabled={assumptions.revenueCalculationMethod !== 'custom'}
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {assumptions.revenueCalculationMethod === 'custom'
                    ? 'Enter your custom revenue growth rate'
                    : `Auto-calculated using ${assumptions.revenueCalculationMethod} method from historical data`}
                </p>
              </div>

              {/* Expense Growth Rate */}
              <div>
                <Label className="flex items-center gap-2">
                  Expense Growth Rate (%)
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Expected annual growth rate for operating expenses.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex gap-2 mb-2">
                  {(['simple', 'weighted', 'cagr', 'custom'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={`px-3 py-1 text-xs border rounded hover:bg-teal-50 ${
                        assumptions.expenseCalculationMethod === method 
                          ? 'border-teal-200 bg-teal-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleGrowthRateMethodChange('expense', method)}
                    >
                      {method === 'simple' && 'Simple'}
                      {method === 'weighted' && 'Weighted'}
                      {method === 'cagr' && 'CAGR'}
                      {method === 'custom' && 'Custom'}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={assumptions.expenseGrowthRate}
                  onChange={(e) => {
                    updateAssumption('expenseGrowthRate', e.target.value);
                    updateAssumption('expenseCalculationMethod', 'custom');
                  }}
                  disabled={assumptions.expenseCalculationMethod !== 'custom'}
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {assumptions.expenseCalculationMethod === 'custom'
                    ? 'Enter your custom expense growth rate'
                    : `Auto-calculated using ${assumptions.expenseCalculationMethod} method from historical data`}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="working-capital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Capital Assumptions</CardTitle>
              <CardDescription>
                These assumptions affect cash flow calculations and working capital requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Credit Sales (%)</Label>
                  <Input
                    type="number"
                    value={assumptions.creditSalesPercent}
                    onChange={(e) => updateAssumption('creditSalesPercent', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentage of sales on credit</p>
                </div>
                <div>
                  <Label>Collection Days</Label>
                  <Input
                    type="number"
                    value={assumptions.creditCollectionDays}
                    onChange={(e) => updateAssumption('creditCollectionDays', e.target.value)}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Average days to collect payment</p>
                </div>
                <div>
                  <Label>Accounts Payable Days</Label>
                  <Input
                    type="number"
                    value={assumptions.accountsPayableDays}
                    onChange={(e) => updateAssumption('accountsPayableDays', e.target.value)}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Average days to pay suppliers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Owner/Shareholder Assumptions</CardTitle>
              <CardDescription>
                Owner drawings and fiscal year settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Owner Drawings Amount</Label>
                  <Input
                    type="number"
                    value={assumptions.ownerDrawingsAmount}
                    onChange={(e) => updateAssumption('ownerDrawingsAmount', e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Drawings Frequency</Label>
                  <Select
                    value={assumptions.ownerDrawingsFrequency}
                    onValueChange={(value: 'monthly' | 'annual') => updateAssumption('ownerDrawingsFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fiscal Year Start</Label>
                  <Select
                    value={assumptions.fiscalYearStart}
                    onValueChange={(value) => updateAssumption('fiscalYearStart', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ].map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="valuation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Valuation Assumptions</CardTitle>
              <CardDescription>
                Terminal value and discount rate assumptions for DCF valuation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Discount Rate (%)</Label>
                  <Input
                    type="number"
                    value={assumptions.discountRate}
                    onChange={(e) => updateAssumption('discountRate', e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Terminal Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={assumptions.terminalGrowth}
                    onChange={(e) => updateAssumption('terminalGrowth', e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Terminal Value Method</Label>
                  <Select
                    value={assumptions.tvMethod}
                    onValueChange={(value) => updateAssumption('tvMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perpetuity">Perpetuity Growth</SelectItem>
                      <SelectItem value="multiple">Multiple Method</SelectItem>
                      <SelectItem value="custom">Custom Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Terminal Value Multiple</Label>
                  <Input
                    type="number"
                    value={assumptions.tvMultiple}
                    onChange={(e) => updateAssumption('tvMultiple', e.target.value)}
                    min="0"
                    step="0.1"
                    disabled={assumptions.tvMethod !== 'multiple'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
function calculateGrowthRatesFromData(
  data: ProcessedFinancialStatementsData, 
  method: 'simple' | 'weighted' | 'cagr' = 'cagr'
): { revenueGrowthRate: string; expenseGrowthRate: string } {
  // Extract revenue data
  const revenueItem = data.incomeStatement.lineItems?.find(item => 
    item.label.toLowerCase().includes('total revenue') || 
    item.label.toLowerCase().includes('service revenue')
  );
  
  // Extract expense data
  const expenseItem = data.incomeStatement.lineItems?.find(item => 
    item.label.toLowerCase().includes('total operating expenses') ||
    item.label.toLowerCase().includes('operating expenses')
  );
  
  const revenueValues = revenueItem?.values || [];
  const expenseValues = expenseItem?.values || [];
  
  const revenueGrowthRate = calculateGrowthRate(revenueValues, method);
  const expenseGrowthRate = calculateGrowthRate(expenseValues, method);
  
  return {
    revenueGrowthRate: revenueGrowthRate.toFixed(1),
    expenseGrowthRate: expenseGrowthRate.toFixed(1)
  };
}

function calculateGrowthRate(values: number[], method: 'simple' | 'weighted' | 'cagr'): number {
  if (values.length < 2) return 0;
  
  switch (method) {
    case 'simple':
      return calculateSimpleAverage(values);
    case 'weighted':
      return calculateWeightedAverage(values);
    case 'cagr':
      return calculateCAGR(values) * 100;
    default:
      return 0;
  }
}

function calculateSimpleAverage(data: number[]): number {
  if (data.length < 2) return 0;
  const growthRates = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] > 0) {
      growthRates.push(((data[i] - data[i - 1]) / data[i - 1]) * 100);
    }
  }
  return growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;
}

function calculateWeightedAverage(data: number[]): number {
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
}

function calculateCAGR(data: number[]): number {
  if (data.length < 2 || data[0] <= 0 || data[data.length - 1] <= 0) return 0;
  const periods = data.length - 1;
  return Math.pow(data[data.length - 1] / data[0], 1 / periods) - 1;
}

function getHistoricalSummary(data: ProcessedFinancialStatementsData) {
  const revenueItem = data.incomeStatement.lineItems?.find(item => 
    item.label.toLowerCase().includes('total revenue')
  );
  
  const latestRevenue = revenueItem?.values?.[revenueItem.values.length - 1] || 0;
  const avgGrowthRate = calculateGrowthRate(revenueItem?.values || [], 'cagr');
  
  return {
    latestRevenue,
    avgGrowthRate: avgGrowthRate.toFixed(1)
  };
}

export default FinancialStatementsAssumptions;