/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {Fragment, Schema, Node as ProseMirrorNode} from 'prosemirror-model';
import {TextSelection, Transaction} from 'prosemirror-state';
import {Transform} from 'prosemirror-transform';

import {MARK_TEXT_SELECTION} from './MarkNames';
import {PARAGRAPH, TEXT} from './NodeNames';
import {applyMark} from './applyMark';
import uuid from './ui/uuid';

export type SelectionMemo = {
  schema: Schema;
  tr: Transform;
};

// Text used to create temporary selection.
// This assumes that no user could enter such string manually.
const PLACEHOLDER_TEXT = `[\u200b\u2800PLACEHOLDER_TEXT_${uuid()}\u2800\u200b]`;

// Perform the transform without losing the perceived text selection.
// The way it works is that this will annotate teh current selection with
// temporary marks and restores the selection with those marks after performing
// the transform.
// export function transformAndPreserveTextSelection(
//   tr: Transform,
//   schema: Schema,
//   fn: (memo: SelectionMemo) => Transform
// ): Transform {
//   if ((tr as Transaction).getMeta('dryrun')) {
//     // There's no need to preserve the selection in dryrun mode.
//     return fn({tr, schema});
//   }

//   const {selection, doc} = tr as Transaction;
//   const markType = schema.marks[MARK_TEXT_SELECTION];
//   if (!markType || !selection || !doc) {
//     return tr;
//   }

//   const {from, to} = selection;

//   // Mark current selection so that we could resume the selection later
//   // after changing the whole list.
//   let fromOffset = 0;
//   let toOffset = 0;
//   let placeholderTextNode;

//   if (from === to) {
//     if (from === 0) {
//       return tr;
//     }
//     // Selection is collapsed, create a temporary selection that the marks can
//     // be applied to.
//     const currentNode = tr.doc.nodeAt(from);
//     const prevNode = tr.doc.nodeAt(from - 1);
//     const nextNode = tr.doc.nodeAt(from + 1);

//     if (
//       !currentNode &&
//       prevNode &&
//       prevNode.type.name === PARAGRAPH &&
//       !prevNode.firstChild
//     ) {
//       // The selection is at a paragraph node which has no content.
//       // Create a temporary text and move selection into that text.
//       placeholderTextNode = schema.text(PLACEHOLDER_TEXT);
//       tr = tr.insert(from, Fragment.from(placeholderTextNode));
//       toOffset = 1;
//     } else if (!currentNode && prevNode && prevNode.type.name === TEXT) {
//       // The selection is at the end of the text node. Select the last
//       // character instead.
//       fromOffset = -1;
//     } else if (prevNode && currentNode && currentNode.type === prevNode.type) {
//       // Ensure that the mark is applied to the same type of node.
//       fromOffset = -1;
//     } else if (nextNode && currentNode && currentNode.type === nextNode.type) {
//       toOffset = 1;
//     } else if (nextNode) {
//       // Could not find the same type of node, assume the next node is safe to use.
//       toOffset = 1;
//     } else if (prevNode) {
//       // Could not find the same type of node, assume the next node is safe to use.
//       fromOffset = -1;
//     } else {
//       // Selection can't be safely preserved.
//       return tr;
//     }
//     tr = (tr as Transaction).setSelection(
//       // [FS] IRAD-1005 2020-07-29
//       // Upgrade outdated packages.
//       // reset selection using the latest doc.
//       // This fixes IRAD-1023
//       TextSelection.create(tr.doc, from + fromOffset, to + toOffset)
//     );
//   }

//   // This is an unique ID (by reference).
//   const id = {};
//   const findMark = (mark) => mark.attrs.id === id;

//   const findMarkRange = () => {
//     let markFrom = 0;
//     let markTo = 0;
//     tr.doc.descendants((node, pos) => {
//       if (node?.marks.find(findMark)) {
//         markFrom = markFrom === 0 ? pos : markFrom;
//         markTo = pos + node.nodeSize;
//       }
//       return true;
//     });
//     return {
//       from: markFrom,
//       to: markTo,
//     };
//   };

//   //This has side-effect. It will cause `tr.docChanged` to be `true`.
//   // No matter whether `fn({tr, schema})` did change the doc or not.
//   tr = applyMark(tr, schema, markType, {id});
//   tr = fn({tr, schema});

//   const markRange = findMarkRange();
//   const selectionRange = {
//     from: Math.max(0, markRange.from - fromOffset),
//     to: Math.max(0, markRange.to - toOffset),
//   };

//   selectionRange.to = Math.max(0, selectionRange.from, selectionRange.to);

//   tr = tr.removeMark(markRange.from, markRange.to, markType);

//   if (placeholderTextNode) {
//     tr.doc.descendants((node, pos) => {
//       if (node.type.name === TEXT && node.text === PLACEHOLDER_TEXT) {
//         tr = tr.delete(pos, pos + PLACEHOLDER_TEXT.length);
//         placeholderTextNode = null;
//         return false;
//       }
//       return true;
//     });
//   }

//   tr = (tr as Transaction).setSelection(
//     TextSelection.create(tr.doc, selectionRange.from, selectionRange.to)
//   );

//   return tr;
// }

export function transformAndPreserveTextSelection(
  tr: Transform,
  schema: Schema,
  fn: (memo: SelectionMemo) => Transform
): Transform {
  if ((tr as Transaction).getMeta('dryrun')) {
    return fn({tr, schema});
  }

  const tx = tr as Transaction;
  const {selection, doc} = tx;
  const markType = schema.marks[MARK_TEXT_SELECTION];
  if (!markType || !selection || !doc) {
    return tr;
  }

  const from = selection.from;
  const to = selection.to;

  // These match Code Set 2: they must persist and must NOT be recomputed later.
  let fromOffset = 0;
  let toOffset = 0;
  let placeholderInserted = false;

  //
  // Handle collapsed selection
  //
  if (from === to) {
    if (from === 0) {
      return tr;
    }

    const collapsed = adjustCollapsedSelection(tr, schema, from);
    if (!collapsed) {
      // Matches Code Set 2: do NOT apply marks or run fn() when unsafe
      return tr;
    }

    tr = collapsed.tr;
    fromOffset = collapsed.fromOffset;
    toOffset = collapsed.toOffset;
    placeholderInserted = collapsed.placeholderInserted;
  }

  //
  // Apply mark to track selection
  //
  const id = {};
  tr = applyMark(tr, schema, markType, {id});

  //
  // Run the wrapped transform
  //
  tr = fn({tr, schema});

  //
  // Locate where the marked content moved
  //
  const markRange = findMarkRange(tr.doc, id);

  //
  // Restore selection; must use the original offsets from above
  //
  const selectionRange = {
    from: Math.max(0, markRange.from - fromOffset),
    to: Math.max(0, markRange.to - toOffset),
  };
  selectionRange.to = Math.max(selectionRange.from, selectionRange.to);

  //
  // Clean up — remove the temporary mark
  //
  tr = tr.removeMark(markRange.from, markRange.to, markType);

  //
  // Remove placeholder ONLY if one was inserted; MUST match Code Set 2 exactly
  //
  if (placeholderInserted) {
    tr = removeInsertedPlaceholder(tr);
  }

  //
  // Restore final selection
  //
  tr = (tr as Transaction).setSelection(
    TextSelection.create(tr.doc, selectionRange.from, selectionRange.to)
  );

  return tr;
}

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

interface CollapsedSelectionResult {
  tr: Transform;
  fromOffset: number;
  toOffset: number;
  placeholderInserted: boolean;
}

/**
 * Handles collapsed selection adjustments.
 * MUST match Code Set 2 logic exactly.
 */
function adjustCollapsedSelection(
  tr: Transform,
  schema: Schema,
  from: number
): CollapsedSelectionResult | null {
  const doc = tr.doc;
  const currentNode = doc.nodeAt(from);
  const prevNode = doc.nodeAt(from - 1);
  const nextNode = doc.nodeAt(from + 1);

  // Start exactly like Code Set 2
  let fromOffset = 0;
  let toOffset = 0;
  let placeholderInserted = false;

  if (
    !currentNode &&
    prevNode &&
    prevNode.type.name === PARAGRAPH &&
    !prevNode.firstChild
  ) {
    // Insert placeholder
    const placeholderTextNode = schema.text(PLACEHOLDER_TEXT);
    tr = tr.insert(from, Fragment.from(placeholderTextNode));
    toOffset = 1;
    placeholderInserted = true;
  } else if (!currentNode && prevNode && prevNode.type.name === TEXT) {
    fromOffset = -1;
  } else if (prevNode && currentNode && currentNode.type === prevNode.type) {
    fromOffset = -1;
  } else if (nextNode && currentNode && currentNode.type === nextNode.type) {
    toOffset = 1;
  } else if (nextNode) {
    toOffset = 1;
  } else if (prevNode) {
    fromOffset = -1;
  } else {
    // Cannot safely preserve selection (must match Code Set 2: return null)
    return null;
  }

  tr = (tr as Transaction).setSelection(
    TextSelection.create(tr.doc, from + fromOffset, from + toOffset)
  );

  return {tr, fromOffset, toOffset, placeholderInserted};
}

/**
 * Matches Code Set 2 behavior: remove placeholder ONLY if one was inserted.
 */
function removeInsertedPlaceholder(tr: Transform): Transform {
  tr.doc.descendants((node, pos) => {
    if (node.type.name === TEXT && node.text === PLACEHOLDER_TEXT) {
      tr = tr.delete(pos, pos + PLACEHOLDER_TEXT.length);
      return false;
    }
    return true;
  });
  return tr;
}

/**
 * Identical logic to Code Set 2's inline findMarkRange function.
 */
function findMarkRange(
  doc: ProseMirrorNode,
  id: object
): {from: number; to: number} {
  let markFrom = 0;
  let markTo = 0;

  doc.descendants((node, pos) => {
    if (node?.marks.find((mark) => mark.attrs.id === id)) {
      markFrom = markFrom === 0 ? pos : markFrom;
      markTo = pos + node.nodeSize;
    }
    return true;
  });

  return {from: markFrom, to: markTo};
}
