import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Eye, Settings, CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { HistoricalExcelUploadDialog } from './HistoricalExcelUploadDialog';
import { HistoricalDataPreviewTable, RowData } from './HistoricalDataPreviewTable';
import { HistoricalColumnMapper } from './HistoricalColumnMapper';
import { ColumnMapping } from './HistoricalDataPreviewTable';
import { processHistoricalExcelData, ProcessedHistoricalData } from './HistoricalDataProcessor';
import { processFinancialStatementsExcelData, ProcessedFinancialStatementsData, convertFinancialStatementsToFormState } from './FinancialStatementsProcessor';
import FinancialStatementsPreview from './FinancialStatementsPreview';
import FinancialStatementsAssumptions, { FinancialAssumptions } from './FinancialStatementsAssumptions';

interface HistoricalImportWizardProps {
  onImportComplete: (processedData: ProcessedHistoricalData | ProcessedFinancialStatementsData, assumptions?: any) => void;
  onCancel: () => void;
  modelId: string;
  dataType: 'business' | 'statements';
  importMethod: 'upload' | 'template' | 'manual';
  onCalculationComplete?: (result: any) => void;
}

interface ImportStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

interface ParsedExcelData {
  sheets: string[];
  rowCount: number;
  fileName: string;
  data?: any[];
  columns?: string[];
  sheetData?: { [sheetName: string]: any[] }; // Add sheet-specific data
}

export const HistoricalImportWizard = ({
  onImportComplete,
  onCancel,
  modelId,
  dataType,
  importMethod,
  onCalculationComplete
}: HistoricalImportWizardProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [previewData, setPreviewData] = useState<RowData[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [processedFinancialData, setProcessedFinancialData] = useState<ProcessedFinancialStatementsData | null>(null);
  const [financialAssumptions, setFinancialAssumptions] = useState<FinancialAssumptions | null>(null);

  // Different steps based on data type
  const steps: ImportStep[] = dataType === 'statements' ? [
    {
      id: 'upload',
      title: 'Upload File',
      description: 'Select and upload your financial statements',
      icon: Upload,
      completed: !!parsedData
    },
    {
      id: 'preview',
      title: 'Preview & Validate',
      description: 'Review your financial statements data',
      icon: Eye,
      completed: !!processedFinancialData && currentStep > 1
    },
    {
      id: 'assumptions',
      title: 'Set Assumptions',
      description: 'Review and adjust forecasting assumptions',
      icon: Settings,
      completed: !!financialAssumptions && currentStep > 2
    },
    {
      id: 'complete',
      title: 'Import Complete',
      description: 'Financial statements imported successfully',
      icon: CheckCircle,
      completed: false
    }
  ] : [
    {
      id: 'upload',
      title: 'Upload File',
      description: 'Select and upload your Excel file',
      icon: Upload,
      completed: !!parsedData
    },
    {
      id: 'preview',
      title: 'Preview Data',
      description: 'Review and edit imported data',
      icon: Eye,
      completed: previewData.length > 0 && currentStep > 1
    },
    {
      id: 'mapping',
      title: 'Map Columns',
      description: 'Map Excel columns to data fields',
      icon: Settings,
      completed: columnMappings.length > 0 && currentStep > 2
    },
    {
      id: 'complete',
      title: 'Import Complete',
      description: 'Data imported successfully',
      icon: CheckCircle,
      completed: false
    }
  ];

  // Filter preview data based on selected sheet
  const filteredPreviewData = useMemo(() => {
    if (!parsedData || !selectedSheet || !parsedData.sheetData) {
      return previewData;
    }
    
    const sheetData = parsedData.sheetData[selectedSheet];
    if (!sheetData) {
      return previewData;
    }
    
    // Convert sheet data to RowData format
    return sheetData.map((row: any, index: number) => ({
      id: `row-${index + 1}`,
      ...row.reduce((acc: any, cell: any, cellIndex: number) => {
        const columnName = parsedData.columns && parsedData.columns[cellIndex] 
          ? parsedData.columns[cellIndex] 
          : `column_${cellIndex + 1}`;
        acc[columnName] = cell;
        return acc;
      }, {})
    }));
  }, [parsedData, selectedSheet, previewData]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUploadComplete = async (data: ParsedExcelData, file?: File) => {
    setParsedData(data);
    setSheetNames(data.sheets);
    if (data.sheets.length > 0) {
      setSelectedSheet(data.sheets[0]);
    }
    
    // For financial statements, process the data immediately
    if (dataType === 'statements' && (file || selectedFile)) {
      try {
        const fileToProcess = file || selectedFile;
        if (fileToProcess) {
          const processedData = await processFinancialStatementsExcelData(fileToProcess);
          setProcessedFinancialData(processedData);
        }
      } catch (error) {
        console.error('Error processing financial statements:', error);
        // Set some error state or show error message
      }
    }
    
    // Convert the actual Excel data to RowData format for preview (for business data)
    if (data.data && data.data.length > 0) {
      const convertedData: RowData[] = data.data.map((row: any, index: number) => ({
        id: `row-${index + 1}`,
        ...row.reduce((acc: any, cell: any, cellIndex: number) => {
          // Use actual column names if available, otherwise use generic names
          const columnName = data.columns && data.columns[cellIndex] 
            ? data.columns[cellIndex] 
            : `column_${cellIndex + 1}`;
          acc[columnName] = cell;
          return acc;
        }, {})
      }));
      setPreviewData(convertedData);
    }
    
    setCurrentStep(1);
  };

  const handleDataChange = (newData: RowData[]) => {
    setPreviewData(newData);
  };

  const handleMappingChange = (newMappings: ColumnMapping[]) => {
    setColumnMappings(newMappings);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      // Process the uploaded file based on data type
      if (selectedFile) {
        let processedData;
        
        if (dataType === 'business') {
          processedData = await processHistoricalExcelData(selectedFile);
        } else if (dataType === 'statements') {
          // For financial statements, we already have the processed data
          processedData = processedFinancialData;
          if (!processedData) {
            processedData = await processFinancialStatementsExcelData(selectedFile);
          }
        } else {
          throw new Error('Invalid data type');
        }
        
        // For financial statements, include the assumptions
        if (dataType === 'statements' && financialAssumptions) {
          onImportComplete(processedData, financialAssumptions);
        } else {
          onImportComplete(processedData);
        }
        setCurrentStep(dataType === 'statements' ? 3 : 3);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceed = () => {
    if (dataType === 'statements') {
      // 4-step flow for financial statements
      switch (currentStep) {
        case 0:
          return !!parsedData;
        case 1:
          return !!processedFinancialData;
        case 2:
          return !!financialAssumptions;
        default:
          return false;
      }
    } else {
      // Original flow for business data
      switch (currentStep) {
        case 0:
          return !!parsedData;
        case 1:
          return previewData.length > 0;
        case 2:
          return columnMappings.length > 0;
        default:
          return false;
      }
    }
  };

  const getStepContent = () => {
    if (dataType === 'statements') {
      // Simplified flow for financial statements
      switch (currentStep) {
        case 0:
          return (
            <HistoricalExcelUploadDialog
              onFileSelect={handleFileSelect}
              onUploadComplete={handleUploadComplete}
              acceptedFileTypes={['.xlsx', '.xls']}
              maxFileSize={5 * 1024 * 1024} // 5MB
            />
          );
        case 1:
          return processedFinancialData ? (
            <FinancialStatementsPreview
              data={processedFinancialData}
              fileName={selectedFile?.name || 'financial_statements.xlsx'}
            />
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Processing financial statements...</p>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  This may take a few moments. Check the browser console for detailed progress.
                </p>
                <button 
                  onClick={() => {
                    // Debug info available in console
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Debug Info
                </button>
              </div>
            </div>
          );
        case 2:
          return processedFinancialData ? (
            <FinancialStatementsAssumptions
              data={processedFinancialData}
              onAssumptionsChange={setFinancialAssumptions}
              initialAssumptions={financialAssumptions || undefined}
            />
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading assumptions...</p>
            </div>
          );
        case 3:
          return (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Financial Statements Imported!</h3>
              <p className="text-muted-foreground">
                Your financial statements have been successfully processed with your forecasting assumptions.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-teal-900 mb-2">Ready for Analysis</h4>
                <ul className="text-sm text-teal-800 space-y-1 text-left">
                  <li>• Historical data: {processedFinancialData?.incomeStatement.years?.length || 0} years</li>
                  <li>• Forecast years: {financialAssumptions?.forecastYears || 5}</li>
                  <li>• Revenue growth: {financialAssumptions?.revenueGrowthRate || 0}% ({financialAssumptions?.revenueCalculationMethod || 'auto'})</li>
                  <li>• Expense growth: {financialAssumptions?.expenseGrowthRate || 0}% ({financialAssumptions?.expenseCalculationMethod || 'auto'})</li>
                </ul>
              </div>
              <Button onClick={() => onCalculationComplete?.(previewData)}>
                Generate Financial Statements
              </Button>
            </div>
          );
        default:
          return null;
      }
    } else {
      // Original flow for business data
      switch (currentStep) {
        case 0:
          return (
            <HistoricalExcelUploadDialog
              onFileSelect={handleFileSelect}
              onUploadComplete={handleUploadComplete}
              acceptedFileTypes={['.xlsx', '.xls']}
              maxFileSize={5 * 1024 * 1024} // 5MB
            />
          );
        case 1:
          return (
            <HistoricalDataPreviewTable
              data={filteredPreviewData}
              onDataChange={handleDataChange}
              sheetNames={sheetNames}
              selectedSheet={selectedSheet}
              onSheetChange={setSelectedSheet}
            />
          );
        case 2:
          return (
            <HistoricalColumnMapper
              data={filteredPreviewData}
              onMappingChange={handleMappingChange}
              mappings={columnMappings}
            />
          );
        case 3:
          return (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Import Complete!</h3>
              <p className="text-muted-foreground">
                Your historical data has been successfully imported.
              </p>
              <Button onClick={() => onCalculationComplete?.(previewData)}>
                Continue to Analysis
              </Button>
            </div>
          );
        default:
          return null;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">
                Import Historical {dataType === 'business' ? 'Business Data' : 'Financial Statements'}
              </h2>
              <p className="text-muted-foreground">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-gray-300 bg-gray-100 text-gray-500'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-teal-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {getStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="border-teal-200 hover:bg-teal-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isProcessing}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isProcessing ? 'Processing...' : 'Complete Import'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalImportWizard; 