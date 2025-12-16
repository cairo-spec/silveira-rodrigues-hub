// Currency and date formatting utilities

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrencyString = (str: string): number | null => {
  if (!str || str === 'N/A' || str === '—' || str.includes('combinar') || str.includes('Incluso')) {
    return null;
  }
  // Remove everything except digits, comma, and dot
  const cleaned = str.replace(/[^\d,.-]/g, '').replace(',', '.');
  const match = cleaned.match(/[\d.]+/);
  if (match) {
    return parseFloat(match[0]);
  }
  return null;
};

export const formatPriceDisplay = (
  priceRegular: string,
  priceSubscriber: string,
  isSubscriber: boolean
): { primary: string; secondary?: string; showStrikethrough: boolean } => {
  if (isSubscriber) {
    return {
      primary: priceSubscriber,
      secondary: priceRegular !== '—' && priceRegular !== 'N/A' ? priceRegular : undefined,
      showStrikethrough: priceRegular !== '—' && priceRegular !== 'N/A' && priceRegular !== priceSubscriber,
    };
  }
  return {
    primary: priceRegular,
    showStrikethrough: false,
  };
};
