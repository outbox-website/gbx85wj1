## 目标
将 Pixel PvZ 游戏从原生 DOM 重构为 Vite + React + TypeScript 架构，解决场景切换问题并复用核心逻辑。

## 详细要求
1.  **架构升级**：使用 Vite 作为构建工具，React 18+ 进行 UI 管理，TypeScript 保证类型安全。
2.  **场景管理**：通过 React State 管理 MenuScene 和 GameScene 的切换，确保切换时资源正确释放（Engine stop/start）。
3.  **核心逻辑**：保留原有的 Canvas 游戏循环（GameEngine），但将其封装为 TypeScript 类，与 React 组件解耦。
4.  **UI 复用**：使用 React 组件重构 UI（HUD、Plant Cards、Menu），利用 CSS Modules 或标准 CSS 进行样式管理。
5.  **美学要求**：保持像素风格（Press Start 2P 字体），优化交互反馈（按钮、卡片状态）。

## 实施步骤
- [x] Environment Setup: 安装依赖 (npm install)
- [x] Verify Codebase: 检查并修复潜在的 TypeScript 类型错误 (npm run build)
- [x] Deploy & Test: 启动开发服务器并暴露端口
- [x] Polish: 根据运行效果进行微调（如有必要）

## 反馈修改
- [x] Reduce Zombie Speed: 将僵尸移动速度减半 (0.4-0.6 -> 0.2-0.3)
- [x] Reduce Zombie Speed Again: 再次减半速度 (0.2-0.3 -> 0.1-0.15)
- [x] Sun Lifecycle: 阳光15秒消失，最后5秒闪烁
- [x] Slower Sunflower: 向日葵生产间隔翻倍 (500帧 -> 1000帧)
- [x] New Zombie: 路障僵尸 (Conehead)，血量 +25%
- [x] Dynamic Difficulty: 僵尸生成速度随时间逐步加快 (20s -> 3s, over 4 mins)
- [x] Hardcore Start: 初始阳光调整为 0
- [x] Shovel Tool: 添加铲子工具移除已有植物
- [x] New Plant: 食人花 (Chomper)，秒杀前方僵尸，消化时间30秒
- [x] Zombie Wave: 2分钟时触发尸潮，生成速度翻倍，路障僵尸概率提升至50%
- [x] Re-deploy: 重新部署服务并暴露端口
