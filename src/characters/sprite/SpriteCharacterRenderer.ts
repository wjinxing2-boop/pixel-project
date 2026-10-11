import {
  AnimatedSprite,
  Assets,
  Container,
  type Spritesheet,
  type Texture,
} from 'pixi.js'
import type { ActionId, CharacterId } from '@/engine/types'

interface LoadedClip {
  frames: Texture[]
  fps: number
  durationMs: number
}

/**
 * PNG/Spritesheet renderer. It uses manual frame seeking rather than an independent ticker,
 * so the same clip can be previewed or rendered at a specific timeline time.
 */
export class SpriteCharacterRenderer {
  readonly root = new Container()
  private sprite: AnimatedSprite | null = null
  private loadedClips = new Map<string, LoadedClip>()
  private currentKey = ''
  private currentDurationMs = 900
  private loadToken = 0

  constructor() {
    this.root.label = 'SpriteAnimationLayer'
    this.root.visible = false
  }

  async preload(characterId: CharacterId, action: ActionId) {
    await this.getClip(characterId, action)
  }

  async show(characterId: CharacterId, action: ActionId): Promise<boolean> {
    const token = ++this.loadToken
    let clip: LoadedClip
    try {
      clip = await this.getClip(characterId, action)
    } catch (error) {
      console.warn(`[SpriteCharacterRenderer] Could not load ${characterId}/${action}; using rig fallback.`, error)
      return false
    }
    if (token !== this.loadToken) return false

    const key = `${characterId}:${action}`
    if (this.currentKey !== key || !this.sprite) {
      if (this.sprite) {
        this.root.removeChild(this.sprite)
        this.sprite.destroy({ texture: false, textureSource: false })
      }
      this.sprite = new AnimatedSprite(clip.frames, false)
      this.sprite.label = `${characterId}-${action}-AnimatedSprite`
      this.sprite.anchor.set(0.5, 1)
      this.sprite.scale.set(2.15)
      this.sprite.animationSpeed = 1
      this.sprite.loop = false
      this.sprite.gotoAndStop(0)
      this.root.addChild(this.sprite)
      this.currentKey = key
      this.currentDurationMs = clip.durationMs
    }
    this.root.visible = true
    this.seek(0)
    return true
  }

  seek(actionElapsedMs: number) {
    if (!this.sprite) return
    const frameCount = this.sprite.totalFrames
    if (frameCount <= 1) {
      this.sprite.gotoAndStop(0)
      return
    }
    const progress = Math.min(1, Math.max(0, actionElapsedMs / this.currentDurationMs))
    const index = Math.min(frameCount - 1, Math.floor(progress * frameCount))
    this.sprite.gotoAndStop(index)
  }

  hide() {
    this.loadToken += 1
    this.root.visible = false
  }

  destroy() {
    this.loadToken += 1
    if (this.sprite) {
      this.root.removeChild(this.sprite)
      this.sprite.destroy({ texture: false, textureSource: false })
      this.sprite = null
    }
    this.root.destroy({ children: true })
    this.loadedClips.clear()
  }

  private async getClip(characterId: CharacterId, action: ActionId): Promise<LoadedClip> {
    const key = `${characterId}:${action}`
    const existing = this.loadedClips.get(key)
    if (existing) return existing

    const url = `/assets/characters/${characterId}/animations/${action}.json`
    const sheet = await Assets.load<Spritesheet>(url)
    const frames = sheet.animations[action]
    if (!frames?.length) throw new Error(`Spritesheet ${url} has no animation named "${action}"`)

    const clip: LoadedClip = { frames, fps: 8, durationMs: 900 }
    this.loadedClips.set(key, clip)
    return clip
  }
}
