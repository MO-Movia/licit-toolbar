/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import React from 'react';
import {ThemeProvider, ThemeContext} from './contextProvider';
import {createRoot} from 'react-dom/client';

describe('ThemeProvider', () => {
  test('renders children with provided theme', async () => {
    const TestComponent = () => {
      const theme = React.useContext(ThemeContext);
      return <div data-testid="test-component">{theme}</div>;
    };

    const theme = 'dark';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(
      <ThemeProvider theme={theme}>
        <TestComponent />
      </ThemeProvider>
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const testComponent = container.querySelector(
      '[data-testid="test-component"]'
    );
    expect(testComponent).not.toBeNull();
    expect(testComponent.textContent).toBe(theme);

    root.unmount();
    document.body.removeChild(container);
  });
});