/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { type PartListUnion } from '@google/genai';
import open from 'open';
import process from 'node:process';
import { UseHistoryManagerReturn } from './useHistoryManager.js';
import { useStateAndRef } from './useStateAndRef.js';
import {
  Config,
  GitService,
  Logger,
  MCPDiscoveryState,
  MCPServerStatus,
  getMCPDiscoveryState,
  getMCPServerStatus,
} from 'gemini-cli-chinese-core';
import { useSessionStats } from '../contexts/SessionContext.js';
import {
  Message,
  MessageType,
  HistoryItemWithoutId,
  HistoryItem,
} from '../types.js';
import { promises as fs } from 'fs';
import path from 'path';
import { createShowMemoryAction } from './useShowMemoryCommand.js';
import { GIT_COMMIT_INFO } from '../../generated/git-commit.js';
import { formatDuration, formatMemoryUsage } from '../utils/formatters.js';
import { getCliVersion } from '../../utils/version.js';
import { LoadedSettings } from '../../config/settings.js';

export interface SlashCommandActionReturn {
  shouldScheduleTool?: boolean;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  message?: string; // For simple messages or errors
}

export interface SlashCommand {
  name: string;
  altName?: string;
  description?: string;
  completion?: () => Promise<string[]>;
  action: (
    mainCommand: string,
    subCommand?: string,
    args?: string,
  ) =>
    | void
    | SlashCommandActionReturn
    | Promise<void | SlashCommandActionReturn>; // Action can now return this object
}

/**
 * Hook to define and process slash commands (e.g., /help, /clear).
 */
export const useSlashCommandProcessor = (
  config: Config | null,
  settings: LoadedSettings,
  history: HistoryItem[],
  addItem: UseHistoryManagerReturn['addItem'],
  clearItems: UseHistoryManagerReturn['clearItems'],
  loadHistory: UseHistoryManagerReturn['loadHistory'],
  refreshStatic: () => void,
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>,
  onDebugMessage: (message: string) => void,
  openThemeDialog: () => void,
  openAuthDialog: () => void,
  openEditorDialog: () => void,
  performMemoryRefresh: () => Promise<void>,
  toggleCorgiMode: () => void,
  showToolDescriptions: boolean = false,
  setQuittingMessages: (message: HistoryItem[]) => void,
) => {
  const session = useSessionStats();
  const gitService = useMemo(() => {
    if (!config?.getProjectRoot()) {
      return;
    }
    return new GitService(config.getProjectRoot());
  }, [config]);

  const pendingHistoryItems: HistoryItemWithoutId[] = [];
  const [pendingCompressionItemRef, setPendingCompressionItem] =
    useStateAndRef<HistoryItemWithoutId | null>(null);
  if (pendingCompressionItemRef.current != null) {
    pendingHistoryItems.push(pendingCompressionItemRef.current);
  }

  const addMessage = useCallback(
    (message: Message) => {
      // Convert Message to HistoryItemWithoutId
      let historyItemContent: HistoryItemWithoutId;
      if (message.type === MessageType.ABOUT) {
        historyItemContent = {
          type: 'about',
          cliVersion: message.cliVersion,
          osVersion: message.osVersion,
          sandboxEnv: message.sandboxEnv,
          modelVersion: message.modelVersion,
        };
      } else if (message.type === MessageType.STATS) {
        historyItemContent = {
          type: 'stats',
          stats: message.stats,
          lastTurnStats: message.lastTurnStats,
          duration: message.duration,
        };
      } else if (message.type === MessageType.QUIT) {
        historyItemContent = {
          type: 'quit',
          stats: message.stats,
          duration: message.duration,
        };
      } else if (message.type === MessageType.COMPRESSION) {
        historyItemContent = {
          type: 'compression',
          compression: message.compression,
        };
      } else {
        historyItemContent = {
          type: message.type as
            | MessageType.INFO
            | MessageType.ERROR
            | MessageType.USER,
          text: message.content,
        };
      }
      addItem(historyItemContent, message.timestamp.getTime());
    },
    [addItem],
  );

  const showMemoryAction = useCallback(async () => {
    const actionFn = createShowMemoryAction(config, settings, addMessage);
    await actionFn();
  }, [config, settings, addMessage]);

  const addMemoryAction = useCallback(
    (
      _mainCommand: string,
      _subCommand?: string,
      args?: string,
    ): SlashCommandActionReturn | void => {
      if (!args || args.trim() === '') {
        addMessage({
          type: MessageType.ERROR,
          content: 'Usage: /memory add <text to remember>',
          timestamp: new Date(),
        });
        return;
      }
      // UI feedback for attempting to schedule
      addMessage({
        type: MessageType.INFO,
        content: `Attempting to save to memory: "${args.trim()}"`,
        timestamp: new Date(),
      });
      // Return info for scheduling the tool call
      return {
        shouldScheduleTool: true,
        toolName: 'save_memory',
        toolArgs: { fact: args.trim() },
      };
    },
    [addMessage],
  );

  const savedChatTags = useCallback(async () => {
    const geminiDir = config?.getProjectTempDir();
    if (!geminiDir) {
      return [];
    }
    try {
      const files = await fs.readdir(geminiDir);
      return files
        .filter(
          (file) => file.startsWith('checkpoint-') && file.endsWith('.json'),
        )
        .map((file) => file.replace('checkpoint-', '').replace('.json', ''));
    } catch (_err) {
      return [];
    }
  }, [config]);

  const slashCommands: SlashCommand[] = useMemo(() => {
    const commands: SlashCommand[] = [
      {
        name: 'help',
        altName: '?',
        description: '获取 gemini-cli 的帮助信息',
        action: (_mainCommand, _subCommand, _args) => {
          onDebugMessage('Opening help.');
          setShowHelp(true);
        },
      },
      {
        name: 'docs',
        description: '在浏览器中打开完整的 Gemini CLI 文档',
        action: async (_mainCommand, _subCommand, _args) => {
          const docsUrl = 'https://goo.gle/gemini-cli-docs';
          if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
            addMessage({
              type: MessageType.INFO,
              content: `请在浏览器中打开以下网址查看文档：\n${docsUrl}`,
              timestamp: new Date(),
            });
          } else {
            addMessage({
              type: MessageType.INFO,
              content: `正在浏览器中打开文档：${docsUrl}`,
              timestamp: new Date(),
            });
            await open(docsUrl);
          }
        },
      },
      {
        name: 'clear',
        description: '清除屏幕和对话历史',
        action: async (_mainCommand, _subCommand, _args) => {
          onDebugMessage('Clearing terminal and resetting chat.');
          clearItems();
          await config?.getGeminiClient()?.resetChat();
          console.clear();
          refreshStatic();
        },
      },
      {
        name: 'theme',
        description: '更改主题',
        action: (_mainCommand, _subCommand, _args) => {
          openThemeDialog();
        },
      },
      {
        name: 'auth',
        description: '更改认证方式',
        action: (_mainCommand, _subCommand, _args) => {
          openAuthDialog();
        },
      },
      {
        name: 'editor',
        description: '设置外部编辑器首选项',
        action: (_mainCommand, _subCommand, _args) => {
          openEditorDialog();
        },
      },
      {
        name: 'stats',
        altName: 'usage',
        description: '查看会话统计信息',
        action: (_mainCommand, _subCommand, _args) => {
          const now = new Date();
          const { sessionStartTime, cumulative, currentTurn } = session.stats;
          const wallDuration = now.getTime() - sessionStartTime.getTime();

          addMessage({
            type: MessageType.STATS,
            stats: cumulative,
            lastTurnStats: currentTurn,
            duration: formatDuration(wallDuration),
            timestamp: new Date(),
          });
        },
      },
      {
        name: 'mcp',
        description: '列出已配置的 MCP 服务器和工具',
        action: async (_mainCommand, _subCommand, _args) => {
          // Check if the _subCommand includes a specific flag to control description visibility
          let useShowDescriptions = showToolDescriptions;
          if (_subCommand === 'desc' || _subCommand === 'descriptions') {
            useShowDescriptions = true;
          } else if (
            _subCommand === 'nodesc' ||
            _subCommand === 'nodescriptions'
          ) {
            useShowDescriptions = false;
          } else if (_args === 'desc' || _args === 'descriptions') {
            useShowDescriptions = true;
          } else if (_args === 'nodesc' || _args === 'nodescriptions') {
            useShowDescriptions = false;
          }
          // Check if the _subCommand includes a specific flag to show detailed tool schema
          let useShowSchema = false;
          if (_subCommand === 'schema' || _args === 'schema') {
            useShowSchema = true;
          }

          const toolRegistry = await config?.getToolRegistry();
          if (!toolRegistry) {
            addMessage({
              type: MessageType.ERROR,
              content: '无法获取工具注册表。',
              timestamp: new Date(),
            });
            return;
          }

          const mcpServers = config?.getMcpServers() || {};
          const serverNames = Object.keys(mcpServers);

          if (serverNames.length === 0) {
            const docsUrl = 'https://goo.gle/gemini-cli-docs-mcp';
            if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
              addMessage({
                type: MessageType.INFO,
                content: `未配置 MCP 服务器。请在浏览器中打开以下网址查看文档：\n${docsUrl}`,
                timestamp: new Date(),
              });
            } else {
              addMessage({
                type: MessageType.INFO,
                content: `未配置 MCP 服务器。正在浏览器中打开文档：${docsUrl}`,
                timestamp: new Date(),
              });
              await open(docsUrl);
            }
            return;
          }

          // Check if any servers are still connecting
          const connectingServers = serverNames.filter(
            (name) => getMCPServerStatus(name) === MCPServerStatus.CONNECTING,
          );
          const discoveryState = getMCPDiscoveryState();

          let message = '';

          // Add overall discovery status message if needed
          if (
            discoveryState === MCPDiscoveryState.IN_PROGRESS ||
            connectingServers.length > 0
          ) {
            message += `\u001b[33m⏳ MCP 服务器正在启动（${connectingServers.length} 个正在初始化）...\u001b[0m\n`;
            message += `\u001b[90m注意：首次启动可能需要较长时间。工具可用性将自动更新。\u001b[0m\n\n`;
          }

          message += '已配置的 MCP 服务器：\n\n';

          for (const serverName of serverNames) {
            const serverTools = toolRegistry.getToolsByServer(serverName);
            const status = getMCPServerStatus(serverName);

            // Add status indicator with descriptive text
            let statusIndicator = '';
            let statusText = '';
            switch (status) {
              case MCPServerStatus.CONNECTED:
                statusIndicator = '🟢';
                statusText = 'Ready';
                break;
              case MCPServerStatus.CONNECTING:
                statusIndicator = '🔄';
                statusText = 'Starting... (first startup may take longer)';
                break;
              case MCPServerStatus.DISCONNECTED:
              default:
                statusIndicator = '🔴';
                statusText = 'Disconnected';
                break;
            }

            // Get server description if available
            const server = mcpServers[serverName];

            // Format server header with bold formatting and status
            message += `${statusIndicator} \u001b[1m${serverName}\u001b[0m - ${statusText}`;

            // Add tool count with conditional messaging
            if (status === MCPServerStatus.CONNECTED) {
              message += ` (${serverTools.length} tools)`;
            } else if (status === MCPServerStatus.CONNECTING) {
              message += ` (tools will appear when ready)`;
            } else {
              message += ` (${serverTools.length} tools cached)`;
            }

            // Add server description with proper handling of multi-line descriptions
            if ((useShowDescriptions || useShowSchema) && server?.description) {
              const greenColor = '\u001b[32m';
              const resetColor = '\u001b[0m';

              const descLines = server.description.trim().split('\n');
              if (descLines) {
                message += ':\n';
                for (let i = 0; i < descLines.length; i++) {
                  message += `    ${greenColor}${descLines[i]}${resetColor}\n`;
                }
              } else {
                message += '\n';
              }
            } else {
              message += '\n';
            }

            // Reset formatting after server entry
            message += '\u001b[0m';

            if (serverTools.length > 0) {
              serverTools.forEach((tool) => {
                if (
                  (useShowDescriptions || useShowSchema) &&
                  tool.description
                ) {
                  // Format tool name in cyan using simple ANSI cyan color
                  message += `  - \u001b[36m${tool.name}\u001b[0m`;

                  // Apply green color to the description text
                  const greenColor = '\u001b[32m';
                  const resetColor = '\u001b[0m';

                  // Handle multi-line descriptions by properly indenting and preserving formatting
                  const descLines = tool.description.trim().split('\n');
                  if (descLines) {
                    message += ':\n';
                    for (let i = 0; i < descLines.length; i++) {
                      message += `      ${greenColor}${descLines[i]}${resetColor}\n`;
                    }
                  } else {
                    message += '\n';
                  }
                  // Reset is handled inline with each line now
                } else {
                  // Use cyan color for the tool name even when not showing descriptions
                  message += `  - \u001b[36m${tool.name}\u001b[0m\n`;
                }
                if (useShowSchema) {
                  // Prefix the parameters in cyan
                  message += `    \u001b[36mParameters:\u001b[0m\n`;
                  // Apply green color to the parameter text
                  const greenColor = '\u001b[32m';
                  const resetColor = '\u001b[0m';

                  const paramsLines = JSON.stringify(
                    tool.schema.parameters,
                    null,
                    2,
                  )
                    .trim()
                    .split('\n');
                  if (paramsLines) {
                    for (let i = 0; i < paramsLines.length; i++) {
                      message += `      ${greenColor}${paramsLines[i]}${resetColor}\n`;
                    }
                  }
                }
              });
            } else {
              message += '  No tools available\n';
            }
            message += '\n';
          }

          // Make sure to reset any ANSI formatting at the end to prevent it from affecting the terminal
          message += '\u001b[0m';

          addMessage({
            type: MessageType.INFO,
            content: message,
            timestamp: new Date(),
          });
        },
      },
      {
        name: 'memory',
        description:
          '管理记忆。用法：/memory <show|refresh|add> [添加的文本]',
        action: (mainCommand, subCommand, args) => {
          switch (subCommand) {
            case 'show':
              showMemoryAction();
              return; // Explicitly return void
            case 'refresh':
              performMemoryRefresh();
              return; // Explicitly return void
            case 'add':
              return addMemoryAction(mainCommand, subCommand, args); // Return the object
            default:
              addMessage({
                type: MessageType.ERROR,
                content: `未知的 /memory 命令：${subCommand}。可用命令：show, refresh, add`,
                timestamp: new Date(),
              });
              return; // Explicitly return void
          }
        },
      },
      {
        name: 'tools',
        description: '列出可用的 Gemini CLI 工具',
        action: async (_mainCommand, _subCommand, _args) => {
          // Check if the _subCommand includes a specific flag to control description visibility
          let useShowDescriptions = showToolDescriptions;
          if (_subCommand === 'desc' || _subCommand === 'descriptions') {
            useShowDescriptions = true;
          } else if (
            _subCommand === 'nodesc' ||
            _subCommand === 'nodescriptions'
          ) {
            useShowDescriptions = false;
          } else if (_args === 'desc' || _args === 'descriptions') {
            useShowDescriptions = true;
          } else if (_args === 'nodesc' || _args === 'nodescriptions') {
            useShowDescriptions = false;
          }

          const toolRegistry = await config?.getToolRegistry();
          const tools = toolRegistry?.getAllTools();
          if (!tools) {
            addMessage({
              type: MessageType.ERROR,
              content: '无法获取工具。',
              timestamp: new Date(),
            });
            return;
          }

          // Filter out MCP tools by checking if they have a serverName property
          const geminiTools = tools.filter((tool) => !('serverName' in tool));

          let message = '可用的 Gemini CLI 工具：\n\n';

          if (geminiTools.length > 0) {
            geminiTools.forEach((tool) => {
              if (useShowDescriptions && tool.description) {
                // Format tool name in cyan using simple ANSI cyan color
                message += `  - \u001b[36m${tool.displayName} (${tool.name})\u001b[0m:\n`;

                // Apply green color to the description text
                const greenColor = '\u001b[32m';
                const resetColor = '\u001b[0m';

                // Handle multi-line descriptions by properly indenting and preserving formatting
                const descLines = tool.description.trim().split('\n');

                // If there are multiple lines, add proper indentation for each line
                if (descLines) {
                  for (let i = 0; i < descLines.length; i++) {
                    message += `      ${greenColor}${descLines[i]}${resetColor}\n`;
                  }
                }
              } else {
                // Use cyan color for the tool name even when not showing descriptions
                message += `  - \u001b[36m${tool.displayName}\u001b[0m\n`;
              }
            });
          } else {
            message += '  No tools available\n';
          }
          message += '\n';

          // Make sure to reset any ANSI formatting at the end to prevent it from affecting the terminal
          message += '\u001b[0m';

          addMessage({
            type: MessageType.INFO,
            content: message,
            timestamp: new Date(),
          });
        },
      },
      {
        name: 'corgi',
        action: (_mainCommand, _subCommand, _args) => {
          toggleCorgiMode();
        },
      },
      {
        name: 'about',
        description: '显示版本信息',
        action: async (_mainCommand, _subCommand, _args) => {
          const osVersion = process.platform;
          let sandboxEnv = '无沙盒';
          if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
            sandboxEnv = process.env.SANDBOX;
          } else if (process.env.SANDBOX === 'sandbox-exec') {
            sandboxEnv = `sandbox-exec (${
              process.env.SEATBELT_PROFILE || '未知'
            })`;
          }
          const modelVersion = config?.getModel() || '未知';
          const cliVersion = await getCliVersion();
          addMessage({
            type: MessageType.ABOUT,
            timestamp: new Date(),
            cliVersion,
            osVersion,
            sandboxEnv,
            modelVersion,
          });
        },
      },
      {
        name: 'bug',
        description: '提交错误报告',
        action: async (_mainCommand, _subCommand, args) => {
          let bugDescription = _subCommand || '';
          if (args) {
            bugDescription += ` ${args}`;
          }
          bugDescription = bugDescription.trim();

          const osVersion = `${process.platform} ${process.version}`;
          let sandboxEnv = '无沙盒';
          if (process.env.SANDBOX && process.env.SANDBOX !== 'sandbox-exec') {
            sandboxEnv = process.env.SANDBOX.replace(/^gemini-(?:code-)?/, '');
          } else if (process.env.SANDBOX === 'sandbox-exec') {
            sandboxEnv = `sandbox-exec (${
              process.env.SEATBELT_PROFILE || '未知'
            })`;
          }
          const modelVersion = config?.getModel() || '未知';
          const cliVersion = await getCliVersion();
          const memoryUsage = formatMemoryUsage(process.memoryUsage().rss);

          const info = `
*   **CLI Version:** ${cliVersion}
*   **Git Commit:** ${GIT_COMMIT_INFO}
*   **Operating System:** ${osVersion}
*   **Sandbox Environment:** ${sandboxEnv}
*   **Model Version:** ${modelVersion}
*   **Memory Usage:** ${memoryUsage}
`;

          let bugReportUrl =
            'https://github.com/google-gemini/gemini-cli/issues/new?template=bug_report.yml&title={title}&info={info}';
          const bugCommand = config?.getBugCommand();
          if (bugCommand?.urlTemplate) {
            bugReportUrl = bugCommand.urlTemplate;
          }
          bugReportUrl = bugReportUrl
            .replace('{title}', encodeURIComponent(bugDescription))
            .replace('{info}', encodeURIComponent(info));

          addMessage({
            type: MessageType.INFO,
            content: `要提交错误报告，请在浏览器中打开以下网址：\n${bugReportUrl}`,
            timestamp: new Date(),
          });
          (async () => {
            try {
              await open(bugReportUrl);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              addMessage({
                type: MessageType.ERROR,
                content: `无法在浏览器中打开网址：${errorMessage}`,
                timestamp: new Date(),
              });
            }
          })();
        },
      },
      {
        name: 'chat',
        description:
          '管理对话历史。用法：/chat <list|save|resume> [标签]',
        action: async (_mainCommand, subCommand, args) => {
          const tag = (args || '').trim();
          const logger = new Logger(config?.getSessionId() || '');
          await logger.initialize();
          const chat = await config?.getGeminiClient()?.getChat();
          if (!chat) {
            addMessage({
              type: MessageType.ERROR,
              content: '没有可用于对话状态的聊天客户端。',
              timestamp: new Date(),
            });
            return;
          }
          switch (subCommand) {
            case 'save': {
              const history = chat.getHistory();
              if (history.length > 0) {
                await logger.saveCheckpoint(chat?.getHistory() || [], tag);
                addMessage({
                  type: MessageType.INFO,
                  content: `对话检查点已保存${tag ? '，标签为：' + tag : ''}。`,
                  timestamp: new Date(),
                });
              } else {
                addMessage({
                  type: MessageType.INFO,
                  content: '没有找到可保存的对话。',
                  timestamp: new Date(),
                });
              }
              return;
            }
            case 'resume':
            case 'restore':
            case 'load': {
              const conversation = await logger.loadCheckpoint(tag);
              if (conversation.length === 0) {
                addMessage({
                  type: MessageType.INFO,
                  content: `没有找到已保存的检查点${tag ? '，标签为：' + tag : ''}。`,
                  timestamp: new Date(),
                });
                return;
              }

              clearItems();
              chat.clearHistory();
              const rolemap: { [key: string]: MessageType } = {
                user: MessageType.USER,
                model: MessageType.GEMINI,
              };
              let hasSystemPrompt = false;
              let i = 0;
              for (const item of conversation) {
                i += 1;

                // Add each item to history regardless of whether we display
                // it.
                chat.addHistory(item);

                const text =
                  item.parts
                    ?.filter((m) => !!m.text)
                    .map((m) => m.text)
                    .join('') || '';
                if (!text) {
                  // Parsing Part[] back to various non-text output not yet implemented.
                  continue;
                }
                if (i === 1 && text.match(/context for our chat/)) {
                  hasSystemPrompt = true;
                }
                if (i > 2 || !hasSystemPrompt) {
                  addItem(
                    {
                      type:
                        (item.role && rolemap[item.role]) || MessageType.GEMINI,
                      text,
                    } as HistoryItemWithoutId,
                    i,
                  );
                }
              }
              console.clear();
              refreshStatic();
              return;
            }
            case 'list':
              addMessage({
                type: MessageType.INFO,
                content:
                  '已保存对话列表：' +
                  (await savedChatTags()).join(', '),
                timestamp: new Date(),
              });
              return;
            default:
              addMessage({
                type: MessageType.ERROR,
                content: `未知的 /chat 命令：${subCommand}。可用命令：list, save, resume`,
                timestamp: new Date(),
              });
              return;
          }
        },
        completion: async () =>
          (await savedChatTags()).map((tag) => 'resume ' + tag),
      },
      {
        name: 'quit',
        altName: 'exit',
        description: '退出命令行界面',
        action: async (mainCommand, _subCommand, _args) => {
          const now = new Date();
          const { sessionStartTime, cumulative } = session.stats;
          const wallDuration = now.getTime() - sessionStartTime.getTime();

          setQuittingMessages([
            {
              type: 'user',
              text: `/${mainCommand}`,
              id: now.getTime() - 1,
            },
            {
              type: 'quit',
              stats: cumulative,
              duration: formatDuration(wallDuration),
              id: now.getTime(),
            },
          ]);

          setTimeout(() => {
            process.exit(0);
          }, 100);
        },
      },
      {
        name: 'compress',
        altName: 'summarize',
        description: '通过用摘要替换上下文来压缩上下文。',
        action: async (_mainCommand, _subCommand, _args) => {
          if (pendingCompressionItemRef.current !== null) {
            addMessage({
              type: MessageType.ERROR,
              content:
                '已在压缩中，请等待上一个请求完成',
              timestamp: new Date(),
            });
            return;
          }
          setPendingCompressionItem({
            type: MessageType.COMPRESSION,
            compression: {
              isPending: true,
              originalTokenCount: null,
              newTokenCount: null,
            },
          });
          try {
            const compressed = await config!
              .getGeminiClient()!
              .tryCompressChat(true);
            if (compressed) {
              addMessage({
                type: MessageType.COMPRESSION,
                compression: {
                  isPending: false,
                  originalTokenCount: compressed.originalTokenCount,
                  newTokenCount: compressed.newTokenCount,
                },
                timestamp: new Date(),
              });
            } else {
              addMessage({
                type: MessageType.ERROR,
                content: '压缩聊天历史失败。',
                timestamp: new Date(),
              });
            }
          } catch (e) {
            addMessage({
              type: MessageType.ERROR,
              content: `压缩聊天历史失败：${e instanceof Error ? e.message : String(e)}`,
              timestamp: new Date(),
            });
          }
          setPendingCompressionItem(null);
        },
      },
    ];

    if (config?.getCheckpointingEnabled()) {
      commands.push({
        name: 'restore',
        description:
          '恢复工具调用。这将把对话和文件历史重置到提出工具调用时的状态',
        completion: async () => {
          const checkpointDir = config?.getProjectTempDir()
            ? path.join(config.getProjectTempDir(), 'checkpoints')
            : undefined;
          if (!checkpointDir) {
            return [];
          }
          try {
            const files = await fs.readdir(checkpointDir);
            return files
              .filter((file) => file.endsWith('.json'))
              .map((file) => file.replace('.json', ''));
          } catch (_err) {
            return [];
          }
        },
        action: async (_mainCommand, subCommand, _args) => {
          const checkpointDir = config?.getProjectTempDir()
            ? path.join(config.getProjectTempDir(), 'checkpoints')
            : undefined;

          if (!checkpointDir) {
            addMessage({
              type: MessageType.ERROR,
              content: 'Could not determine the .gemini directory path.',
              timestamp: new Date(),
            });
            return;
          }

          try {
            // Ensure the directory exists before trying to read it.
            await fs.mkdir(checkpointDir, { recursive: true });
            const files = await fs.readdir(checkpointDir);
            const jsonFiles = files.filter((file) => file.endsWith('.json'));

            if (!subCommand) {
              if (jsonFiles.length === 0) {
                addMessage({
                  type: MessageType.INFO,
                  content: 'No restorable tool calls found.',
                  timestamp: new Date(),
                });
                return;
              }
              const truncatedFiles = jsonFiles.map((file) => {
                const components = file.split('.');
                if (components.length <= 1) {
                  return file;
                }
                components.pop();
                return components.join('.');
              });
              const fileList = truncatedFiles.join('\n');
              addMessage({
                type: MessageType.INFO,
                content: `Available tool calls to restore:\n\n${fileList}`,
                timestamp: new Date(),
              });
              return;
            }

            const selectedFile = subCommand.endsWith('.json')
              ? subCommand
              : `${subCommand}.json`;

            if (!jsonFiles.includes(selectedFile)) {
              addMessage({
                type: MessageType.ERROR,
                content: `File not found: ${selectedFile}`,
                timestamp: new Date(),
              });
              return;
            }

            const filePath = path.join(checkpointDir, selectedFile);
            const data = await fs.readFile(filePath, 'utf-8');
            const toolCallData = JSON.parse(data);

            if (toolCallData.history) {
              loadHistory(toolCallData.history);
            }

            if (toolCallData.clientHistory) {
              await config
                ?.getGeminiClient()
                ?.setHistory(toolCallData.clientHistory);
            }

            if (toolCallData.commitHash) {
              await gitService?.restoreProjectFromSnapshot(
                toolCallData.commitHash,
              );
              addMessage({
                type: MessageType.INFO,
                content: `Restored project to the state before the tool call.`,
                timestamp: new Date(),
              });
            }

            return {
              shouldScheduleTool: true,
              toolName: toolCallData.toolCall.name,
              toolArgs: toolCallData.toolCall.args,
            };
          } catch (error) {
            addMessage({
              type: MessageType.ERROR,
              content: `Could not read restorable tool calls. This is the error: ${error}`,
              timestamp: new Date(),
            });
          }
        },
      });
    }
    return commands;
  }, [
    onDebugMessage,
    setShowHelp,
    refreshStatic,
    openThemeDialog,
    openAuthDialog,
    openEditorDialog,
    clearItems,
    performMemoryRefresh,
    showMemoryAction,
    addMemoryAction,
    addMessage,
    toggleCorgiMode,
    savedChatTags,
    config,
    showToolDescriptions,
    session,
    gitService,
    loadHistory,
    addItem,
    setQuittingMessages,
    pendingCompressionItemRef,
    setPendingCompressionItem,
  ]);

  const handleSlashCommand = useCallback(
    async (
      rawQuery: PartListUnion,
    ): Promise<SlashCommandActionReturn | boolean> => {
      if (typeof rawQuery !== 'string') {
        return false;
      }
      const trimmed = rawQuery.trim();
      if (!trimmed.startsWith('/') && !trimmed.startsWith('?')) {
        return false;
      }
      const userMessageTimestamp = Date.now();
      if (trimmed !== '/quit' && trimmed !== '/exit') {
        addItem(
          { type: MessageType.USER, text: trimmed },
          userMessageTimestamp,
        );
      }

      let subCommand: string | undefined;
      let args: string | undefined;

      const commandToMatch = (() => {
        if (trimmed.startsWith('?')) {
          return 'help';
        }
        const parts = trimmed.substring(1).trim().split(/\s+/);
        if (parts.length > 1) {
          subCommand = parts[1];
        }
        if (parts.length > 2) {
          args = parts.slice(2).join(' ');
        }
        return parts[0];
      })();

      const mainCommand = commandToMatch;

      for (const cmd of slashCommands) {
        if (mainCommand === cmd.name || mainCommand === cmd.altName) {
          const actionResult = await cmd.action(mainCommand, subCommand, args);
          if (
            typeof actionResult === 'object' &&
            actionResult?.shouldScheduleTool
          ) {
            return actionResult; // Return the object for useGeminiStream
          }
          return true; // Command was handled, but no tool to schedule
        }
      }

      addMessage({
        type: MessageType.ERROR,
        content: `未知命令：${trimmed}`,
        timestamp: new Date(),
      });
      return true; // 表示命令已处理（即使是未知命令）
    },
    [addItem, slashCommands, addMessage],
  );

  return { handleSlashCommand, slashCommands, pendingHistoryItems };
};
