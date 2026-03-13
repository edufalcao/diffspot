<script setup lang="ts">
import type { DiffResult, ChangeGroup } from '@diffspot/core';
import DiffSplitView from './DiffSplitView.vue';
import DiffUnifiedView from './DiffUnifiedView.vue';

defineProps<{
  result: DiffResult,
  viewMode: 'split' | 'unified',
  isFullscreen?: boolean,
  currentChangeIndex?: number,
  changeGroups?: ChangeGroup[],
  scrollRatio?: number,
  viewportRatio?: number
}>();

const emit = defineEmits<{
  'scroll-container-ready': [el: HTMLElement | null]
}>();

function onChildScrollContainerReady(el: HTMLElement | null) {
  emit('scroll-container-ready', el);
}
</script>

<template>
  <div
    role="region"
    aria-label="Diff output"
    :class="isFullscreen ? 'flex-1 min-h-0 flex flex-col' : ''"
  >
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-300 ease-[var(--ease)]"
      enter-from-class="opacity-0 translate-y-2 scale-[0.99]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-[var(--ease)]"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-[0.99]"
    >
      <DiffSplitView
        v-if="viewMode === 'split'"
        :key="'split'"
        :lines="result.lines"
        :is-fullscreen="isFullscreen"
        :current-change-index="currentChangeIndex"
        :change-groups="changeGroups"
        :scroll-ratio="scrollRatio"
        :viewport-ratio="viewportRatio"
        @scroll-container-ready="onChildScrollContainerReady"
      />
      <DiffUnifiedView
        v-else
        :key="'unified'"
        :lines="result.lines"
        :is-fullscreen="isFullscreen"
        :current-change-index="currentChangeIndex"
        :change-groups="changeGroups"
        :scroll-ratio="scrollRatio"
        :viewport-ratio="viewportRatio"
        @scroll-container-ready="onChildScrollContainerReady"
      />
    </Transition>
  </div>
</template>
