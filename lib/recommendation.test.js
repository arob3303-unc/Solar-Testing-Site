import { describe, it, expect } from 'vitest';
import { getRecommendation, productsMatch, PRODUCTS } from './recommendation.js';

describe('getRecommendation — the four hasSolar × hasBill cases', () => {
  it('solar + bill → generator AND additional panels', () => {
    const r = getRecommendation({ hasSolar: true, hasBill: true });
    expect(r.scenario).toBe('solar_with_bill');
    expect(r.products).toEqual([PRODUCTS.GENERATOR, PRODUCTS.PANELS]);
    expect(r.recommendGenerator).toBe(true);
    expect(r.recommendPanels).toBe(true);
  });

  it('solar + no bill → generator ONLY (no panels — nothing left to offset)', () => {
    const r = getRecommendation({ hasSolar: true, hasBill: false });
    expect(r.scenario).toBe('solar_no_bill');
    expect(r.products).toEqual([PRODUCTS.GENERATOR]);
    expect(r.recommendPanels).toBe(false);
  });

  it('no solar + bill → generator ONLY (never pitch panels to a non-solar home)', () => {
    const r = getRecommendation({ hasSolar: false, hasBill: true });
    expect(r.scenario).toBe('no_solar_with_bill');
    expect(r.products).toEqual([PRODUCTS.GENERATOR]);
    expect(r.recommendPanels).toBe(false);
  });

  it('no solar + no bill → generator ONLY', () => {
    const r = getRecommendation({ hasSolar: false, hasBill: false });
    expect(r.scenario).toBe('no_solar_no_bill');
    expect(r.products).toEqual([PRODUCTS.GENERATOR]);
    expect(r.recommendPanels).toBe(false);
  });
});

describe('getRecommendation — invariants', () => {
  const cases = [
    { hasSolar: true, hasBill: true },
    { hasSolar: true, hasBill: false },
    { hasSolar: false, hasBill: true },
    { hasSolar: false, hasBill: false },
  ];

  it('ALWAYS recommends the Generac generator, first in the list', () => {
    for (const c of cases) {
      const r = getRecommendation(c);
      expect(r.products[0]).toBe(PRODUCTS.GENERATOR);
      expect(r.recommendGenerator).toBe(true);
    }
  });

  it('recommends panels IF AND ONLY IF hasSolar && hasBill', () => {
    for (const c of cases) {
      const r = getRecommendation(c);
      const expected = c.hasSolar && c.hasBill;
      expect(r.recommendPanels).toBe(expected);
      expect(r.products.includes(PRODUCTS.PANELS)).toBe(expected);
    }
  });

  it('NEVER mentions a battery or storage product', () => {
    for (const c of cases) {
      const r = getRecommendation(c);
      const joined = r.products.join(' ') + ' ' + r.scenario;
      expect(joined).not.toMatch(/batter|storage/i);
    }
  });
});

describe('productsMatch', () => {
  it('is order-independent and exact', () => {
    expect(productsMatch(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(productsMatch(['a'], ['a', 'b'])).toBe(false);
    expect(productsMatch(['a', 'b'], ['a', 'c'])).toBe(false);
  });
  it('rejects non-arrays', () => {
    expect(productsMatch(null, ['a'])).toBe(false);
    expect(productsMatch(['a'], undefined)).toBe(false);
  });
});

describe('getRecommendation — defensive input handling', () => {
  it('coerces truthy/falsy values to booleans', () => {
    const r = getRecommendation({ hasSolar: 1, hasBill: 0 });
    expect(r.hasSolar).toBe(true);
    expect(r.hasBill).toBe(false);
    expect(r.products).toEqual([PRODUCTS.GENERATOR]);
  });

  it('treats missing input as no-solar / no-bill (generator only)', () => {
    const r = getRecommendation();
    expect(r.scenario).toBe('no_solar_no_bill');
    expect(r.products).toEqual([PRODUCTS.GENERATOR]);
  });
});
