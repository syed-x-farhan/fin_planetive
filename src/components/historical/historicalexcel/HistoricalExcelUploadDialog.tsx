import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HistoricalExcelUploadDialogProps {
  onFileSelect: (file: File) => void;
  onUploadComplete: (data: any, file?: File) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

interface ParsedExcelData {
  sheets: string[];
  rowCount: number;
  fileName: string;
  data?: any[];
  columns?: string[];
  sheetData?: { [sheetName: string]: any[] }; // Add sheet-specific data
}

export const HistoricalExcelUploadDialog: React.FC<HistoricalExcelUploadDialogProps> = ({
  onFileSelect,
  onUploadComplete,
  acceptedFileTypes = ['.xlsx', '.xls'],
  maxFileSize = 5 * 1024 * 1024 // 5MB
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setError(null);
    
    // Validate file type
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!acceptedFileTypes.includes(fileExtension)) {
      setError(`Invalid file type. Please upload a ${acceptedFileTypes.join(' or ')} file.`);
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
    processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Import XLSX dynamically to avoid SSR issues
      const XLSX = await import('xlsx');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get actual sheet names from the workbook
          const sheetNames = workbook.SheetNames;
          
          // Parse all sheets and store sheet-specific data
          const sheetData: { [sheetName: string]: any[] } = {};
          let firstSheetData: any[] = [];
          let firstSheetColumns: string[] = [];
          
          sheetNames.forEach((sheetName, sheetIndex) => {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Skip header rows (first 8-10 rows contain instructions)
            const dataRows = jsonData.slice(10).filter((row: any) => 
              row.length > 0 && row.some((cell: any) => cell !== '')
            );
            
            // Get column headers from the first data row (after skipping instruction rows)
            const headerRow = jsonData[8]; // 9th row (0-indexed) should be headers
            const columns = headerRow || [];
            
            // Store sheet-specific data
            sheetData[sheetName] = dataRows;
            
            // Store first sheet data for initial preview
            if (sheetIndex === 0) {
              firstSheetData = dataRows.slice(0, 10); // First 10 rows for preview
              firstSheetColumns = columns;
            }
          });
          
          const parsedData: ParsedExcelData = {
            sheets: sheetNames,
            rowCount: firstSheetData.length,
            fileName: file.name,
            data: firstSheetData, // Data from first sheet for initial preview
            columns: firstSheetColumns,
            sheetData: sheetData // All sheet data for switching
          };
          
          onUploadComplete(parsedData, file);
        } catch (parseError) {
          setError('Failed to parse Excel file. Please check the file format.');
          console.error('Excel parsing error:', parseError);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Failed to process file. Please try again.');
      console.error('File processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-teal-500 bg-teal-50' 
            : 'border-gray-300 hover:border-teal-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-teal-100">
              <FileSpreadsheet className="h-8 w-8 text-teal-600" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Upload Historical Data</h3>
            <p className="text-muted-foreground">
              Drag and drop your Excel file here, or click to browse
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isProcessing}
              className="border-teal-200 hover:bg-teal-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <input
              id="file-input"
              type="file"
              accept={acceptedFileTypes.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Supported formats: {acceptedFileTypes.join(', ')}</p>
            <p>Maximum size: {formatFileSize(maxFileSize)}</p>
          </div>
        </div>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <Card className="border-teal-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                    <span className="text-sm text-muted-foreground">Processing...</span>
                  </div>
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Instructions</CardTitle>
          <CardDescription>
            Follow these steps to prepare your historical data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div>
              <p className="font-medium">Download the template</p>
              <p className="text-sm text-muted-foreground">
                Use our template to ensure your data is formatted correctly
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div>
              <p className="font-medium">Fill in your data</p>
              <p className="text-sm text-muted-foreground">
                Enter your historical financial data in the template
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div>
              <p className="font-medium">Upload your file</p>
              <p className="text-sm text-muted-foreground">
                Save as Excel format and upload here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricalExcelUploadDialog; 