# 架构说明

## 渲染栈

```text
Vue 3 editor UI
    │ props / Pinia / typed events
    ▼
PixiStage.vue  ── owns lifecycle only
    ▼
PixelScene
    ├── BackgroundLayer
    ├── CharacterLayer
    │     └── CharacterController
    │           ├── RigCharacterRenderer (Container/Graphics, independent pivots)
    │     └── PartFactory (pixel-grid parts or separate SVG/PNG part textures)
    │           └── SpriteCharacterRenderer (Assets/Spritesheet/AnimatedSprite)
    ├── EffectLayer (EffectManager)
    └── ForegroundLayer (speech bubble)

TimelineEngine resolves absolute timeline time into action/expression cues.
```

## Renderer contract

`CharacterController` is the façade. Code outside this class should not call `RigCharacterRenderer` or `SpriteCharacterRenderer` directly. This makes the current implementation replaceable without changing scene or timeline code.

- Rig actions: set per-part transforms in `RigCharacterRenderer.seek(actionElapsedMs)`.
- Sprite actions: load atlas once, cache textures, calculate a target frame from action elapsed time and call `gotoAndStop(frameIndex)`.
- Switching: `CharacterController.setAction('collapse')` attempts to activate the sprite clip. If loading fails, the rig's fallback collapse pose remains visible.
- Expressions: dynamic expressions apply to the rig. The example collapse spritesheet has its own baked face. A future cut-up spritesheet can add independent head/face layers if needed.

## Coordinate conventions

- Design canvas: 360 × 640 logical units.
- Character root origin: foot baseline.
- Rig part positions are local to parent containers.
- Sprite frames share a consistent canvas and foot anchor; the example atlas uses 128 × 80 frames and renders at a fixed scale.
- Pixel look: no antialiasing in the stage renderer, canvas `image-rendering: pixelated`, and integer-aligned shapes are preferred.

## Current limitations

This is an extensible starter, not a finished animator. The timeline is sample cue data, not yet an editable multi-track keyframe engine. The demo clip is fixed to 6 seconds; project duration and FPS are serializable but not yet used by a video encoder. The PNG collapse animation is a placeholder asset intended to demonstrate the renderer boundary.
