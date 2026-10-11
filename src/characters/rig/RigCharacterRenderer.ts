import { Container, Graphics } from 'pixi.js'
import type { ActionId, CharacterId, ExpressionId } from '@/engine/types'
import { CHARACTER_SPECS, type CharacterSpec } from '../core/CharacterSpec'

function block(g: Graphics, x: number, y: number, width: number, height: number, color: number) {
  g.rect(x, y, width, height).fill({ color })
}

function clearContainer(container: Container) {
  for (const child of container.removeChildren()) {
    child.destroy({ children: true })
  }
}

/**
 * A code-driven pixel character made from independently transformable PixiJS parts.
 * Coordinate convention: the root origin is the character's foot baseline.
 * All blocks are laid out on a 4-unit logical pixel grid.
 */
export class RigCharacterRenderer {
  readonly root = new Container()

  private motionRoot = new Container()
  private legsLayer = new Container()
  private leftLegPivot = new Container()
  private rightLegPivot = new Container()
  private bodyPivot = new Container()
  private leftArmPivot = new Container()
  private rightArmPivot = new Container()
  private headPivot = new Container()
  private faceGraphics = new Graphics()
  private hairBackGraphics = new Graphics()
  private hairFrontGraphics = new Graphics()
  private eyesGraphics = new Graphics()
  private browsGraphics = new Graphics()
  private mouthGraphics = new Graphics()
  private cheekGraphics = new Graphics()
  private coffeeLayer = new Container()
  private spec: CharacterSpec
  private action: ActionId = 'idle'
  private expression: ExpressionId = 'neutral'

  constructor(characterId: CharacterId) {
    this.spec = CHARACTER_SPECS[characterId]
    this.root.label = 'CharacterRigRoot'
    this.motionRoot.label = 'CharacterMotionRoot'
    this.buildRig()
    this.drawExpression()
  }

  setCharacter(characterId: CharacterId) {
    if (this.spec.id === characterId) return
    this.spec = CHARACTER_SPECS[characterId]
    clearContainer(this.root)
    this.motionRoot = new Container()
    this.legsLayer = new Container()
    this.leftLegPivot = new Container()
    this.rightLegPivot = new Container()
    this.bodyPivot = new Container()
    this.leftArmPivot = new Container()
    this.rightArmPivot = new Container()
    this.headPivot = new Container()
    this.faceGraphics = new Graphics()
    this.hairBackGraphics = new Graphics()
    this.hairFrontGraphics = new Graphics()
    this.eyesGraphics = new Graphics()
    this.browsGraphics = new Graphics()
    this.mouthGraphics = new Graphics()
    this.cheekGraphics = new Graphics()
    this.coffeeLayer = new Container()
    this.buildRig()
    this.drawExpression()
    this.seek(0)
  }

  setAction(action: ActionId) {
    this.action = action
  }

  setExpression(expression: ExpressionId) {
    this.expression = expression
    this.drawExpression()
  }

  /** Apply a deterministic pose using elapsed milliseconds within the current action. */
  seek(actionElapsedMs: number) {
    const t = Math.max(0, actionElapsedMs)
    const wave = Math.sin(t / 90)

    this.motionRoot.x = 0
    this.motionRoot.y = 0
    this.motionRoot.rotation = 0
    this.motionRoot.scale.set(1, 1)

    this.bodyPivot.y = -84
    this.bodyPivot.rotation = 0
    this.headPivot.rotation = 0
    this.leftArmPivot.rotation = 0.04
    this.rightArmPivot.rotation = -0.04
    this.leftLegPivot.rotation = 0
    this.rightLegPivot.rotation = 0

    switch (this.action) {
      case 'idle':
        this.bodyPivot.y = -84 - Math.abs(Math.sin(t / 330)) * 1.5
        this.headPivot.rotation = Math.sin(t / 550) * 0.025
        break
      case 'talk':
        this.bodyPivot.y = -84 - Math.abs(wave) * 1.8
        this.headPivot.rotation = Math.sin(t / 190) * 0.035
        break
      case 'walk':
        this.motionRoot.x = Math.sin(t / 115) * 2
        this.bodyPivot.y = -84 - Math.abs(Math.sin(t / 115)) * 2
        this.leftLegPivot.rotation = Math.sin(t / 115) * 0.48
        this.rightLegPivot.rotation = -Math.sin(t / 115) * 0.48
        this.leftArmPivot.rotation = -Math.sin(t / 115) * 0.32
        this.rightArmPivot.rotation = Math.sin(t / 115) * 0.32
        break
      case 'raise-hand':
        this.rightArmPivot.rotation = -1.28
        this.leftArmPivot.rotation = 0.12
        this.bodyPivot.rotation = -0.025
        break
      case 'shock':
        this.motionRoot.x = Math.sin(t / 22) * 2.3
        this.bodyPivot.y = -84 - Math.abs(Math.sin(t / 48)) * 2
        this.headPivot.rotation = Math.sin(t / 33) * 0.06
        this.leftArmPivot.rotation = 0.55
        this.rightArmPivot.rotation = -0.55
        break
      case 'angry':
        this.motionRoot.x = Math.sin(t / 30) * 1.6
        this.bodyPivot.rotation = Math.sin(t / 35) * 0.025
        this.leftArmPivot.rotation = 0.24 + Math.sin(t / 50) * 0.09
        this.rightArmPivot.rotation = -0.24 - Math.sin(t / 50) * 0.09
        break
      case 'laugh':
        this.bodyPivot.y = -84 - Math.abs(Math.sin(t / 95)) * 4
        this.bodyPivot.rotation = Math.sin(t / 105) * 0.045
        this.headPivot.rotation = Math.sin(t / 85) * 0.1
        this.leftArmPivot.rotation = 0.45
        this.rightArmPivot.rotation = -0.45
        break
      case 'collapse':
        // Fallback pose used if the PNG clip is missing or still loading.
        this.bodyPivot.y = -67
        this.bodyPivot.rotation = 0.72
        this.headPivot.rotation = 0.2
        this.leftArmPivot.rotation = 0.75
        this.rightArmPivot.rotation = -0.2
        this.leftLegPivot.rotation = -0.35
        this.rightLegPivot.rotation = 0.18
        break
      case 'dance':
        this.motionRoot.x = Math.sin(t / 115) * 3
        this.bodyPivot.rotation = Math.sin(t / 120) * 0.15
        this.headPivot.rotation = -Math.sin(t / 120) * 0.09
        this.leftArmPivot.rotation = Math.sin(t / 120) * 0.9 + 0.2
        this.rightArmPivot.rotation = -Math.sin(t / 120) * 0.9 - 0.2
        this.leftLegPivot.rotation = Math.sin(t / 120) * 0.18
        this.rightLegPivot.rotation = -Math.sin(t / 120) * 0.18
        break
    }

    // While speaking/laughing the mouth can animate without replacing the whole face.
    this.drawMouth(this.action === 'talk' && Math.sin(t / 75) > 0.35 || this.action === 'laugh' && Math.sin(t / 80) > 0)
  }

  private buildRig() {
    const p = this.spec.palette
    this.root.addChild(this.motionRoot)

    const shadow = new Graphics()
    block(shadow, -34, -2, 68, 6, 0x625c72)
    block(shadow, -22, -4, 44, 2, 0x82788a)
    shadow.alpha = 0.62
    this.motionRoot.addChild(shadow)

    // Legs are separate pivots, so walking does not require redrawing the whole character.
    this.legsLayer.label = 'LegsLayer'
    this.leftLegPivot.label = 'LeftLegPivot'
    this.rightLegPivot.label = 'RightLegPivot'
    this.leftLegPivot.position.set(-10, -62)
    this.rightLegPivot.position.set(10, -62)
    this.leftLegPivot.addChild(this.makeLeg(false))
    this.rightLegPivot.addChild(this.makeLeg(true))
    this.legsLayer.addChild(this.leftLegPivot, this.rightLegPivot)
    this.motionRoot.addChild(this.legsLayer)

    this.bodyPivot.label = 'BodyPivot'
    this.bodyPivot.position.set(0, -84)

    // Arms are behind the torso, each rotating around its shoulder.
    this.leftArmPivot.label = 'LeftArmPivot'
    this.rightArmPivot.label = 'RightArmPivot'
    this.leftArmPivot.position.set(-17, -18)
    this.rightArmPivot.position.set(17, -18)
    this.leftArmPivot.addChild(this.makeArm('left'))
    this.rightArmPivot.addChild(this.makeArm('right'))
    this.bodyPivot.addChild(this.leftArmPivot, this.rightArmPivot)

    const torso = new Graphics()
    block(torso, -22, -23, 44, 42, p.outline)
    block(torso, -18, -20, 36, 35, p.shirt)
    block(torso, -18, 7, 36, 8, p.shirtShade)
    block(torso, -22, -18, 4, 27, p.outline)
    block(torso, 18, -18, 4, 27, p.outline)
    block(torso, -6, -24, 12, 8, p.skin)

    // Role-specific shirt details are painted into the torso part.
    if (this.spec.hasTie) {
      block(torso, -8, -17, 16, 5, 0xf3ead4)
      block(torso, -4, -13, 8, 21, p.accent)
      block(torso, -4, 8, 4, 4, p.outline)
    } else {
      block(torso, -4, -16, 8, 18, p.accent)
      block(torso, -10, -9, 4, 4, 0xf1dfa5)
    }
    this.bodyPivot.addChild(torso)

    // Head is a sub-rig: hair, face, eyes, eyebrows and mouth remain independently replaceable.
    this.headPivot.label = 'HeadPivot'
    this.headPivot.position.set(0, -26)
    block(this.hairBackGraphics, -22, -26, 44, 16, p.hair)
    block(this.faceGraphics, -18, -22, 36, 31, p.outline)
    block(this.faceGraphics, -14, -20, 28, 27, p.skin)
    block(this.hairFrontGraphics, -22, -26, 44, 8, p.hair)

    if (this.spec.silhouette === 'messy') {
      block(this.hairFrontGraphics, -18, -30, 12, 8, p.hair)
      block(this.hairFrontGraphics, -4, -34, 12, 12, p.hair)
      block(this.hairFrontGraphics, 10, -30, 12, 8, p.hair)
      block(this.hairFrontGraphics, -22, -18, 7, 14, p.hair)
    } else if (this.spec.silhouette === 'tuft') {
      block(this.hairFrontGraphics, -16, -34, 12, 12, p.hair)
      block(this.hairFrontGraphics, -4, -40, 12, 18, p.hair)
      block(this.hairFrontGraphics, 8, -32, 12, 10, p.hair)
    } else {
      block(this.hairFrontGraphics, -18, -30, 28, 8, p.hair)
      block(this.hairFrontGraphics, 4, -34, 18, 8, p.hair)
      block(this.hairFrontGraphics, 14, -26, 8, 8, p.hair)
    }

    this.headPivot.addChild(
      this.hairBackGraphics,
      this.faceGraphics,
      this.hairFrontGraphics,
      this.eyesGraphics,
      this.browsGraphics,
      this.mouthGraphics,
      this.cheekGraphics,
    )

    this.bodyPivot.addChild(this.headPivot)
    this.motionRoot.addChild(this.bodyPivot)

    if (this.spec.hasCoffee) {
      this.coffeeLayer.label = 'CoffeeProp'
      const cup = new Graphics()
      block(cup, -8, 14, 12, 14, 0xf4e8cf)
      block(cup, -10, 12, 16, 4, 0xb58b73)
      block(cup, 4, 17, 5, 6, 0xf4e8cf)
      block(cup, -6, 20, 8, 3, 0x9b6d5b)
      this.coffeeLayer.addChild(cup)
      this.leftArmPivot.addChild(this.coffeeLayer)
    }

    this.leftArmPivot.zIndex = 0
    this.rightArmPivot.zIndex = 2
    this.bodyPivot.sortableChildren = true
    this.drawExpression()
  }

  private makeLeg(right: boolean) {
    const p = this.spec.palette
    const g = new Graphics()
    block(g, -7, 0, 14, 38, p.outline)
    block(g, -5, 2, 10, 34, p.pants)
    block(g, -5, 27, 10, 5, p.shirtShade)
    block(g, -12, 36, 20, 12, p.outline)
    block(g, -10, 38, 16, 8, p.shoes)
    block(g, right ? -7 : -9, 38, 5, 3, 0x8c8b9a)
    return g
  }

  private makeArm(side: 'left' | 'right') {
    const p = this.spec.palette
    const g = new Graphics()
    block(g, -7, 0, 14, 21, p.outline)
    block(g, -5, 2, 10, 17, p.shirt)
    block(g, -5, 17, 10, 11, p.skin)
    block(g, -4, 25, 8, 6, p.skin)
    if (side === 'left') block(g, -5, 19, 3, 5, 0xd9a27f)
    else block(g, 2, 19, 3, 5, 0xd9a27f)
    return g
  }

  private drawExpression() {
    const p = this.spec.palette
    this.eyesGraphics.clear()
    this.browsGraphics.clear()
    this.cheekGraphics.clear()

    const eyeY = this.expression === 'shocked' ? -13 : -11
    const eyeH = this.expression === 'shocked' ? 8 : this.expression === 'tired' ? 3 : 5
    block(this.eyesGraphics, -12, eyeY, 6, eyeH, p.outline)
    block(this.eyesGraphics, 6, eyeY, 6, eyeH, p.outline)
    if (this.expression !== 'tired') {
      block(this.eyesGraphics, -10, eyeY + 1, 2, Math.max(2, eyeH - 2), 0xffffff)
      block(this.eyesGraphics, 8, eyeY + 1, 2, Math.max(2, eyeH - 2), 0xffffff)
    }

    if (this.expression === 'angry' || (this.spec.id === 'boss' && this.expression === 'neutral')) {
      block(this.browsGraphics, -14, -17, 8, 3, p.hair)
      block(this.browsGraphics, -7, -15, 5, 3, p.hair)
      block(this.browsGraphics, 6, -15, 5, 3, p.hair)
      block(this.browsGraphics, 10, -17, 8, 3, p.hair)
    } else if (this.expression === 'shocked') {
      block(this.browsGraphics, -13, -20, 7, 3, p.hair)
      block(this.browsGraphics, 6, -20, 7, 3, p.hair)
    } else {
      block(this.browsGraphics, -13, -16, 7, 2, p.hair)
      block(this.browsGraphics, 6, -16, 7, 2, p.hair)
    }

    if (this.expression === 'embarrassed') {
      block(this.cheekGraphics, -17, -1, 6, 3, 0xe9828a)
      block(this.cheekGraphics, 11, -1, 6, 3, 0xe9828a)
      block(this.cheekGraphics, 17, -18, 3, 7, 0x7eb8ca)
      block(this.cheekGraphics, 20, -15, 3, 3, 0x7eb8ca)
    } else if (this.expression === 'tired') {
      block(this.cheekGraphics, -13, -5, 7, 3, 0x8d7180)
      block(this.cheekGraphics, 6, -5, 7, 3, 0x8d7180)
    }

    this.drawMouth(false)
  }

  private drawMouth(open: boolean) {
    const p = this.spec.palette
    this.mouthGraphics.clear()
    if (this.expression === 'happy' || this.action === 'laugh') {
      block(this.mouthGraphics, -6, 2, 12, 3, p.mouth)
      block(this.mouthGraphics, -3, 5, 6, 3, p.mouth)
    } else if (this.expression === 'shocked' || this.action === 'shock' || open) {
      block(this.mouthGraphics, -4, 1, 8, 7, p.mouth)
      block(this.mouthGraphics, -6, 0, 12, 3, p.mouth)
      block(this.mouthGraphics, -2, 5, 4, 2, 0xf1b8a7)
    } else if (this.expression === 'angry' || this.action === 'angry') {
      block(this.mouthGraphics, -7, 2, 14, 3, p.mouth)
      block(this.mouthGraphics, -4, 0, 8, 3, p.mouth)
    } else {
      block(this.mouthGraphics, -6, 3, 12, 3, p.mouth)
    }
  }
}
