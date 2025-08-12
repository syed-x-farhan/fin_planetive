import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Upload, FileText, Calculator } from 'lucide-react';
import { downloadHistoricalBusinessDataTemplate, downloadHistoricalFinancialStatementsTemplate } from '@/components/historical/historicalexcel';

interface DataImportQuestionnaireProps {
  onComplete: (dataType: 'business' | 'statements', importMethod: 'upload' | 'template' | 'manual') => void;
}

const DataImportQuestionnaire: React.FC<DataImportQuestionnaireProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedDataType, setSelectedDataType] = useState<'business' | 'statements' | null>(null);
  const [selectedImportMethod, setSelectedImportMethod] = useState<'upload' | 'template' | 'manual' | null>(null);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);

  const handleDataTypeSelect = (dataType: 'business' | 'statements') => {
    setSelectedDataType(dataType);
    setStep(2);
  };

  const handleImportMethodSelect = (method: 'upload' | 'template' | 'manual') => {
    setSelectedImportMethod(method);
    
    // Handle template download for business data
    if (method === 'template' && selectedDataType === 'business') {
      downloadHistoricalBusinessDataTemplate('service');
      setTemplateDownloaded(true);
      // Don't call onComplete - stay on questionnaire screen
      return;
    }
    
    // Handle template download for financial statements
    if (method === 'template' && selectedDataType === 'statements') {
      downloadHistoricalFinancialStatementsTemplate('service');
      setTemplateDownloaded(true);
      // Don't call onComplete - stay on questionnaire screen
      return;
    }
    
    if (selectedDataType) {
      onComplete(selectedDataType, method);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedImportMethod(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Import Historical Data</CardTitle>
          <CardDescription>
            Let's get your historical data into the system for accurate financial modeling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">What type of historical data do you have?</h3>
                <p className="text-muted-foreground">Choose the format that best describes your data</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDataType === 'business' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleDataTypeSelect('business')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <Calculator className="h-12 w-12 mx-auto text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Business Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Services, expenses, loans, and operational metrics
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>• Service revenue and clients</p>
                      <p>• Expense categories</p>
                      <p>• Loan information</p>
                      <p>• Operational metrics</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDataType === 'statements' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleDataTypeSelect('statements')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <FileText className="h-12 w-12 mx-auto text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Financial Statements</h4>
                    <p className="text-sm text-muted-foreground">
                      Income statement, balance sheet, and cash flow
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>• Income statement data</p>
                      <p>• Balance sheet items</p>
                      <p>• Cash flow information</p>
                      <p>• Financial ratios</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <Button variant="ghost" onClick={goBack} className="mb-4">
                  ← Back
                </Button>
                <h3 className="text-lg font-semibold mb-2">
                  How would you like to provide your {selectedDataType === 'business' ? 'business' : 'financial statement'} data?
                </h3>
                                 <p className="text-muted-foreground">
                   Choose the method that works best for you
                   {selectedDataType === 'business' && (
                     <span className="block text-xs mt-1 text-blue-600">
                       💡 Manual entry is available for business data
                     </span>
                   )}
                 </p>
              </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card 
                   className={`cursor-pointer transition-all hover:shadow-md ${
                     selectedImportMethod === 'upload' ? 'ring-2 ring-primary' : ''
                   }`}
                   onClick={() => handleImportMethodSelect('upload')}
                 >
                   <CardContent className="p-6 text-center">
                     <div className="mb-4">
                       <Upload className="h-12 w-12 mx-auto text-primary" />
                     </div>
                     <h4 className="font-semibold mb-2">Upload Existing File</h4>
                     <p className="text-sm text-muted-foreground">
                       Upload your Excel or CSV file
                     </p>
                     <div className="mt-4 text-xs text-muted-foreground">
                       <p>• Excel (.xlsx, .xls)</p>
                       <p>• CSV files</p>
                       <p>• Quick import</p>
                       <p>• Auto-detect format</p>
                     </div>
                   </CardContent>
                 </Card>

                 <Card 
                   className={`cursor-pointer transition-all hover:shadow-md ${
                     selectedImportMethod === 'template' ? 'ring-2 ring-primary' : ''
                   }`}
                   onClick={() => handleImportMethodSelect('template')}
                 >
                   <CardContent className="p-6 text-center">
                     <div className="mb-4">
                       <FileText className="h-12 w-12 mx-auto text-primary" />
                     </div>
                     <h4 className="font-semibold mb-2">Download Template</h4>
                     <p className="text-sm text-muted-foreground">
                       Get our formatted template
                     </p>
                       {templateDownloaded && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                          ✅ Template downloaded successfully! Fill it with your data, then use "Upload Existing File" to import it.
                        </div>
                      )}
                    <div className="mt-4 text-xs text-muted-foreground">
                        <p>• Pre-formatted template</p>
                        <p>• Fill in your data</p>
                        <p>• Upload when ready</p>
                        <p>• Guaranteed compatibility</p>
                      </div>

                   </CardContent>
                 </Card>

                 {selectedDataType === 'business' && (
                   <Card 
                     className={`cursor-pointer transition-all hover:shadow-md ${
                       selectedImportMethod === 'manual' ? 'ring-2 ring-primary' : ''
                     }`}
                     onClick={() => handleImportMethodSelect('manual')}
                   >
                     <CardContent className="p-6 text-center">
                       <div className="mb-4">
                         <Calculator className="h-12 w-12 mx-auto text-primary" />
                       </div>
                       <h4 className="font-semibold mb-2">Manual Entry</h4>
                       <p className="text-sm text-muted-foreground">
                         Enter your data directly in our form
                       </p>
                       <div className="mt-4 text-xs text-muted-foreground">
                         <p>• Step-by-step form</p>
                         <p>• Guided data entry</p>
                         <p>• Real-time validation</p>
                         <p>• No file preparation needed</p>
                       </div>
                     </CardContent>
                   </Card>
                 )}
               </div>
            </>
          )}

          <div className="flex justify-center pt-4">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImportQuestionnaire; 