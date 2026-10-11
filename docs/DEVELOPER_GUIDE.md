# Pixel Character Studio 开发者文档

## 1. 项目目标

这个项目的目标不是做一个“完整的动画剪辑软件”，而是搭一个“可继续扩展的角色动画工作台原型”。

它的核心特点是：

- 角色动画由动作、表达和时间轴一起驱动
- 角色可在代码绘制 (“Rig”) 和 PNG 图集动画 (“Sprite”) 之间切换
- Vue 负责 UI，PixiJS 负责渲染，时间轴负责状态解析
- 业务层、渲染层和数据层彼此解耦，便于后续扩展

开发时请保持这个思路：不要把全部逻辑堆在 Vue 组件中，而是让状态流到场景和角色控制器中。

---

## 2. 项目结构的真实职责

```text
src/
├── main.ts                     # 应用启动入口
├── App.vue                     # 总体布局和状态挂载
├── stores/
│   └── editor.ts               # Pinia 编辑器状态
├── components/
│   ├── layout/                 # 顶部栏、目录栏等 UI
│   ├── panels/                 # 素材、属性、时间轴面板
│   └── stage/PixiStage.vue     # Pixi 生命周期桥接组件
├── engine/
│   ├── PixelScene.ts           # 场景层核心：背景 / 角色 / 特效 / 时间轴同步
│   ├── ResourceManager.ts      # 资源管理入口（目前示例骨架）
│   ├── assets.ts               # 资源加载/缓存的辅助逻辑
│   └── types.ts                # 动作、表情、角色、特效、时间轴数据结构
├── characters/
│   ├── core/
│   │   ├── CharacterController.ts  # 统一角色门面
│   │   └── CharacterSpec.ts        # 角色配置、调色板、结构标识
│   ├── rig/
│   │   ├── PartFactory.ts          # 独立部件/纹理部件工厂
│   │   └── RigCharacterRenderer.ts # 代码绘制角色渲染器
│   └── sprite/
│       └── SpriteCharacterRenderer.ts # PNG 图集动画渲染器
├── animation/
│   ├── AnimationClip.ts        # 关键帧/插值类型骨架
│   └── TimelineEngine.ts       # 时间轴解析器
├── effects/
│   └── EffectManager.ts        # 特效层
├── styles/
│   └── global.css              # 全局样式和像素风背景
└── utils/ (如果后续加上，可以放通用函数)
```

---

## 3. 关键思想：状态驱动渲染，而不是组件直接操作渲染对象

这是这个项目最重要的设计约定。

### 正确的方式

- Vue 组件负责显示和交互
- `Pinia` 保存当前状态
- `PixiStage.vue` 监听 props 和状态变化
- `PixelScene` 根据状态更新画面
- `CharacterController` 决定角色是 Rig 还是 Sprite

### 不要做的事

- 不要在面板组件里直接 `new Graphics()`
- 不要在 `InspectorPanel` 里直接访问 `CharacterController` 的内部子对象
- 不要让多个组件随意共享 Pixi 实例

这样的设计能避免：

- UI 和渲染状态耦合过深
- 角色渲染方式切换影响上层逻辑
- 以后扩展项目保存/加载时导致状态不一致

---

## 4. 数据流说明：从点击 UI 到角色变换

### 4.1 用户操作

用户在 UI 中选择角色、动作、表情、背景，或点击播放/定位时间轴。

这些变化最终落在 `useEditorStore()` 中。

### 4.2 store 更新

`src/stores/editor.ts` 提供：

- `selectedCharacter`
- `action`
- `expression`
- `background`
- `isPlaying`
- `playheadMs`
- `effectCommand`

它们就像编辑器的“当前状态快照”。

### 4.3 PixiStage 监听状态

`PixiStage.vue` 中的 `watch()` 负责监听这些 props 变化，并调用：

- `scene.setCharacter()`
- `scene.setAction()`
- `scene.setExpression()`
- `scene.setBackground()`
- `scene.seek()`
- `scene.setPlaying()`

### 4.4 场景层真正处理数据

`PixelScene` 内部会：

- 根据 playhead 解析 timeline
- 调用 `CharacterController.setAction()`
- 调用 `CharacterController.setExpression()`
- 如果是 cue 中带特效，则触发 `EffectManager`
- 同步角色和特效的显示状态

### 4.5 角色层根据类型渲染

`CharacterController` 内部：

- 维护 `rigRenderer`
- 维护 `spriteRenderer`
- 通过 `setAction()` 选择哪种模式
- 在 `seek()` 时把当前时间传给渲染器

最终绘制出视觉画面。

---

## 5. 时间轴设计：为什么它是核心

这是基础版本中最关键的“控制器”。

`DEMO_TIMELINE` 是一个示例时间线，格式大致是：

```ts
{ id: 'cue-shock', at: 2200, action: 'shock', expression: 'shocked', effect: 'shock' }
```

含义是：

- 在 2200ms 时，动作切到 `shock`
- 表情切到 `shocked`
- 特效触发 `shock`

### 设计原则

- 使用绝对时间，不依赖独立播放器 ticker
- 任何时刻都能由 `timeMs` 反推当前状态
- 可以实现拖动播放头、跳转、回放、编排

### 当前限制

这是一个“声明式演示时间轴”，并不是完整可编辑的多轨编辑器。

它是一个很好的基础，因为后续可以很自然扩展成：

- 多轨道编辑
- 关键帧裁剪
- 片段拖拽
- 保存/加载项目文件
- 导出视频或图像序列

---

## 6. Rig 和 Sprite 两种渲染模式

### 6.1 Rig 模式

对应 `RigCharacterRenderer.ts`。

它通过：

- `Container`
- `Graphics`
- 局部 Pivot
- 头身手腿分离

拼装角色。

优点：

- 动作和表情可动态变化
- 很适合程序化角色
- 能快速修改姿态、表情、动作参数

缺点：

- 复杂动作可能不够细腻
- 复杂的动画表演需要大量手写姿态公式

### 6.2 Sprite 模式

对应 `SpriteCharacterRenderer.ts`。

它通过：

- `Assets.load()` 读取 json + png 图集
- `AnimatedSprite` 读取动画帧
- `seek()` 通过时间映射到帧索引

优点：

- 更适合高细节动作
- 适合做专业美术资源
- 能把动画帧预先制作好

缺点：

- 不容易动态改表情
- 复杂动作依赖资产，扩展成本较高

### 6.3 模式切换策略

`CharacterController` 负责切换：

- 若当前是 `collapse`，优先尝试 `Sprite`
- 若加载失败，则保留 `Rig` 兜底姿势

这是重大工程设计点：避免渲染器切换失败导致角色空白。

---

## 7. 角色配置与扩展

### `CharacterSpec.ts`

角色配置中包含：

- `id`
- `name`
- `silhouette`
- `hasCoffee`
- `hasTie`
- `palette`

它是角色的“美术配置中心”，不是渲染逻辑本身。

想新增角色时，最应该做的是：

1. 在 `CharacterId` 中增加新角色类型
2. 在 `CHARACTER_SPECS` 里加配置
3. 在 `RigCharacterRenderer` 中让角色有独特的发型/衣服/姿态差异
4. 若需要 PNG 动画，再配套动作资源

### 新增角色的最小步骤

```ts
export type CharacterId = 'worker' | 'optimist' | 'boss' | 'newhero'
```

然后在 `CHARACTER_SPECS` 中加入：

```ts
newhero: {
  id: 'newhero',
  name: '新角色',
  silhouette: 'side-part',
  hasCoffee: false,
  hasTie: true,
  palette: { ... }
}
```

---

## 8. 扩展动作的正确方式

### 8.1 修改数据类型

在 `src/engine/types.ts` 中：

```ts
export type ActionId =
  | 'idle'
  | 'talk'
  | 'walk'
  | 'raise-hand'
  | 'shock'
  | 'angry'
  | 'laugh'
  | 'collapse'
  | 'dance'
  | 'new-action'
```

### 8.2 增加 UI 选项

同文件中 `ACTION_OPTIONS` 中加入：

```ts
{ id: 'new-action', label: '新动作', icon: '✦', renderer: 'rig' }
```

### 8.3 实现姿态逻辑

在 `RigCharacterRenderer.seek()` 中增加 case：

```ts
case 'new-action':
  this.bodyPivot.y = -84 - Math.abs(Math.sin(t / 200)) * 3
  this.headPivot.rotation = Math.sin(t / 120) * 0.05
  break
```

### 8.4 设置动作时序

补充到 `DEMO_TIMELINE`：

```ts
{ id: 'cue-new', at: 5000, action: 'new-action', expression: 'happy' }
```

这样就能在播放时自动进入新动作。

---

## 9. 扩展表情的正确方式

`ExpressionId` 在 `types.ts` 中定义，通常以图形层表达为主。新增表情时，优先改：

- `RigCharacterRenderer.drawExpression()`
- `RigCharacterRenderer.drawMouth()`
- `drawSpeechBubble()` 里对话文本

新增表情时不要完全重构角色结构，而是让：

- 眼睛大小变化
- 眉毛高度变化
- 嘴型变化
- 脸颊颜色变化

这类基础图形元素去表达更多情绪。

---

## 10. 扩展特效的正确方式

特效逻辑位于 `src/effects/EffectManager.ts`。

### 触发入口

从编辑器或时间轴传入：

```ts
effectCommand.value = { id: 1, type: 'reward' }
```

此时 `PixelScene.playEffect()` 会执行：

```ts
this.effects.trigger(type, this.playheadMs, WIDTH / 2, 330)
```

### 新特效开发步骤

1. 在 `EffectId` 中添加新类型
2. 在 `EFFECT_OPTIONS` 中加入 UI 文案
3. 在 `EffectManager.trigger()` 增加分支
4. 在 `seek()` 中定义它的存活时间和动画策略

例如：

- `reward`：金币浮动
- `shock`：感叹号弹出
- `heart`：爱心上浮
- `glitch`：故障闪烁

---

## 11. 资源加载与 PNG 动画接入

下一阶段最重要的扩展方向之一，是增加更多 PNG 动画素材。

### 资源目录结构

```text
public/assets/characters/
├── worker/animations/
│   ├── collapse.png
│   └── collapse.json
├── optimist/animations/
├── boss/animations/
└── ...
```

### 资源接入规范

1. 先准备 PNG 图集和 JSON atlas
2. 确认 JSON 中的动画名称与 `ActionId` 一致
3. 通过 `SpriteCharacterRenderer.getClip()` 加载资源
4. 在 `CharacterController.activateSpriteAction()` 时切换到 Sprite
5. 若加载失败，回到 Rig fallback

### 注意事项

- 图集的脚底锚点要统一
- 图片分辨率要和逻辑坐标保持一致
- 角色变成 sprite 时，必须仍然保持人物根点在脚底附近
- 否则切换时会出现跳位现象

---

## 12. 后续开发路线建议

### 第一阶段：稳定流程

- 完善 `TimelineEngine` 的 cue 逻辑
- 加强 `project` 数据结构
- 增加“保存/加载项目 JSON”
- 把 `DEMO_TIMELINE` 结构抽象成真正的项目数据模型

### 第二阶段：更像编辑器

- 支持关键帧编辑
- 支持拖动时间轴
- 支持多轨道动作/语音/字幕
- 支持取消/重做

### 第三阶段：成品能力

- 音频同步
- 字幕层
- 更完整的导出能力
- 生成 GIF / MP4 / 图片序列

---

## 13. 常见坑：开发时容易踩的地方

### 1. 直接操作渲染对象

如果在组件中直接访问 `Graphics`、`Container` 或 `AnimatedSprite`，后续添加真实项目状态时会非常难维护。

### 2. 忘记清理异步状态

`SpriteCharacterRenderer` 中使用了 `loadToken`，目的是避免异步资源回调覆盖后续状态。

这类设计在复杂项目里很重要，否则会出现：

- 角色切换后旧资源回填
- 动画帧错乱
- 事件回调执行顺序错误

### 3. 角色根点不统一

所有角色都以脚底为参考点，这是项目的约定。不要把人物根点放在中间或者头顶，否则切换动作时会出现上下浮动和位移错误。

### 4. 不为回退设计

任何 PNG 图集或新模型加载都可能失败。开发时必须保留 Rig fallback，不然一旦资源不存在，画面会直接空掉。

---

## 14. 调试建议

### 最推荐的调试顺序

1. 先看 `src/engine/types.ts`：确认动作和表情 ID 是否正确
2. 再看 `src/stores/editor.ts`：确认状态是否更新
3. 再看 `src/engine/PixelScene.ts`：确认场景收到状态并执行
4. 再看 `src/characters/core/CharacterController.ts`：确认角色模式切换
5. 最后看 `RigCharacterRenderer` / `SpriteCharacterRenderer`：确认姿态和帧真实渲染

用这个顺序排查问题，往往比直接看 Pixi 画布更有效。

---

## 15. 结论

这个项目的真正价值不在于“有几个面板”，而在于它把一个角色动画编辑器的关键思路用可扩展结构搭出来了：

- 状态驱动 UI
- 时间轴驱动动作
- Rig / Sprite 双渲染接口
- 层级化场景管理
- 资源与逻辑分离

如果你继续往下做，最关键的工作不是新增更多组件，而是把“状态”、 “时间轴”、 “渲染器”、 “项目数据”统一成稳定的工程结构。

这也是这个项目最值得保留的地方。
