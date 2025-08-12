import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, TrendingUp } from 'lucide-react';
import { BaseHistoricalDataForm, HistoricalCompanyTypeSelector, DataImportQuestionnaire } from '@/components/historical';
import { HistoricalImportWizard } from '@/components/historical/historicalexcel';
import { ProcessedHistoricalData, convertToFormState } from '@/components/historical/historicalexcel';
import { ProcessedFinancialStatementsData, convertFinancialStatementsToFormState } from '@/components/historical/historicalexcel/FinancialStatementsProcessor';
import { CalculationResult, api } from '@/services/api';
import { useCalculationResult } from '@/contexts/CalculationResultContext';

const HistoricalModel: React.FC = () => {
  const navigate = useNavigate();
  const { historicalCalculationResult, setHistoricalCalculationResult } = useCalculationResult();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanyType, setSelectedCompanyType] = useState<string | null>(null);
  const [showCompanyTypeSelector, setShowCompanyTypeSelector] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [importData, setImportData] = useState<{
    dataType: 'business' | 'statements';
    importMethod: 'upload' | 'template' | 'manual';
  } | null>(null);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [importedFormData, setImportedFormData] = useState<any>(null);

  const handleFinancialStatementsSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('=== FINANCIAL STATEMENTS SUBMISSION ===');
      console.log('Financial statements data being sent:', data);
      console.log('Data keys:', Object.keys(data));
      
      const result = await api.processFinancialStatements(data);
      
      console.log('=== FINANCIAL STATEMENTS API RESPONSE ===');
      console.log('API response:', result);
      console.log('Response success:', result.success);
      console.log('Response data keys:', result.data ? Object.keys(result.data) : 'No data');
      
      if (result.success && result.data) {
        // Store in context (primary)
        setHistoricalCalculationResult(result.data);
        
        // Store in localStorage (backup/persistence)
        console.log('Storing financial statements result:', result.data);
        const dataToStore = JSON.stringify(result.data);
        console.log('Stringified data length:', dataToStore.length);
        localStorage.setItem('historical_calculation_result', dataToStore);
        console.log('Data stored successfully in localStorage');
        
        // Navigate directly to statements page
        navigate('/historical/statements');
      } else {
        console.error('Financial statements processing failed:', result.error);
        alert('Financial statements processing failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error during financial statements processing:', error);
      alert('Error during financial statements processing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('=== HISTORICAL FORM SUBMISSION ===');
      console.log('Form data being sent:', data);
      console.log('Form data keys:', Object.keys(data));
      
      const result = await api.calculateHistoricalModel(data);
      
      console.log('=== API RESPONSE ===');
      console.log('API response:', result);
      console.log('Response success:', result.success);
      console.log('Response data keys:', result.data ? Object.keys(result.data) : 'No data');
      
      if (result.success && result.data) {
          // Store in context (primary) - extract the actual calculation data
          // The backend sends: { success: true, data: { dashboard_kpis: {...}, ... }, error: null, message: "..." }
          // So we need result.data.data to get the actual calculation data
          const calculationData = (result.data as any).data || result.data;
          console.log('Extracted calculation data keys:', Object.keys(calculationData));
          console.log('Has dashboard_kpis in calculation data?', 'dashboard_kpis' in calculationData);
          console.log('Calculation data dashboard_kpis:', calculationData.dashboard_kpis);
          setHistoricalCalculationResult(calculationData);
          
          // Store in localStorage (backup/persistence)
          console.log('Storing calculation result:', calculationData);
          const dataToStore = JSON.stringify(calculationData);
          console.log('Stringified data length:', dataToStore.length);
          localStorage.setItem('historical_calculation_result', dataToStore);
          console.log('Data stored successfully in localStorage');
          
          // Verify storage
          const stored = localStorage.getItem('historical_calculation_result');
          console.log('Verification - stored data length:', stored ? stored.length : 'null');
          
          // Navigate directly to statements page
          navigate('/historical/statements');
        } else {
          console.error('Calculation failed:', result.error);
          alert('Calculation failed: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
      console.error('Error during calculation:', error);
      alert('Error during calculation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyTypeSelect = (companyType: string) => {
    setSelectedCompanyType(companyType);
    setShowCompanyTypeSelector(false);
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireComplete = (dataType: 'business' | 'statements', importMethod: 'upload' | 'template' | 'manual') => {
    setImportData({ dataType, importMethod });
    setShowQuestionnaire(false);
    
    // Handle Excel import for business data
    if (dataType === 'business' && importMethod === 'upload') {
      setShowExcelImport(true);
      return;
    }
    
    // Handle Excel import for financial statements
    if (dataType === 'statements' && importMethod === 'upload') {
      setShowExcelImport(true);
      return;
    }
    
    // For manual entry or template download, show the form
    console.log('Questionnaire completed:', { dataType, importMethod });
  };



  const handleBackToCompanyType = () => {
    setShowQuestionnaire(false);
    setImportData(null);
    setShowCompanyTypeSelector(true);
  };

  const handleExcelImportComplete = (processedData: ProcessedHistoricalData | ProcessedFinancialStatementsData, assumptions?: any) => {
    setShowExcelImport(false);
    
    // Convert processed data to form state based on data type
    let formData;
    if (importData?.dataType === 'business') {
      formData = convertToFormState(processedData as ProcessedHistoricalData);
    } else if (importData?.dataType === 'statements') {
      // For financial statements, use the new dedicated API
      console.log('=== FINANCIAL STATEMENTS PROCESSING ===');
      console.log('Processed data:', processedData);
      console.log('Assumptions:', assumptions);
      
      // Prepare data for financial statements API
      const financialStatementsData = {
        _originalData: processedData,
        ...assumptions // Include all assumptions
      };
      
      console.log('Sending to financial statements API:', financialStatementsData);
      
      // Call the dedicated financial statements API
      handleFinancialStatementsSubmit(financialStatementsData);
      return;
    } else {
      console.error('Unknown data type for import');
      return;
    }
    
    setImportedFormData(formData);
    console.log('Excel import completed:', formData);
  };

  const handleExcelImportCancel = () => {
    setShowExcelImport(false);
    // Don't go back to questionnaire, stay on form
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SidebarProvider>
        <div className="flex-1 flex w-full pt-16">
          <AppSidebar 
            selectedModel="historical"
            onModelSelect={(modelId) => navigate(`/model/${modelId}`)}
          />
          <SidebarInset className="flex-1">
            <div className="container mx-auto p-6 max-w-7xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  {!showCompanyTypeSelector && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={showQuestionnaire ? handleBackToCompanyType : () => navigate('/')}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {showQuestionnaire ? 'Back to Company Type' : 'Back to Models'}
                    </Button>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold">Historical Data Model</h1>
                  </div>
                </div>
                

              </div>

              {/* Content */}
              {showCompanyTypeSelector ? (
                <HistoricalCompanyTypeSelector
                  selectedType={selectedCompanyType}
                  onSelect={handleCompanyTypeSelect}
                />
              ) : showQuestionnaire ? (
                <DataImportQuestionnaire
                  onComplete={handleQuestionnaireComplete}
                />
              ) : (
                <>
                  <BaseHistoricalDataForm 
                    onSubmit={handleFormSubmit}
                    isLoading={isLoading}
                    companyType={selectedCompanyType || 'service'}
                    initialData={importedFormData}
                  />
                  {showExcelImport && importData && (
                    <HistoricalImportWizard
                      onImportComplete={handleExcelImportComplete}
                      onCancel={handleExcelImportCancel}
                      modelId="historical"
                      dataType={importData.dataType}
                      importMethod={importData.importMethod}
                    />
                  )}
                </>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default HistoricalModel; 