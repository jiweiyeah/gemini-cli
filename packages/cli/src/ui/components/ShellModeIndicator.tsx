/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';

export const ShellModeIndicator: React.FC = () => (
  <Box>
    <Text color={Colors.AccentYellow}>
      Shell模式已启用
      <Text color={Colors.Gray}> (按Esc键关闭)</Text>
    </Text>
  </Box>
);
