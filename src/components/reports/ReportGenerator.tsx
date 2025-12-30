import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Printer,
  Mail,
  Loader2,
  Calendar,
  Filter,
  Eye,
} from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/contexts/AuthContext';
import {
  generatePaymentReport,
  generateContactReport,
  generateOverdueReport,
  downloadPDF,
  printPDF,
  type ReportData,
} from '@/lib/pdf-generator';
import { formatCurrency, type CurrencyCode } from '@/lib/currency';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type ReportType = 'summary' | 'detailed' | 'by_contact' | 'overdue';

// Extended payment type with relations
interface PaymentWithContact extends Tables<'payments'> {
  payment_due_date?: string | null;
  contacts?: {
    name: string;
    phone?: string;
  } | null;
}

export function ReportGenerator() {
  const { profile } = useAuth();
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: contacts, isLoading: loadingContacts } = useContacts();

  const [reportType, setReportType] = useState<ReportType>('summary');
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedContact, setSelectedContact] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const currency = (profile?.currency || 'PEN') as CurrencyCode;

  const filteredPayments = (payments as PaymentWithContact[] | undefined)?.filter(p => {
    const paymentDate = new Date(p.payment_date || p.created_at);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    const inDateRange = paymentDate >= from && paymentDate <= to;
    const matchesContact = selectedContact === 'all' || p.contact_id === selectedContact;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;

    return inDateRange && matchesContact && matchesStatus;
  }) || [];

  const handleGeneratePDF = async (action: 'download' | 'print') => {
    if (filteredPayments.length === 0) {
      toast.error('No hay datos para generar el reporte');
      return;
    }

    setIsGenerating(true);

    try {
      const confirmedPayments = filteredPayments.filter(p => p.status === 'confirmed');
      const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
      const rejectedPayments = filteredPayments.filter(p => p.status === 'rejected');

      let doc;
      let filename = '';

      if (reportType === 'overdue') {
        // Overdue payments report
        const overduePayments = filteredPayments
          .filter(p => {
            const dueDate = p.payment_due_date;
            return dueDate && new Date(dueDate) < new Date() && p.status === 'pending';
          })
          .map(p => ({
            date: p.payment_date || new Date(p.created_at).toLocaleDateString('es-PE'),
            contact: p.contacts?.name || 'Sin contacto',
            phone: p.contacts?.phone || '',
            amount: p.amount || 0,
            dueDate: p.payment_due_date || '',
            daysOverdue: Math.floor(
              (new Date().getTime() - new Date(p.payment_due_date || '').getTime()) /
              (1000 * 60 * 60 * 24)
            ),
          }));

        if (overduePayments.length === 0) {
          toast.info('No hay pagos vencidos en el periodo seleccionado');
          setIsGenerating(false);
          return;
        }

        doc = generateOverdueReport(
          overduePayments,
          currency,
          profile?.full_name || 'Usuario'
        );
        filename = `reporte_vencidos_${new Date().toISOString().split('T')[0]}`;

      } else if (reportType === 'by_contact' && selectedContact !== 'all') {
        // Single contact report
        const contact = contacts?.find(c => c.id === selectedContact);
        if (!contact) {
          toast.error('Contacto no encontrado');
          setIsGenerating(false);
          return;
        }

        const contactPayments = filteredPayments.map(p => ({
          date: p.payment_date || new Date(p.created_at).toLocaleDateString('es-PE'),
          amount: p.amount || 0,
          method: p.method || 'Otro',
          status: p.status === 'confirmed' ? 'Confirmado' :
                  p.status === 'pending' ? 'Pendiente' :
                  p.status === 'rejected' ? 'Rechazado' : 'Cancelado',
        }));

        // Calculate reliability score based on confirmed vs total payments
        const totalPayments = filteredPayments.length;
        const confirmedCount = confirmedPayments.length;
        const reliabilityScore = totalPayments > 0
          ? Math.round((confirmedCount / totalPayments) * 100)
          : 100;

        doc = generateContactReport({
          contact: {
            name: contact.name,
            phone: contact.phone || '',
            email: contact.email || undefined,
          },
          summary: {
            totalPaid: confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
            pendingAmount: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
            paymentCount: filteredPayments.length,
            reliabilityScore,
          },
          payments: contactPayments,
          currency,
          generatedBy: profile?.full_name || 'Usuario',
        });
        filename = `reporte_${contact.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      } else {
        // Standard payment report
        const reportData: ReportData = {
          title: reportType === 'detailed' ? 'Reporte Detallado de Pagos' : 'Resumen de Pagos',
          subtitle: `Periodo: ${new Date(dateFrom).toLocaleDateString('es-PE')} - ${new Date(dateTo).toLocaleDateString('es-PE')}`,
          dateRange: {
            from: new Date(dateFrom),
            to: new Date(dateTo),
          },
          summary: {
            totalPayments: filteredPayments.length,
            confirmedAmount: confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
            pendingAmount: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
            rejectedAmount: rejectedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
            contactsCount: new Set(filteredPayments.map(p => p.contact_id).filter(Boolean)).size,
          },
          payments: filteredPayments.map(p => ({
            date: p.payment_date || new Date(p.created_at).toLocaleDateString('es-PE'),
            contact: p.contacts?.name || 'Sin contacto',
            amount: p.amount || 0,
            method: p.method || 'Otro',
            status: p.status === 'confirmed' ? 'Confirmado' :
                    p.status === 'pending' ? 'Pendiente' :
                    p.status === 'rejected' ? 'Rechazado' : 'Cancelado',
          })),
          currency,
          generatedBy: profile?.full_name || 'Usuario',
          businessName: profile?.business_name || undefined,
        };

        doc = generatePaymentReport(reportData);
        filename = `reporte_pagos_${new Date().toISOString().split('T')[0]}`;
      }

      if (action === 'download') {
        downloadPDF(doc, filename);
        toast.success('Reporte PDF descargado');
      } else {
        printPDF(doc);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte');
    } finally {
      setIsGenerating(false);
    }
  };

  const isLoading = loadingPayments || loadingContacts;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Generador de Reportes</CardTitle>
            <CardDescription>
              Crea reportes PDF profesionales de tus pagos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type */}
        <div className="space-y-2">
          <Label>Tipo de Reporte</Label>
          <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Resumen de Pagos</SelectItem>
              <SelectItem value="detailed">Reporte Detallado</SelectItem>
              <SelectItem value="by_contact">Por Contacto</SelectItem>
              <SelectItem value="overdue">Pagos Vencidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Desde
            </Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Contacto
            </Label>
            <Select value={selectedContact} onValueChange={setSelectedContact}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los contactos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los contactos</SelectItem>
                {contacts?.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="rounded-lg bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pagos en el periodo:</span>
            <Badge variant="secondary">{filteredPayments.length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monto total:</span>
            <span className="font-medium">
              {formatCurrency(
                filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
                currency
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            className="gradient-primary text-primary-foreground flex-1 sm:flex-none"
            onClick={() => handleGeneratePDF('download')}
            disabled={isLoading || isGenerating || filteredPayments.length === 0}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGeneratePDF('print')}
            disabled={isLoading || isGenerating || filteredPayments.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
