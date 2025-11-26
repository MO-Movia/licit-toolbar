/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import cx from 'classnames';
import {EditorState} from 'prosemirror-state';
import {Transform} from 'prosemirror-transform';
import {EditorView} from 'prosemirror-view';
import * as React from 'react';
import ReactDOM from 'react-dom';

import CommandButton from './CommandButton';
import CommandMenuButton from './CommandMenuButton';
import {CustomButton, ThemeContext} from '@modusoperandi/licit-ui-commands';
import {COMMAND_GROUPS, CommandGroup, parseLabel} from '../EditorTollbarConfig';
import Icon from './Icon';
import ResizeObserver from '../ResizeObserver';
import {UICommand} from '@modusoperandi/licit-doc-attrs-step';
import isReactClass from '../IsReactClass';

import '../styles/czi-editor-toolbar.css';
import {LicitPlugin} from '../ConvertFromJSON';
import {EditorViewEx} from '../Constants';
import {ToolbarMenuConfig} from '../Types';

interface LicitPluginWithKey extends LicitPlugin {
  key: string;
}

type MenuItem = Record<string, UICommand | React.PureComponent | string>;

export class EditorToolbar extends React.PureComponent {
  static readonly contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;
  _body = null;

  declare props: {
    disabled?: boolean;
    dispatchTransaction?: (tr: Transform) => void;
    editorState: EditorState;
    editorView: EditorViewEx;
    onReady?: (view: EditorView) => void;
    readOnly?: boolean;
    toolbarConfig?: ToolbarMenuConfig[];
  };

  state = {
    expanded: false,
    wrapped: null,
  };

  render(): React.ReactElement<CustomButton> {
    const {wrapped, expanded} = this.state;
    const {toolbarConfig} = this.props;
    const theme = this.context;
    console.warn(theme);
    let commandGroups: React.ReactElement[];
    let className = cx('czi-editor-toolbar', {expanded, wrapped});
    const toolbarBodyClass = cx('czi-editor-toolbar-body-content', theme);

    if (expanded && !wrapped) {
      className = 'czi-editor-toolbar';
    }
    const expVal = expanded ? 1 : 0;
    const wrappedButton = wrapped ? (
      <CustomButton
        active={expanded}
        className="czi-editor-toolbar-expand-button"
        icon={Icon.get('more_horiz')}
        key="expand"
        onClick={this._toggleExpansion}
        theme={theme.toString()}
        title="More"
        value={expVal}
      />
    ) : null;

    if (toolbarConfig && toolbarConfig.length > 0) {
      toolbarConfig.sort((a, b) => a.menuPosition - b.menuPosition);
      const pluginObjects = toolbarConfig
        .filter((item) => item.isPlugin === true)
        .map((toolbarObj) => {
          const matchingPlugin = this.props.editorState.plugins.find(
            (plugin) => (plugin as LicitPluginWithKey).key === toolbarObj.key
          );

          if (matchingPlugin) {
            // Return a new object with properties from both toolbar and plugin
            return {
              ...toolbarObj,
              menuCommand: (matchingPlugin as LicitPlugin).initButtonCommands(
                theme
              ),
            };
          }

          return null; // If no matching plugin is found
        })
        .filter(Boolean); // Remove null entries
      console.warn(pluginObjects);

      if (pluginObjects && pluginObjects.length > 0) {
        toolbarConfig.forEach((obj2) => {
          const correspondingObj = pluginObjects.find(
            (obj1) => obj1.key === obj2.key
          );
          if (correspondingObj) {
            obj2.menuCommand = correspondingObj.menuCommand;
            obj2.key = correspondingObj.key;
          }
        });

        console.warn(toolbarConfig);
      }
      const m = this.processMenuItems(toolbarConfig);
      const k = this.groupMenuItems(m);
      commandGroups = k.map(this._renderButtonsGroup_1).filter(Boolean);
    } else {
      // const theme = theme;
      // Start with static button controls and append any button groups
      // supplied by plugins
      commandGroups = COMMAND_GROUPS.concat(
        ((this.props.editorState && this.props.editorState.plugins) || [])
          .map(
            (p) =>
              'initButtonCommands' in p &&
              (p as LicitPlugin).initButtonCommands(theme)
          )
          .filter(Boolean)
      )
        .map(this._renderButtonsGroup)
        .filter(Boolean);
    }
    return (
      <div className={className}>
        <div className="czi-editor-toolbar-flex">
          <div className="czi-editor-toolbar-body">
            <div className={toolbarBodyClass} ref={this._onBodyRef}>
              <i className="czi-editor-toolbar-wrapped-anchor" />
              {commandGroups}
              <div className="czi-editor-toolbar-background">
                <div className="czi-editor-toolbar-background-line" />
                <div className="czi-editor-toolbar-background-line" />
                <div className="czi-editor-toolbar-background-line" />
                <div className="czi-editor-toolbar-background-line" />
                <div className="czi-editor-toolbar-background-line" />
              </div>
              <i className="czi-editor-toolbar-wrapped-anchor" />
            </div>
            {wrappedButton}
          </div>
          <div className="czi-editor-toolbar-footer" />
        </div>
      </div>
    );
  }

  // getUndoMenu(menuItems) {
  //   let retArr = [];
  //   return menuItems.reduce((acc, item) => {

  //     if (item.isPlugin) {
  //       const keysArray = Object.keys(item.menuCommand);
  //       // Access the first key
  //       const firstKey = keysArray && keysArray.length > 0 ? keysArray[0] : undefined;
  //       if (firstKey) {
  //         retArr.push(acc[firstKey] = item.menuCommand[firstKey]);
  //       }
  //     } else {
  //       retArr.push(acc[item.key] = item.menuCommand);
  //     }
  //     // }
  //     return retArr;
  //   }, {});
  // }

  // processMenuItems(menuItems) {

  //     if (item.isPlugin) {
  //       const firstKey = keysArray && keysArray.length > 0 ? keysArray[0] : undefined;
  //       if (firstKey) {
  //         acc[firstKey] = item.menuCommand[firstKey];
  //       }
  //     } else {
  //       acc[item.key] = item.menuCommand;
  //     }
  //     return acc;
  //   }, {});
  // }

  //   processMenuItems(menuItems) {
  //     return menuItems.reduce((acc, item) => {
  //       const { group, key, menuCommand, menuPosition } = item; // Destructure properties

  //       if (!acc[group]) {
  //         acc[group] = []; // Create new group array if it doesn't exist
  //       }
  //       acc[group].push({ [key]: menuCommand, pos: menuPosition }); // Push key-value pair to group array
  //       return acc;
  //     }, {});
  //   }
  //   sortItemsByPosition(items: MenuItem[]): MenuItem[] {
  //   return items.sort((a, b) => {
  //     if (!a.menuPosition || !b.menuPosition) return 0; // Handle missing positions
  //     return a.menuPosition - b.menuPosition;
  //   });
  // }
  // like our structure need to check
  processMenuItems(menuItems) {
    return menuItems.reduce((acc, item) => {
      if (item.isPlugin) {
        const keysArray = Object.keys(item.menuCommand);
        const firstKey =
          keysArray && keysArray.length > 0 ? keysArray[0] : undefined;
        if (firstKey) {
          const newItem = {
            [firstKey]: item.menuCommand[firstKey],
            group: item.group, // Use key as property name
          };
          acc.push(newItem);
        }
      } else {
        const newItem = {
          [item.key]: item.menuCommand,
          group: item.group, // Use key as property name
        };
        acc.push(newItem);
      }

      return acc as Array<MenuItem>;
    }, []) as Array<MenuItem>;
  }

  groupMenuItems = (items: Array<MenuItem>): Array<Record<string, unknown>> => {
    const groups: Array<Record<string, unknown>> = [];
    let prefix = 1;

    items.forEach((item) => {
      const groupName = item.group || 'Ungrouped'; // Use 'Ungrouped' for missing groups
      if (!groups.some((g) => g.group === groupName)) {
        const itemsInGroup = items.filter((i) => i.group === groupName);
        groups.push({
          [prefix]: {...itemsInGroup},
          group: groupName,
        });
      }
      prefix++;
    });

    return groups;
  };

  sortGroupItems = (items: {order: number}[]) => {
    return items.sort((a, b) => a.order - b.order);
  };
  orderedMenuData = (
    menuData: Record<string, {order: number}[]>
  ): Record<string, {order: number}[]> =>
    Object.entries(menuData).reduce(
      (acc: Record<string, {order: number}[]>, [groupName, items]) => {
        acc[groupName] = this.sortGroupItems(items);
        return acc;
      },
      {}
    );

  _renderButtonsGroup = (
    group: CommandGroup,
    _index: number
  ): React.ReactElement => {
    const theme = this.context;
    console.warn('se ' + theme);
    const buttons = Object.keys(group)
      .map((label) => {
        const obj = group[label];

        if (isReactClass(obj)) {
          const ThatComponent = obj as React.ComponentType<{
            dispatch: (tr: Transform) => void;
            editorState: EditorState;
            editorView: EditorViewEx;
          }>;
          const {editorState, editorView, dispatchTransaction} = this.props;
          return (
            <ThatComponent
              dispatch={dispatchTransaction}
              editorState={editorState}
              editorView={editorView}
              key={label}
            />
          );
        } else if (obj instanceof UICommand) {
          return this._renderButton(label, obj, theme.toString());
        } else if (Array.isArray(obj)) {
          return this._renderMenuButton(label, obj);
        } else {
          return null;
        }
      })
      .filter(Boolean);
    return <div className={`czi-custom-buttons ${theme}`}>{buttons}</div>;
  };

  _renderButtonsGroup_1 = (
    group: Record<string, UICommand | React.PureComponent>,
    _index: number
  ): React.ReactElement => {
    const keys = Object.keys(group);
    const theme = this.context;
    console.warn('se ' + theme);
    const newgroup = group[keys[0]];
    const buttons = [];
    let index = 0;
    Object.entries(newgroup).forEach(([_key, value]) => {
      buttons.push(
        Object.keys(value)
          .map((label) => {
            if (label !== 'group') {
              const obj = newgroup[index][label];
              index++;
              if (isReactClass(obj)) {
                // JSX requies the component to be named with upper camel case.
                const ThatComponent = obj as React.ComponentType<{
                  dispatch: (tr: Transform) => void;
                  editorState: EditorState;
                  editorView: EditorViewEx;
                }>;
                const {editorState, editorView, dispatchTransaction} =
                  this.props;
                return (
                  <ThatComponent
                    dispatch={dispatchTransaction}
                    editorState={editorState}
                    editorView={editorView}
                    key={label}
                  />
                );
              } else if (obj instanceof UICommand) {
                return this._renderButton(label, obj, theme.toString());
              } else if (Array.isArray(obj)) {
                return this._renderMenuButton(label, obj);
              } else {
                return null;
              }
            }
          })
          .filter(Boolean)
      );
    });

    return <div className={`czi-custom-buttons ${theme}`}>{buttons}</div>;
  };

  _renderMenuButton = (
    label: string,
    commandGroups: CommandGroup[]
  ): React.ReactElement<CommandMenuButton> => {
    const {editorState, editorView, disabled, dispatchTransaction} = this.props;
    const theme = this.context;
    console.warn('separseLabel ' + theme);
    const {icon, title} = parseLabel(label, theme ? theme.toString() : 'dark');
    return (
      <CommandMenuButton
        commandGroups={commandGroups}
        disabled={disabled}
        dispatch={dispatchTransaction}
        editorState={editorState}
        editorView={editorView}
        icon={icon}
        key={label}
        label={icon ? null : title}
        title={title}
      />
    );
  };

  _renderButton = (
    label: string,
    command: UICommand,
    theme: string
  ): React.ReactElement<CommandButton> => {
    const {disabled, editorState, editorView, dispatchTransaction} = this.props;
    const {icon, title} = parseLabel(label, theme);

    return (
      <CommandButton
        command={command}
        disabled={disabled}
        dispatch={dispatchTransaction}
        editorState={editorState}
        editorView={editorView}
        icon={icon}
        key={label}
        label={icon ? null : title}
        title={title}
      />
    );
  };

  _onBodyRef = (ref: React.ReactInstance): void => {
    if (ref) {
      this._body = ref;
      // Mounting
      const el = ReactDOM.findDOMNode(ref);
      if (el instanceof HTMLElement) {
        ResizeObserver.observe(el, this._checkIfContentIsWrapped);
      }
    } else {
      // Unmounting.
      const el = this._body && ReactDOM.findDOMNode(this._body);
      if (el instanceof HTMLElement) {
        ResizeObserver.unobserve(el);
      }
      this._body = null;
    }
  };

  _checkIfContentIsWrapped = (): void => {
    const ref = this._body;
    const el = ref && ReactDOM.findDOMNode(ref);
    const startAnchor = el && el.firstChild;
    const endAnchor = el && el.lastChild;
    if (startAnchor && endAnchor) {
      const wrapped =
        (startAnchor as HTMLElement).offsetTop <
        (endAnchor as HTMLElement).offsetTop;
      this.setState({wrapped});
    }
  };

  _toggleExpansion = (expanded: boolean): void => {
    this.setState({expanded: !expanded});
  };
}
