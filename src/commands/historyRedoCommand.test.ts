/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import HistoryRedoCommand from './historyRedoCommand';
import { UICommand } from '@modusoperandi/licit-doc-attrs-step';

interface HistoryState {
  history$: {
    undone: {
      eventCount: number;
    };
  };
}

describe('HistoryRedoCommand', () => {
  let command: HistoryRedoCommand;

  // strict typed mock
  const mockEditor = {
  commands: {
    redo: jest.fn(() => true),
  },
};


  beforeEach(() => {
    command = new HistoryRedoCommand();
    (UICommand.prototype as unknown as { editor: typeof mockEditor }).editor = mockEditor;
  });

  test('isEnabled returns true', () => {
    const state: HistoryState = { history$: { undone: { eventCount: 1 } } };
    expect(command.isEnabled(state)).toBe(true);
  });

  test('isEnabled returns false', () => {
    const state: HistoryState = { history$: { undone: { eventCount: 0 } } };
    expect(command.isEnabled(state)).toBe(false);
  });

  test('execute calls redo', () => {
    const result = command.execute({} as unknown as import('prosemirror-state').EditorState);
    expect(mockEditor.commands.redo).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
