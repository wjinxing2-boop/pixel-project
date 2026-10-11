import { Assets, Container, Graphics, Sprite, type Texture } from 'pixi.js'

export interface PixelCell {
  x: number
  y: number
  color: number
}

export interface TexturePartOptions {
  id: string
  src: string // A separate SVG or PNG file. Do not pass one monolithic whole-character SVG.
  pivotX: number
  pivotY: number
  scale?: number
}

/** Create a code-drawn part from logical pixel cells. Each cell is an integer grid coordinate. */
export function createPixelGridPart(
  id: string,
  cells: PixelCell[],
  cellSize = 4,
) {
  const pivot = new Container()
  pivot.label = id
  const graphics = new Graphics()
  for (const cell of cells) {
    graphics.rect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize).fill({ color: cell.color })
  }
  pivot.addChild(graphics)
  return pivot
}

/**
 * Load one independent SVG/PNG body part and place its chosen joint at local origin.
 * The returned Container can be positioned/rotated around the part's joint by the rig.
 * SVG internals remain a single texture; keep eyes/mouth/arms in separate files if they
 * need independent runtime control.
 */
export async function createTexturePivotPart(options: TexturePartOptions): Promise<Container> {
  const texture = await Assets.load<Texture>(options.src)
  const pivot = new Container()
  pivot.label = options.id
  const sprite = new Sprite(texture)
  sprite.label = `${options.id}:texture`
  sprite.position.set(-options.pivotX, -options.pivotY)
  sprite.scale.set(options.scale ?? 1)
  pivot.addChild(sprite)
  return pivot
}
