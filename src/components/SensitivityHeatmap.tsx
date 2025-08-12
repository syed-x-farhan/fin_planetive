import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function getColor(value: number, min: number, max: number) {
  // Modern color scale: red (low) to green (high)
  if (max === min) return '#dc2626'; // red
  const percent = (value - min) / (max - min);
  // Interpolate from red (#dc2626) to green (#16a34a)
  const r = Math.round(220 + (22 - 220) * percent);
  const g = Math.round(38 + (163 - 38) * percent);
  const b = Math.round(38 + (74 - 38) * percent);
  return `rgb(${r},${g},${b})`;
}

export default function SensitivityHeatmap({ data, balanceSheetData }: { data: any, balanceSheetData?: any }) {
  const [showEquityValue, setShowEquityValue] = useState(false);
  const [transformedData, setTransformedData] = useState<any>(null);

  // Calculate net debt from balance sheet data
  const calculateNetDebt = () => {
    if (!balanceSheetData || !Array.isArray(balanceSheetData) || balanceSheetData.length === 0) {
      return 0;
    }
    
    const bs = balanceSheetData[0];
    if (!bs || typeof bs !== 'object') return 0;
    
    const assets = bs.assets || {};
    const liabilities = bs.liabilities || {};
    const cash = assets.cash || 0;
    const longTermDebt = liabilities.long_term_debt || 0;
    
    return longTermDebt - cash;
  };

  // Transform data to show equity value instead of enterprise value
  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      setTransformedData(null);
      return;
    }

    if (!showEquityValue) {
      setTransformedData(data);
      return;
    }

    const netDebt = calculateNetDebt();
    const transformed = data.map((row: any) => ({
      ...row,
      values: row.values.map((cell: any) => ({
        ...cell,
        dcf: cell.dcf - netDebt
      }))
    }));

    setTransformedData(transformed);
  }, [data, showEquityValue, balanceSheetData]);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Card className="w-full h-56 flex items-center justify-center bg-muted border border-dashed border-border text-muted-foreground">
        <CardContent>No sensitivity data</CardContent>
      </Card>
    );
  }

  const displayData = transformedData || data;
  
  // Extract axis values
  const waccs = displayData.map((row: any) => row.wacc);
  const growths = displayData[0].values.map((v: any) => v.growth);
  
  // Flatten all DCF values for color scale
  const allDcfs = displayData.flatMap((row: any) => row.values.map((v: any) => v.dcf));
  const minDcf = Math.min(...allDcfs);
  const maxDcf = Math.max(...allDcfs);

  const valueType = showEquityValue ? 'Equity Value' : 'Enterprise Value';
  const netDebt = calculateNetDebt();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Sensitivity Analysis Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="border-separate w-full text-sm" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="p-3 bg-background border-b border-r text-center align-middle"></th>
                {growths.map((g: number) => (
                  <th key={g} className="p-4 bg-background font-bold text-foreground border-b border-r text-center align-middle">{(g * 100).toFixed(1)}%</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row: any, rowIdx: number) => (
                <tr key={row.wacc} className="text-center align-middle">
                  <td className="p-4 bg-background font-bold text-foreground border-r border-b text-center align-middle w-32 h-16">{(row.wacc * 100).toFixed(1)}%</td>
                  {row.values.map((cell: any, idx: number) => (
                    <td
                      key={idx}
                      className="border-b border-r text-center align-middle font-bold text-lg w-32 h-16 transition duration-150 hover:ring-2 hover:ring-primary cursor-pointer shadow-sm"
                      style={{ background: getColor(cell.dcf, minDcf, maxDcf), color: '#fff', letterSpacing: 0.5 }}
                      title={`${valueType}: $${cell.dcf.toLocaleString(undefined, {maximumFractionDigits:0})}`}
                    >
                      {`$${cell.dcf.toLocaleString(undefined, {maximumFractionDigits:0})}`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground mt-4 flex flex-wrap gap-4 items-center border-t pt-3">
            <span><span className="font-semibold">X:</span> <span className="text-foreground">Terminal Growth Rate</span></span>
            <span><span className="font-semibold">Y:</span> <span className="text-foreground">WACC</span></span>
            <span><span className="font-semibold">Cell:</span> <span className="text-foreground">{valueType}</span></span>
            
            {/* Toggle Switch */}
            <div className="flex items-center space-x-2 ml-auto">
              <Label htmlFor="value-toggle" className="text-xs">Enterprise Value</Label>
              <Switch
                id="value-toggle"
                checked={showEquityValue}
                onCheckedChange={setShowEquityValue}
                className="scale-75"
              />
              <Label htmlFor="value-toggle" className="text-xs">Equity Value</Label>
            </div>
            
            {/* Color Scale */}
            <span className="ml-4">
              <span className="inline-block w-4 h-4 rounded-full mr-1" style={{background:'#dc2626'}}></span>
              Low &rarr; 
              <span className="inline-block w-4 h-4 rounded-full mx-1" style={{background:'#16a34a'}}></span>
              High
            </span>
          </div>
          
          {/* Net Debt Info */}
          {showEquityValue && (
            <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
              <span className="font-semibold">Note:</span> Equity Value = Enterprise Value - Net Debt (${netDebt.toLocaleString()})
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
