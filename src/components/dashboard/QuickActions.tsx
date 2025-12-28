import { Download, RefreshCw, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { usePayments } from "@/hooks/usePayments";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickActions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: payments } = usePayments();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleExportCSV = () => {
    if (!payments || payments.length === 0) {
      toast.error("No hay pagos para exportar");
      return;
    }

    const data = payments.map(p => ({
      Fecha: format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
      Contacto: p.contact?.name || 'Desconocido',
      Telefono: p.contact?.phone || '',
      Monto: p.amount,
      Moneda: p.currency || 'PEN',
      Metodo: p.method || '',
      Estado: p.status === 'confirmed' ? 'Confirmado' : p.status === 'pending' ? 'Pendiente' : 'Rechazado',
      Confianza: `${p.confidence_score || 0}%`,
      Referencia: p.reference_number || '',
    }));

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success("Archivo CSV descargado");
  };

  const handleSync = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['weekly-activity'] });
    queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
    toast.success("Datos sincronizados");
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <Button variant="default" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Registrar Pago
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => navigate('/payments')}>
              Todos los pagos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/payments?status=confirmed')}>
              Confirmados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/payments?status=pending')}>
              Pendientes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/payments?status=rejected')}>
              Rechazados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" className="gap-2" onClick={handleSync}>
          <RefreshCw className="h-4 w-4" />
          Sincronizar
        </Button>
        <Button variant="ghost" className="gap-2" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
