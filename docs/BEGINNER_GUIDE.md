# Pixel Character Studio 新手入门指南

## 1. 这个项目是做什么的

这个项目是一个“像素角色动画创作工作台”的原型，目标是把角色动画、背景、表情、特效和时间轴组合起来，形成一个可演示的角色动画编辑器。

它的定位不是完整剪辑软件，而是一个适合二次开发的基础骨架：

- 角色可分成头部、身体、四肢等独立部件
- 动作和表情由时间轴驱动
- PNG 精灵动画可作为复杂动作的替代方案
- 整个界面使用 Vue 3 + Pinia 管理状态
- 渲染层使用 PixiJS 8 进行像素级显示

## 2. 先看什么，怎么理解

### 2.1 先读启动链路

最先看这几个文件：

- `src/main.ts`：整个应用启动入口
- `src/App.vue`：编辑器的总布局
- `src/stores/editor.ts`：当前编辑器状态中心

它们决定“用户在面板里选了什么”，然后会传到场景中。

### 2.2 然后读渲染链路

重点文件：

- `src/components/stage/PixiStage.vue`：Vue 和 PixiJS 的边界
- `src/engine/PixelScene.ts`：真正的场景管理器
- `src/characters/core/CharacterController.ts`：角色统一入口

这里的关键点是：

- `PixiStage.vue` 只负责初始化/销毁 `PixelScene`
- `PixelScene` 负责绘制背景、播放时间轴、更新角色状态
- `CharacterController` 确保外部不关心角色是代码绘制还是 PNG 动画

### 2.3 最后理解动作和时间轴

- `src/animation/TimelineEngine.ts`：把绝对时间解析成当前 cue
- `src/engine/types.ts`：定义动作、表情、背景、特效和时间轴数据结构
- `src/characters/rig/RigCharacterRenderer.ts`：代码驱动的像素人物姿态生成器
- `src/characters/sprite/SpriteCharacterRenderer.ts`：PNG 图集动画播放器

## 3. 核心数据流

```text
用户操作 UI
  ↓
Pinia store 更新状态
  ↓
PixiStage 监听 props / watch
  ↓
PixelScene.setAction / setExpression / setPlayhead
  ↓
CharacterController.setAction / seek
  ↓
RigCharacterRenderer 或 SpriteCharacterRenderer 更新姿态
  ↓
PixiJS 场景显示当前画面
```

也就是说：

- 用户点击“播放”或“切换动作”，不是直接改 Pixi 画面
- 而是改状态，再由场景和角色控制器统一渲染
- 这样更容易扩展到真实项目保存、加载和编辑功能

## 4. 动作和表情是怎么工作的

### 角色动作

在 `src/engine/types.ts` 中定义了动作列表：

- `idle`：待机
- `talk`：说话
- `walk`：走路
- `raise-hand`：抬手
- `shock`：震惊
- `angry`：愤怒
- `laugh`：大笑
- `collapse`：崩溃倒地
- `dance`：摇摆

### 表情

- `neutral`：普通
- `happy`：开心
- `angry`：愤怒
- `shocked`：震惊
- `embarrassed`：尴尬
- `tired`：疲惫

这些状态分别传给 `RigCharacterRenderer`，由它决定眼睛、眉毛、嘴巴和姿势。

## 5. 为什么有两种渲染方式

项目里角色有两条路径：

1. 代码绘制的 rig：适合做实时面部表情、动作姿态，灵活度最高
2. PNG 精灵动画：适合展示复杂倒地、爆炸、过渡动作等，需要提前做成图集

`CharacterController` 会在运行时决定使用哪种渲染模式：

- 默认是 rig
- 当动作是 `collapse` 时，它会尝试切换到 sprite 模式
- 如果图集没加载成功，会自动回退到 rig 的 fallback pose

这样确保“角色总有画面可见”，增强稳定性。

## 6. 如果你想改角色

最合适的入口在这里：

- `src/characters/core/CharacterSpec.ts`：角色配色和基本结构
- `src/characters/rig/RigCharacterRenderer.ts`：身体部件、表情和动作姿势的绘制逻辑
- `src/characters/rig/PartFactory.ts`：给独立部件准备关节原点和纹理拆分思路

不要一上来就把整个人物做成一张大图，而是优先拆成头、身体、手臂、腿等部件。这样后续才容易做表情和动作组合。

## 7. 如果你想扩展时间轴

当前 `TimelineEngine` 是一个最小可用版本，适合演示。它的思路很简单：

- 所有 cues 按时间排序
- 传入时间后，找到最近一个已发生的 cue
- 根据 cue 的 `action`、`expression`、`effect` 更新状态

如果你要做真正的动画编辑器，下一步可以扩展为：

- 多轨道编辑
- 关键帧拖拽
- 片段剪切
- 预览导出
- 项目保存/加载

## 8. 第一次调试建议

1. 启动项目：`npm install`，然后 `npm run dev`
2. 先看浏览器中是否渲染出角色
3. 在 `src/engine/types.ts` 中临时改动作、表情或背景，观察界面变化
4. 再去读 `PixelScene` 的 `setAction` / `applyStateAt`，确认渲染状态更新链路
5. 最后调整 `RigCharacterRenderer` 中的姿态公式，感受参数变化带来的效果

## 9. 适合新手改的几个位置

- 修改角色的配色和造型：`CharacterSpec.ts`
- 改动作姿态：`RigCharacterRenderer.ts`
- 改背景绘制：`PixelScene.ts` 的 `drawBackground()`
- 改特效：`EffectManager.ts`
- 改演示时间轴：`engine/types.ts` 的 `DEMO_TIMELINE`

## 10. 一句话总结

这个项目的本质是：用最小可行的代码结构，把“角色动画编排”的思路搭起来，并保留后续扩展空间。它不追求一步到位，而是让你看得懂数据是怎么流动、角色是怎么被驱动、动画是怎么时间轴化的。
