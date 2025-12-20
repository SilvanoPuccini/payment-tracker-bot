import { Download, RefreshCw, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <div className="flex flex-wrap items-center gap-3 animate-slide-up" style={{ animationDelay: "50ms" }}>
      <Button variant="default" className="gap-2">
        <Plus className="h-4 w-4" />
        Registrar Pago
      </Button>
      <Button variant="outline" className="gap-2">
        <Filter className="h-4 w-4" />
        Filtros
      </Button>
      <Button variant="ghost" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Sincronizar
      </Button>
      <Button variant="ghost" className="gap-2">
        <Download className="h-4 w-4" />
        Exportar CSV
      </Button>
    </div>
  );
}
