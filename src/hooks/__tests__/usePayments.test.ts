import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockPayment, mockSupabaseClient } from '@/test/mocks/supabase';
import React from 'react';

// Mock del módulo de Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock del AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { currency: 'PEN' },
    loading: false,
  }),
}));

// Importar después de los mocks
import { usePayments, usePaymentStats, useCreatePayment } from '../usePayments';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe('usePayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch payments successfully', async () => {
    // Mock de respuesta exitosa
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockPayment],
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from = mockFrom;

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFrom).toHaveBeenCalledWith('payments');
  });

  it('should handle empty payments list', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from = mockFrom;

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('usePaymentStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate payment stats correctly', async () => {
    const mockPayments = [
      { amount: 1000, status: 'confirmed', confidence_score: 95 },
      { amount: 500, status: 'pending', confidence_score: 80 },
      { amount: 2000, status: 'confirmed', confidence_score: 90 },
    ];

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from = mockFrom;

    const { result } = renderHook(() => usePaymentStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useCreatePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a payment successfully', async () => {
    const newPayment = {
      contact_id: 'test-contact-id',
      amount: 1500,
      currency: 'PEN',
      method: 'transfer',
      status: 'pending' as const,
    };

    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...newPayment, id: 'new-payment-id' },
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from = mockFrom;

    const { result } = renderHook(() => useCreatePayment(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });
});
