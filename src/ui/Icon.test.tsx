/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import Icon, {SuperscriptIcon, SubscriptIcon} from './Icon';

// Mock dependencies
jest.mock('./CanUseCSSFont');
jest.mock('@modusoperandi/licit-ui-commands', () => ({
  ThemeContext: React.createContext(null),
}));
jest.mock('../styles/czi-icon.css', () => ({}));
jest.mock('../styles/icon-font.css', () => ({}));

// Mock console methods
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const consoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Icon Component', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    jest.clearAllMocks();
  });

  afterEach(() => {
    root.unmount();
    document.body.removeChild(container);
  });

  describe('SuperscriptIcon', () => {
    it('renders superscript icon with correct structure', async () => {
      act(() => {
        root.render(<SuperscriptIcon />);
      });

      const wrap = await container.querySelector('.superscript-wrap');
      expect(wrap).toBeTruthy();

      const base = container.querySelector('.superscript-base');
      const top = container.querySelector('.superscript-top');

      expect(base).toBeTruthy();
      expect(base.textContent).toBe('x');
      expect(top).toBeTruthy();
      expect(top.textContent).toBe('y');
    });
  });

  describe('SubscriptIcon', () => {
    it('renders subscript icon with correct structure', async () => {
      act(() => {
        root.render(<SubscriptIcon />);
      });

      const wrap = await container.querySelector('.subscript-wrap');
      expect(wrap).toBeTruthy();

      const base = container.querySelector('.subscript-base');
      const bottom = container.querySelector('.subscript-bottom');

      expect(base).toBeTruthy();
      expect(base.textContent).toBe('x');
      expect(bottom).toBeTruthy();
      expect(bottom.textContent).toBe('y');
    });
  });

  describe('Icon.get static method', () => {
    it('returns cached icon for same key', () => {
      const icon1 = Icon.get('bold', 'Bold');
      const icon2 = Icon.get('bold', 'Bold');

      expect(icon1).toBe(icon2);
    });

    it('returns different icons for different types', () => {
      const icon1 = Icon.get('bold', 'Bold');
      const icon2 = Icon.get('italic', 'Italic');

      expect(icon1).not.toBe(icon2);
    });

    it('returns different icons for different titles', () => {
      const icon1 = Icon.get('format_bold', 'Bold');
      const icon2 = Icon.get('format_bold', 'Bold Alt');

      expect(icon1).not.toBe(icon2);
    });

    it('handles cache with no title', () => {
      const icon1 = Icon.get('italic');
      const icon2 = Icon.get('italic');

      expect(icon1).toBe(icon2);
    });

    it('passes theme prop to Icon component', () => {
      const icon = Icon.get('bold', 'Bold', 'light');
      expect(icon.props).toBeDefined();
    });
  });

  describe('Icon render method', () => {
    it('renders img tag with correct alt text', async () => {
      root.render(
        <Icon type="http://example.com/icon.png" title="Test Icon" />
      );

      await new Promise((resolve) => setTimeout(resolve, 0));

      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img.alt).toBe('Test Icon');
    });

    it('sets img width and height to 100%', async () => {
      root.render(<Icon type="http://example.com/icon.png" />);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const img = container.querySelector('img');
      expect(img.style.width).toBe('100%');
      expect(img.style.height).toBe('100%');
    });
  });

  describe('Icon componentDidMount', () => {
    it('sets image1 state for http URLs', async () => {
      const httpUrl = 'http://example.com/icon.png';
      root.render(<Icon type={httpUrl} />);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const img = container.querySelector('img');
      expect(img.src).toBe(httpUrl);
    });

    it('sets image1 state for data URIs', async () => {
      const dataUri =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
      root.render(<Icon type={dataUri} />);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const img = container.querySelector('img');
      expect(img.src).toBe(dataUri);
    });

    describe('file-based icons', () => {
      beforeEach(() => {
        jest.mock(
          '@assets/images/dark/format_bold.svg',
          () => ({
            default: 'mocked-bold-icon',
          }),
          {virtual: true}
        );
      });

      it('loads format_bold icon', async () => {
        root.render(<Icon type="format_bold" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_italic icon', async () => {
        root.render(<Icon type="format_italic" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_align_right icon', async () => {
        root.render(<Icon type="format_align_right" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_align_left icon', async () => {
        root.render(<Icon type="format_align_left" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_align_center icon', async () => {
        root.render(<Icon type="format_align_center" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_align_justify icon', async () => {
        root.render(<Icon type="format_align_justify" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_list_bulleted icon', async () => {
        root.render(<Icon type="format_list_bulleted" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_underline icon', async () => {
        root.render(<Icon type="format_underline" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads functions icon', async () => {
        root.render(<Icon type="functions" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads grid_on icon', async () => {
        root.render(<Icon type="grid_on" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads hr icon', async () => {
        root.render(<Icon type="hr" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads link icon', async () => {
        root.render(<Icon type="link" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads redo icon', async () => {
        root.render(<Icon type="redo" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads undo icon', async () => {
        root.render(<Icon type="undo" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads arrow_drop_down icon', async () => {
        root.render(<Icon type="arrow_drop_down" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads superscript icon', async () => {
        root.render(<Icon type="superscript" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads subscript icon', async () => {
        root.render(<Icon type="subscript" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_indent_increase icon', async () => {
        root.render(<Icon type="format_indent_increase" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_indent_decrease icon', async () => {
        root.render(<Icon type="format_indent_decrease" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_strikethrough icon', async () => {
        root.render(<Icon type="format_strikethrough" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_color_text icon', async () => {
        root.render(<Icon type="format_color_text" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_line_spacing icon', async () => {
        root.render(<Icon type="format_line_spacing" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads format_clear icon', async () => {
        root.render(<Icon type="format_clear" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads border_color icon', async () => {
        root.render(<Icon type="border_color" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads settings_overscan icon', async () => {
        root.render(<Icon type="settings_overscan" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads icon_edit icon', async () => {
        root.render(<Icon type="icon_edit" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });

      it('loads more_horiz icon', async () => {
        root.render(<Icon type="more_horiz" />);

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
      });
    });

    it('uses custom theme when provided', async () => {
      root.render(<Icon type="format_bold" theme="light" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleWarn).toHaveBeenCalledWith('fromicon light');
    });

    it('defaults to dark theme when not provided', async () => {
      root.render(<Icon type="format_bold" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
    });

    it('uses Icon_Source for unknown icon types', async () => {
      root.render(<Icon type="unknown_icon_type" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleWarn).toHaveBeenCalledWith('fromicon dark');
    });

    it('handles image load errors gracefully', async () => {
      root.render(<Icon type="nonexistent_icon" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('Icon contextType', () => {
    it('has ThemeContext as contextType', () => {
      expect(Icon.contextType).toBeDefined();
    });
  });
});
