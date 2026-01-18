import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HelpHub } from '@/components/help/HelpHub';
import { FAQSection } from '@/components/help/FAQSection';
import { AIAssistant } from '@/components/help/AIAssistant';
import { CreateTicket } from '@/components/help/CreateTicket';
import { TicketStatus } from '@/components/help/TicketStatus';
import { EmailSupport } from '@/components/help/EmailSupport';
import { TermsAndConditions } from '@/components/help/TermsAndConditions';
import { FAQCategory, PaymentContext, AIAnalysis } from '@/components/help/types';

type HelpSection = 'hub' | 'faq' | 'ai-assistant' | 'create-ticket' | 'tickets' | 'email-support' | 'terms' | 'privacy';

export default function Help() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse initial section from URL
  const getInitialSection = (): HelpSection => {
    const section = searchParams.get('section');
    if (section && ['hub', 'faq', 'ai-assistant', 'create-ticket', 'tickets', 'email-support', 'terms', 'privacy'].includes(section)) {
      return section as HelpSection;
    }
    return 'hub';
  };

  const [currentSection, setCurrentSection] = useState<HelpSection>(getInitialSection());
  const [faqCategory, setFaqCategory] = useState<FAQCategory | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [paymentContext, setPaymentContext] = useState<PaymentContext | undefined>(undefined);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | undefined>(undefined);

  const navigateToSection = useCallback((section: string) => {
    // Handle special navigation with context
    if (section.startsWith('faq:')) {
      const category = section.split(':')[1] as FAQCategory;
      setFaqCategory(category);
      setCurrentSection('faq');
      setSearchParams({ section: 'faq', category });
      return;
    }

    setCurrentSection(section as HelpSection);
    setSearchParams({ section });

    // Reset states when navigating
    if (section === 'hub') {
      setFaqCategory(null);
      setAiQuestion('');
      setAiAnalysis(undefined);
    }
  }, [setSearchParams]);

  const handleSearch = useCallback((query: string) => {
    setAiQuestion(query);
    setCurrentSection('ai-assistant');
    setSearchParams({ section: 'ai-assistant', q: query });
  }, [setSearchParams]);

  const handleAskAI = useCallback((question: string) => {
    setAiQuestion(question);
    setCurrentSection('ai-assistant');
    setSearchParams({ section: 'ai-assistant', q: question });
  }, [setSearchParams]);

  const handleCreateTicket = useCallback((analysis?: AIAnalysis) => {
    if (analysis) {
      setAiAnalysis(analysis);
    }
    setCurrentSection('create-ticket');
    setSearchParams({ section: 'create-ticket' });
  }, [setSearchParams]);

  const handleTicketSuccess = useCallback((ticketId: string) => {
    setCurrentSection('tickets');
    setSearchParams({ section: 'tickets', highlight: ticketId });
  }, [setSearchParams]);

  const handleBack = useCallback(() => {
    setCurrentSection('hub');
    setFaqCategory(null);
    setAiQuestion('');
    setAiAnalysis(undefined);
    setSearchParams({});
  }, [setSearchParams]);

  const renderSection = () => {
    switch (currentSection) {
      case 'faq':
        return (
          <FAQSection
            initialCategory={faqCategory}
            onBack={handleBack}
            onAskAI={handleAskAI}
            onCreateTicket={() => navigateToSection('create-ticket')}
          />
        );

      case 'ai-assistant':
        return (
          <AIAssistant
            initialQuestion={aiQuestion}
            paymentContext={paymentContext}
            onBack={handleBack}
            onCreateTicket={handleCreateTicket}
          />
        );

      case 'create-ticket':
        return (
          <CreateTicket
            onBack={handleBack}
            onSuccess={handleTicketSuccess}
            aiAnalysis={aiAnalysis}
            paymentContext={paymentContext}
          />
        );

      case 'tickets':
        return (
          <TicketStatus
            onBack={handleBack}
            onCreateTicket={() => navigateToSection('create-ticket')}
          />
        );

      case 'email-support':
        return (
          <EmailSupport
            onBack={handleBack}
            onSuccess={handleTicketSuccess}
          />
        );

      case 'terms':
        return (
          <TermsAndConditions
            onBack={handleBack}
          />
        );

      case 'privacy':
        // Por ahora redirige a términos, sección de privacidad
        return (
          <TermsAndConditions
            onBack={handleBack}
          />
        );

      case 'hub':
      default:
        return (
          <HelpHub
            onNavigate={navigateToSection}
            onSearch={handleSearch}
          />
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {renderSection()}
      </div>
    </DashboardLayout>
  );
}
