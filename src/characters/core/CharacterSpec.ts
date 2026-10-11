import type { CharacterId } from '@/engine/types'

export interface CharacterPalette {
  outline: number
  hair: number
  skin: number
  shirt: number
  shirtShade: number
  pants: number
  shoes: number
  accent: number
  eye: number
  mouth: number
}

export interface CharacterSpec {
  id: CharacterId
  name: string
  silhouette: 'messy' | 'tuft' | 'side-part'
  hasCoffee: boolean
  hasTie: boolean
  palette: CharacterPalette
}

export const CHARACTER_SPECS: Record<CharacterId, CharacterSpec> = {
  worker: {
    id: 'worker',
    name: '崩溃打工人',
    silhouette: 'messy',
    hasCoffee: true,
    hasTie: true,
    palette: {
      outline: 0x282534,
      hair: 0x302a42,
      skin: 0xf2c5a1,
      shirt: 0x587da7,
      shirtShade: 0x3e5d84,
      pants: 0x39445e,
      shoes: 0x25273b,
      accent: 0xe86e70,
      eye: 0x292634,
      mouth: 0x8b4d52,
    },
  },
  optimist: {
    id: 'optimist',
    name: '乐观气氛组',
    silhouette: 'tuft',
    hasCoffee: false,
    hasTie: false,
    palette: {
      outline: 0x2c3140,
      hair: 0xf2c653,
      skin: 0xf4c9a2,
      shirt: 0x7dac61,
      shirtShade: 0x56824c,
      pants: 0x537f75,
      shoes: 0x343a46,
      accent: 0xf3e18f,
      eye: 0x292634,
      mouth: 0x914e59,
    },
  },
  boss: {
    id: 'boss',
    name: '高压领导',
    silhouette: 'side-part',
    hasCoffee: false,
    hasTie: true,
    palette: {
      outline: 0x242737,
      hair: 0x626779,
      skin: 0xe9b48f,
      shirt: 0x30364f,
      shirtShade: 0x202638,
      pants: 0x282c43,
      shoes: 0x202333,
      accent: 0xe76e6c,
      eye: 0x242434,
      mouth: 0x83454e,
    },
  },
}
