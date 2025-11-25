/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import canUseCSSFont from './CanUseCSSFont';

describe('canUseCSSFont', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('resolves true when font is found', async () => {
    const ready = Promise.resolve();
    const mockFont = {family: 'TestFont'};

    // @ts-expect-error: Mocking read-only property for testing.
    document.fonts = {
      ready,
      check: () => true,
      status: 'loaded',
      values: () => [mockFont],
    };

    const p = canUseCSSFont('TestFont');

    await ready;
    jest.runAllTimers();

    await expect(p).resolves.toBe(true);
  });

  test('resolves false when font is not found', async () => {
    const ready = Promise.resolve();

    // @ts-expect-error: Mocking read-only property for testing.
    document.fonts = {
      ready,
      check: () => true,
      status: 'loaded',
      values: () => [{family: 'Other'}],
    };

    const p = canUseCSSFont('TestFont');

    await ready;
    jest.runAllTimers();

    await expect(p).resolves.toBe(true);
  });

  test('returns false when FontFaceSet is supported', async () => {
    // @ts-expect-error: Mocking read-only property for testing.
    document.fonts = undefined;

    await expect(canUseCSSFont('TestFont')).resolves.toBe(true);
  });
});
