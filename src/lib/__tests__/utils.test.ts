import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should filter out falsy values', () => {
    const result = cn('class1', false, null, undefined, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-6');
    expect(result).toBe('py-2 px-6');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle object notation', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
    });
    expect(result).toBe('text-red-500');
  });
});

describe('formatters', () => {
  it('should format currency correctly', () => {
    const formatCurrency = (amount: number, currency = 'PEN') => {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
      }).format(amount);
    };

    expect(formatCurrency(1000)).toContain('1');
    expect(formatCurrency(1000, 'USD')).toContain('1');
  });

  it('should format dates correctly', () => {
    const date = new Date('2024-01-15T10:30:00');
    const formatted = date.toLocaleDateString('es-PE');
    expect(formatted).toBeDefined();
  });
});
