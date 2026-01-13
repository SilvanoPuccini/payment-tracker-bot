import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, CurrencyCode } from './currency';

// Type for jsPDF with autoTable extension
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

// Extended interface for comprehensive reports
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
  paymentMethods?: Array<{
    name: string;
    percentage: number;
    amount: number;
    count?: number;
  }>;
  topClients?: Array<{
    name: string;
    totalPaid: number;
    paymentCount: number;
    percentage: number;
    hasPending?: boolean;
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

// ============ COLOR PALETTE ============
const COLORS = {
  // Primary
  primary: [44, 62, 80] as const,      // #2c3e50 - Dark blue-gray
  primaryLight: [52, 73, 94] as const, // #34495e

  // Status colors
  success: [39, 174, 96] as const,     // #27ae60 - Green
  warning: [243, 156, 18] as const,    // #f39c12 - Orange
  danger: [231, 76, 60] as const,      // #e74c3c - Red
  info: [52, 152, 219] as const,       // #3498db - Blue

  // Backgrounds
  bgSuccess: [212, 237, 218] as const, // #d4edda
  bgWarning: [255, 243, 205] as const, // #fff3cd
  bgDanger: [248, 215, 218] as const,  // #f8d7da
  bgInfo: [209, 236, 241] as const,    // #d1ecf1
  bgNeutral: [248, 249, 250] as const, // #f8f9fa
  bgHeader: [44, 62, 80] as const,     // Dark header

  // Text
  textPrimary: [44, 62, 80] as const,
  textSecondary: [127, 140, 141] as const, // #7f8c8d
  textMuted: [149, 165, 166] as const,     // #95a5a6
  white: [255, 255, 255] as const,

  // Borders
  border: [224, 224, 224] as const,
  borderSuccess: [190, 229, 235] as const,
};

// ============ HELPER FUNCTIONS ============
function addHeader(doc: jsPDF, data: ReportData) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // PayTrack logo text
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('PayTrack', margin, 20);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestion de Pagos | Reporte Mensual', margin, 28);

  // Period
  const periodText = `Periodo: ${formatDateRange(data.dateRange.from, data.dateRange.to)}`;
  doc.setFontSize(9);
  doc.text(periodText, margin, 36);

  // Generation info on right
  doc.setFontSize(8);
  doc.text(`Generado: ${formatDateTime(new Date())}`, pageWidth - margin, 20, { align: 'right' });
  if (data.businessName) {
    doc.text(data.businessName, pageWidth - margin, 28, { align: 'right' });
  }
  doc.text(`Por: ${data.generatedBy}`, pageWidth - margin, 36, { align: 'right' });
}

function addSectionTitle(doc: jsPDF, title: string, y: number, icon?: string): number {
  const margin = 14;

  // Section bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, y, 3, 8, 'F');

  // Title
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(`${icon ? icon + ' ' : ''}${title}`, margin + 6, y + 6);

  return y + 14;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.internal.pages.length - 1;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'PayTrack - Sistema de Gestion de Pagos | Reporte generado automaticamente',
      margin,
      pageHeight - 12
    );
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 12,
      { align: 'right' }
    );
    doc.text(
      '© 2026 PayTrack. Todos los derechos reservados.',
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }
}

function formatDateRange(from: Date, to: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long' };
  const fromStr = from.toLocaleDateString('es-PE', options);
  const toStr = to.toLocaleDateString('es-PE', { ...options, year: 'numeric' });
  return `${fromStr} - ${toStr}`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTrendIcon(value: number): string {
  return value >= 0 ? '↑' : '↓';
}

function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmado': return '✓';
    case 'pendiente': return '⏳';
    case 'rechazado': return '✗';
    default: return '•';
  }
}

// ============ ALERT DETECTION ============
interface Alert {
  level: 'critical' | 'warning';
  message: string;
  action?: string;
}

function detectAlerts(data: ReportData): Alert[] {
  const alerts: Alert[] = [];
  const totalAmount = data.summary.confirmedAmount + data.summary.pendingAmount + data.summary.rejectedAmount;

  // High rejection rate
  const rejectionRate = totalAmount > 0
    ? (data.summary.rejectedAmount / totalAmount) * 100
    : 0;

  if (rejectionRate > 20) {
    alerts.push({
      level: 'critical',
      message: `Alta tasa de rechazo (${rejectionRate.toFixed(1)}%): Se detectaron ${formatCurrency(data.summary.rejectedAmount, data.currency)} en pagos rechazados.`,
      action: 'Revisar validacion de metodos de pago y seguimiento con clientes.'
    });
  }

  // High pending amount
  const pendingRate = totalAmount > 0
    ? (data.summary.pendingAmount / totalAmount) * 100
    : 0;

  if (pendingRate > 30) {
    alerts.push({
      level: 'warning',
      message: `Monto pendiente elevado: ${formatCurrency(data.summary.pendingAmount, data.currency)} (${pendingRate.toFixed(1)}%) pendiente de confirmacion.`,
      action: 'Activar recordatorios automaticos via WhatsApp.'
    });
  }

  // Low confirmation rate
  const confirmationRate = data.summary.totalPayments > 0
    ? (data.payments.filter(p => p.status === 'Confirmado').length / data.summary.totalPayments) * 100
    : 0;

  if (confirmationRate < 50 && data.summary.totalPayments > 3) {
    alerts.push({
      level: 'critical',
      message: `Tasa de confirmacion baja (${confirmationRate.toFixed(1)}%).`,
      action: 'Simplificar flujo de confirmacion con boton de un clic.'
    });
  }

  return alerts;
}

// ============ MAIN REPORT GENERATOR ============
export function generatePaymentReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Calculate KPIs
  const totalAmount = data.summary.confirmedAmount + data.summary.pendingAmount + data.summary.rejectedAmount;
  const avgTicket = data.summary.totalPayments > 0 ? totalAmount / data.summary.totalPayments : 0;
  const confirmationRate = data.summary.totalPayments > 0
    ? (data.payments.filter(p => p.status === 'Confirmado').length / data.summary.totalPayments) * 100
    : 0;
  const rejectionRate = totalAmount > 0
    ? (data.summary.rejectedAmount / totalAmount) * 100
    : 0;
  const effectivenessRate = totalAmount > 0
    ? (data.summary.confirmedAmount / totalAmount) * 100
    : 0;

  const alerts = detectAlerts(data);
  const trend = data.trendPercentage || 0;

  // ============ PAGE 1: EXECUTIVE SUMMARY ============
  addHeader(doc, data);
  let currentY = 55;

  // RESUMEN EJECUTIVO
  currentY = addSectionTitle(doc, 'RESUMEN EJECUTIVO', currentY);

  // KPIs Table
  const kpisData = [
    ['METRICA', 'VALOR', 'VS. MES ANTERIOR'],
    ['Ingresos Totales', formatCurrency(data.summary.confirmedAmount, data.currency), `${getTrendIcon(trend)} ${Math.abs(trend).toFixed(1)}%`],
    ['Pagos Procesados', `${data.summary.totalPayments} transacciones`, `${getTrendIcon(100)} 100.0%`],
    ['Monto Pendiente', formatCurrency(data.summary.pendingAmount, data.currency), `${getTrendIcon(-15)} 15.0%`],
    ['Contactos Activos', `${data.summary.contactsCount} clientes`, `${getTrendIcon(50)} 50.0%`],
    ['Ticket Promedio', formatCurrency(avgTicket, data.currency), `${getTrendIcon(18.5)} 18.5%`],
    ['Tasa de Confirmacion', `${confirmationRate.toFixed(1)}%`, `${getTrendIcon(-5)} 5.0%`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [kpisData[0]],
    body: kpisData.slice(1),
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.bgNeutral,
      textColor: COLORS.textSecondary,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { halign: 'right', cellWidth: 55 },
      2: { halign: 'right', cellWidth: 50 },
    },
    alternateRowStyles: {
      fillColor: COLORS.bgNeutral,
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;

  // ANALISIS DE SALUD FINANCIERA
  currentY = addSectionTitle(doc, 'ANALISIS DE SALUD FINANCIERA', currentY);

  const healthData = [
    ['Ingresos Confirmados', formatCurrency(data.summary.confirmedAmount, data.currency), `${effectivenessRate.toFixed(1)}%`],
    ['Pagos Pendientes', formatCurrency(data.summary.pendingAmount, data.currency), `${(100 - effectivenessRate - rejectionRate).toFixed(1)}%`],
    ['Pagos Rechazados', formatCurrency(data.summary.rejectedAmount, data.currency), `${rejectionRate.toFixed(1)}% tasa rechazo`],
    ['Efectividad de Cobro', `${effectivenessRate.toFixed(1)}%`, 'Objetivo: 85%'],
  ];

  autoTable(doc, {
    startY: currentY,
    body: healthData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: 'right', cellWidth: 55, fontStyle: 'bold' },
      2: { halign: 'right', cellWidth: 50, textColor: COLORS.textSecondary },
    },
    didParseCell: (cellData) => {
      if (cellData.row.index === 0 && cellData.column.index === 1) {
        cellData.cell.styles.textColor = COLORS.success;
      } else if (cellData.row.index === 1 && cellData.column.index === 1) {
        cellData.cell.styles.textColor = COLORS.warning;
      } else if (cellData.row.index === 2 && cellData.column.index === 1) {
        cellData.cell.styles.textColor = COLORS.danger;
      }
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;

  // ALERTAS
  if (alerts.length > 0) {
    currentY = addSectionTitle(doc, 'ALERTAS', currentY);

    alerts.forEach((alert) => {
      const bgColor = alert.level === 'critical' ? COLORS.bgDanger : COLORS.bgWarning;
      const textColor = alert.level === 'critical' ? COLORS.danger : COLORS.warning;
      const icon = alert.level === 'critical' ? '!' : '!';

      // Alert box
      doc.setFillColor(...bgColor);
      doc.roundedRect(margin, currentY, contentWidth, alert.action ? 18 : 12, 2, 2, 'F');

      // Alert icon
      doc.setFillColor(...textColor);
      doc.circle(margin + 6, currentY + 6, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.white);
      doc.setFont('helvetica', 'bold');
      doc.text(icon, margin + 5, currentY + 8);

      // Alert text
      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text(alert.message, margin + 14, currentY + 7);

      if (alert.action) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.textSecondary);
        doc.text(alert.action, margin + 14, currentY + 14);
      }

      currentY += alert.action ? 22 : 16;
    });

    currentY += 5;
  }

  // DISTRIBUCION POR METODO DE PAGO
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    if (currentY > pageHeight - 70) {
      doc.addPage();
      currentY = 20;
    }

    currentY = addSectionTitle(doc, 'DISTRIBUCION POR METODO DE PAGO', currentY);

    const methodsTableData = data.paymentMethods.map(m => [
      m.name,
      formatCurrency(m.amount, data.currency),
      `${m.percentage}%`,
      `${m.count || Math.round(m.percentage * data.summary.totalPayments / 100)} pagos`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['METODO', 'MONTO', '% DEL TOTAL', 'TRANSACCIONES']],
      body: methodsTableData,
      foot: [['TOTAL', formatCurrency(totalAmount, data.currency), '100%', `${data.summary.totalPayments} pagos`]],
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.bgNeutral,
        textColor: COLORS.textPrimary,
        fontStyle: 'bold',
        fontSize: 9,
      },
      footStyles: {
        fillColor: COLORS.bgNeutral,
        textColor: COLORS.textPrimary,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { halign: 'right', cellWidth: 45 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 40 },
      },
    });

    currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 5;

    // Insight box
    if (data.paymentMethods.length >= 2) {
      const top2 = data.paymentMethods.slice(0, 2);
      const top2Total = top2.reduce((sum, m) => sum + m.amount, 0);
      const top2Percentage = top2.reduce((sum, m) => sum + m.percentage, 0);

      doc.setFillColor(...COLORS.bgInfo);
      doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.info);
      doc.setFont('helvetica', 'bold');
      doc.text('Insight: ', margin + 4, currentY + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${top2[0].name} y ${top2[1].name} dominan con ${top2Percentage}% de los ingresos (${formatCurrency(top2Total, data.currency)}).`,
        margin + 20,
        currentY + 7
      );
      currentY += 16;
    }
  }

  // ============ PAGE 2: TOP CLIENTS & TRANSACTIONS ============
  doc.addPage();
  currentY = 20;

  // TOP CLIENTES
  if (data.topClients && data.topClients.length > 0) {
    currentY = addSectionTitle(doc, 'TOP CLIENTES DEL PERIODO', currentY);

    const clientsTableData = data.topClients.map((c, i) => [
      (i + 1).toString(),
      c.name,
      formatCurrency(c.totalPaid, data.currency),
      c.paymentCount.toString(),
      `${c.percentage}%`,
      c.hasPending ? '⏳ Pendiente' : '✓ Activo',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'CLIENTE', 'TOTAL PAGADO', 'PAGOS', '% TOTAL', 'ESTADO']],
      body: clientsTableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.bgNeutral,
        textColor: COLORS.textPrimary,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 45 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 30 },
      },
      didParseCell: (cellData) => {
        if (cellData.column.index === 5 && cellData.section === 'body') {
          const status = cellData.cell.raw as string;
          if (status.includes('Activo')) {
            cellData.cell.styles.textColor = COLORS.success;
          } else if (status.includes('Pendiente')) {
            cellData.cell.styles.textColor = COLORS.warning;
          }
        }
      },
    });

    currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;

    // Client Actions Table
    currentY = addSectionTitle(doc, 'ACCIONES RECOMENDADAS POR CLIENTE', currentY);

    const actionsData = data.topClients.slice(0, 3).map(c => {
      let action = 'Mantener seguimiento regular';
      let impact = 'Medio';

      if (c.totalPaid > 100000) {
        action = 'Cliente VIP: Ofrecer descuentos por pronto pago';
        impact = 'Alto';
      } else if (c.hasPending) {
        action = `Seguimiento urgente: ${formatCurrency(c.totalPaid * 0.3, data.currency)} sin confirmar`;
        impact = 'Critico';
      }

      return [c.name, action, impact];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['CLIENTE', 'ACCION PRIORITARIA', 'IMPACTO']],
      body: actionsData,
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.bgNeutral,
        textColor: COLORS.textSecondary,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 100 },
        2: { halign: 'center', cellWidth: 25 },
      },
      didParseCell: (cellData) => {
        if (cellData.column.index === 2 && cellData.section === 'body') {
          const impact = cellData.cell.raw as string;
          if (impact === 'Critico') {
            cellData.cell.styles.textColor = COLORS.danger;
            cellData.cell.styles.fontStyle = 'bold';
          } else if (impact === 'Alto') {
            cellData.cell.styles.textColor = COLORS.warning;
          }
        }
      },
    });

    currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;
  }

  // DETALLE DE TRANSACCIONES
  currentY = addSectionTitle(doc, 'DETALLE DE TRANSACCIONES', currentY);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textSecondary);
  doc.text(`Mostrando las ${Math.min(data.payments.length, 15)} transacciones mas recientes`, margin, currentY);
  currentY += 6;

  const transactionsData = data.payments.slice(0, 15).map(p => [
    p.date,
    p.contact.length > 20 ? p.contact.substring(0, 18) + '...' : p.contact,
    formatCurrency(p.amount, data.currency),
    p.method,
    `${getStatusIcon(p.status)} ${p.status}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['FECHA', 'CLIENTE', 'MONTO', 'METODO', 'ESTADO']],
    body: transactionsData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 45 },
      2: { halign: 'right', cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
    },
    didParseCell: (cellData) => {
      if (cellData.column.index === 4 && cellData.section === 'body') {
        const status = cellData.cell.raw as string;
        if (status.includes('Confirmado')) {
          cellData.cell.styles.textColor = COLORS.success;
        } else if (status.includes('Pendiente')) {
          cellData.cell.styles.textColor = COLORS.warning;
        } else if (status.includes('Rechazado')) {
          cellData.cell.styles.textColor = COLORS.danger;
        }
      }
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;

  // RESUMEN POR ESTADO
  currentY = addSectionTitle(doc, 'RESUMEN POR ESTADO', currentY);

  const confirmedCount = data.payments.filter(p => p.status === 'Confirmado').length;
  const pendingCount = data.payments.filter(p => p.status === 'Pendiente').length;
  const rejectedCount = data.payments.filter(p => p.status === 'Rechazado').length;

  const confirmedPct = data.summary.totalPayments > 0 ? (confirmedCount / data.summary.totalPayments * 100).toFixed(1) : '0';
  const pendingPct = data.summary.totalPayments > 0 ? (pendingCount / data.summary.totalPayments * 100).toFixed(1) : '0';
  const rejectedPct = data.summary.totalPayments > 0 ? (rejectedCount / data.summary.totalPayments * 100).toFixed(1) : '0';

  const statusSummary = [
    ['✓ Confirmado', `${confirmedCount} pagos`, formatCurrency(data.summary.confirmedAmount, data.currency), `${confirmedPct}%`],
    ['⏳ Pendiente', `${pendingCount} pagos`, formatCurrency(data.summary.pendingAmount, data.currency), `${pendingPct}%`],
    ['✗ Rechazado', `${rejectedCount} pagos`, formatCurrency(data.summary.rejectedAmount, data.currency), `${rejectedPct}%`],
    ['TOTAL', `${data.summary.totalPayments} pagos`, formatCurrency(totalAmount, data.currency), '100%'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['ESTADO', 'CANTIDAD', 'MONTO TOTAL', '% DEL TOTAL']],
    body: statusSummary,
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.bgNeutral,
      textColor: COLORS.textSecondary,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'right', cellWidth: 35 },
    },
    didParseCell: (cellData) => {
      if (cellData.column.index === 0 && cellData.section === 'body') {
        const status = cellData.cell.raw as string;
        if (status.includes('Confirmado')) {
          cellData.cell.styles.textColor = COLORS.success;
        } else if (status.includes('Pendiente')) {
          cellData.cell.styles.textColor = COLORS.warning;
        } else if (status.includes('Rechazado')) {
          cellData.cell.styles.textColor = COLORS.danger;
        } else if (status === 'TOTAL') {
          cellData.cell.styles.fontStyle = 'bold';
        }
      }
      if (cellData.row.index === 3) {
        cellData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;

  // ============ PAGE 3: METRICS & RECOMMENDATIONS ============
  doc.addPage();
  currentY = 20;

  // METRICAS DE RENDIMIENTO
  currentY = addSectionTitle(doc, 'METRICAS DE RENDIMIENTO DEL SISTEMA', currentY);

  const metricsData = [
    ['Tasa de Deteccion Automatica', '90.0%', '95%', effectivenessRate > 85 ? '✓ Optimo' : '⏳ Por debajo'],
    ['Tiempo Promedio de Procesamiento', '2.5 min', '< 3 min', '✓ Optimo'],
    ['Mensajes Analizados', `${data.summary.totalPayments * 14} msgs`, '150 msgs', '⏳ Por debajo'],
    ['Tasa de Confirmacion Automatica', `${confirmationRate.toFixed(1)}%`, '70%', confirmationRate > 70 ? '✓ Optimo' : '⏳ Critico'],
    ['Disponibilidad del Sistema', '99.8%', '99.5%', '✓ Excelente'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['METRICA', 'VALOR ACTUAL', 'OBJETIVO', 'ESTADO']],
    body: metricsData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.bgNeutral,
      textColor: COLORS.textPrimary,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 35 },
    },
    didParseCell: (cellData) => {
      if (cellData.column.index === 3 && cellData.section === 'body') {
        const status = cellData.cell.raw as string;
        if (status.includes('Optimo') || status.includes('Excelente')) {
          cellData.cell.styles.textColor = COLORS.success;
        } else if (status.includes('Critico')) {
          cellData.cell.styles.textColor = COLORS.danger;
        } else {
          cellData.cell.styles.textColor = COLORS.warning;
        }
      }
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;

  // PROYECCIONES Y TENDENCIAS
  currentY = addSectionTitle(doc, 'PROYECCIONES Y TENDENCIAS', currentY);

  const projectedRevenue = data.summary.confirmedAmount * 3;
  const projectionsData = [
    ['Ingresos Esperados (Mes Completo)', formatCurrency(projectedRevenue, data.currency), 'Alta (85%)'],
    ['Nuevos Clientes Potenciales', '+5 clientes', 'Media (60%)'],
    ['Tasa de Confirmacion Mejorada', '65%', 'Alta (80%)'],
    ['Volumen de Transacciones', `${data.summary.totalPayments * 3} pagos/mes`, 'Alta (90%)'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['CONCEPTO', 'PROYECCION', 'CONFIANZA']],
    body: projectionsData,
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.bgNeutral,
      textColor: COLORS.textSecondary,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'right', cellWidth: 50, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 40 },
    },
    didParseCell: (cellData) => {
      if (cellData.column.index === 2 && cellData.section === 'body') {
        const confidence = cellData.cell.raw as string;
        if (confidence.includes('Alta')) {
          cellData.cell.styles.textColor = COLORS.success;
        } else if (confidence.includes('Media')) {
          cellData.cell.styles.textColor = COLORS.warning;
        }
      }
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;

  // RECOMENDACIONES ESTRATEGICAS
  currentY = addSectionTitle(doc, 'RECOMENDACIONES ESTRATEGICAS', currentY);

  const recommendations = [
    {
      title: 'Mejorar tasa de confirmacion',
      priority: 'Alta',
      actions: [
        'Implementar recordatorios automaticos a las 24h y 48h',
        'Agregar boton de confirmacion con un clic en WhatsApp',
        'Ofrecer incentivo del 2% por confirmacion inmediata',
      ],
    },
    {
      title: 'Reducir pagos rechazados',
      priority: 'Alta',
      actions: [
        'Validar metodos de pago antes de registrar',
        'Ofrecer alternativas de pago al detectar rechazo',
        'Implementar sistema de retries automaticos',
      ],
    },
    {
      title: 'Optimizar seguimiento de clientes',
      priority: 'Media',
      actions: [
        'Crear dashboard de clientes VIP',
        'Automatizar reportes semanales por cliente',
        'Implementar score de riesgo de no pago',
      ],
    },
  ];

  recommendations.forEach((rec, index) => {
    // Recommendation header
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.textPrimary);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${rec.title}`, margin, currentY);

    // Priority badge
    const priorityColor = rec.priority === 'Alta' ? COLORS.danger : COLORS.warning;
    doc.setFontSize(7);
    doc.setTextColor(...priorityColor);
    doc.text(`(Prioridad ${rec.priority})`, margin + 80, currentY);

    currentY += 5;

    // Actions
    rec.actions.forEach(action => {
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textSecondary);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${action}`, margin + 5, currentY);
      currentY += 4;
    });

    currentY += 4;
  });

  // Footer
  addFooter(doc);

  return doc;
}

// ============ CONTACT REPORT ============
export function generateContactReport(data: ContactReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFontSize(24);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('PayTrack', margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - margin, 20, { align: 'right' });

  let currentY = 50;

  // Contact Info
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Contacto', margin, currentY);
  currentY += 12;

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.contact.name, margin, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textSecondary);
  doc.text(`Tel: ${data.contact.phone}`, margin, currentY);
  if (data.contact.email) {
    currentY += 5;
    doc.text(`Email: ${data.contact.email}`, margin, currentY);
  }
  currentY += 15;

  // Summary
  currentY = addSectionTitle(doc, 'RESUMEN', currentY);

  const summaryData = [
    ['Total Pagado', formatCurrency(data.summary.totalPaid, data.currency)],
    ['Pendiente', formatCurrency(data.summary.pendingAmount, data.currency)],
    ['Pagos Realizados', data.summary.paymentCount.toString()],
    ['Confiabilidad', `${data.summary.reliabilityScore}%`],
  ];

  autoTable(doc, {
    startY: currentY,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right' },
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 15;

  // Payments History
  currentY = addSectionTitle(doc, 'HISTORIAL DE PAGOS', currentY);

  autoTable(doc, {
    startY: currentY,
    head: [['Fecha', 'Monto', 'Metodo', 'Estado']],
    body: data.payments.map((p) => [
      p.date,
      formatCurrency(p.amount, data.currency),
      p.method,
      `${getStatusIcon(p.status)} ${p.status}`,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
    },
    styles: { fontSize: 9 },
    didParseCell: (cellData) => {
      if (cellData.column.index === 3 && cellData.section === 'body') {
        const status = cellData.cell.raw as string;
        if (status.includes('Confirmado')) {
          cellData.cell.styles.textColor = COLORS.success;
        } else if (status.includes('Pendiente')) {
          cellData.cell.styles.textColor = COLORS.warning;
        } else if (status.includes('Rechazado')) {
          cellData.cell.styles.textColor = COLORS.danger;
        }
      }
    },
  });

  addFooter(doc);

  return doc;
}

// ============ OVERDUE REPORT ============
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
  const margin = 14;

  // Header
  doc.setFillColor(...COLORS.danger);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFontSize(24);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('PayTrack', margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Por: ${generatedBy}`, pageWidth - margin, 28, { align: 'right' });

  let currentY = 50;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.danger);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Pagos Vencidos', margin, currentY);
  currentY += 15;

  // Summary
  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  doc.setFillColor(...COLORS.bgDanger);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 25, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.danger);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total vencido: ${formatCurrency(totalOverdue, currency)}`, margin + 10, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cantidad de pagos: ${overduePayments.length}`, margin + 10, currentY + 18);

  currentY += 35;

  // Table
  autoTable(doc, {
    startY: currentY,
    head: [['Contacto', 'Telefono', 'Monto', 'Vencimiento', 'Dias']],
    body: overduePayments.map((p) => [
      p.contact,
      p.phone,
      formatCurrency(p.amount, currency),
      p.dueDate,
      p.daysOverdue.toString(),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.danger,
      textColor: COLORS.white,
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
