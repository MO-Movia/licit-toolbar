/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import React, { act } from 'react';
import ReactDOM from 'react-dom';
import { PointerSurface } from './PointerSurface';

// Helper function to render component
const renderComponent = (props = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  let component;
  act(() => {
    ReactDOM.render(
      <PointerSurface ref={(ref) => { component = ref; }} {...props}>
        Button
      </PointerSurface>,
      container
    );
  });
  
  return { container, component, element: container.firstChild as HTMLElement };
};

// Helper function to cleanup
const cleanup = (container) => {
  if (container) {
    act(() => {
      ReactDOM.unmountComponentAtNode(container);
    });
    document.body.removeChild(container);
  }
};

describe('PointerSurface', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders children correctly', () => {
    const { container, element } = renderComponent();
    expect(element.textContent).toBe('Button');
    cleanup(container);
  });

  it('renders as a span element', () => {
    const { container, element } = renderComponent();
    expect(element.tagName).toBe('SPAN');
    cleanup(container);
  });

  it('applies className prop', () => {
    const { container, element } = renderComponent({ className: 'custom-class' });
    expect(element.className).toContain('custom-class');
    cleanup(container);
  });

  it('applies id prop', () => {
    const { container, element } = renderComponent({ id: 'test-id' });
    expect(element.id).toBe('test-id');
    cleanup(container);
  });

  it('applies style prop', () => {
    const style = { color: 'red', fontSize: '16px' };
    const { container, element } = renderComponent({ style });
    expect(element.style.color).toBe('red');
    expect(element.style.fontSize).toBe('16px');
    cleanup(container);
  });

  it('applies title prop', () => {
    const { container, element } = renderComponent({ title: 'Test Title' });
    expect(element.title).toBe('Test Title');
    cleanup(container);
  });

  it('sets role to button', () => {
    const { container, element } = renderComponent();
    expect(element.getAttribute('role')).toBe('button');
    cleanup(container);
  });

  it('sets tabIndex to 0 when not disabled', () => {
    const { container, element } = renderComponent();
    expect(element.getAttribute('tabIndex')).toBe('0');
    cleanup(container);
  });

  it('sets aria-disabled when disabled', () => {
    const { container, element } = renderComponent({ disabled: true });
    expect(element.getAttribute('aria-disabled')).toBe('true');
    cleanup(container);
  });

  it('applies disabled class when disabled', () => {
    const { container, element } = renderComponent({ 
      disabled: true, 
      className: 'base-class' 
    });
    expect(element.className).toContain('disabled');
    cleanup(container);
  });

  it('removes tabIndex when disabled', () => {
    const { container, element } = renderComponent({ disabled: true });
    expect(element.getAttribute('tabIndex')).toBeNull();
    cleanup(container);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    const { container, element } = renderComponent({ 
      disabled: true, 
      onClick: handleClick 
    });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(handleClick).not.toHaveBeenCalled();
    cleanup(container);
  });

  it('does not call onMouseEnter when disabled', () => {
    const handleMouseEnter = jest.fn();
    const { container, element } = renderComponent({ 
      disabled: true, 
      onMouseEnter: handleMouseEnter 
    });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });
    
    expect(handleMouseEnter).not.toHaveBeenCalled();
    cleanup(container);
  });

  it('calls onClick with value when clicked', () => {
    const handleClick = jest.fn();
    const value = 'test-value';
    const { container, element } = renderComponent({ 
      onClick: handleClick, 
      value 
    });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick.mock.calls[0][0]).toBe(value);
    cleanup(container);
  });

  it('calls onClick with object value', () => {
    const handleClick = jest.fn();
    const value = { id: 1, name: 'test' };
    const { container, element } = renderComponent({ 
      onClick: handleClick, 
      value 
    });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(handleClick.mock.calls[0][0]).toBe(value);
    cleanup(container);
  });

  it('calls onClick with numeric value', () => {
    const handleClick = jest.fn();
    const { container, element } = renderComponent({ 
      onClick: handleClick, 
      value: 42 
    });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(handleClick.mock.calls[0][0]).toBe(42);
    cleanup(container);
  });

  it('sets pressed state on mouseDown', () => {
    const { container, element } = renderComponent();
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    
    expect(element.className).toContain('pressed');
    expect(element.getAttribute('aria-pressed')).toBe('true');
    cleanup(container);
  });

  it('removes pressed state on mouseUp', () => {
    const { container, element } = renderComponent();
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    
    expect(element.className).toContain('pressed');
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(element.className).not.toContain('pressed');
    expect(element.getAttribute('aria-pressed')).toBe('false');
    cleanup(container);
  });

  it('ignores right click (button 2)', () => {
    const handleClick = jest.fn();
    const { container, element } = renderComponent({ onClick: handleClick });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { 
        bubbles: true, 
        button: 2 
      }));
    });
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(element.className).not.toContain('pressed');
    expect(handleClick).not.toHaveBeenCalled();
    cleanup(container);
  });

  it('handles mouseLeave correctly', () => {
    const { container, element } = renderComponent();
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    
    expect(element.className).toContain('pressed');
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    });
    
    expect(element.className).toContain('pressed');
    cleanup(container);
  });

  it('adds document mouseup listener on mouseDown', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const { container, element } = renderComponent();
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mouseup',
      expect.any(Function),
      true
    );
    
    addEventListenerSpy.mockRestore();
    cleanup(container);
  });

  it('removes document mouseup listener on mouseUp', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { container, element } = renderComponent();
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mouseup',
      expect.any(Function),
      true
    );
    
    removeEventListenerSpy.mockRestore();
    cleanup(container);
  });

  it('removes document mouseup listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { container, element } = renderComponent();
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    
    cleanup(container);
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mouseup',
      expect.any(Function),
      true
    );
    
    removeEventListenerSpy.mockRestore();
  });  

  it('only triggers onClick when mouseDown and mouseUp on same element', () => {
    const handleClick = jest.fn();
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    document.body.appendChild(container1);
    document.body.appendChild(container2);
    
    let element1, element2;
    act(() => {
      ReactDOM.render(
        <PointerSurface onClick={handleClick}>Button 1</PointerSurface>,
        container1
      );
      ReactDOM.render(
        <PointerSurface>Button 2</PointerSurface>,
        container2
      );
    });
    
    element1 = container1.firstChild;
    element2 = container2.firstChild;
    
    act(() => {
      element1.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    act(() => {
      element2.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(handleClick).not.toHaveBeenCalled();
    
    cleanup(container1);
    cleanup(container2);
  });

  it('does not trigger onClick if mouseUp is outside element', () => {
    const handleClick = jest.fn();
    const { container, element } = renderComponent({ onClick: handleClick });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(handleClick).not.toHaveBeenCalled();
    cleanup(container);
  });

  it('sets _unmounted flag on unmount', () => {
    const { container, component } = renderComponent();
    
    expect(component._unmounted).toBeFalsy();
    
    cleanup(container);
    
    expect(component._unmounted).toBe(true);
  });

  it('cleans up event listeners on unmount with active mousedown', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { container, element, component } = renderComponent();
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    
    expect(component._mul).toBe(true);
    
    cleanup(container);
    
    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  it('handles undefined value prop', () => {
    const handleClick = jest.fn();
    const { container, element } = renderComponent({ onClick: handleClick });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(handleClick.mock.calls[0][0]).toBeUndefined();
    cleanup(container);
  });

  it('handles multiple rapid clicks', () => {
    const handleClick = jest.fn();
    const { container, element } = renderComponent({ onClick: handleClick });
    
    for (let i = 0; i < 3; i++) {
      act(() => {
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });
      act(() => {
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      });
    }
    
    expect(handleClick).toHaveBeenCalledTimes(3);
    cleanup(container);
  });

  it('does not call onClick without mousedown first', () => {
    const handleClick = jest.fn();
    const { container, element } = renderComponent({ onClick: handleClick });
    
    act(() => {
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    
    expect(handleClick).not.toHaveBeenCalled();
    cleanup(container);
  });

  it('does not apply active class by default', () => {
    const { container, element } = renderComponent({ active: true });
    // The component has the active prop commented out, so it shouldn't apply the class
    expect(element.className).not.toContain('active');
    cleanup(container);
  });

  it('resets _pressedTarget and calls onMouseEnter when invoked directly', () => {
  const handleMouseEnter = jest.fn();
  const value = 'hover-value';
  const { container, component } = renderComponent({
    onMouseEnter: handleMouseEnter,
    value,
  });

  component._pressedTarget = document.createElement('div');
  const event = new Event('mouseenter');

  act(() => {
    component._onMouseEnter(event as unknown as React.SyntheticEvent);
  });

  expect(component._pressedTarget).toBeNull();
  expect(handleMouseEnter).toHaveBeenCalledWith(value, event);

  cleanup(container);
});

it('resets _pressedTarget and calls _onMouseUpCapture when _onMouseLeave is invoked', () => {
  const { container, component } = renderComponent();

  // Spy on the internal method
  const onMouseUpCaptureSpy = jest.spyOn(component, '_onMouseUpCapture');

  // Set a dummy pressed target to verify reset
  component._pressedTarget = document.createElement('div');

  const event = new MouseEvent('mouseleave');

  act(() => {
    component._onMouseLeave(event as unknown as React.MouseEvent);
  });

  //  Should reset pressed target
  expect(component._pressedTarget).toBeNull();

  //  Should call _onMouseUpCapture internally
  expect(onMouseUpCaptureSpy).toHaveBeenCalledWith(event);

  cleanup(container);
});


});
