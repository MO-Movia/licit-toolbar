/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {toggleMark} from 'prosemirror-commands';
import {EditorState, SelectionRange, TextSelection} from 'prosemirror-state';
import {Transform} from 'prosemirror-transform';
import {EditorView} from 'prosemirror-view';
import {Node as ProseMirrorNode, MarkType} from 'prosemirror-model';
import {findNodesWithSameMark} from './findNodesWithSameMark';
import {UICommand} from '@modusoperandi/licit-doc-attrs-step';
import * as React from 'react';

export class MarkToggleCommand extends UICommand {
  _markName: string;

  constructor(markName: string) {
    super();
    this._markName = markName;
  }

  isActive = (state: EditorState): boolean => {
    const {schema, doc, selection} = state;
    const {from, to} = selection;
    const markType = schema.marks[this._markName];
    if (markType && from < to) {
      return !!findNodesWithSameMark(doc, from, to - 1, markType);
    }
    return false;
  };

  waitForUserInput = (
    _state: EditorState,
    _dispatch?: (tr: Transform) => void,
    _view?: EditorView,
    _event?: React.SyntheticEvent
  ): Promise<undefined> => {
    return Promise.resolve(undefined);
  };

  executeWithUserInput = (
    _state: EditorState,
    _dispatch?: (tr: Transform) => void,
    _view?: EditorView,
    _inputs?: string
  ): boolean => {
    return false;
  };

  cancel(): void {
    return null;
  }

  execute = (
    state: EditorState,
    dispatch?: (tr: Transform) => void,
    _view?: EditorView
  ): boolean => {
    const {schema, selection, tr} = state;
    const markType = schema.marks[this._markName];
    if (!markType) {
      return false;
    }

    const {from, to} = selection;
    if (tr && to === from + 1) {
      const node = tr.doc.nodeAt(from);
      if (node && node.isAtom && !node.isText && node.isLeaf) {
        // An atomic node (e.g. Image) is selected.
        return false;
      }
    }

    //Replace `toggleMark` with transform that does not change scroll
    // position.
    return toggleMark(markType)(state, dispatch);
  };

  // [FS] IRAD-1087 2020-09-30
  // Method to execute strike, em, strong, underline, superscrpt for custom styling implementation.
  executeCustom = (
    state: EditorState,
    tr: Transform,
    from: number,
    to: number
  ): Transform => {
    const {schema} = state;
    const markType = schema.marks[this._markName];
    if (!markType) {
      return tr;
    }

    if (tr && to === from + 1) {
      const node = tr.doc.nodeAt(from);
      if (node && node.isAtom && !node.isText && node.isLeaf) {
        // An atomic node (e.g. Image) is selected.
        return tr;
      }
    }

    return toggleCustomStyle(markType, null, state, tr, from, to);
  };

  executeCustomStyleForTable(_state: EditorState, tr: Transform): Transform {
    return tr;
  }

  renderLabel(): null {
    return null;
  }
}

// [FS] IRAD-1042 2020-09-30
// Fix: overrided the toggleMarks for custom style implementation
// Return Transform object
export function toggleCustomStyle(
  markType: MarkType,
  attrs: Record<string, unknown>,
  state: EditorState,
  tr: Transform,
  posfrom: number,
  posto: number
): Transform {
  const ref = state.selection;
  const empty = ref.empty;
  const ranges = Array.from(ref.ranges);
  const isCursor = ref instanceof TextSelection && ref.$cursor;

  if ((empty && !isCursor) || !markApplies(state.doc, ranges, markType)) {
    return tr;
  }

  if (
    isCursor &&
    ref instanceof TextSelection &&
    ref.$cursor &&
    ref.$cursor.parentOffset === 0 &&
    posfrom === posto
  ) {
    if (markType.isInSet(state.storedMarks || ref.$cursor.marks())) {
      tr = state.tr.removeStoredMark(markType);
    } else {
      tr = state.tr.addStoredMark(markType.create(attrs ?? {}));
    }
  } else {
    // [FS] IRAD-1043 2020-10-27
    // No need to remove the applied custom style, if user select the same style multiple times.
    const doc = tr.doc;
    let from = posfrom;
    let to = 0;
    doc.nodesBetween(posfrom, posto, (node: ProseMirrorNode, pos: number) => {
      from = pos;
      to = from + node.nodeSize;
      if (node && node.marks.length > 0) {
        const result = node.marks.find(
          (mark) => mark.type.name === markType.name
        );
        if (!result) {
          attrs = {overridden: false};
          tr = tr.addMark(from, to, markType.create(attrs));
        } else {
          attrs = {overridden: true};
          tr = tr.addMark(from, to, markType.create(attrs));
        }
        from = to;
      }
    });
  }
  return tr;
}

// overrided method from prosemirror Transform
function markApplies(
  doc: ProseMirrorNode,
  ranges: readonly SelectionRange[],
  type: MarkType
): boolean {
  let returned = false;

  const loop = function (i: number): boolean {
    const ref = ranges[i];
    const $from = ref.$from;
    const $to = ref.$to;
    let can = $from.depth === 0 ? doc.type.allowsMarkType(type) : false;
    let bOk = false;

    if (doc.nodesBetween) {
      doc.nodesBetween($from.pos, $to.pos, (node: ProseMirrorNode) => {
        if (can) {
          return false;
        }
        can = node.inlineContent && node.type.allowsMarkType(type);
        return true;
      });
    }

    if (can) {
      bOk = true;
    }
    return bOk;
  };

  for (let i = 0; i < ranges.length; i++) {
    returned = loop(i);
    if (returned) {
      return returned;
    }
  }
  return returned;
}
