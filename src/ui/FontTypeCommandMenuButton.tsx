/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import CommandMenuButton from './CommandMenuButton';
import { FontTypeCommand } from '@modusoperandi/licit-ui-commands';
import * as React from 'react';
import { EditorState } from 'prosemirror-state';
import { FONT_TYPE_NAMES } from '../FontTypeMarkSpec';
import findActiveFontType, {
  FONT_TYPE_NAME_DEFAULT,
} from '../FindActiveFontType';
import { Transform } from 'prosemirror-transform';
import { editorType } from './FontSizeCommandMenuButton';
type PropsType = {
  dispatch: (tr: Transform) => void;
  editorState: EditorState;
  editorView?: editorType;
};
const FONT_TYPE_COMMANDS: Record<string, unknown> = {
  [FONT_TYPE_NAME_DEFAULT]: new FontTypeCommand(''),
};

FONT_TYPE_NAMES.forEach((name) => {
  FONT_TYPE_COMMANDS[name] = new FontTypeCommand(name);
});

const COMMAND_GROUPS = [FONT_TYPE_COMMANDS];

class FontTypeCommandMenuButton extends React.PureComponent<PropsType> {
  declare props: PropsType;

  render(): React.ReactElement<CommandMenuButton> {
    const { dispatch, editorState, editorView } = this.props;
    const fontType = findActiveFontType(editorState);
    return (
      // <CommandMenuButton  className="width-100"
      <CommandMenuButton  className="width-100 czi-dropdown-border"
        // [FS] IRAD-1008 2020-07-16
        // Disable font type menu on editor disable state
        commandGroups={COMMAND_GROUPS}
        disabled={editorView && editorView.disabled ? true : false}
        dispatch={dispatch}
        editorState={editorState}
        editorView={editorView}
        label={fontType}
      />
    );
  }
}

export default FontTypeCommandMenuButton;
