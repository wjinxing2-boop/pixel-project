<script setup lang="ts">
import { CHARACTER_OPTIONS, ACTION_OPTIONS } from '@/engine/types'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
</script>

<template>
  <aside class="side-panel assets-panel">
    <div class="panel-heading">
      <div>
        <div class="eyebrow">LIBRARY</div>
        <h2>素材库</h2>
      </div>
      <button class="icon-button" type="button" aria-label="添加素材" title="后续接入素材导入">＋</button>
    </div>

    <section class="asset-section">
      <div class="section-title-row">
        <h3>角色</h3>
        <span class="count-pill">{{ CHARACTER_OPTIONS.length }}</span>
      </div>
      <button
        v-for="character in CHARACTER_OPTIONS"
        :key="character.id"
        type="button"
        class="character-card"
        :class="{ active: store.selectedCharacter === character.id }"
        @click="store.selectedCharacter = character.id"
      >
        <span class="character-thumb" :style="{ '--character-accent': character.accent }">
          <span class="thumb-hair"></span>
          <span class="thumb-face"><i></i><i></i><b></b></span>
          <span class="thumb-body"></span>
          <span class="thumb-leg left"></span><span class="thumb-leg right"></span>
        </span>
        <span class="character-card-copy">
          <strong>{{ character.name }}</strong>
          <small>{{ character.description }}</small>
        </span>
        <span v-if="store.selectedCharacter === character.id" class="selected-check">✓</span>
      </button>
    </section>

    <section class="asset-section action-library">
      <div class="section-title-row">
        <h3>动作预设</h3>
        <span class="count-pill">{{ ACTION_OPTIONS.length }}</span>
      </div>
      <div class="action-grid">
        <button
          v-for="item in ACTION_OPTIONS"
          :key="item.id"
          type="button"
          class="action-tile"
          :class="{ active: store.action === item.id }"
          @click="store.action = item.id"
        >
          <span class="action-glyph">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </section>

    <div class="library-tip">
      <span class="tip-icon">✳</span>
      <div>
        <strong>素材工作流</strong>
        <p>基础动作由可拆分的 PixiJS 部件驱动；“崩溃倒地”演示从 PNG 精灵图集播放。</p>
      </div>
    </div>
  </aside>
</template>
