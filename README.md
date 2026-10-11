# Pixel Character Studio · 基础工程

基于 **Vue 3 + TypeScript + Vite + PixiJS 8 + Pinia** 的像素角色动画创作工作台。工程围绕“程序化角色部件 + PNG 精灵动画 + 统一时间轴”设计，而不是把全部动画逻辑堆进一个 Vue 组件。

## 已实现的功能

- Vue 编辑器：角色素材库、动作选择、表情选择、背景选择、快速特效、时间轴预览。
- PixiJS 场景：固定 360×640 逻辑画布、像素风办公室背景、角色层、特效层、气泡/前景层。
- 模块化程序角色：头部、脸部、身体、左右手臂、左右腿都在独立的 PixiJS `Container` 或绘制对象中；手臂、腿和头部有独立变换。
- 表情系统：普通、开心、愤怒、震惊、尴尬、疲惫；眼睛、眉毛、嘴巴、脸颊细节分层绘制。
- 基础动作：待机、说话、走路、抬手、震惊、愤怒、大笑、摇摆。
- PNG 精灵动画：三个示例角色均带有 `collapse`（崩溃倒地）PNG Sprite Sheet + JSON atlas，用来演示从程序化角色切换到逐帧动画。
- 统一角色接口：场景只操作 `CharacterController`，不直接操作内部的 SVG/PNG 资源。
- 基础时间轴：6 秒演示片段，播放/暂停、点击时间轴定位；动作/表情事件由 `TimelineEngine` 根据绝对时间解析。
- 特效：金币奖励、震惊符号、愤怒气场、像素爱心、故障闪屏。
- 导出项目 JSON：导出当前场景配置和演示时间轴，供后续实现真正的项目保存/加载。

> 这是动画创作系统的基础架构，不是完整的视频剪辑软件。时间轴轨道目前是可点击定位的演示 UI，尚未实现拖拽片段、关键帧编辑、撤销/重做、音轨、字幕编辑或 MP4 导出。

## 环境要求

- Node.js：推荐 22.12+（Vite 8 需要受支持的较新 Node 版本）
- npm：与 Node 一起安装的版本即可

## 启动

```bash
npm install
npm run dev
```

在浏览器打开 Vite 输出的本地地址，默认 `http://localhost:5173`。

## 类型检查与构建

```bash
npm run type-check
npm run build
npm run preview
```

## 关键目录

```text
src/
├── App.vue
├── main.ts
├── stores/
│   └── editor.ts                 # Vue 编辑器状态
├── components/
│   ├── layout/                   # 顶部项目栏
│   ├── panels/                   # 素材库、属性面板、时间轴
│   └── stage/PixiStage.vue       # Vue 和 PixiJS 的生命周期边界
├── engine/
│   ├── PixelScene.ts             # 场景装配、背景、播放控制、时间轴连接
│   ├── ResourceManager.ts        # 资源预加载入口
│   └── types.ts                  # 项目、角色、动作、表情、特效等类型
├── characters/
│   ├── core/
│   │   ├── CharacterSpec.ts      # 角色美术配置/配色
│   │   └── CharacterController.ts# 角色公共 API 与渲染模式切换
│   ├── rig/RigCharacterRenderer.ts# 代码绘制部件与骨架变换
│   └── sprite/SpriteCharacterRenderer.ts # PNG 精灵图集播放器
├── animation/
│   ├── AnimationClip.ts          # 关键帧类型与插值工具
│   └── TimelineEngine.ts         # 时间轴状态解析
├── effects/EffectManager.ts      # 独立特效层和预设
└── styles/global.css

public/assets/characters/
├── worker/animations/collapse.png + collapse.json
├── optimist/animations/collapse.png + collapse.json
└── boss/animations/collapse.png + collapse.json
```

## 核心架构约定

### 1. Vue 不直接操作 PixiJS 对象

Vue 组件通过属性/事件和 Pinia 更新状态；`PixiStage.vue` 创建和销毁 `PixelScene`。请避免在 `InspectorPanel.vue` 里直接 import `Graphics` 或修改 `Container`。

### 2. 所有角色都由 CharacterController 对外暴露

主要方法：

```ts
character.setCharacter('worker', playheadMs)
character.setAction('raise-hand', playheadMs)
character.setExpression('shocked')
character.setPosition(180, 508)
character.seek(playheadMs)
```

`CharacterController` 内部选择 `RigCharacterRenderer` 或 `SpriteCharacterRenderer`。`TimelineEngine` 和场景层不需要知道角色的内部图形结构。

### 3. 程序化角色的坐标规则

- `CharacterController.root` 的位置是角色世界坐标。
- 根坐标原点约定为角色脚底基准点。
- `RigCharacterRenderer` 将头部、身体、四肢拆成独立显示对象。
- `leftArmPivot`、`rightArmPivot`、`leftLegPivot`、`rightLegPivot` 和 `headPivot` 均围绕各自局部原点变换。
- 示例代码绘制的逻辑像素块以 4 个逻辑单位为主，便于缩放和保持清晰轮廓。

替换成你自己的角色时，优先调整 `CharacterSpec.ts` 和 `RigCharacterRenderer.ts` 中的部件绘制，不要把新绘制逻辑塞进 Vue 组件。后续若要把某个部件改成独立 SVG/PNG，可以用 `PartFactory.ts` 的 `createTexturePivotPart()` 创建带关节原点的纹理部件；整个人物不要作为一个不可拆分的 SVG 导入。

### 4. PNG 精灵图如何接入

示例路径：

```text
public/assets/characters/worker/animations/collapse.png
public/assets/characters/worker/animations/collapse.json
```

JSON 使用 PixiJS 可读取的 atlas 结构，`animations.collapse` 指向 PNG 图集中的帧。`SpriteCharacterRenderer` 通过 `Assets.load()` 读取图集，再创建 `AnimatedSprite`。

新增复杂动作时：

1. 将动画帧整理到透明 PNG 图集。
2. 用 Aseprite、Piskel 或其他图集工具导出 PixiJS 兼容的 JSON。
3. 在 `CharacterController` 的动作映射中加入该动作所需的 clip 规则。
4. 只在对应动作激活时显示 Sprite 图层；其他动作仍使用部件 Rig。
5. 为 PNG 动画统一画布尺寸、脚底基准点和显示比例，避免模式切换时跳位。

目前只把 `collapse` 配置为 PNG 动画示例。其他动作走程序化 Rig。精灵动画中的面部表情需提前绘制进帧内；程序化 Rig 则继续支持运行时表情切换。

### 5. 时间轴以绝对时间为基础

`TimelineEngine.stateAt(timeMs)` 根据绝对时间返回当前 cue。`CharacterController.seek(timeMs)` 根据动作起始时间计算当前姿势，PNG 动画也使用 `gotoAndStop(frameIndex)` 定位帧，而不是独立依赖另一个播放时钟。

这是未来支持拖动播放头、逐帧预览、批量渲染与视频导出的基础。

## 下一步推荐

1. 先替换 `RigCharacterRenderer.ts` 中的打工人造型，确认角色部件和锚点设计。
2. 将角色的 SVG 或像素数据转成可独立加载的部件，或逐步把 `Graphics` 形状提取到数据配置中。
3. 给 `AnimationClip.ts` 加入真正的多轨关键帧播放器（当前提供类型和插值工具，动作姿势仍在 Rig 渲染器中定义）。
4. 将 `DEMO_TIMELINE` 抽象为可编辑 Project 文件，增加项目 JSON 的保存/加载。
5. 最后接配音、字幕轨道、音画同步与视频编码。建议在基础时间轴确定后再处理 MP4 导出。

## 官方参考

- Vue + TypeScript：https://vuejs.org/guide/typescript/overview
- Vite：https://vite.dev/guide/
- PixiJS 场景对象：https://pixijs.com/8.x/guides/components/scene-objects
- PixiJS Assets：https://pixijs.com/8.x/guides/components/assets
- PixiJS AnimatedSprite：https://pixijs.download/v8.10.0/docs/scene.AnimatedSprite.html
