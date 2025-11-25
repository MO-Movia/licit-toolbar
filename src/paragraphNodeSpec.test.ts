/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {
  getParagraphNodeAttrs as getAttrs,
  getParagraphStyle as getStyle,
  toParagraphDOM as toDOM,
  ATTRIBUTE_INDENT,
  MIN_INDENT_LEVEL,
  INDENT_MARGIN_PT_SIZE
} from './ParagraphNodeSpec';
import { Node as ProseMirrorNode } from 'prosemirror-model';

describe('ParagraphNodeSpec', () => {
  describe('getAttrs', () => {
    it('should read align, indent, lineSpacing, padding and id from DOM', () => {
      const dom = document.createElement('p');
      dom.setAttribute('align', 'center');
      dom.style.marginLeft = `${INDENT_MARGIN_PT_SIZE * 2}px`; // = indent 2
      dom.style.lineHeight = '2';
      dom.style.paddingTop = '10px';
      dom.style.paddingBottom = '15px';
      dom.id = 'para1';

      const attrs = getAttrs(dom);

      expect(attrs.align).toBe('center');
      expect(attrs.indent).toBe(1);
      expect(attrs.lineSpacing).toBe('232%');
      expect(attrs.paddingTop).toBe('10px');
      expect(attrs.paddingBottom).toBe('15px');
      expect(attrs.id).toBe('para1');
    });

    it('should default indent to MIN_INDENT_LEVEL when none is provided', () => {
      const dom = document.createElement('p');
      const attrs = getAttrs(dom);
      expect(attrs.indent).toBe(MIN_INDENT_LEVEL);
    });
  });

  describe('getStyle (covers getStyleEx)', () => {
    it('should generate text-align and line-height CSS', () => {
      const css = getStyle({
        align: 'right',
        lineSpacing: '1.5',
        paddingTop: null,
        paddingBottom: null,
      });

      expect(css).toContain('text-align: right;');
      expect(css).toContain('text-align: right;line-height: 165%;--czi-content-line-height: 165%;');
    });

    it('should include paddingTop and paddingBottom when non-empty', () => {
      const css = getStyle({
        align: null,
        lineSpacing: null,
        paddingTop: '10px',
        paddingBottom: '20px',
      });

      expect(css).toContain('padding-top: 10px;');
      expect(css).toContain('padding-bottom: 20px;');
    });
  });

  describe('toDOM', () => {
    it('should return proper DOMOutputSpec with indent and id', () => {
      const pmNode = {
        attrs: {
          indent: 3,
          id: 'xyz',
          lineSpacing: null,
          align: null,
          paddingTop: null,
          paddingBottom: null,
        }
      } as unknown as ProseMirrorNode;

      const dom = toDOM(pmNode);

      expect(dom[0]).toBe('p');
      expect(dom[1].id).toBe('xyz');
      expect(dom[1][ATTRIBUTE_INDENT]).toBe('3');
      expect(dom[1].style).toBe('');
      expect(dom[2]).toBe(0);
    });

    it('should include style attribute when styling exists', () => {
      const pmNode = {
        attrs: {
          indent: null,
          id: null,
          align: 'center',
          lineSpacing: '2',
          paddingTop: '5px',
          paddingBottom: '10px',
        }
      } as unknown as ProseMirrorNode;

      const dom = toDOM(pmNode);
      const attrs = dom[1];

      expect(attrs.style).toContain('text-align: center;');
      expect(attrs.style).toContain('text-align: center;line-height: 232%;--czi-content-line-height: 232%;padding-top: 5px;padding-bottom: 10px;');
      expect(attrs.style).toContain('padding-top: 5px;');
      expect(attrs.style).toContain('padding-bottom: 10px;');
    });
  });
});