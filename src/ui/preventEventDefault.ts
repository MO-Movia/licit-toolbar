/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import * as React from 'react';

export function preventEventDefault(e: React.SyntheticEvent): void {
  e.preventDefault();
}
