<script setup lang="ts">
import {
  ACTION_OPTIONS,
  BACKGROUND_OPTIONS,
  EFFECT_OPTIONS,
  EXPRESSION_OPTIONS,
} from '@/engine/types'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
</script>

<template>
  <aside class="side-panel inspector-panel">
    <div class="panel-heading">
      <div>
        <div class="eyebrow">INSPECTOR</div>
        <h2>属性检查器</h2>
      </div>
      <span class="inspector-symbol">⌘</span>
    </div>

    <section class="inspector-section">
      <div class="inspector-section-heading">
        <span class="section-number">01</span>
        <h3>角色状态</h3>
      </div>
      <label class="field-label" for="action-select">当前动作</label>
      <select id="action-select" v-model="store.action" class="field-control">
        <option v-for="item in ACTION_OPTIONS" :key="item.id" :value="item.id">{{ item.label }}</option>
      </select>

      <label class="field-label" for="expression-select">表情</label>
      <select id="expression-select" v-model="store.expression" class="field-control">
        <option v-for="item in EXPRESSION_OPTIONS" :key="item.id" :value="item.id">{{ item.label }}</option>
      </select>

      <label class="field-label" for="background-select">背景场景</label>
      <select id="background-select" v-model="store.background" class="field-control">
        <option v-for="item in BACKGROUND_OPTIONS" :key="item.id" :value="item.id">{{ item.label }}</option>
      </select>
    </section>

    <section class="inspector-section effects-section">
      <div class="inspector-section-heading">
        <span class="section-number">02</span>
        <h3>快速特效</h3>
      </div>
      <p class="section-description">点击触发一次特效，可在预览中查看效果。</p>
      <button
        v-for="effect in EFFECT_OPTIONS"
        :key="effect.id"
        type="button"
        class="effect-row"
        @click="store.triggerEffect(effect.id)"
      >
        <span class="effect-icon" :class="`effect-icon-${effect.id}`">
          {{ { reward: '✦', shock: '!', angry: '⚡', heart: '♥', glitch: '▥' }[effect.id] }}
        </span>
        <span class="effect-copy">
          <strong>{{ effect.label }}</strong>
          <small>{{ effect.description }}</small>
        </span>
        <span class="effect-trigger">↗</span>
      </button>
    </section>

    <section class="inspector-section scene-note-section">
      <div class="inspector-section-heading">
        <span class="section-number">03</span>
        <h3>工程状态</h3>
      </div>
      <div class="inspector-meta"><span>画布尺寸</span><strong>360 × 640</strong></div>
      <div class="inspector-meta"><span>预览帧率</span><strong>实时渲染</strong></div>
      <div class="inspector-meta"><span>项目格式</span><strong>JSON（待接入）</strong></div>
    </section>
  </aside>
</template>
