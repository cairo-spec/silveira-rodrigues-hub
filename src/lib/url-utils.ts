/**
 * Convert URLs in text to clickable links
 */
export const linkifyText = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline hover:text-blue-600">$1</a>');
};

/**
 * Check if text contains URLs
 */
export const containsUrl = (text: string): boolean => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(text);
};

/**
 * Format currency for display (Brazilian Real)
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number | null => {
  if (!value) return null;
  // Remove currency symbols, spaces, and convert comma to dot
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};
