/**
 * Convert half-width katakana to full-width katakana.
 * Handles dakuten (ﾞ) and handakuten (ﾟ) combinations.
 */
export declare function halfWidthToFullWidth(str: string): string;
/**
 * Convert katakana to hiragana.
 * Full-width katakana range: U+30A1–U+30F6 → Hiragana range: U+3041–U+3096
 * Long vowel mark (ー U+30FC) is preserved as-is.
 */
export declare function katakanaToHiragana(str: string): string;
/**
 * Convert hiragana to katakana.
 * Hiragana range: U+3041–U+3096 → Katakana range: U+30A1–U+30F6
 */
export declare function hiraganaToKatakana(str: string): string;
/**
 * Normalize a search term: convert half-width katakana to full-width,
 * then return both hiragana and katakana variants for cross-matching.
 */
export declare function normalizeKana(str: string): string;
//# sourceMappingURL=kana-utils.d.ts.map