import { Assets } from 'pixi.js'

/** Thin project-level entry point for explicit preloading. PixiJS caches loaded resources. */
export class ResourceManager {
  async preload(urls: string[]) {
    if (!urls.length) return
    await Assets.load(urls)
  }
}
