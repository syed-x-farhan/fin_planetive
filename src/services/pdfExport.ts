import { CalculationResult } from './api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF Export Configuration
export interface PDFExportConfig {
  title: string;
  subtitle?: string;
  companyName?: string;
  date: Date;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

export class PDFExportService {
  private config: PDFExportConfig;

  constructor(config: PDFExportConfig) {
    this.config = config;
  }

  /**
   * Generate a simple financial report PDF
   */
  async generateFinancialReport(calculationResult: CalculationResult): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: this.config.orientation,
      unit: 'mm',
      format: this.config.pageSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    // Add header
    currentY = this.addHeader(pdf, currentY, pageWidth, margin);
    
    // Add basic content
    currentY = this.addBasicContent(pdf, calculationResult, currentY, pageWidth, margin);
    
    return pdf.output('blob');
  }

  /**
   * Generate PDF from dashboard tabs as images
   */
  async generateDashboardTabsPDF(tabElements: { tabId: string; element: HTMLElement; title: string }[]): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: this.config.orientation,
      unit: 'mm',
      format: this.config.pageSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    // Add header
    currentY = this.addHeader(pdf, currentY, pageWidth, margin);

    // Add each tab as an image
    for (let i = 0; i < tabElements.length; i++) {
      const { element, title } = tabElements[i];
      
      try {
        // Convert element to canvas
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // Add title
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, currentY);
        currentY += 10;

        // Add image
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 20;

        // Add new page if needed
        if (i < tabElements.length - 1 && currentY > pageHeight - 50) {
          pdf.addPage();
          currentY = margin;
        }
      } catch (error) {
        console.error(`Failed to convert tab ${title} to image:`, error);
        // Add error message
        pdf.setTextColor(255, 0, 0);
        pdf.setFontSize(12);
        pdf.text(`Failed to export ${title}`, margin, currentY);
        currentY += 10;
      }
    }

    return pdf.output('blob');
  }

  /**
   * Add header with logo and title
   */
  private addHeader(pdf: jsPDF, currentY: number, pageWidth: number, margin: number): number {
    // Lighter teal background
    pdf.setFillColor(72, 187, 120);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Add logo image on the left side
    try {
      const logoWidth = 30;
      const logoHeight = 30;
      const logoX = margin;
      const logoY = 5; // Center vertically in the header
      
      // Use the actual planetive logo
      const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADI...'; // (full string from user)
      pdf.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      
    } catch (error) {
      console.warn('Could not load logo image:', error);
      // Fallback to text if image fails
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PLANETIVE', margin, 20);
    }
    
    // Center text content
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.config.title, pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.config.subtitle || 'Financial Analysis Report', pageWidth / 2, 30, { align: 'center' });
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.text(`Generated on ${this.config.date.toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
    
    return 50;
  }

  /**
   * Add basic content to the PDF
   */
  private addBasicContent(pdf: jsPDF, calculationResult: CalculationResult, currentY: number, pageWidth: number, margin: number): number {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Summary', margin, currentY);
    currentY += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    // Add basic information
    if (calculationResult.income_statement) {
      pdf.text('Income Statement Data Available', margin, currentY);
      currentY += 10;
    }
    
    if (calculationResult.balance_sheet) {
      pdf.text('Balance Sheet Data Available', margin, currentY);
      currentY += 10;
    }
    
    if (calculationResult.cash_flow) {
      pdf.text('Cash Flow Data Available', margin, currentY);
      currentY += 10;
    }

    // Add note about detailed data
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('For detailed financial analysis, please refer to the dashboard.', margin, currentY);
    
    return currentY + 20;
  }

  /**
   * Format currency values
   */
  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  }

  /**
   * Format percentage values
   */
  private formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}

/**
 * Factory function to create PDF export service
 */
export function createPDFExportService(config: Partial<PDFExportConfig> = {}): PDFExportService {
  const defaultConfig: PDFExportConfig = {
    title: 'Financial Analysis Report',
    date: new Date(),
    pageSize: 'A4',
    orientation: 'portrait',
    ...config
  };

  return new PDFExportService(defaultConfig);
}

/**
 * Export dashboard to PDF
 */
export async function exportDashboardToPDF(
  calculationResult: CalculationResult,
  modelName: string
): Promise<Blob> {
  const pdfService = createPDFExportService({
    title: `${modelName} Financial Report`,
    subtitle: 'Comprehensive Financial Analysis and Projections',
    companyName: 'Financial Modeling Suite',
    date: new Date(),
    pageSize: 'A4',
    orientation: 'portrait'
  });

  return await pdfService.generateFinancialReport(calculationResult);
}

/**
 * Export dashboard tabs as images to PDF
 * Each tab will be on a separate page
 */
export async function exportDashboardTabsToPDF(
  tabElements: { tabId: string; element: HTMLElement; title: string }[],
  modelName: string
): Promise<Blob> {
  const pdfService = createPDFExportService({
    title: `${modelName} Dashboard Report`,
    subtitle: 'Dashboard Tabs Export',
    companyName: 'Financial Modeling Suite',
    date: new Date(),
    pageSize: 'A4',
    orientation: 'landscape'
  });

  return await pdfService.generateDashboardTabsPDF(tabElements);
} 