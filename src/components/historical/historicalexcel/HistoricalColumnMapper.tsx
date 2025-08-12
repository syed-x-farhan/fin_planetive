import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, FileSpreadsheet, Info } from 'lucide-react';
import { RowData, ColumnMapping } from './HistoricalDataPreviewTable';

interface HistoricalColumnMapperProps {
  data: RowData[];
  onMappingChange: (mappings: ColumnMapping[]) => void;
  mappings: ColumnMapping[];
}

// Template field definitions - hybrid approach with base sheets + conditional company-specific sheets
const templateFields = [
  // ===== BASE SHEETS (Common to all company types) =====
  
  // Basic Information Sheet
  { id: 'years_in_business', name: 'Years in Business', sheet: 'Basic Information', required: true },
  { id: 'forecast_years', name: 'Forecast Years', sheet: 'Basic Information', required: true },
  { id: 'tax_rate', name: 'Tax Rate (%)', sheet: 'Basic Information', required: true },
  { id: 'self_funding', name: 'Self Funding', sheet: 'Basic Information', required: true },
  { id: 'fiscal_year_start', name: 'Fiscal Year Start', sheet: 'Basic Information', required: true },
  { id: 'revenue_input_type', name: 'Revenue Input Type', sheet: 'Basic Information', required: true },
  { id: 'expense_input_type', name: 'Expense Input Type', sheet: 'Basic Information', required: true },
  
  // Services Sheet
  { id: 'service_name', name: 'Service Name', sheet: 'Services', required: true },
  { id: 'service_revenue', name: 'Revenue', sheet: 'Services', required: true },
  { id: 'service_cost', name: 'Cost', sheet: 'Services', required: false },
  { id: 'service_year', name: 'Year', sheet: 'Services', required: true },
  
  // Expenses Sheet
  { id: 'expense_category', name: 'Expense Category', sheet: 'Expenses', required: true },
  { id: 'expense_amount', name: 'Amount', sheet: 'Expenses', required: true },
  { id: 'expense_year', name: 'Year', sheet: 'Expenses', required: true },
  { id: 'expense_type', name: 'Type', sheet: 'Expenses', required: false },
  
  // Equipment Sheet
  { id: 'equipment_name', name: 'Equipment Name', sheet: 'Equipment', required: true },
  { id: 'equipment_cost', name: 'Purchase Cost', sheet: 'Equipment', required: true },
  { id: 'equipment_year', name: 'Purchase Year', sheet: 'Equipment', required: true },
  { id: 'equipment_depreciation', name: 'Depreciation Method', sheet: 'Equipment', required: true },
  { id: 'equipment_life', name: 'Useful Life (Years)', sheet: 'Equipment', required: true },
  
  // Loans Sheet
  { id: 'loan_name', name: 'Loan Name', sheet: 'Loans', required: true },
  { id: 'loan_type', name: 'Loan Type', sheet: 'Loans', required: true },
  { id: 'loan_subtype', name: 'Sub Type', sheet: 'Loans', required: false },
  { id: 'loan_amount', name: 'Amount', sheet: 'Loans', required: true },
  { id: 'loan_rate', name: 'Interest Rate (%)', sheet: 'Loans', required: true },
  { id: 'loan_term', name: 'Term (Years)', sheet: 'Loans', required: true },
  { id: 'loan_start_year', name: 'Start Year', sheet: 'Loans', required: true },
  
  // Other Income/Costs Sheet
  { id: 'other_description', name: 'Description', sheet: 'Other Income Costs', required: true },
  { id: 'other_amount', name: 'Amount', sheet: 'Other Income Costs', required: true },
  { id: 'other_type', name: 'Type', sheet: 'Other Income Costs', required: true },
  { id: 'other_year', name: 'Year', sheet: 'Other Income Costs', required: true },
  
  // Investments Sheet
  { id: 'investment_name', name: 'Investment Name', sheet: 'Investments', required: true },
  { id: 'investment_type', name: 'Investment Type', sheet: 'Investments', required: true },
  { id: 'investment_amount', name: 'Amount', sheet: 'Investments', required: true },
  { id: 'investment_year', name: 'Year', sheet: 'Investments', required: true },
  { id: 'investment_investor', name: 'Investor', sheet: 'Investments', required: false },
  
  // Shareholders Sheet
  { id: 'shareholder_name', name: 'Shareholder Name', sheet: 'Shareholders', required: true },
  { id: 'shareholder_shares', name: 'Shares Owned', sheet: 'Shareholders', required: true },
  { id: 'shareholder_percent', name: 'Ownership %', sheet: 'Shareholders', required: true },
  { id: 'shareholder_year', name: 'Year', sheet: 'Shareholders', required: true },
  { id: 'shareholder_class', name: 'Share Class', sheet: 'Shareholders', required: false },
  
  // Growth Assumptions Sheet
  { id: 'growth_type', name: 'Growth Type', sheet: 'Growth Assumptions', required: true },
  { id: 'growth_rate', name: 'Rate (%)', sheet: 'Growth Assumptions', required: true },
  { id: 'growth_description', name: 'Description', sheet: 'Growth Assumptions', required: false },
  
  // Credit Sales Sheet
  { id: 'credit_sales_percent', name: 'Credit Sales Percentage', sheet: 'Credit Sales', required: true },
  { id: 'collection_days', name: 'Collection Days', sheet: 'Credit Sales', required: true },
  { id: 'accounts_payable_days', name: 'Accounts Payable Days', sheet: 'Credit Sales', required: true },
  
  // Owner Drawings Sheet
  { id: 'owner_drawings_amount', name: 'Owner Drawings Amount', sheet: 'Owner Drawings', required: true },
  { id: 'owner_drawings_frequency', name: 'Owner Drawings Frequency', sheet: 'Owner Drawings', required: true },
  
  // Terminal Value Sheet
  { id: 'discount_rate', name: 'Discount Rate', sheet: 'Terminal Value', required: true },
  { id: 'terminal_growth', name: 'Terminal Growth', sheet: 'Terminal Value', required: true },
  { id: 'tv_method', name: 'Terminal Value Method', sheet: 'Terminal Value', required: true },
  { id: 'tv_metric', name: 'Terminal Value Metric', sheet: 'Terminal Value', required: false },
  { id: 'tv_multiple', name: 'Terminal Value Multiple', sheet: 'Terminal Value', required: false },
  { id: 'tv_custom_value', name: 'Terminal Value Custom', sheet: 'Terminal Value', required: false },
  { id: 'tv_year', name: 'Terminal Value Year', sheet: 'Terminal Value', required: false },
  
  // WACC Sheet
  { id: 'use_wacc_build_up', name: 'Use WACC Build Up', sheet: 'WACC', required: true },
  { id: 'use_cost_of_equity_only', name: 'Use Cost of Equity Only', sheet: 'WACC', required: true },
  { id: 'rf_rate', name: 'Risk-Free Rate', sheet: 'WACC', required: true },
  { id: 'beta', name: 'Beta', sheet: 'WACC', required: true },
  { id: 'market_premium', name: 'Market Premium', sheet: 'WACC', required: true },
  { id: 'cost_of_debt', name: 'Cost of Debt', sheet: 'WACC', required: true },
  { id: 'tax_rate_wacc', name: 'Tax Rate for WACC', sheet: 'WACC', required: true },
  { id: 'equity_pct', name: 'Equity Percentage', sheet: 'WACC', required: true },
  { id: 'debt_pct', name: 'Debt Percentage', sheet: 'WACC', required: true },
  
  // Global Interest Rates Sheet
  { id: 'short_term_rate', name: 'Short Term Rate', sheet: 'Global Interest Rates', required: true },
  { id: 'long_term_rate', name: 'Long Term Rate', sheet: 'Global Interest Rates', required: true },
  { id: 'investment_rate', name: 'Investment Rate', sheet: 'Global Interest Rates', required: true },
  { id: 'use_for_loans', name: 'Use for Loans', sheet: 'Global Interest Rates', required: true },
  
  // ===== CONDITIONAL SHEETS (Company-specific) =====
  
  // Service-specific sheets (currently implemented)
  { id: 'service_delivery_model', name: 'Service Delivery Model', sheet: 'Service Business Model', required: true },
  { id: 'pricing_strategy', name: 'Pricing Strategy', sheet: 'Service Business Model', required: true },
  { id: 'client_retention_rate', name: 'Client Retention Rate', sheet: 'Service Business Model', required: true },
  
  { id: 'utilization_rate', name: 'Utilization Rate', sheet: 'Service Metrics', required: false },
  { id: 'team_size', name: 'Team Size', sheet: 'Service Metrics', required: false },
  { id: 'team_growth', name: 'Team Growth Rate', sheet: 'Service Metrics', required: false },
  { id: 'project_duration', name: 'Average Project Duration', sheet: 'Service Metrics', required: false },
  { id: 'cac', name: 'Client Acquisition Cost', sheet: 'Service Metrics', required: false },
  { id: 'clv', name: 'Customer Lifetime Value', sheet: 'Service Metrics', required: false },
  { id: 'recurring_revenue', name: 'Recurring Revenue %', sheet: 'Service Metrics', required: false },
  { id: 'churn_rate', name: 'Churn Rate', sheet: 'Service Metrics', required: false },
  { id: 'expansion_revenue', name: 'Expansion Revenue %', sheet: 'Service Metrics', required: false },
  { id: 'seasonality', name: 'Seasonality Factor', sheet: 'Service Metrics', required: false },
  
  // Future company-specific sheets (ready for implementation)
  // Retail-specific fields
  // { id: 'inventory_turnover', name: 'Inventory Turnover', sheet: 'Retail Metrics', required: false },
  // { id: 'foot_traffic', name: 'Foot Traffic', sheet: 'Retail Metrics', required: false },
  // { id: 'average_transaction', name: 'Average Transaction Value', sheet: 'Retail Metrics', required: false },
  
  // SaaS-specific fields
  // { id: 'mrr', name: 'Monthly Recurring Revenue', sheet: 'SaaS Metrics', required: false },
  // { id: 'arr', name: 'Annual Recurring Revenue', sheet: 'SaaS Metrics', required: false },
  // { id: 'customer_churn', name: 'Customer Churn Rate', sheet: 'SaaS Metrics', required: false },
  
  // Energy-specific fields
  // { id: 'production_capacity', name: 'Production Capacity', sheet: 'Energy Metrics', required: false },
  // { id: 'regulatory_compliance', name: 'Regulatory Compliance', sheet: 'Energy Metrics', required: false },
  
  // Real Estate-specific fields
  // { id: 'occupancy_rate', name: 'Occupancy Rate', sheet: 'Real Estate Metrics', required: false },
  // { id: 'rental_income', name: 'Rental Income', sheet: 'Real Estate Metrics', required: false },
];

export const HistoricalColumnMapper: React.FC<HistoricalColumnMapperProps> = ({
  data,
  onMappingChange,
  mappings
}) => {
  const [mappingErrors, setMappingErrors] = useState<string[]>([]);

  // Get available columns from data
  const availableColumns = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'id') : [];

  // Auto-map columns based on template structure
  const autoMapColumns = () => {
    const newMappings: ColumnMapping[] = [];
    
    availableColumns.forEach(column => {
      const bestMatch = findBestMatch(column, templateFields);
      if (bestMatch) {
        newMappings.push({
          excelColumn: column,
          targetField: bestMatch.id,
          dataType: 'string' as 'string' | 'number' | 'date' | 'boolean',
          required: bestMatch.required
        });
      }
    });
    
    onMappingChange(newMappings);
  };

  const findBestMatch = (columnName: string, fields: any[]) => {
    const normalizedColumn = columnName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let bestMatch = null;
    let bestScore = 0;
    
    fields.forEach(field => {
      const normalizedField = field.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const score = calculateSimilarity(normalizedColumn, normalizedField);
      
      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestMatch = field;
      }
    });
    
    return bestMatch;
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const validateMappings = () => {
    const errors: string[] = [];
    const requiredFields = templateFields.filter(f => f.required);
    
    requiredFields.forEach(field => {
      const hasMapping = mappings.some(m => m.targetField === field.id);
      if (!hasMapping) {
        errors.push(`Required field "${field.name}" is not mapped`);
      }
    });
    
    setMappingErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    // Auto-map on component mount
    if (mappings.length === 0 && availableColumns.length > 0) {
      autoMapColumns();
    }
  }, [availableColumns]);

  useEffect(() => {
    validateMappings();
  }, [mappings]);

  // Group fields by sheet for summary
  const fieldsBySheet = templateFields.reduce((acc, field) => {
    if (!acc[field.sheet]) {
      acc[field.sheet] = [];
    }
    acc[field.sheet].push(field);
    return acc;
  }, {} as { [sheet: string]: any[] });

  // Count mapped fields per sheet
  const getMappedCount = (sheetName: string) => {
    const sheetFields = fieldsBySheet[sheetName];
    const mappedFields = mappings.filter(m => 
      sheetFields.some(f => f.id === m.targetField)
    );
    return mappedFields.length;
  };

  const getTotalFields = (sheetName: string) => {
    return fieldsBySheet[sheetName].length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Template Data Summary</h3>
        <p className="text-muted-foreground">
          Review the data found in your template
        </p>
      </div>

      {/* Auto-mapping Info */}
      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-teal-600" />
            Template Data Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(fieldsBySheet).map(([sheetName, fields]) => {
              const mappedCount = getMappedCount(sheetName);
              const totalFields = getTotalFields(sheetName);
              const hasData = mappedCount > 0;
              
              return (
                <div key={sheetName} className={`border rounded-lg p-3 ${hasData ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{sheetName}</h4>
                    {hasData && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hasData ? (
                      <span className="text-green-700">
                        {mappedCount} of {totalFields} fields found
                      </span>
                    ) : (
                      <span className="text-gray-500">No data found</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Import Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{availableColumns.length}</p>
              <p className="text-sm text-muted-foreground">Excel Columns</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{mappings.length}</p>
              <p className="text-sm text-muted-foreground">Mapped Fields</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{data.length}</p>
              <p className="text-sm text-muted-foreground">Data Rows</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">
                {mappingErrors.length === 0 ? '✓' : '✗'}
              </p>
              <p className="text-sm text-muted-foreground">Ready to Import</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {mappingErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Some required template fields are missing:</p>
            <ul className="list-disc list-inside space-y-1">
              {mappingErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Success Message */}
      {mappings.length > 0 && mappingErrors.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Template data successfully mapped!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your Excel template data has been automatically mapped and is ready for import.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Manual Override (Optional) */}
      {mappings.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Info className="h-5 w-5 mr-2 text-orange-600" />
              Need to Adjust Mapping?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The automatic mapping should work correctly with our template. If you need to adjust any mappings, click below.
            </p>
            <Button variant="outline" size="sm" onClick={() => {}} className="border-orange-200 hover:bg-orange-50">
              Show Advanced Mapping
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 