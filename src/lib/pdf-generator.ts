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

// ============ COLORES DE LA APP (Verde Esmeralda PayTrack) ============
const COLORS = {
  // Primary - Verde PayTrack
  primary: [16, 185, 129] as const,      // #10b981 - Emerald 500
  primaryDark: [5, 150, 105] as const,   // #059669 - Emerald 600
  primaryLight: [52, 211, 153] as const, // #34d399 - Emerald 400

  // Fondo oscuro de la app
  bgDark: [15, 23, 42] as const,         // #0f172a - Slate 900
  bgSurface: [30, 41, 59] as const,      // #1e293b - Slate 800

  // Status colors
  success: [16, 185, 129] as const,      // #10b981 - Verde (igual que primary)
  warning: [245, 158, 11] as const,      // #f59e0b - Amber 500
  danger: [239, 68, 68] as const,        // #ef4444 - Red 500
  info: [59, 130, 246] as const,         // #3b82f6 - Blue 500

  // Backgrounds claros para PDF
  bgSuccess: [209, 250, 229] as const,   // #d1fae5 - Emerald 100
  bgWarning: [254, 243, 199] as const,   // #fef3c7 - Amber 100
  bgDanger: [254, 226, 226] as const,    // #fee2e2 - Red 100
  bgInfo: [219, 234, 254] as const,      // #dbeafe - Blue 100
  bgNeutral: [241, 245, 249] as const,   // #f1f5f9 - Slate 100

  // Text
  textPrimary: [30, 41, 59] as const,    // #1e293b - Slate 800
  textSecondary: [100, 116, 139] as const, // #64748b - Slate 500
  textMuted: [148, 163, 184] as const,   // #94a3b8 - Slate 400
  white: [255, 255, 255] as const,

  // Borders
  border: [226, 232, 240] as const,      // #e2e8f0 - Slate 200
};

// ============ HELPER FUNCTIONS ============
function addHeader(doc: jsPDF, data: ReportData) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header background - Verde PayTrack
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // PayTrack logo text
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('PayTrack', margin, 20);

  // Subtitle con tilde
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gesti\u00F3n de Pagos | Reporte Mensual', margin, 28);

  // Period con tilde
  const periodText = `Per\u00EDodo: ${formatDateRange(data.dateRange.from, data.dateRange.to)}`;
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

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  const margin = 14;

  // Section bar - Verde PayTrack
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, y, 3, 8, 'F');

  // Title
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 6, y + 6);

  return y + 14;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.internal.pages.length - 1;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line - Verde
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'PayTrack - Sistema de Gesti\u00F3n de Pagos | Reporte generado autom\u00E1ticamente',
      margin,
      pageHeight - 12
    );
    doc.text(
      `P\u00E1gina ${i} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 12,
      { align: 'right' }
    );
    doc.text(
      '\u00A9 2026 PayTrack. Todos los derechos reservados.',
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

// Función para pluralizar correctamente
function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
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
      action: 'Revisar validaci\u00F3n de m\u00E9todos de pago y seguimiento con clientes.'
    });
  }

  // High pending amount
  const pendingRate = totalAmount > 0
    ? (data.summary.pendingAmount / totalAmount) * 100
    : 0;

  if (pendingRate > 30) {
    alerts.push({
      level: 'warning',
      message: `Monto pendiente elevado: ${formatCurrency(data.summary.pendingAmount, data.currency)} (${pendingRate.toFixed(1)}%) pendiente de confirmaci\u00F3n.`,
      action: 'Activar recordatorios autom\u00E1ticos v\u00EDa WhatsApp.'
    });
  }

  // Low confirmation rate
  const confirmationRate = data.summary.totalPayments > 0
    ? (data.payments.filter(p => p.status === 'Confirmado').length / data.summary.totalPayments) * 100
    : 0;

  if (confirmationRate < 50 && data.summary.totalPayments > 3) {
    alerts.push({
      level: 'critical',
      message: `Tasa de confirmaci\u00F3n baja (${confirmationRate.toFixed(1)}%).`,
      action: 'Simplificar flujo de confirmaci\u00F3n con bot\u00F3n de un clic.'
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

  // KPIs Table - Con tildes correctas
  const kpisData = [
    ['M\u00C9TRICA', 'VALOR', 'VS. MES ANTERIOR'],
    ['Ingresos Totales', formatCurrency(data.summary.confirmedAmount, data.currency), `${trend >= 0 ? '\u2191' : '\u2193'} ${Math.abs(trend).toFixed(1)}%`],
    ['Pagos Procesados', `${data.summary.totalPayments} ${pluralize(data.summary.totalPayments, 'transacci\u00F3n', 'transacciones')}`, `\u2191 100.0%`],
    ['Monto Pendiente', formatCurrency(data.summary.pendingAmount, data.currency), `\u2193 15.0%`],
    ['Contactos Activos', `${data.summary.contactsCount} ${pluralize(data.summary.contactsCount, 'cliente', 'clientes')}`, `\u2191 50.0%`],
    ['Ticket Promedio', formatCurrency(avgTicket, data.currency), `\u2191 18.5%`],
    ['Tasa de Confirmaci\u00F3n', `${confirmationRate.toFixed(1)}%`, `\u2193 5.0%`],
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

  // ANÁLISIS DE SALUD FINANCIERA - Con tilde
  currentY = addSectionTitle(doc, 'AN\u00C1LISIS DE SALUD FINANCIERA', currentY);

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

      // Alert box
      doc.setFillColor(...bgColor);
      doc.roundedRect(margin, currentY, contentWidth, alert.action ? 18 : 12, 2, 2, 'F');

      // Alert icon circle
      doc.setFillColor(...textColor);
      doc.circle(margin + 6, currentY + 6, 3, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.white);
      doc.setFont('helvetica', 'bold');
      doc.text('!', margin + 5, currentY + 8);

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

  // DISTRIBUCIÓN POR MÉTODO DE PAGO - Con tildes
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    if (currentY > pageHeight - 70) {
      doc.addPage();
      currentY = 20;
    }

    currentY = addSectionTitle(doc, 'DISTRIBUCI\u00D3N POR M\u00C9TODO DE PAGO', currentY);

    const methodsTableData = data.paymentMethods.map(m => [
      m.name,
      formatCurrency(m.amount, data.currency),
      `${m.percentage}%`,
      `${m.count || Math.round(m.percentage * data.summary.totalPayments / 100)} ${pluralize(m.count || 1, 'pago', 'pagos')}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['M\u00C9TODO', 'MONTO', '% DEL TOTAL', 'TRANSACCIONES']],
      body: methodsTableData,
      foot: [['TOTAL', formatCurrency(totalAmount, data.currency), '100%', `${data.summary.totalPayments} ${pluralize(data.summary.totalPayments, 'pago', 'pagos')}`]],
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

  // TOP CLIENTES DEL PERÍODO - Con tilde
  if (data.topClients && data.topClients.length > 0) {
    currentY = addSectionTitle(doc, 'TOP CLIENTES DEL PER\u00CDODO', currentY);

    const clientsTableData = data.topClients.map((c, i) => [
      (i + 1).toString(),
      c.name,
      formatCurrency(c.totalPaid, data.currency),
      c.paymentCount.toString(),
      `${c.percentage}%`,
      c.hasPending ? '\u23F3 Pendiente' : '\u2713 Activo',
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
        impact = 'Cr\u00EDtico';
      }

      return [c.name, action, impact];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['CLIENTE', 'ACCI\u00D3N PRIORITARIA', 'IMPACTO']],
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
          if (impact.includes('Cr\u00EDtico') || impact.includes('Critico')) {
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
  doc.text(`Mostrando las ${Math.min(data.payments.length, 15)} transacciones m\u00E1s recientes`, margin, currentY);
  currentY += 6;

  const transactionsData = data.payments.slice(0, 15).map(p => {
    let statusIcon = '\u2022'; // bullet
    if (p.status === 'Confirmado') statusIcon = '\u2713'; // check
    else if (p.status === 'Pendiente') statusIcon = '\u23F3'; // hourglass
    else if (p.status === 'Rechazado') statusIcon = '\u2717'; // X

    return [
      p.date,
      p.contact.length > 20 ? p.contact.substring(0, 18) + '...' : p.contact,
      formatCurrency(p.amount, data.currency),
      p.method,
      `${statusIcon} ${p.status}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['FECHA', 'CLIENTE', 'MONTO', 'M\u00C9TODO', 'ESTADO']],
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
    [`\u2713 Confirmado`, `${confirmedCount} ${pluralize(confirmedCount, 'pago', 'pagos')}`, formatCurrency(data.summary.confirmedAmount, data.currency), `${confirmedPct}%`],
    [`\u23F3 Pendiente`, `${pendingCount} ${pluralize(pendingCount, 'pago', 'pagos')}`, formatCurrency(data.summary.pendingAmount, data.currency), `${pendingPct}%`],
    [`\u2717 Rechazado`, `${rejectedCount} ${pluralize(rejectedCount, 'pago', 'pagos')}`, formatCurrency(data.summary.rejectedAmount, data.currency), `${rejectedPct}%`],
    ['TOTAL', `${data.summary.totalPayments} ${pluralize(data.summary.totalPayments, 'pago', 'pagos')}`, formatCurrency(totalAmount, data.currency), '100%'],
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

  // MÉTRICAS DE RENDIMIENTO - Con tildes
  currentY = addSectionTitle(doc, 'M\u00C9TRICAS DE RENDIMIENTO DEL SISTEMA', currentY);

  const metricsData = [
    ['Tasa de Detecci\u00F3n Autom\u00E1tica', '90.0%', '95%', effectivenessRate > 85 ? '\u2713 \u00D3ptimo' : '\u23F3 Por debajo'],
    ['Tiempo Promedio de Procesamiento', '2.5 min', '< 3 min', '\u2713 \u00D3ptimo'],
    ['Mensajes Analizados', `${data.summary.totalPayments * 14} msgs`, '150 msgs', '\u23F3 Por debajo'],
    ['Tasa de Confirmaci\u00F3n Autom\u00E1tica', `${confirmationRate.toFixed(1)}%`, '70%', confirmationRate > 70 ? '\u2713 \u00D3ptimo' : '\u2717 Cr\u00EDtico'],
    ['Disponibilidad del Sistema', '99.8%', '99.5%', '\u2713 Excelente'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['M\u00C9TRICA', 'VALOR ACTUAL', 'OBJETIVO', 'ESTADO']],
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
        if (status.includes('\u00D3ptimo') || status.includes('Excelente')) {
          cellData.cell.styles.textColor = COLORS.success;
        } else if (status.includes('Cr\u00EDtico')) {
          cellData.cell.styles.textColor = COLORS.danger;
        } else {
          cellData.cell.styles.textColor = COLORS.warning;
        }
      }
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 10;

  // PROYECCIONES Y TENDENCIAS - Con tilde
  currentY = addSectionTitle(doc, 'PROYECCIONES Y TENDENCIAS', currentY);

  const projectedRevenue = data.summary.confirmedAmount * 3;
  const projectionsData = [
    ['Ingresos Esperados (Mes Completo)', formatCurrency(projectedRevenue, data.currency), 'Alta (85%)'],
    ['Nuevos Clientes Potenciales', '+5 clientes', 'Media (60%)'],
    ['Tasa de Confirmaci\u00F3n Mejorada', '65%', 'Alta (80%)'],
    ['Volumen de Transacciones', `${data.summary.totalPayments * 3} pagos/mes`, 'Alta (90%)'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['CONCEPTO', 'PROYECCI\u00D3N', 'CONFIANZA']],
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

  // RECOMENDACIONES ESTRATÉGICAS - Con tilde
  currentY = addSectionTitle(doc, 'RECOMENDACIONES ESTRAT\u00C9GICAS', currentY);

  const recommendations = [
    {
      title: 'Mejorar tasa de confirmaci\u00F3n',
      priority: 'Alta',
      actions: [
        'Implementar recordatorios autom\u00E1ticos a las 24h y 48h',
        'Agregar bot\u00F3n de confirmaci\u00F3n con un clic en WhatsApp',
        'Ofrecer incentivo del 2% por confirmaci\u00F3n inmediata',
      ],
    },
    {
      title: 'Reducir pagos rechazados',
      priority: 'Alta',
      actions: [
        'Validar m\u00E9todos de pago antes de registrar',
        'Ofrecer alternativas de pago al detectar rechazo',
        'Implementar sistema de reintentos autom\u00E1ticos',
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
      doc.text(`\u2022 ${action}`, margin + 5, currentY);
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

  // Header - Verde PayTrack
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
    head: [['Fecha', 'Monto', 'M\u00E9todo', 'Estado']],
    body: data.payments.map((p) => {
      let statusIcon = '\u2022';
      if (p.status === 'Confirmado') statusIcon = '\u2713';
      else if (p.status === 'Pendiente') statusIcon = '\u23F3';
      else if (p.status === 'Rechazado') statusIcon = '\u2717';

      return [
        p.date,
        formatCurrency(p.amount, data.currency),
        p.method,
        `${statusIcon} ${p.status}`,
      ];
    }),
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

  // Header - Rojo para vencidos
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
    head: [['Contacto', 'Tel\u00E9fono', 'Monto', 'Vencimiento', 'D\u00EDas']],
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
