import { Assets } from 'pixi.js'

/**
 * Load an image or a PixiJS-compatible spritesheet.
 * Keep resource loading here rather than inside Vue components.
 * A spritesheet JSON file should reference a nearby PNG atlas.
 */
export async function loadTexture(url: string) {
  return Assets.load(url)
}

export async function loadSpritesheet<T = unknown>(url: string): Promise<T> {
  return Assets.load<T>(url)
}

/**
 * Optional: preload a list of project resources in parallel.
 * Asset aliases can be introduced later when the asset library grows.
 */
export async function preloadAssets(urls: string[]) {
  return Promise.all(urls.map((url) => Assets.load(url)))
}
