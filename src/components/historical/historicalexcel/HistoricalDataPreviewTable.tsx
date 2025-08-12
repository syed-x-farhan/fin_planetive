import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Trash2, Plus, Save, X } from 'lucide-react';

export interface RowData {
  id: string;
  [key: string]: any;
}

export interface ColumnMapping {
  excelColumn: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
}

interface HistoricalDataPreviewTableProps {
  data: RowData[];
  onDataChange: (data: RowData[]) => void;
  sheetNames: string[];
  selectedSheet: string;
  onSheetChange: (sheet: string) => void;
}

export const HistoricalDataPreviewTable: React.FC<HistoricalDataPreviewTableProps> = ({
  data,
  onDataChange,
  sheetNames,
  selectedSheet,
  onSheetChange
}) => {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<RowData | null>(null);
  const [showAllRows, setShowAllRows] = useState(false);

  // Generate mock data for preview
  useEffect(() => {
    if (data.length === 0) {
      const mockData: RowData[] = Array.from({ length: 10 }, (_, index) => ({
        id: `row-${index + 1}`,
        year: `202${4 - index}`,
        revenue: Math.floor(Math.random() * 1000000) + 100000,
        expenses: Math.floor(Math.random() * 800000) + 80000,
        profit: Math.floor(Math.random() * 200000) + 20000,
        customers: Math.floor(Math.random() * 1000) + 100,
        services: ['Consulting', 'Development', 'Support'][Math.floor(Math.random() * 3)],
        growth_rate: `${Math.floor(Math.random() * 30) + 5}%`
      }));
      onDataChange(mockData);
    }
  }, [data.length, onDataChange]);

  const columns = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'id') : [];
  const displayData = showAllRows ? data : data.slice(0, 5);

  const handleEditRow = (row: RowData) => {
    setEditingRow(row.id);
    setEditingData({ ...row });
  };

  const handleSaveRow = () => {
    if (editingData) {
      const updatedData = data.map(row => 
        row.id === editingData.id ? editingData : row
      );
      onDataChange(updatedData);
      setEditingRow(null);
      setEditingData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditingData(null);
  };

  const handleDeleteRow = (rowId: string) => {
    const updatedData = data.filter(row => row.id !== rowId);
    onDataChange(updatedData);
  };

  const handleAddRow = () => {
    const newRow: RowData = {
      id: `row-${Date.now()}`,
      year: '',
      revenue: 0,
      expenses: 0,
      profit: 0,
      customers: 0,
      services: '',
      growth_rate: '0%'
    };
    onDataChange([...data, newRow]);
  };

  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-';
    
    if (column.includes('revenue') || column.includes('expenses') || column.includes('profit')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    if (column.includes('rate') || column.includes('percentage')) {
      return typeof value === 'string' ? value : `${value}%`;
    }
    
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Sheet Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium">Select Sheet:</label>
          <Select value={selectedSheet} onValueChange={onSheetChange}>
            <SelectTrigger className="w-48 border-teal-200">
              <SelectValue placeholder="Select a sheet" />
            </SelectTrigger>
            <SelectContent>
              {sheetNames.map((sheet) => (
                <SelectItem key={sheet} value={sheet}>
                  {sheet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllRows(!showAllRows)}
            className="border-teal-200 hover:bg-teal-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showAllRows ? 'Show First 5' : 'Show All'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="border-teal-200 hover:bg-teal-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>
      </div>

      {/* Data Summary */}
      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Data Summary</CardTitle>
          <CardDescription>
            Overview of your historical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{data.length}</p>
              <p className="text-sm text-muted-foreground">Total Rows</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{columns.length}</p>
              <p className="text-sm text-muted-foreground">Columns</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{selectedSheet}</p>
              <p className="text-sm text-muted-foreground">Active Sheet</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{sheetNames.length}</p>
              <p className="text-sm text-muted-foreground">Total Sheets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Data Preview</CardTitle>
          <CardDescription>
            Review and edit your historical data. Click the edit icon to modify values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="font-semibold">
                      {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableHead>
                  ))}
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((column) => (
                      <TableCell key={column}>
                        {editingRow === row.id ? (
                          <Input
                            value={editingData?.[column] || ''}
                            onChange={(e) => setEditingData(prev => 
                              prev ? { ...prev, [column]: e.target.value } : null
                            )}
                            className="w-full"
                          />
                        ) : (
                          <span className={column.includes('revenue') || column.includes('expenses') || column.includes('profit') ? 'font-mono' : ''}>
                            {formatValue(row[column], column)}
                          </span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {editingRow === row.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveRow}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRow(row)}
                              className="h-8 w-8 p-0 text-teal-600 hover:text-teal-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRow(row.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {!showAllRows && data.length > 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing first 5 rows of {data.length} total rows
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricalDataPreviewTable; 