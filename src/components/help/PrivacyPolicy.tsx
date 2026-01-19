import { useState } from 'react';
import {
  ArrowLeft,
  Shield,
  ChevronDown,
  ChevronUp,
  Lock,
  Eye,
  Database,
  Globe,
  Mail,
  Users,
  Bot,
  Smartphone,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Server,
  Cookie,
  UserX,
  Scale,
  Bell,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrivacyPolicyProps {
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
const EFFECTIVE_DATE = '1 de enero, 2026';
const COMPANY_NAME = 'PayTrack';
const COMPANY_EMAIL = 'privacidad@paytrack.app';
const COMPANY_SUPPORT = 'soporte@paytrack.app';
const COMPANY_LEGAL = 'PayTrack Technologies';
const JURISDICTION = 'República Argentina';

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">1.1 Identidad del Responsable del Tratamiento</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_LEGAL}, con domicilio en Ciudad Autónoma de Buenos Aires, {JURISDICTION},
              es el responsable del tratamiento de los datos personales recopilados a través de la
              plataforma {COMPANY_NAME}. Puede contactarnos en: {COMPANY_EMAIL}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">1.2 Objeto de la Política de Privacidad</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Esta Política de Privacidad describe cómo {COMPANY_NAME} recopila, utiliza, almacena,
              protege y comparte la información personal de los usuarios. Nuestro compromiso es
              garantizar la privacidad y seguridad de sus datos en cumplimiento con la legislación
              vigente en materia de protección de datos personales.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">1.3 Aceptación del Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Al utilizar {COMPANY_NAME}, usted acepta las prácticas descritas en esta Política de
              Privacidad. Si no está de acuerdo con alguna de estas prácticas, le recomendamos no
              utilizar nuestros servicios. El uso continuado del servicio implica la aceptación de
              cualquier actualización a esta política.
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
            Para efectos de esta Política de Privacidad, los siguientes términos tendrán el significado indicado:
          </p>
          <div className="space-y-3">
            {[
              { term: 'Datos Personales', def: 'Toda información que identifica o permite identificar a una persona física, como nombre, email, número de teléfono, dirección IP, entre otros.' },
              { term: 'Usuario', def: 'Toda persona física o jurídica que se registra y/o utiliza el Servicio, ya sea en modalidad gratuita o de pago.' },
              { term: 'Servicio', def: `La plataforma ${COMPANY_NAME}, incluyendo la aplicación web, aplicación móvil (PWA), APIs y todas las funcionalidades asociadas.` },
              { term: 'WhatsApp Business Cloud API', def: 'La interfaz de programación oficial proporcionada por Meta Platforms, Inc. que permite a aplicaciones de terceros interactuar con la plataforma de mensajería WhatsApp Business.' },
              { term: 'Inteligencia Artificial (IA)', def: 'Los sistemas de aprendizaje automático y procesamiento de lenguaje natural utilizados para analizar mensajes, imágenes y detectar información de pagos automáticamente.' },
              { term: 'Tratamiento de Datos', def: 'Cualquier operación realizada sobre datos personales, incluyendo recopilación, almacenamiento, uso, modificación, transferencia y eliminación.' },
              { term: 'Contactos', def: 'Las personas cuyos datos de contacto y mensajes son procesados a través de la integración con WhatsApp del Usuario.' },
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
      id: 'data-collected',
      number: '3',
      title: 'Datos que se Recopilan',
      icon: <Database className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">3.1 Datos de Identificación</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>Nombre completo o razón social</li>
              <li>Nombre de usuario o alias</li>
              <li>Foto de perfil (opcional)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">3.2 Datos de Contacto</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono vinculado a WhatsApp Business</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">3.3 Datos de Cuenta</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>Credenciales de acceso (contraseña hasheada)</li>
              <li>Preferencias y configuraciones de la cuenta</li>
              <li>Plan de suscripción y estado de facturación</li>
              <li>Historial de actividad en la plataforma</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">3.4 Datos Provenientes de WhatsApp</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>Nombres y números de teléfono de los contactos que envían mensajes</li>
              <li>Contenido de los mensajes recibidos (texto)</li>
              <li>Imágenes y archivos adjuntos (comprobantes de pago)</li>
              <li>Metadatos de los mensajes (fecha, hora, estado de entrega)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">3.5 Mensajes, Imágenes y Comprobantes</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Para proporcionar el servicio de detección automática de pagos, procesamos el contenido
              de los mensajes e imágenes de comprobantes enviados por los contactos del Usuario.
              Esta información es analizada por nuestros sistemas de IA para extraer datos de pago.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">3.6 Datos Técnicos</h4>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2">
              <li>Dirección IP</li>
              <li>Tipo y versión de navegador</li>
              <li>Sistema operativo y dispositivo</li>
              <li>Páginas visitadas y acciones realizadas</li>
              <li>Registros de errores y diagnóstico</li>
              <li>Cookies e identificadores de sesión</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'data-origin',
      number: '4',
      title: 'Origen de los Datos',
      icon: <Eye className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">4.1 Datos Proporcionados Directamente por el Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Recopilamos información que el Usuario proporciona voluntariamente al:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Crear una cuenta o registrarse</li>
              <li>Completar o actualizar su perfil</li>
              <li>Configurar la integración con WhatsApp</li>
              <li>Contactar a soporte técnico</li>
              <li>Responder encuestas o formularios</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">4.2 Datos Obtenidos a través de WhatsApp</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Cuando el Usuario conecta su cuenta de WhatsApp Business, recibimos automáticamente
              los mensajes entrantes y sus metadatos a través de la API oficial de WhatsApp Business
              Cloud. Esto incluye el contenido de los mensajes, archivos adjuntos y datos del remitente.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">4.3 Datos Generados por el Uso del Servicio</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Generamos datos adicionales basados en el uso del servicio, incluyendo:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Pagos detectados y su información extraída</li>
              <li>Historial de transacciones y reportes</li>
              <li>Estadísticas y analíticas de uso</li>
              <li>Registros de actividad y auditoría</li>
              <li>Resultados del análisis de IA</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'purpose',
      number: '5',
      title: 'Finalidad del Tratamiento',
      icon: <CheckCircle className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">5.1 Prestación del Servicio</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Utilizamos sus datos para proporcionar las funcionalidades principales de {COMPANY_NAME}:
              gestión de pagos, seguimiento de cuentas por cobrar, envío de recordatorios y generación
              de reportes financieros.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">5.2 Detección Automática de Pagos</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los mensajes y comprobantes son procesados por nuestros sistemas de IA para detectar
              automáticamente información de pagos: montos, fechas, métodos de pago y referencias.
              Este procesamiento es esencial para la funcionalidad principal del servicio.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">5.3 Soporte y Atención al Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Usamos sus datos de contacto para responder consultas, resolver problemas técnicos,
              procesar tickets de soporte y comunicar información importante sobre el servicio.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">5.4 Mejora del Sistema y de la IA</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Analizamos patrones de uso (de forma agregada y anonimizada) para mejorar la precisión
              de nuestros algoritmos de detección, optimizar la experiencia de usuario y desarrollar
              nuevas funcionalidades.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">5.5 Cumplimiento Legal</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Procesamos datos cuando es necesario para cumplir con obligaciones legales, responder
              a requerimientos de autoridades competentes, o proteger nuestros derechos legales.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'ai-usage',
      number: '6',
      title: 'Uso de Inteligencia Artificial',
      icon: <Bot className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">6.1 Rol de la IA en el Procesamiento</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} utiliza sistemas de Inteligencia Artificial (Google Gemini) para:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Analizar el contenido de mensajes de texto para detectar información de pagos</li>
              <li>Procesar imágenes de comprobantes mediante OCR y visión por computadora</li>
              <li>Extraer montos, fechas, métodos de pago y referencias automáticamente</li>
              <li>Proporcionar asistencia automatizada en el soporte al usuario</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">6.2 Tipo de Análisis Realizado</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El análisis de IA se centra exclusivamente en extraer información relacionada con pagos.
              No realizamos análisis de sentimientos, perfilado de comportamiento, ni procesamiento
              de datos sensibles más allá de lo necesario para detectar transacciones financieras.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">6.3 Alcance y Limitaciones</h4>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-400 text-sm font-medium mb-1">Importante:</p>
              <p className="text-slate-300 text-sm">
                Los sistemas de IA tienen limitaciones inherentes. La precisión de la detección depende
                de la calidad de las imágenes, claridad del texto y formato de los comprobantes.
                Los resultados deben ser verificados por el Usuario.
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">6.4 Intervención Humana</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El Usuario siempre tiene control sobre los resultados del análisis de IA. Puede confirmar,
              modificar o rechazar los pagos detectados. Nuestro equipo de soporte humano está disponible
              para casos que requieran revisión manual.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'legal-basis',
      number: '7',
      title: 'Base Legal para el Tratamiento',
      icon: <Scale className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">7.1 Consentimiento del Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Al registrarse y aceptar esta Política de Privacidad, el Usuario otorga su consentimiento
              expreso para el tratamiento de sus datos personales según las finalidades descritas.
              Este consentimiento puede ser revocado en cualquier momento.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">7.2 Ejecución del Contrato</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              El tratamiento de datos es necesario para la ejecución del contrato de servicio
              (Términos y Condiciones) entre el Usuario y {COMPANY_NAME}. Sin este tratamiento,
              no podríamos proporcionar las funcionalidades del servicio.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">7.3 Obligaciones Legales</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              En algunos casos, estamos obligados legalmente a conservar o proporcionar ciertos datos
              (por ejemplo, ante requerimientos judiciales o de autoridades fiscales). En estos casos,
              el tratamiento se basa en el cumplimiento de una obligación legal.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'retention',
      number: '8',
      title: 'Conservación de los Datos',
      icon: <Clock className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">8.1 Plazos de Almacenamiento</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Conservamos sus datos durante el tiempo necesario para cumplir con las finalidades
              descritas en esta política:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li><strong>Datos de cuenta:</strong> Mientras la cuenta esté activa</li>
              <li><strong>Mensajes y comprobantes:</strong> Máximo 24 meses o según configure el Usuario</li>
              <li><strong>Registros de pagos:</strong> Según los requisitos fiscales aplicables (generalmente 5-10 años)</li>
              <li><strong>Logs técnicos:</strong> Máximo 12 meses</li>
              <li><strong>Datos de soporte:</strong> Máximo 36 meses tras resolver el ticket</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">8.2 Criterios de Retención</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los criterios para determinar los plazos de retención incluyen: obligaciones legales
              y fiscales, necesidades operativas del servicio, y los intereses legítimos de protección
              ante posibles reclamaciones.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">8.3 Eliminación de Datos</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Cuando los datos ya no son necesarios, procedemos a su eliminación segura o anonimización.
              El Usuario puede solicitar la eliminación anticipada de sus datos ejerciendo su derecho
              de supresión, sujeto a las obligaciones legales de retención.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'third-parties',
      number: '9',
      title: 'Compartición de Datos con Terceros',
      icon: <Users className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">9.1 WhatsApp / Meta</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Al utilizar la integración con WhatsApp, ciertos datos son procesados por Meta Platforms, Inc.
              según sus propias políticas de privacidad. {COMPANY_NAME} actúa como un procesador de datos
              en relación con los mensajes recibidos a través de la API de WhatsApp Business.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">9.2 Proveedores de Infraestructura</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Compartimos datos con proveedores de servicios esenciales:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li><strong>Supabase:</strong> Base de datos y autenticación (servidores en AWS)</li>
              <li><strong>Vercel:</strong> Hosting de la aplicación</li>
              <li><strong>Google Cloud:</strong> Servicios de IA (Gemini API)</li>
              <li><strong>Stripe:</strong> Procesamiento de pagos de suscripción</li>
            </ul>
            <p className="text-slate-300 text-sm leading-relaxed mt-2">
              Estos proveedores actúan como encargados del tratamiento y están sujetos a acuerdos
              de confidencialidad y protección de datos.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">9.3 Autoridades Competentes</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Podemos divulgar datos personales cuando sea requerido por ley, orden judicial,
              o solicitud de autoridades gubernamentales legítimas. Notificaremos al Usuario
              cuando sea legalmente posible.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'international',
      number: '10',
      title: 'Transferencias Internacionales',
      icon: <Globe className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">10.1 Tratamiento Fuera del País</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sus datos pueden ser transferidos y procesados en servidores ubicados fuera de
              {JURISDICTION}. Nuestros principales proveedores de infraestructura tienen
              servidores en Estados Unidos y la Unión Europea.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">10.2 Garantías Aplicables</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Para proteger sus datos en transferencias internacionales, nos aseguramos de que
              los destinatarios:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Estén ubicados en países con niveles adecuados de protección de datos</li>
              <li>Hayan firmado cláusulas contractuales tipo aprobadas</li>
              <li>Cuenten con certificaciones de privacidad reconocidas (SOC 2, ISO 27001)</li>
              <li>Cumplan con marcos como el Privacy Shield o su equivalente actual</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      number: '11',
      title: 'Seguridad de la Información',
      icon: <Lock className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">11.1 Medidas Técnicas y Organizativas</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Implementamos medidas de seguridad robustas para proteger sus datos:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Cifrado SSL/TLS para todas las comunicaciones en tránsito</li>
              <li>Cifrado AES-256 para datos sensibles en reposo</li>
              <li>Hash seguro (bcrypt) para contraseñas</li>
              <li>Firewalls y sistemas de detección de intrusiones</li>
              <li>Copias de seguridad automatizadas y geo-redundantes</li>
              <li>Monitoreo continuo 24/7 de la infraestructura</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">11.2 Control de Accesos</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Aplicamos el principio de mínimo privilegio: solo el personal autorizado tiene
              acceso a los datos personales, y únicamente en la medida necesaria para sus
              funciones. Todos los accesos son registrados y auditados.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">11.3 Prevención de Incidentes</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Contamos con procedimientos para prevenir, detectar y responder a incidentes de
              seguridad. En caso de una brecha que afecte sus datos personales, le notificaremos
              conforme a la legislación aplicable.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'user-rights',
      number: '12',
      title: 'Derechos del Usuario',
      icon: <CheckCircle className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Usted tiene los siguientes derechos sobre sus datos personales:
          </p>
          <div className="space-y-3">
            {[
              { right: 'Acceso', desc: 'Solicitar información sobre qué datos personales tenemos sobre usted y cómo los tratamos.' },
              { right: 'Rectificación', desc: 'Corregir datos inexactos o incompletos. Puede actualizar muchos datos directamente desde su perfil.' },
              { right: 'Eliminación', desc: 'Solicitar la eliminación de sus datos personales (derecho al olvido), sujeto a obligaciones legales de retención.' },
              { right: 'Oposición', desc: 'Oponerse al tratamiento de sus datos para determinadas finalidades, como comunicaciones de marketing.' },
              { right: 'Portabilidad', desc: 'Recibir sus datos en un formato estructurado y de uso común, o solicitar su transferencia a otro proveedor.' },
              { right: 'Limitación', desc: 'Solicitar la limitación del tratamiento mientras se resuelve una reclamación o ejercicio de derechos.' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <span className="font-medium text-emerald-400">{item.right}:</span>
                <span className="text-slate-300 text-sm ml-2">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'exercise-rights',
      number: '13',
      title: 'Ejercicio de Derechos',
      icon: <Mail className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">13.1 Canales de Contacto</h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Puede ejercer sus derechos a través de los siguientes canales:
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm">{COMPANY_EMAIL}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 text-sm">Sección "Privacidad" en Configuración de la app</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">13.2 Procedimiento de Solicitud</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Para procesar su solicitud, necesitamos verificar su identidad. Incluya en su
              solicitud: nombre completo, email registrado, descripción del derecho que desea
              ejercer, y cualquier información adicional que facilite la localización de sus datos.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">13.3 Plazos de Respuesta</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Responderemos a su solicitud dentro de los 10 días hábiles siguientes a su recepción.
              En casos complejos, este plazo puede extenderse otros 10 días, previa notificación.
              El ejercicio de estos derechos es gratuito.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'cookies',
      number: '14',
      title: 'Cookies y Tecnologías Similares',
      icon: <Cookie className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">14.1 Uso de Cookies</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} utiliza cookies y tecnologías similares (localStorage, sessionStorage)
              para el funcionamiento del servicio. Las cookies que utilizamos son principalmente:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li><strong>Esenciales:</strong> Necesarias para la autenticación y funcionamiento básico</li>
              <li><strong>Funcionales:</strong> Guardan preferencias de usuario y configuraciones</li>
              <li><strong>Analíticas:</strong> Nos ayudan a entender cómo se usa la aplicación</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">14.2 Finalidad</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Las cookies nos permiten: mantener su sesión iniciada, recordar sus preferencias,
              mejorar el rendimiento de la aplicación, y recopilar estadísticas de uso agregadas.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">14.3 Configuración del Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Puede configurar su navegador para rechazar cookies, aunque esto puede afectar
              el funcionamiento del servicio. Las cookies esenciales no pueden desactivarse
              ya que son necesarias para el funcionamiento básico de la aplicación.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'minors',
      number: '15',
      title: 'Menores de Edad',
      icon: <UserX className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">15.1 Restricciones de Uso</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {COMPANY_NAME} está diseñado para uso comercial y profesional. No está dirigido
              a menores de 18 años. No recopilamos intencionalmente datos personales de menores
              de edad.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">15.2 Responsabilidad del Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Si usted es padre, madre o tutor legal y tiene conocimiento de que un menor bajo
              su responsabilidad ha proporcionado datos personales sin su consentimiento, por
              favor contáctenos inmediatamente para proceder a su eliminación.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'changes',
      number: '16',
      title: 'Cambios en la Política de Privacidad',
      icon: <Bell className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">16.1 Actualizaciones</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios
              en nuestras prácticas, en el servicio, o en la legislación aplicable. La fecha de
              "última actualización" al inicio de este documento indica cuándo se realizaron los
              últimos cambios.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">16.2 Notificación al Usuario</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Para cambios significativos, le notificaremos mediante: un aviso destacado en la
              aplicación, un correo electrónico al email registrado, o ambos. El uso continuado
              del servicio después de la notificación constituye aceptación de los cambios.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'related-docs',
      number: '17',
      title: 'Relación con Otros Documentos',
      icon: <FileText className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">17.1 Términos y Condiciones</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Esta Política de Privacidad forma parte integral de los Términos y Condiciones
              del servicio. En caso de conflicto entre ambos documentos, prevalecerán las
              disposiciones más favorables para la protección de sus datos personales.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">17.2 Políticas Complementarias</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Dependiendo de las funcionalidades que utilice, pueden aplicar políticas adicionales
              específicas (por ejemplo, para funcionalidades de pago o integraciones con terceros).
              Estas serán comunicadas oportunamente.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'legislation',
      number: '18',
      title: 'Legislación Aplicable',
      icon: <Scale className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">18.1 Normativa Vigente</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Esta Política de Privacidad se rige por la legislación de {JURISDICTION}, incluyendo:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1.5 ml-2 mt-2">
              <li>Ley 25.326 de Protección de Datos Personales</li>
              <li>Decreto Reglamentario 1558/2001</li>
              <li>Disposiciones de la Agencia de Acceso a la Información Pública</li>
              <li>Normativas complementarias aplicables</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">18.2 Autoridad de Control</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              La autoridad de control competente es la Agencia de Acceso a la Información Pública
              (AAIP) de Argentina. Usted tiene derecho a presentar una reclamación ante esta
              autoridad si considera que el tratamiento de sus datos personales infringe la
              normativa aplicable.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      number: '19',
      title: 'Contacto',
      icon: <Mail className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">19.1 Responsable de Privacidad</h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Para consultas relacionadas con privacidad y protección de datos, puede contactar a:
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-white text-sm font-medium">Privacidad y Datos</p>
                  <p className="text-slate-400 text-xs">{COMPANY_EMAIL}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-white text-sm font-medium">Soporte General</p>
                  <p className="text-slate-400 text-xs">{COMPANY_SUPPORT}</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">19.2 Canales Oficiales</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Los únicos canales oficiales para consultas de privacidad son los correos electrónicos
              indicados y el sistema de soporte dentro de la aplicación. Desconfíe de comunicaciones
              que soliciten datos personales a través de otros medios.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'effective-date',
      number: '20',
      title: 'Fecha de Vigencia',
      icon: <Clock className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">20.1 Fecha de Entrada en Vigor</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Esta Política de Privacidad entra en vigor el <strong className="text-white">{EFFECTIVE_DATE}</strong>.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">20.2 Última Actualización</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              La última actualización de este documento fue realizada el <strong className="text-white">{LAST_UPDATE}</strong>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-emerald-400 text-sm font-medium mb-2">
              Al usar {COMPANY_NAME}, aceptas esta Política de Privacidad.
            </p>
            <p className="text-slate-400 text-xs">
              Tu privacidad es importante para nosotros. Si tienes dudas, contacta a {COMPANY_EMAIL}
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
              <Shield className="w-5 h-5 text-emerald-400" />
              Política de Privacidad
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
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-400 text-sm">Resumen Rápido</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  <strong className="text-slate-300">Recopilamos:</strong> datos de cuenta, mensajes de WhatsApp y comprobantes para detectar pagos.
                  <br />
                  <strong className="text-slate-300">Usamos IA:</strong> para analizar mensajes y extraer información de pagos automáticamente.
                  <br />
                  <strong className="text-slate-300">Protegemos:</strong> tus datos con cifrado y no los vendemos a terceros.
                  <br />
                  <strong className="text-slate-300">Tus derechos:</strong> acceso, rectificación, eliminación y portabilidad de tus datos.
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
