import { Container, Graphics, Text } from 'pixi.js'
import type { EffectId } from '@/engine/types'

interface LiveEffect {
  root: Container
  type: EffectId
  startMs: number
  durationMs: number
  startX: number
  startY: number
}

function block(g: Graphics, x: number, y: number, width: number, height: number, color: number) {
  g.rect(x, y, width, height).fill({ color })
}

function pixelText(value: string, color: number, fontSize: number) {
  const text = new Text({
    text: value,
    style: { fontFamily: 'monospace', fontSize, fontWeight: 'bold', fill: color },
  })
  text.anchor.set(0.5)
  return text
}

/** Timeline-time-driven reusable effects; effect visuals are kept outside character bodies. */
export class EffectManager {
  readonly root = new Container()
  private effects: LiveEffect[] = []

  constructor() {
    this.root.label = 'EffectLayer'
  }

  trigger(type: EffectId, startMs: number, x = 180, y = 332) {
    const root = new Container()
    root.label = `Effect:${type}`
    const durationMs = type === 'glitch' ? 280 : type === 'shock' ? 720 : 1000

    if (type === 'reward') {
      const colors = [0xffd75d, 0xffee9c, 0xf4a340, 0xffffff]
      for (let i = 0; i < 14; i += 1) {
        const particle = new Graphics()
        const size = i % 3 === 0 ? 6 : 4
        block(particle, 0, 0, size, size, colors[i % colors.length])
        particle.position.set(((i * 29) % 86) - 43, -((i * 23) % 54))
        root.addChild(particle)
      }
      root.position.set(x, y)
    } else if (type === 'shock') {
      const symbol = pixelText('!', 0xffd75d, 52)
      symbol.position.set(0, 0)
      root.addChild(symbol)
      const outline = new Graphics()
      block(outline, -21, -30, 42, 4, 0x51435e)
      block(outline, -21, 27, 42, 4, 0x51435e)
      root.addChild(outline)
      root.position.set(x, y - 14)
    } else if (type === 'angry') {
      const marks = new Graphics()
      const red = 0xf16b70
      block(marks, -32, -12, 8, 8, red)
      block(marks, -24, -20, 8, 8, red)
      block(marks, -16, -12, 8, 8, red)
      block(marks, 12, -12, 8, 8, red)
      block(marks, 20, -20, 8, 8, red)
      block(marks, 28, -12, 8, 8, red)
      root.addChild(marks)
      root.position.set(x, y)
    } else if (type === 'heart') {
      const heart = new Graphics()
      const red = 0xf17d95
      block(heart, -16, -16, 12, 8, red)
      block(heart, 4, -16, 12, 8, red)
      block(heart, -24, -8, 48, 8, red)
      block(heart, -16, 0, 32, 8, red)
      block(heart, -8, 8, 16, 8, red)
      block(heart, -4, 16, 8, 4, red)
      root.addChild(heart)
      root.position.set(x, y)
    } else {
      const glitch = new Graphics()
      block(glitch, -180, -125, 360, 18, 0x8ef7e4)
      block(glitch, -140, -54, 280, 12, 0xf17d95)
      block(glitch, -180, 32, 360, 16, 0xfdf3ab)
      glitch.alpha = 0.85
      root.addChild(glitch)
      root.position.set(180, 320)
    }

    this.root.addChild(root)
    this.effects.push({ root, type, startMs, durationMs, startX: root.x, startY: root.y })
    // A safety cap prevents an abandoned preview session from keeping an unbounded effect list.
    while (this.effects.length > 60) {
      const stale = this.effects.shift()
      if (stale) {
        this.root.removeChild(stale.root)
        stale.root.destroy({ children: true })
      }
    }
  }

  seek(timeMs: number) {
    for (const effect of this.effects) {
      const elapsed = timeMs - effect.startMs
      const progress = Math.max(0, Math.min(1, elapsed / effect.durationMs))
      effect.root.visible = elapsed >= 0 && elapsed <= effect.durationMs
      effect.root.alpha = 1 - progress
      if (effect.type === 'glitch') {
        effect.root.x = effect.startX + Math.sin(Math.max(0, elapsed) / 13) * 8
      } else {
        effect.root.y = effect.startY - progress * 48
        effect.root.x = effect.startX + Math.sin(Math.max(0, elapsed) / 70) * 2
        effect.root.scale.set(1 + progress * 0.16)
      }
    }
  }

  clear() {
    for (const effect of this.effects) {
      this.root.removeChild(effect.root)
      effect.root.destroy({ children: true })
    }
    this.effects = []
  }

  destroy() {
    this.clear()
    this.root.removeFromParent()
    this.root.destroy({ children: false })
  }
}
