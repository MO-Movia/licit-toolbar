/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import { EditorState } from 'prosemirror-state';
import { Transform } from 'prosemirror-transform';
import { EditorView } from 'prosemirror-view';

import { UICommand } from '@modusoperandi/licit-doc-attrs-step';
import { Editor } from '@tiptap/react';

class HistoryRedoCommand extends UICommand {

  getEditor = (): Editor => {
    return UICommand.prototype.editor;
  };

  isEnabled = (_state): boolean => {
    const history = (_state).history$;
    if (history.undone.eventCount === 0) {
      return false;
    }
    else {
      return true;
    }
  };

  execute = (
    _state: EditorState,
    _dispatch?: (tr: Transform) => void,
    _view?: EditorView
  ): boolean => {
    return this.getEditor().commands.redo();
  };

  waitForUserInput(): Promise<null> {
    return Promise.resolve(null);
  }
  executeWithUserInput(): boolean {
    return false;
  }
  cancel(): void {
    return null;
  }
  executeCustom(_state: EditorState, tr: Transform, _from: number, _to: number): Transform {
    return tr;
  }
  executeCustomStyleForTable(_state: EditorState, tr: Transform): Transform {
    return tr;
  }

}

export default HistoryRedoCommand;
