# Character assets

Recommended convention:

```text
characters/<character-id>/
├── character.json
├── parts/                 # Optional per-part SVG/PNG or pixel-grid source
├── expressions/           # Optional eye/mouth/brow art
└── animations/
    ├── <action>.png       # Atlas image
    └── <action>.json      # PixiJS-compatible atlas with named animations
```

In this starter, each character includes a `collapse` spritesheet solely to demonstrate the programmatic-rig ↔ PNG-animation switch. Art may be replaced later, but keep frame dimensions, foot anchor, palette and scale consistent across actions.
