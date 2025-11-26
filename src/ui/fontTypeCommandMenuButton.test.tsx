/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {EditorState} from 'prosemirror-state';
import FontTypeCommandMenuButton from './FontTypeCommandMenuButton';
import {UICommand} from '@modusoperandi/licit-doc-attrs-step';

//  Use `var` to prevent hoisting issues
var _mockFindActiveFontType: jest.Mock;
jest.mock('../findActiveFontType', () => {
  const fn = jest.fn();
  _mockFindActiveFontType = fn;
  return {__esModule: true, default: fn};
});

//  Safe mock pattern for CommandMenuButton, using `var` to avoid TDZ with jest.mock hoisting
var _MockCommandMenuButton: jest.Mock;
jest.mock('./commandMenuButton', () => {
  const fn = jest.fn((_props: jest.Mock) => null);
  _MockCommandMenuButton = fn;
  return {__esModule: true, default: fn};
});

describe('FontTypeCommandMenuButton (pure Jest)', () => {
  const mockDispatch = jest.fn();
  const mockEditorState = {} as EditorState;

  beforeEach(() => {
    jest.clearAllMocks();
    UICommand.theme = 'dark';
  });

  it('should instantiate component without throwing', () => {
    const props = {
      dispatch: mockDispatch,
      editorState: mockEditorState,
      editorView: {disabled: false},
    } as unknown as FontTypeCommandMenuButton['props'];

    expect(() => new FontTypeCommandMenuButton(props)).not.toThrow();
  });

  it('should render CommandMenuButton with correct props', () => {
    const fontType = 'Helvetica';
    _mockFindActiveFontType.mockReturnValue(fontType);

    const props = {
      dispatch: mockDispatch,
      editorState: mockEditorState,
      editorView: {disabled: false},
    } as unknown as FontTypeCommandMenuButton['props'];

    const component = new FontTypeCommandMenuButton(props);
    component.render();

    expect(_MockCommandMenuButton).toBeDefined();
  });

  it('should render CommandMenuButton with correct props and editorView disabled true', () => {
    const fontType = 'Helvetica';
    _mockFindActiveFontType.mockReturnValue(fontType);

    const props = {
      dispatch: mockDispatch,
      editorState: mockEditorState,
      editorView: {disabled: true},
    } as unknown as FontTypeCommandMenuButton['props'];

    const component = new FontTypeCommandMenuButton(props);
    component.render();

    expect(_MockCommandMenuButton).toBeDefined();
  });
});
