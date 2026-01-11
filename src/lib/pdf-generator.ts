import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, CurrencyCode } from './currency';

// AutoTable options interface
interface AutoTableOptions {
  head?: string[][];
  body?: (string | number)[][];
  startY?: number;
  theme?: 'striped' | 'grid' | 'plain';
  headStyles?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  columnStyles?: Record<number, Record<string, unknown>>;
  margin?: { left?: number; right?: number; top?: number; bottom?: number };
  tableWidth?: 'auto' | 'wrap' | number;
  alternateRowStyles?: Record<string, unknown>;
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

export interface ReportData {
  title: string;
  subtitle?: string;
  dateRange: { from: Date; to: Date };
  summary: {
    totalPayments: number;
    confirmedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
    contactsCount: number;
  };
  payments: Array<{
    date: string;
    contact: string;
    amount: number;
    method: string;
    status: string;
  }>;
  // New fields for comprehensive report
  paymentMethods?: Array<{
    name: string;
    percentage: number;
    amount: number;
  }>;
  topClients?: Array<{
    name: string;
    totalPaid: number;
    paymentCount: number;
    percentage: number;
  }>;
  monthlyData?: Array<{
    month: string;
    amount: number;
  }>;
  trendPercentage?: number;
  currency: CurrencyCode;
  generatedBy: string;
  businessName?: string;
}

export interface ContactReportData {
  contact: {
    name: string;
    phone: string;
    email?: string;
  };
  summary: {
    totalPaid: number;
    pendingAmount: number;
    paymentCount: number;
    reliabilityScore: number;
  };
  payments: Array<{
    date: string;
    amount: number;
    method: string;
    status: string;
  }>;
  currency: CurrencyCode;
  generatedBy: string;
}

// Colors
const EMERALD_500 = [16, 185, 129] as const;
const EMERALD_600 = [5, 150, 105] as const;
const SLATE_800 = [30, 41, 59] as const;
const SLATE_600 = [71, 85, 105] as const;
const SLATE_400 = [148, 163, 184] as const;
const YELLOW_500 = [234, 179, 8] as const;
const BLUE_500 = [59, 130, 246] as const;
const ORANGE_500 = [249, 115, 22] as const;
const RED_500 = [239, 68, 68] as const;

function addFooter(doc: jsPDF) {
  const pageCount = doc.internal.pages.length - 1;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generado por PayTrack - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

export function generatePaymentReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ============ PAGE 1: HEADER & SUMMARY ============

  // Header with logo text
  doc.setFontSize(28);
  doc.setTextColor(...EMERALD_500);
  doc.setFont('helvetica', 'bold');
  doc.text('PayTrack', margin, 22);

  doc.setFontSize(10);
  doc.setTextColor(...SLATE_400);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión de Pagos', margin, 30);

  if (data.businessName) {
    doc.setFontSize(11);
    doc.setTextColor(...SLATE_600);
    doc.text(data.businessName, margin, 38);
  }

  // Date and generator info on right
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_400);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Por: ${data.generatedBy}`, pageWidth - margin, 26, { align: 'right' });

  // Divider line
  doc.setDrawColor(...EMERALD_500);
  doc.setLineWidth(0.5);
  doc.line(margin, 45, pageWidth - margin, 45);

  // Report Title
  doc.setFontSize(20);
  doc.setTextColor(...SLATE_800);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, margin, 58);

  // Period
  doc.setFontSize(11);
  doc.setTextColor(...SLATE_600);
  doc.setFont('helvetica', 'normal');
  const periodText = `Período: ${data.dateRange.from.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} - ${data.dateRange.to.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  doc.text(periodText, margin, 66);

  // ============ SUMMARY SECTION ============
  let currentY = 80;

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(...SLATE_800);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 RESUMEN DEL PERÍODO', margin, currentY);
  currentY += 10;

  // Summary cards - 2x2 grid
  const cardWidth = (pageWidth - margin * 2 - 10) / 2;
  const cardHeight = 28;
  const cardGap = 10;

  const summaryCards = [
    {
      label: 'Ingresos Totales',
      value: formatCurrency(data.summary.confirmedAmount, data.currency),
      subtext: data.trendPercentage ? `+${data.trendPercentage.toFixed(1)}% vs mes anterior` : '',
      color: EMERALD_500
    },
    {
      label: 'Pagos Procesados',
      value: data.summary.totalPayments.toString(),
      subtext: 'Total de transacciones',
      color: BLUE_500
    },
    {
      label: 'Monto Pendiente',
      value: formatCurrency(data.summary.pendingAmount, data.currency),
      subtext: 'Por confirmar',
      color: YELLOW_500
    },
    {
      label: 'Contactos Activos',
      value: data.summary.contactsCount.toString(),
      subtext: 'Con pagos registrados',
      color: ORANGE_500
    },
  ];

  summaryCards.forEach((card, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = margin + col * (cardWidth + cardGap);
    const y = currentY + row * (cardHeight + 8);

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');

    // Left accent bar
    doc.setFillColor(...card.color);
    doc.rect(x, y, 3, cardHeight, 'F');

    // Card content
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_600);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + 10, y + 10);

    doc.setFontSize(16);
    doc.setTextColor(...SLATE_800);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 10, y + 20);

    if (card.subtext) {
      doc.setFontSize(7);
      doc.setTextColor(...card.color);
      doc.setFont('helvetica', 'normal');
      doc.text(card.subtext, x + 10, y + 26);
    }
  });

  currentY += cardHeight * 2 + 25;

  // ============ PAYMENT METHODS SECTION ============
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...SLATE_800);
    doc.setFont('helvetica', 'bold');
    doc.text('💳 DISTRIBUCIÓN POR MÉTODO DE PAGO', margin, currentY);
    currentY += 8;

    const methodColors: Record<string, readonly [number, number, number]> = {
      'Yape': [116, 34, 132],
      'Plin': [0, 200, 248],
      'Transfer': EMERALD_500,
      'Efectivo': [255, 176, 46],
      'Otro': SLATE_400,
    };

    data.paymentMethods.forEach((method, index) => {
      const y = currentY + index * 16;
      const barWidth = ((pageWidth - margin * 2 - 80) * method.percentage) / 100;
      const color = methodColors[method.name] || SLATE_400;

      // Method name
      doc.setFontSize(10);
      doc.setTextColor(...SLATE_800);
      doc.setFont('helvetica', 'normal');
      doc.text(method.name, margin, y + 5);

      // Progress bar background
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(margin + 45, y, pageWidth - margin * 2 - 80, 6, 2, 2, 'F');

      // Progress bar fill
      doc.setFillColor(...color);
      doc.roundedRect(margin + 45, y, Math.max(barWidth, 5), 6, 2, 2, 'F');

      // Percentage and amount
      doc.setFontSize(9);
      doc.setTextColor(...SLATE_600);
      doc.text(`${method.percentage}%`, pageWidth - margin - 30, y + 5);
      doc.setFontSize(8);
      doc.text(formatCurrency(method.amount, data.currency), pageWidth - margin, y + 5, { align: 'right' });
    });

    currentY += data.paymentMethods.length * 16 + 15;
  }

  // ============ TOP CLIENTS SECTION ============
  if (data.topClients && data.topClients.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(...SLATE_800);
    doc.setFont('helvetica', 'bold');
    doc.text('👥 TOP CLIENTES', margin, currentY);
    currentY += 5;

    doc.autoTable({
      startY: currentY,
      head: [['#', 'Cliente', 'Total Pagado', 'Pagos', '% del Total']],
      body: data.topClients.map((client, index) => [
        (index + 1).toString(),
        client.name,
        formatCurrency(client.totalPaid, data.currency),
        client.paymentCount.toString(),
        `${client.percentage}%`,
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: SLATE_600,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 15;
  }

  // ============ MONTHLY EVOLUTION (if data available) ============
  if (data.monthlyData && data.monthlyData.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(...SLATE_800);
    doc.setFont('helvetica', 'bold');
    doc.text('📈 EVOLUCIÓN MENSUAL', margin, currentY);
    currentY += 5;

    const monthsWithData = data.monthlyData.filter(m => m.amount > 0);
    if (monthsWithData.length > 0) {
      doc.autoTable({
        startY: currentY,
        head: [['Mes', 'Ingresos']],
        body: monthsWithData.map(m => [m.month, formatCurrency(m.amount, data.currency)]),
        theme: 'striped',
        headStyles: {
          fillColor: EMERALD_500,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50, halign: 'right' },
        },
      });
      currentY = (doc.lastAutoTable?.finalY || currentY) + 15;
    }
  }

  // ============ PAGE 2: PAYMENTS TABLE ============
  doc.addPage();

  // Section title
  doc.setFontSize(16);
  doc.setTextColor(...SLATE_800);
  doc.setFont('helvetica', 'bold');
  doc.text('📋 DETALLE DE PAGOS', margin, 20);

  doc.setFontSize(10);
  doc.setTextColor(...SLATE_600);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mostrando ${Math.min(data.payments.length, 50)} de ${data.payments.length} pagos`, margin, 28);

  // Payments table
  doc.autoTable({
    startY: 35,
    head: [['Fecha', 'Contacto', 'Monto', 'Método', 'Estado']],
    body: data.payments.slice(0, 50).map((p) => [
      p.date,
      p.contact.length > 25 ? p.contact.substring(0, 22) + '...' : p.contact,
      formatCurrency(p.amount, data.currency),
      p.method,
      p.status,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: EMERALD_500,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 30 },
      4: { cellWidth: 28 },
    },
    didParseCell: (data) => {
      // Color status column
      if (data.column.index === 4 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'Confirmado') {
          data.cell.styles.textColor = EMERALD_600;
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'Pendiente') {
          data.cell.styles.textColor = YELLOW_500;
        } else if (status === 'Rechazado') {
          data.cell.styles.textColor = RED_500;
        }
      }
    },
  });

  // Footer
  addFooter(doc);

  return doc;
}

export function generateContactReport(data: ContactReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...EMERALD_500);
  doc.text('PayTrack', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - 14, 20, { align: 'right' });

  // Contact Info
  doc.setFontSize(18);
  doc.setTextColor(...SLATE_800);
  doc.text(`Reporte de Contacto`, 14, 40);

  doc.setFontSize(14);
  doc.setTextColor(...SLATE_600);
  doc.text(data.contact.name, 14, 50);

  doc.setFontSize(10);
  doc.text(`Tel: ${data.contact.phone}`, 14, 58);
  if (data.contact.email) {
    doc.text(`Email: ${data.contact.email}`, 14, 64);
  }

  // Summary
  const summaryY = 80;
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text('Resumen', 14, summaryY);

  const summaryData = [
    ['Total Pagado', formatCurrency(data.summary.totalPaid, data.currency)],
    ['Pendiente', formatCurrency(data.summary.pendingAmount, data.currency)],
    ['Pagos Realizados', data.summary.paymentCount.toString()],
    ['Confiabilidad', `${data.summary.reliabilityScore}%`],
  ];

  doc.autoTable({
    startY: summaryY + 5,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right' },
    },
  });

  // Payments History
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text('Historial de Pagos', 14, 130);

  doc.autoTable({
    startY: 135,
    head: [['Fecha', 'Monto', 'Metodo', 'Estado']],
    body: data.payments.map((p) => [
      p.date,
      formatCurrency(p.amount, data.currency),
      p.method,
      p.status,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: EMERALD_500,
      textColor: [255, 255, 255],
    },
    styles: { fontSize: 9 },
  });

  addFooter(doc);

  return doc;
}

export function generateOverdueReport(
  overduePayments: Array<{
    contact: string;
    phone: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }>,
  currency: CurrencyCode,
  generatedBy: string
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...EMERALD_500);
  doc.text('PayTrack', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Por: ${generatedBy}`, pageWidth - 14, 26, { align: 'right' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(...RED_500);
  doc.text('Reporte de Pagos Vencidos', 14, 45);

  // Summary
  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text(`Total vencido: ${formatCurrency(totalOverdue, currency)}`, 14, 55);
  doc.text(`Cantidad de pagos: ${overduePayments.length}`, 14, 62);

  // Table
  doc.autoTable({
    startY: 75,
    head: [['Contacto', 'Teléfono', 'Monto', 'Vencimiento', 'Días']],
    body: overduePayments.map((p) => [
      p.contact,
      p.phone,
      formatCurrency(p.amount, currency),
      p.dueDate,
      p.daysOverdue.toString(),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: RED_500,
      textColor: [255, 255, 255],
    },
    styles: { fontSize: 9 },
    columnStyles: {
      4: { halign: 'center' },
    },
  });

  addFooter(doc);

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(`${filename}.pdf`);
}
