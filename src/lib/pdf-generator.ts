import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, CurrencyCode } from './currency';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
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
const SLATE_800 = [30, 41, 59] as const;
const SLATE_600 = [71, 85, 105] as const;

export function generatePaymentReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...EMERALD_500);
  doc.text('PayTrack', 14, 20);

  if (data.businessName) {
    doc.setFontSize(12);
    doc.setTextColor(...SLATE_600);
    doc.text(data.businessName, 14, 28);
  }

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Por: ${data.generatedBy}`, pageWidth - 14, 26, { align: 'right' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(...SLATE_800);
  doc.text(data.title, 14, 45);

  if (data.subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(...SLATE_600);
    doc.text(data.subtitle, 14, 52);
  }

  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateRangeText = `Periodo: ${data.dateRange.from.toLocaleDateString('es-PE')} - ${data.dateRange.to.toLocaleDateString('es-PE')}`;
  doc.text(dateRangeText, 14, data.subtitle ? 60 : 52);

  // Summary Cards
  const summaryY = data.subtitle ? 70 : 62;
  const cardWidth = (pageWidth - 28 - 15) / 4;
  const cardHeight = 25;

  const summaryCards = [
    { label: 'Total Pagos', value: data.summary.totalPayments.toString(), color: EMERALD_500 },
    { label: 'Confirmado', value: formatCurrency(data.summary.confirmedAmount, data.currency), color: [34, 197, 94] as const },
    { label: 'Pendiente', value: formatCurrency(data.summary.pendingAmount, data.currency), color: [234, 179, 8] as const },
    { label: 'Contactos', value: data.summary.contactsCount.toString(), color: [59, 130, 246] as const },
  ];

  summaryCards.forEach((card, index) => {
    const x = 14 + index * (cardWidth + 5);

    // Card background
    doc.setFillColor(...card.color);
    doc.roundedRect(x, summaryY, cardWidth, cardHeight, 3, 3, 'F');

    // Card content
    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.text(card.label, x + cardWidth / 2, summaryY + 8, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardWidth / 2, summaryY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Payments Table
  const tableStartY = summaryY + cardHeight + 15;

  doc.autoTable({
    startY: tableStartY,
    head: [['Fecha', 'Contacto', 'Monto', 'Metodo', 'Estado']],
    body: data.payments.map((p) => [
      p.date,
      p.contact,
      formatCurrency(p.amount, data.currency),
      p.method,
      p.status,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: EMERALD_500,
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
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
      textColor: 255,
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
  doc.setTextColor(220, 38, 38); // Red for overdue
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
    head: [['Contacto', 'Telefono', 'Monto', 'Vencio', 'Dias vencido']],
    body: overduePayments.map((p) => [
      p.contact,
      p.phone,
      formatCurrency(p.amount, currency),
      p.dueDate,
      p.daysOverdue.toString(),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: 255,
    },
    styles: { fontSize: 9 },
    columnStyles: {
      4: {
        fontStyle: 'bold',
        textColor: [220, 38, 38],
      },
    },
  });

  addFooter(doc);

  return doc;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Pagina ${i} de ${pageCount} - Generado por PayTrack`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}.pdf`);
}

export function printPDF(doc: jsPDF) {
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}
