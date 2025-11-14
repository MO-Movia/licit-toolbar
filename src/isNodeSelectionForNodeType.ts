/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {Selection, NodeSelection} from 'prosemirror-state';
import {NodeType} from 'prosemirror-model';

// Whether the selection is a node for the node type provided.
export function isNodeSelectionForNodeType(
  selection: Selection,
  nodeType: NodeType
): boolean {
  if (selection instanceof NodeSelection) {
    return selection.node.type === nodeType;
  }
  return false;
}
