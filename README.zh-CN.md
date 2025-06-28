# Gemini CLI

[![Gemini CLI CI](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml)

<p align="right">
  <a href="README.md">
    <img src="https://img.shields.io/badge/-English-blue?style=for-the-badge&logo=googletranslate&logoColor=white" alt="English" />
  </a>
</p>

![Gemini CLI 截图](./docs/assets/gemini-screenshot.png)

本仓库包含 Gemini CLI，这是一个命令行 AI 工作流工具，可以连接您的工具，理解您的代码并加速您的工作流程。

使用 Gemini CLI，您可以：

- 在 Gemini 的 1M 令牌上下文窗口内外查询和编辑大型代码库。
- 使用 Gemini 的多模态功能，从 PDF 或草图生成新应用。
- 自动化操作任务，如查询拉取请求或处理复杂的变基。
- 使用工具和 MCP 服务器连接新功能，包括[使用 Imagen、Veo 或 Lyria 进行媒体生成](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)。
- 使用内置的 [Google 搜索](https://ai.google.dev/gemini-api/docs/grounding)工具为您的查询提供依据。

## 快速开始

1. **前提条件：** 确保您已安装 [Node.js 18 版本](https://nodejs.org/en/download)或更高版本。
2. **运行 CLI：** 在终端中执行以下命令：

   ```bash
   npx https://github.com/google-gemini/gemini-cli
   ```

   或者通过以下方式安装：

   ```bash
   npm install -g @google/gemini-cli
   gemini
   ```

3. **选择颜色主题**
4. **身份验证：** 当提示时，使用您的个人 Google 账户登录。这将使您每分钟最多可以使用 60 次模型请求，每天最多可以使用 1,000 次模型请求。

现在您可以开始使用 Gemini CLI 了！

### 高级用途或增加限制：

如果您需要使用特定模型或需要更高的请求容量，可以使用 API 密钥：

1. 从 [Google AI Studio](https://aistudio.google.com/apikey) 生成密钥。
2. 在终端中将其设置为环境变量。将 `YOUR_API_KEY` 替换为您生成的密钥。

   ```bash
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

有关其他身份验证方法，包括 Google Workspace 账户，请参阅[身份验证](./docs/cli/authentication.md)指南。

## 示例

CLI 运行后，您可以从 shell 开始与 Gemini 交互。

您可以从新目录开始一个项目：

```sh
cd new-project/
gemini
> 为我编写一个 Gemini Discord 机器人，使用我将提供的 FAQ.md 文件回答问题
```

或者使用现有项目：

```sh
git clone https://github.com/google-gemini/gemini-cli
cd gemini-cli
gemini
> 给我一个昨天所有变更的摘要
```

### 后续步骤

- 了解如何[从源代码贡献或构建](./CONTRIBUTING.md)。
- 探索可用的 **[CLI 命令](./docs/cli/commands.md)**。
- 如果遇到任何问题，请查看 **[故障排除指南](./docs/troubleshooting.md)**。
- 有关更全面的文档，请参阅[完整文档](./docs/index.md)。
- 查看一些[常见任务](#常见任务)以获取更多灵感。

### 故障排除

如果您遇到问题，请查看[故障排除](docs/troubleshooting.md)指南。

## 常见任务

### 探索新代码库

首先 `cd` 进入现有或新克隆的仓库，然后运行 `gemini`。

```text
> 描述这个系统架构的主要组成部分。
```

```text
> 有哪些安全机制？
```

### 使用您现有的代码

```text
> 为 GitHub issue #123 实现一个初稿。
```

```text
> 帮我将这个代码库迁移到最新版本的 Java。从计划开始。
```

### 自动化您的工作流程

使用 MCP 服务器将您的本地系统工具与企业协作套件集成。

```text
> 为我制作一个幻灯片，展示过去 7 天的 git 历史记录，按功能和团队成员分组。
```

```text
> 为墙面显示器制作一个全屏网页应用，显示我们交互最多的 GitHub issues。
```

### 与您的系统交互

```text
> 将此目录中的所有图像转换为 png，并使用 exif 数据中的日期重命名它们。
```

```text
> 按支出月份整理我的 PDF 发票。
```

## 服务条款和隐私声明

有关适用于您使用 Gemini CLI 的服务条款和隐私声明的详细信息，请参阅[服务条款和隐私声明](./docs/tos-privacy.md)。 