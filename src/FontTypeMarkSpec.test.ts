/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {MarkSpec} from 'prosemirror-model';

import FontTypeMarkSpec, {preLoadFonts} from './FontTypeMarkSpec';

// --- Type Definitions for Mocks ---
type FontAttrs = {name: string};
type DOMSpec = [string, {style: string}, 0];

interface MinimalMockMark {
  attrs: {
    name: string;
  };
  type: {
    spec: MarkSpec;
  };
}

// Helper to create the mock object
const createMockMark = (name: string): MinimalMockMark => ({
  attrs: {name},
  type: {
    // We ensure 'type.spec' points to the object under test
    spec: FontTypeMarkSpec,
  },
});

describe('FontTypeMarkSpec (Karma - No Schema - Type Corrected)', () => {
  // --- Setup ---
  beforeAll(() => {
    // Ensure the internal font cache is populated before testing toDOM
    preLoadFonts();
  });

  // --- parseDOM: getAttrs Tests (Uses Browser DOM) ---
  describe('parseDOM: getAttrs', () => {
    // Safely extract the getAttrs function
    const getAttrsFn = FontTypeMarkSpec.parseDOM[0].getAttrs as (
      value: string
    ) => FontAttrs | false;

    it('should extract and clean font-family from a style value', () => {
      // Test 1: Simulate the style value with single quotes
      let result = getAttrsFn("'Times New Roman'");
      expect((result as FontAttrs).name).toBe('Times New Roman');

      // Test 2: Simulate the style value with double quotes
      result = getAttrsFn('"Arial Black"');
      expect((result as FontAttrs).name).toBe('Arial Black');

      // Test 3: Simulate the style value without quotes
      result = getAttrsFn('Verdana');
      expect((result as FontAttrs).name).toBe('Verdana');
    });

    it('should return an empty name attribute if font-family style is empty', () => {
      const result = getAttrsFn('');

      expect((result as FontAttrs).name).toBe('');
    });
  });

  // --- toDOM Tests (Uses Minimal Mock Mark) ---
  describe('toDOM', () => {
    // Alias toDOM and ensure the argument type is the MinimalMockMark
    const toDOMFn = FontTypeMarkSpec.toDOM as unknown as (
      mark: MinimalMockMark
    ) => DOMSpec;

    it('should return a span with the correct style for a known, cached font', () => {
      const mockMark = createMockMark('Aclonica');
      const [tag, attrs, content] = toDOMFn(mockMark);

      expect(tag).toBe('span');
      expect(attrs.style).toBe('font-family: Aclonica');
      expect(content).toBe(0);
    });

    it('should return a span with the correct style and implicitly trigger caching for a new font', () => {
      const customFontName = 'Custom-Mock-Font';

      const mockMark = createMockMark(customFontName);
      const [tag, attrs] = toDOMFn(mockMark);

      expect(tag).toBe('span');
      expect(attrs.style).toBe(`font-family: ${customFontName}`);
    });

    it('should return a span with an empty style for an empty font name', () => {
      const mockMark = createMockMark('');
      const [tag, attrs] = toDOMFn(mockMark);

      expect(tag).toBe('span');
      expect(attrs.style).toBe('');
    });
  });
});
