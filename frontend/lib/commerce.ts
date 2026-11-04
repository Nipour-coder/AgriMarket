import type { Product } from '@/lib/types';

export function minimumOrderAmount(product: Product): number {
  const minimum = product.minOrderQuantity.toLowerCase();
  const unit = product.priceUnit.toLowerCase();
  const unitPatterns: [RegExp, RegExp][] = [
    [/per\s*kg|per kilogram/, /([\d,]+)\s*kg\b/],
    [/per\s*(?:metric ton|mt|ton)\b/, /([\d,]+)\s*(?:metric tons?|mt|tons?)\b/],
    [/per\s*10kg\s*crate|per\s*crate/, /([\d,]+)\s*crates?\b/],
    [/per\s*bag/, /([\d,]+)\s*bags?\b/],
    [/per\s*box/, /([\d,]+)\s*boxes?\b/],
    [/per\s*carton/, /([\d,]+)\s*cartons?\b/],
    [/per\s*pallet/, /([\d,]+)\s*pallets?\b/],
  ];

  for (const [unitMatch, quantityMatch] of unitPatterns) {
    if (unitMatch.test(unit)) {
      const match = minimum.match(quantityMatch);
      if (match) return Math.max(1, Number(match[1].replaceAll(',', '')));
    }

  }

  const firstQuantity = minimum.match(/([\d,]+)/);
  return firstQuantity ? Math.max(1, Number(firstQuantity[1].replaceAll(',', ''))) : 1;
}

export function hasDeliveryOption(product: Product): boolean {
  return !['Livestock', 'Livestock and Animal Products', 'Agricultural Services'].includes(product.category);
}
