import { Application, Container, Graphics, Text, type Ticker } from 'pixi.js'
import type { ActionId, BackgroundId, CharacterId, EffectId, ExpressionId, TimelineCue } from './types'
import { DEFAULT_PROJECT_SETTINGS, DEMO_TIMELINE } from './types'
import { CharacterController } from '@/characters/core/CharacterController'
import { EffectManager } from '@/effects/EffectManager'
import { TimelineEngine } from '@/animation/TimelineEngine'

interface SceneCallbacks {
  onTimeUpdate?: (timeMs: number, durationMs: number) => void
  onStateChange?: (action: ActionId, expression: ExpressionId) => void
  onRendererModeChange?: (mode: 'rig' | 'sprite') => void
}

const WIDTH = DEFAULT_PROJECT_SETTINGS.width
const HEIGHT = DEFAULT_PROJECT_SETTINGS.height
const DURATION = DEFAULT_PROJECT_SETTINGS.durationMs

function block(g: Graphics, x: number, y: number, width: number, height: number, color: number) {
  g.rect(x, y, width, height).fill({ color })
}

function pixelText(value: string, x: number, y: number, fontSize: number, color: number) {
  const text = new Text({
    text: value,
    style: { fontFamily: 'monospace', fontSize, fontWeight: 'bold', fill: color, align: 'center' },
  })
  text.anchor.set(0.5)
  text.position.set(x, y)
  return text
}

/** Owns PixiJS and connects scene layers, the character controller and timeline. */
export class PixelScene {
  private app: Application | null = null
  private host: HTMLElement | null = null
  private backgroundLayer = new Container()
  private characterLayer = new Container()
  private foregroundLayer = new Container()
  private character: CharacterController | null = null
  private effects = new EffectManager()
  private timeline = new TimelineEngine(DEMO_TIMELINE, DURATION)
  private speechBubble = new Container()
  private characterId: CharacterId = 'worker'
  private action: ActionId = 'idle'
  private expression: ExpressionId = 'neutral'
  private background: BackgroundId = 'office'
  private isPlaying = false
  private destroyed = false
  private playheadMs = 0
  private activeCueIndex = -1
  private lastNotifyMs = 0
  private tickerHandler: ((ticker: Ticker) => void) | null = null
  private callbacks: SceneCallbacks

  constructor(callbacks: SceneCallbacks = {}) {
    this.callbacks = callbacks
  }

  async init(host: HTMLElement) {
    if (this.app) return
    this.destroyed = false
    this.host = host

    const app = new Application()
    await app.init({
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: 0x24263a,
      resolution: 1,
      autoDensity: false,
      antialias: false,
    })

    // Vue may unmount the component while Application.init() is awaiting WebGL setup.
    if (this.destroyed) {
      app.destroy({ removeView: true }, { children: true })
      return
    }

    this.app = app
    app.canvas.setAttribute('aria-label', '像素角色动画预览画布')
    app.canvas.style.imageRendering = 'pixelated'
    app.canvas.style.display = 'block'
    app.canvas.style.width = '100%'
    app.canvas.style.height = '100%'
    app.canvas.style.objectFit = 'contain'
    host.replaceChildren(app.canvas)

    this.character = new CharacterController(
      this.characterId,
      (mode) => this.callbacks.onRendererModeChange?.(mode),
    )
    this.character.setPosition(WIDTH / 2, 508)
    this.character.setScale(1)

    app.stage.addChild(
      this.backgroundLayer,
      this.characterLayer,
      this.effects.root,
      this.foregroundLayer,
    )
    this.characterLayer.addChild(this.character.root)
    this.foregroundLayer.addChild(this.speechBubble)

    this.drawBackground()
    this.drawSpeechBubble()
    // Preload the first complex action for all demo characters. Failure is non-fatal:
    // CharacterController retains a code-driven fallback pose if a sheet is missing.
    await this.character.preload()
    if (this.destroyed) return
    this.tickerHandler = (ticker) => this.tick(ticker.deltaMS)
    app.ticker.add(this.tickerHandler)
    this.applyStateAt(0, false, true)
  }

  setCharacter(value: CharacterId) {
    if (this.characterId === value) return
    this.characterId = value
    void this.character?.setCharacter(value, this.playheadMs)
    this.callbacks.onRendererModeChange?.(this.character?.getRendererMode() ?? 'rig')
  }

  setAction(value: ActionId) {
    if (this.action === value) return
    this.action = value
    this.character?.setAction(value, this.playheadMs)
    this.drawSpeechBubble()
    this.callbacks.onStateChange?.(this.action, this.expression)
    this.callbacks.onRendererModeChange?.(this.character?.getRendererMode() ?? 'rig')
  }

  setExpression(value: ExpressionId) {
    if (this.expression === value) return
    this.expression = value
    this.character?.setExpression(value)
    this.drawSpeechBubble()
    this.callbacks.onStateChange?.(this.action, this.expression)
  }

  setBackground(value: BackgroundId) {
    if (this.background === value) return
    this.background = value
    this.drawBackground()
  }

  setPlaying(value: boolean) {
    if (this.isPlaying === value) return
    this.isPlaying = value
    if (value) {
      this.playheadMs = 0
      this.effects.clear()
      this.activeCueIndex = -1
      this.applyStateAt(0, true, true)
    }
  }

  seek(timeMs: number) {
    this.playheadMs = this.timeline.normalizeTime(timeMs)
    this.applyStateAt(this.playheadMs, false, true)
    this.effects.clear()
    this.rebuildTimelineEffects(this.playheadMs)
    this.character?.seek(this.playheadMs)
    this.effects.seek(this.playheadMs)
    this.callbacks.onTimeUpdate?.(this.playheadMs, DURATION)
  }

  playEffect(type: EffectId) {
    this.effects.trigger(type, this.playheadMs, WIDTH / 2, 330)
    this.effects.seek(this.playheadMs)
  }

  destroy() {
    this.destroyed = true
    if (this.app && this.tickerHandler) this.app.ticker.remove(this.tickerHandler)
    this.character?.destroy()
    this.character = null
    this.effects.destroy()
    if (this.app) this.app.destroy({ removeView: true }, { children: true })
    this.app = null
    this.host?.replaceChildren()
    this.host = null
    this.tickerHandler = null
  }

  private tick(deltaMs: number) {
    if (!this.app || !this.character) return
    const previous = this.playheadMs

    if (this.isPlaying) {
      const nextRaw = previous + Math.min(deltaMs, 100)
      const next = nextRaw >= DURATION ? nextRaw % DURATION : nextRaw
      if (next < previous) {
        this.effects.clear()
        this.activeCueIndex = -1
      }
      this.playheadMs = next
      this.applyStateAt(next, true, false)
      if (next < previous) this.rebuildTimelineEffects(next)
      if (this.app.ticker.lastTime - this.lastNotifyMs > 45) {
        this.lastNotifyMs = this.app.ticker.lastTime
        this.callbacks.onTimeUpdate?.(this.playheadMs, DURATION)
      }
    }

    this.character.seek(this.playheadMs)
    this.effects.seek(this.playheadMs)
  }

  private applyStateAt(timeMs: number, triggerCueEffect: boolean, force: boolean) {
    const state = this.timeline.stateAt(timeMs)
    if (!force && state.index === this.activeCueIndex) return
    this.activeCueIndex = state.index
    const cue: TimelineCue = state.cue
    this.action = cue.action
    this.expression = cue.expression
    this.character?.setAction(cue.action, cue.at)
    this.character?.setExpression(cue.expression)
    this.drawSpeechBubble()
    this.callbacks.onStateChange?.(this.action, this.expression)
    this.callbacks.onRendererModeChange?.(this.character?.getRendererMode() ?? 'rig')
    if (triggerCueEffect && cue.effect) this.effects.trigger(cue.effect, cue.at, WIDTH / 2, 330)
  }

  private rebuildTimelineEffects(timeMs: number) {
    for (const cue of this.timeline.cues) {
      if (!cue.effect) continue
      if (timeMs >= cue.at && timeMs - cue.at <= 1000) {
        this.effects.trigger(cue.effect, cue.at, WIDTH / 2, 330)
      }
    }
  }

  private drawBackground() {
    for (const child of this.backgroundLayer.removeChildren()) child.destroy({ children: true })
    const g = new Graphics()
    const palettes: Record<BackgroundId, { wall: number; floor: number; window: number; accent: number; pane: number }> = {
      office: { wall: 0xc7d7df, floor: 0xb5a18c, window: 0x4a617e, accent: 0x8098ad, pane: 0x9ed5e2 },
      night: { wall: 0x30374f, floor: 0x50465d, window: 0x202a44, accent: 0x6f7da5, pane: 0x92cbd5 },
      mint: { wall: 0xc4e1d0, floor: 0x9bbda8, window: 0x6f998b, accent: 0x8ab4a7, pane: 0xd2f0df },
    }
    const p = palettes[this.background]
    block(g, 0, 0, WIDTH, HEIGHT, p.wall)
    block(g, 0, 0, WIDTH, 26, 0x31354b)
    block(g, 0, 494, WIDTH, 146, p.floor)
    block(g, 0, 494, WIDTH, 8, 0x756c7c)

    // Window and city blocks.
    block(g, 28, 58, 174, 154, 0xf4edce)
    block(g, 36, 66, 158, 138, p.window)
    block(g, 42, 75, 28, 52, p.pane)
    block(g, 79, 101, 28, 35, p.pane)
    block(g, 120, 80, 30, 66, p.pane)
    block(g, 159, 112, 24, 40, p.pane)
    block(g, 109, 66, 8, 138, 0xf4edce)
    block(g, 36, 132, 158, 8, 0xf4edce)
    block(g, 20, 208, 190, 9, 0x8791a5)

    block(g, 258, 68, 56, 56, 0x6f7185)
    block(g, 266, 76, 40, 40, 0xf6e8c7)
    block(g, 284, 82, 4, 15, 0x55536a)
    block(g, 284, 94, 12, 4, 0x55536a)
    block(g, 237, 164, 76, 58, 0x74788d)
    block(g, 245, 172, 60, 42, p.accent)
    block(g, 253, 180, 12, 12, 0xe9d4aa)
    block(g, 269, 188, 28, 18, 0x64778e)

    for (let y = 520; y < HEIGHT; y += 32) block(g, 0, y, WIDTH, 2, 0x8e837f)
    for (let x = 30; x < WIDTH; x += 60) block(g, x, 520, 2, 120, 0x9a8a80)

    // Plant and desk.
    block(g, 286, 434, 38, 38, 0x9a715d)
    block(g, 280, 428, 50, 8, 0x765c58)
    block(g, 296, 392, 8, 42, 0x65845f)
    block(g, 276, 396, 22, 18, 0x639b70)
    block(g, 300, 378, 24, 22, 0x4f8e68)
    block(g, 294, 408, 28, 16, 0x75aa7a)
    block(g, 16, 420, 104, 10, 0x6b5360)
    block(g, 23, 430, 90, 8, 0x927060)
    block(g, 28, 438, 8, 52, 0x6b5360)
    block(g, 99, 438, 8, 52, 0x6b5360)
    block(g, 47, 400, 30, 20, 0x6f8c9c)
    block(g, 51, 404, 22, 12, 0x9fd6d9)

    this.backgroundLayer.addChild(g)
  }

  private drawSpeechBubble() {
    for (const child of this.speechBubble.removeChildren()) child.destroy({ children: true })
    const bubble = new Graphics()
    block(bubble, -73, -20, 146, 38, 0x51465f)
    block(bubble, -69, -16, 138, 30, 0xffffff)
    block(bubble, -14, 18, 12, 8, 0xffffff)
    this.speechBubble.addChild(bubble)

    const line = this.action === 'talk'
      ? '我真的没事。'
      : this.action === 'collapse'
        ? '我先下线了…'
        : this.expression === 'shocked'
          ? '啊？什么？！'
          : this.expression === 'happy'
            ? '问题不大！'
            : this.expression === 'angry'
              ? '这也能怪我？'
              : '……'
    this.speechBubble.addChild(pixelText(line, 0, -1, 13, 0x39354b))
    this.speechBubble.position.set(WIDTH / 2, 318)
  }
}
