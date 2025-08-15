// Utility to map backend calculation data to chart sections for the dashboard

export type ChartSection = 'current' | 'forecast';

export interface ChartPeriod {
  date: string;
  revenue: number;
  ebitda: number;
  cashFlow: number;
  section: ChartSection;
}

/**
 * Given backend calculation results, returns an array of periods with section labels,
 * and the list of sections present (in order).
 * Only returns 'current' and 'forecast' sections (no historical).
 * The first year is 'current', the rest are 'forecast'.
 */
export function mapPeriodsToSections({ income_statement, cash_flow }: any): {
  data: ChartPeriod[];
  sections: ChartSection[];
} {
  if (!income_statement || !income_statement.years || !income_statement.line_items) {
    return { data: [], sections: [] };
  }
  const years: string[] = income_statement.years;
  const getItem = (label: string) => income_statement.line_items.find((li: any) => li.label.toLowerCase() === label.toLowerCase());
  const revenueItem = getItem('Revenue');
  const ebitdaItem = getItem('EBITDA');

  // Extract FCF from cash_flow data - this is the correct source
  let cashFlowArr: number[] = [];
  if (Array.isArray(cash_flow)) {
    cashFlowArr = cash_flow.map((period: any) => period.net_change_in_cash ?? 0);
  }

  // For yearly data, first year is 'current', rest are 'forecast'
  // For quarterly/monthly data, first 4 quarters or 12 months are 'current'
  let currentPeriods = 1; // Default to 1 year
  if (years.length > 1) {
    const first = years[0];
    // Check for backend's yearly format like "FY2025-January" (this is yearly, not monthly!)
    if (/^FY\d{4}-(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(first)) {
      currentPeriods = 1; // This is yearly data, so only first year is current
    } else if (/Q[1-4]/.test(first)) {
      currentPeriods = 4; // First 4 quarters = 1 year
    } else if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(first)) {
      currentPeriods = 12; // First 12 months = 1 year (for actual monthly data)
    }
    // For yearly data (like "2024", "2025"), currentPeriods stays 1
  }

  // Assign section for each period
  const data: ChartPeriod[] = years.map((date, idx) => {
    let section: ChartSection = 'forecast';
    if (idx < currentPeriods) {
      section = 'current';
    }
    return {
      date: date.split('-')[0], // Extract only FY2027 from FY2027-January
      revenue: revenueItem?.values?.[idx] ?? 0,
      ebitda: ebitdaItem?.values?.[idx] ?? 0,
      cashFlow: cashFlowArr[idx] ?? 0, // Use cash_flow data directly
      section,
    };
  });

  const sections: ChartSection[] = [];
  if (data.some(d => d.section === 'current')) sections.push('current');
  if (data.some(d => d.section === 'forecast')) sections.push('forecast');

  return { data, sections };
}
