import { useState } from 'react';
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
} from 'lucide-react';
import { SupportTicket, TICKET_STATUS_CONFIG, TICKET_CATEGORIES, TicketStatus as TicketStatusType } from './types';
import { cn } from '@/lib/utils';

interface TicketStatusProps {
  onBack: () => void;
  onCreateTicket: () => void;
}

// Mock data - En producción vendría de la API
const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'TK-8E29',
    userId: '1',
    category: 'pago_no_detectado',
    description: 'El pago de María no fue detectado',
    status: 'in_review',
    createdAt: new Date(Date.now() - 7200000), // 2 horas
    updatedAt: new Date(Date.now() - 3600000),
    estimatedResponseTime: '~1 hora',
    paymentContext: {
      paymentId: 'pay-123',
      contactName: 'María Silva',
      amount: 15000,
    },
  },
  {
    id: 'TK-7F41',
    userId: '1',
    category: 'pago_incorrecto',
    description: 'Ticket Creado',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000), // 1 día
    updatedAt: new Date(Date.now() - 86400000),
    aiAnalysis: {
      id: 'ai-1',
      timestamp: new Date(),
      problem: 'Análisis por IA Iniciado',
      diagnosis: 'Procesando...',
      explanation: '',
      recommendation: '',
      resolved: false,
    },
  },
  {
    id: 'TK-6T01',
    userId: '1',
    category: 'conexion_whatsapp',
    description: 'Limite de tasa excedido',
    status: 'in_review',
    createdAt: new Date(Date.now() - 172800000), // 2 días
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'TK-8E55',
    userId: '1',
    category: 'error_sistema',
    description: 'Error de actualización del último problema reportado',
    status: 'pending',
    createdAt: new Date(Date.now() - 259200000), // 3 días
    updatedAt: new Date(Date.now() - 172800000),
  },
];

const STATUS_FILTERS: { value: TicketStatusType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'En Revisión' },
  { value: 'in_review', label: 'Pendientes' },
  { value: 'resolved', label: 'Resueltos' },
];

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
  const [statusFilter, setStatusFilter] = useState<TicketStatusType | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const filteredTickets = MOCK_TICKETS.filter(
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
        <p className="text-sm text-slate-400 mb-3">Tickets Recientes</p>
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
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
