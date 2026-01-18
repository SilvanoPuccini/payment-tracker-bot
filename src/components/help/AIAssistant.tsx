import { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Image,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Loader2,
  MessageCircle,
  AlertTriangle,
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
    // Fallback response si la API falla
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
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [analysisHistory] = useState<{ timestamp: Date; problem: string }[]>([
    // Mock history
    { timestamp: new Date(Date.now() - 86400000), problem: 'Pago no detectado de Juan Pérez' },
    { timestamp: new Date(Date.now() - 172800000), problem: '¿Cómo cambio la moneda?' },
  ]);

  const handleAnalyze = async () => {
    if (!problem.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    setFeedback(null);

    try {
      const analysis = await analyzeWithAI(problem, paymentContext);
      setResult(analysis);
    } catch (error) {
      console.error('Error analyzing:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTicketWithContext = () => {
    if (result) {
      onCreateTicket({
        id: `ai-${Date.now()}`,
        timestamp: new Date(),
        problem,
        diagnosis: result.diagnosis,
        explanation: result.explanation,
        recommendation: result.recommendation,
        resolved: result.resolved,
        paymentContext,
      });
    } else {
      onCreateTicket();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Asistente IA
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </h1>
        </div>
      </div>

      {/* Analysis Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-emerald-400 text-sm">Análisis Inteligente</p>
            <p className="text-xs text-slate-400 mt-1">
              He detectado un problema con un pago reciente de WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Context */}
      {paymentContext && (
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Contexto del pago</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <Image className="w-6 h-6 text-slate-400" />
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

      {/* Problem Input */}
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Describe tu problema</label>
        <Textarea
          placeholder="Ej: El pago de María no fue detectado aunque envió el comprobante..."
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          className="min-h-[100px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
        />
        <button
          onClick={handleAnalyze}
          disabled={!problem.trim() || isAnalyzing}
          className="mt-3 w-full py-3 rounded-xl bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Analizar con IA
            </>
          )}
        </button>
      </div>

      {/* Analysis Result */}
      {result && (
        <div className="space-y-4">
          {/* Diagnosis Card */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn(
                'p-2 rounded-lg',
                result.resolved ? 'bg-emerald-500/20' : 'bg-amber-500/20'
              )}>
                {result.resolved ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Informe de Diagnóstico</p>
                <p className={cn(
                  'font-medium text-sm mt-1',
                  result.resolved ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {result.diagnosis}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>

            <button className="mt-3 text-xs text-emerald-400 hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Ver original
            </button>
          </div>

          {/* Recommendation */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-medium mb-2">Recomendación de la IA:</p>
            <p className="text-sm text-slate-300 leading-relaxed">{result.recommendation}</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              Tiempo de respuesta: ~2 horas
            </div>
          </div>

          {/* Feedback */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-3">¿Te resultó útil este análisis?</p>
            {feedback ? (
              <p className="text-sm text-emerald-400">
                {feedback === 'helpful' ? '¡Gracias! Me alegra haber ayudado.' : 'Entendido. ¿Quieres crear un ticket para soporte humano?'}
              </p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedback('helpful')}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium text-sm hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Esto me sirvió
                </button>
                <button
                  onClick={() => setFeedback('not_helpful')}
                  className="flex-1 py-2.5 rounded-lg bg-slate-700/50 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  No me ayudó
                </button>
              </div>
            )}

            {feedback === 'not_helpful' && (
              <button
                onClick={handleCreateTicketWithContext}
                className="mt-3 w-full py-3 rounded-xl bg-slate-700 text-white font-medium flex items-center justify-center gap-2 hover:bg-slate-600 transition-all"
              >
                <FileText className="w-5 h-5" />
                Crear un ticket
              </button>
            )}
          </div>
        </div>
      )}

      {/* Analysis History */}
      {!result && analysisHistory.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Análisis recientes</p>
          <div className="space-y-2">
            {analysisHistory.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setProblem(item.problem)}
                className="w-full p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.problem}</p>
                    <p className="text-xs text-slate-500">
                      {item.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
