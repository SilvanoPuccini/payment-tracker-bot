import { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Image,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageSquare,
  Zap,
  Bot,
  User,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PaymentContext, AIAnalysis } from './types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface AIAssistantProps {
  initialQuestion?: string;
  paymentContext?: PaymentContext;
  onBack: () => void;
  onCreateTicket: (analysis?: AIAnalysis) => void;
}

interface AnalysisResult {
  diagnosis: string;
  explanation: string;
  recommendation: string;
  resolved: boolean;
  confidence: number;
  category?: string;
  suggestedActions?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: AnalysisResult;
}

// Preguntas sugeridas rápidas
const quickQuestions = [
  { icon: '💳', text: 'Pago no detectado', query: 'Un pago de mi cliente no fue detectado automáticamente' },
  { icon: '📱', text: 'WhatsApp desconectado', query: 'Mi WhatsApp se desconectó y no recibo mensajes' },
  { icon: '🔢', text: 'Monto incorrecto', query: 'El monto detectado es diferente al real del comprobante' },
  { icon: '👥', text: 'Contacto duplicado', query: 'Tengo el mismo contacto duplicado con diferentes números' },
];

// Llamar a la Edge Function de AI Support
const analyzeWithAI = async (problem: string, context?: PaymentContext): Promise<AnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-support', {
      body: {
        problem,
        context: context ? {
          contactName: context.contactName,
          amount: context.amount,
          date: context.date,
          paymentId: context.paymentId,
        } : undefined,
      },
    });

    if (error) {
      console.error('Error calling AI support:', error);
      throw new Error(error.message);
    }

    if (data?.success && data?.analysis) {
      return {
        diagnosis: data.analysis.diagnosis,
        explanation: data.analysis.explanation,
        recommendation: data.analysis.recommendation,
        resolved: data.analysis.resolved,
        confidence: data.analysis.confidence,
        category: data.analysis.category,
        suggestedActions: data.analysis.suggestedActions,
      };
    }

    throw new Error('Respuesta inválida del servidor');
  } catch (error) {
    console.error('Error en análisis IA:', error);
    return {
      diagnosis: 'No se pudo conectar con el asistente IA',
      explanation: 'Hubo un problema al procesar tu consulta. Esto puede deberse a una conexión lenta o un error temporal.',
      recommendation: 'Por favor intenta nuevamente en unos segundos o crea un ticket de soporte para asistencia inmediata.',
      resolved: false,
      confidence: 0,
    };
  }
};

export function AIAssistant({
  initialQuestion = '',
  paymentContext,
  onBack,
  onCreateTicket,
}: AIAssistantProps) {
  const [problem, setProblem] = useState(initialQuestion);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (query?: string) => {
    const questionText = query || problem;
    if (!questionText.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: questionText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setProblem('');
    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const analysis = await analyzeWithAI(questionText, paymentContext);
      setLastAnalysis(analysis);

      // Agregar respuesta de la IA
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: analysis.explanation,
        timestamp: new Date(),
        analysis,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error analyzing:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTicketWithContext = () => {
    if (lastAnalysis) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      onCreateTicket({
        id: `ai-${Date.now()}`,
        timestamp: new Date(),
        problem: lastUserMessage?.content || problem,
        diagnosis: lastAnalysis.diagnosis,
        explanation: lastAnalysis.explanation,
        recommendation: lastAnalysis.recommendation,
        resolved: lastAnalysis.resolved,
        paymentContext,
      });
    } else {
      onCreateTicket();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setLastAnalysis(null);
    setFeedback(null);
    setProblem('');
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      payment: { label: 'Pagos', color: 'bg-blue-500/20 text-blue-400' },
      whatsapp: { label: 'WhatsApp', color: 'bg-green-500/20 text-green-400' },
      account: { label: 'Cuenta', color: 'bg-purple-500/20 text-purple-400' },
      technical: { label: 'Técnico', color: 'bg-orange-500/20 text-orange-400' },
      other: { label: 'General', color: 'bg-slate-500/20 text-slate-400' },
    };
    return labels[category || 'other'] || labels.other;
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <Bot className="w-4 h-4 text-white" />
              </div>
              Asistente IA
            </h1>
            <p className="text-xs text-slate-500">Powered by Gemini</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleNewConversation}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Nueva conversación"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Payment Context Banner */}
      {paymentContext && (
        <div className="mt-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Contexto del pago</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Image className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{paymentContext.contactName || 'Comprobante'}</p>
              <p className="text-xs text-slate-400">
                {paymentContext.amount && `$${paymentContext.amount.toLocaleString()}`}
                {paymentContext.date && ` • ${paymentContext.date}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[200px]">
        {messages.length === 0 ? (
          // Estado inicial - Bienvenida y preguntas rápidas
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">¡Hola! Soy tu asistente de soporte</p>
                  <p className="text-xs text-emerald-400/80">Disponible 24/7</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Puedo ayudarte con problemas de pagos, conexión de WhatsApp, configuración de tu cuenta y más.
                Describe tu problema o elige una opción rápida.
              </p>
            </div>

            {/* Quick Questions */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                Preguntas frecuentes
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnalyze(q.query)}
                    disabled={isAnalyzing}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left hover:bg-slate-800 hover:border-emerald-500/30 transition-all group disabled:opacity-50"
                  >
                    <span className="text-lg mb-1 block">{q.icon}</span>
                    <p className="text-sm text-slate-300 group-hover:text-white transition-colors">{q.text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Chat Messages
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={cn(
                  'max-w-[85%] rounded-2xl p-4',
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-white rounded-br-md'
                    : 'bg-slate-800/70 border border-slate-700/50 rounded-bl-md'
                )}>
                  {msg.role === 'assistant' && msg.analysis && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          getCategoryLabel(msg.analysis.category).color
                        )}>
                          {getCategoryLabel(msg.analysis.category).label}
                        </span>
                        <span className={cn(
                          'flex items-center gap-1 text-xs',
                          msg.analysis.resolved ? 'text-emerald-400' : 'text-amber-400'
                        )}>
                          {msg.analysis.resolved ? (
                            <><CheckCircle className="w-3 h-3" /> Resuelto</>
                          ) : (
                            <><AlertCircle className="w-3 h-3" /> Requiere acción</>
                          )}
                        </span>
                      </div>
                      <p className="font-medium text-white text-sm mb-2">{msg.analysis.diagnosis}</p>
                    </div>
                  )}

                  <p className={cn(
                    'text-sm leading-relaxed',
                    msg.role === 'user' ? 'text-white' : 'text-slate-300'
                  )}>
                    {msg.content}
                  </p>

                  {msg.role === 'assistant' && msg.analysis && (
                    <>
                      {/* Recommendation */}
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-emerald-400 font-medium mb-1">💡 Recomendación:</p>
                        <p className="text-sm text-slate-300">{msg.analysis.recommendation}</p>
                      </div>

                      {/* Suggested Actions */}
                      {msg.analysis.suggestedActions && msg.analysis.suggestedActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.analysis.suggestedActions.map((action, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700/50 text-xs text-slate-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {action}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <p className={cn(
                    'text-xs mt-2',
                    msg.role === 'user' ? 'text-emerald-200/70' : 'text-slate-500'
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isAnalyzing && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-bl-md p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analizando tu consulta...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Section */}
      {messages.length > 0 && lastAnalysis && !isAnalyzing && (
        <div className="py-3 border-t border-slate-800">
          {feedback ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {feedback === 'helpful' ? '✨ ¡Gracias por tu feedback!' : '📝 Entendido, lo tendremos en cuenta'}
              </p>
              {feedback === 'not_helpful' && (
                <button
                  onClick={handleCreateTicketWithContext}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
                >
                  Crear ticket
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">¿Te fue útil?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedback('helpful')}
                  className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFeedback('not_helpful')}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Escribe tu pregunta..."
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              className="min-h-[50px] max-h-[120px] pr-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 resize-none"
              rows={1}
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={!problem.trim() || isAnalyzing}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          <MessageSquare className="w-3 h-3 inline mr-1" />
          Presiona Enter para enviar
        </p>
      </div>
    </div>
  );
}
