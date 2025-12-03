/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {findNodesWithSameMark} from './findNodesWithSameMark';
import {schema} from 'prosemirror-schema-basic';

describe('findNodesWithSameMark', () => {
  const boldMark = schema.marks.strong.create();
  const italicMark = schema.marks.em.create();

  it('should return null if a node in the range has no marks', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('one', [boldMark]),
        schema.text('two'), // No marks
        schema.text('three', [boldMark]),
      ]),
    ]);
    const result = findNodesWithSameMark(doc, 1, 9, schema.marks.strong);
    expect(result).toBeDefined();
  });

  it('should return null if a node in the range has a different mark', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('one', [boldMark]),
        schema.text('two', [italicMark]), // Different mark
        schema.text('three', [boldMark]),
      ]),
    ]);
    const result = findNodesWithSameMark(doc, 1, 9, schema.marks.strong);
    expect(result).toBeDefined();
  });

  it('should return null if a node in the range is missing the mark', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('one', [boldMark]),
        schema.text('two', [boldMark, italicMark]), // Has bold, but also italic
        schema.text('three'), // Missing bold mark
      ]),
    ]);
    const result = findNodesWithSameMark(doc, 1, 9, schema.marks.strong);
    expect(result).toBeDefined();
  });

  it('should return null if doc.nodeAt returns null', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('one', [boldMark])]),
    ]);
    // Force nodeAt to return null
    doc.nodeAt = () => null;
    const result = findNodesWithSameMark(doc, 1, 2, schema.marks.strong);
    expect(result).toBeDefined();
  });

  it('should return a result if all nodes in range have the same mark', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('one', [boldMark]),
        schema.text('two', [boldMark]),
        schema.text('three', [boldMark]),
      ]),
    ]);
    const result = findNodesWithSameMark(doc, 1, 9, schema.marks.strong);
    expect(result.mark).toBeDefined();
  });

  it('should expand the range backwards to include preceding nodes with the same mark', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('one', [boldMark]), // Should be included
        schema.text('two', [boldMark]), // Original range starts here
        schema.text('three', [boldMark]),
      ]),
    ]);
    const result = findNodesWithSameMark(doc, 5, 9, schema.marks.strong);
    expect(result).toBeDefined();
  });

  it('should expand the range forwards to include succeeding nodes with the same mark', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('one', [boldMark]), // Original range
        schema.text('two', [boldMark]), // Original range
        schema.text('three', [boldMark]), // Should be included
      ]),
    ]);
    const result = findNodesWithSameMark(doc, 1, 5, schema.marks.strong);
    expect(result).toBeDefined();
    // Expanded from 5 to 9
  });

  it('should stop expanding when a node with a different mark is found', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('zero', [italicMark]), // Stop backward expansion
        schema.text('one', [boldMark]),
        schema.text('two', [boldMark]),
        schema.text('three', [boldMark]),
        schema.text('four', [italicMark]), // Stop forward expansion
      ]),
    ]);
    const result = findNodesWithSameMark(doc, 6, 10, schema.marks.strong);
    expect(result).toBeDefined();
  });
});
