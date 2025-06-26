/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

export const WITTY_LOADING_PHRASES = [
  "手气不错",
  '正在传递精彩内容... ',
  '正在重新描绘衬线...',
  '正在穿越粘菌迷宫...',
  '正在咨询数字精灵...',
  '正在重组曲线...',
  '正在给 AI 仓鼠加热...',
  '正在询问魔法海螺...',
  '正在生成机智回应...',
  '正在打磨算法...',
  '别催完美（或我的代码）...',
  '正在酿造新鲜字节...',
  '正在计算电子...',
  '正在启动认知处理器...',
  '正在检查宇宙中的语法错误...',
  '稍等，正在优化幽默...',
  '正在洗牌妙语...',
  '正在解开神经网络...',
  '正在编译才华...',
  '正在加载 wit.exe...',
  '正在召唤智慧云...',
  '正在准备机智回应...',
  '稍等，我正在调试现实...',
  '正在混淆选项...',
  '正在调整宇宙频率...',
  '正在精心制作值得你等待的回应...',
  '正在编译 0 和 1...',
  '正在解决依赖关系...以及存在危机...',
  '正在碎片整理记忆...包括 RAM 和个人记忆...',
  '正在重启幽默模块...',
  '正在缓存要点（主要是猫咪表情包）...',
  '正在运行 sudo make me a sandwich...',
  '正在优化以达到荒谬的速度',
  '正在交换比特...别告诉字节...',
  '正在进行垃圾回收...马上回来...',
  '正在组装互联网...',
  '正在将咖啡转化为代码...',
  '正在推送到生产环境（并希望一切顺利）...',
  '正在更新现实的语法...',
  '正在重新连接突触...',
  '正在寻找丢失的分号...',
  '正在给机器的齿轮上油...',
  '正在预热服务器...',
  '正在校准时光电容器...',
  '正在启动不可能驱动器...',
  '正在引导原力...',
  '正在调整星星以获得最佳回应...',
  '我们都这么说...',
  '正在加载下一个伟大的想法...',
  '稍等，我正在状态中...',
  '准备用才华让你眼前一亮...',
  '稍等，我正在打磨我的机智...',
  '坚持住，我正在创造杰作...',
  '稍等，我正在调试宇宙...',
  '稍等，我正在对齐像素...',
  '稍等，我正在优化幽默...',
  '稍等，我正在调整算法...',
  '曲速引擎已启动...',
  '正在开采更多的双锂晶体...',
  '舰长，我正在全力以赴！',
  '不要慌...',
  '正在追随白兔...',
  '真相就在这里...某个地方...',
  '正在吹卡带...',
  '正在另一座城堡寻找公主...',
  '加载中...做个桶滚！',
  '等待重生...',
  '在不到 12 秒差的时间内完成凯塞尔航程...',
  '蛋糕不是谎言，它只是还在加载...',
  '正在摆弄角色创建界面...',
  '稍等，我正在寻找合适的表情包...',
  '按"A"继续...',
  '正在驱赶数字猫...',
  '正在打磨像素...',
  '正在寻找合适的加载屏幕双关语...',
  '用这句俏皮话分散你的注意力...',
  '快好了...大概...',
  '我们的仓鼠正在尽可能快地工作...',
  '正在拍拍 Cloudy 的头...',
  '正在抚摸猫咪...',
  '正在对老板恶作剧...',
  '永远不会放弃你，永远不会让你失望...',
  '正在拍贝斯...',
  '正在品尝小果子...',
  '我要走得更远，我要追求速度...',
  '这是真实的生活吗？还是只是幻想？...',
  '我对此有种好预感...',
  '正在戳熊...',
  '正在研究最新的表情包...',
  '正在想办法让这更机智...',
  '嗯...让我想想...',
  '没有眼睛的鱼叫什么？鱼...',
  '为什么电脑要去看心理医生？因为它有太多字节(烦恼)...',
  '为什么程序员不喜欢大自然？因为那里有太多虫子...',
  '为什么程序员喜欢暗模式？因为光会吸引虫子...',
  '为什么开发者破产了？因为他用完了所有缓存...',
  '断铅笔能做什么？什么都做不了，它没有意义...',
  '正在应用敲击式维护...',
  '正在寻找正确的 USB 方向...',
  '确保魔法烟雾留在线路内...',
  '无缘无故地用 Rust 重写...',
  '正在尝试退出 Vim...',
  '正在转动仓鼠轮...',
  '那不是 bug，是未记录的功能...',
  '启动。',
  '我会回来的...带着答案。',
  '我的另一个进程是个时间机器...',
  '正在与机器精灵交流...',
  '让思绪沉淀...',
  '刚想起我把钥匙放哪了...',
  '正在思考宝珠...',
  '我见过你们人类难以置信的事情...比如会读加载信息的用户。',
  '开始深思的凝视...',
  '电脑最喜欢的零食是什么？微型芯片。',
  '为什么 Java 开发者戴眼镜？因为他们看不见 C#。',
  '正在给激光充电...啪啪！',
  '正在除以零...开玩笑的！',
  '正在寻找成人监督...我是说，正在处理。',
  '让它发出哔哔声。',
  '正在缓冲...因为即使是 AI 也需要片刻。',
  '正在纠缠量子粒子以获得更快的响应...',
  '正在给算法打磨镀铬层。',
  '你不觉得有趣吗？（正在努力！）',
  '正在召唤代码小精灵...当然是来帮忙的。',
  '只是在等拨号音结束...',
  '正在重新校准幽默计...',
  '我的另一个加载屏幕更有趣。',
  '肯定有只猫在某处踩键盘...',
  '增强中...增强中...仍在加载。',
  '这不是 bug，是加载屏幕的特色。',
  '你试过关掉再打开吗？（加载屏幕，不是我。）',
];

export const PHRASE_CHANGE_INTERVAL_MS = 15000;

/**
 * Custom hook to manage cycling through loading phrases.
 * @param isActive Whether the phrase cycling should be active.
 * @param isWaiting Whether to show a specific waiting phrase.
 * @returns The current loading phrase.
 */
export const usePhraseCycler = (isActive: boolean, isWaiting: boolean) => {
  const [currentLoadingPhrase, setCurrentLoadingPhrase] = useState(
    WITTY_LOADING_PHRASES[0],
  );
  const phraseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isWaiting) {
      setCurrentLoadingPhrase('等待用户确认...');
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current);
        phraseIntervalRef.current = null;
      }
    } else if (isActive) {
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current);
      }
      // Select an initial random phrase
      const initialRandomIndex = Math.floor(
        Math.random() * WITTY_LOADING_PHRASES.length,
      );
      setCurrentLoadingPhrase(WITTY_LOADING_PHRASES[initialRandomIndex]);

      phraseIntervalRef.current = setInterval(() => {
        // Select a new random phrase
        const randomIndex = Math.floor(
          Math.random() * WITTY_LOADING_PHRASES.length,
        );
        setCurrentLoadingPhrase(WITTY_LOADING_PHRASES[randomIndex]);
      }, PHRASE_CHANGE_INTERVAL_MS);
    } else {
      // Idle or other states, clear the phrase interval
      // and reset to the first phrase for next active state.
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current);
        phraseIntervalRef.current = null;
      }
      setCurrentLoadingPhrase(WITTY_LOADING_PHRASES[0]);
    }

    return () => {
      if (phraseIntervalRef.current) {
        clearInterval(phraseIntervalRef.current);
        phraseIntervalRef.current = null;
      }
    };
  }, [isActive, isWaiting]);

  return currentLoadingPhrase;
};
