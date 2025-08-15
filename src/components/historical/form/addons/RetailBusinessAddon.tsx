import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface RetailBusinessAddonProps {
  retailBusinessModel: {
    storeCount: number;
    averageStoreSize: number;
    inventoryTurnover: number;
    grossMargin: number;
    storeUtilization: number;
    customerTraffic: number;
    averageTransactionValue: number;
    seasonalVariation: number;
    onlineSalesPercentage: number;
    supplyChainEfficiency: number;
    storeLocationQuality: number;
    competitiveAdvantage: string;
  };
  onRetailBusinessModelChange: (data: any) => void;
}

export const RetailBusinessAddon: React.FC<RetailBusinessAddonProps> = ({
  retailBusinessModel,
  onRetailBusinessModelChange
}) => {
  const handleChange = (field: string, value: any) => {
    onRetailBusinessModelChange({
      ...retailBusinessModel,
      [field]: value
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          🛍️ Retail Business Model
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure retail-specific parameters for accurate financial modeling
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Store Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="storeCount" className="text-sm font-medium text-gray-900">
              Number of Stores
            </Label>
            <Input
              id="storeCount"
              type="number"
              min="1"
              value={retailBusinessModel.storeCount}
              onChange={(e) => handleChange('storeCount', parseInt(e.target.value) || 0)}
              placeholder="e.g., 5"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Total number of retail locations
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="averageStoreSize" className="text-sm font-medium text-gray-900">
              Average Store Size (sq ft)
            </Label>
            <Input
              id="averageStoreSize"
              type="number"
              min="100"
              value={retailBusinessModel.averageStoreSize}
              onChange={(e) => handleChange('averageStoreSize', parseInt(e.target.value) || 0)}
              placeholder="e.g., 2000"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Average square footage per store
            </p>
          </div>
        </div>

        {/* Inventory & Margins */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inventoryTurnover" className="text-sm font-medium text-gray-900">
              Inventory Turnover Rate
            </Label>
            <Input
              id="inventoryTurnover"
              type="number"
              min="0"
              step="0.1"
              value={retailBusinessModel.inventoryTurnover}
              onChange={(e) => handleChange('inventoryTurnover', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 4.5"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How many times inventory is sold per year
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grossMargin" className="text-sm font-medium text-gray-900">
              Gross Margin (%)
            </Label>
            <Input
              id="grossMargin"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={retailBusinessModel.grossMargin}
              onChange={(e) => handleChange('grossMargin', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 35.0"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Gross profit margin percentage
            </p>
          </div>
        </div>

        {/* Store Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="storeUtilization" className="text-sm font-medium text-gray-900">
              Store Utilization (%)
            </Label>
            <Input
              id="storeUtilization"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={retailBusinessModel.storeUtilization}
              onChange={(e) => handleChange('storeUtilization', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 75.0"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How efficiently store space is utilized
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerTraffic" className="text-sm font-medium text-gray-900">
              Daily Customer Traffic
            </Label>
            <Input
              id="customerTraffic"
              type="number"
              min="0"
              value={retailBusinessModel.customerTraffic}
              onChange={(e) => handleChange('customerTraffic', parseInt(e.target.value) || 0)}
              placeholder="e.g., 150"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Average daily customers per store
            </p>
          </div>
        </div>

        {/* Sales Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="averageTransactionValue" className="text-sm font-medium text-gray-900">
              Average Transaction Value ($)
            </Label>
            <Input
              id="averageTransactionValue"
              type="number"
              min="0"
              step="0.01"
              value={retailBusinessModel.averageTransactionValue}
              onChange={(e) => handleChange('averageTransactionValue', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 45.50"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Average sale amount per customer
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seasonalVariation" className="text-sm font-medium text-gray-900">
              Seasonal Variation (%)
            </Label>
            <Input
              id="seasonalVariation"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={retailBusinessModel.seasonalVariation}
              onChange={(e) => handleChange('seasonalVariation', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 25.0"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Peak vs. off-peak season variation
            </p>
          </div>
        </div>

        {/* Digital & Supply Chain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="onlineSalesPercentage" className="text-sm font-medium text-gray-900">
              Online Sales (%)
            </Label>
            <Input
              id="onlineSalesPercentage"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={retailBusinessModel.onlineSalesPercentage}
              onChange={(e) => handleChange('onlineSalesPercentage', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 15.0"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Percentage of sales from online channels
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplyChainEfficiency" className="text-sm font-medium text-gray-900">
              Supply Chain Efficiency (1-10)
            </Label>
            <Input
              id="supplyChainEfficiency"
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={retailBusinessModel.supplyChainEfficiency}
              onChange={(e) => handleChange('supplyChainEfficiency', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 7.5"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Efficiency rating of supply chain operations
            </p>
          </div>
        </div>

        {/* Location & Competitive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="storeLocationQuality" className="text-sm font-medium text-gray-900">
              Store Location Quality (1-10)
            </Label>
            <Input
              id="storeLocationQuality"
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={retailBusinessModel.storeLocationQuality}
              onChange={(e) => handleChange('storeLocationQuality', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 8.0"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Quality rating of store locations
            </p>
          </div>
        </div>

        {/* Competitive Advantage */}
        <div className="space-y-2">
          <Label htmlFor="competitiveAdvantage" className="text-sm font-medium text-gray-900">
            Competitive Advantages
          </Label>
          <Textarea
            id="competitiveAdvantage"
            value={retailBusinessModel.competitiveAdvantage}
            onChange={(e) => handleChange('competitiveAdvantage', e.target.value)}
            placeholder="Describe your key competitive advantages (e.g., exclusive products, superior customer service, strategic locations, strong brand recognition)"
            className="w-full min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Key factors that give you an edge over competitors
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RetailBusinessAddon;
