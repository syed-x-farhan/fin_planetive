import React, { createContext, useContext, useState, useEffect } from 'react';
import { CalculationResult } from '@/services/api';

interface CalculationResultContextType {
  calculationResult: CalculationResult | null;
  setCalculationResult: (result: CalculationResult | null) => void;
  businessName: string;
  setBusinessName: (name: string) => void;
  businessDescription: string;
  setBusinessDescription: (desc: string) => void;
  // Historical data support
  historicalCalculationResult: CalculationResult | null;
  setHistoricalCalculationResult: (result: CalculationResult | null) => void;
}

const CalculationResultContext = createContext<CalculationResultContextType | undefined>(undefined);

export const CalculationResultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [businessDescription, setBusinessDescription] = useState<string>('');
  // Historical data state
  const [historicalCalculationResult, setHistoricalCalculationResult] = useState<CalculationResult | null>(null);

  // Auto-sync historical calculation result to localStorage for persistence
  useEffect(() => {
    if (historicalCalculationResult) {
      try {
        localStorage.setItem('historical_calculation_result', JSON.stringify(historicalCalculationResult));
      } catch (error) {
        console.error('Failed to save historical calculation result to localStorage:', error);
      }
    }
  }, [historicalCalculationResult]);

  // Load historical calculation result from localStorage on mount (if context is empty)
  useEffect(() => {
    if (!historicalCalculationResult) {
      try {
        const stored = localStorage.getItem('historical_calculation_result');
        if (stored) {
          const parsed = JSON.parse(stored);
          setHistoricalCalculationResult(parsed);
        }
      } catch (error) {
        console.error('Failed to load historical calculation result from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('historical_calculation_result');
      }
    }
  }, []);

  return (
    <CalculationResultContext.Provider value={{ 
      calculationResult, 
      setCalculationResult, 
      businessName, 
      setBusinessName, 
      businessDescription, 
      setBusinessDescription,
      historicalCalculationResult,
      setHistoricalCalculationResult
    }}>
      {children}
    </CalculationResultContext.Provider>
  );
};

export const useCalculationResult = () => {
  const context = useContext(CalculationResultContext);
  if (!context) {
    throw new Error('useCalculationResult must be used within a CalculationResultProvider');
  }
  return context;
}; 