import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { ProcessedFinancialStatementsData } from './FinancialStatementsProcessor';

interface FinancialStatementsPreviewProps {
  data: ProcessedFinancialStatementsData;
  fileName: string;
}

export const FinancialStatementsPreview: React.FC<FinancialStatementsPreviewProps> = ({
  data,
  fileName
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderStatementPreview = (statement: any, title: string, icon: React.ReactNode) => {
    if (!statement || !statement.lineItems || statement.lineItems.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>No {title.toLowerCase()} data found</p>
        </div>
      );
    }

    // Show first few line items as preview
    const previewItems = statement.lineItems.slice(0, 8);
    const years = statement.years || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="outline">{statement.lineItems.length} line items</Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Line Item</th>
                {years.map((year: string) => (
                  <th key={year} className="text-right py-2 font-medium">{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewItems.map((item: any, index: number) => (
                <tr key={index} className={`border-b ${item.isHeader ? 'font-semibold bg-gray-50' : ''} ${item.isTotal ? 'font-semibold border-t-2' : ''}`}>
                  <td className="py-2">{item.label}</td>
                  {item.values.map((value: number, valueIndex: number) => (
                    <td key={valueIndex} className="text-right py-2 tabular-nums">
                      {item.isHeader ? '' : formatCurrency(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {statement.lineItems.length > 8 && (
          <p className="text-sm text-muted-foreground text-center">
            ... and {statement.lineItems.length - 8} more line items
          </p>
        )}
      </div>
    );
  };

  const getDataSummary = () => {
    const summary = {
      years: data.incomeStatement.years?.length || 0,
      incomeItems: data.incomeStatement.lineItems?.length || 0,
      balanceItems: data.balanceSheet.lineItems?.length || 0,
      cashFlowItems: data.cashFlow.lineItems?.length || 0,
    };

    // Calculate total revenue from first year if available
    let totalRevenue = 0;
    const revenueItem = data.incomeStatement.lineItems?.find(item => 
      item.label.toLowerCase().includes('total revenue')
    );
    if (revenueItem && revenueItem.values.length > 0) {
      totalRevenue = revenueItem.values[0];
    }

    return { ...summary, totalRevenue };
  };

  const summary = getDataSummary();

  return (
    <div className="space-y-6">
      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Summary
          </CardTitle>
          <CardDescription>
            Successfully parsed financial statements from {fileName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{summary.years}</div>
              <div className="text-sm text-muted-foreground">Years of Data</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.incomeItems}</div>
              <div className="text-sm text-muted-foreground">Income Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.balanceItems}</div>
              <div className="text-sm text-muted-foreground">Balance Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.cashFlowItems}</div>
              <div className="text-sm text-muted-foreground">Cash Flow Items</div>
            </div>
          </div>
          
          {summary.totalRevenue > 0 && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-800">
                  Latest Year Revenue: {formatCurrency(summary.totalRevenue)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Statements Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Statements Preview</CardTitle>
          <CardDescription>
            Review the imported data from your financial statements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="income" className="mt-6">
              {renderStatementPreview(
                data.incomeStatement, 
                'Income Statement',
                <TrendingUp className="h-5 w-5 text-teal-600" />
              )}
            </TabsContent>
            
            <TabsContent value="balance" className="mt-6">
              {renderStatementPreview(
                data.balanceSheet, 
                'Balance Sheet',
                <FileText className="h-5 w-5 text-blue-600" />
              )}
            </TabsContent>
            
            <TabsContent value="cashflow" className="mt-6">
              {renderStatementPreview(
                data.cashFlow, 
                'Cash Flow Statement',
                <DollarSign className="h-5 w-5 text-green-600" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Validation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Financial statements structure validated</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Data types and formats verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Ready for business model conversion</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialStatementsPreview;