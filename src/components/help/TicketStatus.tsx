import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Sparkles,
  MessageCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { SupportTicket, TICKET_STATUS_CONFIG, TICKET_CATEGORIES, TicketStatus as TicketStatusType, TicketCategory } from './types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

interface TicketStatusProps {
  onBack: () => void;
  onCreateTicket: () => void;
}

interface DBTicket {
  id: string;
  user_id: string | null;
  type: string;
  category: string;
  subject: string;
  description: string;
  contact_name: string;
  contact_email: string;
  status: string;
  priority: string;
  ai_analysis: Json | null;
  payment_context: Json | null;
  created_at: string;
  updated_at: string;
  response: string | null;
}

const STATUS_FILTERS: { value: TicketStatusType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'in_review', label: 'En Revisión' },
  { value: 'resolved', label: 'Resueltos' },
];

// Mapeo de status de DB a status del componente
const mapDBStatus = (status: string): TicketStatusType => {
  if (status === 'open' || status === 'pending') return 'pending';
  if (status === 'in_progress' || status === 'in_review') return 'in_review';
  if (status === 'resolved' || status === 'closed') return 'resolved';
  return 'pending';
};

// Convertir ticket de DB a SupportTicket
const convertDBTicket = (dbTicket: DBTicket): SupportTicket => {
  return {
    id: dbTicket.id,
    userId: dbTicket.user_id || '',
    category: (dbTicket.category as TicketCategory) || 'otro',
    description: dbTicket.description || dbTicket.subject,
    status: mapDBStatus(dbTicket.status),
    createdAt: new Date(dbTicket.created_at),
    updatedAt: new Date(dbTicket.updated_at),
    aiAnalysis: dbTicket.ai_analysis ? (typeof dbTicket.ai_analysis === 'string' ? JSON.parse(dbTicket.ai_analysis) : dbTicket.ai_analysis) : undefined,
    paymentContext: dbTicket.payment_context ? (typeof dbTicket.payment_context === 'string' ? JSON.parse(dbTicket.payment_context) : dbTicket.payment_context) : undefined,
  };
};

const StatusBadge = ({ status }: { status: TicketStatusType }) => {
  const config = TICKET_STATUS_CONFIG[status];
  const colors = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    in_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium border',
      colors[status]
    )}>
      {config.label}
    </span>
  );
};

const StatusIcon = ({ status }: { status: TicketStatusType }) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-amber-400" />;
    case 'in_review':
      return <AlertCircle className="w-4 h-4 text-blue-400" />;
    case 'resolved':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  }
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Hace un momento';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
  return `Hace ${Math.floor(seconds / 86400)} días`;
};

export function TicketStatus({ onBack, onCreateTicket }: TicketStatusProps) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TicketStatusType | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar tickets desde Supabase
  const loadTickets = useCallback(async () => {
    if (!user?.id) {
      setTickets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Error fetching tickets:', fetchError.message);
        setTickets([]);
      } else if (data) {
        const convertedTickets = (data as unknown as DBTicket[]).map(convertDBTicket);
        setTickets(convertedTickets);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filteredTickets = tickets.filter(
    (ticket) => statusFilter === 'all' || ticket.status === statusFilter
  );

  if (selectedTicket) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedTicket(null)}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Ticket #{selectedTicket.id}</h1>
            <StatusBadge status={selectedTicket.status} />
          </div>
        </div>

        {/* Ticket Details */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Categoría</p>
            <p className="text-white font-medium">{TICKET_CATEGORIES[selectedTicket.category]}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Descripción</p>
            <p className="text-slate-300 text-sm">{selectedTicket.description}</p>
          </div>

          {selectedTicket.paymentContext && (
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Pago Relacionado</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedTicket.paymentContext.contactName}</p>
                  <p className="text-xs text-slate-400">
                    ${selectedTicket.paymentContext.amount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedTicket.aiAnalysis && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-emerald-400 font-medium">Análisis IA</p>
                  <p className="text-sm text-slate-300 mt-1">{selectedTicket.aiAnalysis.diagnosis}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Historial</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5" />
                <div>
                  <p className="text-sm text-white">Ticket creado</p>
                  <p className="text-xs text-slate-500">{formatTimeAgo(selectedTicket.createdAt)}</p>
                </div>
              </div>
              {selectedTicket.status !== 'pending' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                  <div>
                    <p className="text-sm text-white">En revisión por soporte</p>
                    <p className="text-xs text-slate-500">{formatTimeAgo(selectedTicket.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white">Estado de Mis Tickets</h1>
        <button
          onClick={onCreateTicket}
          className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              statusFilter === filter.value
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-400">Tickets Recientes</p>
          <button
            onClick={loadTickets}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-emerald-400 mx-auto mb-3 animate-spin" />
              <p className="text-slate-400 text-sm">Cargando tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay tickets</p>
              <button
                onClick={onCreateTicket}
                className="mt-3 text-emerald-400 text-sm hover:underline flex items-center gap-1 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Crear nuevo ticket
              </button>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-800/50 hover:border-slate-600 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StatusIcon status={ticket.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">#{ticket.id}</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500">{TICKET_CATEGORIES[ticket.category]}</span>
                      </div>
                      <p className="text-sm text-white truncate">{ticket.description}</p>
                      {ticket.aiAnalysis && (
                        <div className="flex items-center gap-1 mt-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-emerald-400">{ticket.aiAnalysis.problem}</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{formatTimeAgo(ticket.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={ticket.status} />
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800">
        <p className="text-xs text-slate-500">
          Los tickets se responden en orden de prioridad. Los usuarios Premium tienen respuesta garantizada en menos de 2 horas.
        </p>
      </div>
    </div>
  );
}
