/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {Transaction} from '@remirror/pm/state';
import {Mark, MarkType, Node, ResolvedPos, Schema} from 'prosemirror-model';
import {SelectionRange, TextSelection} from 'prosemirror-state';
import {Transform} from 'prosemirror-transform';

interface MyNode {
  inlineContent: boolean; // Assuming inlineContent is of type boolean
  type: {
    allowsMarkType: (type: MarkType) => boolean; // Assuming allowsMarkType returns a boolean
  };
}

function markApplies(
  doc: Node,
  ranges: readonly SelectionRange[],
  type: MarkType
) {
  for (const {$from, $to} of ranges) {
    let can = $from.depth === 0 ? doc.type.allowsMarkType(type) : false;
    doc.nodesBetween($from.pos, $to.pos, (node: MyNode) => {
      if (can) {
        return false;
      }
      can = node.inlineContent && node.type.allowsMarkType(type);
      return true;
    });
    if (can) {
      return true;
    }
  }
  return false;
}

function hasMark(marks: readonly Mark[], markType: string) {
  return marks.some((mark) => mark.type.name === markType);
}

// https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.js
// export function applyMark(
//   tr: Transform,
//   _schema: Schema,
//   markType: MarkType,
//   attrs?: Record<string, unknown>,
//   isCustomStyleApplied?: boolean
// ): Transform {
//   if (!(tr as Transaction).selection || !tr.doc || !markType) {
//     return tr;
//   }
//   const {empty, $cursor, ranges} = (tr as Transaction)
//     .selection as TextSelection;
//   if ((empty && !$cursor) || !markApplies(tr.doc, ranges, markType)) {
//     return tr;
//   }
//   if ($cursor) {
//     tr = (tr as Transaction).removeStoredMark(markType);
//     return (tr as Transaction).addStoredMark(markType.create(attrs));
//   }
//   let has = false;
//   for (let i = 0; !has && i < ranges.length; i++) {
//     const {$from, $to} = ranges[i];
//     has = tr.doc.rangeHasMark($from.pos, $to.pos, markType);
//   }
//   for (const {$from, $to} of ranges) {
//     if (has && isCustomStyleApplied) {
//       const nodeTr = tr.doc.nodeAt($from.pos);
//       let from = $from.pos;
//       let to = 1;
//       if (nodeTr) {
//         nodeTr.descendants((child) => {
//           const nodeTr_1 = tr.doc.nodeAt(from);
//           let to_add = 0;
//           if (nodeTr_1.childCount > 0) {
//             to_add = 1;
//           }
//           to = from + child.nodeSize;
//           if (child && 0 < child.marks.length) {
//             const result = child.marks.find(
//               (mark) => mark.type.name === markType.name
//             );
//             if (!result) {
//               tr = tr.addMark(from, to + to_add, markType.create(attrs));
//             } else {
//               tr = tr.addMark(
//                 from,
//                 to + to_add,
//                 markType.create(result?.attrs)
//               );
//             }
//           } else {
//             tr = tr.addMark(from, to + to_add, markType.create(attrs));
//           }
//           from = to + to_add;
//         });
//       }
//     } else if (attrs) {
//       const nodeTr = tr.doc.nodeAt($from.pos);
//       if ('link' === markType.name) {
//         if (
//           0 < nodeTr?.marks.length &&
//           hasMark(nodeTr.marks, 'mark-text-color')
//         ) {
//           tr = tr.removeMark(
//             $from.pos,
//             $to.pos,
//             _schema.marks['mark-text-color']
//           );
//         }
//         tr = tr.addMark($from.pos, $to.pos, markType.create(attrs));
//       } else if ('mark-text-color' === markType.name) {
//         if (0 < nodeTr?.marks.length) {
//           if (!hasMark(nodeTr?.marks, 'link')) {
//             tr = tr.addMark($from.pos, $to.pos, markType.create(attrs));
//           }
//         } else if (nodeTr instanceof Node) {
//           let from = $from.pos;
//           let to = 0;
//           nodeTr.descendants((child) => {
//             if (child) {
//               const nodeTr_1 = tr.doc.nodeAt(from);
//               to = from + child.nodeSize;

//               if (nodeTr_1.childCount > 0) {
//                 if (!hasMark(child.marks, 'link')) {
//                   tr = tr.addMark(from, to + 1, markType.create(attrs));
//                 }
//                 from = to + 1;
//               } else {
//                 if (!hasMark(child.marks, 'link')) {
//                   tr = tr.addMark(from, to, markType.create(attrs));
//                 }
//                 from = to;
//               }
//             }
//           });
//         }
//       } else {
//         const nodeTr = tr.doc.nodeAt($from.pos);
//         let from = $from.pos;
//         let to = 0;
//         if (undefined === isCustomStyleApplied) {
//           tr = tr.addMark($from.pos, $to.pos, markType.create(attrs));
//         } else {
//           nodeTr.descendants((child) => {
//             if (child) {
//               const nodeTr = tr.doc.nodeAt(from);
//               to = from + child.nodeSize;
//               if (nodeTr.childCount > 0) {
//                 tr = tr.addMark(from, to + 1, markType.create(attrs));
//                 from = to + 1;
//               } else {
//                 tr = tr.addMark(from, to, markType.create(attrs));
//                 from = to;
//               }
//             }
//           });
//         }
//       }
//     } else if (has && !isCustomStyleApplied && !attrs) {
//       tr = tr.removeMark($from.pos, $to.pos, markType);
//     }
//   }
//   return tr;
// }
function hasMarkInRanges(
  doc: Node,
  ranges: readonly {$from: ResolvedPos; $to: ResolvedPos}[],
  markType: MarkType
): boolean {
  let has = false;
  for (let i = 0; !has && i < ranges.length; i++) {
    const {$from, $to} = ranges[i];
    has = doc.rangeHasMark($from.pos, $to.pos, markType);
  }
  return has;
}

function applyMarkToNode(
  tr: Transaction,
  from: number,
  nodeTr: Node,
  markType: MarkType,
  attrs?: Record<string, unknown>
): {tr: Transaction; endPos: number} {
  let pos = from;

  if (!nodeTr) {
    return {tr, endPos: pos};
  }

  nodeTr.descendants((child) => {
    const nodeTr_1 = tr.doc.nodeAt(pos);
    let to_add = 0;
    if (nodeTr_1.childCount > 0) {
      to_add = 1;
    }
    const to = pos + child.nodeSize;

    if (child && 0 < child.marks.length) {
      const result = child.marks.find(
        (mark) => mark.type.name === markType.name
      );
      if (!result) {
        tr = tr.addMark(pos, to + to_add, markType.create(attrs));
      } else {
        tr = tr.addMark(pos, to + to_add, markType.create(result?.attrs));
      }
    } else {
      tr = tr.addMark(pos, to + to_add, markType.create(attrs));
    }
    pos = to + to_add;
  });

  return {tr, endPos: pos};
}

function handleLinkMark(
  tr: Transaction,
  _schema: Schema,
  $from: ResolvedPos,
  $to: ResolvedPos,
  nodeTr: Node | null,
  markType: MarkType,
  attrs?: Record<string, unknown>
): Transaction {
  if (0 < nodeTr?.marks.length && hasMark(nodeTr.marks, 'mark-text-color')) {
    tr = tr.removeMark($from.pos, $to.pos, _schema.marks['mark-text-color']);
  }
  return tr.addMark($from.pos, $to.pos, markType.create(attrs));
}

function handleTextColorMark(
  tr: Transaction,
  $from: ResolvedPos,
  $to: ResolvedPos,
  nodeTr: Node | null,
  markType: MarkType,
  attrs?: Record<string, unknown>
): Transaction {
  if (0 < nodeTr?.marks.length) {
    if (nodeTr && !hasMark(nodeTr.marks, 'link')) {
      tr = tr.addMark($from.pos, $to.pos, markType.create(attrs));
    }
  } else if (nodeTr instanceof Node) {
    let from = $from.pos;
    let to = 0;
    nodeTr.descendants((child) => {
      if (child) {
        const nodeTr_1 = tr.doc.nodeAt(from);
        to = from + child.nodeSize;

        if (nodeTr_1.childCount > 0) {
          if (!hasMark(child.marks, 'link')) {
            tr = tr.addMark(from, to + 1, markType.create(attrs));
          }
          from = to + 1;
        } else {
          if (!hasMark(child.marks, 'link')) {
            tr = tr.addMark(from, to, markType.create(attrs));
          }
          from = to;
        }
      }
    });
  } else {
    tr = tr.addMark($from.pos, $to.pos, markType.create(attrs));
  }
  return tr;
}

function handleGeneralMark(
  tr: Transaction,
  $from: ResolvedPos,
  $to: ResolvedPos,
  nodeTr: Node | null,
  markType: MarkType,
  attrs?: Record<string, unknown>,
  isCustomStyleApplied?: boolean
): Transaction {
  const origFrom = $from.pos;
  const origTo = $to.pos;

  if (undefined === isCustomStyleApplied) {
    tr = tr.addMark(origFrom, origTo, markType.create(attrs));
  } else {
    if (nodeTr) {
      let from = origFrom;
      let to = 0;
      nodeTr.descendants((child) => {
        if (child) {
          const nodeTr_1 = tr.doc.nodeAt(from);
          to = from + child.nodeSize;
          if (nodeTr_1.childCount > 0) {
            tr = tr.addMark(from, to + 1, markType.create(attrs));
            from = to + 1;
          } else {
            tr = tr.addMark(from, to, markType.create(attrs));
            from = to;
          }
        }
      });
    }
  }
  return tr;
}

function processRange(
  tr: Transaction,
  _schema: Schema,
  range: {$from: ResolvedPos; $to: ResolvedPos},
  markType: MarkType,
  attrs?: Record<string, unknown>,
  isCustomStyleApplied?: boolean,
  has?: boolean
): Transaction {
  const {$from, $to} = range;
  const nodeTr = tr.doc.nodeAt($from.pos);

  if (has && isCustomStyleApplied) {
    const {tr: result} = applyMarkToNode(
      tr,
      $from.pos,
      nodeTr,
      markType,
      attrs
    );
    return result;
  } else if (attrs) {
    if ('link' === markType.name) {
      return handleLinkMark(tr, _schema, $from, $to, nodeTr, markType, attrs);
    } else if ('mark-text-color' === markType.name) {
      return handleTextColorMark(tr, $from, $to, nodeTr, markType, attrs);
    } else {
      return handleGeneralMark(
        tr,
        $from,
        $to,
        nodeTr,
        markType,
        attrs,
        isCustomStyleApplied
      );
    }
  } else if (has && !isCustomStyleApplied && !attrs) {
    tr = tr.removeMark($from.pos, $to.pos, markType);
  }
  return tr;
}

export function applyMark(
  tr: Transform,
  _schema: Schema,
  markType: MarkType,
  attrs?: Record<string, unknown>,
  isCustomStyleApplied?: boolean
): Transform {
  if (!(tr as Transaction).selection || !tr.doc || !markType) {
    return tr;
  }
  const {empty, $cursor, ranges} = (tr as Transaction)
    .selection as TextSelection;
  if ((empty && !$cursor) || !markApplies(tr.doc, ranges, markType)) {
    return tr;
  }
  if ($cursor) {
    tr = (tr as Transaction).removeStoredMark(markType);
    return (tr as Transaction).addStoredMark(markType.create(attrs));
  }
  let has = false;
  has = hasMarkInRanges(tr.doc, ranges, markType);
  for (const range of ranges) {
    tr = processRange(
      tr as Transaction,
      _schema,
      range,
      markType,
      attrs,
      isCustomStyleApplied,
      has
    );
  }
  return tr;
}
