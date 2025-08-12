import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface HistoricalService {
  name: string;
  historicalRevenue: string;
  historicalClients: string;
  cost: string;
}

interface HistoricalServiceYearData {
  year: string;
  services: HistoricalService[];
}

interface ServiceBusinessModel {
  serviceDeliveryModel: 'hourly' | 'project' | 'retainer' | 'subscription';
  pricingStrategy: 'fixed' | 'variable' | 'tiered';
  clientRetentionRate: string;
  
  // Service Operational Metrics
  utilizationRate: string;
  teamSize: string;
  teamGrowthRate: string;
  averageProjectDuration: string;
  clientAcquisitionCost: string;
  customerLifetimeValue: string;
  recurringRevenuePercent: string;
  churnRate: string;
  expansionRevenuePercent: string;
  seasonalityFactor: string;
}

interface ServiceBusinessAddonProps {
  historicalServices: HistoricalServiceYearData[];
  services: HistoricalService[];
  serviceBusinessModel: ServiceBusinessModel;
  onHistoricalServicesChange: (data: HistoricalServiceYearData[]) => void;
  onServicesChange: (data: HistoricalService[]) => void;
  onServiceBusinessModelChange: (data: ServiceBusinessModel) => void;
  yearsInBusiness: string;
}

const ServiceBusinessAddon: React.FC<ServiceBusinessAddonProps> = ({
  historicalServices,
  services,
  serviceBusinessModel,
  onHistoricalServicesChange,
  onServicesChange,
  onServiceBusinessModelChange,
  yearsInBusiness
}) => {
  // Handlers for current year services
  const handleServiceChange = (idx: number, field: keyof HistoricalService, value: string) => {
    const newServices = services.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onServicesChange(newServices);
  };

  const addService = () => {
    const newServices = [...services, { name: '', historicalRevenue: '', historicalClients: '', cost: '' }];
    onServicesChange(newServices);
  };

  const removeService = (idx: number) => {
    const newServices = services.filter((_, i) => i !== idx);
    onServicesChange(newServices);
  };

  // Handlers for historical services
  const handleHistoricalServiceChange = (yearIdx: number, serviceIdx: number, field: keyof HistoricalService, value: string) => {
    const newHistoricalServices = historicalServices.map((yearData, i) => 
      i === yearIdx 
        ? { 
            ...yearData, 
            services: yearData.services.map((service, j) => 
              j === serviceIdx ? { ...service, [field]: value } : service
            )
          }
        : yearData
    );
    onHistoricalServicesChange(newHistoricalServices);
  };

  const addHistoricalService = (yearIdx: number) => {
    const newHistoricalServices = historicalServices.map((yearData, i) => 
      i === yearIdx 
        ? { 
            ...yearData, 
            services: [...yearData.services, { name: '', historicalRevenue: '', historicalClients: '', cost: '' }]
          }
        : yearData
    );
    onHistoricalServicesChange(newHistoricalServices);
  };

  const removeHistoricalService = (yearIdx: number, serviceIdx: number) => {
    const newHistoricalServices = historicalServices.map((yearData, i) => 
      i === yearIdx 
        ? { 
            ...yearData, 
            services: yearData.services.filter((_, j) => j !== serviceIdx)
          }
        : yearData
    );
    onHistoricalServicesChange(newHistoricalServices);
  };

  return (
    <>
      {/* Historical Services by Year Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Historical Services by Year</CardTitle>
          <CardDescription>Enter your services data for each year</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {historicalServices.map((yearData, yearIdx) => (
            <Card key={yearIdx} className="p-4 border-2 border-teal-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Year {yearData.year}</h4>
                <Button type="button" onClick={() => addHistoricalService(yearIdx)} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
              <div className="space-y-4">
                {yearData.services.map((service, serviceIdx) => (
                  <Card key={serviceIdx} className="p-4 border border-teal-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>Service/Product Name</Label>
                        <Input
                          value={service.name}
                          onChange={(e) => handleHistoricalServiceChange(yearIdx, serviceIdx, 'name', e.target.value)}
                          placeholder="e.g., Consulting Services"
                        />
                      </div>
                      <div>
                        <Label>Revenue</Label>
                        <Input
                          type="number"
                          value={service.historicalRevenue}
                          onChange={(e) => handleHistoricalServiceChange(yearIdx, serviceIdx, 'historicalRevenue', e.target.value)}
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <Label>Number of Clients/Customers</Label>
                        <Input
                          type="number"
                          value={service.historicalClients}
                          onChange={(e) => handleHistoricalServiceChange(yearIdx, serviceIdx, 'historicalClients', e.target.value)}
                          placeholder="25"
                        />
                      </div>

                      <div>
                        <Label>Cost per Client/Unit</Label>
                        <Input
                          type="number"
                          value={service.cost}
                          onChange={(e) => handleHistoricalServiceChange(yearIdx, serviceIdx, 'cost', e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                    </div>
                    {yearData.services.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeHistoricalService(yearIdx, serviceIdx)}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>



      {/* Service Business Model Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Service Business Model</CardTitle>
          <CardDescription>Define your service delivery and pricing strategy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Service Delivery Model</Label>
              <Select
                value={serviceBusinessModel.serviceDeliveryModel}
                onValueChange={(value) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  serviceDeliveryModel: value as 'hourly' | 'project' | 'retainer' | 'subscription'
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly Billing</SelectItem>
                  <SelectItem value="project">Project-Based</SelectItem>
                  <SelectItem value="retainer">Retainer</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pricing Strategy</Label>
              <Select
                value={serviceBusinessModel.pricingStrategy}
                onValueChange={(value) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  pricingStrategy: value as 'fixed' | 'variable' | 'tiered'
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Pricing</SelectItem>
                  <SelectItem value="variable">Variable Pricing</SelectItem>
                  <SelectItem value="tiered">Tiered Pricing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Client Retention Rate (%)</Label>
              <Input
                type="number"
                value={serviceBusinessModel.clientRetentionRate}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  clientRetentionRate: e.target.value
                })}
                placeholder="85"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Service Model Impact</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Hourly:</strong> Variable revenue, time-based billing</li>
              <li>• <strong>Project:</strong> Fixed revenue per project, milestone-based</li>
              <li>• <strong>Retainer:</strong> Predictable monthly revenue</li>
              <li>• <strong>Subscription:</strong> Recurring revenue with churn risk</li>
              <li>• <strong>Retention Rate:</strong> Critical for growth projections</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Service Operational Metrics Card */}
      <Card className="shadow-lg border-teal-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Service Operational Metrics</CardTitle>
          <CardDescription>Key operational metrics for service business modeling (all fields are optional - leave blank if you don't track these metrics)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center gap-2">
                Utilization Rate (%)
                <span className="text-xs text-muted-foreground cursor-help" title="Percentage of time your team spends on billable work vs non-billable activities. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.utilizationRate}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  utilizationRate: e.target.value
                })}
                placeholder="75"
              />
              <p className="text-xs text-muted-foreground mt-1">Billable hours vs total hours. Leave blank if you don't track this.</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Team Size (Current)
                <span className="text-xs text-muted-foreground cursor-help" title="Number of employees currently working in your service business. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.teamSize}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  teamSize: e.target.value
                })}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if you don't track this.</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Team Growth Rate (%)
                <span className="text-xs text-muted-foreground cursor-help" title="How fast you plan to grow your team size each year. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.teamGrowthRate}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  teamGrowthRate: e.target.value
                })}
                placeholder="20"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if you don't track this.</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Average Project Duration (Days)
                <span className="text-xs text-muted-foreground cursor-help" title="Typical number of days it takes to complete a service project. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.averageProjectDuration}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  averageProjectDuration: e.target.value
                })}
                placeholder="90"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if you don't track this.</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Client Acquisition Cost (CAC)
                <span className="text-xs text-muted-foreground cursor-help" title="Total cost to acquire a new customer, including marketing, sales, and onboarding expenses. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.clientAcquisitionCost}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  clientAcquisitionCost: e.target.value
                })}
                placeholder="5000"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if you don't track this metric</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Customer Lifetime Value (CLV)
                <span className="text-xs text-muted-foreground cursor-help" title="Total revenue you expect to earn from a customer over their entire relationship with your business. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.customerLifetimeValue}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  customerLifetimeValue: e.target.value
                })}
                placeholder="25000"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if you don't track this metric</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Recurring Revenue %
                <span className="text-xs text-muted-foreground cursor-help" title="Percentage of your revenue that comes from repeat customers or ongoing contracts. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.recurringRevenuePercent}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  recurringRevenuePercent: e.target.value
                })}
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if you don't track this metric</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Annual Churn Rate (%)
                <span className="text-xs text-muted-foreground cursor-help" title="Percentage of customers who stop using your services each year. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.churnRate}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  churnRate: e.target.value
                })}
                placeholder="15"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank if you don't track this metric</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Expansion Revenue %
                <span className="text-xs text-muted-foreground cursor-help" title="Percentage of revenue growth that comes from selling more services to existing customers. Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.expansionRevenuePercent}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  expansionRevenuePercent: e.target.value
                })}
                placeholder="25"
              />
              <p className="text-xs text-muted-foreground mt-1">Upselling to existing clients. Leave blank if you don't track this.</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Seasonality Factor (%)
                <span className="text-xs text-muted-foreground cursor-help" title="How much your revenue varies throughout the year (e.g., busy seasons vs slow periods). Leave blank if you don't track this.">
                  ℹ️
                </span>
              </Label>
              <Input
                type="number"
                value={serviceBusinessModel.seasonalityFactor}
                onChange={(e) => onServiceBusinessModelChange({
                  ...serviceBusinessModel,
                  seasonalityFactor: e.target.value
                })}
                placeholder="20"
              />
              <p className="text-xs text-muted-foreground mt-1">Revenue variation throughout year. Leave blank if you don't track this.</p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Operational Metrics Impact</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Utilization Rate:</strong> Drives billable revenue capacity</li>
              <li>• <strong>Team Size:</strong> Determines maximum revenue potential</li>
              <li>• <strong>CAC/CLV:</strong> Marketing efficiency and client profitability</li>
              <li>• <strong>Recurring Revenue:</strong> Predictable cash flow and valuation</li>
              <li>• <strong>Churn Rate:</strong> Client retention and growth sustainability</li>
              <li>• <strong>Seasonality:</strong> Revenue patterns throughout the year</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ServiceBusinessAddon; 