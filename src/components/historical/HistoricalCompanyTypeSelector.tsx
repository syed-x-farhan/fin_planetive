import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const HISTORICAL_COMPANY_TYPES = [
  {
    id: 'service',
    title: 'Service Business',
    description: 'Established service companies with historical financial data for comprehensive financial modeling and analysis.',
    icon: '🏢'
  },
  {
    id: 'retail',
    title: 'Retail Business',
    description: 'Established retail companies with historical financial data for comprehensive financial modeling and analysis.',
    icon: '🛍️'
  }
];

interface HistoricalCompanyTypeSelectorProps {
  selectedType: string | null;
  onSelect: (type: string) => void;
  onBack?: () => void;
}

export const HistoricalCompanyTypeSelector: React.FC<HistoricalCompanyTypeSelectorProps> = ({ selectedType, onSelect, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 relative">
      {/* Main Title and Description */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-6">Historical Data Analysis</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Analyze your established service business with comprehensive historical financial data modeling.
        </p>
      </div>
      
      {/* Back Button */}
      {onBack && (
        <div className="flex justify-start w-full mb-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questionnaire
          </Button>
        </div>
      )}
      
      <div className="flex gap-8 justify-center">
        {HISTORICAL_COMPANY_TYPES.map((type) => (
          <Card
            key={type.id}
            className={cn(
              'w-80 cursor-pointer border-2 transition-all duration-200 hover:scale-105',
              selectedType === type.id 
                ? 'border-teal-600 shadow-lg bg-teal-50' 
                : 'border-border hover:border-teal-300 hover:bg-teal-50/50'
            )}
            onClick={() => onSelect(type.id)}
          >
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="text-4xl mb-6">{type.icon}</div>
              <div className="text-2xl font-semibold mb-4">{type.title}</div>
              <div className="text-base text-muted-foreground leading-relaxed">{type.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoricalCompanyTypeSelector; 