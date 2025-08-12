import { BarChart3 } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="h-16 w-full border-b border-teal-200 flex items-center justify-between bg-teal-50 px-6">
      {/* Company image on the left */}
      <img 
        src="/planetive.png" 
        alt="Planetive" 
        className="h-19 w-auto"
      />
      
      {/* Original logo and text in the center */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-sidebar-foreground">Planetive</h2>
          <p className="text-xs text-sidebar-foreground/60 font-medium">Pro Dashboard</p>
        </div>
      </div>
      
      {/* Empty div for balance */}
      <div className="w-19 h-19"></div>
    </header>
  );
}