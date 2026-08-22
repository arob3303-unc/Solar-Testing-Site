import { describe, it, expect } from 'vitest';
import { getRecommendation, productsMatch, PRODUCTS } from './recommendation.js';

describe('getRecommendation', () => {
  it('recommends the generator AND additional panels, generator first', () => {
    const r = getRecommendation();
    expect(r.products).toEqual([PRODUCTS.GENERATOR, PRODUCTS.PANELS]);
    expect(r.recommendGenerator).toBe(true);
    expect(r.recommendPanels).toBe(true);
    expect(r.scenario).toBe('solar_with_bill');
  });

  it('assumes solar and a bill, both true of every home reaching the audit', () => {
    // Every home on a utility receives a bill, even a fully offset one: there is
    // still a meter or connection charge. There is no no-bill branch to test.
    const r = getRecommendation();
    expect(r.hasSolar).toBe(true);
    expect(r.hasBill).toBe(true);
  });

  it('ignores any arguments it is handed', () => {
    // Guard against a caller reintroducing a gate by passing stale flags.
    expect(getRecommendation({ hasBill: false })).toEqual(getRecommendation());
    expect(getRecommendation({ hasSolar: false })).toEqual(getRecommendation());
  });

  it('NEVER mentions a battery, storage, or the old vendor brand', () => {
    const r = getRecommendation();
    expect(r.products.join(' ') + ' ' + r.scenario).not.toMatch(/batter|storage|generac/i);
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
