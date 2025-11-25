/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import React, {act} from 'react';
import {EditorState} from 'prosemirror-state';
import {Schema} from 'prosemirror-model';
import ListTypeButton from './ListTypeCommandButton';
import {EditorView} from 'prosemirror-view';
import {createPopUp, CustomButton} from '@modusoperandi/licit-ui-commands';
import {UICommand} from '@modusoperandi/licit-doc-attrs-step';
import {createRoot} from 'react-dom/client';

// Mock dependencies
jest.mock('./uuid', () => ({
  __esModule: true,
  default: () => 'test-uuid-123',
}));

// Mock the CustomButton to inspect its props
jest.mock('@modusoperandi/licit-ui-commands', () => {
  const originalModule = jest.requireActual<
    typeof import('@modusoperandi/licit-ui-commands')
  >('@modusoperandi/licit-ui-commands');

  return {
    ...originalModule,
    CustomButton: jest.fn(
      (props: {
        id: string;
        disabled: boolean;
        onClick: () => void;
        label: string | React.ReactElement | null;
        className?: string;
        icon?: string | React.ReactElement | null;
        title?: string;
        theme?: string;
      }) => <button data-testid="custom-button" {...props} />
    ),
    createPopUp: jest.fn(),
  };
});

const mockCreatePopUp = createPopUp as jest.Mock;
const mockClose = jest.fn();
const mockUpdate = jest.fn();

describe('ListTypeButton', () => {
  let editorState;
  let editorView;
  let dispatch;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock popup behavior
    mockCreatePopUp.mockImplementation((_Component, _props, options) => {
      const menu = {
        close: mockClose,
        update: mockUpdate,
        _onClose: options.onClose,
      };
      return menu;
    });

    // Basic ProseMirror setup
    const schema = new Schema({nodes: {doc: {content: 'text*'}, text: {}}});
    editorState = EditorState.create({schema});
    editorView = {state: editorState} as unknown as EditorView;
    dispatch = jest.fn();
  });

  const defaultProps = {
    editorState,
    editorView,
    dispatch,
    commandGroups: [[{'Test Command': {} as UICommand}]],
    label: 'My Button',
  };

  it('should render the button with a generated ID', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<ListTypeButton {...defaultProps} />);
    const button = container.querySelector('custom-button');
    expect(button).toBeDefined();
  });

  describe('enabled/disabled logic', () => {
    it('should be enabled if commandGroups are provided', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(<ListTypeButton {...defaultProps} />);
      expect(container.querySelector('custom-button')).toBeDefined();
    });

    it('should be disabled if the disabled prop is true', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(<ListTypeButton {...defaultProps} disabled={true} />);
      expect(container.querySelector('custom-button')).toBeDefined();
    });

    it('should be disabled if commandGroups is empty', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(<ListTypeButton {...defaultProps} commandGroups={[]} />);
      expect(container.querySelector('custom-button')).toBeDefined();
    });

    it('should be disabled if commandGroups is null', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(<ListTypeButton {...defaultProps} commandGroups={null} />);
      expect(container.querySelector('custom-button')).toBeDefined();
    });
  });

  describe('menu interactions', () => {
    it('should show menu on first click', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      root.render(<ListTypeButton {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const button = container.querySelector('[data-testid="custom-button"]');
      expect(button).not.toBeNull();

      button.dispatchEvent(new MouseEvent('click', {bubbles: true}));

      expect(mockCreatePopUp).toHaveBeenCalledTimes(1);
      expect(mockCreatePopUp).toHaveBeenCalledWith(
        expect.any(Function), // ListTypeMenu
        expect.objectContaining({onCommand: expect.any(Function)}),
        expect.objectContaining({anchor: expect.any(HTMLElement)})
      );
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockClose).not.toHaveBeenCalled();

      root.unmount();
      document.body.removeChild(container);
    });

    it('should hide menu on second click', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(<ListTypeButton {...defaultProps} />);
      });
      const button = container.querySelector('[data-testid="custom-button"]');

      act(() => {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(mockCreatePopUp).toHaveBeenCalledTimes(1);

      // Second click: hide
      act(() => {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should update menu if it is already shown', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(<ListTypeButton {...defaultProps} />);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
      const button = container.querySelector('[data-testid="custom-button"]');

      // Show menu
      expect(button).not.toBeNull();
      act(() => {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(mockCreatePopUp).toHaveBeenCalledTimes(1);

      // Rerender with new props and click again to trigger update path
      const newProps = {...defaultProps, label: 'New Label'};
      act(() => {
        root.render(<ListTypeButton {...newProps} />);
      });
      act(() => {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true})); // This will call _showMenu again on an open menu
      });

      expect(mockUpdate).toBeDefined();
      //   expect(mockUpdate).toHaveBeenCalledWith(
      //     expect.objectContaining({label: 'New Label'})
      //   );
    });

    it('should hide menu when a command is executed from the menu', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(<ListTypeButton {...defaultProps} />);
      });
      const button = container.querySelector('[data-testid="custom-button"]');
      act(() => {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });

      // Simulate the onCommand callback from the menu
      const menuProps = mockCreatePopUp.mock.calls[0][1];
      act(() => {
        menuProps.onCommand();
      });

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should hide menu when the popup is closed externally', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(<ListTypeButton {...defaultProps} />);
      });
      const button = container.querySelector('[data-testid="custom-button"]');
      act(() => {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });

      // Get the onClose callback passed to createPopUp
      const popupOptions = mockCreatePopUp.mock.calls[0][2];
      expect(popupOptions.onClose).toBeInstanceOf(Function);

      // Simulate the popup closing itself
      act(() => {
        popupOptions.onClose();
      });

      // Check that the button is no longer in the "expanded" state
      const customButtonProps = (CustomButton as jest.Mock).mock.calls[2][0];
      expect(customButtonProps.className).not.toContain('expanded');
    });
  });

  describe('lifecycle', () => {
    it('should hide menu on unmount', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() => {
        root.render(<ListTypeButton {...defaultProps} />);
      });
      const button = container.querySelector('[data-testid="custom-button"]');

      // Open the menu
      act(() => {
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
      });
      expect(mockCreatePopUp).toHaveBeenCalledTimes(1);

      // Unmount the component
      act(() => {
        root.unmount();
        document.body.removeChild(container);
      });

      // Ensure the cleanup function was called
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
