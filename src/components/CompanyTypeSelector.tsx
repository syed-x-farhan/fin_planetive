import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMPANY_TYPES = [
  {
    id: 'service',
    title: 'Service',
    description: 'Businesses providing services to clients.',
    icon: '🏢'
  },
  {
    id: 'saas',
    title: 'SaaS',
    description: 'Software-as-a-Service or subscription-based businesses.',
    icon: '💻'
  },
  {
    id: 'retail',
    title: 'Retail',
    description: 'Businesses selling physical products.',
    icon: '🛍️'
  }
];

interface CompanyTypeSelectorProps {
  selectedType: string | null;
  onSelect: (type: string) => void;
  onBack?: () => void;
}

export const CompanyTypeSelector: React.FC<CompanyTypeSelectorProps> = ({ selectedType, onSelect, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      {/* Main Title and Description */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-6">Venture Financial Modeling</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Build comprehensive financial projections for your startup or growing business with integrated financial statements and DCF valuation.
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
        {COMPANY_TYPES.map((type) => (
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

export default CompanyTypeSelector; 