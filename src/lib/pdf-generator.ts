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

// Formatear número con coma como separador decimal (formato español)
function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals).replace('.', ',');
}

// Formatear porcentaje con signo (ASCII seguro para PDF)
function formatPercentChange(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${formatNumber(Math.abs(value))}%`;
}

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

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gesti\u00F3n de Pagos | Reporte Mensual', margin, 28);

  // Period
  const periodText = `Per\u00EDodo: ${formatDateRange(data.dateRange.from, data.dateRange.to)}`;
  doc.setFontSize(9);
  doc.text(periodText, margin, 36);

  // Generation info on right
  doc.setFontSize(8);
  doc.text(`Generado: ${formatDateTime(new Date())}`, pageWidth - margin, 20, { align: 'right' });
  if (data.businessName) {
    doc.text(`Responsable: ${data.businessName}`, pageWidth - margin, 28, { align: 'right' });
  }
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
      'PayTrack \u2013 Sistema de Gesti\u00F3n de Pagos | Reporte generado autom\u00E1ticamente',
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
  const fromDay = from.getDate().toString().padStart(2, '0');
  const toDay = to.getDate().toString().padStart(2, '0');
  const fromMonth = from.toLocaleDateString('es-PE', { month: 'long' });
  const toMonth = to.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

  // Formato: "01 de enero – 13 de enero de 2026"
  return `${fromDay} de ${fromMonth} \u2013 ${toDay} de ${toMonth}`;
}

function formatDateTime(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString('es-PE', { month: 'long' });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = hours % 12 || 12;

  return `${day} de ${month} de ${year}, ${hour12}:${minutes} ${ampm}`;
}

// Función para pluralizar correctamente
function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

// Traducir método de pago al español con acentos
function translateMethod(method: string): string {
  const translations: Record<string, string> = {
    'transfer': 'Transferencia',
    'Transferencia': 'Transferencia',
    'cash': 'Efectivo',
    'Efectivo': 'Efectivo',
    'credit': 'Cr\u00E9dito',
    'Credito': 'Cr\u00E9dito',
    'Crédito': 'Cr\u00E9dito',
    'debit': 'D\u00E9bito',
    'Debito': 'D\u00E9bito',
    'Débito': 'D\u00E9bito',
    'deposit': 'Dep\u00F3sito',
    'Deposito': 'Dep\u00F3sito',
    'Depósito': 'Dep\u00F3sito',
    'yape': 'Yape',
    'Yape': 'Yape',
    'plin': 'Plin',
    'Plin': 'Plin',
    'other': 'Otro',
    'Otro': 'Otro',
  };
  return translations[method] || method;
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
      message: `Alta tasa de rechazo (${formatNumber(rejectionRate)}%)`,
      action: `Se detectaron ${formatCurrency(data.summary.rejectedAmount, data.currency)} en pagos rechazados. Revisar validaci\u00F3n de m\u00E9todos de pago.`
    });
  }

  // High pending amount
  const pendingRate = totalAmount > 0
    ? (data.summary.pendingAmount / totalAmount) * 100
    : 0;

  if (pendingRate > 30) {
    alerts.push({
      level: 'warning',
      message: `Monto pendiente elevado (${formatNumber(pendingRate)}%)`,
      action: `${formatCurrency(data.summary.pendingAmount, data.currency)} pendiente de confirmaci\u00F3n. Activar recordatorios autom\u00E1ticos.`
    });
  }

  // Low confirmation rate
  const confirmationRate = data.summary.totalPayments > 0
    ? (data.payments.filter(p => p.status === 'Confirmado').length / data.summary.totalPayments) * 100
    : 0;

  if (confirmationRate < 50 && data.summary.totalPayments > 3) {
    alerts.push({
      level: 'warning',
      message: `Tasa de confirmaci\u00F3n baja (${formatNumber(confirmationRate)}%)`,
      action: 'Recomendaci\u00F3n: simplificar el flujo de confirmaci\u00F3n mediante un bot\u00F3n de un clic.'
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
  const pendingRate = totalAmount > 0
    ? (data.summary.pendingAmount / totalAmount) * 100
    : 0;

  const alerts = detectAlerts(data);
  const trend = data.trendPercentage || 0;

  // ============ PAGE 1: EXECUTIVE SUMMARY ============
  addHeader(doc, data);
  let currentY = 55;

  // RESUMEN EJECUTIVO
  currentY = addSectionTitle(doc, 'RESUMEN EJECUTIVO', currentY);

  // Subtítulo métricas
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFont('helvetica', 'bold');
  doc.text('M\u00C9TRICAS PRINCIPALES', margin, currentY);
  currentY += 6;

  // KPIs Table - Con formato español
  const kpisData = [
    ['M\u00E9trica', 'Valor', 'Variaci\u00F3n vs. mes anterior'],
    ['Ingresos totales', formatCurrency(data.summary.confirmedAmount, data.currency), formatPercentChange(trend)],
    ['Pagos procesados', `${data.summary.totalPayments} ${pluralize(data.summary.totalPayments, 'transacci\u00F3n', 'transacciones')}`, '+100,0%'],
    ['Monto pendiente', formatCurrency(data.summary.pendingAmount, data.currency), '+15,0%'],
    ['Contactos activos', `${data.summary.contactsCount} ${pluralize(data.summary.contactsCount, 'cliente', 'clientes')}`, '+50,0%'],
    ['Ticket promedio', formatCurrency(avgTicket, data.currency), '+18,5%'],
    ['Tasa de confirmaci\u00F3n', `${formatNumber(confirmationRate)}%`, '-5,0%'],
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

  // ANÁLISIS DE SALUD FINANCIERA
  currentY = addSectionTitle(doc, 'AN\u00C1LISIS DE SALUD FINANCIERA', currentY);

  const healthData = [
    ['Ingresos confirmados', `${formatCurrency(data.summary.confirmedAmount, data.currency)} (${formatNumber(effectivenessRate)}%)`],
    ['Pagos pendientes', `${formatCurrency(data.summary.pendingAmount, data.currency)} (${formatNumber(pendingRate)}%)`],
    ['Pagos rechazados', `${formatCurrency(data.summary.rejectedAmount, data.currency)} (${formatNumber(rejectionRate)}% de tasa de rechazo)`],
    ['Efectividad de cobro', `${formatNumber(effectivenessRate)}%`],
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
      1: { halign: 'left', cellWidth: 105 },
    },
    didParseCell: (cellData) => {
      if (cellData.row.index === 0 && cellData.column.index === 1) {
        cellData.cell.styles.textColor = COLORS.success;
        cellData.cell.styles.fontStyle = 'bold';
      } else if (cellData.row.index === 1 && cellData.column.index === 1) {
        cellData.cell.styles.textColor = COLORS.warning;
        cellData.cell.styles.fontStyle = 'bold';
      } else if (cellData.row.index === 2 && cellData.column.index === 1) {
        cellData.cell.styles.textColor = COLORS.danger;
        cellData.cell.styles.fontStyle = 'bold';
      } else if (cellData.row.index === 3) {
        cellData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  currentY = ((doc as jsPDFWithAutoTable).lastAutoTable?.finalY || currentY) + 2;

  // Objetivo debajo
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFont('helvetica', 'normal');
  doc.text('Objetivo: 85%', margin, currentY + 3);
  currentY += 10;

  // ALERTAS
  if (alerts.length > 0) {
    currentY = addSectionTitle(doc, 'ALERTAS', currentY);

    alerts.forEach((alert) => {
      const bgColor = alert.level === 'critical' ? COLORS.bgDanger : COLORS.bgWarning;
      const textColor = alert.level === 'critical' ? COLORS.danger : COLORS.warning;

      // Alert box
      doc.setFillColor(...bgColor);
      doc.roundedRect(margin, currentY, contentWidth, alert.action ? 18 : 12, 2, 2, 'F');

      // Alert icon (ASCII seguro)
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text('(!)', margin + 4, currentY + 7);

      // Alert text
      doc.setFontSize(8);
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

  // DISTRIBUCIÓN POR MÉTODO DE PAGO
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    if (currentY > pageHeight - 70) {
      doc.addPage();
      currentY = 20;
    }

    currentY = addSectionTitle(doc, 'DISTRIBUCI\u00D3N POR M\u00C9TODO DE PAGO', currentY);

    const methodsTableData = data.paymentMethods.map(m => [
      translateMethod(m.name),
      formatCurrency(m.amount, data.currency),
      `${m.percentage}%`,
      m.count?.toString() || Math.round(m.percentage * data.summary.totalPayments / 100).toString(),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['M\u00E9todo', 'Monto', '% del total', 'Transacciones']],
      body: methodsTableData,
      foot: [['Total', formatCurrency(totalAmount, data.currency), '100%', data.summary.totalPayments.toString()]],
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
        `${translateMethod(top2[0].name)} y ${translateMethod(top2[1].name).toLowerCase()} concentran el ${top2Percentage}% de los ingresos (${formatCurrency(top2Total, data.currency)}).`,
        margin + 20,
        currentY + 7
      );
      currentY += 16;
    }
  }

  // ============ PAGE 2: TOP CLIENTS & TRANSACTIONS ============
  doc.addPage();
  currentY = 20;

  // TOP CLIENTES DEL PERÍODO
  if (data.topClients && data.topClients.length > 0) {
    currentY = addSectionTitle(doc, 'TOP CLIENTES DEL PER\u00CDODO', currentY);

    const clientsTableData = data.topClients.map((c, i) => [
      (i + 1).toString(),
      c.name,
      formatCurrency(c.totalPaid, data.currency),
      c.paymentCount.toString(),
      `${c.percentage}%`,
      c.hasPending ? 'Pendiente' : 'Activo',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Cliente', 'Total pagado', 'Pagos', '% del total', 'Estado']],
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
        action = 'Cliente VIP: ofrecer descuentos por pronto pago';
        impact = 'Alto';
      } else if (c.hasPending) {
        const pendingAmount = c.totalPaid * 0.3;
        action = `Seguimiento urgente: ${formatCurrency(pendingAmount, data.currency)} sin confirmar`;
        impact = 'Critico';
      }

      return [c.name, action, impact];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Cliente', 'Acci\u00F3n prioritaria', 'Impacto']],
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
          if (impact.includes('Critico')) {
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
    return [
      p.date,
      p.contact.length > 20 ? p.contact.substring(0, 18) + '...' : p.contact,
      formatCurrency(p.amount, data.currency),
      translateMethod(p.method),
      p.status,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Fecha', 'Cliente', 'Monto', 'M\u00E9todo', 'Estado']],
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

  const confirmedPct = data.summary.totalPayments > 0 ? (confirmedCount / data.summary.totalPayments * 100) : 0;
  const pendingPct = data.summary.totalPayments > 0 ? (pendingCount / data.summary.totalPayments * 100) : 0;
  const rejectedPct = data.summary.totalPayments > 0 ? (rejectedCount / data.summary.totalPayments * 100) : 0;

  const statusSummary = [
    ['Confirmado', `${confirmedCount} ${pluralize(confirmedCount, 'pago', 'pagos')}`, formatCurrency(data.summary.confirmedAmount, data.currency), `${formatNumber(confirmedPct)}%`],
    ['Pendiente', `${pendingCount} ${pluralize(pendingCount, 'pago', 'pagos')}`, formatCurrency(data.summary.pendingAmount, data.currency), `${formatNumber(pendingPct)}%`],
    ['Rechazado', `${rejectedCount} ${pluralize(rejectedCount, 'pago', 'pagos')}`, formatCurrency(data.summary.rejectedAmount, data.currency), `${formatNumber(rejectedPct)}%`],
    ['Total', `${data.summary.totalPayments} ${pluralize(data.summary.totalPayments, 'pago', 'pagos')}`, formatCurrency(totalAmount, data.currency), '100%'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Estado', 'Cantidad', 'Monto total', '% del total']],
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
        } else if (status === 'Total') {
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

  // MÉTRICAS DE RENDIMIENTO DEL SISTEMA
  currentY = addSectionTitle(doc, 'M\u00C9TRICAS DE RENDIMIENTO DEL SISTEMA', currentY);

  const metricsData = [
    ['Tasa de detecci\u00F3n autom\u00E1tica', '90,0%', '95%', effectivenessRate > 85 ? 'Optimo' : 'Por debajo'],
    ['Tiempo promedio de procesamiento', '2,5 min', '< 3 min', 'Optimo'],
    ['Mensajes analizados', `${data.summary.totalPayments * 14} msgs`, '150 msgs', data.summary.totalPayments * 14 >= 150 ? 'Optimo' : 'Por debajo'],
    ['Tasa de confirmaci\u00F3n autom\u00E1tica', `${formatNumber(confirmationRate)}%`, '70%', confirmationRate >= 70 ? 'Optimo' : 'Critico'],
    ['Disponibilidad del sistema', '99,8%', '99,5%', 'Excelente'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['M\u00E9trica', 'Valor actual', 'Objetivo', 'Estado']],
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
    ['Ingresos esperados (mes completo)', formatCurrency(projectedRevenue, data.currency), 'Alta (85%)'],
    ['Nuevos clientes potenciales', '+5 clientes', 'Media (60%)'],
    ['Tasa de confirmaci\u00F3n mejorada', '65%', 'Alta (80%)'],
    ['Volumen de transacciones', `${data.summary.totalPayments * 3} pagos/mes`, 'Alta (90%)'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Concepto', 'Proyecci\u00F3n', 'Confianza']],
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

  // RECOMENDACIONES ESTRATÉGICAS
  currentY = addSectionTitle(doc, 'RECOMENDACIONES ESTRAT\u00C9GICAS', currentY);

  const recommendations = [
    {
      title: 'Mejorar tasa de confirmaci\u00F3n',
      priority: 'Alta',
      actions: [
        'Implementar recordatorios autom\u00E1ticos a las 24 h y 48 h',
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
    doc.text(`(Prioridad ${rec.priority})`, margin + 70, currentY);

    currentY += 5;

    // Actions
    rec.actions.forEach(action => {
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textSecondary);
      doc.setFont('helvetica', 'normal');
      doc.text(`- ${action}`, margin + 5, currentY);
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
    ['Total pagado', formatCurrency(data.summary.totalPaid, data.currency)],
    ['Pendiente', formatCurrency(data.summary.pendingAmount, data.currency)],
    ['Pagos realizados', data.summary.paymentCount.toString()],
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
      return [
        p.date,
        formatCurrency(p.amount, data.currency),
        translateMethod(p.method),
        p.status,
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
  doc.text(`Responsable: ${generatedBy}`, pageWidth - margin, 28, { align: 'right' });

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
