import { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronUp,
  Shield,
  Scale,
  Mail,
  Building2,
  Bot,
  Smartphone,
  CreditCard,
  Users,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TermsAndConditionsProps {
  onBack: () => void;
}

interface Section {
  id: string;
  number: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const LAST_UPDATE = '18 de enero, 2026';
const COMPANY_NAME = 'PayTrack';
const COMPANY_EMAIL = 'soporte@paytrack.app';
const COMPANY_LEGAL = 'PayTrack Technologies';
const JURISDICTION = 'República Argentina';

export function TermsAndConditions({ onBack }: TermsAndConditionsProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['intro']);
  const [showQuickSummary, setShowQuickSummary] = useState(true);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedSections(sections.map(s => s.id));
  };

  const collapseAll = () => {
    setExpandedSections([]);
  };

  const sections: Section[] = [
    {
      id: 'intro',
      number: '1',
      title: 'Introducción',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">1.1 Identificación del Servicio</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} es una plataforma de gestión de pagos y cuentas por cobrar diseñada específicamente para
              freelancers, emprendedores y pequeñas empresas en Latinoamérica. Nuestro servicio permite automatizar
              el seguimiento de pagos recibidos a través de WhatsApp mediante el uso de inteligencia artificial.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">1.2 Aceptación de los Términos</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Al acceder, registrarse o utilizar los servicios proporcionados por {COMPANY_NAME}, usted declara haber
              leído, comprendido y aceptado estar legalmente vinculado por estos Términos y Condiciones. Si no está
              de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">1.3 Alcance del Documento</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Estos términos regulan la relación entre {COMPANY_NAME} y sus usuarios, estableciendo los derechos y
              obligaciones de ambas partes. Este documento complementa nuestra Política de Privacidad y cualquier
              otro acuerdo específico que pueda aplicar según el plan contratado.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'definitions',
      number: '2',
      title: 'Definiciones',
      icon: <Bookmark className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm mb-4">
            Para efectos de estos Términos y Condiciones, los siguientes términos tendrán el significado indicado:
          </p>
          <div className="space-y-3">
            {[
              { term: 'Servicio', def: `La plataforma ${COMPANY_NAME}, incluyendo la aplicación web, aplicación móvil (PWA), APIs y todas las funcionalidades asociadas.` },
              { term: 'Usuario', def: 'Toda persona física o jurídica que se registra y/o utiliza el Servicio, ya sea en modalidad gratuita o de pago.' },
              { term: 'Cuenta', def: 'El perfil personal del Usuario dentro del Servicio, que incluye sus credenciales de acceso, configuraciones y datos asociados.' },
              { term: 'WhatsApp Business Cloud API', def: 'La interfaz de programación oficial proporcionada por Meta Platforms, Inc. que permite a aplicaciones de terceros interactuar con la plataforma de mensajería WhatsApp Business.' },
              { term: 'Inteligencia Artificial (IA)', def: 'Los sistemas de aprendizaje automático y procesamiento de lenguaje natural utilizados por el Servicio para analizar mensajes y detectar información de pagos.' },
              { term: 'Pagos Detectados', def: 'Las transacciones financieras identificadas automáticamente por el sistema de IA a partir de mensajes, imágenes de comprobantes u otros datos proporcionados por los contactos del Usuario.' },
              { term: 'Contactos', def: 'Las personas que envían mensajes al número de WhatsApp del Usuario y cuyos datos de pago son procesados por el Servicio.' },
              { term: 'Ticket de Soporte', def: 'Una solicitud formal de asistencia técnica o consulta enviada por el Usuario a través de los canales oficiales de soporte.' },
              { term: 'Recordatorio', def: 'Mensaje automatizado enviado a los Contactos del Usuario para notificar sobre pagos pendientes o próximos a vencer.' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <span className="font-medium text-emerald-400">{item.term}:</span>
                <span className="text-slate-300 text-sm ml-2">{item.def}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'service-description',
      number: '3',
      title: 'Descripción del Servicio',
      icon: <CreditCard className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">3.1 Qué hace {COMPANY_NAME}</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>Seguimiento y gestión de pagos y cuentas por cobrar</li>
              <li>Recepción y procesamiento de mensajes de WhatsApp Business</li>
              <li>Detección automática de pagos mediante inteligencia artificial</li>
              <li>Extracción de información (montos, fechas, métodos de pago, referencias)</li>
              <li>Gestión de contactos y base de datos de clientes</li>
              <li>Automatización de recordatorios de pago vía WhatsApp</li>
              <li>Generación de reportes financieros y analíticas básicas</li>
              <li>Exportación de datos en múltiples formatos (PDF, Excel)</li>
              <li>Soporte técnico mediante asistente IA y tickets</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">3.2 Qué NO hace {COMPANY_NAME}</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>No es un servicio de procesamiento de pagos ni pasarela de pago</li>
              <li>No realiza transferencias ni movimientos de dinero</li>
              <li>No almacena datos bancarios sensibles de los usuarios</li>
              <li>No reemplaza la asesoría contable o fiscal profesional</li>
              <li>No garantiza la veracidad de los comprobantes recibidos</li>
              <li>No verifica la identidad de los contactos que envían mensajes</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">3.3 Limitaciones del Servicio</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Servicio depende de la disponibilidad de servicios de terceros (WhatsApp, proveedores de IA,
              infraestructura en la nube). La precisión de la detección automática de pagos puede variar según
              la calidad de las imágenes, claridad de los mensajes y formato de los comprobantes. Se recomienda
              siempre verificar manualmente los pagos detectados.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'eligibility',
      number: '4',
      title: 'Elegibilidad del Usuario',
      icon: <Users className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">4.1 Requisitos para usar el Servicio</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>Ser mayor de 18 años o tener capacidad legal para contratar</li>
              <li>Disponer de un número de teléfono compatible con WhatsApp Business</li>
              <li>Proporcionar información veraz y actualizada al registrarse</li>
              <li>Aceptar estos Términos y Condiciones y la Política de Privacidad</li>
              <li>No haber sido previamente suspendido o expulsado del Servicio</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">4.2 Responsabilidad del Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Usuario es responsable de todas las actividades realizadas bajo su Cuenta, incluyendo las acciones
              de terceros que accedan con sus credenciales. El Usuario debe notificar inmediatamente cualquier uso
              no autorizado de su Cuenta.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">4.3 Uso Comercial Permitido</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} está diseñado exclusivamente para uso comercial legítimo. Queda prohibido utilizar el
              Servicio para actividades ilegales, fraudulentas o que violen los términos de servicio de WhatsApp.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'account',
      number: '5',
      title: 'Registro y Cuenta',
      icon: <Lock className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">5.1 Creación de Cuenta</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Para utilizar el Servicio, el Usuario debe crear una Cuenta proporcionando información veraz,
              completa y actualizada. Ofrecemos registro mediante correo electrónico y contraseña, o a través
              de proveedores de autenticación de terceros (Google). El Usuario se compromete a mantener
              actualizada su información de perfil.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">5.2 Seguridad de Credenciales</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.
              Recomendamos usar contraseñas únicas y seguras, y activar la autenticación de dos factores
              cuando esté disponible. {COMPANY_NAME} nunca solicitará su contraseña por correo electrónico
              ni otros medios.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">5.3 Responsabilidad sobre el Acceso</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Cualquier actividad realizada desde su Cuenta se presume realizada por el Usuario. En caso de
              detectar acceso no autorizado, el Usuario debe cambiar su contraseña inmediatamente y contactar
              a soporte técnico.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'whatsapp',
      number: '6',
      title: 'Integración con WhatsApp',
      icon: <Smartphone className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">6.1 Uso de WhatsApp Business Cloud API</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} utiliza la API oficial de WhatsApp Business Cloud proporcionada por Meta Platforms, Inc.
              El Usuario debe cumplir con los Términos de Servicio de WhatsApp Business y las políticas de Meta
              para el uso de la API. El Usuario es responsable de obtener y mantener las aprobaciones necesarias
              de Meta para su caso de uso específico.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">6.2 Dependencia de Servicios de Terceros</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              La funcionalidad de mensajería depende completamente de los servicios de Meta/WhatsApp.
              {COMPANY_NAME} no tiene control sobre la disponibilidad, cambios o interrupciones de estos
              servicios externos. Meta puede modificar sus políticas, límites de uso o funcionalidades
              en cualquier momento.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">6.3 Limitaciones y Posibles Interrupciones</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>Límites de mensajes según el tier de la cuenta de WhatsApp Business</li>
              <li>Posibles retrasos en la entrega de mensajes por congestión de la red</li>
              <li>Sesiones de WhatsApp Web que pueden expirar y requerir reconexión</li>
              <li>Cambios en las políticas de Meta que pueden afectar funcionalidades</li>
              <li>Mantenimiento programado de los servidores de WhatsApp</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'ai',
      number: '7',
      title: 'Uso de Inteligencia Artificial',
      icon: <Bot className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">7.1 Rol de la IA en la Detección de Pagos</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} utiliza modelos de inteligencia artificial (incluyendo Google Gemini) para:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Analizar mensajes de texto para detectar información de pagos</li>
              <li>Procesar imágenes de comprobantes para extraer montos y detalles</li>
              <li>Categorizar y organizar automáticamente las transacciones</li>
              <li>Proporcionar asistencia automatizada en el soporte al usuario</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">7.2 Alcance y Limitaciones</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los sistemas de IA tienen limitaciones inherentes. La precisión de la detección depende de
              múltiples factores: calidad de imagen, claridad del texto, formato del comprobante, idioma
              utilizado y complejidad de la información. Los modelos de IA pueden mejorar con el tiempo
              pero también pueden cometer errores.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">7.3 No Garantía de Precisión Absoluta</h4>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-400 text-sm font-medium mb-1">Importante:</p>
              <p className="text-slate-300 text-sm">
                {COMPANY_NAME} NO garantiza la precisión absoluta de la detección automática de pagos.
                Los resultados de la IA deben considerarse como una ayuda, no como información definitiva.
                El Usuario es responsable de verificar y validar todos los pagos detectados.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">7.4 Supervisión Humana Recomendada</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Recomendamos encarecidamente que el Usuario revise periódicamente los pagos detectados,
              especialmente aquellos marcados con baja confianza. La supervisión humana es esencial
              para garantizar la exactitud de sus registros financieros.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'payments',
      number: '8',
      title: 'Pagos y Detección Automática',
      icon: <CreditCard className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">8.1 Funcionamiento de la Detección</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Cuando un contacto envía un mensaje a través de WhatsApp, el sistema analiza automáticamente
              el contenido (texto e imágenes) buscando indicadores de pago. Si se detecta información de
              pago, se crea un registro con: monto estimado, fecha, método de pago inferido, referencia
              (si existe) y nivel de confianza de la detección.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">8.2 Validación por parte del Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Cada pago detectado requiere validación del Usuario. El sistema permite confirmar, modificar
              o rechazar los pagos detectados. Los pagos confirmados se integran en los reportes y estadísticas.
              Los pagos rechazados se archivan pero no se eliminan permanentemente.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">8.3 Errores, Duplicados e Inconsistencias</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El sistema incluye mecanismos para detectar posibles duplicados, pero no puede garantizar
              su eliminación total. Pueden ocurrir: detecciones duplicadas del mismo pago, montos incorrectos,
              fechas erróneas, o falsos positivos (mensajes detectados como pagos que no lo son). El Usuario
              tiene herramientas para corregir estos errores manualmente.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'obligations',
      number: '9',
      title: 'Obligaciones del Usuario',
      icon: <CheckCircle className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">9.1 Uso Correcto del Servicio</h4>
            <p className="text-slate-300 text-sm leading-relaxed">El Usuario se compromete a:</p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Utilizar el Servicio únicamente para fines comerciales legítimos</li>
              <li>No intentar acceder a cuentas de otros usuarios</li>
              <li>No realizar ingeniería inversa ni intentar extraer el código fuente</li>
              <li>No utilizar bots, scripts o herramientas automatizadas no autorizadas</li>
              <li>No enviar spam ni contenido malicioso a través del sistema</li>
              <li>Respetar los límites de uso establecidos según su plan</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">9.2 Información Veraz</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Usuario garantiza que toda la información proporcionada es verdadera, precisa y actualizada.
              {COMPANY_NAME} se reserva el derecho de suspender cuentas que contengan información falsa o
              fraudulenta.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">9.3 Cumplimiento de Leyes Aplicables</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Usuario es responsable de cumplir con todas las leyes y regulaciones aplicables en su
              jurisdicción, incluyendo pero no limitado a: protección de datos personales, normativas
              fiscales, regulaciones de comunicaciones electrónicas y leyes comerciales.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'support',
      number: '10',
      title: 'Soporte y Atención al Usuario',
      icon: <Mail className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">10.1 Canales de Soporte</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} ofrece soporte técnico a través de los siguientes canales oficiales:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Asistente de IA integrado (disponible 24/7)</li>
              <li>Sistema de tickets dentro de la aplicación</li>
              <li>Correo electrónico: {COMPANY_EMAIL}</li>
              <li>Centro de ayuda con documentación y guías</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">10.2 Uso del Asistente Automático</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El asistente de IA proporciona respuestas inmediatas a consultas comunes basándose en la
              documentación del servicio. Para problemas complejos o que requieran intervención humana,
              se recomienda crear un ticket de soporte.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">10.3 Creación y Gestión de Tickets</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los tickets de soporte son atendidos por nuestro equipo humano. El tiempo de respuesta
              promedio es de 20 minutos durante horario hábil. Cada ticket tiene un número único de
              seguimiento y el Usuario puede consultar su estado en cualquier momento.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      number: '11',
      title: 'Seguridad y Protección de Datos',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">11.1 Medidas de Seguridad</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} implementa medidas de seguridad estándar de la industria para proteger
              la información del Usuario:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Cifrado SSL/TLS para todas las comunicaciones</li>
              <li>Almacenamiento seguro de credenciales con hash bcrypt</li>
              <li>Infraestructura en la nube con certificaciones de seguridad</li>
              <li>Monitoreo continuo de actividades sospechosas</li>
              <li>Copias de seguridad periódicas de los datos</li>
              <li>Políticas de acceso basadas en roles (RLS)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">11.2 Procesamiento de Información</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los mensajes y comprobantes son procesados por sistemas de IA para extraer información
              de pagos. Este procesamiento es automatizado y los datos se utilizan únicamente para
              proporcionar el Servicio al Usuario.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">11.3 Almacenamiento y Retención de Datos</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los datos del Usuario se almacenan mientras la cuenta esté activa. Tras la eliminación
              de la cuenta, los datos personales se eliminan en un plazo de 30 días, salvo que exista
              obligación legal de conservarlos por un período mayor.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'privacy',
      number: '12',
      title: 'Privacidad',
      icon: <Lock className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">12.1 Relación con la Política de Privacidad</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El tratamiento de datos personales se rige por nuestra Política de Privacidad, que forma
              parte integral de estos Términos y Condiciones. Al aceptar estos términos, el Usuario
              también acepta la Política de Privacidad.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">12.2 Tratamiento de Mensajes y Comprobantes</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los mensajes de WhatsApp y comprobantes de pago son procesados con el único fin de
              proporcionar el Servicio. Esta información es confidencial y no se comparte con terceros
              excepto cuando sea necesario para el funcionamiento del servicio (proveedores de IA,
              infraestructura) o cuando sea requerido por ley.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'third-party',
      number: '13',
      title: 'Servicios de Terceros',
      icon: <Globe className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">13.1 WhatsApp / Meta</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Servicio utiliza la API de WhatsApp Business proporcionada por Meta Platforms, Inc.
              El uso de esta funcionalidad está sujeto a los términos de servicio de WhatsApp y las
              políticas de Meta. {COMPANY_NAME} no es responsable de cambios, interrupciones o
              discontinuación de los servicios de Meta.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">13.2 Proveedores de Infraestructura</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Utilizamos servicios de terceros para alojar y operar la plataforma, incluyendo:
              Supabase (base de datos y autenticación), Vercel (hosting), Google Cloud (procesamiento
              de IA). Estos proveedores cumplen con estándares de seguridad y privacidad reconocidos.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">13.3 Limitación de Responsabilidad por Terceros</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} no es responsable por las acciones, omisiones, interrupciones o cambios
              de política de los servicios de terceros utilizados. Ante problemas con estos servicios,
              haremos esfuerzos razonables por informar al Usuario y buscar alternativas cuando sea posible.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'availability',
      number: '14',
      title: 'Disponibilidad del Servicio',
      icon: <Clock className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">14.1 Acceso y Uptime</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} se esfuerza por mantener el Servicio disponible las 24 horas del día,
              los 7 días de la semana. Sin embargo, no garantizamos un uptime del 100%. Nuestro
              objetivo es mantener una disponibilidad superior al 99.5%.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">14.2 Mantenimiento</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Realizamos mantenimiento periódico para mejorar el servicio. Cuando sea posible,
              notificaremos con anticipación sobre mantenimientos programados que puedan afectar
              la disponibilidad.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">14.3 Interrupciones Programadas o No</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Pueden ocurrir interrupciones no programadas debido a: fallos técnicos, ataques de
              seguridad, problemas con proveedores de terceros, o circunstancias de fuerza mayor.
              En estos casos, trabajaremos para restaurar el servicio lo antes posible.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'termination',
      number: '15',
      title: 'Suspensión y Terminación',
      icon: <AlertTriangle className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">15.1 Suspensión de Cuentas</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} puede suspender temporalmente una cuenta en los siguientes casos:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Sospecha de actividad fraudulenta o uso indebido</li>
              <li>Violación de estos Términos y Condiciones</li>
              <li>Incumplimiento de pagos (en planes de pago)</li>
              <li>Requerimiento de autoridades competentes</li>
              <li>Actividades que pongan en riesgo la seguridad del sistema</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">15.2 Terminación por Incumplimiento</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              En caso de violaciones graves o reiteradas, {COMPANY_NAME} puede terminar la cuenta
              del Usuario de forma permanente. Se notificará al Usuario por correo electrónico
              indicando los motivos de la terminación.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">15.3 Efectos de la Terminación</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Tras la terminación, el Usuario perderá acceso al Servicio y a todos los datos
              almacenados. Recomendamos exportar sus datos antes de solicitar la eliminación de
              la cuenta. Algunas obligaciones (como confidencialidad e indemnización) sobreviven
              a la terminación.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'ip',
      number: '16',
      title: 'Propiedad Intelectual',
      icon: <Building2 className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">16.1 Titularidad del Software</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME}, su código fuente, diseño, logotipos, marcas y todo el contenido
              asociado son propiedad exclusiva de {COMPANY_LEGAL} o sus licenciantes. Todos los
              derechos están reservados.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">16.2 Licencia de Uso</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Se otorga al Usuario una licencia limitada, no exclusiva, no transferible y revocable
              para usar el Servicio de acuerdo con estos Términos. Esta licencia no incluye ningún
              derecho sobre el código fuente, arquitectura o tecnología subyacente.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">16.3 Restricciones</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Usuario no puede: copiar, modificar o distribuir el software; realizar ingeniería
              inversa; usar las marcas de {COMPANY_NAME} sin autorización; o crear obras derivadas
              del Servicio.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'liability',
      number: '17',
      title: 'Limitación de Responsabilidad',
      icon: <Scale className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">17.1 Uso Bajo Responsabilidad del Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Servicio se proporciona "tal cual" y "según disponibilidad". El Usuario utiliza
              el Servicio bajo su propia responsabilidad. {COMPANY_NAME} no garantiza que el
              Servicio sea ininterrumpido, seguro o libre de errores.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">17.2 Daños Directos e Indirectos</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              En la máxima medida permitida por la ley, {COMPANY_NAME} no será responsable por
              daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo
              pérdida de beneficios, datos, uso o goodwill, independientemente de la teoría legal.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">17.3 Exclusiones Legales</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              La responsabilidad total de {COMPANY_NAME} no excederá el monto pagado por el Usuario
              en los últimos 12 meses por el Servicio. Algunas jurisdicciones no permiten ciertas
              limitaciones, por lo que estas pueden no aplicar en su caso.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'indemnification',
      number: '18',
      title: 'Indemnización',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">18.1 Responsabilidad del Usuario ante Reclamos</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Usuario acepta indemnizar, defender y mantener indemne a {COMPANY_NAME}, sus
              directores, empleados y afiliados de cualquier reclamo, demanda, pérdida,
              responsabilidad y gastos (incluyendo honorarios de abogados) que surjan de:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>El uso del Servicio por parte del Usuario</li>
              <li>Violación de estos Términos y Condiciones</li>
              <li>Violación de derechos de terceros</li>
              <li>Contenido proporcionado o transmitido por el Usuario</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">18.2 Uso Indebido del Servicio</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Usuario es especialmente responsable por cualquier uso del Servicio que viole
              las políticas de WhatsApp, envíe spam o contenido no solicitado, o infrinja
              regulaciones de protección de datos de terceros.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'modifications',
      number: '19',
      title: 'Modificaciones de los Términos',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">19.1 Cambios en los T&C</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} se reserva el derecho de modificar estos Términos y Condiciones en
              cualquier momento. Las modificaciones serán efectivas desde su publicación en la
              plataforma, salvo que se indique lo contrario.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">19.2 Notificación al Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Notificaremos los cambios materiales mediante: aviso en la aplicación, correo
              electrónico al email registrado, o ambos. El uso continuado del Servicio después
              de la notificación constituye aceptación de los nuevos términos.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'jurisdiction',
      number: '20',
      title: 'Legislación Aplicable y Jurisdicción',
      icon: <Scale className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">20.1 Ley Aplicable</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Estos Términos y Condiciones se rigen e interpretan de acuerdo con las leyes de la
              {JURISDICTION}, sin dar efecto a ningún principio de conflicto de leyes.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">20.2 Jurisdicción Competente</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Cualquier controversia derivada de estos términos será sometida a la jurisdicción
              exclusiva de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires,
              {JURISDICTION}, renunciando las partes a cualquier otro fuero que pudiera corresponderles.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      number: '21',
      title: 'Contacto',
      icon: <Mail className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">21.1 Información de Contacto</h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Para cualquier consulta relacionada con estos Términos y Condiciones, puede
              contactarnos a través de:
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm">{COMPANY_EMAIL}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm">{COMPANY_LEGAL}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">21.2 Canales Oficiales</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los únicos canales oficiales de comunicación son: el correo electrónico indicado,
              el sistema de tickets dentro de la aplicación, y las comunicaciones a través de
              la propia plataforma {COMPANY_NAME}. Desconfíe de cualquier comunicación que
              provenga de otros medios.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'acceptance',
      number: '22',
      title: 'Aceptación Final',
      icon: <CheckCircle className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">22.1 Confirmación Expresa del Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Al crear una cuenta, acceder o utilizar el Servicio, el Usuario confirma expresamente que:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Ha leído y comprendido estos Términos y Condiciones en su totalidad</li>
              <li>Acepta estar legalmente vinculado por estos términos</li>
              <li>Tiene la capacidad legal para celebrar este acuerdo</li>
              <li>Ha leído y acepta la Política de Privacidad</li>
              <li>Comprende las limitaciones del servicio, especialmente en relación con la IA</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-emerald-400 text-sm font-medium mb-2">
              Al usar {COMPANY_NAME}, aceptas estos Términos y Condiciones.
            </p>
            <p className="text-slate-400 text-xs">
              Si tienes dudas sobre algún punto, contacta a soporte antes de usar el servicio.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Términos y Condiciones
            </h1>
            <p className="text-xs text-slate-500">Última actualización: {LAST_UPDATE}</p>
          </div>
        </div>
      </div>

      {/* Quick Summary Toggle */}
      {showQuickSummary && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 mt-0.5">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-400 text-sm">Resumen Rápido</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {COMPANY_NAME} es una plataforma para gestionar pagos vía WhatsApp usando IA.
                  Al usarlo, aceptás que la detección automática no es 100% precisa y requiere tu
                  verificación. Tus datos están protegidos y no compartimos información con terceros
                  sin tu consentimiento.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowQuickSummary(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {sections.length} secciones
        </p>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Expandir todo
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className="rounded-xl border border-slate-700/50 overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                'w-full p-4 flex items-center gap-3 text-left transition-colors',
                expandedSections.includes(section.id)
                  ? 'bg-slate-800/70'
                  : 'bg-slate-800/30 hover:bg-slate-800/50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg transition-colors',
                expandedSections.includes(section.id)
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700/50 text-slate-400'
              )}>
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">
                  {section.number}. {section.title}
                </p>
              </div>
              {expandedSections.includes(section.id) ? (
                <ChevronUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {expandedSections.includes(section.id) && (
              <div className="p-4 pt-0 bg-slate-800/30">
                <div className="pt-4 border-t border-slate-700/50">
                  {section.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} {COMPANY_LEGAL}. Todos los derechos reservados.
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Documento actualizado el {LAST_UPDATE}
        </p>
      </div>
    </div>
  );
}
