# 如何贡献

我们非常欢迎您对本项目提交补丁和贡献。

## 开始之前

### 签署我们的贡献者许可协议

对本项目的贡献必须附有[贡献者许可协议](https://cla.developers.google.com/about) (CLA)。
您（或您的雇主）保留对您贡献的版权；这只是给予我们使用和重新分发您的贡献作为项目一部分的许可。

如果您或您当前的雇主已经签署了 Google CLA（即使是为了不同的项目），您可能不需要再次签署。

访问 <https://cla.developers.google.com/> 查看您当前的协议或签署新协议。

### 查看我们的社区准则

本项目遵循[Google 的开源社区准则](https://opensource.google/conduct/)。

## 贡献流程

### 代码审查

所有提交，包括项目成员的提交，都需要审查。我们使用 [GitHub 拉取请求](https://docs.github.com/articles/about-pull-requests) 来完成这一过程。

### 拉取请求指南

为了帮助我们快速审查和合并您的 PR，请遵循以下指南。不符合这些标准的 PR 可能会被关闭。

#### 1. 链接到现有问题

所有 PR 都应该链接到我们跟踪器中的现有问题。这确保每个更改在编写任何代码之前已经被讨论并与项目目标保持一致。

- **对于错误修复：** PR 应该链接到错误报告问题。
- **对于功能：** PR 应该链接到已被维护者批准的功能请求或提案问题。

如果您的更改没有对应的问题，请**先创建一个问题**并等待反馈，然后再开始编码。

#### 2. 保持小而集中

我们倾向于小型、原子性的 PR，它们解决单一问题或添加单一的、自包含的功能。

- **应该：** 创建一个修复特定错误或添加特定功能的 PR。
- **不应该：** 将多个不相关的更改（例如，错误修复、新功能和重构）捆绑到一个 PR 中。

大型更改应该分解为一系列较小的、逻辑性的 PR，这些 PR 可以独立审查和合并。

#### 3. 使用草稿 PR 进行进行中的工作

如果您想获得早期反馈，请使用 GitHub 的**草稿拉取请求**功能。这向维护者表明 PR 尚未准备好进行正式审查，但已开放讨论和初步反馈。

#### 4. 确保所有检查通过

在提交 PR 之前，通过运行 `npm run preflight` 确保所有自动检查都通过。此命令运行所有测试、代码检查和其他样式检查。

#### 5. 更新文档

如果您的 PR 引入了面向用户的更改（例如，新命令、修改的标志或行为更改），您必须同时更新 `/docs` 目录中的相关文档。

#### 6. 编写清晰的提交消息和良好的 PR 描述

您的 PR 应该有一个清晰、描述性的标题和详细的更改描述。遵循 [Conventional Commits](https://www.conventionalcommits.org/) 标准编写提交消息。

- **好的 PR 标题：** `feat(cli): 为 'config get' 命令添加 --json 标志`
- **糟糕的 PR 标题：** `做了一些更改`

在 PR 描述中，解释您更改背后的"原因"并链接到相关问题（例如，`修复 #123`）。

## 分叉

如果您分叉存储库，您将能够运行构建、测试和集成测试工作流。但是，为了使集成测试运行，您需要添加一个 [GitHub 存储库密钥](<[url](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository)>)，值为 `GEMINI_API_KEY`，并将其设置为您可用的有效 API 密钥。您的密钥和密码对您的存储库是私有的；没有访问权限的人无法看到您的密钥，您也无法看到与此存储库相关的任何密钥。

此外，您需要点击 `Actions` 标签并为您的存储库启用工作流，您会发现它是屏幕中央的大蓝色按钮。

## 开发设置和工作流程

本节指导贡献者如何构建、修改和理解本项目的开发设置。

### 设置开发环境

**先决条件：**

1. 安装 [Node 18+](https://nodejs.org/en/download)
2. Git

### 构建过程

克隆存储库：

```bash
git clone https://github.com/google-gemini/gemini-cli.git # 或您的分叉 URL
cd gemini-cli
```

安装 `package.json` 中定义的依赖项以及根依赖项：

```bash
npm install
```

构建整个项目（所有包）：

```bash
npm run build
```

此命令通常将 TypeScript 编译为 JavaScript，打包资产，并准备包以供执行。有关构建过程中发生的更多详细信息，请参阅 `scripts/build.js` 和 `package.json` 脚本。

### 启用沙箱

强烈推荐基于容器的[沙箱](#沙箱)，至少需要在 `~/.env` 中设置 `GEMINI_SANDBOX=true` 并确保有可用的容器引擎（例如 `docker` 或 `podman`）。详情请参阅[沙箱](#沙箱)。

要同时构建 `gemini` CLI 工具和沙箱容器，请从根目录运行 `build:all`：

```bash
npm run build:all
```

要跳过构建沙箱容器，您可以使用 `npm run build` 代替。

### 运行

要从源代码启动 Gemini CLI（构建后），请从根目录运行以下命令：

```bash
npm start
```

如果您想在 gemini-cli 文件夹外运行源代码构建，可以使用 `npm link path/to/gemini-cli/packages/cli`（参见：[文档](https://docs.npmjs.com/cli/v9/commands/npm-link)）或 `alias gemini="node path/to/gemini-cli/packages/cli"` 来使用 `gemini` 运行。

### 运行测试

本项目包含两种类型的测试：单元测试和集成测试。

#### 单元测试

要执行项目的单元测试套件：

```bash
npm run test
```

这将运行位于 `packages/core` 和 `packages/cli` 目录中的测试。在提交任何更改之前，请确保测试通过。为了更全面的检查，建议运行 `npm run preflight`。

#### 集成测试

集成测试旨在验证 Gemini CLI 的端到端功能。它们不作为默认 `npm run test` 命令的一部分运行。

要运行集成测试，请使用以下命令：

```bash
npm run test:e2e
```

有关集成测试框架的更详细信息，请参阅[集成测试文档](./docs/integration-tests.md)。

### 代码检查和预检查

为确保代码质量和格式一致性，请运行预检查：

```bash
npm run preflight
```

此命令将运行 ESLint、Prettier、所有测试以及项目 `package.json` 中定义的其他检查。

_专业提示_

克隆后创建一个 git 预提交钩子文件，以确保您的提交始终干净。

```bash
echo "
# 运行 npm build 并检查错误
if ! npm run preflight; then
  echo "npm build 失败。提交中止。"
  exit 1
fi
" > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

#### 格式化

要单独格式化此项目中的代码，请从根目录运行以下命令：

```bash
npm run format
```

此命令使用 Prettier 根据项目的样式指南格式化代码。

#### 代码检查

要单独检查此项目中的代码，请从根目录运行以下命令：

```bash
npm run lint
```

### 编码约定

- 请遵循现有代码库中使用的编码风格、模式和约定。
- 有关与 AI 辅助开发相关的具体说明，包括 React、注释和 Git 使用的约定，请参阅 [GEMINI.md](https://github.com/google-gemini/gemini-cli/blob/main/GEMINI.md)（通常位于项目根目录）。
- **导入：** 特别注意导入路径。项目使用 `eslint-rules/no-relative-cross-package-imports.js` 来强制限制包之间的相对导入。

### 项目结构

- `packages/`：包含项目的各个子包。
  - `cli/`：命令行界面。
  - `server/`：CLI 与之交互的后端服务器。
- `docs/`：包含所有项目文档。
- `scripts/`：用于构建、测试和开发任务的实用程序脚本。

有关更详细的架构，请参阅 `docs/architecture.md`。

## 调试

### VS Code：

0.  使用 `F5` 在 VS Code 中交互式调试 CLI
1.  从根目录以调试模式启动 CLI：
    ```bash
    npm run debug
    ```
    此命令在 `packages/cli` 目录中运行 `node --inspect-brk dist/gemini.js`，暂停执行直到调试器附加。然后，您可以在 Chrome 浏览器中打开 `chrome://inspect` 连接到调试器。
2.  在 VS Code 中，使用"附加"启动配置（在 `.vscode/launch.json` 中找到）。

或者，如果您更喜欢直接启动当前打开的文件，可以在 VS Code 中使用"启动程序"配置，但通常建议使用 'F5'。

要在沙箱容器内命中断点，请运行：

```bash
DEBUG=1 gemini
```

### React DevTools

要调试 CLI 的基于 React 的 UI，您可以使用 React DevTools。CLI 界面使用的库 Ink 与 React DevTools 4.x 版本兼容。

1.  **以开发模式启动 Gemini CLI：**

    ```bash
    DEV=true npm start
    ```

2.  **安装并运行 React DevTools 4.28.5 版本（或最新兼容的 4.x 版本）：**

    您可以全局安装：

    ```bash
    npm install -g react-devtools@4.28.5
    react-devtools
    ```

    或使用 npx 直接运行：

    ```bash
    npx react-devtools@4.28.5
    ```

    您运行的 CLI 应用程序应该会连接到 React DevTools。
    ![](/docs/assets/connected_devtools.png)

## 沙箱

### MacOS Seatbelt

在 MacOS 上，`gemini` 使用 Seatbelt（`sandbox-exec`）在 `permissive-open` 配置文件下（参见 `packages/cli/src/utils/sandbox-macos-permissive-open.sb`），该配置文件限制对项目文件夹的写入，但默认允许所有其他操作和出站网络流量（"开放"）。您可以通过在环境或 `.env` 文件中设置 `SEATBELT_PROFILE=restrictive-closed` 切换到 `restrictive-closed` 配置文件（参见 `.../sandbox-macos-strict.sb`），该配置文件默认拒绝所有操作和出站网络流量（"关闭"）。可用的内置配置文件有 `{permissive,restrictive}-{open,closed,proxied}`（参见下文关于代理网络）。您还可以通过设置 `SEATBELT_PROFILE=<profile>` 切换到自定义配置文件，前提是您在项目设置目录 `.gemini` 下创建了文件 `.gemini/sandbox-macos-<profile>.sb`。

### 基于容器的沙箱（所有平台）

对于 MacOS 或其他平台上更强大的基于容器的沙箱，您可以在环境或 `.env` 文件中设置 `GEMINI_SANDBOX=true|docker|podman|<command>`。指定的命令（或如果为 `true` 则为 `docker` 或 `podman`）必须安装在主机上。启用后，`npm run build:all` 将构建一个最小的容器（"沙箱"）镜像，`npm start` 将在该容器的新实例中启动。第一次构建可能需要 20-30 秒（主要是由于下载基础镜像），但之后构建和启动的开销应该很小。默认构建（`npm run build`）不会重新构建沙箱。

基于容器的沙箱以读写访问权限挂载项目目录（和系统临时目录），并在您启动/停止 Gemini CLI 时自动启动/停止/删除。在沙箱内创建的文件应该自动映射到主机上的用户/组。您可以根据需要通过设置 `SANDBOX_{MOUNTS,PORTS,ENV}` 轻松指定额外的挂载、端口或环境变量。您还可以通过在项目设置目录（`.gemini`）下创建文件 `.gemini/sandbox.Dockerfile` 和/或 `.gemini/sandbox.bashrc` 并使用 `BUILD_SANDBOX=1` 运行 `gemini` 来为您的项目完全自定义沙箱，从而触发构建您的自定义沙箱。

#### 代理网络

所有沙箱方法，包括使用 `*-proxied` 配置文件的 MacOS Seatbelt，都支持通过可以指定为 `GEMINI_SANDBOX_PROXY_COMMAND=<command>` 的自定义代理服务器限制出站网络流量，其中 `<command>` 必须启动一个代理服务器，该服务器在 `:::8877` 上监听相关请求。请参阅 `scripts/example-proxy.js` 获取一个最小的代理，该代理只允许到 `example.com:443` 的 `HTTPS` 连接（例如 `curl https://example.com`）并拒绝所有其他请求。代理会随沙箱自动启动和停止。

## 手动发布

我们为每次提交发布一个构件到我们的内部注册表。但如果您需要手动制作本地构建，请运行以下命令：

```
npm run clean
npm install
npm run auth
npm run prerelease:dev
npm publish --workspaces
``` 