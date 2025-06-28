/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { ApprovalMode } from 'gemini-cli-chinese-core';

interface AutoAcceptIndicatorProps {
  approvalMode: ApprovalMode;
}

export const AutoAcceptIndicator: React.FC<AutoAcceptIndicatorProps> = ({
  approvalMode,
}) => {
  let textColor = '';
  let textContent = '';
  let subText = '';

  switch (approvalMode) {
    case ApprovalMode.AUTO_EDIT:
      textColor = Colors.AccentGreen;
      textContent = '自动接受编辑';
      subText = ' (shift + tab 切换)';
      break;
    case ApprovalMode.YOLO:
      textColor = Colors.AccentRed;
      textContent = 'YOLO模式';
      subText = ' (ctrl + y 切换)';
      break;
    case ApprovalMode.DEFAULT:
    default:
      break;
  }

  return (
    <Box>
      <Text color={textColor}>
        {textContent}
        {subText && <Text color={Colors.Gray}>{subText}</Text>}
      </Text>
    </Box>
  );
};
