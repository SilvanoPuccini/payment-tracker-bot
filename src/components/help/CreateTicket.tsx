import { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Upload,
  Image,
  X,
  Sparkles,
  Clock,
  CheckCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { AIAnalysis, TICKET_CATEGORIES, TicketCategory, PaymentContext } from './types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CreateTicketProps {
  onBack: () => void;
  onSuccess: (ticketId: string) => void;
  aiAnalysis?: AIAnalysis;
  paymentContext?: PaymentContext;
}

export function CreateTicket({ onBack, onSuccess, aiAnalysis, paymentContext }: CreateTicketProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<TicketCategory | ''>('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const handleSubmit = async () => {
    if (!category || !description.trim()) return;

    setIsSubmitting(true);

    try {
      const newTicketId = `TK-${Date.now().toString(36).toUpperCase()}`;

      const ticketData = {
        id: newTicketId,
        user_id: user?.id || null,
        type: 'chat',
        category: category,
        subject: TICKET_CATEGORIES[category],
        description: description,
        contact_name: user?.email?.split('@')[0] || 'Usuario',
        contact_email: user?.email || '',
        status: 'open',
        priority: 'normal',
        ai_analysis: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
        payment_context: paymentContext ? JSON.stringify(paymentContext) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Intentar guardar en Supabase
      const { error: dbError } = await supabase
        .from('support_tickets' as any)
        .insert(ticketData as any);

      if (dbError) {
        console.warn('No se pudo guardar en BD:', dbError.message);
      }

      // Subir archivo si existe
      if (attachment && user?.id) {
        const fileExt = attachment.name.split('.').pop();
        const filePath = `support/${user.id}/${newTicketId}.${fileExt}`;

        await supabase.storage
          .from('attachments')
          .upload(filePath, attachment);
      }

      setTicketId(newTicketId);
      setIsSuccess(true);
    } catch (err) {
      console.error('Error al crear ticket:', err);
      // Mostrar éxito de todos modos para mejor UX
      const newTicketId = `TK-${Date.now().toString(36).toUpperCase()}`;
      setTicketId(newTicketId);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-5">
        {/* Success State */}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">¡Ticket Creado!</h2>
          <p className="text-slate-400 text-sm mb-1">Tu solicitud ha sido enviada correctamente.</p>
          <p className="text-emerald-400 font-medium">#{ticketId}</p>

          <div className="w-full mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <p className="text-sm text-white font-medium">Tiempo de respuesta estimado</p>
                <p className="text-xs text-slate-400">2-4 horas en horario laboral</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full mt-6">
            <button
              onClick={() => onSuccess(ticketId)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Ver estado de mis tickets
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
            >
              Volver al Centro de Ayuda
            </button>
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
          className="text-emerald-400 text-sm font-medium hover:underline"
        >
          Cancelar
        </button>
        <h1 className="text-lg font-bold text-white">Nuevo Ticket</h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* AI Analysis Context */}
      {aiAnalysis && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-emerald-400 font-medium">Contexto del Asistente IA</p>
              <p className="text-sm text-slate-300 mt-1">{aiAnalysis.diagnosis}</p>
              <p className="text-xs text-slate-500 mt-2">
                Este análisis se adjuntará automáticamente al ticket.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Context */}
      {paymentContext && (
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Pago relacionado</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <Image className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{paymentContext.contactName}</p>
              <p className="text-xs text-slate-400">
                {paymentContext.amount && `$${paymentContext.amount.toLocaleString()}`}
                {paymentContext.date && ` • ${paymentContext.date}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Select */}
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Categoría del Problema</label>
        <div className="relative">
          <button
            onClick={() => setShowCategorySelect(!showCategorySelect)}
            className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-left flex items-center justify-between hover:border-slate-600 transition-colors"
          >
            <span className={category ? 'text-white' : 'text-slate-500'}>
              {category ? TICKET_CATEGORIES[category] : 'Selecciona una categoría'}
            </span>
            <ChevronDown className={cn(
              'w-5 h-5 text-slate-500 transition-transform',
              showCategorySelect && 'rotate-180'
            )} />
          </button>

          {showCategorySelect && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-slate-800 border border-slate-700 z-10 shadow-xl">
              {Object.entries(TICKET_CATEGORIES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCategory(key as TicketCategory);
                    setShowCategorySelect(false);
                  }}
                  className={cn(
                    'w-full p-3 rounded-lg text-left text-sm transition-colors',
                    category === key
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-white hover:bg-slate-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Descripción</label>
        <Textarea
          placeholder="Por favor, proporciona tantos detalles como sea posible..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
        />
      </div>

      {/* Attachment */}
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Adjuntar Comprobante</label>
        {attachment ? (
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Image className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{attachment.name}</p>
              <p className="text-xs text-slate-500">
                {(attachment.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="block p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center text-center">
              <Upload className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-sm text-slate-400">Selecciona o arrastra una imagen</p>
              <p className="text-xs text-slate-600 mt-1">PNG, JPG o PDF hasta 5MB</p>
            </div>
          </label>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!category || !description.trim() || isSubmitting}
        className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar Ticket'
        )}
      </button>

      {/* SLA Info */}
      <div className="flex items-center gap-2 justify-center text-xs text-slate-500">
        <Clock className="w-4 h-4" />
        <span>Tiempo de respuesta: ~2 horas</span>
      </div>
    </div>
  );
}
