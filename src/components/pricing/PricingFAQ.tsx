import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer:
      "Sí, puedes actualizar o bajar de plan cuando quieras. Si actualizas, el cambio es inmediato y se te cobrará la diferencia prorrateada. Si bajas de plan, el cambio se aplicará al final del período de facturación actual.",
  },
  {
    question: "¿Hay período de prueba?",
    answer:
      "Sí, ofrecemos 14 días de prueba gratis en el plan Pro. No necesitas tarjeta de crédito para comenzar. Si decides no continuar, simplemente volverás al plan Free automáticamente.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express). También aceptamos pagos vía PayPal y transferencia bancaria para planes anuales.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Por supuesto. Puedes cancelar tu suscripción en cualquier momento desde tu panel de configuración. Mantendrás acceso a las funciones premium hasta el final del período de facturación.",
  },
  {
    question: "¿Qué pasa con mis datos si bajo de plan?",
    answer:
      "Tus datos siempre están seguros. Si bajas de plan y excedes los límites del nuevo plan, no podrás crear nuevos registros hasta que elimines algunos o actualices tu plan. Nunca eliminamos datos automáticamente.",
  },
  {
    question: "¿Ofrecen descuentos para startups u ONGs?",
    answer:
      "Sí, ofrecemos descuentos especiales del 50% para startups en etapa temprana y organizaciones sin fines de lucro. Contáctanos en support@paytrack.app con documentación de tu organización.",
  },
  {
    question: "¿Qué incluye el soporte dedicado del plan Business?",
    answer:
      "El plan Business incluye un gerente de cuenta dedicado, soporte por Slack/WhatsApp con respuesta en menos de 1 hora durante horario laboral, y llamadas mensuales de revisión para optimizar tu uso de PayTrack.",
  },
  {
    question: "¿Puedo añadir usuarios adicionales?",
    answer:
      "En el plan Free tienes 1 usuario. En Pro puedes tener hasta 3 usuarios incluidos. En Business tienes usuarios ilimitados. Para necesidades específicas, contáctanos para un plan personalizado.",
  },
];

export function PricingFAQ() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Preguntas frecuentes
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          ¿Tienes dudas? Aquí respondemos las más comunes.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
