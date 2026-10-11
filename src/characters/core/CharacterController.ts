import { Container } from 'pixi.js'
import type { ActionId, CharacterId, ExpressionId, RendererMode } from '@/engine/types'
import { RigCharacterRenderer } from '../rig/RigCharacterRenderer'
import { SpriteCharacterRenderer } from '../sprite/SpriteCharacterRenderer'

/**
 * Public façade for one character. Scene/timeline code talks to this controller only;
 * it does not know whether a pose is rendered by independent rig parts or by a PNG clip.
 */
export class CharacterController {
  readonly root = new Container()
  readonly rigRenderer: RigCharacterRenderer
  readonly spriteRenderer: SpriteCharacterRenderer

  private characterId: CharacterId
  private action: ActionId = 'idle'
  private expression: ExpressionId = 'neutral'
  private actionStartMs = 0
  private mode: RendererMode = 'rig'
  private switchToken = 0
  private onRendererModeChange?: (mode: RendererMode) => void

  constructor(characterId: CharacterId, onRendererModeChange?: (mode: RendererMode) => void) {
    this.characterId = characterId
    this.onRendererModeChange = onRendererModeChange
    this.root.label = 'CharacterControllerRoot'
    this.rigRenderer = new RigCharacterRenderer(characterId)
    this.spriteRenderer = new SpriteCharacterRenderer()
    this.root.addChild(this.rigRenderer.root, this.spriteRenderer.root)
    this.rigRenderer.setExpression(this.expression)
    this.rigRenderer.setAction(this.action)
    this.rigRenderer.root.visible = true
  }

  async preload() {
    // The app remains usable when a sprite asset is missing; missing clips simply use the rig fallback.
    await this.spriteRenderer.preload(this.characterId, 'collapse').catch(() => undefined)
  }

  async setCharacter(characterId: CharacterId, nowMs = 0) {
    if (this.characterId === characterId) return
    this.characterId = characterId
    this.rigRenderer.setCharacter(characterId)
    this.rigRenderer.setExpression(this.expression)
    this.rigRenderer.setAction(this.action)

    if (this.action === 'collapse') {
      await this.activateSpriteAction(nowMs)
    } else {
      this.showRig()
    }
  }

  setAction(action: ActionId, nowMs = 0) {
    this.action = action
    this.actionStartMs = nowMs
    this.rigRenderer.setAction(action)

    if (action === 'collapse') {
      void this.activateSpriteAction(nowMs)
    } else {
      this.showRig()
    }
    this.seek(nowMs)
  }

  setExpression(expression: ExpressionId) {
    this.expression = expression
    this.rigRenderer.setExpression(expression)
  }

  setPosition(x: number, y: number) {
    this.root.position.set(x, y)
  }

  setScale(scale: number) {
    this.root.scale.set(scale)
  }

  getRendererMode(): RendererMode {
    return this.mode
  }

  getAction(): ActionId {
    return this.action
  }

  getExpression(): ExpressionId {
    return this.expression
  }

  /** Evaluate the character at an absolute project time in milliseconds. */
  seek(projectTimeMs: number) {
    const elapsed = Math.max(0, projectTimeMs - this.actionStartMs)
    this.rigRenderer.seek(elapsed)
    this.spriteRenderer.seek(elapsed)
  }

  destroy() {
    this.switchToken += 1
    this.root.removeFromParent()
    this.root.removeChild(this.rigRenderer.root)
    this.root.removeChild(this.spriteRenderer.root)
    this.rigRenderer.root.destroy({ children: true })
    this.spriteRenderer.destroy()
    this.root.destroy({ children: false })
  }

  private async activateSpriteAction(nowMs: number) {
    const token = ++this.switchToken
    this.rigRenderer.seek(Math.max(0, nowMs - this.actionStartMs))
    this.rigRenderer.root.visible = true // Keep a fallback pose visible while the clip loads.
    const success = await this.spriteRenderer.show(this.characterId, 'collapse')
    if (token !== this.switchToken || this.action !== 'collapse') return
    if (success) {
      this.mode = 'sprite'
      this.rigRenderer.root.visible = false
      this.spriteRenderer.root.visible = true
      this.spriteRenderer.seek(Math.max(0, nowMs - this.actionStartMs))
      this.onRendererModeChange?.(this.mode)
    } else {
      this.mode = 'rig'
      this.showRig()
    }
  }

  private showRig() {
    this.switchToken += 1
    this.mode = 'rig'
    this.rigRenderer.root.visible = true
    this.spriteRenderer.hide()
    this.onRendererModeChange?.(this.mode)
  }
}
