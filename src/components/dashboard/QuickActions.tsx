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
      <div className="flex flex-wrap items-center gap-2 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <Button
          className="gap-2 gradient-primary text-white rounded-xl shadow-button hover:shadow-glow"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Registrar Pago</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 bg-stitch-surface border-stitch text-stitch-text hover:bg-stitch-surface-elevated hover:text-stitch-text rounded-xl"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-stitch-surface border-stitch">
            <DropdownMenuItem onClick={() => navigate('/payments')} className="text-stitch-text hover:bg-stitch-surface-elevated">
              Todos los pagos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/payments?status=confirmed')} className="text-stitch-text hover:bg-stitch-surface-elevated">
              Confirmados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/payments?status=pending')} className="text-stitch-text hover:bg-stitch-surface-elevated">
              Pendientes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/payments?status=rejected')} className="text-stitch-text hover:bg-stitch-surface-elevated">
              Rechazados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          className="gap-2 text-stitch-muted hover:text-stitch-text hover:bg-stitch-surface rounded-xl"
          onClick={handleSync}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Sincronizar</span>
        </Button>
        <Button
          variant="ghost"
          className="gap-2 text-stitch-muted hover:text-stitch-text hover:bg-stitch-surface rounded-xl"
          onClick={handleExportCSV}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">CSV</span>
        </Button>
      </div>
      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
