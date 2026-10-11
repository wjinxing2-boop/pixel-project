<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AssetsPanel from '@/components/panels/AssetsPanel.vue'
import InspectorPanel from '@/components/panels/InspectorPanel.vue'
import TimelinePanel from '@/components/panels/TimelinePanel.vue'
import PixiStage from '@/components/stage/PixiStage.vue'
import { useEditorStore } from '@/stores/editor'

// 这个文件相当于“编辑器总布局”。
// 它不处理角色动画细节，而是把当前选择的角色、表情、背景、时间轴等状态
// 统一传给 PixiStage 和各个面板组件，让 UI 和渲染层分离。
const store = useEditorStore()
</script>

<template>
  <div class="editor-shell">
    <AppHeader />

    <div class="workspace-grid">
      <AssetsPanel />

      <main class="center-workspace">
        <div class="workspace-toolbar">
          <div class="breadcrumbs">
            <span>创作空间</span><i>/</i><strong>场景预览</strong>
          </div>
          <div class="workspace-toolbar-right">
            <span class="status-chip"><span></span> PIXI ENGINE READY</span>
            <span class="resolution-chip">9:16 · 360 × 640</span>
          </div>
        </div>

        <div class="stage-work-area">
          <div class="stage-side-note left-note">
            <span class="note-line"></span>
            <span>场景图层</span>
            <small>BACKGROUND</small>
          </div>

          <div class="preview-column">
            <div class="preview-meta-row">
              <span class="preview-meta-label"><span class="meta-dot"></span> 当前场景</span>
              <span class="preview-meta-value">{{ store.background === 'office' ? '办公室 · 白天' : store.background === 'night' ? '办公室 · 深夜' : '薄荷绿空间' }}</span>
            </div>
            <div class="preview-frame-shell">
              <PixiStage
                :character="store.selectedCharacter"
                :action="store.action"
                :expression="store.expression"
                :background="store.background"
                :playing="store.isPlaying"
                :playhead-ms="store.playheadMs"
                :effect-command="store.effectCommand"
                @timeupdate="store.setPlayhead"
                @statechange="(action, expression) => { store.action = action; store.expression = expression }"
              />
            </div>
            <div class="preview-footer">
              <span>DRAG &amp; COMPOSE <i>·</i> PIXEL ART</span>
              <span>画布预览不等于最终导出</span>
            </div>
          </div>

          <div class="stage-side-note right-note">
            <span class="note-line"></span>
            <span>角色对象</span>
            <small>{{ store.selectedCharacter.toUpperCase() }}</small>
          </div>
        </div>

        <TimelinePanel />
      </main>

      <InspectorPanel />
    </div>
  </div>
</template>
