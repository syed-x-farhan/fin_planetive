import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const HISTORICAL_COMPANY_TYPES = [
  {
    id: 'service',
    title: 'Service Business',
    description: 'Established service companies with historical financial data for comprehensive financial modeling and analysis.',
    icon: '🏢'
  }
];

interface HistoricalCompanyTypeSelectorProps {
  selectedType: string | null;
  onSelect: (type: string) => void;
}

export const HistoricalCompanyTypeSelector: React.FC<HistoricalCompanyTypeSelectorProps> = ({ selectedType, onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-6">Historical Data Analysis</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Analyze your established service business with comprehensive historical financial data modeling.
        </p>
      </div>
      
      <div className="flex justify-center">
        {HISTORICAL_COMPANY_TYPES.map((type) => (
                      <Card
              key={type.id}
              className={cn(
                'w-96 cursor-pointer border-2 transition-all duration-200 hover:scale-105',
                selectedType === type.id 
                  ? 'border-teal-600 shadow-lg bg-teal-50' 
                  : 'border-border hover:border-teal-300 hover:bg-teal-50/50'
              )}
              onClick={() => onSelect(type.id)}
            >
              <CardContent className="p-12 flex flex-col items-center text-center">
                <div className="text-6xl mb-8">{type.icon}</div>
                <div className="text-3xl font-semibold mb-6">{type.title}</div>
                <div className="text-lg text-muted-foreground leading-relaxed">{type.description}</div>
              </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoricalCompanyTypeSelector; 