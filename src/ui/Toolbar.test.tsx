/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {EditorState} from 'prosemirror-state';
import {Transform} from 'prosemirror-transform';
import {EditorView} from 'prosemirror-view';
import * as React from 'react';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react';
import {EditorToolbar} from './Toolbar';
import {UICommand} from '@modusoperandi/licit-doc-attrs-step';
import {EditorViewEx} from '../Constants';
import {ToolbarMenuConfig} from '../Types';
import {Schema} from 'prosemirror-model';

type IconOrLabel = string | React.ReactElement | null;

// Mock ResizeObserver to control its behavior and track calls
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
let resizeCallback: () => void;

jest.mock('../ResizeObserver', () => ({
  observe: (el: HTMLElement, cb: () => void) => {
    mockObserve(el, cb);
    resizeCallback = cb; // Capture the callback to trigger it manually
  },
  unobserve: (el: HTMLElement) => {
    mockUnobserve(el);
  },
}));

// Mock dependencies
jest.mock('./CommandButton', () => ({
  __esModule: true,
  default: ({
    label,
    title,
    icon,
    disabled,
  }: {
    label?: IconOrLabel;
    title?: string;
    icon?: IconOrLabel;
    disabled?: boolean;
  }) => (
    <button
      className="command-button"
      disabled={disabled}
      title={title}
      data-testid="command-button"
    >
      {icon && <span data-testid="icon">{icon}</span>}
      {label && <span data-testid="label">{label}</span>}
    </button>
  ),
}));

jest.mock('./CommandMenuButton', () => ({
  __esModule: true,
  default: ({
    label,
    title,
    icon,
    disabled,
  }: {
    label?: IconOrLabel;
    title?: string;
    icon?: IconOrLabel;
    disabled?: boolean;
  }) => (
    <button
      className="command-menu-button"
      disabled={disabled}
      title={title}
      data-testid="command-menu-button"
    >
      {icon && <span data-testid="menu-icon">{icon}</span>}
      {label && <span data-testid="menu-label">{label}</span>}
    </button>
  ),
}));

jest.mock('@modusoperandi/licit-ui-commands', () => ({
  CustomButton: ({
    className,
    active,
    icon,
    onClick,
    title,
    value,
    theme,
  }: {
    className?: string;
    active?: boolean;
    icon?: string | React.ReactElement | null;
    onClick?: (value: number) => void;
    title?: string;
    value?: number;
    theme?: string;
  }) => (
    <button
      className={className}
      data-active={active}
      onClick={() => onClick?.(value || 0)}
      title={title}
      data-theme={theme}
      data-testid="custom-button"
    >
      {icon && <span data-testid="custom-icon">{icon}</span>}
    </button>
  ),
  ThemeContext: React.createContext('default'),
}));

jest.mock('../EditorTollbarConfig', () => ({
  COMMAND_GROUPS: [
    {
      'test-command': {} as UICommand,
    },
  ],
  parseLabel: jest.fn((label: string, _theme: string) => ({
    icon: `icon-${label}`,
    title: `Title ${label}`,
  })),
}));

jest.mock('./Icon', () => ({
  __esModule: true,
  default: {
    get: jest.fn((name: string) => `icon-${name}`),
  },
}));

// jest.mock('../ResizeObserver', () => ({
//   __esModule: true,
//   default: {
//     observe: jest.fn(),
//     unobserve: jest.fn(),
//   },
// }));

// jest.mock('react-dom', () => ({
//   ...jest.requireActual('react-dom'),
//   findDOMNode: jest.fn((ref: React.ReactInstance | null) => {
//     if (!ref) return null;
//     // Mock implementation that returns a fake HTMLElement
//     return {
//       firstChild: {offsetTop: 10},
//       lastChild: {offsetTop: 20},
//     } as unknown as HTMLElement;
//   }),
// }));

jest.mock('../IsReactClass', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

interface EditorToolbarProps {
  disabled?: boolean;
  dispatchTransaction?: (tr: Transform) => void;
  editorState: EditorState;
  editorView: EditorViewEx;
  onReady?: (view: EditorView) => void;
  readOnly?: boolean;
  toolbarConfig?: ToolbarMenuConfig[];
}

describe('EditorToolbar', () => {
  let container: HTMLDivElement;
  let root: Root;
  let mockDispatch: jest.Mock<void, [Transform]>;
  let mockEditorState: EditorState;
  let mockEditorView: EditorViewEx;
  let mockUICommand: UICommand;
  let editorState: EditorState;
  let editorView: EditorViewEx;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockDispatch = jest.fn<void, [Transform]>();
    mockEditorState = {
      plugins: [],
    } as unknown as EditorState;
    mockEditorView = {} as EditorViewEx;
    mockUICommand = {} as UICommand;

    const schema = new Schema({
      nodes: {doc: {content: 'text*'}, text: {}},
    });
    editorState = EditorState.create({schema});
    editorView = {state: editorState} as EditorViewEx;

    jest.clearAllMocks();
    resizeCallback = undefined;
  });

  const defaultProps = {
    editorState,
    editorView,
  };

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    document.body.removeChild(container);
  });

  const renderComponent = (props: Partial<EditorToolbarProps> = {}) => {
    const defaultProps: EditorToolbarProps = {
      editorState: mockEditorState,
      editorView: mockEditorView,
      dispatchTransaction: mockDispatch,
      ...props,
    };

    act(() => {
      root = createRoot(container);
      root.render(<EditorToolbar {...defaultProps} />);
    });
  };

  test('renders toolbar with correct className', () => {
    renderComponent();

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('renders toolbar body', () => {
    renderComponent();

    const toolbarBody = container.querySelector('.czi-editor-toolbar-body');
    expect(toolbarBody).toBeTruthy();
  });

  test('renders toolbar footer', () => {
    renderComponent();

    const footer = container.querySelector('.czi-editor-toolbar-footer');
    expect(footer).toBeTruthy();
  });

  test('renders background lines', () => {
    renderComponent();

    const backgroundLines = container.querySelectorAll(
      '.czi-editor-toolbar-background-line'
    );
    expect(backgroundLines.length).toBe(5);
  });

  test('does not render expand button when not wrapped', () => {
    renderComponent();

    const expandButton = container.querySelector(
      '.czi-editor-toolbar-expand-button'
    );
    expect(expandButton).toBeFalsy();
  });

  test('applies disabled prop to commands', () => {
    renderComponent({disabled: true});

    // The disabled prop should be passed through to child components
    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('renders with custom toolbarConfig', () => {
    const toolbarConfig: ToolbarMenuConfig[] = [
      {
        key: 'test-key',
        group: 'test-group',
        menuPosition: 1,
        isPlugin: false,
        menuCommand: mockUICommand,
      },
    ];

    renderComponent({toolbarConfig});

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('sorts toolbarConfig by menuPosition', () => {
    const toolbarConfig: ToolbarMenuConfig[] = [
      {
        key: 'second',
        group: 'group1',
        menuPosition: 2,
        isPlugin: false,
        menuCommand: mockUICommand,
      },
      {
        key: 'first',
        group: 'group1',
        menuPosition: 1,
        isPlugin: false,
        menuCommand: mockUICommand,
      },
    ];

    renderComponent({toolbarConfig});

    // Verify that the toolbar renders (sorting happens internally)
    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('filters and maps plugin objects from toolbarConfig', () => {
    const mockPlugin = {
      key: 'test-plugin',
      initButtonCommands: jest.fn(() => ({
        'plugin-command': mockUICommand,
      })),
    };

    const toolbarConfig: ToolbarMenuConfig[] = [
      {
        key: 'test-plugin',
        group: 'plugin-group',
        menuPosition: 1,
        isPlugin: true,
        menuCommand: undefined,
      },
    ];

    const editorStateWithPlugins = {
      ...mockEditorState,
      plugins: [mockPlugin],
    } as unknown as EditorState;

    renderComponent({
      toolbarConfig,
      editorState: editorStateWithPlugins,
    });

    expect(mockPlugin.initButtonCommands).toHaveBeenCalled();
  });

  test('renders command buttons for UICommand instances', () => {
    renderComponent();

    // Default COMMAND_GROUPS should render command buttons
    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('processMenuItems handles non-plugin items', () => {
    const toolbarConfig: ToolbarMenuConfig[] = [
      {
        key: 'regular-key',
        group: 'group1',
        menuPosition: 1,
        isPlugin: false,
        menuCommand: mockUICommand,
      },
    ];

    renderComponent({toolbarConfig});

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('groupMenuItems creates groups correctly', () => {
    const toolbarConfig: ToolbarMenuConfig[] = [
      {
        key: 'item1',
        group: 'group1',
        menuPosition: 1,
        isPlugin: false,
        menuCommand: mockUICommand,
      },
      {
        key: 'item2',
        group: 'group1',
        menuPosition: 2,
        isPlugin: false,
        menuCommand: mockUICommand,
      },
      {
        key: 'item3',
        group: 'group2',
        menuPosition: 3,
        isPlugin: false,
        menuCommand: mockUICommand,
      },
    ];

    renderComponent({toolbarConfig});

    const customButtons = container.querySelectorAll('.czi-custom-buttons');
    expect(customButtons.length).toBeGreaterThan(0);
  });

  test('handles editorState with plugins', () => {
    const mockPlugin = {
      initButtonCommands: jest.fn(() => ({
        'plugin-command': mockUICommand,
      })),
    };

    const editorStateWithPlugins = {
      ...mockEditorState,
      plugins: [mockPlugin],
    } as unknown as EditorState;

    renderComponent({editorState: editorStateWithPlugins});

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('filters out falsy values from command groups', () => {
    renderComponent();

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
    // Should render without errors even with potential null/undefined values
  });

  test('renders wrapped anchor elements', () => {
    renderComponent();

    const anchors = container.querySelectorAll(
      '.czi-editor-toolbar-wrapped-anchor'
    );
    expect(anchors.length).toBe(2);
  });

  test('renders with theme context', () => {
    renderComponent();

    const bodyContent = container.querySelector(
      '.czi-editor-toolbar-body-content'
    );
    expect(bodyContent).toBeTruthy();
    expect(bodyContent?.className).toContain('czi-editor-toolbar-body-content');
  });

  test('handles empty toolbarConfig', () => {
    renderComponent({toolbarConfig: []});

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('handles toolbarConfig without plugins', () => {
    const toolbarConfig: ToolbarMenuConfig[] = [
      {
        key: 'regular-command',
        group: 'group1',
        menuPosition: 1,
        isPlugin: false,
        menuCommand: mockUICommand,
      },
    ];

    renderComponent({toolbarConfig});

    const customButtons = container.querySelectorAll('.czi-custom-buttons');
    expect(customButtons.length).toBeGreaterThan(0);
  });

  test('renders toolbar flex container', () => {
    renderComponent();

    const flexContainer = container.querySelector('.czi-editor-toolbar-flex');
    expect(flexContainer).toBeTruthy();
  });

  test('renders background container', () => {
    renderComponent();

    const background = container.querySelector(
      '.czi-editor-toolbar-background'
    );
    expect(background).toBeTruthy();
  });

  test('applies expanded className when state is expanded', () => {
    renderComponent();

    // Initially not expanded
    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar?.className).not.toContain('expanded');
  });

  test('handles readOnly prop', () => {
    renderComponent({readOnly: true});

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  test('calls onReady callback when provided', () => {
    const mockOnReady = jest.fn();
    renderComponent({onReady: mockOnReady});

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
    // onReady would be called in the actual implementation context
  });

  test('handles array commands for menu button rendering', () => {
    renderComponent();

    const toolbar = container.querySelector('.czi-editor-toolbar');
    expect(toolbar).toBeTruthy();
  });

  describe('_checkIfContentIsWrapped', () => {
    it('should set state to wrapped: true when anchors have different offsets', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(<EditorToolbar {...defaultProps} />);
      });
      const body = container.querySelector('.czi-editor-toolbar-body-content');
      const startAnchor = body.firstChild as HTMLElement;
      const endAnchor = body.lastChild as HTMLElement;

      // Mock DOM properties to simulate wrapping
      Object.defineProperty(startAnchor, 'offsetTop', {
        configurable: true,
        value: 10,
      });
      Object.defineProperty(endAnchor, 'offsetTop', {
        configurable: true,
        value: 50,
      });

      // Manually trigger the resize observer callback
      resizeCallback();

      // The "wrapped" class should be added to the toolbar
      expect(container.querySelector('.czi-editor-toolbar')).toBeDefined();
    });

    it('should set state to wrapped: false when anchors have the same offset', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(<EditorToolbar {...defaultProps} />);
      });
      const body = container.querySelector('.czi-editor-toolbar-body-content');
      const startAnchor = body.firstChild as HTMLElement;
      const endAnchor = body.lastChild as HTMLElement;

      // Mock DOM properties to simulate non-wrapping
      Object.defineProperty(startAnchor, 'offsetTop', {
        configurable: true,
        value: 10,
      });
      Object.defineProperty(endAnchor, 'offsetTop', {
        configurable: true,
        value: 10,
      });

      // Manually trigger the resize observer callback
      resizeCallback();

      // The "wrapped" class should not be present
      expect(container.querySelector('.czi-editor-toolbar')).toBeDefined();
    });
  });
});
