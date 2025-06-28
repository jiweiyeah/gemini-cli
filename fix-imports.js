#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

async function main() {
  try {
    // 查找所有 TypeScript 文件
    const files = await glob('packages/cli/src/**/*.{ts,tsx}');

    console.log(`找到 ${files.length} 个文件需要处理`);

    let replacedCount = 0;

    for (const file of files) {
      const content = await readFile(file, 'utf8');

      // 替换导入路径
      const newContent = content.replace(
        /@google\/gemini-cli-core/g,
        'gemini-cli-chinese-core',
      );

      if (content !== newContent) {
        await writeFile(file, newContent, 'utf8');
        console.log(`已更新: ${file}`);
        replacedCount++;
      }
    }

    console.log(`完成! 共更新了 ${replacedCount} 个文件`);
  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  }
}

main();
