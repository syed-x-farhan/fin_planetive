import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalculationResult } from '@/services/api';

interface HistoricalDashboardProps {
  calculationResult: CalculationResult | null;
}

const HistoricalDashboard: React.FC<HistoricalDashboardProps> = ({ calculationResult }) => {
  if (!calculationResult || !calculationResult.income_statement || !calculationResult.balance_sheet || !calculationResult.cash_flow) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">No Historical Calculation Results</h3>
        <p className="text-muted-foreground">Please run a historical calculation to see the statements.</p>
      </div>
    );
  }

  const historicalYears = calculationResult.historical_years || 3;
  const forecastYears = calculationResult.forecast_years || 5;

  return (
    <div className="p-8 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historical Years</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historicalYears}</div>
            <p className="text-xs text-muted-foreground">Years of historical data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Forecast Years</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecastYears}</div>
            <p className="text-xs text-muted-foreground">Years of projections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Years</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historicalYears + forecastYears}</div>
            <p className="text-xs text-muted-foreground">Complete analysis period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Business Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm">
              {calculationResult.business_type || 'Service'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Established business</p>
          </CardContent>
        </Card>
      </div>

      {/* Historical vs Projected Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Historical vs Projected Analysis</CardTitle>
          <CardDescription>Comparison of historical performance and future projections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="income">
              <HistoricalIncomeStatement 
                incomeStatement={calculationResult.income_statement}
                historicalYears={historicalYears}
              />
            </TabsContent>

            <TabsContent value="balance">
              <HistoricalBalanceSheet 
                balanceSheet={calculationResult.balance_sheet}
                historicalYears={historicalYears}
              />
            </TabsContent>

            <TabsContent value="cashflow">
              <HistoricalCashFlow 
                cashFlow={calculationResult.cash_flow}
                historicalYears={historicalYears}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* KPIs and Metrics */}
      {calculationResult.kpis && (
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
            <CardDescription>Historical trends and projected metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Historical Metrics */}
              {calculationResult.kpis.historical_metrics && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Historical Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Revenue Growth:</span>
                      <span className="font-semibold">
                        {((calculationResult.kpis.historical_metrics.avg_revenue_growth || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg EBITDA Margin:</span>
                      <span className="font-semibold">
                        {((calculationResult.kpis.historical_metrics.avg_ebitda_margin || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Net Margin:</span>
                      <span className="font-semibold">
                        {((calculationResult.kpis.historical_metrics.avg_net_margin || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Asset Turnover:</span>
                      <span className="font-semibold">
                        {(calculationResult.kpis.historical_metrics.avg_asset_turnover || 0).toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Projected Metrics */}
              {calculationResult.kpis.projected_metrics && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Projected Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Projected Revenue Growth:</span>
                      <span className="font-semibold">
                        {((calculationResult.kpis.projected_metrics.projected_revenue_growth || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Projected EBITDA Margin:</span>
                      <span className="font-semibold">
                        {((calculationResult.kpis.projected_metrics.projected_ebitda_margin || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Projected Net Margin:</span>
                      <span className="font-semibold">
                        {((calculationResult.kpis.projected_metrics.projected_net_margin || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Historical Income Statement Component
const HistoricalIncomeStatement: React.FC<{ 
  incomeStatement: any; 
  historicalYears: number 
}> = ({ incomeStatement, historicalYears }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Line Item</TableHead>
            {incomeStatement.years?.map((year: string, index: number) => (
              <TableHead key={year} className={index < historicalYears ? 'bg-blue-50' : 'bg-green-50'}>
                {year}
                {index < historicalYears && <Badge variant="outline" className="ml-1 text-xs">Historical</Badge>}
                {index >= historicalYears && <Badge variant="secondary" className="ml-1 text-xs">Projected</Badge>}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomeStatement.line_items?.map((item: any) => (
            <TableRow key={item.label}>
              <TableCell className="font-medium">{item.label}</TableCell>
              {item.values?.map((val: number, idx: number) => (
                <TableCell 
                  key={idx} 
                  className={idx < historicalYears ? 'bg-blue-50' : 'bg-green-50'}
                >
                  ${val.toLocaleString()}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Historical Balance Sheet Component
const HistoricalBalanceSheet: React.FC<{ 
  balanceSheet: any; 
  historicalYears: number 
}> = ({ balanceSheet, historicalYears }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Line Item</TableHead>
            {balanceSheet.years?.map((year: string, index: number) => (
              <TableHead key={year} className={index < historicalYears ? 'bg-blue-50' : 'bg-green-50'}>
                {year}
                {index < historicalYears && <Badge variant="outline" className="ml-1 text-xs">Historical</Badge>}
                {index >= historicalYears && <Badge variant="secondary" className="ml-1 text-xs">Projected</Badge>}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {balanceSheet.line_items?.map((item: any) => (
            <TableRow key={item.label}>
              <TableCell className="font-medium">{item.label}</TableCell>
              {item.values?.map((val: number, idx: number) => (
                <TableCell 
                  key={idx} 
                  className={idx < historicalYears ? 'bg-blue-50' : 'bg-green-50'}
                >
                  ${val.toLocaleString()}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Historical Cash Flow Component
const HistoricalCashFlow: React.FC<{ 
  cashFlow: any[]; 
  historicalYears: number 
}> = ({ cashFlow, historicalYears }) => {
  return (
    <div className="space-y-4">
      {cashFlow.map((period, periodIndex) => (
        <Card key={period.year}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {period.year}
              {periodIndex < historicalYears && <Badge variant="outline">Historical</Badge>}
              {periodIndex >= historicalYears && <Badge variant="secondary">Projected</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Operating Activities */}
              <div>
                <h4 className="font-semibold mb-2">Operating Activities</h4>
                <div className="space-y-1 text-sm">
                  {period.operating_activities?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item[0]}:</span>
                      <span className={item[1] < 0 ? 'text-red-600' : 'text-green-600'}>
                        ${Math.abs(item[1]).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-1 font-semibold">
                    Net Operating: ${period.net_cash_from_operating_activities?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Investing Activities */}
              <div>
                <h4 className="font-semibold mb-2">Investing Activities</h4>
                <div className="space-y-1 text-sm">
                  {period.investing_activities?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item[0]}:</span>
                      <span className={item[1] < 0 ? 'text-red-600' : 'text-green-600'}>
                        ${Math.abs(item[1]).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-1 font-semibold">
                    Net Investing: ${period.net_cash_from_investing_activities?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Financing Activities */}
              <div>
                <h4 className="font-semibold mb-2">Financing Activities</h4>
                <div className="space-y-1 text-sm">
                  {period.financing_activities?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item[0]}:</span>
                      <span className={item[1] < 0 ? 'text-red-600' : 'text-green-600'}>
                        ${Math.abs(item[1]).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-1 font-semibold">
                    Net Financing: ${period.net_cash_from_financing_activities?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Net Change and Cash Balances */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Net Change in Cash:</span>
                  <span className={period.net_change_in_cash < 0 ? 'text-red-600' : 'text-green-600'}>
                    ${Math.abs(period.net_change_in_cash).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Opening Cash:</span>
                  <span>${period.opening_cash_balance?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closing Cash:</span>
                  <span>${period.closing_cash_balance?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HistoricalDashboard; 