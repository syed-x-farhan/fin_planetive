import React from 'react';
import { BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full h-16 bg-teal-50 border-b border-teal-200 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Company image on the left - intermediate size */}
        <img 
          src="/planetive.png" 
          alt="Planetive" 
          className="h-12.5 w-auto"
        />
        
        {/* Original logo and text in the center */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Financial Modelling Suite</h1>
        </div>
        
        {/* Company image on the right - same size as left */}
        <img 
          src="/planetive.png" 
          alt="Planetive" 
          className="h-12.5 w-auto"
        />
      </div>
    </header>
  );
}
