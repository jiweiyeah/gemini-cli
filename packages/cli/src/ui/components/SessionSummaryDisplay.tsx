/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { Colors } from '../colors.js';
import { formatDuration } from '../utils/formatters.js';
import { CumulativeStats } from '../contexts/SessionContext.js';
import { FormattedStats, StatRow, StatsColumn } from './Stats.js';

// --- Prop and Data Structures ---

interface SessionSummaryDisplayProps {
  stats: CumulativeStats;
  duration: string;
}

// --- Main Component ---

export const SessionSummaryDisplay: React.FC<SessionSummaryDisplayProps> = ({
  stats,
  duration,
}) => {
  const cumulativeFormatted: FormattedStats = {
    inputTokens: stats.promptTokenCount,
    outputTokens: stats.candidatesTokenCount,
    toolUseTokens: stats.toolUsePromptTokenCount,
    thoughtsTokens: stats.thoughtsTokenCount,
    cachedTokens: stats.cachedContentTokenCount,
    totalTokens: stats.totalTokenCount,
  };

  const title = '代理关闭中。再见！';

  return (
    <Box
      borderStyle="round"
      borderColor="gray"
      flexDirection="column"
      paddingY={1}
      paddingX={2}
      alignSelf="flex-start"
    >
      <Box marginBottom={1} flexDirection="column">
        {Colors.GradientColors ? (
          <Gradient colors={Colors.GradientColors}>
            <Text bold>{title}</Text>
          </Gradient>
        ) : (
          <Text bold>{title}</Text>
        )}
      </Box>

      <Box marginTop={1}>
        <StatsColumn
          title={`累计统计 (${stats.turnCount} 轮对话)`}
          stats={cumulativeFormatted}
          isCumulative={true}
        >
          <Box marginTop={1} flexDirection="column">
            <StatRow
              label="总持续时间 (API)"
              value={formatDuration(stats.apiTimeMs)}
            />
            <StatRow label="总持续时间 (实际)" value={duration} />
          </Box>
        </StatsColumn>
      </Box>
    </Box>
  );
};
